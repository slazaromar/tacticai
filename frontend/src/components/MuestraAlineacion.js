import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const POSICIONES_FORMACION = {
  '4-3-3': [
    { pos: 'PO',  x: 50, y: 92 },
    { pos: 'LI',  x: 10, y: 72 },
    { pos: 'DFC', x: 35, y: 76 },
    { pos: 'DFC', x: 65, y: 76 },
    { pos: 'LD',  x: 90, y: 72 },
    { pos: 'MC',  x: 20, y: 52 },
    { pos: 'MC',  x: 50, y: 48 },
    { pos: 'MC',  x: 80, y: 52 },
    { pos: 'EI',  x: 15, y: 24 },
    { pos: 'DC',  x: 50, y: 20 },
    { pos: 'ED',  x: 85, y: 24 },
  ],
  '4-4-2': [
    { pos: 'PO',  x: 50, y: 92 },
    { pos: 'LI',  x: 10, y: 72 },
    { pos: 'DFC', x: 35, y: 76 },
    { pos: 'DFC', x: 65, y: 76 },
    { pos: 'LD',  x: 90, y: 72 },
    { pos: 'MI',  x: 10, y: 50 },
    { pos: 'MC',  x: 35, y: 52 },
    { pos: 'MC',  x: 65, y: 52 },
    { pos: 'MD',  x: 90, y: 50 },
    { pos: 'DC',  x: 35, y: 22 },
    { pos: 'DC',  x: 65, y: 22 },
  ],
  '4-2-3-1': [
    { pos: 'PO',  x: 50, y: 92 },
    { pos: 'LI',  x: 10, y: 72 },
    { pos: 'DFC', x: 35, y: 76 },
    { pos: 'DFC', x: 65, y: 76 },
    { pos: 'LD',  x: 90, y: 72 },
    { pos: 'MCD', x: 35, y: 58 },
    { pos: 'MCD', x: 65, y: 58 },
    { pos: 'MI',  x: 15, y: 38 },
    { pos: 'MCO', x: 50, y: 36 },
    { pos: 'MD',  x: 85, y: 38 },
    { pos: 'DC',  x: 50, y: 16 },
  ],
  '3-5-2': [
    { pos: 'PO',  x: 50, y: 92 },
    { pos: 'DFC', x: 25, y: 76 },
    { pos: 'DFC', x: 50, y: 78 },
    { pos: 'DFC', x: 75, y: 76 },
    { pos: 'MI',  x: 10, y: 50 },
    { pos: 'MC',  x: 30, y: 52 },
    { pos: 'MC',  x: 50, y: 48 },
    { pos: 'MC',  x: 70, y: 52 },
    { pos: 'MD',  x: 90, y: 50 },
    { pos: 'DC',  x: 35, y: 22 },
    { pos: 'DC',  x: 65, y: 22 },
  ],
  '5-3-2': [
    { pos: 'PO',  x: 50, y: 92 },
    { pos: 'LI',  x: 10, y: 72 },
    { pos: 'DFC', x: 28, y: 78 },
    { pos: 'DFC', x: 50, y: 80 },
    { pos: 'DFC', x: 72, y: 78 },
    { pos: 'LD',  x: 90, y: 72 },
    { pos: 'MC',  x: 25, y: 50 },
    { pos: 'MC',  x: 50, y: 48 },
    { pos: 'MC',  x: 75, y: 50 },
    { pos: 'DC',  x: 35, y: 22 },
    { pos: 'DC',  x: 65, y: 22 },
  ],
};

const colorPuntuacion = (p) => {
  if (!p) return '#94a3b8';
  if (p >= 75) return '#22c55e';
  if (p >= 55) return '#f59e0b';
  return '#ef4444';
};

