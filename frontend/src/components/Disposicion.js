import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import SelectorIdioma from './SelectorIdioma';
import estilos from './Disposicion.module.css';
import DashboardIcon   from '@mui/icons-material/Dashboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PeopleIcon      from '@mui/icons-material/People';
import GroupsIcon      from '@mui/icons-material/Groups';
import EmailIcon       from '@mui/icons-material/Email';

export default function Disposicion() {
  const { usuario, cerrarSesion } = usarAutenticacion();
  const { t } = useTranslation();
  const [menuAbierto, setMenuAbierto] = useState(true);

  const elementosNavegacion = [
    { to: '/panel',        label: t('navegacion.panel'),        icon: <DashboardIcon    fontSize="small" />, roles: null },
    { to: '/partidos',     label: t('navegacion.partidos'),     icon: <SportsSoccerIcon fontSize="small" />, roles: null },
    { to: '/jugadores',    label: t('navegacion.jugadores'),    icon: <PeopleIcon       fontSize="small" />, roles: null },
    { to: '/equipos',      label: t('navegacion.equipos'),      icon: <GroupsIcon       fontSize="small" />, roles: null },
    { to: '/invitaciones', label: t('navegacion.invitaciones'), icon: <EmailIcon        fontSize="small" />, roles: ['admin','entrenador'] },
  ].filter(({ roles }) => !roles || roles.includes(usuario?.rol));

  return (
    <div className={estilos.shell}>
      {/* sidebar */}
      <aside className={`${estilos.sidebar} ${menuAbierto ? '' : estilos.collapsed}`}>
        <div className={estilos.sidebarLogo}>
          <span className={estilos.logoIcon} style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>TA</span>
          {menuAbierto && <span className={estilos.logoText}>{t('comun.appName')}</span>}
        </div>

        <nav className={estilos.nav}>
          {elementosNavegacion.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${estilos.navItem} ${isActive ? estilos.navItemActive : ''}`
              }
            >
              <span className={estilos.navIcon}>{icon}</span>
              {menuAbierto && <span className={estilos.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          className={estilos.toggleBtn}
          onClick={() => setMenuAbierto((v) => !v)}
          title={t('navegacion.alternarBarra')}
        >
          {menuAbierto ? '◀' : '▶'}
        </button>
      </aside>

      {/* contenido principal */}
      <div className={estilos.main}>
        {/* Barra superior */}
        <header className={estilos.topbar}>
          <div />
          <div className={estilos.userArea}>
            <SelectorIdioma />
            <button className="btn btn-secondary btn-sm" onClick={cerrarSesion}>
              {t('comun.signOut')}
            </button>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className={estilos.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
