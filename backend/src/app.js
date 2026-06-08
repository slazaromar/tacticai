require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const { conectarBD }      = require('./config/baseDatos');
const { conectarRedis }   = require('./config/redis');
const gestionErrores    = require('./middleware/gestionErrores');
const registrador         = require('./config/registrador');

const rutasAutenticacion = require('./routes/autenticacion.rutas');
const rutasJugador       = require('./routes/jugador.rutas');
const rutasEquipo        = require('./routes/equipo.rutas');
const rutasPartido       = require('./routes/partido.rutas');
const rutasAlineacion    = require('./routes/alineacion.rutas');
const rutasLesion        = require('./routes/lesion.rutas');
const rutasInvitacion    = require('./routes/invitacion.rutas');

const app    = express();
const PUERTO = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => registrador.http(msg.trim()) } }));


app.use('/api/autenticacion',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { mensaje: 'Demasiados intentos de autenticación' } })
);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ estado: 'ok', marca_tiempo: new Date().toISOString() }));

app.use('/api/autenticacion',                     rutasAutenticacion);
app.use('/api/jugadores',                          rutasJugador);
app.use('/api/jugadores/:jugadorId/lesiones',      rutasLesion);
app.use('/api/equipos',                            rutasEquipo);
app.use('/api/partidos',                           rutasPartido);
app.use('/api/alineaciones',                       rutasAlineacion);
app.use('/api/invitaciones',                       rutasInvitacion);

app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));

app.use(gestionErrores);

async function iniciar() {
  try {
    await conectarBD();
    await conectarRedis();
    app.listen(PUERTO, () => registrador.info(`API backend corriendo en el puerto ${PUERTO}`));
  } catch (err) {
    registrador.error('No se pudo iniciar el servidor', err);
    process.exit(1);
  }
}

iniciar();

module.exports = app;
