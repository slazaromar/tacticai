jest.mock('../../config/baseDatos');
jest.mock('../../config/redis');

process.env.JWT_SECRET         = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN     = '15m';

const bcrypt       = require('bcryptjs');
const { consultar }    = require('../../config/baseDatos');
const { obtenerRedis } = require('../../config/redis');

const redisMock = { setex: jest.fn().mockResolvedValue('OK'), del: jest.fn().mockResolvedValue(1) };
obtenerRedis.mockReturnValue(redisMock);

const { registrar, iniciarSesion, cerrarSesion, yo } = require('../../controllers/autenticacion.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('iniciarSesion', () => {
  test('credenciales incorrectas (usuario no existe) → 401', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req  = { body: { correo: 'x@x.com', contrasena: 'wrong' } };
    const res  = mockRes();
    const next = jest.fn();

    await iniciarSesion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.stringContaining('válidos') }));
  });

  test('contraseña incorrecta → 401', async () => {
    const hash = await bcrypt.hash('correcta', 10);
    consultar.mockResolvedValueOnce({ rows: [{ id: '1', nombre_usuario: 'u', correo: 'u@u.com', contrasena_hash: hash, rol: 'analista', esta_activo: true }] });
    const req  = { body: { correo: 'u@u.com', contrasena: 'incorrecta' } };
    const res  = mockRes();

    await iniciarSesion(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('cuenta deshabilitada → 403', async () => {
    const hash = await bcrypt.hash('pass', 10);
    consultar.mockResolvedValueOnce({ rows: [{ id: '1', nombre_usuario: 'u', correo: 'u@u.com', contrasena_hash: hash, rol: 'analista', esta_activo: false }] });
    const req  = { body: { correo: 'u@u.com', contrasena: 'pass' } };
    const res  = mockRes();

    await iniciarSesion(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('credenciales válidas → 200 con tokens', async () => {
    const hash = await bcrypt.hash('pass', 10);
    const usuario = { id: 'u1', nombre_usuario: 'sergio', correo: 's@s.com', contrasena_hash: hash, rol: 'admin', esta_activo: true };
    consultar
      .mockResolvedValueOnce({ rows: [usuario] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const req  = { body: { correo: 's@s.com', contrasena: 'pass' } };
    const res  = mockRes();

    await iniciarSesion(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ tokenAcceso: expect.any(String), tokenRefresco: expect.any(String) })
    );
  });
});

describe('registrar', () => {
  test('crea usuario → 201', async () => {
    const nuevo = { id: 'u2', nombre_usuario: 'test', correo: 't@t.com', rol: 'analista', creado_en: new Date() };
    consultar
      .mockResolvedValueOnce({ rows: [nuevo] })
      .mockResolvedValueOnce({ rows: [] });
    const req  = { body: { nombre_usuario: 'test', correo: 't@t.com', contrasena: 'pass' } };
    const res  = mockRes();

    await registrar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ tokenAcceso: expect.any(String) }));
  });
});

describe('cerrarSesion', () => {
  test('revoca token y borra sesión de Redis', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req  = { body: { tokenRefresco: 'tk' }, usuario: { id: 'u1' } };
    const res  = mockRes();

    await cerrarSesion(req, res, jest.fn());

    expect(consultar).toHaveBeenCalledWith(expect.stringContaining('revocado'), ['tk']);
    expect(redisMock.del).toHaveBeenCalledWith('sesion:u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Sesión cerrada' }));
  });
});

describe('yo', () => {
  test('devuelve el usuario autenticado → 200', async () => {
    const usuario = { id: 'u1', nombre_usuario: 'sergio', correo: 's@s.com', rol: 'admin' };
    consultar.mockResolvedValueOnce({ rows: [usuario] });
    const req  = { usuario: { id: 'u1' } };
    const res  = mockRes();

    await yo(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(usuario);
  });

  test('usuario no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req  = { usuario: { id: 'u99' } };
    const res  = mockRes();

    await yo(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
