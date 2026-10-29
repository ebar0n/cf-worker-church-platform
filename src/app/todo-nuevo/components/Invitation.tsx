'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarPlus, ChevronDown, MapPin, Share2 } from 'lucide-react';
import styles from '../invitation.module.css';

// 7:00 p.m. in Ibagué (UTC-5 all year)
export const EVENT_START = Date.parse('2026-10-30T19:00:00-05:00');
const EVENT_END = EVENT_START + 2 * 60 * 60 * 1000;

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Iglesia%20Adventista%20del%207%C2%B0%20D%C3%ADa%20El%20Jord%C3%A1n%2C%20Ibagu%C3%A9';
const GOOGLE_CALENDAR_URL = `https://calendar.google.com/calendar/render?${new URLSearchParams({
  action: 'TEMPLATE',
  text: 'Concierto Todo Nuevo',
  dates: '20261031T000000Z/20261031T020000Z',
  ctz: 'America/Bogota',
  location: 'Iglesia Adventista El Jordán, Manzana 3 Casa 12, Jordán 4.ª Etapa, Ibagué',
  details: 'Concierto musical Todo Nuevo',
})}`;
const ICS_URL = '/eventos/todo-nuevo/todo-nuevo.ics';
const SHARE_TEXT =
  'Te invito al concierto Todo Nuevo: viernes 30 de octubre, 7:00 p.m., en la Iglesia Adventista El Jordán.';

const bogotaDay = (t: number) =>
  new Date(t).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export function countdown(now: number) {
  if (now >= EVENT_END) return { phase: 'over' } as const;
  if (now >= EVENT_START) return { phase: 'live' } as const;

  const daysAway = (Date.parse(bogotaDay(EVENT_START)) - Date.parse(bogotaDay(now))) / 86_400_000;
  const when = daysAway === 0 ? 'Hoy, viernes' : daysAway === 1 ? 'Mañana, viernes' : 'El viernes';

  const s = Math.floor((EVENT_START - now) / 1000);
  const days = Math.floor(s / 86_400);
  const parts: [number, string][] = [
    [Math.floor(s / 3600) % 24, 'horas'],
    [Math.floor(s / 60) % 60, 'minutos'],
    [s % 60, 'segundos'],
  ];
  if (days > 0) parts.unshift([days, days === 1 ? 'día' : 'días']);
  return { phase: 'before', title: `${when} 30 de octubre, a las 7:00 p.m.`, parts } as const;
}

const subscribeToClock = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};
const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;

