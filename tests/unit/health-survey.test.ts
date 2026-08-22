import { describe, it, expect } from 'vitest';
import {
  CONSENT_FIELD,
  DEPENDENTS,
  FREQUENCY_FIELDS,
  MAX_AGE,
  SURVEY_BLOCKS,
  SURVEY_FIELDS,
  emptySurveyValues,
  normalizeSurveyPayload,
  rowToFormValues,
  summarizeSurveys,
  surveysToCsv,
} from '@/lib/health-survey';

const consented = { [CONSENT_FIELD]: true };

describe('survey definition', () => {
  it('has unique field names across every block', () => {
    expect(new Set(SURVEY_FIELDS).size).toBe(SURVEY_FIELDS.length);
  });

  it('asks for permission before anything sensitive', () => {
    expect(SURVEY_BLOCKS[0].id).toBe('consent');
  });

  it('opens with habits and only then asks about conditions', () => {
    const ids = SURVEY_BLOCKS.map((b) => b.id);
    expect(ids.indexOf('habits')).toBeLessThan(ids.indexOf('conditions'));
  });

  it('offers the courses right after the conditions, before the fatigue sets in', () => {
    const ids = SURVEY_BLOCKS.map((b) => b.id);
    expect(ids.indexOf('interests')).toBe(ids.indexOf('conditions') + 1);
  });

  it('keeps the open neighborhood questions before the contact data', () => {
    const ids = SURVEY_BLOCKS.map((b) => b.id);
    expect(ids.indexOf('neighborhood')).toBeLessThan(ids.indexOf('contact'));
  });

  it('requires nothing but the consent', () => {
    const required = SURVEY_BLOCKS.flatMap((b) => b.questions)
      .filter((q) => q.required)
      .map((q) => q.field);
    expect(required).toEqual([]);
  });

  it('asks the family history beside the list of conditions it refers to', () => {
    const conditions = SURVEY_BLOCKS.find((b) => b.id === 'conditions');
    expect(conditions?.questions.map((q) => q.field)).toContain('familyHistory');
  });

  it('measures habits on three levels, not as a binary', () => {
    expect(FREQUENCY_FIELDS).toEqual([
      'drinksWater',
      'exercises',
      'eatsFruitsVegetables',
      'sleepsEightHours',
    ]);
  });

  it('gives the phone a telephone keypad and no autofill', () => {
    const phone = SURVEY_BLOCKS.flatMap((b) => b.questions).find((q) => q.field === 'phone');
    expect(phone).toMatchObject({ inputMode: 'tel', autoComplete: 'off' });
  });
});

describe('follow-up questions', () => {
  it('hangs the detail off the yes/no above it', () => {
    expect(DEPENDENTS).toEqual({ familyHistory: ['familyHistoryDetail'] });
  });

  it('keeps a follow-up when its parent is "Sí"', () => {
    const { values } = normalizeSurveyPayload({
      ...consented,
      familyHistory: true,
      familyHistoryDetail: 'Diabetes de la madre',
    });
    expect(values.familyHistoryDetail).toBe('Diabetes de la madre');
  });

  it('drops a follow-up when its parent is "No" or unanswered', () => {
    const answeredNo = normalizeSurveyPayload({
      ...consented,
      familyHistory: false,
      familyHistoryDetail: 'Diabetes',
    }).values;
    expect(answeredNo.familyHistoryDetail).toBeNull();

    const unanswered = normalizeSurveyPayload({
      ...consented,
      familyHistoryDetail: 'Diabetes',
    }).values;
    expect(unanswered.familyHistoryDetail).toBeNull();
  });
});

describe('normalizeSurveyPayload', () => {
  it('refuses to store anything without the Ley 1581 consent', () => {
    for (const consent of [undefined, false, null]) {
      const { errors } = normalizeSurveyPayload({ name: 'Ana', [CONSENT_FIELD]: consent });
      expect(errors, String(consent)).toEqual([
        'Debe autorizar el tratamiento de datos para guardar la encuesta',
      ]);
    }
  });

  it('accepts a survey with consent and nothing else: nobody has to give their name', () => {
    const { values, errors } = normalizeSurveyPayload(consented);
    expect(errors).toEqual([]);
    expect(values.name).toBeNull();
    expect(values.phone).toBeNull();
  });

  it('stores checks as 0/1 and keeps unanswered yes/no as null', () => {
    const { values, errors } = normalizeSurveyPayload({
      ...consented,
      hasDiabetes: true,
      attendsCheckups: false,
    });

    expect(errors).toEqual([]);
    expect(values.hasDiabetes).toBe(1);
    expect(values.hasDepression).toBe(0);
    expect(values.attendsCheckups).toBe(0);
    expect(values.familyHistory).toBeNull();
  });

  it('keeps the three habit levels and rejects anything else', () => {
    const { values } = normalizeSurveyPayload({
      ...consented,
      drinksWater: 'si',
      exercises: 'aveces',
      eatsFruitsVegetables: 'no',
      sleepsEightHours: 'quizás',
    });

    expect(values.drinksWater).toBe('si');
    expect(values.exercises).toBe('aveces');
    expect(values.eatsFruitsVegetables).toBe('no');
    // an unknown token is treated as unanswered, never stored
    expect(values.sleepsEightHours).toBeNull();
  });

  it('trims text and turns blanks into null', () => {
    const { values } = normalizeSurveyPayload({
      ...consented,
      name: '  Ana Pérez  ',
      neighborhood: '   ',
      neighborhoodIssue: ' Falta de agua ',
    });

    expect(values.name).toBe('Ana Pérez');
    expect(values.neighborhood).toBeNull();
    expect(values.neighborhoodIssue).toBe('Falta de agua');
  });

  it('drops unknown keys so form state can be posted as-is', () => {
    const { values } = normalizeSurveyPayload({ ...consented, id: 7, capturedBy: 'x@y.z' });
    expect(Object.keys(values).sort()).toEqual([...SURVEY_FIELDS].sort());
  });
});

