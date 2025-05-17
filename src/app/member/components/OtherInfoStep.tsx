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
    <div className="flex flex-col gap-4">
      <label>Intereses y hobbies</label>
      <input
        name="interestsHobbies"
        value={formData.interestsHobbies}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Disponibilidad para voluntariado</label>
      <input
        name="volunteeringAvailability"
        value={formData.volunteeringAvailability}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <div className="mt-4 flex justify-between">
        <button type="button" onClick={onPrev} className="text-[#4b207f] underline">
          Atrás
        </button>
        <button
          type="submit"
          onClick={onSubmit}
          className="rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white"
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
      {success && <div className="mt-2 text-green-600">{success}</div>}
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </div>
  );
}
