jest.mock('../../config/baseDatos');
jest.mock('../../config/redis');
jest.mock('axios');

const { consultar, obtenerCliente } = require('../../config/baseDatos');
const { obtenerRedis }              = require('../../config/redis');
const axios                          = require('axios');

const redisMock = {
  get:   jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
};
obtenerRedis.mockReturnValue(redisMock);

const clienteMock = {
  query:   jest.fn(),
  release: jest.fn(),
};

const { recomendar, guardar, obtenerPorPartido, obtenerPorId } =
  require('../../controllers/alineacion.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  obtenerRedis.mockReturnValue(redisMock);
});

describe('recomendar', () => {
  test('cache hit → responde sin consultar DB', async () => {
    const alineacionCacheada = { jugadores: [] };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(alineacionCacheada));
    const req = { body: { partidoId: 'p1', equipoId: 'e1', formacion: '4-3-3' } };
    const res = mockRes();

    await recomendar(req, res, jest.fn());

    expect(consultar).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(alineacionCacheada);
  });

  test('sin jugadores en el equipo → 400', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { body: { partidoId: 'p1', equipoId: 'e1', formacion: '4-3-3' } };
    const res = mockRes();

    await recomendar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: expect.any(String) }));
  });

  test('motor no disponible (ECONNREFUSED) → 503', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    consultar
      .mockResolvedValueOnce({ rows: [{ id: 'j1', posicion: 'DC' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
    const err = new Error('connect ECONNREFUSED');
    err.code = 'ECONNREFUSED';
    axios.post.mockRejectedValueOnce(err);
    const req = { body: { partidoId: 'p1', equipoId: 'e1', formacion: '4-3-3' } };
    const res = mockRes();

    await recomendar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('motor responde → guarda en cache y devuelve alineación', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    consultar
      .mockResolvedValueOnce({ rows: [{ id: 'j1', posicion: 'DC' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
    const alineacion = { jugadores: [], formacion: '4-3-3' };
    axios.post.mockResolvedValueOnce({ data: alineacion });
    const req = { body: { partidoId: 'p1', equipoId: 'e1', formacion: '4-3-3' } };
    const res = mockRes();

    await recomendar(req, res, jest.fn());

    expect(redisMock.setex).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(alineacion);
  });
});

describe('guardar', () => {
  test('guarda alineación con transacción → 201', async () => {
    const alineacion = { id: 'a1', partido_id: 'p1', equipo_id: 'e1', formacion: '4-3-3' };
    clienteMock.query
      .mockResolvedValueOnce({})                  // BEGIN
      .mockResolvedValueOnce({ rows: [alineacion] }) // INSERT alineaciones
      .mockResolvedValueOnce({})                  // INSERT alineacion_jugadores
      .mockResolvedValueOnce({});                 // COMMIT
    obtenerCliente.mockResolvedValueOnce(clienteMock);
    const req = {
      body: {
        partidoId:       'p1',
        equipoId:        'e1',
        formacion:       '4-3-3',
        esRecomendacion: true,
        jugadores:       [{ id: 'j1', posicion: 'DC', es_titular: true }],
      },
      usuario: { id: 'u1' },
    };
    const res = mockRes();

    await guardar(req, res, jest.fn());

    expect(clienteMock.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(alineacion);
  });

  test('error en transacción → llama ROLLBACK y propaga error', async () => {
    const dbError = new Error('DB error');
    clienteMock.query
      .mockResolvedValueOnce({})        // BEGIN
      .mockRejectedValueOnce(dbError)   // INSERT falla
      .mockResolvedValueOnce({});       // ROLLBACK
    obtenerCliente.mockResolvedValueOnce(clienteMock);
    const next = jest.fn();
    const req = {
      body: {
        partidoId: 'p1', equipoId: 'e1', formacion: '4-3-3',
        jugadores: [{ id: 'j1', posicion: 'DC' }],
      },
      usuario: { id: 'u1' },
    };
    const res = mockRes();

    await guardar(req, res, next);

    expect(clienteMock.release).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(dbError);
  });
});

describe('obtenerPorPartido', () => {
  test('sin partidoId → 400', async () => {
    const req = { query: {} };
    const res = mockRes();

    await obtenerPorPartido(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('devuelve alineaciones con sus jugadores', async () => {
    const alineacion = { id: 'a1', partido_id: 'p1' };
    const jugadores  = [{ id: 'j1', nombre: 'Leo' }];
    consultar
      .mockResolvedValueOnce({ rows: [alineacion] })
      .mockResolvedValueOnce({ rows: jugadores });
    const req = { query: { partidoId: 'p1' } };
    const res = mockRes();

    await obtenerPorPartido(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 1 }));
  });
});

describe('obtenerPorId', () => {
  test('alineación no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'a99' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('alineación existe → devuelve con jugadores', async () => {
    const alineacion = { id: 'a1', partido_id: 'p1' };
    const jugadores  = [{ id: 'j1', nombre: 'Leo' }];
    consultar
      .mockResolvedValueOnce({ rows: [alineacion] })
      .mockResolvedValueOnce({ rows: jugadores });
    const req = { params: { id: 'a1' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ jugadores }));
  });
});
