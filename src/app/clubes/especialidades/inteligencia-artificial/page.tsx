import { Metadata } from 'next';
import InteligenciaArtificialClient from './components/InteligenciaArtificialClient';

// Generate metadata for the AI specialty page
export const metadata: Metadata = {
  title: 'Especialidad de Inteligencia Artificial - Club de Conquistadores',
  description:
    'Descubre el fascinante mundo de la IA: desde conceptos básicos hasta aplicaciones revolucionarias en medicina, educación y tecnología. Actividad educativa para jóvenes del Club de Conquistadores.',
  keywords: [
    'inteligencia artificial',
    'IA',
    'tecnología',
    'educación',
    'conquistadores',
    'club de conquistadores',
    'especialidad',
    'jóvenes',
    'aprendizaje',
    'tecnología educativa',
  ],
  authors: [{ name: 'Club de Conquistadores - Iglesia Adventista' }],
  openGraph: {
    title: 'Especialidad de Inteligencia Artificial - Club de Conquistadores',
    description:
      'Explora el mundo de la IA con 14 preguntas educativas diseñadas para jóvenes. Desde conceptos básicos hasta casos reales en América Latina.',
    type: 'article',
    url: 'https://iglesiajordanibague.org/clubes/especialidades/inteligencia-artificial',
    siteName: 'Iglesia Adventista del 7mo día',
    images: [
      {
        url: '/departments/clubes/especialidades/Inteligencia-Artificial.jpg',
        width: 1200,
        height: 630,
        alt: 'Logo Especialidad de Inteligencia Artificial',
        type: 'image/jpeg',
      },
    ],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Especialidad de Inteligencia Artificial - Club de Conquistadores',
    description:
      'Explora el mundo de la IA con 14 preguntas educativas diseñadas para jóvenes. Desde conceptos básicos hasta casos reales en América Latina.',
    images: ['/departments/clubes/especialidades/Inteligencia-Artificial.jpg'],
  },
  other: {
    'theme-color': '#FFD700', // Gold color for Conquistadores club
  },
};

export default function InteligenciaArtificialPage() {
  return <InteligenciaArtificialClient />;
}
