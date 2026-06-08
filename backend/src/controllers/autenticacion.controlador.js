const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const { consultar } = require('../config/baseDatos');
const { obtenerRedis } = require('../config/redis');

function generarTokenAcceso(usuario) {
  return jwt.sign(
    { id: usuario.id, correo: usuario.correo, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generarTokenRefresco(usuario) {
  return jwt.sign(
    { id: usuario.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

async function registrar(req, res, next) {
  try {
    const { nombre_usuario, correo, contrasena } = req.body;
    const hash = await bcrypt.hash(contrasena, 10);

    const { rows } = await consultar(
      `INSERT INTO usuarios (nombre_usuario, correo, contrasena_hash, rol)
       VALUES ($1, $2, $3, 'analista')
       RETURNING id, nombre_usuario, correo, rol, creado_en`,
      [nombre_usuario, correo, hash]
    );

    const usuario = rows[0];
    const tokenAcceso   = generarTokenAcceso(usuario);
    const tokenRefresco = generarTokenRefresco(usuario);

    const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await consultar(
      `INSERT INTO tokens_refresco (usuario_id, token, expira_en) VALUES ($1, $2, $3)`,
      [usuario.id, tokenRefresco, expiraEn]
    );

    res.status(201).json({ usuario, tokenAcceso, tokenRefresco });
  } catch (err) { next(err); }
}

async function iniciarSesion(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    const { rows } = await consultar(
      `SELECT id, nombre_usuario, correo, contrasena_hash, rol, esta_activo
       FROM usuarios WHERE correo = $1`,
      [correo]
    );

    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena_hash))) {
      return res.status(401).json({ mensaje: 'Correo o contraseña no válidos' });
    }
    if (!usuario.esta_activo) {
      return res.status(403).json({ mensaje: 'Cuenta deshabilitada' });
    }

    await consultar(`UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1`, [usuario.id]);

    const tokenAcceso   = generarTokenAcceso(usuario);
    const tokenRefresco = generarTokenRefresco(usuario);

    const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await consultar(
      `INSERT INTO tokens_refresco (usuario_id, token, expira_en) VALUES ($1, $2, $3)`,
      [usuario.id, tokenRefresco, expiraEn]
    );

    const redis = obtenerRedis();
    await redis.setex(`sesion:${usuario.id}`, 15 * 60, JSON.stringify({ id: usuario.id, rol: usuario.rol }));

    const { contrasena_hash: _, ...usuarioSeguro } = usuario;
    res.json({ usuario: usuarioSeguro, tokenAcceso, tokenRefresco });
  } catch (err) { next(err); }
}

async function refrescar(req, res, next) {
  try {
    const { tokenRefresco } = req.body;
    if (!tokenRefresco) return res.status(400).json({ mensaje: 'Token de refresco requerido' });

    try {
      jwt.verify(tokenRefresco, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ mensaje: 'Token de refresco no válido o caducado' });
    }

    const { rows } = await consultar(
      `SELECT tr.*, u.nombre_usuario, u.correo, u.rol, u.esta_activo
       FROM tokens_refresco tr
       JOIN usuarios u ON u.id = tr.usuario_id
       WHERE tr.token = $1 AND tr.revocado = false AND tr.expira_en > NOW()`,
      [tokenRefresco]
    );

    if (!rows[0]) return res.status(401).json({ mensaje: 'Token de refresco revocado o caducado' });
    if (!rows[0].esta_activo) return res.status(403).json({ mensaje: 'Cuenta deshabilitada' });

    const nuevoTokenAcceso = generarTokenAcceso(rows[0]);
    res.json({ tokenAcceso: nuevoTokenAcceso });
  } catch (err) { next(err); }
}

async function cerrarSesion(req, res, next) {
  try {
    const { tokenRefresco } = req.body;
    if (tokenRefresco) {
      await consultar(`UPDATE tokens_refresco SET revocado = true WHERE token = $1`, [tokenRefresco]);
    }
    if (req.usuario) {
      const redis = obtenerRedis();
      await redis.del(`sesion:${req.usuario.id}`);
    }
    res.json({ mensaje: 'Sesión cerrada' });
  } catch (err) { next(err); }
}

async function yo(req, res, next) {
  try {
    const { rows } = await consultar(
      `SELECT id, nombre_usuario, correo, rol, ultimo_acceso, creado_en
       FROM usuarios WHERE id = $1`,
      [req.usuario.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { registrar, iniciarSesion, refrescar, cerrarSesion, yo };