export default function MuestraAlineacion({ alineacion, formacion = '4-3-3', alIntercambiar }) {
  const { t } = useTranslation();
  const [idArrastrando, setIdArrastrando] = useState(null);
  const [idSobre, setIdSobre]             = useState(null);

  if (!alineacion?.jugadores) return null;

  const titulares = alineacion.jugadores.filter((j) => j.es_titular);
  const banquillo = alineacion.jugadores.filter((j) => !j.es_titular);
  const posiciones = POSICIONES_FORMACION[formacion] || POSICIONES_FORMACION['4-3-3'];

  // Asignación por posicion_alineacion: cada slot busca el titular cuyo slot coincide,
  // usando un Set para manejar duplicados (ej: dos DFC).
  const asignados = new Set();
  const posicionados = posiciones.map((pos) => {
    const j = titulares.find(
      (t) => t.posicion_alineacion === pos.pos && !asignados.has(t.id)
    );
    if (j) asignados.add(j.id);
    return { ...pos, jugador: j || null };
  });

  const iniciarArrastre = (e, id) => {
    e.dataTransfer.effectAllowed = 'move';
    setIdArrastrando(id);
  };
  const terminarArrastre = () => { setIdArrastrando(null); setIdSobre(null); };
  const sobreObjetivo    = (e, id) => { e.preventDefault(); setIdSobre(id); };
  const salirObjetivo    = ()      => setIdSobre(null);
  const soltar           = (e, id) => {
    e.preventDefault();
    if (idArrastrando && id && idArrastrando !== id && alIntercambiar) alIntercambiar(idArrastrando, id);
    setIdArrastrando(null);
    setIdSobre(null);
  };

  const esObjetivo = (id) => idSobre === id && idArrastrando && idArrastrando !== id;

  return (
    <div>
      <div className="pitch" style={{ height: 480, marginBottom: 24 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect x="1"  y="1"  width="98" height="98" fill="none" stroke="rgba(255,255,255,0.3)"  strokeWidth="0.4" />
          <line x1="0" y1="50" x2="100" y2="50"      stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="12" fill="none"  stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <rect x="25" y="80" width="50" height="18"  fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <rect x="37" y="90" width="26" height="10"  fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <rect x="25" y="2"  width="50" height="18"  fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
          <rect x="37" y="0"  width="26" height="10"  fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
        </svg>

        {posicionados.map((pos, idx) => {
          const j       = pos.jugador;
          const esOver  = j && esObjetivo(j.id);
          const arrastre = j && idArrastrando === j.id;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 1,
                cursor: alIntercambiar && j ? 'grab' : 'default',
                opacity: arrastre ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}
              draggable={!!(alIntercambiar && j)}
              onDragStart={(e) => j && iniciarArrastre(e, j.id)}
              onDragEnd={terminarArrastre}
              onDragOver={(e) => j && sobreObjetivo(e, j.id)}
              onDragLeave={salirObjetivo}
              onDrop={(e) => j && soltar(e, j.id)}
            >
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: j ? colorPuntuacion(j.puntuacion_recomendacion) : 'rgba(255,255,255,0.15)',
                border: `2px solid ${esOver ? '#fff' : 'rgba(255,255,255,0.6)'}`,
                boxShadow: esOver ? '0 0 0 3px rgba(255,255,255,0.7)' : j ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', margin: '0 auto',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}>
                {j ? j.nombre?.split(' ').pop()?.slice(0, 3).toUpperCase() : '+'}
              </div>
              <div style={{ fontSize: '0.65rem', marginTop: 3, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {j ? j.nombre?.split(' ').pop() : pos.pos}
              </div>
              {j?.puntuacion_recomendacion != null && (
                <div style={{ fontSize: '0.6rem', color: colorPuntuacion(j.puntuacion_recomendacion), fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {Number(j.puntuacion_recomendacion).toFixed(0)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {banquillo.length > 0 && (
        <div>
          <h4 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>{t('alineacion.benchHeader')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {banquillo.map((j, i) => {
              const esOver  = esObjetivo(j.id);
              const arrastre = idArrastrando === j.id;
              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '10px 14px',
                    cursor: alIntercambiar ? 'grab' : 'default',
                    opacity: arrastre ? 0.45 : 1,
                    outline: esOver ? '2px solid var(--primary)' : 'none',
                    transition: 'outline 0.1s, opacity 0.15s',
                  }}
                  draggable={!!alIntercambiar}
                  onDragStart={(e) => iniciarArrastre(e, j.id)}
                  onDragEnd={terminarArrastre}
                  onDragOver={(e) => sobreObjetivo(e, j.id)}
                  onDragLeave={salirObjetivo}
                  onDrop={(e) => soltar(e, j.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{j.nombre}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {j.posicion}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
