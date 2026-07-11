// Age classification for Adventist programs, following the
// Inter-American Division scheme used in Colombia (mundoja.org).
// Computed from birthDate on read — never stored — so every participant
// moves up automatically each year. (specs/program-family-enrollment.md)

export type AgeCategory = 'Principiante' | 'Aventurero' | 'Conquistador' | 'Guía Mayor';

export interface AgeClassification {
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

export function classify(
  birthDate: Date | string,
  referenceDate: Date = new Date()
): AgeClassification {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (Number.isNaN(birth.getTime())) {
    throw new Error('Invalid birthDate');
  }

  const age = calculateAge(birth, referenceDate);

  if (age < 4) {
    return { age, category: 'Principiante', className: null };
  }
  if (age <= 9) {
    return { age, category: 'Aventurero', className: ADVENTURER_CLASSES[age - 4] };
  }
  if (age <= 15) {
    return { age, category: 'Conquistador', className: PATHFINDER_CLASSES[age - 10] };
  }
  return { age, category: 'Guía Mayor', className: null };
}

export function isAdult(birthDate: Date | string, referenceDate: Date = new Date()): boolean {
  return classify(birthDate, referenceDate).age >= MIN_ADULT_AGE;
}
