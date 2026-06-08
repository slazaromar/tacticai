import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import SelectorIdioma from '../components/SelectorIdioma';
import { toast } from 'react-toastify';

export default function InicioSesion() {
  const { iniciarSesion } = usarAutenticacion();
  const { t } = useTranslation();
  const [formulario, setFormulario] = useState({ correo: '', contrasena: '' });
  const [cargando, setCargando]     = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!formulario.correo || !formulario.contrasena) {
      toast.warning(t('autenticacion.fillAllFields'));
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(formulario.correo, formulario.contrasena);
    } catch (err) {
      toast.error(err.response?.data?.message || t('autenticacion.loginFailed'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 0%, rgba(129,140,248,0.08) 0%, transparent 60%), var(--bg)',
      padding: 24,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <SelectorIdioma />
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-1px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
          }}>TA</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {t('comun.appName')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.875rem' }}>
            {t('comun.tagline')}
          </p>
        </div>

        {/* Tarjeta login */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ marginBottom: 22, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('autenticacion.signIn')}
          </h2>

          <form onSubmit={manejarEnvio}>
            <div className="form-group">
              <label className="form-label">{t('autenticacion.email')}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t('autenticacion.emailPlaceholder')}
                value={formulario.correo}
                onChange={(e) => setFormulario({ ...formulario, correo: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('autenticacion.password')}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formulario.contrasena}
                onChange={(e) => setFormulario({ ...formulario, contrasena: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={cargando}
              style={{ marginTop: 4 }}
            >
              {cargando
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {t('autenticacion.signingIn')}</>
                : t('autenticacion.signIn')}
            </button>
          </form>

          <p className="text-xs text-muted text-center" style={{ marginTop: 18 }}>
            {t('autenticacion.demoCredentials')}
          </p>
        </div>
      </div>
    </div>
  );
}
