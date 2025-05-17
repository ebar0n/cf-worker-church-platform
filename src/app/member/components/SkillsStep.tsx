import React from 'react';

interface SkillsStepProps {
  formData: {
    technicalSkills: string;
    softSkills: string;
    languages: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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
    <div className="flex flex-col gap-4">
      <label>Habilidades técnicas</label>
      <input
        name="technicalSkills"
        value={formData.technicalSkills}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Habilidades blandas</label>
      <input
        name="softSkills"
        value={formData.softSkills}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Idiomas que hablas</label>
      <input
        name="languages"
        value={formData.languages}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={onPrev}
          className="text-[#4b207f] underline"
        >
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