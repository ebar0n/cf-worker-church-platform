import { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import Footer from '@/app/components/Footer';
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
};

export default function FriendContactForm() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-8 px-5 py-14 md:px-8 lg:gap-10 lg:py-24">
        <div className="flex flex-col gap-4">
          <h1 className="m-0 text-[40px] leading-[1.04] lg:text-[56px]">
            ¿Quieres que oremos por ti o te visitemos?
          </h1>
          <p className="text-ink-soft m-0 text-lg lg:text-xl">
            ¡Queremos conocerte y orar por ti! Déjanos tus datos y nos pondremos en contacto contigo
            muy pronto.
          </p>
        </div>
        <div className="bg-warm-soft flex gap-3 rounded-xl p-4 lg:px-5">
          <UserRound className="mt-0.5 h-5 w-5 flex-none" strokeWidth={1.5} />
          <p className="m-0 text-[15px] leading-relaxed">
            <strong className="font-semibold">¿Eres miembro de la iglesia?</strong> Te invitamos a{' '}
            <a href="/member" className="text-denim hover:text-ink font-medium underline">
              actualizar tus datos
            </a>{' '}
            en nuestro registro de miembros para mantenernos conectados.
          </p>
        </div>
        <div className="border-line rounded-2xl border bg-white p-6 lg:p-10">
          <FriendForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
