import { describe, it, expect } from 'vitest';
import {
  CONSENT_FIELD,
  DEPENDENTS,
  SURVEY_BLOCKS,
  summarizeSurveys,
  surveysToCsv,
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

describe('follow-up questions', () => {
  it('hangs each "¿Cuál?" off the yes/no above it', () => {
    expect(DEPENDENTS).toEqual({
      familyHistory: ['familyHistoryDetail'],
      attendsCheckups: ['checkupsDetail'],
    });
  });

  it('keeps a follow-up when its parent is "Sí"', () => {
    const { values } = normalizeSurveyPayload({
      name: 'Ana',
      phone: '3001234567',
      familyHistory: true,
      familyHistoryDetail: 'Diabetes de la madre',
    });
    expect(values.familyHistoryDetail).toBe('Diabetes de la madre');
  });

  it('drops a follow-up when its parent is "No" or unanswered', () => {
    const answeredNo = normalizeSurveyPayload({
      name: 'Ana',
      phone: '3001234567',
      familyHistory: false,
      familyHistoryDetail: 'Diabetes',
      checkupsDetail: 'Glucosa',
    }).values;

    expect(answeredNo.familyHistoryDetail).toBeNull();
    // attendsCheckups was never answered, so its detail goes too
    expect(answeredNo.checkupsDetail).toBeNull();
  });
});

describe('normalizeSurveyPayload', () => {
  const consented = { [CONSENT_FIELD]: true };

  it('rejects a payload without a name', () => {
    const { errors } = normalizeSurveyPayload({ phone: '3001234567', ...consented });
    expect(errors).toEqual(['Nombre es requerido']);
  });

  it('rejects a payload without a phone', () => {
    const { errors } = normalizeSurveyPayload({ name: 'Ana', ...consented });
    expect(errors).toEqual(['Teléfono es requerido']);
  });

  it('refuses to store anything without the Ley 1581 consent', () => {
    for (const consent of [undefined, false, null]) {
      const { errors } = normalizeSurveyPayload({
        name: 'Ana',
        phone: '3001234567',
        [CONSENT_FIELD]: consent,
      });
      expect(errors, String(consent)).toEqual([
        'Debe autorizar el tratamiento de datos para guardar la encuesta',
      ]);
    }
  });

  it('stores checks as 0/1 and keeps unanswered yes/no as null', () => {
    const { values, errors } = normalizeSurveyPayload({
      name: 'Ana',
      phone: '3001234567',
      [CONSENT_FIELD]: true,
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

describe('age', () => {
  it('parses the age the form posts as a string', () => {
    const { values } = normalizeSurveyPayload({ name: 'Ana', phone: '3001234567', age: '34' });
    expect(values.age).toBe(34);
  });

  it('drops a blank, negative or impossible age instead of storing it', () => {
    for (const age of ['', '  ', '-3', '250', 'treinta']) {
      const { values, errors } = normalizeSurveyPayload({
        name: 'Ana',
        phone: '3001234567',
        [CONSENT_FIELD]: true,
        age,
      });
      expect(values.age, String(age)).toBeNull();
      // age is optional: a bad value is dropped, not rejected
      expect(errors).toEqual([]);
    }
  });

  it('groups ages into bands and counts the missing ones apart', () => {
    const summary = summarizeSurveys([
      { age: 8 },
      { age: 17 },
      { age: 18 },
      { age: 45 },
      { age: 92 },
      { age: null },
    ]);

    expect(summary.ageBands).toEqual([
      { name: 'Menor de 18', count: 2 },
      { name: '18-29', count: 1 },
      { name: '30-44', count: 0 },
      { name: '45-59', count: 1 },
      { name: '60 o más', count: 1 },
      { name: 'Sin dato', count: 1 },
    ]);
  });

  it('omits the "Sin dato" band when every survey has an age', () => {
    const summary = summarizeSurveys([{ age: 30 }]);
    expect(summary.ageBands.map((b) => b.name)).not.toContain('Sin dato');
  });
});

describe('summarizeSurveys', () => {
  const rows = [
    {
      hasDiabetes: 1,
      otherCondition: 'Asma',
      familyHistory: 1,
      drinksWater: 1,
      neighborhood: 'Boquerón',
      wantsHealthTalk: 1,
    },
    {
      hasDiabetes: 0,
      otherCondition: null,
      familyHistory: 0,
      drinksWater: 0,
      neighborhood: 'Boquerón',
    },
    {
      hasDiabetes: 1,
      otherCondition: '  ',
      familyHistory: null,
      drinksWater: null,
      neighborhood: 'El Jordán',
    },
  ];

  const summary = summarizeSurveys(rows);
  const stat = (id: string, field: string) =>
    summary.blocks.find((b) => b.id === id)?.questions.find((q) => q.field === field);

  it('counts people, conditions and course interest', () => {
    expect(summary.total).toBe(3);
    // two by checkbox, and the first one also typed a condition
    expect(summary.withAnyCondition).toBe(2);
    expect(summary.interestedInAnyCourse).toBe(1);
  });

  it('counts checkboxes with no "unanswered" state', () => {
    expect(stat('conditions', 'hasDiabetes')).toMatchObject({
      yes: 2,
      no: 1,
      unanswered: 0,
      pct: 67,
    });
  });

  it('counts the free-text condition by presence, ignoring blanks', () => {
    expect(stat('conditions', 'otherCondition')).toMatchObject({
      chartLabel: 'Otras enfermedades',
      yes: 1,
      no: 2,
    });
  });

  it('keeps yes / no / unanswered apart for yes-no questions', () => {
    expect(stat('family', 'familyHistory')).toMatchObject({ yes: 1, no: 1, unanswered: 1 });
    expect(stat('habits', 'drinksWater')).toMatchObject({ yes: 1, no: 1, unanswered: 1 });
  });

  it('reports zeros for an empty event instead of dividing by zero', () => {
    const empty = summarizeSurveys([]);
    expect(empty.total).toBe(0);
    expect(empty.blocks.every((b) => b.questions.every((q) => q.pct === 0))).toBe(true);
  });
});

describe('surveysToCsv', () => {
  const [header, row] = surveysToCsv([
    {
      name: 'Ana',
      phone: '3001234567',
      hasDiabetes: 1,
      hasDepression: 0,
      familyHistory: 0,
      drinksWater: null,
      neighborhoodIssue: 'Falta de agua',
      createdAt: '2026-08-21T10:00:00.000Z',
      capturedBy: 'voluntario@example.com',
    },
  ]);

  it('leads with the contact data, then the questions and the capture metadata', () => {
    expect(header.slice(0, 5)).toEqual([
      'Nombre',
      'Teléfono',
      'Edad',
      'Barrio (sector o etapa)',
      'Dirección',
    ]);
    expect(header[5]).toBe('Diabetes');
    expect(header.slice(-2)).toEqual(['Registrada', 'Registrada por']);
    expect(header).toHaveLength(SURVEY_FIELDS.length + 2);
  });

  it('writes Sí / No / blank so the columns stay readable', () => {
    const cell = (label: string) => row[header.indexOf(label)];
    expect(cell('Diabetes')).toBe('Sí');
    expect(cell('Depresión')).toBe('');
    expect(cell('¿Algún familiar padece de alguna de esas enfermedades?')).toBe('No');
    // unanswered stays blank rather than pretending to be a "No"
    expect(cell('¿Toma 8 vasos de agua pura al día?')).toBe('');
    expect(cell('Nombre')).toBe('Ana');
    expect(row[row.length - 1]).toBe('voluntario@example.com');
  });
});
