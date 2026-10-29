import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Invitation, { EVENT_START, countdown } from '@/app/todo-nuevo/components/Invitation';

const HOUR = 3_600_000;

describe('Todo Nuevo invitation', () => {
  afterEach(() => vi.useRealTimers());

  it('opens the ticket to show the countdown and directions', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(EVENT_START - 25 * HOUR - 2 * 60_000 - 3_000);
    render(<Invitation />);

    expect(screen.queryByRole('link', { name: 'Cómo llegar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir la invitación' }));

    expect(screen.getByText('Mañana, viernes 30 de octubre, a las 7:00 p.m.')).toBeDefined();
    expect(screen.getByRole('timer').textContent).toBe('01día01horas02minutos03segundos');
    expect(screen.getByRole('link', { name: 'Cómo llegar' }).getAttribute('href')).toContain(
      'google.com/maps'
    );
  });

  it('follows the event day in Bogotá time', () => {
    expect(countdown(EVENT_START - 2 * HOUR)).toMatchObject({
      phase: 'before',
      title: 'Hoy, viernes 30 de octubre, a las 7:00 p.m.',
    });
    expect(countdown(EVENT_START - 3 * 24 * HOUR)).toMatchObject({ phase: 'before' });
    expect(countdown(EVENT_START - 3 * 24 * HOUR)).toHaveProperty(
      'title',
      'El viernes 30 de octubre, a las 7:00 p.m.'
    );
    expect(countdown(EVENT_START + HOUR)).toEqual({ phase: 'live' });
    expect(countdown(EVENT_START + 3 * HOUR)).toEqual({ phase: 'over' });
  });
});
