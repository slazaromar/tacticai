jest.mock('../../config/baseDatos');
jest.mock('../../config/redis');

const { consultar }    = require('../../config/baseDatos');
const { obtenerRedis } = require('../../config/redis');

const redisMock = {
  get:    jest.fn(),
  setex:  jest.fn().mockResolvedValue('OK'),
  del:    jest.fn().mockResolvedValue(1),
};
obtenerRedis.mockReturnValue(redisMock);

const { obtenerTodos, obtenerPorId, crear, actualizar, eliminar } = require('../../controllers/jugador.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  return res;
};

const jugadorEjemplo = { id: 'j1', nombre: 'Leo', posicion: 'DC', equipo_id: 'e1', rol_equipo: 'titular' };

beforeEach(() => jest.clearAllMocks());

describe('obtenerTodos', () => {
  test('devuelve lista paginada', async () => {
    consultar
      .mockResolvedValueOnce({ rows: [jugadorEjemplo] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });
    const req = { query: {} };
    const res = mockRes();

    await obtenerTodos(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ datos: [jugadorEjemplo], total: 1 })
    );
  });

  test('aplica filtros de posicion y equipoId', async () => {
    consultar
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });
    const req = { query: { posicion: 'DC', equipoId: 'e1' } };
    const res = mockRes();

    await obtenerTodos(req, res, jest.fn());

    const sqlLlamado = consultar.mock.calls[0][0];
    expect(sqlLlamado).toContain('posicion');
    expect(sqlLlamado).toContain('equipo_id');
  });
});

describe('obtenerPorId', () => {
  test('cache hit → devuelve sin consultar DB', async () => {
    redisMock.get.mockResolvedValueOnce(JSON.stringify(jugadorEjemplo));
    const req = { params: { id: 'j1' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(consultar).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(jugadorEjemplo);
  });

  test('cache miss → consulta DB y guarda en cache', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    consultar.mockResolvedValueOnce({ rows: [jugadorEjemplo] });
    const req = { params: { id: 'j1' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(consultar).toHaveBeenCalled();
    expect(redisMock.setex).toHaveBeenCalledWith('jugador:j1', expect.any(Number), expect.any(String));
    expect(res.json).toHaveBeenCalledWith(jugadorEjemplo);
  });

  test('jugador no existe → 404', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'j99' } };
    const res = mockRes();

    await obtenerPorId(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('crear', () => {
  test('inserta jugador → 201', async () => {
    consultar.mockResolvedValueOnce({ rows: [jugadorEjemplo] });
    const req = { body: { nombre: 'Leo', posicion: 'DC', rol_equipo: 'titular' } };
    const res = mockRes();

    await crear(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(jugadorEjemplo);
  });
});

describe('actualizar', () => {
  test('actualiza jugador e invalida cache → 200', async () => {
    consultar.mockResolvedValueOnce({ rows: [{ ...jugadorEjemplo, nombre: 'Leo actualizado' }] });
    const req = {
      params: { id: 'j1' },
      body: { nombre: 'Leo actualizado', posicion: 'DC', rol_equipo: 'titular', esta_lesionado: false, esta_sancionado: false },
    };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(redisMock.del).toHaveBeenCalledWith('jugador:j1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Leo actualizado' }));
  });

  test('jugador no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { id: 'j99' }, body: { nombre: 'X', posicion: 'DC', rol_equipo: 'titular' } };
    const res = mockRes();

    await actualizar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('eliminar', () => {
  test('elimina jugador e invalida cache → 204', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 1 });
    const req = { params: { id: 'j1' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(redisMock.del).toHaveBeenCalledWith('jugador:j1');
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('jugador no existe → 404', async () => {
    consultar.mockResolvedValueOnce({ rowCount: 0 });
    const req = { params: { id: 'j99' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
