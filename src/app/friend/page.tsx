import { Metadata } from 'next';
import React from 'react';
import Header from '@/app/components/Header';
import FriendForm from '@/app/friend/components/FriendForm';

export const metadata: Metadata = {
  title: 'Contacto y Oración - Iglesia Adventista del 7mo día',
  description:
    '¿Quieres que oremos por ti o te visitemos? ¡Queremos conocerte y orar por ti! Déjanos tus datos y nos pondremos en contacto contigo muy pronto.',
  keywords: ['oración', 'visita', 'contacto', 'iglesia', 'comunidad', 'apoyo'],
  authors: [{ name: 'Iglesia Adventista del 7mo día' }],
  openGraph: {
    title: '¿Quieres que oremos por ti o te visitemos?',
    description:
      '¡Queremos conocerte y orar por ti! Déjanos tus datos y nos pondremos en contacto contigo muy pronto.',
    type: 'website',
    url: 'https://iglesiajordanibague.org/friend',
    siteName: 'Iglesia Adventista del 7mo día',
    images: [
      {
        url: 'https://iglesiajordanibague.org/form-friend-whatsapp.jpg',
        width: 1200,
        height: 630,
        alt: 'Formulario de contacto y oración - Iglesia Adventista del 7mo día',
        type: 'image/jpeg',
      },
    ],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: '¿Quieres que oremos por ti o te visitemos?',
    description:
      '¡Queremos conocerte y orar por ti! Déjanos tus datos y nos pondremos en contacto contigo muy pronto.',
    images: ['https://iglesiajordanibague.org/form-friend-whatsapp.jpg'],
  },
  other: {
    'theme-color': '#4b207f',
  },
};

export default function FriendContactForm() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <Header />
      <div className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#4b207f] md:text-4xl">
            ¿Quieres que oremos por ti o te visitemos?
          </h1>
          <p className="text-lg text-[#5e3929]">
            ¡Queremos conocerte y orar por ti! Déjanos tus datos y nos pondremos en contacto contigo
            muy pronto.
          </p>
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>¿Eres miembro de la iglesia?</strong> Te invitamos a{' '}
              <a
                href="/member"
                className="font-semibold text-blue-600 underline hover:text-blue-800"
              >
                actualizar tus datos
              </a>{' '}
              en nuestro registro de miembros para mantenernos conectados.
            </p>
          </div>
        </div>
        <FriendForm />
      </div>
    </div>
  );
}
