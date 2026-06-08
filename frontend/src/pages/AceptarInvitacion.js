import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import invitacionServicio from '../services/invitacion.servicio';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { toast } from 'react-toastify';

export default function AceptarInvitacion() {
  const { t }               = useTranslation();
  const [params]            = useSearchParams();
  const navigate            = useNavigate();
  const { iniciarSesion }   = usarAutenticacion();
  const token               = params.get('token') || '';

  const [form, setForm]     = useState({ nombre_usuario: '', contrasena: '' });
  const [enviando, setEnviando] = useState(false);

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const datos = await invitacionServicio.aceptar({ token, ...form });
      localStorage.setItem('tacticai_token',   datos.tokenAcceso);
      localStorage.setItem('tacticai_refresh', datos.tokenRefresco);
      localStorage.setItem('usuario',          JSON.stringify(datos.usuario));
      toast.success(t('invitaciones.welcomeToast'));
      navigate('/panel');
    } catch { /* manejado */ } finally { setEnviando(false); }
  };

  if (!token) return (
    <div className="card text-center" style={{ maxWidth: 400, margin: '80px auto', padding: 40 }}>
      <p className="text-muted">{t('invitaciones.invalidToken')}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={{ marginBottom: 8 }}>{t('invitaciones.acceptTitle')}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>{t('invitaciones.acceptSubtitle')}</p>
        <form onSubmit={manejarRegistro}>
          <div className="form-group">
            <label className="form-label">{t('autenticacion.username', 'Nombre de usuario')}</label>
            <input className="form-input" required minLength={3} value={form.nombre_usuario} onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('autenticacion.password')}</label>
            <input type="password" className="form-input" required minLength={8} value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? t('comun.saving') : t('invitaciones.createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
}
