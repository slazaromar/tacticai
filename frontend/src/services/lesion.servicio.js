import api from './api';

const lesionServicio = {
  obtenerHistorial: (jugadorId)              => api.get(`/jugadores/${jugadorId}/lesiones`).then((r) => r.data),
  registrar:        (jugadorId, datos)       => api.post(`/jugadores/${jugadorId}/lesiones`, datos).then((r) => r.data),
  eliminar:         (jugadorId, lesionId)    => api.delete(`/jugadores/${jugadorId}/lesiones/${lesionId}`).then((r) => r.data),
};

export default lesionServicio;
