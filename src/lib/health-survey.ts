// Health survey ("Encuesta de Salud", Asociación Sur Colombiana / ¡Quiero Vivir
// Sano!) captured by volunteers during a volunteer event. This module is the
// single source of truth for the questionnaire: the admin form, the table, the
// CSV export and the API validation all derive from SURVEY_BLOCKS, so adding a
// question means touching one list (plus a migration for its column).
//
// Block order follows the printed sheet, except that the two open questions
// about the neighborhood come before the contact data: once someone writes
// their name and phone the form feels finished and open answers are skipped.

export type SurveyQuestionType = 'check' | 'yesno' | 'text' | 'textarea';

export interface SurveyQuestion {
  field: string;
  label: string;
  type: SurveyQuestionType;
  required?: boolean;
}

export interface SurveyBlock {
  title: string;
  hint?: string;
  questions: SurveyQuestion[];
}

export const SURVEY_BLOCKS: SurveyBlock[] = [
  {
    title: '¿Padece usted de alguna de estas enfermedades?',
    hint: 'Marque las que apliquen.',
    questions: [
      { field: 'hasDiabetes', label: 'Diabetes', type: 'check' },
      { field: 'hasHighBloodPressure', label: 'Presión arterial', type: 'check' },
      { field: 'hasHeartDisease', label: 'Enfermedades del corazón', type: 'check' },
      {
        field: 'hasHighCholesterol',
        label: 'Nivel alto de colesterol y/o triglicéridos en la sangre',
        type: 'check',
      },
      { field: 'hasOverweight', label: 'Sobrepeso y obesidad', type: 'check' },
      { field: 'hasDepression', label: 'Depresión', type: 'check' },
      { field: 'otherCondition', label: 'Otra enfermedad', type: 'text' },
    ],
  },
  {
    title: 'Antecedentes familiares',
    questions: [
      {
        field: 'familyHistory',
        label: '¿Algún familiar padece de alguna de esas enfermedades?',
        type: 'yesno',
      },
      { field: 'familyHistoryDetail', label: '¿Cuál?', type: 'text' },
    ],
  },
  {
    title: '¿Realiza las siguientes actividades?',
    questions: [
      { field: 'drinksWater', label: '¿Toma 8 vasos de agua pura al día?', type: 'yesno' },
      {
        field: 'exercises',
        label: '¿Hace ejercicio físico durante 30 minutos diarios?',
        type: 'yesno',
      },
      {
        field: 'eatsFruitsVegetables',
        label: '¿Consume regularmente frutas y verduras?',
        type: 'yesno',
      },
      { field: 'sleepsEightHours', label: '¿Duerme regularmente 8 horas diarias?', type: 'yesno' },
      {
        field: 'attendsCheckups',
        label:
          '¿Va regularmente al centro de salud para hacerse exámenes de diabetes, cáncer, etc.?',
        type: 'yesno',
      },
      { field: 'checkupsDetail', label: '¿Cuál?', type: 'text' },
    ],
  },
  {
    title: 'Interés en formación',
    questions: [
      {
        field: 'wantsHealthyHabitsCourse',
        label: '¿Le interesaría un curso de hábitos saludables?',
        type: 'yesno',
      },
      {
        field: 'wantsHealthTalk',
        label: '¿Le interesaría escuchar algún tema de salud?',
        type: 'yesno',
      },
      {
        field: 'wantsHealthyCookingCourse',
        label: '¿Le interesaría tomar un curso de cocina saludable?',
        type: 'yesno',
      },
      {
        field: 'wantsEmotionalHealthCourse',
        label: '¿Le interesaría tomar un curso de salud emocional?',
        type: 'yesno',
      },
      {
        field: 'wantsPersonalFinanceCourse',
        label: '¿Le interesaría tomar un curso de finanzas personales?',
        type: 'yesno',
      },
    ],
  },
  {
    title: 'Su barrio',
    questions: [
      {
        field: 'neighborhoodIssue',
        label: '¿Cuál cree que es la problemática más importante a tratar en su barrio?',
        type: 'textarea',
      },
      {
        field: 'neighborhoodImprovement',
        label: '¿Cómo cree que se podría mejorar?',
        type: 'textarea',
      },
    ],
  },
  {
    title: 'Datos de contacto',
    questions: [
      { field: 'name', label: 'Nombre', type: 'text', required: true },
      { field: 'phone', label: 'Teléfono', type: 'text', required: true },
      { field: 'neighborhood', label: 'Barrio', type: 'text' },
      { field: 'address', label: 'Dirección', type: 'text' },
    ],
  },
];

export const SURVEY_QUESTIONS: SurveyQuestion[] = SURVEY_BLOCKS.flatMap((b) => b.questions);

export const CHECK_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'check').map((q) => q.field);
export const YESNO_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'yesno').map((q) => q.field);
export const TEXT_FIELDS = SURVEY_QUESTIONS.filter(
  (q) => q.type === 'text' || q.type === 'textarea'
).map((q) => q.field);

export const BOOLEAN_FIELDS = [...CHECK_FIELDS, ...YESNO_FIELDS];
export const SURVEY_FIELDS = SURVEY_QUESTIONS.map((q) => q.field);

export const REQUIRED_FIELDS = SURVEY_QUESTIONS.filter((q) => q.required).map((q) => q.field);

export type SurveyPayload = Record<string, string | boolean | null>;

/**
 * Normalizes an incoming payload to the columns we store: checks become 0/1,
 * yes/no answers keep "unanswered" as null, and blank text becomes null.
 * Unknown keys are dropped, so callers can post form state as-is.
 */
export function normalizeSurveyPayload(input: Record<string, unknown>): {
  values: Record<string, string | number | null>;
  errors: string[];
} {
  const values: Record<string, string | number | null> = {};
  const errors: string[] = [];

  for (const field of CHECK_FIELDS) {
    values[field] = input[field] === true || input[field] === 1 ? 1 : 0;
  }

  for (const field of YESNO_FIELDS) {
    const value = input[field];
    values[field] = value === true || value === 1 ? 1 : value === false || value === 0 ? 0 : null;
  }

  for (const field of TEXT_FIELDS) {
    const value = input[field];
    const text = typeof value === 'string' ? value.trim() : '';
    values[field] = text === '' ? null : text;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) {
      const question = SURVEY_QUESTIONS.find((q) => q.field === field);
      errors.push(`${question?.label ?? field} es requerido`);
    }
  }

  return { values, errors };
}

/** Turns a stored row into the shape the form uses (booleans instead of 0/1). */
export function rowToFormValues(row: Record<string, unknown>): SurveyPayload {
  const values: SurveyPayload = {};

  for (const field of CHECK_FIELDS) {
    values[field] = row[field] === 1 || row[field] === true;
  }
  for (const field of YESNO_FIELDS) {
    values[field] = row[field] === null || row[field] === undefined ? null : row[field] === 1;
  }
  for (const field of TEXT_FIELDS) {
    values[field] = typeof row[field] === 'string' ? (row[field] as string) : '';
  }

  return values;
}

/** Empty form state: nothing checked, nothing answered. */
export function emptySurveyValues(): SurveyPayload {
  const values: SurveyPayload = {};
  for (const field of CHECK_FIELDS) values[field] = false;
  for (const field of YESNO_FIELDS) values[field] = null;
  for (const field of TEXT_FIELDS) values[field] = '';
  return values;
}
