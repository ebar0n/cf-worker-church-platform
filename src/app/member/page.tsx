import { Metadata } from 'next';
import MemberFormClient from './components/MemberFormClient';

export const metadata: Metadata = {
  title: 'Registro de Miembros - Iglesia Adventista del 7mo día - Jordan Ibague',
  description:
    'Actualiza tus datos como miembro de nuestra iglesia. Mantén tu información al día para estar conectado con nuestras actividades y ministerios.',
  keywords: ['miembros', 'iglesia', 'registro', 'actualización', 'ministerios', 'servicio'],
  authors: [{ name: 'Iglesia Adventista del 7mo día' }],
  openGraph: {
    title: 'Registro de Miembros - Iglesia Adventista del 7mo día - Jordan Ibague',
    description:
      'Actualiza tus datos como miembro de nuestra iglesia. Mantén tu información al día para estar conectado con nuestras actividades y ministerios.',
    type: 'website',
    url: 'https://iglesiajordanibague.org/member',
    siteName: 'Iglesia Adventista del 7mo día',
    images: [
      {
        url: 'https://iglesiajordanibague.org/form-member-whatsapp.jpg',
        width: 1200,
        height: 630,
        alt: 'Formulario de registro de miembros - Iglesia Adventista del 7mo día',
        type: 'image/jpeg',
      },
    ],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registro de Miembros - Iglesia Adventista del 7mo día - Jordan Ibague',
    description:
      'Actualiza tus datos como miembro de nuestra iglesia. Mantén tu información al día para estar conectado con nuestras actividades y ministerios.',
    images: ['https://iglesiajordanibague.org/form-member-whatsapp.jpg'],
  },
  other: {
    'theme-color': '#4b207f',
  },
};

export default function MemberPage() {
  return <MemberFormClient />;
}
