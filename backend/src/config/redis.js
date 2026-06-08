const Redis        = require('ioredis');
const registrador  = require('./registrador');

let clienteRedis;

function conectarRedis() {
  return new Promise((resolver, rechazar) => {
    clienteRedis = new Redis({
      host:     process.env.REDIS_HOST     || 'localhost',
      port:     parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (intentos) => Math.min(intentos * 200, 5000),
      lazyConnect: true,
    });

    clienteRedis.once('ready', () => {
      registrador.info('Redis conectado');
      resolver(clienteRedis);
    });
    clienteRedis.once('error', (err) => {
      registrador.error('Error al conectar con Redis', err);
      rechazar(err);
    });

    clienteRedis.connect().catch(rechazar);
  });
}

function obtenerRedis() {
  if (!clienteRedis) throw new Error('Redis no inicializado — invoca conectarRedis() primero');
  return clienteRedis;
}

module.exports = { conectarRedis, obtenerRedis };
