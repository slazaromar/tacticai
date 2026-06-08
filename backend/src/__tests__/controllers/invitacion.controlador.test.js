jest.mock('../../config/baseDatos');
jest.mock('nodemailer');

process.env.JWT_SECRET         = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { consultar } = require('../../config/baseDatos');
const nodemailer    = require('nodemailer');

const sendMailMock = jest.fn().mockResolvedValue({});
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

const { invitar, listar, aceptar } = require('../../controllers/invitacion.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
});

describe('invitar', () => {
  test('crea invitación y envía correo → 201', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    sendMailMock.mockResolvedValueOnce({});
    const req = { body: { correo: 'test@test.com' }, usuario: { id: 'u1' } };
    const res = mockRes();

    await invitar(req, res, jest.fn());

    expect(consultar).toHaveBeenCalledWith(
      expect.stringContaining('invitaciones'),
      expect.arrayContaining(['test@test.com'])
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Invitación enviada' }));
  });

  test('fallo de SMTP → responde 201 igualmente (error no crítico)', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    sendMailMock.mockRejectedValueOnce(new Error('SMTP error'));
    const req = { body: { correo: 'test@test.com' }, usuario: { id: 'u1' } };
    const res = mockRes();

    await invitar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('listar', () => {
  test('devuelve todas las invitaciones', async () => {
    const invitaciones = [{ id: 'i1', correo: 'a@b.com', rol: 'analista' }];
    consultar.mockResolvedValueOnce({ rows: invitaciones });
    const req = {};
    const res = mockRes();

    await listar(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(invitaciones);
  });
});

describe('aceptar', () => {
  test('token inválido o expirado → 400', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { body: { token: 'token-invalido', nombre_usuario: 'u', contrasena: 'pass' } };
    const res = mockRes();

    await aceptar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('token válido → crea usuario y devuelve tokens → 201', async () => {
    const inv     = { id: 'i1', correo: 'inv@test.com', rol: 'analista' };
    const usuario = { id: 'u2', nombre_usuario: 'nuevo', correo: 'inv@test.com', rol: 'analista' };
    consultar
      .mockResolvedValueOnce({ rows: [inv] })      // SELECT invitaciones
      .mockResolvedValueOnce({ rows: [usuario] })  // INSERT usuarios
      .mockResolvedValueOnce({ rows: [] })          // UPDATE invitaciones
      .mockResolvedValueOnce({ rows: [] });         // INSERT tokens_refresco
    const req = { body: { token: 'token-valido', nombre_usuario: 'nuevo', contrasena: 'pass123' } };
    const res = mockRes();

    await aceptar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario:       usuario,
        tokenAcceso:   expect.any(String),
        tokenRefresco: expect.any(String),
      })
    );
  });
});
