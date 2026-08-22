import { describe, it, expect } from 'vitest';
import {
  SURVEY_BLOCKS,
  SURVEY_FIELDS,
  BOOLEAN_FIELDS,
  emptySurveyValues,
  normalizeSurveyPayload,
  rowToFormValues,
} from '@/lib/health-survey';

describe('survey definition', () => {
  it('has unique field names across every block', () => {
    expect(new Set(SURVEY_FIELDS).size).toBe(SURVEY_FIELDS.length);
  });

  it('asks the open neighborhood questions before the contact data', () => {
    const titles = SURVEY_BLOCKS.map((b) => b.title);
    expect(titles.indexOf('Su barrio')).toBeLessThan(titles.indexOf('Datos de contacto'));
  });

  it('requires the name and the phone', () => {
    const required = SURVEY_BLOCKS.flatMap((b) => b.questions)
      .filter((q) => q.required)
      .map((q) => q.field);
    expect(required).toEqual(['name', 'phone']);
  });
});

describe('normalizeSurveyPayload', () => {
  it('rejects a payload without a name', () => {
    const { errors } = normalizeSurveyPayload({ phone: '3001234567' });
    expect(errors).toEqual(['Nombre es requerido']);
  });

  it('rejects a payload without a phone', () => {
    const { errors } = normalizeSurveyPayload({ name: 'Ana' });
    expect(errors).toEqual(['Teléfono es requerido']);
  });

  it('stores checks as 0/1 and keeps unanswered yes/no as null', () => {
    const { values, errors } = normalizeSurveyPayload({
      name: 'Ana',
      phone: '3001234567',
      hasDiabetes: true,
      drinksWater: false,
      exercises: true,
    });

    expect(errors).toEqual([]);
    expect(values.hasDiabetes).toBe(1);
    expect(values.hasDepression).toBe(0);
    expect(values.drinksWater).toBe(0);
    expect(values.exercises).toBe(1);
    expect(values.sleepsEightHours).toBeNull();
  });

  it('trims text and turns blanks into null', () => {
    const { values } = normalizeSurveyPayload({
      name: '  Ana Pérez  ',
      phone: ' 3001234567 ',
      neighborhood: '   ',
      neighborhoodIssue: ' Falta de agua ',
    });

    expect(values.name).toBe('Ana Pérez');
    expect(values.phone).toBe('3001234567');
    expect(values.neighborhood).toBeNull();
    expect(values.neighborhoodIssue).toBe('Falta de agua');
  });

  it('drops unknown keys so form state can be posted as-is', () => {
    const { values } = normalizeSurveyPayload({
      name: 'Ana',
      phone: '3001234567',
      id: 7,
      capturedBy: 'x@y.z',
    });
    expect(Object.keys(values).sort()).toEqual([...SURVEY_FIELDS].sort());
  });
});

describe('round trip through the form', () => {
  it('maps a stored row back to form values', () => {
    const row = {
      hasDiabetes: 1,
      hasOverweight: 0,
      familyHistory: null,
      drinksWater: 1,
      exercises: 0,
      name: 'Ana',
      phone: null,
    };

    const values = rowToFormValues(row);
    expect(values.hasDiabetes).toBe(true);
    expect(values.hasOverweight).toBe(false);
    expect(values.familyHistory).toBeNull();
    expect(values.drinksWater).toBe(true);
    expect(values.exercises).toBe(false);
    expect(values.name).toBe('Ana');
    expect(values.phone).toBe('');
  });

  it('normalizes an empty form to nothing checked and nothing answered', () => {
    const { values } = normalizeSurveyPayload({
      ...emptySurveyValues(),
      name: 'Ana',
      phone: '3001234567',
    });

    for (const field of BOOLEAN_FIELDS) {
      expect(values[field], field).not.toBe(1);
    }
    expect(values.familyHistory).toBeNull();
    expect(values.hasDiabetes).toBe(0);
  });
});
