'use client';

import React, { useState } from 'react';

const initialState = {
  name: '',
  phone: '',
  address: '',
  reason: '',
};

export default function FriendForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        setError(data.error || 'Error al enviar la solicitud');
      } else {
        setSuccess(true);
        setForm(initialState);
      }
    } catch {
      setError('Error de red o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Nombre completo</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu nombre"
          required
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Teléfono</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu teléfono"
          required
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">Dirección (opcional)</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          placeholder="Tu dirección"
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold text-[#4b207f]">¿Cómo podemos ayudarte?</label>
        <select
          name="reason"
          value={form.reason}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
          required
        >
          <option value="">Selecciona una opción</option>
          <option value="oracion">Quiero que oren por mí</option>
          <option value="visita">Quiero que me visiten</option>
          <option value="informacion">Quiero más información</option>
        </select>
      </div>
      <button
        type="submit"
        className="mt-4 rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f]"
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
      {success && (
        <div className="text-center font-semibold text-green-600">
          ¡Solicitud enviada correctamente!
        </div>
      )}
      {error && <div className="text-center font-semibold text-red-600">{error}</div>}
    </form>
  );
}
