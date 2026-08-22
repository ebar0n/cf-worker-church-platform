// Health survey ("Encuesta de Salud", Asociación Sur Colombiana / ¡Quiero Vivir
// Sano!) captured by volunteers during a volunteer event. This module is the
// single source of truth for the questionnaire: the admin form, the dashboard,
// the CSV export and the API validation all derive from SURVEY_BLOCKS, so a new
// question means touching one list (plus a migration for its column).
//
// The block order is not the printed sheet's. It was rebuilt around a spoken
// interview in the street:
//   1. consent first — nothing sensitive is asked before permission, and a "no"
//      costs 20 seconds instead of 8 minutes;
//   2. habits next — a neutral opening nobody resents;
//   3. conditions after that, once there is rapport, with the family history
//      question beside the list its wording refers to;
//   4. interest in courses right after the person has admitted they do not
//      sleep or exercise, when the offer is most relevant;
//   5. the neighborhood questions as the emotional high point;
//   6. contact last, when the person has a reason to leave a phone number.

/** Bands the dashboard groups ages into; the stored value is the exact age. */
export const AGE_BANDS: { name: string; min: number; max: number }[] = [
  { name: 'Menor de 18', min: 0, max: 17 },
  { name: '18-29', min: 18, max: 29 },
  { name: '30-44', min: 30, max: 44 },
  { name: '45-59', min: 45, max: 59 },
  { name: '60 o más', min: 60, max: 200 },
];

export const MAX_AGE = 120;

/**
 * Habits use three states instead of Sí/No. "¿Toma 8 vasos de agua al día?"
 * answered as a binary forces false precision: the honest answer for most
 * people is "a veces", which used to land in "No" next to those who never do
 * it, making change between jornadas unmeasurable.
 */
export const FREQUENCY_VALUES = ['si', 'aveces', 'no'] as const;
export type FrequencyValue = (typeof FREQUENCY_VALUES)[number];
export const FREQUENCY_LABELS: Record<FrequencyValue, string> = {
  si: 'Sí',
  aveces: 'A veces',
  no: 'No',
};

export type SurveyQuestionType = 'check' | 'yesno' | 'frequency' | 'text' | 'textarea' | 'number';

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
  /** Follow-up: only asked when the parent yes/no is "Sí", cleared otherwise. */
  dependsOn?: string;
  /** Keyboard hints; a phone field must not open a QWERTY on an iPad. */
  inputMode?: 'text' | 'tel' | 'numeric';
  autoCapitalize?: 'none' | 'words';
  /** Suggestions from a previous answer must not leak to the next person. */
  autoComplete?: string;
  /** Offers the values already used in this event (one jornada, one barrio). */
  suggestFromEvent?: boolean;
}

