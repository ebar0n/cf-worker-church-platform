import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Program sign-ups store gender as 'M'/'F' while older child sign-ups stored
// 'male'/'female'; both live in the DB, so labels normalize on read.
export function genderLabel(gender?: string | null): string {
  if (gender === 'M' || gender === 'male') return 'Masculino';
  if (gender === 'F' || gender === 'female') return 'Femenino';
  return 'No especificado';
}
