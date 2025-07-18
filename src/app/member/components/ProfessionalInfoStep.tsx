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
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#5e3929] mb-2">Información Profesional</h2>
        <p className="text-[#5e3929] opacity-80">
          Datos sobre tu formación académica y experiencia laboral
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="currentOccupation" className="text-sm font-medium text-[#5e3929]">
            Ocupación actual
          </label>
          <input
            id="currentOccupation"
            name="currentOccupation"
            value={formData.currentOccupation}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Estudiante, Empleado, Independiente"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="workOrStudyPlace" className="text-sm font-medium text-[#5e3929]">
            Lugar de trabajo o estudio
          </label>
          <input
            id="workOrStudyPlace"
            name="workOrStudyPlace"
            value={formData.workOrStudyPlace}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Empresa, Universidad, Institución"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="professionalArea" className="text-sm font-medium text-[#5e3929]">
            Área profesional
          </label>
          <input
            id="professionalArea"
            name="professionalArea"
            value={formData.professionalArea}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Tecnología, Salud, Educación"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="educationLevel" className="text-sm font-medium text-[#5e3929]">
            Nivel de educación
          </label>
          <select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu nivel de educación</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
            <option value="tecnico">Técnico</option>
            <option value="tecnologo">Tecnólogo</option>
            <option value="universitario">Universitario</option>
            <option value="posgrado">Posgrado</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="profession" className="text-sm font-medium text-[#5e3929]">
            Profesión
          </label>
          <input
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Ingeniero, Médico, Profesor"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="workExperience" className="text-sm font-medium text-[#5e3929]">
          Experiencia laboral
        </label>
        <textarea
          id="workExperience"
          name="workExperience"
          value={formData.workExperience}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          rows={3}
          placeholder="Describe brevemente tu experiencia laboral"
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
