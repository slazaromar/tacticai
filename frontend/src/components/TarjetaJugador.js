import React from 'react';
import { useTranslation } from 'react-i18next';

const INSIGNIA_ROL = {
  titular:  'badge-green',
  rotacion: 'badge-yellow',
  reserva:  'badge-gray',
  cantera:  'badge-blue',
};

const COLOR_FORMA = (valoracion) => {
  const v = Number(valoracion);
  if (v >= 8) return '#22c55e';
  if (v >= 6) return '#f59e0b';
  return '#ef4444';
};

export default function TarjetaJugador({ jugador, puntuacion, compacto = false }) {
  const { t, i18n } = useTranslation();
  if (!jugador) return null;

  const inicial = jugador.nombre ? jugador.nombre[0].toUpperCase() : '?';

  return (
    <div className="card" style={{ padding: compacto ? '12px 14px' : '18px', position: 'relative' }}>
      {jugador.esta_lesionado  && <span className="badge badge-red"    style={{ position: 'absolute', top: 10, right: 10 }}>{t('tarjetaJugador.lesionado')}</span>}
      {jugador.esta_sancionado && <span className="badge badge-yellow" style={{ position: 'absolute', top: 10, right: 10 }}>{t('tarjetaJugador.sancionado')}</span>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: compacto ? 34 : 46, height: compacto ? 34 : 46,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compacto ? '0.9rem' : '1.1rem',
          fontWeight: 700, color: '#fff',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
        }}>{inicial}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: compacto ? '0.85rem' : '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {jugador.nombre}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{t(`jugadores.positionsShort.${jugador.posicion}`, jugador.posicion)}</span>
            <span className={`badge ${INSIGNIA_ROL[jugador.rol_equipo] || 'badge-gray'}`}>
              {t(`jugadores.roles.${jugador.rol_equipo}`, jugador.rol_equipo)}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: compacto ? '1.05rem' : '1.3rem', fontWeight: 700, color: COLOR_FORMA(jugador.puntuacion_forma) }}>
            {jugador.puntuacion_forma != null ? Number(jugador.puntuacion_forma).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-muted">{t('tarjetaJugador.forma')}</div>
        </div>
      </div>

      {puntuacion !== undefined && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span className="text-xs text-muted">{t('tarjetaJugador.puntuacionRecomendacion')}</span>
            <span className="text-xs font-semibold" style={{ color: COLOR_FORMA(puntuacion / 10) }}>
              {Number(puntuacion).toFixed(1)}
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--border-light)', borderRadius: 4 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(puntuacion, 100)}%`,
              background: `linear-gradient(90deg, ${COLOR_FORMA(puntuacion / 10)}, ${COLOR_FORMA(puntuacion / 10)}88)`,
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>

          {jugador.desglose_puntuacion && (
            <div style={{ marginTop: 10 }}>
              <span className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>
                {t('tarjetaJugador.desglose')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                {['forma', 'rol', 'contrato', 'general'].map((factor) => {
                  const val = jugador.desglose_puntuacion[factor] ?? 0;
                  return (
                    <div key={factor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-xs text-muted">{t(`tarjetaJugador.factoresPuntuacion.${factor}`)}</span>
                      <span className="text-xs font-semibold" style={{ color: COLOR_FORMA(val / 10) }}>
                        +{val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!compacto && (
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {jugador.edad               && <span>{jugador.edad} {t('tarjetaJugador.anos')}</span>}
          {jugador.nacionalidad       && <span>{jugador.nacionalidad}</span>}
          {jugador.puntuacion_general && <span>{jugador.puntuacion_general} {t('tarjetaJugador.val')}</span>}
          {jugador.contrato_hasta && (
            <span>{t('tarjetaJugador.hasta')} {new Date(jugador.contrato_hasta).toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          )}
        </div>
      )}
    </div>
  );
}
