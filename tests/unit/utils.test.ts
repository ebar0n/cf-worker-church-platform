import { describe, it, expect } from 'vitest';
import { cn, genderLabel } from '@/lib/utils';

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
