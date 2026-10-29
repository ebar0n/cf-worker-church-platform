import { describe, it, expect } from 'vitest';
import { cn, formatEventDate, formatEventTime, genderLabel } from '@/lib/utils';

describe('cn', () => {
  it('merges conditional classes and resolves tailwind conflicts', () => {
    expect(cn('p-2', false && 'hidden', 'p-4')).toBe('p-4');
    expect(cn('text-sm', undefined, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('genderLabel', () => {
  it('labels both stored spellings and falls back for missing values', () => {
    expect(genderLabel('M')).toBe('Masculino');
    expect(genderLabel('male')).toBe('Masculino');
    expect(genderLabel('F')).toBe('Femenino');
    expect(genderLabel('female')).toBe('Femenino');
    expect(genderLabel(null)).toBe('No especificado');
    expect(genderLabel('')).toBe('No especificado');
  });
});

describe('program event formatting', () => {
  it('formats the stored date without shifting the day', () => {
    expect(formatEventDate('2026-11-15')).toBe('domingo, 15 de noviembre de 2026');
  });

  it('formats 24h times as 12h with a. m./p. m.', () => {
    expect(formatEventTime('00:05')).toBe('12:05 a. m.');
    expect(formatEventTime('09:30')).toBe('9:30 a. m.');
    expect(formatEventTime('12:00')).toBe('12:00 p. m.');
    expect(formatEventTime('19:00')).toBe('7:00 p. m.');
  });
});
