import React from 'react';

interface OtherInfoStepProps {
  formData: {
    interestsHobbies: string;
    volunteeringAvailability: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPrev: () => void;
  submitting: boolean;
  isExisting: boolean;
  success: string | null;
  error: string | null;
  onBlur: () => void;
}

export default function OtherInfoStep({
  formData,
  onChange,
  onSubmit,
  onPrev,
  submitting,
  isExisting,
  success,
  error,
  onBlur,
}: OtherInfoStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#5e3929] mb-2">Información Adicional</h2>
        <p className="text-[#5e3929] opacity-80">
          Últimos detalles para completar tu registro
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="interestsHobbies" className="text-sm font-medium text-[#5e3929]">
            Intereses y hobbies
          </label>
          <input
            id="interestsHobbies"
            name="interestsHobbies"
            value={formData.interestsHobbies}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Música, Deportes, Lectura"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="volunteeringAvailability" className="text-sm font-medium text-[#5e3929]">
            Disponibilidad para voluntariado
          </label>
          <select
            id="volunteeringAvailability"
            name="volunteeringAvailability"
            value={formData.volunteeringAvailability}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu disponibilidad</option>
            <option value="mañanas">Mañanas</option>
            <option value="tardes">Tardes</option>
            <option value="noches">Noches</option>
            <option value="fines_semana">Fines de semana</option>
            <option value="ocasional">Ocasionalmente</option>
            <option value="no_disponible">No disponible por el momento</option>
          </select>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 rounded-lg border border-[#4b207f] px-6 py-2 text-[#4b207f] hover:bg-[#4b207f] hover:text-white md:flex-none md:px-8"
        >
          Atrás
        </button>
        <button
          type="submit"
          onClick={onSubmit}
          className="flex-1 rounded-lg bg-[#4b207f] px-6 py-2 text-white hover:bg-[#3a1a5f] disabled:bg-[#d4c5b9] md:flex-none md:px-8"
          disabled={submitting}
        >
          {submitting
            ? isExisting
              ? 'Actualizando...'
              : 'Registrando...'
            : isExisting
              ? 'Actualizar mis datos'
              : 'Registrarme'}
        </button>
      </div>
    </div>
  );
}
