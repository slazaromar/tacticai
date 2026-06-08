jest.mock('../../config/baseDatos');

const { consultar } = require('../../config/baseDatos');

const { obtenerTodos, obtenerPorId, crear, actualizar, eliminar } =
  require('../../controllers/equipo.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
};

const equipoEjemplo = { id: 'e1', nombre: 'FC Test', formacion: '4-3-3' };

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
  test('devuelve lista paginada', async () => {
    consultar
      .mockResolvedValueOnce({ rows: [equipoEjemplo] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const req = { query: {} };
    const res = mockRes();

    await obtenerTodos(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ datos: [equipoEjemplo], total: 1 })
    );
  });
});

describe('obtenerPorId', () => {
  test('equipo existe → 200', async () => {
    consultar.mockResolvedValueOnce({ rows: [equipoEjemplo] });
    const req = { params: { id: 'e1' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(equipoEjemplo);
  });

  test('equipo no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'e99' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('crear', () => {
  test('inserta equipo → 201', async () => {
    consultar.mockResolvedValueOnce({ rows: [equipoEjemplo] });
    const req = { body: { nombre: 'FC Test', formacion: '4-3-3' } };
    const res = mockRes();

    await crear(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(equipoEjemplo);
  });
});

describe('actualizar', () => {
  test('actualiza equipo → 200', async () => {
    const actualizado = { ...equipoEjemplo, nombre: 'FC Actualizado' };
    consultar.mockResolvedValueOnce({ rows: [actualizado] });
    const req = {
      params: { id: 'e1' },
      body:   { nombre: 'FC Actualizado', formacion: '4-3-3' },
    };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'FC Actualizado' }));
  });

  test('equipo no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'e99' }, body: { nombre: 'X', formacion: '4-3-3' } };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('eliminar', () => {
  test('elimina equipo → 204', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 1 });
    const req = { params: { id: 'e1' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('equipo no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 0 });
    const req = { params: { id: 'e99' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
