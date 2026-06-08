import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TarjetaJugador from '../components/TarjetaJugador';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es' },
  }),
}));

const jugadorBase = {
  id: 'j1',
  nombre: 'Lamine Yamal',
  posicion: 'ED',
  rol_equipo: 'titular',
  puntuacion_forma: 9.1,
  puntuacion_general: 87,
  edad: 18,
  nacionalidad: 'Española',
  contrato_hasta: '2031-06-30',
  esta_lesionado: false,
  esta_sancionado: false,
};

describe('TarjetaJugador', () => {
  it('renderiza el nombre del jugador', () => {
    render(<TarjetaJugador jugador={jugadorBase} />);
    expect(screen.getByText('Lamine Yamal')).toBeInTheDocument();
  });

  it('muestra badge de lesionado cuando esta_lesionado es true', () => {
    render(<TarjetaJugador jugador={{ ...jugadorBase, esta_lesionado: true }} />);
    expect(screen.getByText('tarjetaJugador.lesionado')).toBeInTheDocument();
  });

  it('muestra badge de sancionado cuando esta_sancionado es true', () => {
    render(<TarjetaJugador jugador={{ ...jugadorBase, esta_sancionado: true }} />);
    expect(screen.getByText('tarjetaJugador.sancionado')).toBeInTheDocument();
  });

  it('no muestra badge de lesionado para jugadores disponibles', () => {
    render(<TarjetaJugador jugador={jugadorBase} />);
    expect(screen.queryByText('tarjetaJugador.lesionado')).not.toBeInTheDocument();
  });

  it('muestra la puntuación de recomendación cuando se proporciona', () => {
    render(<TarjetaJugador jugador={jugadorBase} puntuacion={82.5} />);
    expect(screen.getByText(/82/)).toBeInTheDocument();
  });

  it('muestra desglose de puntuación cuando está disponible', () => {
    const jugadorConDesglose = {
      ...jugadorBase,
      desglose_puntuacion: { forma: 36.4, rol: 30.0, contrato: 9.5, general: 17.4 },
    };
    render(<TarjetaJugador jugador={jugadorConDesglose} puntuacion={93.3} />);
    expect(screen.getByText('tarjetaJugador.desglose')).toBeInTheDocument();
  });

  it('renderiza en modo compacto sin errores', () => {
    render(<TarjetaJugador jugador={jugadorBase} compacto />);
    expect(screen.getByText('Lamine Yamal')).toBeInTheDocument();
  });
});
