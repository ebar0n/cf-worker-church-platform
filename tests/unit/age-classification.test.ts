import { describe, it, expect } from 'vitest';
import { classify, calculateAge, isAdult, MIN_ADULT_AGE } from '@/lib/age-classification';

// Fixed reference date so tests never depend on the clock
const REF = new Date('2026-07-15T12:00:00Z');

// Born January 1st: same age at the March 31 class cutoff and at REF
const bornYearsAgo = (years: number) => new Date(REF.getFullYear() - years, 0, 1);

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

describe('classify: class follows the age completed by March 31', () => {
  it('keeps the class all year when the birthday falls after March 31', () => {
    const birth = new Date(2016, 6, 16); // July 16th: 9 on March 31, 2026
    const birthday = classify(birth, new Date(2026, 6, 16, 12));
    expect(birthday.age).toBe(10);
    expect(birthday.className).toBe('Manos Ayudadoras');
    expect(classify(birth, new Date(2026, 11, 31, 12)).className).toBe('Manos Ayudadoras');
    // The next club year starts on January 1st
    expect(classify(birth, new Date(2027, 0, 1, 12)).className).toBe('Amigo');
  });

  it('counts first-quarter birthdays from January 1st', () => {
    const birth = new Date(2019, 2, 31); // March 31st: 7 on the cutoff
    const january = classify(birth, new Date(2026, 0, 15, 12));
    expect(january.age).toBe(6);
    expect(january.className).toBe('Rayos de Sol');
    // April 1st already misses the cutoff
    expect(classify(new Date(2019, 3, 1), new Date(2026, 6, 15, 12)).className).toBe(
      'Abejas Industriosas'
    );
  });
});

describe('classify: input handling', () => {
  it('accepts ISO strings (how D1 stores birthDate)', () => {
    const result = classify('2020-01-10T00:00:00.000Z', REF);
    expect(result.category).toBe('Aventurero');
    expect(result.className).toBe('Abejas Industriosas');
  });

  it('reads date-only strings as calendar dates in any timezone', () => {
    // On the birthday itself the age must already count, even in UTC-5
    expect(classify('2020-07-15', new Date(2026, 6, 15, 0, 30)).age).toBe(6);
    expect(classify('2020-07-15T00:00:00.000Z', new Date(2026, 6, 15, 0, 30)).age).toBe(6);
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
