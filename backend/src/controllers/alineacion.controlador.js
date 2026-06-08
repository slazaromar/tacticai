const { consultar, obtenerCliente } = require('../config/baseDatos');
const { obtenerRedis }              = require('../config/redis');
const axios                          = require('axios');
const registrador                    = require('../config/registrador');

const URL_MOTOR  = process.env.MOTOR_RECOMENDACION_URL || 'http://localhost:8000';
const CLAVE_MOTOR = process.env.MOTOR_RECOMENDACION_API_KEY    || '';
const TTL_CACHE  = 5 * 60;

async function recomendar(req, res, next) {
  try {
    const { partidoId, equipoId, formacion } = req.body;

    const claveCache = `alineacion:recomendar:${partidoId}:${equipoId}:${formacion}`;
    const redis      = obtenerRedis();
    const cacheado   = await redis.get(claveCache);
    if (cacheado) return res.json(JSON.parse(cacheado));

    const { rows: jugadores } = await consultar(
      `SELECT j.*, e.formacion AS formacion_equipo
       FROM jugadores j
       LEFT JOIN equipos e ON e.id = j.equipo_id
       WHERE j.equipo_id = $1`,
      [equipoId]
    );

    if (jugadores.length === 0) {
      return res.status(400).json({ mensaje: 'No se han encontrado jugadores para este equipo' });
    }

    const { rows: partidoRows } = await consultar(
      `SELECT p.*,
              json_build_object('id', el.id, 'nombre', el.nombre) AS equipo_local,
              json_build_object('id', ev.id, 'nombre', ev.nombre) AS equipo_visitante
       FROM partidos p
       LEFT JOIN equipos el ON el.id = p.equipo_local_id
       LEFT JOIN equipos ev ON ev.id = p.equipo_visitante_id
       WHERE p.id = $1`,
      [partidoId]
    );
    const partido = partidoRows[0];

    const respuesta = await axios.post(
      `${URL_MOTOR}/api/v1/recomendar`,
      { jugadores, partido, formacion },
      { headers: { 'X-API-Key': CLAVE_MOTOR }, timeout: 30000 }
    );

    const alineacion = respuesta.data;

    await redis.setex(claveCache, TTL_CACHE, JSON.stringify(alineacion));
    res.json(alineacion);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.response?.status >= 500) {
      registrador.error('Motor de recomendación no disponible', err.message);
      return res.status(503).json({ mensaje: 'El motor de recomendación no está disponible' });
    }
    next(err);
  }
}

async function guardar(req, res, next) {
  try {
    const { partidoId, equipoId, formacion, esRecomendacion, jugadores } = req.body;
    const cliente = await obtenerCliente();

    try {
      await cliente.query('BEGIN');

      const resAlineacion = await cliente.query(
        `INSERT INTO alineaciones (partido_id, equipo_id, formacion, es_recomendacion, creado_por)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [partidoId, equipoId, formacion, esRecomendacion ?? false, req.usuario.id]
      );
      const alineacion = resAlineacion.rows[0];

      for (const j of jugadores) {
        await cliente.query(
          `INSERT INTO alineacion_jugadores
             (alineacion_id, jugador_id, posicion_alineacion, es_titular, puntuacion_recomendacion)
           VALUES ($1,$2,$3,$4,$5)`,
          [alineacion.id, j.id, j.posicion_alineacion || j.posicion,
           j.es_titular ?? true, j.puntuacion_recomendacion ?? null]
        );
      }

      await cliente.query('COMMIT');
      res.status(201).json(alineacion);
    } catch (err) {
      await cliente.query('ROLLBACK');
      throw err;
    } finally {
      cliente.release();
    }
  } catch (err) { next(err); }
}

async function obtenerPorPartido(req, res, next) {
  try {
    const { partidoId } = req.query;
    if (!partidoId) return res.status(400).json({ mensaje: 'El parámetro partidoId es obligatorio' });

    const { rows: alineaciones } = await consultar(
      `SELECT a.*, u.nombre_usuario AS creado_por_nombre
       FROM alineaciones a
       LEFT JOIN usuarios u ON u.id = a.creado_por
       WHERE a.partido_id = $1
       ORDER BY a.creado_en DESC`,
      [partidoId]
    );

    for (const alineacion of alineaciones) {
      const { rows: jugadores } = await consultar(
        `SELECT aj.*, j.nombre, j.posicion, j.puntuacion_forma, j.puntuacion_general,
                j.rol_equipo, j.esta_lesionado, j.esta_sancionado
         FROM alineacion_jugadores aj
         JOIN jugadores j ON j.id = aj.jugador_id
         WHERE aj.alineacion_id = $1
         ORDER BY aj.es_titular DESC, aj.puntuacion_recomendacion DESC`,
        [alineacion.id]
      );
      alineacion.jugadores = jugadores;
    }

    res.json({ datos: alineaciones, total: alineaciones.length });
  } catch (err) { next(err); }
}

async function obtenerPorId(req, res, next) {
  try {
    const { rows } = await consultar(`SELECT * FROM alineaciones WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Alineación no encontrada' });

    const { rows: jugadores } = await consultar(
      `SELECT aj.*, j.nombre, j.posicion, j.puntuacion_forma, j.puntuacion_general
       FROM alineacion_jugadores aj
       JOIN jugadores j ON j.id = aj.jugador_id
       WHERE aj.alineacion_id = $1`,
      [req.params.id]
    );
    rows[0].jugadores = jugadores;
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { recomendar, guardar, obtenerPorPartido, obtenerPorId };
