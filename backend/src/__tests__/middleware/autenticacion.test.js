const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key';

const { autenticar, autorizar } = require('../../middleware/autenticacion');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('autenticar', () => {
  test('sin cabecera Authorization → 401', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('cabecera sin prefijo Bearer → 401', () => {
    const req  = { headers: { authorization: 'Basic abc' } };
    const res  = mockRes();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('token inválido → 401', () => {
    const req  = { headers: { authorization: 'Bearer token.invalido' } };
    const res  = mockRes();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Token no válido' }));
  });

  test('token expirado → 401 con mensaje caducado', () => {
    const tokenExpirado = jwt.sign({ id: 1 }, 'test-secret-key', { expiresIn: -1 });
    const req  = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res  = mockRes();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Token caducado' }));
  });

  test('token válido → asigna req.usuario y llama next()', () => {
    const payload = { id: 'u1', correo: 'a@b.com', rol: 'analista' };
    const token   = jwt.sign(payload, 'test-secret-key', { expiresIn: '1h' });
    const req     = { headers: { authorization: `Bearer ${token}` } };
    const res     = mockRes();
    const next    = jest.fn();

    autenticar(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario).toMatchObject({ id: 'u1', correo: 'a@b.com' });
  });
});

describe('autorizar', () => {
  test('rol permitido → llama next()', () => {
    const req  = { usuario: { rol: 'admin' } };
    const res  = mockRes();
    const next = jest.fn();

    autorizar('admin', 'analista')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('rol no permitido → 403', () => {
    const req  = { usuario: { rol: 'analista' } };
    const res  = mockRes();
    const next = jest.fn();

    autorizar('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('sin req.usuario → 403', () => {
    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    autorizar('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
