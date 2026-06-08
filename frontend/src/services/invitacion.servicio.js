import api from './api';

const invitacionServicio = {
  listar:  ()               => api.get('/invitaciones').then((r) => r.data),
  invitar: (correo)         => api.post('/invitaciones', { correo }).then((r) => r.data),
  aceptar: (datos)          => api.post('/invitaciones/aceptar', datos).then((r) => r.data),
};

export default invitacionServicio;
