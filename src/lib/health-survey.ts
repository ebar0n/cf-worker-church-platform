// Health survey ("Encuesta de Salud", Asociación Sur Colombiana / ¡Quiero Vivir
// Sano!) captured by volunteers during a volunteer event. This module is the
// single source of truth for the questionnaire: the admin form, the table, the
// CSV export and the API validation all derive from SURVEY_BLOCKS, so adding a
// question means touching one list (plus a migration for its column).
//
// Block order follows the printed sheet, except that the two open questions
// about the neighborhood come before the contact data: once someone writes
// their name and phone the form feels finished and open answers are skipped.

/** Bands the dashboard groups ages into; the stored value is the exact age. */
export const AGE_BANDS: { name: string; min: number; max: number }[] = [
  { name: 'Menor de 18', min: 0, max: 17 },
  { name: '18-29', min: 18, max: 29 },
  { name: '30-44', min: 30, max: 44 },
  { name: '45-59', min: 45, max: 59 },
  { name: '60 o más', min: 60, max: 200 },
];

export const MAX_AGE = 120;

export type SurveyQuestionType = 'check' | 'yesno' | 'text' | 'textarea' | 'number';

export interface SurveyQuestion {
  field: string;
  label: string;
  /** Short form for chart axes, where the full sentence does not fit. */
  chartLabel?: string;
  type: SurveyQuestionType;
  required?: boolean;
  /**
   * Free-text answer that also counts as a yes/no in the dashboard: any text
   * means "yes". Used for "Otra enfermedad", which is a condition like the
   * checkboxes next to it even though it is typed in.
   */
  countPresence?: boolean;

  // Follow-up question: only asked when the parent yes/no is "Sí". The form
  // nests it under its parent and the payload clears it otherwise, so a stale
  // detail can never outlive the answer it belongs to.
  dependsOn?: string;
}

export type SurveyBlockId =
  | 'conditions'
  | 'family'
  | 'habits'
  | 'interests'
  | 'neighborhood'
  | 'contact'
  | 'consent';

export interface SurveyBlock {
  id: SurveyBlockId;
  title: string;
  hint?: string;
  /** Shown next to the hint; used to link the data-treatment policy. */
  link?: { href: string; label: string };
  questions: SurveyQuestion[];
}

