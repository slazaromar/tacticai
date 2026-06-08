const { consultar } = require('../config/baseDatos');

async function obtenerTodos(req, res, next) {
  try {
    const { estado, limite = 50, desplazamiento = 0 } = req.query;
    const parametros = [];
    let where = '';
    if (estado) { where = 'WHERE p.estado = $1'; parametros.push(estado); }
    parametros.push(parseInt(limite), parseInt(desplazamiento));

    const sql = `
      SELECT p.*,
             CASE WHEN p.estado = 'programado' AND p.fecha_partido < NOW()
                  THEN 'finalizado' ELSE p.estado END AS estado,
             json_build_object('id', el.id, 'nombre', el.nombre) AS equipo_local,
             json_build_object('id', ev.id, 'nombre', ev.nombre) AS equipo_visitante
      FROM partidos p
      LEFT JOIN equipos el ON el.id = p.equipo_local_id
      LEFT JOIN equipos ev ON ev.id = p.equipo_visitante_id
      ${where}
      ORDER BY p.fecha_partido ASC
      LIMIT $${parametros.length - 1} OFFSET $${parametros.length}
    `;

    const sqlConteo = `SELECT COUNT(*) FROM partidos p ${where}`;
    const parametrosConteo = estado ? [estado] : [];

    const [resDatos, resConteo] = await Promise.all([
      consultar(sql, parametros),
      consultar(sqlConteo, parametrosConteo),
    ]);
    res.json({ datos: resDatos.rows, total: parseInt(resConteo.rows[0].count) });
  } catch (err) { next(err); }
}

async function obtenerPorId(req, res, next) {
  try {
    const { rows } = await consultar(
      `SELECT p.*,
              CASE WHEN p.estado = 'programado' AND p.fecha_partido < NOW()
                   THEN 'finalizado' ELSE p.estado END AS estado,
              json_build_object('id', el.id, 'nombre', el.nombre, 'formacion', el.formacion) AS equipo_local,
              json_build_object('id', ev.id, 'nombre', ev.nombre, 'formacion', ev.formacion) AS equipo_visitante
       FROM partidos p
       LEFT JOIN equipos el ON el.id = p.equipo_local_id
       LEFT JOIN equipos ev ON ev.id = p.equipo_visitante_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Partido no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  try {
    const { equipo_local_id, equipo_visitante_id, fecha_partido, competicion, estadio } = req.body;
    const { rows } = await consultar(
      `INSERT INTO partidos (equipo_local_id, equipo_visitante_id, fecha_partido, competicion, estadio)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [equipo_local_id, equipo_visitante_id, fecha_partido, competicion || null, estadio || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  try {
    const { equipo_local_id, equipo_visitante_id, fecha_partido, competicion, estadio, estado } = req.body;
    const { rows } = await consultar(
      `UPDATE partidos SET equipo_local_id=$1, equipo_visitante_id=$2, fecha_partido=$3,
         competicion=$4, estadio=$5, estado=$6
       WHERE id=$7 RETURNING *`,
      [equipo_local_id, equipo_visitante_id, fecha_partido, competicion || null,
       estadio || null, estado || 'programado', req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Partido no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    const { rowCount } = await consultar(`DELETE FROM partidos WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ mensaje: 'Partido no encontrado' });
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