describe('age', () => {
  it('parses the age the form posts as a string', () => {
    const { values, errors } = normalizeSurveyPayload({ ...consented, age: '34' });
    expect(values.age).toBe(34);
    expect(errors).toEqual([]);
  });

  it('treats a blank age as unanswered', () => {
    const { values, errors } = normalizeSurveyPayload({ ...consented, age: '  ' });
    expect(values.age).toBeNull();
    expect(errors).toEqual([]);
  });

  it('complains instead of silently dropping an impossible age', () => {
    for (const age of ['-3', '250', 'treinta']) {
      const { values, errors } = normalizeSurveyPayload({ ...consented, age });
      expect(values.age, age).toBeNull();
      expect(errors[0], age).toBe(`Edad: revise el valor (0 a ${MAX_AGE})`);
    }
  });
});

describe('summarizeSurveys', () => {
  const rows = [
    {
      hasDiabetes: 1,
      otherCondition: 'Asma',
      familyHistory: 1,
      drinksWater: 'si',
      age: 8,
      wantsHealthyHabitsCourse: 1,
    },
    { hasDiabetes: 0, otherCondition: null, familyHistory: 0, drinksWater: 'aveces', age: 30 },
    { hasDiabetes: 1, otherCondition: '  ', familyHistory: null, drinksWater: null, age: null },
  ];

  const summary = summarizeSurveys(rows);
  const stat = (id: string, field: string) =>
    summary.blocks.find((b) => b.id === id)?.questions.find((q) => q.field === field);

  it('counts people, conditions and course interest', () => {
    expect(summary.total).toBe(3);
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

  it('splits a habit into sí / a veces / no / sin responder', () => {
    expect(stat('habits', 'drinksWater')).toMatchObject({
      yes: 1,
      sometimes: 1,
      no: 0,
      unanswered: 1,
    });
  });

  it('keeps yes / no / unanswered apart for yes-no questions', () => {
    expect(stat('conditions', 'familyHistory')).toMatchObject({ yes: 1, no: 1, unanswered: 1 });
  });

  it('groups ages into bands and counts the missing ones apart', () => {
    expect(summary.ageBands).toEqual([
      { name: 'Menor de 18', count: 1 },
      { name: '18-29', count: 0 },
      { name: '30-44', count: 1 },
      { name: '45-59', count: 0 },
      { name: '60 o más', count: 0 },
      { name: 'Sin dato', count: 1 },
    ]);
  });

  it('reports zeros for an empty event instead of dividing by zero', () => {
    const empty = summarizeSurveys([]);
    expect(empty.total).toBe(0);
    expect(empty.blocks.every((b) => b.questions.every((q) => q.pct === 0))).toBe(true);
  });
});

describe('round trip through the form', () => {
  it('maps a stored row back to form values', () => {
    const values = rowToFormValues({
      hasDiabetes: 1,
      hasOverweight: 0,
      familyHistory: null,
      drinksWater: 'aveces',
      age: 42,
      name: 'Ana',
      phone: null,
    });

    expect(values.hasDiabetes).toBe(true);
    expect(values.hasOverweight).toBe(false);
    expect(values.familyHistory).toBeNull();
    expect(values.drinksWater).toBe('aveces');
    expect(values.age).toBe('42');
    expect(values.name).toBe('Ana');
    expect(values.phone).toBe('');
  });

  it('normalizes an empty form to nothing checked and nothing answered', () => {
    const { values } = normalizeSurveyPayload({ ...emptySurveyValues(), ...consented });

    expect(values.hasDiabetes).toBe(0);
    expect(values.familyHistory).toBeNull();
    expect(values.drinksWater).toBeNull();
    expect(values.age).toBeNull();
  });
});

describe('surveysToCsv', () => {
  const [header, row] = surveysToCsv([
    {
      name: 'Ana',
      phone: '3001234567',
      age: 41,
      hasDiabetes: 1,
      hasDepression: 0,
      familyHistory: 0,
      drinksWater: 'aveces',
      attendsCheckups: null,
      neighborhoodIssue: 'Falta de agua',
      capturedAt: '2026-08-22T10:00:00.000Z',
      createdAt: '2026-08-22T18:00:00.000Z',
      capturedBy: 'voluntario@example.com',
    },
  ]);

  const cell = (label: string) => row[header.indexOf(label)];

  it('leads with the contact data, then the questions and the capture metadata', () => {
    expect(header.slice(0, 4)).toEqual(['Nombre', 'Teléfono', 'Edad', 'Barrio (sector o etapa)']);
    expect(header.slice(-2)).toEqual(['Registrada', 'Registrada por']);
    expect(header).toHaveLength(SURVEY_FIELDS.length + 2);
  });

  it('writes Sí / A veces / No / blank so the columns stay readable', () => {
    expect(cell('Diabetes')).toBe('Sí');
    expect(cell('Depresión, ansiedad o estrés')).toBe('');
    expect(cell('¿Toma 8 vasos de agua pura al día?')).toBe('A veces');
    expect(cell('¿En el último año se hizo exámenes médicos de control?')).toBe('');
    expect(cell('Nombre')).toBe('Ana');
    expect(cell('Edad')).toBe('41');
  });

  it('reports the moment of capture, not the moment it reached the server', () => {
    expect(cell('Registrada')).toBe('2026-08-22T10:00:00.000Z');
    expect(row[row.length - 1]).toBe('voluntario@example.com');
  });
});
