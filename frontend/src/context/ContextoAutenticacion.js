import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import servicioAutenticacion from '../services/autenticacion.servicio';

const ContextoAutenticacion = createContext(null);

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [cargando, setCargando] = useState(true);
  const navegar = useNavigate();

  useEffect(() => {
    const almacenado = localStorage.getItem('usuario');
    if (almacenado) {
      try { setUsuario(JSON.parse(almacenado)); } catch { /* ignorar */ }
    }
    setCargando(false);
  }, []);

  const iniciarSesion = useCallback(async (correo, contrasena) => {
    const datos = await servicioAutenticacion.iniciarSesion(correo, contrasena);
    setUsuario(datos.usuario);
    localStorage.setItem('usuario', JSON.stringify(datos.usuario));
    navegar('/panel');
  }, [navegar]);

  const cerrarSesion = useCallback(async () => {
    await servicioAutenticacion.cerrarSesion();
    setUsuario(null);
    localStorage.removeItem('usuario');
    navegar('/login');
  }, [navegar]);

  const valor = {
    usuario,
    cargando,
    iniciarSesion,
    cerrarSesion,
    estaAutenticado: !!usuario,
  };

  return (
    <ContextoAutenticacion.Provider value={valor}>
      {!cargando && children}
    </ContextoAutenticacion.Provider>
  );
}

export function usarAutenticacion() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ctx = useContext(ContextoAutenticacion);
  if (!ctx) throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion');
  return ctx;
}
