jest.mock('../../config/baseDatos');

const { consultar } = require('../../config/baseDatos');

const { obtenerTodos, obtenerPorId, crear, actualizar, eliminar } =
  require('../../controllers/partido.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
};

const partidoEjemplo = {
  id: 'p1',
  equipo_local_id: 'e1',
  equipo_visitante_id: 'e2',
  fecha_partido: '2024-06-10T20:00:00Z',
  estado: 'programado',
  equipo_local:    { id: 'e1', nombre: 'Local' },
  equipo_visitante: { id: 'e2', nombre: 'Visitante' },
};

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
  test('devuelve lista paginada', async () => {
    consultar
      .mockResolvedValueOnce({ rows: [partidoEjemplo] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const req = { query: {} };
    const res = mockRes();

    await obtenerTodos(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ datos: [partidoEjemplo], total: 1 })
    );
  });

  test('filtra por estado', async () => {
    consultar
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const req = { query: { estado: 'programado' } };
    const res = mockRes();

    await obtenerTodos(req, res, jest.fn());

    expect(consultar.mock.calls[0][0]).toContain('estado');
  });
});

describe('obtenerPorId', () => {
  test('partido existe → 200', async () => {
    consultar.mockResolvedValueOnce({ rows: [partidoEjemplo] });
    const req = { params: { id: 'p1' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(partidoEjemplo);
  });

  test('partido no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'p99' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('crear', () => {
  test('inserta partido → 201', async () => {
    consultar.mockResolvedValueOnce({ rows: [partidoEjemplo] });
    const req = {
      body: {
        equipo_local_id: 'e1',
        equipo_visitante_id: 'e2',
        fecha_partido: '2024-06-10T20:00:00Z',
      },
    };
    const res = mockRes();

    await crear(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(partidoEjemplo);
  });
});

describe('actualizar', () => {
  test('actualiza partido → 200', async () => {
    const actualizado = { ...partidoEjemplo, estado: 'en_curso' };
    consultar.mockResolvedValueOnce({ rows: [actualizado] });
    const req = {
      params: { id: 'p1' },
      body: {
        equipo_local_id:    'e1',
        equipo_visitante_id: 'e2',
        fecha_partido:      '2024-06-10T20:00:00Z',
        estado:             'en_curso',
      },
    };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estado: 'en_curso' }));
  });

  test('partido no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = {
      params: { id: 'p99' },
      body: { equipo_local_id: 'e1', equipo_visitante_id: 'e2', fecha_partido: '2024-06-10' },
    };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('eliminar', () => {
  test('elimina partido → 204', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 1 });
    const req = { params: { id: 'p1' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('partido no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 0 });
    const req = { params: { id: 'p99' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
