import React from 'react';
import Header from '@/app/components/Header';

export default async function Member() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <Header />
      <div className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#4b207f] md:text-4xl">
            Actualiza tus datos
          </h1>
          <p className="text-lg text-[#5e3929]">
            ¡Ayúdanos a mantenernos conectados! Actualiza tus datos y sigamos creciendo juntos como
            familia de fe.
          </p>
        </div>
        <form className="flex flex-col gap-6">
          <div>
            <label className="mb-1 block font-semibold text-[#4b207f]">Nombre completo</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-[#4b207f]">Teléfono</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              placeholder="Tu teléfono"
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-[#4b207f]">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              placeholder="Tu correo electrónico"
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-[#4b207f]">Dirección</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              placeholder="Tu dirección"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-[#4b207f]">
              Ministerio o área de servicio
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              placeholder="Ej: Escuela Sabática, Música, etc."
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f]"
          >
            Actualizar mis datos
          </button>
        </form>
      </div>
    </div>
  );
}
