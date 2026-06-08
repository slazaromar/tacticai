import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import servicioEquipo from '../services/equipo.servicio';
import { toast }      from 'react-toastify';
import DeleteIcon from '@mui/icons-material/Delete';
import { usarAutenticacion } from '../context/ContextoAutenticacion';

const FORMACIONES = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2'];
const FORMULARIO_VACIO = { nombre: '', nombre_corto: '', formacion: '4-3-3', ciudad: '', pais: '' };

export default function Equipos() {
  const { t } = useTranslation();
  const { usuario } = usarAutenticacion();
  const puedeEditar = usuario?.rol === 'entrenador' || usuario?.rol === 'admin';
  const [equipos, setEquipos]       = useState([]);
  const [total, setTotal]           = useState(0);
  const [cargando, setCargando]     = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando]     = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando]   = useState(false);

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await servicioEquipo.obtenerTodos({ limite: 50 });
      setEquipos(datos.datos || []); setTotal(datos.total || 0);
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargarEquipos(); }, [cargarEquipos]);

  const abrirCrear = () => { setEditando(null); setFormulario(FORMULARIO_VACIO); setModalAbierto(true); };
  const abrirEditar = (eq) => {
    setEditando(eq);
    setFormulario({
      nombre: eq.nombre, nombre_corto: eq.nombre_corto || '',
      formacion: eq.formacion || '4-3-3', ciudad: eq.ciudad || '', pais: eq.pais || '',
    });
    setModalAbierto(true);
  };

  const manejarGuardado = async (e) => {
    e.preventDefault(); setGuardando(true);
    try {
      if (editando) { await servicioEquipo.actualizar(editando.id, formulario); toast.success(t('equipos.toast.updated')); }
      else          { await servicioEquipo.crear(formulario);                   toast.success(t('equipos.toast.created')); }
      setModalAbierto(false); cargarEquipos();
    } catch { /* manejado */ } finally { setGuardando(false); }
  };

  const manejarEliminacion = async (id) => {
    if (!window.confirm(t('equipos.toast.confirmDelete'))) return;
    try { await servicioEquipo.eliminar(id); toast.success(t('equipos.toast.deleted')); cargarEquipos(); } catch { /* manejado */ }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('equipos.title')}</h1>
          <p className="page-subtitle">{t('equipos.subtitle', { count: total })}</p>
        </div>
        {puedeEditar && <button className="btn btn-primary" onClick={abrirCrear}>{t('equipos.addTeam')}</button>}
      </div>

      {cargando ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {equipos.map((eq) => (
            <div key={eq.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{eq.nombre_corto || eq.nombre?.slice(0,2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{eq.nombre}</div>
                  <div className="text-sm text-muted">{eq.nombre_corto}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                {eq.ciudad    && <span>{eq.ciudad}</span>}
                {eq.pais      && <span>{eq.pais}</span>}
                {eq.formacion && <span className="badge badge-blue">{eq.formacion}</span>}
              </div>
              {puedeEditar && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => abrirEditar(eq)}>{t('comun.edit')}</button>
                  <button className="btn btn-danger btn-sm"    onClick={() => manejarEliminacion(eq.id)}><DeleteIcon fontSize="small" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }}>
            <h3 style={{ marginBottom: 20 }}>{editando ? t('equipos.modal.editTitle') : t('equipos.modal.addTitle')}</h3>
            <form onSubmit={manejarGuardado}>
              <div className="form-group">
                <label className="form-label">{t('equipos.modal.name')}</label>
                <input className="form-input" required value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('equipos.modal.shortName')}</label>
                  <input className="form-input" maxLength={10} value={formulario.nombre_corto} onChange={(e) => setFormulario({ ...formulario, nombre_corto: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('equipos.modal.formation')}</label>
                  <select className="form-select" value={formulario.formacion} onChange={(e) => setFormulario({ ...formulario, formacion: e.target.value })}>
                    {FORMACIONES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('equipos.modal.city')}</label>
                  <input className="form-input" value={formulario.ciudad} onChange={(e) => setFormulario({ ...formulario, ciudad: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('equipos.modal.country')}</label>
                  <input className="form-input" value={formulario.pais} onChange={(e) => setFormulario({ ...formulario, pais: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalAbierto(false)}>{t('comun.cancel')}</button>
                <button type="submit"  className="btn btn-primary"   style={{ flex: 1 }} disabled={guardando}>{guardando ? t('comun.saving') : editando ? t('comun.update') : t('comun.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