export type SurveyBlockId =
  | 'consent'
  | 'habits'
  | 'conditions'
  | 'interests'
  | 'neighborhood'
  | 'contact';

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
    id: 'consent',
    title: 'Autorización',
    // Read out loud, not a legal paragraph nobody reads: the formal Ley 1581
    // text lives in this hint and in the linked policy.
    hint: 'Ley 1581 de 2012: la iglesia guarda estos datos, incluidos los de salud, con la finalidad exclusiva de organizar sus programas de salud, y la persona puede pedir su eliminación en cualquier momento. Sin autorización no se guarda la encuesta.',
    link: { href: '/privacy', label: 'Ver la política de tratamiento de datos' },
    questions: [
      {
        field: 'acceptsDataTreatment',
        label:
          'Sus datos se usan solo para invitarlo a los programas de salud de la iglesia, y puede pedir que los borremos cuando quiera. ¿Nos autoriza a guardarlos?',
        chartLabel: 'Autoriza sus datos',
        type: 'yesno',
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
        type: 'frequency',
      },
      {
        field: 'exercises',
        label: '¿Hace ejercicio físico durante 30 minutos diarios?',
        chartLabel: 'Ejercicio 30 min',
        type: 'frequency',
      },
      {
        field: 'eatsFruitsVegetables',
        label: '¿Consume frutas y verduras?',
        chartLabel: 'Frutas y verduras',
        type: 'frequency',
      },
      {
        field: 'sleepsEightHours',
        label: '¿Duerme 8 horas diarias?',
        chartLabel: '8 horas de sueño',
        type: 'frequency',
      },
      {
        // Anchored in time and free of the old "etc.": the previous wording
        // mixed frequency, a list of exams and an "etcétera" that read badly out
        // loud, and its "¿cuáles?" follow-up asked the people who DO go, when
        // the segment the church can act on is the ones who do not.
        field: 'attendsCheckups',
        label: '¿En el último año se hizo exámenes médicos de control?',
        chartLabel: 'Exámenes de control',
        type: 'yesno',
      },
    ],
  },
  {
    id: 'conditions',
    title: '¿Padece usted de alguna de estas enfermedades?',
    hint: 'Marque las que apliquen.',
    questions: [
      { field: 'hasDiabetes', label: 'Diabetes', type: 'check' },
      {
        // "¿Padece usted de presión arterial?" has no answer: everyone has blood
        // pressure. Each volunteer was improvising their own version of it.
        field: 'hasHighBloodPressure',
        label: 'Presión arterial alta (hipertensión)',
        chartLabel: 'Hipertensión',
        type: 'check',
      },
      { field: 'hasHeartDisease', label: 'Enfermedades del corazón', type: 'check' },
      {
        field: 'hasHighCholesterol',
        label: 'Colesterol o triglicéridos altos',
        chartLabel: 'Colesterol / triglicéridos',
        type: 'check',
      },
      { field: 'hasOverweight', label: 'Sobrepeso u obesidad', type: 'check' },
      {
        // Easier to admit than "Depresión" alone, and it matches the emotional
        // health course the church already offers.
        field: 'hasDepression',
        label: 'Depresión, ansiedad o estrés',
        chartLabel: 'Depresión / ansiedad',
        type: 'check',
      },
      {
        field: 'otherCondition',
        label: 'Otra enfermedad',
        chartLabel: 'Otras enfermedades',
        type: 'text',
        countPresence: true,
        autoComplete: 'off',
      },
      {
        // Lives here, next to the list it refers to: as its own block the "esas
        // enfermedades" had no antecedent, least of all in the CSV header.
        field: 'familyHistory',
        label:
          '¿Algún familiar cercano (padres, hermanos, hijos) padece alguna de estas enfermedades?',
        chartLabel: 'Antecedente familiar',
        type: 'yesno',
      },
      {
        field: 'familyHistoryDetail',
        label: '¿Cuáles?',
        type: 'text',
        dependsOn: 'familyHistory',
        autoComplete: 'off',
      },
    ],
  },
  {
    id: 'interests',
    title: '¿Cuál de estos le gustaría?',
    // One spoken question with four options instead of five near-identical
    // yes/no questions in a row, which by minute five got Sí to everything or No
    // to everything — precisely the data that decides which courses open.
    hint: 'Puede escoger varios.',
    questions: [
      {
        field: 'wantsHealthyHabitsCourse',
        label: 'Curso de hábitos saludables',
        chartLabel: 'Hábitos saludables',
        type: 'check',
      },
      {
        field: 'wantsHealthyCookingCourse',
        label: 'Curso de cocina saludable',
        chartLabel: 'Cocina saludable',
        type: 'check',
      },
      {
        field: 'wantsEmotionalHealthCourse',
        label: 'Curso de salud emocional',
        chartLabel: 'Salud emocional',
        type: 'check',
      },
      {
        field: 'wantsPersonalFinanceCourse',
        label: 'Curso de salud financiera',
        chartLabel: 'Salud financiera',
        type: 'check',
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
        autoComplete: 'off',
      },
      {
        field: 'neighborhoodImprovement',
        label: '¿Cómo cree que se podría mejorar?',
        type: 'textarea',
        autoComplete: 'off',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Datos de contacto',
    // Nothing here is required: someone willing to answer about their health but
    // not to leave a phone number must still be recordable, and a survey with no
    // identifiers is not personal data at all.
    hint: 'Opcional. Si la persona no quiere dar sus datos, deje los campos vacíos.',
    questions: [
      {
        field: 'name',
        label: 'Nombre',
        type: 'text',
        autoCapitalize: 'words',
        autoComplete: 'off',
      },
      {
        field: 'phone',
        label: 'Teléfono',
        type: 'text',
        inputMode: 'tel',
        autoComplete: 'off',
      },
      { field: 'age', label: 'Edad', type: 'number' },
      {
        field: 'neighborhood',
        label: 'Barrio (sector o etapa)',
        type: 'text',
        autoComplete: 'off',
        suggestFromEvent: true,
      },
    ],
  },
];

export const SURVEY_QUESTIONS: SurveyQuestion[] = SURVEY_BLOCKS.flatMap((b) => b.questions);

/** Consent gates saving: without it the record must not be stored at all. */
export const CONSENT_FIELD = 'acceptsDataTreatment';

export const CHECK_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'check').map((q) => q.field);
export const YESNO_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'yesno').map((q) => q.field);
export const FREQUENCY_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'frequency').map(
  (q) => q.field
);
export const TEXT_FIELDS = SURVEY_QUESTIONS.filter(
  (q) => q.type === 'text' || q.type === 'textarea'
).map((q) => q.field);
export const NUMBER_FIELDS = SURVEY_QUESTIONS.filter((q) => q.type === 'number').map(
  (q) => q.field
);

