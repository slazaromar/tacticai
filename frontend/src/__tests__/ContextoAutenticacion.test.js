import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ProveedorAutenticacion, usarAutenticacion } from '../context/ContextoAutenticacion';

jest.mock('../services/autenticacion.servicio', () => ({
  default: {
    iniciarSesion: jest.fn(),
    cerrarSesion:  jest.fn(),
  },
}));

const Consumidor = () => {
  const { usuario, estaAutenticado } = usarAutenticacion();
  return (
    <div>
      <span data-testid="autenticado">{estaAutenticado ? 'si' : 'no'}</span>
      <span data-testid="usuario">{usuario?.nombre_usuario || 'ninguno'}</span>
    </div>
  );
};

describe('ContextoAutenticacion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usuario null y no autenticado por defecto', async () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <ProveedorAutenticacion><Consumidor /></ProveedorAutenticacion>
      </MemoryRouter>
    );
    await waitFor(() => expect(getByTestId('autenticado').textContent).toBe('no'));
    expect(getByTestId('usuario').textContent).toBe('ninguno');
  });

  it('restaura sesión desde localStorage', async () => {
    localStorage.setItem('usuario', JSON.stringify({ id: '1', nombre_usuario: 'entrenador_demo', rol: 'entrenador' }));
    const { getByTestId } = render(
      <MemoryRouter>
        <ProveedorAutenticacion><Consumidor /></ProveedorAutenticacion>
      </MemoryRouter>
    );
    await waitFor(() => expect(getByTestId('autenticado').textContent).toBe('si'));
    expect(getByTestId('usuario').textContent).toBe('entrenador_demo');
  });
});
