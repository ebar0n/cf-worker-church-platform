// Age classification for Adventist programs, following the
// Inter-American Division scheme used in Colombia (mundoja.org).
// Computed from birthDate on read — never stored — so every participant
// moves up automatically each year. (specs/program-family-enrollment.md)
// Like Colombian calendar-A schools, the class follows the age completed by
// March 31 of the current year, so it stays fixed for the whole club year;
// the displayed age is the real one.

export type AgeCategory = 'Principiante' | 'Aventurero' | 'Conquistador' | 'Guía Mayor';

export interface AgeClassification {
  /** Real age today */
  age: number;
  category: AgeCategory;
  /** Age-specific class inside the program; null for Principiante / Guía Mayor */
  className: string | null;
}

// Index = age - 4 (Aventureros: ages 4..9)
const ADVENTURER_CLASSES = [
  'Corderitos',
  'Aves Madrugadoras',
  'Abejas Industriosas',
  'Rayos de Sol',
  'Constructores',
  'Manos Ayudadoras',
];

// Index = age - 10 (Conquistadores: ages 10..15)
const PATHFINDER_CLASSES = ['Amigo', 'Compañero', 'Explorador', 'Orientador', 'Viajero', 'Guía'];

// Groups are always created by an adult: consejeros/directiva must be Guía
// Mayor age. A child can never register alone.
export const MIN_ADULT_AGE = 16;

export function calculateAge(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Date-only values ("2019-03-05", or D1's "2019-03-05T00:00:00.000Z") are
// calendar dates: read them as local components so a UTC-5 browser does not
// move the birthday to the previous day.
function parseBirthDate(birthDate: Date | string): Date {
  if (typeof birthDate !== 'string') return birthDate;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00(?::00(?:\.0+)?)?Z?)?$/.exec(birthDate);
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(birthDate);
}

export function classify(
  birthDate: Date | string,
  referenceDate: Date = new Date()
): AgeClassification {
  const birth = parseBirthDate(birthDate);
  if (Number.isNaN(birth.getTime())) {
    throw new Error('Invalid birthDate');
  }

  const age = calculateAge(birth, referenceDate);
  const classAge = calculateAge(birth, new Date(referenceDate.getFullYear(), 2, 31));

  if (classAge < 4) {
    return { age, category: 'Principiante', className: null };
  }
  if (classAge <= 9) {
    return { age, category: 'Aventurero', className: ADVENTURER_CLASSES[classAge - 4] };
  }
  if (classAge <= 15) {
    return { age, category: 'Conquistador', className: PATHFINDER_CLASSES[classAge - 10] };
  }
  return { age, category: 'Guía Mayor', className: null };
}

export function isAdult(birthDate: Date | string, referenceDate: Date = new Date()): boolean {
  return classify(birthDate, referenceDate).age >= MIN_ADULT_AGE;
}