export const BOOLEAN_FIELDS = [...CHECK_FIELDS, ...YESNO_FIELDS];
export const SURVEY_FIELDS = SURVEY_QUESTIONS.map((q) => q.field);

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
 * yes/no answers keep "unanswered" as null, frequencies keep their token, and
 * blank text becomes null. Unknown keys are dropped, so callers can post form
 * state as-is.
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

  for (const field of FREQUENCY_FIELDS) {
    const value = input[field];
    values[field] =
      typeof value === 'string' && FREQUENCY_VALUES.includes(value as FrequencyValue)
        ? value
        : null;
  }

  for (const field of TEXT_FIELDS) {
    const value = input[field];
    const text = typeof value === 'string' ? value.trim() : '';
    values[field] = text === '' ? null : text;
  }

  // An age typed as "355" used to be dropped in silence, and age is the
  // dimension the rest of the answers get read by.
  for (const field of NUMBER_FIELDS) {
    const raw = String(input[field] ?? '').trim();
    if (raw === '') {
      values[field] = null;
      continue;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_AGE) {
      const question = SURVEY_QUESTIONS.find((q) => q.field === field);
      errors.push(`${question?.label ?? field}: revise el valor (0 a ${MAX_AGE})`);
      values[field] = null;
      continue;
    }
    values[field] = parsed;
  }

  // A follow-up without a "Sí" above it is noise: drop it whatever the client sent
  for (const [parent, followUps] of Object.entries(DEPENDENTS)) {
    if (values[parent] !== 1) {
      for (const field of followUps) values[field] = null;
    }
  }

  // Health answers are "datos sensibles" under Ley 1581: no consent, no record
  if (values[CONSENT_FIELD] !== 1) {
    errors.push('Debe autorizar el tratamiento de datos para guardar la encuesta');
  }

  return { values, errors };
}

/** Turns a stored row into the shape the form uses. */
export function rowToFormValues(row: Record<string, unknown>): SurveyPayload {
  const values: SurveyPayload = {};

  for (const field of CHECK_FIELDS) {
    values[field] = row[field] === 1 || row[field] === true;
  }
  for (const field of YESNO_FIELDS) {
    values[field] = row[field] === null || row[field] === undefined ? null : row[field] === 1;
  }
  for (const field of FREQUENCY_FIELDS) {
    values[field] = typeof row[field] === 'string' ? (row[field] as string) : null;
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
  for (const field of FREQUENCY_FIELDS) values[field] = null;
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
  /** Only meaningful for frequency questions. */
  sometimes: number;
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
const hasText = (value: unknown) => typeof value === 'string' && value.trim() !== '';

/**
 * Counts every countable question, block by block, so the breakdown follows
 * SURVEY_BLOCKS instead of a hand-kept list. Checkboxes have no "No": an
 * unmarked box counts as no.
 */
export function summarizeSurveys(rows: Record<string, unknown>[]): SurveySummary {
  const total = rows.length;
  const pct = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100));

  const blocks: BlockStat[] = SURVEY_BLOCKS.map((block) => ({
    id: block.id,
    title: block.title,
    questions: block.questions
      .filter(
        (q) => q.type === 'check' || q.type === 'yesno' || q.type === 'frequency' || q.countPresence
      )
      .map((question) => {
        const values = rows.map((row) => row[question.field]);

        if (question.type === 'frequency') {
          const yes = values.filter((v) => v === 'si').length;
          const sometimes = values.filter((v) => v === 'aveces').length;
          const no = values.filter((v) => v === 'no').length;

          return {
            field: question.field,
            label: question.label,
            chartLabel: question.chartLabel ?? question.label,
            type: question.type,
            yes,
            sometimes,
            no,
            unanswered: total - yes - sometimes - no,
            pct: pct(yes),
          };
        }

        const yes = question.countPresence
          ? values.filter(hasText).length
          : values.filter(isYes).length;
        const no = question.type === 'yesno' ? values.filter(isNo).length : total - yes;

        return {
          field: question.field,
          label: question.label,
          chartLabel: question.chartLabel ?? question.label,
          type: question.type,
          yes,
          sometimes: 0,
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
      (row) => conditionFields.some((field) => isYes(row[field])) || hasText(row.otherCondition)
    ).length,
    interestedInAnyCourse: rows.filter((row) => courseFields.some((field) => isYes(row[field])))
      .length,
    blocks,
  };
}

const csvAnswer = (value: unknown, type: SurveyQuestionType) => {
  if (type === 'check') return isYes(value) ? 'Sí' : '';
  if (type === 'yesno') return isYes(value) ? 'Sí' : isNo(value) ? 'No' : '';
  if (type === 'frequency')
    return typeof value === 'string' && FREQUENCY_VALUES.includes(value as FrequencyValue)
      ? FREQUENCY_LABELS[value as FrequencyValue]
      : '';
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
    // The device's capture time is the real moment; createdAt is the insert.
    typeof row.capturedAt === 'string'
      ? row.capturedAt
      : typeof row.createdAt === 'string'
        ? row.createdAt
        : '',
    typeof row.capturedBy === 'string' ? row.capturedBy : '',
  ]);

  return [header, ...body];
}
