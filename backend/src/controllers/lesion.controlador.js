const { consultar } = require('../config/baseDatos');

async function obtenerHistorial(req, res, next) {
  try {
    const { rows } = await consultar(
      `SELECT id, descripcion, fecha_inicio, fecha_fin, creado_en
       FROM historial_lesiones
       WHERE jugador_id = $1
       ORDER BY fecha_inicio DESC`,
      [req.params.jugadorId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function registrar(req, res, next) {
  try {
    const { descripcion, fecha_inicio, fecha_fin } = req.body;
    const { rows } = await consultar(
      `INSERT INTO historial_lesiones (jugador_id, descripcion, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.jugadorId, descripcion, fecha_inicio, fecha_fin || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    await consultar(
      `DELETE FROM historial_lesiones WHERE id = $1 AND jugador_id = $2`,
      [req.params.lesionId, req.params.jugadorId]
    );
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { obtenerHistorial, registrar, eliminar };
