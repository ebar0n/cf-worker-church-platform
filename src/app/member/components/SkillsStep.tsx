import React from 'react';

interface SkillsStepProps {
  formData: {
    technicalSkills: string;
    softSkills: string;
    languages: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function SkillsStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: SkillsStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Habilidades y Destrezas</h2>
        <p className="text-[#5e3929] opacity-80">
          Comparte tus habilidades para servir mejor en la iglesia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="technicalSkills" className="text-sm font-medium text-[#5e3929]">
            Habilidades técnicas
          </label>
          <input
            id="technicalSkills"
            name="technicalSkills"
            value={formData.technicalSkills}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Computación, Mecánica, Electricidad"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="softSkills" className="text-sm font-medium text-[#5e3929]">
            Habilidades blandas
          </label>
          <input
            id="softSkills"
            name="softSkills"
            value={formData.softSkills}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Liderazgo, Comunicación, Organización"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="languages" className="text-sm font-medium text-[#5e3929]">
          Idiomas que hablas
        </label>
        <input
          id="languages"
          name="languages"
          value={formData.languages}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          placeholder="Ej: Español, Inglés, Francés"
        />
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
