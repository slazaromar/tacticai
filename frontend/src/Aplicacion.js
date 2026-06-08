import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProveedorAutenticacion } from './context/ContextoAutenticacion';
import RutaProtegida   from './components/RutaProtegida';
import Disposicion     from './components/Disposicion';

import InicioSesion             from './pages/InicioSesion';
import Panel                    from './pages/Panel';
import Jugadores                from './pages/Jugadores';
import Equipos                  from './pages/Equipos';
import Partidos                 from './pages/Partidos';
import RecomendacionAlineacion  from './pages/RecomendacionAlineacion';
import Invitaciones             from './pages/Invitaciones';
import AceptarInvitacion        from './pages/AceptarInvitacion';
import NoEncontrado             from './pages/NoEncontrado';

export default function Aplicacion() {
  return (
    <BrowserRouter>
      <ProveedorAutenticacion>
        <Routes>
          {/* Pública */}
          <Route path="/login"   element={<InicioSesion />} />
          <Route path="/registro" element={<AceptarInvitacion />} />

          {/* Protegidas */}
          <Route element={<RutaProtegida />}>
            <Route element={<Disposicion />}>
              <Route path="/"          element={<Navigate to="/panel" replace />} />
              <Route path="/panel"     element={<Panel />} />
              <Route path="/jugadores" element={<Jugadores />} />
              <Route path="/equipos"   element={<Equipos />} />
              <Route path="/partidos"  element={<Partidos />} />
              <Route path="/alineacion/:idPartido" element={<RecomendacionAlineacion />} />
              <Route path="/invitaciones"        element={<Invitaciones />} />
            </Route>
          </Route>

          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </ProveedorAutenticacion>
    </BrowserRouter>
  );
}