async function shareInvitation() {
  const url = `${location.origin}/todo-nuevo`;
  if (navigator.share) {
    // Rejects when the person closes the share sheet: nothing to do
    await navigator.share({ title: 'Concierto Todo Nuevo', text: SHARE_TEXT, url }).catch(() => {});
    return;
  }
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`,
    '_blank',
    'noopener'
  );
}

function AdventistLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 169.8 170.1" aria-hidden="true">
      <path
        transform="translate(-20.5,-20.6)"
        d="m 128.7,161.7 c -11.5,-1.9 -17.7,3.5 -19.6,8.6 -0.2,0.5 -0.7,0.4 -0.7,0 v -1.6 c 0,-5.7 5.1,-10.9 11.1,-17 l 10,-10 26.6,4.6 c 0,0 7.6,7.6 14.1,14.1 12.5,-14.8 20.1,-34 20.1,-54.9 0,-46.9 -38,-84.9 -84.9,-84.9 -46.9,0 -84.9,38 -84.9,84.9 0,20.9 7.6,40.1 20.1,54.9 6.5,-6.5 14.1,-14.1 14.1,-14.1 l 30.2,-5.2 c 14,-2.4 17.5,0.7 17.5,5.4 0,0.2 -0.2,0.4 -0.4,0.4 h -8.5 c -0.2,0 -0.2,0.2 -0.2,0.4 v 5.2 c 0,0.2 -0.2,0.2 0,0.2 h 8.7 c 0.2,0 0.4,0.2 0.4,0.4 0,0 0,16.9 0,17.3 0,0.4 -0.5,0.5 -0.7,0.1 -1.9,-5.1 -8.1,-10.5 -19.6,-8.6 0,0 -19.9,3.4 -34.7,6 15.2,14.1 35.5,22.8 57.9,22.8 22.4,0 42.7,-8.6 57.9,-22.8 -14.6,-2.8 -34.5,-6.2 -34.5,-6.2 z m -19.5,0.2 c -0.1,0.5 -0.7,0.5 -0.7,0 V 153 c 0,-0.2 0.1,-0.4 0.3,-0.4 h 4.4 c -1.9,2.7 -3.2,5.3 -4,9.3 z m 31.5,-55.5 c 2.1,6.9 0.7,17.4 -9.2,27.4 l -12,11.8 c -0.3,0.3 -0.7,0.8 -1,0.8 h -8.2 c 2,-3 5.4,-6.8 9.2,-10.6 l 8.3,-8.3 C 138.3,117 140,112 140,106.2 c 0.1,-0.4 0.6,-0.4 0.7,0.2 z m -16.3,-6.5 c 6.8,-6.8 8.5,-14.7 3,-19.4 -0.5,-0.4 -0.2,-0.9 0.4,-0.6 6.8,3.1 12.1,14.3 0.5,25.9 l -8.8,8.8 c -6,6 -8.8,8.8 -10.3,16.1 -0.1,0.5 -0.7,0.5 -0.7,0 v -8.9 c 0,-5.7 5,-10.9 11.1,-17 z m -54.1,8 C 68.2,101 69.6,90.5 79.5,80.5 l 26.4,-26.4 c 6,-6 9.1,-8.9 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 L 83.3,86.6 C 72.7,97.2 71,102.1 71,107.9 c 0,0.6 -0.5,0.6 -0.7,0 z m 4,15.7 c -5.9,-7.2 -3.9,-18.4 7.7,-30 l 23.9,-23.9 c 6,-6 9.1,-8.9 10.6,-16.2 0.1,-0.5 1,-0.5 1,0 v 9 c 0,5.7 -5.3,10.9 -11.4,17 l -21.2,21.1 c -4.4,4.4 -13.9,13.8 -10,22.6 0.3,0.6 -0.2,0.9 -0.6,0.4 z m 12.3,-9.2 c -6.8,6.8 -8.5,14.7 -3,19.4 0.5,0.4 0.2,0.9 -0.4,0.6 -6.8,-3.1 -12.1,-14.3 -0.5,-25.9 l 23.2,-23.2 c 6,-6 9.1,-8.8 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 z m 21.9,23 c 0,-5.7 5,-10.9 11.1,-17 l 6.7,-6.7 c 4.4,-4.4 13.8,-13.8 9.9,-22.6 -0.3,-0.6 0.2,-0.9 0.6,-0.4 5.9,7.2 3.9,18.4 -7.7,30 l -9.5,9.5 c -6,6 -8.8,8.9 -10.3,16.2 -0.1,0.5 -0.7,0.5 -0.7,0 v -9 z"
      />
    </svg>
  );
}

function Details() {
  const now = useSyncExternalStore(subscribeToClock, currentSecond, () => null);
  const left = now === null ? null : countdown(now);

  return (
    <div id="detalles" className={styles.details}>
      <section>
        <h2 className={styles.date}>
          {left?.phase === 'before' ? left.title : 'Viernes 30 de octubre, a las 7:00 p.m.'}
        </h2>
        {left?.phase === 'before' && (
          <div
            className={styles.clock}
            role="timer"
            aria-label="Tiempo que falta para el concierto"
          >
            {left.parts.map(([value, unit]) => (
              <span key={unit}>
                <span className={styles.digits}>{String(value).padStart(2, '0')}</span>
                <span className={styles.unit}>{unit}</span>
              </span>
            ))}
          </div>
        )}
        {left?.phase === 'live' && (
          <p className={styles.status}>El concierto ya comenzó. ¡Todavía estás a tiempo!</p>
        )}
        {left?.phase === 'over' && (
          <p className={styles.status}>Gracias por acompañarnos en Todo Nuevo.</p>
        )}
      </section>

      <section>
        <h2 className={styles.label}>Dónde</h2>
        <address className={styles.address}>
          Manzana 3, Casa 12
          <br />
          Jordán 4.ª Etapa
        </address>
        <p className={styles.muted}>Iglesia Adventista El Jordán, Ibagué</p>
        <a className={styles.primary} href={MAPS_URL} target="_blank" rel="noopener noreferrer">
          <MapPin aria-hidden="true" size={18} />
          Cómo llegar
        </a>
      </section>

      <section>
        <h2 className={styles.label}>Guárdalo en tu calendario</h2>
        <div className={styles.row}>
          <a
            className={styles.secondary}
            href={GOOGLE_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarPlus aria-hidden="true" size={17} />
            Google Calendar
          </a>
          {/* Safari opens .ics files straight into the Calendar app */}
          <a className={styles.secondary} href={ICS_URL}>
            <CalendarPlus aria-hidden="true" size={17} />
            iPhone u Outlook
          </a>
        </div>
      </section>

      <blockquote className={styles.verse}>
        <p>«He aquí, yo hago nuevas todas las cosas».</p>
        <cite>Apocalipsis 21:5</cite>
      </blockquote>

      <section>
        <h2 className={styles.label}>¿A quién te gustaría traer?</h2>
        <p className={styles.muted}>Comparte esta invitación con un amigo o con tu familia.</p>
        <button type="button" className={styles.primary} onClick={shareInvitation}>
          <Share2 aria-hidden="true" size={18} />
          Compartir invitación
        </button>
      </section>

      <footer className={styles.footer}>
        <AdventistLogo className={styles.footerLogo} />
        <Link href="/">Conoce la Iglesia Adventista El Jordán</Link>
      </footer>
    </div>
  );
}

export default function Invitation() {
  const [opened, setOpened] = useState(false);
  const [showFront, setShowFront] = useState(false);
  const ticket = useRef<HTMLButtonElement>(null);

  // Tilt and foil highlight follow the mouse; x and y go from -1 to 1
  function setTilt(x: number, y: number) {
    const style = ticket.current?.style;
    if (!style) return;
    style.setProperty('--rx', `${-y * 8}deg`);
    style.setProperty('--ry', `${x * 10}deg`);
    style.setProperty('--mx', `${50 + x * 40}%`);
    style.setProperty('--my', `${40 + y * 40}%`);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (opened || e.pointerType !== 'mouse' || !ticket.current) return;
    const r = ticket.current.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    setTilt(
      clamp(((e.clientX - r.left) / r.width) * 2 - 1),
      clamp(((e.clientY - r.top) / r.height) * 2 - 1)
    );
  }

  function onTicketClick() {
    if (opened) {
      setShowFront((front) => !front);
      return;
    }
    setTilt(0, 0);
    navigator.vibrate?.(15);
    setOpened(true);
  }

  return (
    <main
      className={styles.page}
      data-opened={opened || undefined}
      data-front={showFront || undefined}
    >
      <h1 className="sr-only">Invitación al concierto Todo Nuevo</h1>

      <section
        className={styles.stage}
        onPointerMove={onPointerMove}
        onPointerLeave={() => !opened && setTilt(0, 0)}
      >
        <div className={styles.float}>
          <span className={styles.rays} aria-hidden="true" />
          <span className={styles.burst} aria-hidden="true" />
          <button
            ref={ticket}
            type="button"
            className={styles.ticket}
            onClick={onTicketClick}
            aria-label={
              !opened
                ? 'Abrir la invitación'
                : showFront
                  ? 'Voltear para ver el afiche'
                  : 'Voltear para ver el pase'
            }
          >
            <span className={styles.card}>
              <span className={`${styles.face} ${styles.front}`}>
                <span className={styles.church}>
                  <AdventistLogo className={styles.logo} />
                  <span>
                    Iglesia Adventista del Séptimo Día
                    <br />
                    El Jordán, Ibagué
                  </span>
                </span>
                <span className={styles.kicker}>Concierto musical</span>
                <span className={styles.title}>
                  Todo
                  <br />
                  Nuevo
                </span>
                <span className={styles.facts}>
                  <span className={styles.fact}>
                    <span className={styles.factLabel}>Fecha</span>
                    Viernes 30 de octubre
                  </span>
                  <span className={`${styles.fact} ${styles.factEnd}`}>
                    <span className={styles.factLabel}>Hora</span>
                    7:00 p.m.
                  </span>
                  <span className={`${styles.fact} ${styles.factWide}`}>
                    <span className={styles.factLabel}>Lugar</span>
                    Mz 3 Casa 12, Jordán 4.ª Etapa
                  </span>
                </span>
                <span className={styles.sheen} />
              </span>
              <span className={`${styles.face} ${styles.back}`}>
                <Image
                  src="/eventos/todo-nuevo/poster.jpg"
                  alt=""
                  fill
                  loading="eager"
                  sizes="(max-width: 480px) 78vw, 304px"
                  className={styles.poster}
                />
              </span>
            </span>
            <span className={styles.stub} aria-hidden="true">
              <span className={styles.stubText}>
                <span className={styles.factLabel}>Pase de entrada</span>
                <span className={styles.forYou}>Para ti</span>
              </span>
              <span className={styles.barcode} />
            </span>
          </button>
        </div>

        {opened ? (
          <a href="#detalles" className={styles.cue}>
            Ver los detalles
            <ChevronDown aria-hidden="true" size={18} />
          </a>
        ) : (
          <p className={styles.hint}>Toca el pase para abrirlo</p>
        )}
      </section>

      {opened && <Details />}
    </main>
  );
}
