import { describe, it, expect } from 'vitest';
import { nextService } from '@/lib/services';

// Instants are UTC; Bogotá is UTC-5 all year. 2026-10-14 is a Wednesday.
const at = (iso: string) => nextService(new Date(iso));

describe('nextService', () => {
  it('picks the prayer meeting later the same Wednesday', () => {
    expect(at('2026-10-14T23:00:00Z')).toEqual({
      when: 'Hoy 7:00 PM',
      name: 'Reunión de Oración',
    }); // 18:00 Bogotá
  });

  it('says Mañana for Sabbath School on Friday evening', () => {
    expect(at('2026-10-17T01:00:00Z')).toEqual({
      when: 'Mañana 9:30 AM',
      name: 'Escuela Sabática',
    }); // Friday 20:00 Bogotá, already Saturday in UTC
  });

  it('moves to the main service once Sabbath School has started', () => {
    expect(at('2026-10-17T14:45:00Z')).toEqual({ when: 'Hoy 11:00 AM', name: 'Culto Principal' });
  });

  it('counts a service starting this very minute', () => {
    expect(at('2026-10-17T16:00:00Z')).toEqual({ when: 'Hoy 11:00 AM', name: 'Culto Principal' });
  });

  it('wraps to Wednesday after the Saturday services', () => {
    expect(at('2026-10-17T18:00:00Z')).toEqual({
      when: 'Miércoles 7:00 PM',
      name: 'Reunión de Oración',
    });
  });

  it('names the weekday when it is more than a day away', () => {
    expect(at('2026-10-15T15:00:00Z')).toEqual({
      when: 'Sábado 9:30 AM',
      name: 'Escuela Sabática',
    }); // Thursday 10:00 Bogotá
  });
});
