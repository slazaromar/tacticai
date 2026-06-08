jest.mock('../../config/baseDatos');

const { consultar } = require('../../config/baseDatos');

const { obtenerHistorial, registrar, eliminar } =
  require('../../controllers/lesion.controlador');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.end    = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('obtenerHistorial', () => {
  test('devuelve historial de lesiones del jugador', async () => {
    const historial = [{ id: 'l1', descripcion: 'Rodilla', fecha_inicio: '2024-01-01' }];
    consultar.mockResolvedValueOnce({ rows: historial });
    const req = { params: { jugadorId: 'j1' } };
    const res = mockRes();

    await obtenerHistorial(req, res, jest.fn());

    expect(consultar).toHaveBeenCalledWith(expect.any(String), ['j1']);
    expect(res.json).toHaveBeenCalledWith(historial);
  });

  test('jugador sin lesiones → lista vacía', async () => {
    consultar.mockResolvedValueOnce({ rows: [] });
    const req = { params: { jugadorId: 'j99' } };
    const res = mockRes();

    await obtenerHistorial(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe('registrar', () => {
  test('inserta lesión → 201', async () => {
    const lesion = { id: 'l1', jugador_id: 'j1', descripcion: 'Rodilla', fecha_inicio: '2024-01-01' };
    consultar.mockResolvedValueOnce({ rows: [lesion] });
    const req = {
      params: { jugadorId: 'j1' },
      body:   { descripcion: 'Rodilla', fecha_inicio: '2024-01-01' },
    };
    const res = mockRes();

    await registrar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(lesion);
  });
});

describe('eliminar', () => {
  test('elimina lesión → 204', async () => {
    consultar.mockResolvedValueOnce({});
    const req = { params: { jugadorId: 'j1', lesionId: 'l1' } };
    const res = mockRes();

    await eliminar(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(204);
  });
});
