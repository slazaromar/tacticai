import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuestraAlineacion from '../components/MuestraAlineacion';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const mkJugador = (id, posicion, esTitular = true) => ({
  id,
  nombre: `Jugador ${id}`,
  posicion,
  posicion_alineacion: posicion,
  rol_equipo: 'titular',
  puntuacion_recomendacion: 75,
  es_titular: esTitular,
  desglose_puntuacion: { forma: 30, rol: 21, contrato: 7, general: 14 },
});

const alineacion433 = {
  jugadores: [
    mkJugador('po', 'PO'),
    mkJugador('li', 'LI'),
    mkJugador('dfc1', 'DFC'),
    mkJugador('dfc2', 'DFC'),
    mkJugador('ld', 'LD'),
    mkJugador('mc1', 'MC'),
    mkJugador('mc2', 'MC'),
    mkJugador('mc3', 'MC'),
    mkJugador('ei', 'EI'),
    mkJugador('dc', 'DC'),
    mkJugador('ed', 'ED'),
    mkJugador('b1', 'SD', false),
    mkJugador('b2', 'DFC', false),
  ],
};

describe('MuestraAlineacion', () => {
  it('renderiza sin errores con alineación válida', () => {
    render(<MuestraAlineacion alineacion={alineacion433} formacion="4-3-3" />);
    // el componente muestra la última palabra del nombre en el label del slot
    const elementos = document.querySelectorAll('[style*="0.65rem"]');
    expect(elementos.length).toBeGreaterThan(0);
  });

  it('no renderiza nada sin alineación', () => {
    const { container } = render(<MuestraAlineacion alineacion={null} formacion="4-3-3" />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el banquillo', () => {
    render(<MuestraAlineacion alineacion={alineacion433} formacion="4-3-3" />);
    expect(screen.getByText('alineacion.benchHeader')).toBeInTheDocument();
  });

  it('los jugadores son arrastrables cuando se proporciona alIntercambiar', () => {
    const alIntercambiar = jest.fn();
    render(<MuestraAlineacion alineacion={alineacion433} formacion="4-3-3" alIntercambiar={alIntercambiar} />);
    const draggables = document.querySelectorAll('[draggable="true"]');
    expect(draggables.length).toBeGreaterThan(0);
  });

  it('los jugadores no son arrastrables sin alIntercambiar', () => {
    render(<MuestraAlineacion alineacion={alineacion433} formacion="4-3-3" />);
    const draggables = document.querySelectorAll('[draggable="true"]');
    expect(draggables.length).toBe(0);
  });
});
