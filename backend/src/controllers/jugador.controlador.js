const { consultar }     = require('../config/baseDatos');
const { obtenerRedis }  = require('../config/redis');

const TTL_CACHE = 60;

async function obtenerTodos(req, res, next) {
  try {
    const { posicion, equipoId, busqueda, rol, limite = 50, desplazamiento = 0 } = req.query;

    const condiciones = [];
    const parametros  = [];
    let   idx         = 1;

    if (posicion) { condiciones.push(`j.posicion = $${idx++}`);   parametros.push(posicion); }
    if (equipoId) { condiciones.push(`j.equipo_id = $${idx++}`);  parametros.push(equipoId); }
    if (rol)      { condiciones.push(`j.rol_equipo = $${idx++}`); parametros.push(rol); }
    if (busqueda) { condiciones.push(`j.nombre ILIKE $${idx++}`); parametros.push(`%${busqueda}%`); }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const consultaDatos = `
      SELECT j.*, e.nombre AS nombre_equipo
      FROM jugadores j
      LEFT JOIN equipos e ON e.id = j.equipo_id
      ${where}
      ORDER BY j.nombre
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    parametros.push(parseInt(limite), parseInt(desplazamiento));

    const consultaConteo = `SELECT COUNT(*) FROM jugadores j ${where}`;
    const parametrosConteo = parametros.slice(0, -2);

    const [resDatos, resConteo] = await Promise.all([
      consultar(consultaDatos, parametros),
      consultar(consultaConteo, parametrosConteo),
    ]);

    res.json({
      datos:           resDatos.rows,
      total:           parseInt(resConteo.rows[0].count),
      limite:          parseInt(limite),
      desplazamiento:  parseInt(desplazamiento),
    });
  } catch (err) { next(err); }
}

async function obtenerPorId(req, res, next) {
  try {
    const claveCache = `jugador:${req.params.id}`;
    const redis = obtenerRedis();
    const cacheado = await redis.get(claveCache);
    if (cacheado) return res.json(JSON.parse(cacheado));

    const { rows } = await consultar(
      `SELECT j.*, e.nombre AS nombre_equipo
       FROM jugadores j LEFT JOIN equipos e ON e.id = j.equipo_id
       WHERE j.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    await redis.setex(claveCache, TTL_CACHE, JSON.stringify(rows[0]));
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const {
      nombre, posicion, equipo_id, rol_equipo, edad, nacionalidad,
      contrato_hasta, puntuacion_forma, puntuacion_general,
    } = req.body;

    const { rows } = await consultar(
      `INSERT INTO jugadores
         (nombre, posicion, equipo_id, rol_equipo, edad, nacionalidad,
          contrato_hasta, puntuacion_forma, puntuacion_general)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [nombre, posicion, equipo_id || null, rol_equipo || 'rotacion', edad || null,
       nacionalidad || null, contrato_hasta || null, puntuacion_forma || null,
       puntuacion_general || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try {
    const {
      nombre, posicion, equipo_id, rol_equipo, edad, nacionalidad,
      contrato_hasta, puntuacion_forma, puntuacion_general,
      esta_lesionado, esta_sancionado,
    } = req.body;

    const { rows } = await consultar(
      `UPDATE jugadores
       SET nombre=$1, posicion=$2, equipo_id=$3, rol_equipo=$4, edad=$5,
           nacionalidad=$6, contrato_hasta=$7, puntuacion_forma=$8,
           puntuacion_general=$9, esta_lesionado=$10, esta_sancionado=$11
       WHERE id = $12
       RETURNING *`,
      [nombre, posicion, equipo_id || null, rol_equipo, edad || null, nacionalidad || null,
       contrato_hasta || null, puntuacion_forma || null, puntuacion_general || null,
       esta_lesionado ?? false, esta_sancionado ?? false, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    const redis = obtenerRedis();
    await redis.del(`jugador:${req.params.id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    const { rowCount } = await consultar(`DELETE FROM jugadores WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ mensaje: 'Jugador no encontrado' });
    const redis = obtenerRedis();
    await redis.del(`jugador:${req.params.id}`);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
