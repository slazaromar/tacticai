import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import lesionServicio from '../services/lesion.servicio';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { toast } from 'react-toastify';

const FORM_VACIO = { descripcion: '', fecha_inicio: '', fecha_fin: '' };

export default function HistorialLesiones({ jugadorId, nombreJugador, onCerrar }) {
  const { t, i18n } = useTranslation();
  const { usuario }  = usarAutenticacion();
  const puedeEditar  = usuario?.rol === 'entrenador' || usuario?.rol === 'admin';

  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [formulario, setFormulario] = useState(FORM_VACIO);
  const [guardando, setGuardando]   = useState(false);

  const cargar = async () => {
    setCargando(true);
    try { setHistorial(await lesionServicio.obtenerHistorial(jugadorId)); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [jugadorId]);

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await lesionServicio.registrar(jugadorId, formulario);
      setFormulario(FORM_VACIO);
      toast.success(t('lesiones.registered'));
      cargar();
    } catch { /* manejado */ } finally { setGuardando(false); }
  };

  const manejarEliminacion = async (id) => {
    if (!window.confirm(t('lesiones.confirmDelete'))) return;
    try {
      await lesionServicio.eliminar(jugadorId, id);
      toast.success(t('lesiones.deleted'));
      cargar();
    } catch { /* manejado */ }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{t('lesiones.title', { nombre: nombreJugador })}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onCerrar}>{t('comun.cancel')}</button>
        </div>

        {cargando ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : historial.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '24px 0' }}>{t('lesiones.noHistory')}</p>
        ) : (
          <div className="table-wrapper" style={{ marginBottom: 20 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('lesiones.th.description')}</th>
                  <th>{t('lesiones.th.start')}</th>
                  <th>{t('lesiones.th.end')}</th>
                  {puedeEditar && <th></th>}
                </tr>
              </thead>
              <tbody>
                {historial.map((l) => (
                  <tr key={l.id}>
                    <td>{l.descripcion}</td>
                    <td className="text-sm">{new Date(l.fecha_inicio).toLocaleDateString(i18n.language)}</td>
                    <td className="text-sm">{l.fecha_fin ? new Date(l.fecha_fin).toLocaleDateString(i18n.language) : '—'}</td>
                    {puedeEditar && (
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => manejarEliminacion(l.id)}>
                          <DeleteIcon fontSize="small" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {puedeEditar && (
          <form onSubmit={manejarRegistro}>
            <h4 style={{ marginBottom: 12 }}>{t('lesiones.addRecord')}</h4>
            <div className="form-group">
              <label className="form-label">{t('lesiones.th.description')}</label>
              <input className="form-input" required value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">{t('lesiones.th.start')}</label>
                <input type="date" className="form-input" required value={formulario.fecha_inicio} onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('lesiones.th.end')} ({t('comun.optional', 'opcional')})</label>
                <input type="date" className="form-input" value={formulario.fecha_fin} onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? t('comun.saving') : t('lesiones.save')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
