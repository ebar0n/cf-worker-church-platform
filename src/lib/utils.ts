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

// Program dates/times are stored as entered (local, no timezone). Formatting
// in UTC keeps the day from shifting and the server/client render identical.
export function formatEventDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatEventTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'a. m.' : 'p. m.'}`;
}
