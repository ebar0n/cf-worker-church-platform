import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Montserrat } from 'next/font/google';
import Invitation from './components/Invitation';

// Same faces as the printed flyer: Bodoni for the title, Montserrat for details
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-bodoni',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const description =
  'Viernes 30 de octubre, 7:00 p.m. Iglesia Adventista El Jordán, Ibagué. Abre tu invitación y mira cómo llegar.';

export const metadata: Metadata = {
  title: 'Concierto Todo Nuevo | Iglesia Jordán Ibagué',
  description,
  alternates: { canonical: '/todo-nuevo' },
  openGraph: {
    title: 'Concierto Todo Nuevo: estás invitado',
    description,
    url: '/todo-nuevo',
    type: 'website',
    locale: 'es_CO',
    siteName: 'Iglesia Jordan Ibagué',
    images: [
      {
        url: '/eventos/todo-nuevo/poster.jpg',
        width: 1152,
        height: 2048,
        alt: 'Afiche del concierto musical Todo Nuevo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concierto Todo Nuevo: estás invitado',
    description,
  },
};

export const viewport: Viewport = {
  themeColor: '#0a1526',
};

export default function TodoNuevoPage() {
  return (
    <div className={`${bodoni.variable} ${montserrat.variable}`}>
      <Invitation />
    </div>
  );
}
