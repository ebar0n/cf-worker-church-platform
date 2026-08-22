import { describe, it, expect } from 'vitest';
import { classify, calculateAge, isAdult, MIN_ADULT_AGE } from '@/lib/age-classification';

// Fixed reference date so tests never depend on the clock
const REF = new Date('2026-07-15T12:00:00Z');

const bornYearsAgo = (years: number) =>
  new Date(Date.UTC(REF.getUTCFullYear() - years, REF.getUTCMonth() - 1, 1));

describe('calculateAge', () => {
  it('subtracts a year when the birthday has not happened yet', () => {
    // Born August 1st, reference July 15th: still one year less
    const notYet = new Date('2020-08-01');
    expect(calculateAge(notYet, REF)).toBe(5);

    const already = new Date('2020-06-01');
    expect(calculateAge(already, REF)).toBe(6);
  });

  it('handles the exact birthday', () => {
    const today = new Date('2020-07-15');
    expect(calculateAge(today, REF)).toBe(6);
  });
});

describe('classify: categories per age', () => {
  const cases: Array<[number, string, string | null]> = [
    [0, 'Principiante', null],
    [3, 'Principiante', null],
    [4, 'Aventurero', 'Corderitos'],
    [5, 'Aventurero', 'Aves Madrugadoras'],
    [6, 'Aventurero', 'Abejas Industriosas'],
    [7, 'Aventurero', 'Rayos de Sol'],
    [8, 'Aventurero', 'Constructores'],
    [9, 'Aventurero', 'Manos Ayudadoras'],
    [10, 'Conquistador', 'Amigo'],
    [11, 'Conquistador', 'Compañero'],
    [12, 'Conquistador', 'Explorador'],
    [13, 'Conquistador', 'Orientador'],
    [14, 'Conquistador', 'Viajero'],
    [15, 'Conquistador', 'Guía'],
    [16, 'Guía Mayor', null],
    [25, 'Guía Mayor', null],
    [70, 'Guía Mayor', null],
  ];

  for (const [age, category, className] of cases) {
    it(`age ${age} -> ${category}${className ? ` / ${className}` : ''}`, () => {
      const result = classify(bornYearsAgo(age), REF);
      expect(result.age).toBe(age);
      expect(result.category).toBe(category);
      expect(result.className).toBe(className);
    });
  }
});

describe('classify: boundaries move with the birthday, not the calendar year', () => {
  it('a child is Manos Ayudadoras until the very day they turn 10', () => {
    // Local-component dates: age math uses local getters, so ISO strings
    // (parsed as UTC midnight) would shift a day depending on the timezone
    const birth = new Date(2016, 6, 16); // July 16th
    const dayBefore = new Date(2026, 6, 15, 12);
    const birthday = new Date(2026, 6, 16, 12);

    expect(classify(birth, dayBefore).category).toBe('Aventurero');
    expect(classify(birth, dayBefore).className).toBe('Manos Ayudadoras');
    expect(classify(birth, birthday).category).toBe('Conquistador');
    expect(classify(birth, birthday).className).toBe('Amigo');
  });
});

describe('classify: input handling', () => {
  it('accepts ISO strings (how D1 stores birthDate)', () => {
    const result = classify('2020-01-10T00:00:00.000Z', REF);
    expect(result.category).toBe('Aventurero');
    expect(result.className).toBe('Abejas Industriosas');
  });

  it('throws on invalid dates', () => {
    expect(() => classify('no-es-fecha', REF)).toThrow('Invalid birthDate');
  });
});

describe('isAdult', () => {
  it(`requires ${MIN_ADULT_AGE} years to create a group`, () => {
    expect(isAdult(bornYearsAgo(15), REF)).toBe(false);
    expect(isAdult(bornYearsAgo(16), REF)).toBe(true);
  });
});