export const SURVEY_BLOCKS: SurveyBlock[] = [
  {
    id: 'conditions',
    title: '¿Padece usted de alguna de estas enfermedades?',
    hint: 'Marque las que apliquen.',
    questions: [
      { field: 'hasDiabetes', label: 'Diabetes', type: 'check' },
      { field: 'hasHighBloodPressure', label: 'Presión arterial', type: 'check' },
      { field: 'hasHeartDisease', label: 'Enfermedades del corazón', type: 'check' },
      {
        field: 'hasHighCholesterol',
        label: 'Nivel alto de colesterol y/o triglicéridos en la sangre',
        chartLabel: 'Colesterol / triglicéridos',
        type: 'check',
      },
      { field: 'hasOverweight', label: 'Sobrepeso y obesidad', type: 'check' },
      { field: 'hasDepression', label: 'Depresión', type: 'check' },
      {
        field: 'otherCondition',
        label: 'Otra enfermedad',
        chartLabel: 'Otras enfermedades',
        type: 'text',
        countPresence: true,
      },
    ],
  },
  {
    id: 'family',
    title: 'Antecedentes familiares',
    questions: [
      {
        field: 'familyHistory',
        label: '¿Algún familiar padece de alguna de esas enfermedades?',
        chartLabel: 'Antecedente familiar',
        type: 'yesno',
      },
      {
        field: 'familyHistoryDetail',
        label: '¿Cuál enfermedad?',
        type: 'text',
        dependsOn: 'familyHistory',
      },
    ],
  },
  {
    id: 'habits',
    title: '¿Realiza las siguientes actividades?',
    questions: [
      {
        field: 'drinksWater',
        label: '¿Toma 8 vasos de agua pura al día?',
        chartLabel: '8 vasos de agua',
        type: 'yesno',
      },
      {
        field: 'exercises',
        label: '¿Hace ejercicio físico durante 30 minutos diarios?',
        chartLabel: 'Ejercicio 30 min',
        type: 'yesno',
      },
      {
        field: 'eatsFruitsVegetables',
        label: '¿Consume regularmente frutas y verduras?',
        chartLabel: 'Frutas y verduras',
        type: 'yesno',
      },
      {
        field: 'sleepsEightHours',
        label: '¿Duerme regularmente 8 horas diarias?',
        chartLabel: '8 horas de sueño',
        type: 'yesno',
      },
      {
        field: 'attendsCheckups',
        label:
          '¿Va regularmente al centro de salud para hacerse exámenes de diabetes, cáncer, etc.?',
        chartLabel: 'Exámenes de control',
        type: 'yesno',
      },
      {
        field: 'checkupsDetail',
        label: '¿Cuáles exámenes?',
        type: 'text',
        dependsOn: 'attendsCheckups',
      },
    ],
  },
  {
    id: 'interests',
    title: 'Interés en formación',
    questions: [
      {
        field: 'wantsHealthyHabitsCourse',
        label: '¿Le interesaría un curso de hábitos saludables?',
        chartLabel: 'Hábitos saludables',
        type: 'yesno',
      },
      {
        field: 'wantsHealthTalk',
        label: '¿Le interesaría escuchar algún tema de salud?',
        chartLabel: 'Charla de salud',
        type: 'yesno',
      },
      {
        field: 'wantsHealthyCookingCourse',
        label: '¿Le interesaría tomar un curso de cocina saludable?',
        chartLabel: 'Cocina saludable',
        type: 'yesno',
      },
      {
        field: 'wantsEmotionalHealthCourse',
        label: '¿Le interesaría tomar un curso de salud emocional?',
        chartLabel: 'Salud emocional',
        type: 'yesno',
      },
      {
        field: 'wantsPersonalFinanceCourse',
        label: '¿Le interesaría tomar un curso de salud financiera?',
        chartLabel: 'Salud financiera',
        type: 'yesno',
      },
    ],
  },
  {
    id: 'neighborhood',
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
    id: 'consent',
    title: 'Autorización',
    hint: 'Léala a la persona antes de guardar. Sin autorización no se guarda la encuesta.',
    link: { href: '/privacy', label: 'Ver la política de tratamiento de datos' },
    questions: [
      {
        field: 'acceptsDataTreatment',
        label:
          '¿Autoriza el tratamiento de sus datos personales (incluidos datos de salud) para la gestión de los programas de salud de la iglesia, según la Ley 1581 de 2012?',
        chartLabel: 'Autoriza sus datos',
        type: 'yesno',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Datos de contacto',
    questions: [
      { field: 'name', label: 'Nombre', type: 'text', required: true },
      { field: 'phone', label: 'Teléfono', type: 'text', required: true },
      // Age, never a birth date: the health answers only mean something read by
      // age group, and the exact number can be re-banded later without asking
      // again.
      { field: 'age', label: 'Edad', type: 'number' },
      { field: 'neighborhood', label: 'Barrio (sector o etapa)', type: 'text' },
      { field: 'address', label: 'Dirección', type: 'text' },
    ],
  },
];

export const SURVEY_QUESTIONS: SurveyQuestion[] = SURVEY_BLOCKS.flatMap((b) => b.questions);

/** Consent gates saving: without it the record must not be stored at all. */
export const CONSENT_FIELD = 'acceptsDataTreatment';

export const CHECK_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'check').map((q) => q.field);
export const YESNO_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'yesno').map((q) => q.field);
export const TEXT_FIELDS = SURVEY_QUESTIONS.filter(
  (q) => q.type === 'text' || q.type === 'textarea'
).map((q) => q.field);

export const NUMBER_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'number').map(
  (q) => q.field
);

export const BOOLEAN_FIELDS = [...CHECK_FIELDS, ...YESNO_FIELDS];
export const SURVEY_FIELDS = SURVEY_QUESTIONS.map((q) => q.field);

export const REQUIRED_FIELDS = SURVEY_QUESTIONS.filter((q) => q.required).map((q) => q.field);

/** parent field -> follow-up fields that only apply when it is answered "Sí". */
export const DEPENDENTS: Record<string, string[]> = SURVEY_QUESTIONS.reduce<
  Record<string, string[]>
>((acc, question) => {
  if (question.dependsOn) {
    acc[question.dependsOn] = [...(acc[question.dependsOn] ?? []), question.field];
  }
  return acc;
}, {});

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

  // Ages arrive as strings from the form; anything out of range is dropped
  for (const field of NUMBER_FIELDS) {
    const parsed = Number.parseInt(String(input[field] ?? ''), 10);
    values[field] = Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_AGE ? parsed : null;
  }

  // A follow-up without a "Sí" above it is noise: drop it whatever the client sent
  for (const [parent, followUps] of Object.entries(DEPENDENTS)) {
    if (values[parent] !== 1) {
      for (const field of followUps) values[field] = null;
    }
  }

  for (const field of REQUIRED_FIELDS) {
    if (!values[field]) {
      const question = SURVEY_QUESTIONS.find((q) => q.field === field);
      errors.push(`${question?.label ?? field} es requerido`);
    }
  }

  // Health answers are "datos sensibles" under Ley 1581: no consent, no record
  if (values[CONSENT_FIELD] !== 1) {
    errors.push('Debe autorizar el tratamiento de datos para guardar la encuesta');
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
  for (const field of NUMBER_FIELDS) {
    values[field] = typeof row[field] === 'number' ? String(row[field]) : '';
  }

  return values;
}

