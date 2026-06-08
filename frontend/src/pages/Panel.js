import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function Panel() {
  const { t, i18n } = useTranslation();
  const [estadisticas, setEstadisticas] = useState(null);
  const [partidos, setPartidos]         = useState([]);
  const [cargando, setCargando]         = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/jugadores?limite=1').then((r) => r.data.total),
      api.get('/equipos?limite=1').then((r) => r.data.total),
      api.get('/partidos?estado=programado&limite=5').then((r) => r.data),
    ])
      .then(([totalJugadores, totalEquipos, datosPartidos]) => {
        setEstadisticas({ jugadores: totalJugadores, equipos: totalEquipos });
        setPartidos(datosPartidos.datos || []);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('panel.title')}</h1>
          <p className="page-subtitle">{t('panel.subtitle')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': '#22c55e' }}>
          <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: 6, fontWeight: 600 }}>{t('panel.totalPlayers').toUpperCase()}</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{estadisticas?.jugadores ?? '—'}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#818cf8' }}>
          <div style={{ fontSize: '0.75rem', color: '#818cf8', marginBottom: 6, fontWeight: 600 }}>{t('panel.teams').toUpperCase()}</div>
          <div className="stat-value" style={{ color: '#818cf8' }}>{estadisticas?.equipos ?? '—'}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': '#38bdf8' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: 6, fontWeight: 600 }}>{t('panel.upcomingMatches').toUpperCase()}</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{partidos.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{t('panel.upcomingTitle')}</h2>
          <Link to="/partidos" className="btn btn-secondary btn-sm">{t('comun.viewAll')}</Link>
        </div>

        {partidos.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '32px 0' }}>{t('panel.noUpcoming')}</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('panel.th.date')}</th>
                  <th>{t('panel.th.match')}</th>
                  <th>{t('panel.th.competition')}</th>
                  <th>{t('panel.th.status')}</th>
                  <th>{t('panel.th.action')}</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((p) => (
                  <tr key={p.id}>
                    <td className="text-sm text-muted">
                      {new Date(p.fecha_partido).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {p.equipo_local?.nombre} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> {t('panel.vs')} </span> {p.equipo_visitante?.nombre}
                    </td>
                    <td className="text-sm text-muted">{p.competicion}</td>
                    <td>
                      <span className={`badge ${p.estado === 'programado' ? 'badge-blue' : p.estado === 'finalizado' ? 'badge-green' : 'badge-gray'}`}>
                        {t(`partidos.status.${p.estado}`, p.estado)}
                      </span>
                    </td>
                    <td>
                      <Link to={`/alineacion/${p.id}`} className="btn btn-primary btn-sm">
                        {t('panel.getLineup')}
                      </Link>
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
