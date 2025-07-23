import React from 'react';
import Header from '@/app/components/Header';
import FriendForm from '@/app/friend/components/FriendForm';

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
