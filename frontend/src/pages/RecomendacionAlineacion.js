import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import servicioPartido    from '../services/partido.servicio';
import servicioEquipo     from '../services/equipo.servicio';
import servicioAlineacion from '../services/alineacion.servicio';
import MuestraAlineacion  from '../components/MuestraAlineacion';
import TarjetaJugador     from '../components/TarjetaJugador';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { toast }          from 'react-toastify';

const FORMACIONES = ['4-3-3','4-4-2','4-2-3-1','3-5-2','5-3-2'];

export default function RecomendacionAlineacion() {
  const { t, i18n } = useTranslation();
  const { usuario } = usarAutenticacion();
  const puedeGuardar = usuario?.rol === 'entrenador' || usuario?.rol === 'admin';
  const { idPartido } = useParams();
  const [partido, setPartido]                       = useState(null);
  const [equipos, setEquipos]                       = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
  const [formacion, setFormacion]                   = useState('4-3-3');
  const [alineacion, setAlineacion]                 = useState(null);
  const [jugadoresEditados, setJugadoresEditados]   = useState([]);
  const [cargando, setCargando]                     = useState(true);
  const [generando, setGenerando]                   = useState(false);
  const [guardando, setGuardando]                   = useState(false);
  const [vista, setVista]                           = useState('campo');
  const [exportando, setExportando]                 = useState(false);
  const refCampo                                    = useRef(null);

  useEffect(() => {
    Promise.all([
      servicioPartido.obtenerPorId(idPartido),
      servicioEquipo.obtenerTodos({ limite: 50 }),
      servicioAlineacion.obtenerPorPartido(idPartido).catch(() => ({ datos: [] })),
    ]).then(([p, e, alineacionesGuardadas]) => {
      setPartido(p);
      const equiposPartido = (e.datos || []).filter(
        (eq) => eq.id === p.equipo_local_id || eq.id === p.equipo_visitante_id
      );
      setEquipos(equiposPartido);

      const guardada = (alineacionesGuardadas.datos || [])[0];
      if (guardada?.jugadores?.length > 0) {
        // The JOIN returns alineacion_jugadores.id; remap to jugador_id so component logic works
        const jugadores = guardada.jugadores.map((j) => ({ ...j, id: j.jugador_id }));
        const titulares = jugadores.filter((j) => j.es_titular);
        const puntuacionMedia = titulares.length > 0
          ? titulares.reduce((s, j) => s + (j.puntuacion_recomendacion || 0), 0) / titulares.length
          : 0;
        setEquipoSeleccionado(guardada.equipo_id);
        setFormacion(guardada.formacion || '4-3-3');
        setAlineacion({ ...guardada, jugadores, puntuacion_media: puntuacionMedia });
        setJugadoresEditados([...jugadores]);
        toast.info(t('alineacion.cargada'), { toastId: 'alineacion-cargada' });
      } else if (equiposPartido.length > 0) {
        setEquipoSeleccionado(equiposPartido[0].id);
        setFormacion(equiposPartido[0].formacion || '4-3-3');
      }
    }).finally(() => setCargando(false));
  }, [idPartido]); // eslint-disable-line react-hooks/exhaustive-deps

  const manejarGeneracion = async () => {
    if (!equipoSeleccionado) { toast.warning(t('alineacion.selectTeamWarn')); return; }
    setGenerando(true);
    try {
      const datos = await servicioAlineacion.recomendar(idPartido, equipoSeleccionado, formacion);
      setAlineacion(datos);
      setJugadoresEditados(datos.jugadores ? [...datos.jugadores] : []);
      toast.success(t('alineacion.generated'));
    } catch { /* manejado */ } finally { setGenerando(false); }
  };

  const exportarPNG = async () => {
    if (!refCampo.current) return;
    setExportando(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(refCampo.current, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const enlace = document.createElement('a');
      enlace.download = `alineacion-${equipoSeleccionadoObj?.nombre || 'equipo'}-${formacion}.png`;
      enlace.href = canvas.toDataURL('image/png');
      enlace.click();
    } catch { /* manejado */ } finally { setExportando(false); }
  };

  const exportarPDF = async () => {
    if (!refCampo.current) return;
    setExportando(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');
      const canvas = await html2canvas(refCampo.current, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`alineacion-${equipoSeleccionadoObj?.nombre || 'equipo'}-${formacion}.pdf`);
    } catch { /* manejado */ } finally { setExportando(false); }
  };

  const manejarIntercambio = (idA, idB) => {
    setJugadoresEditados((prev) => {
      const siguiente = prev.map((j) => ({ ...j }));
      const a = siguiente.find((j) => j.id === idA);
      const b = siguiente.find((j) => j.id === idB);
      if (!a || !b) return prev;
      [a.es_titular,         b.es_titular]         = [b.es_titular,         a.es_titular];
      [a.posicion_alineacion, b.posicion_alineacion] = [b.posicion_alineacion, a.posicion_alineacion];
      return siguiente;
    });
  };

  const manejarGuardado = async () => {
    if (!alineacion) return;
    setGuardando(true);
    try {
      await servicioAlineacion.guardar({
        partidoId:        idPartido,
        equipoId:         equipoSeleccionado,
        formacion,
        esRecomendacion:  true,
        jugadores:        jugadoresEditados,
      });
      toast.success(t('alineacion.saved'));
    } catch { /* manejado */ } finally { setGuardando(false); }
  };

  if (cargando) return <div className="loading-center"><div className="spinner" /></div>;
  if (!partido) return <div className="card text-center" style={{ padding: 48 }}>{t('alineacion.matchNotFound')} <Link to="/partidos">{t('alineacion.backToMatches')}</Link></div>;

  const equipoSeleccionadoObj  = equipos.find((eq) => eq.id === equipoSeleccionado);
  const esPartidoFinalizado    = partido.estado === 'finalizado';

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <div>
          <Link to="/partidos" className="text-sm text-muted" style={{ display: 'block', marginBottom: 8 }}>← {t('alineacion.backToMatches')}</Link>
          <h1 className="page-title">{t('alineacion.title')}</h1>
          <p className="page-subtitle">
            {partido.equipo_local?.nombre} <strong>{t('panel.vs')}</strong> {partido.equipo_visitante?.nombre}
            {partido.competicion && ` · ${partido.competicion}`}
            {' · '}
            {new Date(partido.fecha_partido).toLocaleDateString(i18n.language, { dateStyle: 'long' })}
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>{t('alineacion.configuration')}</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('alineacion.team')}</label>
            <select
              className="form-select"
              value={equipoSeleccionado}
              onChange={(e) => {
                setEquipoSeleccionado(e.target.value);
                const eq = equipos.find((eq2) => eq2.id === e.target.value);
                if (eq?.formacion) setFormacion(eq.formacion);
                setAlineacion(null);
                setJugadoresEditados([]);
              }}
            >
              {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('alineacion.formation')}</label>
            <select className="form-select" value={formacion} onChange={(e) => setFormacion(e.target.value)}>
              {FORMACIONES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          {!esPartidoFinalizado && (
            <button
              className="btn btn-primary btn-lg"
              onClick={manejarGeneracion}
              disabled={generando}
            >
              {generando
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {t('alineacion.generating')}</>
                : t('alineacion.generate')}
            </button>
          )}

          {alineacion && puedeGuardar && !esPartidoFinalizado && (
            <button className="btn btn-secondary btn-lg" onClick={manejarGuardado} disabled={guardando}>
              {guardando ? t('comun.saving') : t('alineacion.saveLineup')}
            </button>
          )}
        </div>
      </div>

      {/* Explicación del algoritmo */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '3px solid var(--primary)' }}>
        <h4 style={{ marginBottom: 10, color: 'var(--primary)' }}>{t('alineacion.scoringTitle')}</h4>
        <p className="text-sm text-muted">
          <Trans i18nKey="alineacion.scoringText" components={{ b: <strong /> }} />
        </p>
      </div>

      {/* Resultados */}
      {alineacion ? (
        <div>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-value">{jugadoresEditados.filter((j) => j.es_titular).length}</div>
              <div className="stat-label">{t('alineacion.starters')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{jugadoresEditados.filter((j) => !j.es_titular).length}</div>
              <div className="stat-label">{t('alineacion.bench')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{alineacion.puntuacion_media != null ? Number(alineacion.puntuacion_media).toFixed(1) : '—'}</div>
              <div className="stat-label">{t('alineacion.avgScore')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formacion}</div>
              <div className="stat-label">{t('alineacion.formation')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button className={`btn ${vista === 'campo' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setVista('campo')}>{t('alineacion.pitchView')}</button>
            <button className={`btn ${vista === 'lista' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setVista('lista')}>{t('alineacion.listView')}</button>
            {vista === 'campo' && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={exportarPNG} disabled={exportando}>{t('alineacion.exportPNG')}</button>
                <button className="btn btn-secondary btn-sm" onClick={exportarPDF} disabled={exportando}>{t('alineacion.exportPDF')}</button>
              </>
            )}
          </div>

          {vista === 'campo' ? (
            <div className="card" ref={refCampo}>
              <h3 style={{ marginBottom: 20 }}>
                {equipoSeleccionadoObj?.nombre} — {formacion}
              </h3>
              <MuestraAlineacion
                alineacion={{ ...alineacion, jugadores: jugadoresEditados }}
                formacion={formacion}
                alIntercambiar={manejarIntercambio}
              />
            </div>
          ) : (
            <div>
              <h3 style={{ marginBottom: 16 }}>{t('alineacion.startingXI')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 24 }}>
                {jugadoresEditados.filter((j) => j.es_titular).map((j, i) => (
                  <TarjetaJugador key={i} jugador={j} puntuacion={j.puntuacion_recomendacion} compacto />
                ))}
              </div>
              {jugadoresEditados.some((j) => !j.es_titular) && (
                <>
                  <h3 style={{ marginBottom: 16 }}>{t('alineacion.benchHeader')}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {jugadoresEditados.filter((j) => !j.es_titular).map((j, i) => (
                      <TarjetaJugador key={i} jugador={j} puntuacion={j.puntuacion_recomendacion} compacto />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center" style={{ padding: '64px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
          <p style={{ fontSize: '1.1rem' }}>
            <Trans i18nKey="alineacion.emptyHint" components={{ b: <strong /> }} />
          </p>
        </div>
      )}
    </div>
  );
}
