import React from 'react';

interface ProfessionalInfoStepProps {
  formData: {
    currentOccupation: string;
    workOrStudyPlace: string;
    professionalArea: string;
    educationLevel: string;
    profession: string;
    workExperience: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function ProfessionalInfoStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: ProfessionalInfoStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <label>Ocupación actual</label>
      <input
        name="currentOccupation"
        value={formData.currentOccupation}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Lugar de trabajo o estudio</label>
      <input
        name="workOrStudyPlace"
        value={formData.workOrStudyPlace}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Área profesional</label>
      <input
        name="professionalArea"
        value={formData.professionalArea}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Nivel de educación</label>
      <input
        name="educationLevel"
        value={formData.educationLevel}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Profesión</label>
      <input
        name="profession"
        value={formData.profession}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Experiencia laboral</label>
      <textarea
        name="workExperience"
        value={formData.workExperience}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
        rows={3}
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