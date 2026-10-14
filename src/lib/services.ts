// Weekly services shown on the home page (schedule strip, "próximo
// servicio" and the visit card). weekday follows Date#getDay: 0 = domingo.
export interface ChurchService {
  name: string;
  description: string;
  day: string;
  weekday: number;
  hour: number;
  minute: number;
  time: string;
  period: 'AM' | 'PM';
}

export const SERVICES: ChurchService[] = [
  {
    name: 'Escuela Sabática',
    description: 'Estudio bíblico para todas las edades',
    day: 'Sábado',
    weekday: 6,
    hour: 9,
    minute: 30,
    time: '9:30',
    period: 'AM',
  },
  {
    name: 'Culto Principal',
    description: 'Adoración y predicación',
    day: 'Sábado',
    weekday: 6,
    hour: 11,
    minute: 0,
    time: '11:00',
    period: 'AM',
  },
  {
    name: 'Reunión de Oración',
    description: 'Momento de comunión y oración',
    day: 'Miércoles',
    weekday: 3,
    hour: 19,
    minute: 0,
    time: '7:00',
    period: 'PM',
  },
];

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEK_MINUTES = 7 * 24 * 60;

// Visitors' "hoy" is Bogotá's, whatever the device or server clock says.
function bogotaMinuteOfWeek(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return (weekday * 24 + Number(get('hour'))) * 60 + Number(get('minute'));
}

/** The next service to start (one starting this very minute counts). */
export function nextService(now: Date = new Date()): { when: string; name: string } {
  const current = bogotaMinuteOfWeek(now);
  const { service, wait } = SERVICES.map((service) => {
    const start = (service.weekday * 24 + service.hour) * 60 + service.minute;
    return { service, wait: (start - current + WEEK_MINUTES) % WEEK_MINUTES };
  }).reduce((best, candidate) => (candidate.wait < best.wait ? candidate : best));

  const daysAhead = Math.floor(((current % (24 * 60)) + wait) / (24 * 60));
  const day = daysAhead === 0 ? 'Hoy' : daysAhead === 1 ? 'Mañana' : DAYS[service.weekday];
  return { when: `${day} ${service.time} ${service.period}`, name: service.name };
}
