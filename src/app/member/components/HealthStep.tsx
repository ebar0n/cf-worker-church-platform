import React from 'react';

interface HealthStepProps {
  formData: {
    medicalConditions: string;
    specialNeeds: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function HealthStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: HealthStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label>Condiciones médicas</label>
      <input
        name="medicalConditions"
        value={formData.medicalConditions}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Necesidades especiales</label>
      <input
        name="specialNeeds"
        value={formData.specialNeeds}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <div className="mt-4 flex justify-between">
        <button type="button" onClick={onPrev} className="text-[#4b207f] underline">
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
