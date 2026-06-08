import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tokenAcceso');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let refrescando    = false;
let colaPendientes = [];

const procesarCola = (error, token = null) => {
  colaPendientes.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  colaPendientes = [];
};

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const peticionOriginal = error.config;

    if (error.response?.status === 401 && !peticionOriginal._reintentado) {
      if (refrescando) {
        return new Promise((resolve, reject) => {
          colaPendientes.push({ resolve, reject });
        })
          .then((token) => {
            peticionOriginal.headers.Authorization = `Bearer ${token}`;
            return api(peticionOriginal);
          })
          .catch((err) => Promise.reject(err));
      }

      peticionOriginal._reintentado = true;
      refrescando = true;

      const tokenRefresco = localStorage.getItem('tokenRefresco');
      if (!tokenRefresco) {
        refrescando = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/autenticacion/refrescar`, { tokenRefresco });
        localStorage.setItem('tokenAcceso', data.tokenAcceso);
        api.defaults.headers.common.Authorization = `Bearer ${data.tokenAcceso}`;
        procesarCola(null, data.tokenAcceso);
        peticionOriginal.headers.Authorization = `Bearer ${data.tokenAcceso}`;
        return api(peticionOriginal);
      } catch (errorRefresco) {
        procesarCola(errorRefresco, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(errorRefresco);
      } finally {
        refrescando = false;
      }
    }

    const mensaje =
      error.response?.data?.mensaje ||
      error.response?.data?.message ||
      error.message ||
      'Se ha producido un error';
    if (error.response?.status !== 401) {
      toast.error(mensaje);
    }

    return Promise.reject(error);
  }
);

export default api;
