import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import invitacionServicio from '../services/invitacion.servicio';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { toast } from 'react-toastify';
import { Navigate } from 'react-router-dom';

export default function Invitaciones() {
  const { t, i18n } = useTranslation();
  const { usuario }  = usarAutenticacion();

  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [correo, setCorreo]             = useState('');
  const [enviando, setEnviando]         = useState(false);

  const cargar = async () => {
    setCargando(true);
    try { setInvitaciones(await invitacionServicio.listar()); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  if (usuario?.rol === 'analista') return <Navigate to="/panel" replace />;

  const manejarInvitar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await invitacionServicio.invitar(correo);
      toast.success(t('invitaciones.sent'));
      setCorreo('');
      cargar();
    } catch { /* manejado */ } finally { setEnviando(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invitaciones.title')}</h1>
          <p className="page-subtitle">{t('invitaciones.subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>{t('invitaciones.invite')}</h3>
        <form onSubmit={manejarInvitar} style={{ display: 'flex', gap: 12 }}>
          <input
            type="email" className="form-input" required style={{ flex: 1 }}
            placeholder={t('invitaciones.emailPlaceholder')}
            value={correo} onChange={(e) => setCorreo(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? t('comun.saving') : t('invitaciones.sendBtn')}
          </button>
        </form>
        <p className="text-sm text-muted" style={{ marginTop: 8 }}>{t('invitaciones.note')}</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {cargando ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : invitaciones.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '32px 24px' }}>{t('invitaciones.none')}</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('invitaciones.th.email')}</th>
                  <th>{t('invitaciones.th.role')}</th>
                  <th>{t('invitaciones.th.sentBy')}</th>
                  <th>{t('invitaciones.th.expires')}</th>
                  <th>{t('invitaciones.th.status')}</th>
                </tr>
              </thead>
              <tbody>
                {invitaciones.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.correo}</td>
                    <td><span className="badge badge-blue">{inv.rol}</span></td>
                    <td className="text-sm text-muted">{inv.invitado_por || '—'}</td>
                    <td className="text-sm text-muted">
                      {new Date(inv.expira_en).toLocaleDateString(i18n.language)}
                    </td>
                    <td>
                      {inv.usado_en
                        ? <span className="badge badge-green">{t('invitaciones.used')}</span>
                        : new Date(inv.expira_en) < new Date()
                          ? <span className="badge badge-gray">{t('invitaciones.expired')}</span>
                          : <span className="badge badge-yellow">{t('invitaciones.pending')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