/** Empty form state: nothing checked, nothing answered. */
export function emptySurveyValues(): SurveyPayload {
  const values: SurveyPayload = {};
  for (const field of CHECK_FIELDS) values[field] = false;
  for (const field of YESNO_FIELDS) values[field] = null;
  for (const field of TEXT_FIELDS) values[field] = '';
  for (const field of NUMBER_FIELDS) values[field] = '';
  return values;
}

// --- Dashboard ---------------------------------------------------------------

export interface QuestionStat {
  field: string;
  label: string;
  chartLabel: string;
  type: SurveyQuestionType;
  yes: number;
  no: number;
  unanswered: number;
  /** share of the surveys answered "Sí" (0-100, rounded) */
  pct: number;
}

export interface BlockStat {
  id: SurveyBlockId;
  title: string;
  questions: QuestionStat[];
}

export interface SurveySummary {
  total: number;
  withAnyCondition: number;
  interestedInAnyCourse: number;
  /** Fixed AGE_BANDS order, plus "Sin dato" for surveys with no age. */
  ageBands: { name: string; count: number }[];
  blocks: BlockStat[];
}

const isYes = (value: unknown) => value === 1 || value === true;
const isNo = (value: unknown) => value === 0 || value === false;

/**
 * Counts every check and yes/no question, block by block, so the breakdown
 * follows SURVEY_BLOCKS instead of a hand-kept list. Checkboxes have no "No":
 * an unmarked box counts as no.
 */
export function summarizeSurveys(rows: Record<string, unknown>[]): SurveySummary {
  const total = rows.length;
  const pct = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100));

  const blocks: BlockStat[] = SURVEY_BLOCKS.map((block) => ({
    id: block.id,
    title: block.title,
    questions: block.questions
      .filter((q) => q.type === 'check' || q.type === 'yesno' || q.countPresence)
      .map((question) => {
        const values = rows.map((row) => row[question.field]);
        const yes = question.countPresence
          ? values.filter((value) => typeof value === 'string' && value.trim() !== '').length
          : values.filter(isYes).length;
        const no = question.type === 'yesno' ? values.filter(isNo).length : total - yes;

        return {
          field: question.field,
          label: question.label,
          chartLabel: question.chartLabel ?? question.label,
          type: question.type,
          yes,
          no,
          unanswered: total - yes - no,
          pct: pct(yes),
        };
      }),
  })).filter((block) => block.questions.length > 0);

  const blockQuestions = (id: SurveyBlockId) =>
    SURVEY_BLOCKS.find((block) => block.id === id)?.questions ?? [];
  const conditionFields = blockQuestions('conditions')
    .filter((q) => q.type === 'check')
    .map((q) => q.field);
  const courseFields = blockQuestions('interests').map((q) => q.field);

  const ageCounts = new Map<string, number>(AGE_BANDS.map((band) => [band.name, 0]));
  let withoutAge = 0;
  for (const row of rows) {
    const age = typeof row.age === 'number' ? row.age : Number.NaN;
    const band = AGE_BANDS.find((b) => age >= b.min && age <= b.max);
    if (band) ageCounts.set(band.name, (ageCounts.get(band.name) ?? 0) + 1);
    else withoutAge += 1;
  }

  return {
    total,
    ageBands: [
      ...AGE_BANDS.map(({ name }) => ({ name, count: ageCounts.get(name) ?? 0 })),
      ...(withoutAge > 0 ? [{ name: 'Sin dato', count: withoutAge }] : []),
    ],
    withAnyCondition: rows.filter(
      (row) => conditionFields.some((field) => isYes(row[field])) || !!row.otherCondition
    ).length,
    interestedInAnyCourse: rows.filter((row) => courseFields.some((field) => isYes(row[field])))
      .length,
    blocks,
  };
}

const csvAnswer = (value: unknown, type: SurveyQuestionType) => {
  if (type === 'check') return isYes(value) ? 'Sí' : '';
  if (type === 'yesno') return isYes(value) ? 'Sí' : isNo(value) ? 'No' : '';
  if (type === 'number') return typeof value === 'number' ? String(value) : '';
  return typeof value === 'string' ? value : '';
};

/**
 * Header + one row per survey. Contact data leads — that is what identifies the
 * row in a spreadsheet — and the questions follow in the order they are asked.
 * The caller turns it into a file.
 */
export function surveysToCsv(rows: Record<string, unknown>[]): string[][] {
  const contact = SURVEY_BLOCKS.find((block) => block.id === 'contact')?.questions ?? [];
  const columns = [...contact, ...SURVEY_QUESTIONS.filter((q) => !contact.includes(q))];

  const header = [...columns.map((q) => q.label), 'Registrada', 'Registrada por'];
  const body = rows.map((row) => [
    ...columns.map((q) => csvAnswer(row[q.field], q.type)),
    typeof row.createdAt === 'string' ? row.createdAt : '',
    typeof row.capturedBy === 'string' ? row.capturedBy : '',
  ]);

  return [header, ...body];
}
