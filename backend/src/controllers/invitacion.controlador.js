const crypto       = require('crypto');
const nodemailer   = require('nodemailer');
const { consultar } = require('../config/baseDatos');
const registrador  = require('../config/registrador');

function crearTransportador() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function invitar(req, res, next) {
  try {
    const { correo } = req.body;
    const token     = crypto.randomBytes(32).toString('hex');
    const expiraEn  = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await consultar(
      `INSERT INTO invitaciones (correo, token, rol, creado_por, expira_en)
       VALUES ($1, $2, 'analista', $3, $4)`,
      [correo, token, req.usuario.id, expiraEn]
    );

    const enlace = `${process.env.APP_URL || 'http://localhost:3000'}/registro?token=${token}`;

    try {
      await crearTransportador().sendMail({
        from:    process.env.SMTP_FROM || '"TacticAI" <noreply@tacticai.com>',
        to:      correo,
        subject: 'Invitación a TacticAI como analista',
        html: `
          <p>Has sido invitado a unirte a TacticAI como <strong>analista</strong>.</p>
          <p>Haz clic en el siguiente enlace para crear tu cuenta (válido 48 horas):</p>
          <p><a href="${enlace}">${enlace}</a></p>
        `,
      });
    } catch (mailErr) {
      registrador.warn(`No se pudo enviar el correo de invitación a ${correo}: ${mailErr.message}`);
    }

    res.status(201).json({ mensaje: 'Invitación enviada', expiraEn });
  } catch (err) { next(err); }
}

async function listar(req, res, next) {
  try {
    const { rows } = await consultar(
      `SELECT i.id, i.correo, i.rol, i.expira_en, i.usado_en, i.creado_en,
              u.nombre_usuario AS invitado_por
       FROM invitaciones i
       LEFT JOIN usuarios u ON u.id = i.creado_por
       ORDER BY i.creado_en DESC`,
      []
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function aceptar(req, res, next) {
  try {
    const { token, nombre_usuario, contrasena } = req.body;

    const { rows } = await consultar(
      `SELECT * FROM invitaciones WHERE token = $1 AND usado_en IS NULL AND expira_en > NOW()`,
      [token]
    );

    if (!rows[0]) return res.status(400).json({ mensaje: 'Invitación no válida o caducada' });

    const bcrypt = require('bcryptjs');
    const jwt    = require('jsonwebtoken');
    const hash   = await bcrypt.hash(contrasena, 10);
    const inv    = rows[0];

    const { rows: nuevoUsuario } = await consultar(
      `INSERT INTO usuarios (nombre_usuario, correo, contrasena_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre_usuario, correo, rol`,
      [nombre_usuario, inv.correo, hash, inv.rol]
    );

    await consultar(
      `UPDATE invitaciones SET usado_en = NOW() WHERE id = $1`,
      [inv.id]
    );

    const tokenAcceso   = jwt.sign(
      { id: nuevoUsuario[0].id, correo: nuevoUsuario[0].correo, nombre_usuario: nuevoUsuario[0].nombre_usuario, rol: nuevoUsuario[0].rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    const tokenRefresco = jwt.sign(
      { id: nuevoUsuario[0].id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    const expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await consultar(
      `INSERT INTO tokens_refresco (usuario_id, token, expira_en) VALUES ($1, $2, $3)`,
      [nuevoUsuario[0].id, tokenRefresco, expiraEn]
    );

    res.status(201).json({ usuario: nuevoUsuario[0], tokenAcceso, tokenRefresco });
  } catch (err) { next(err); }
}

module.exports = { invitar, listar, aceptar };
