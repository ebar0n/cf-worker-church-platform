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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#5e3929] mb-2">Salud y Necesidades Especiales</h2>
        <p className="text-[#5e3929] opacity-80">
          Información para brindarte mejor atención y apoyo
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="medicalConditions" className="text-sm font-medium text-[#5e3929]">
            Condiciones médicas
          </label>
          <input
            id="medicalConditions"
            name="medicalConditions"
            value={formData.medicalConditions}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Diabetes, Hipertensión, Alergias"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="specialNeeds" className="text-sm font-medium text-[#5e3929]">
            Necesidades especiales
          </label>
          <input
            id="specialNeeds"
            name="specialNeeds"
            value={formData.specialNeeds}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Movilidad reducida, Discapacidad auditiva"
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 rounded-lg border border-[#4b207f] px-6 py-2 text-[#4b207f] hover:bg-[#4b207f] hover:text-white md:flex-none md:px-8"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg bg-[#4b207f] px-6 py-2 text-white hover:bg-[#3a1a5f] md:flex-none md:px-8"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
