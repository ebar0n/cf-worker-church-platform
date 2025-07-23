import React from 'react';

interface SkillsAndHealthStepProps {
  formData: {
    technicalSkills: string;
    softSkills: string;
    languages: string;
    interestsHobbies: string;
    volunteeringAvailability: string;
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

export default function SkillsAndHealthStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: SkillsAndHealthStepProps) {
  return (
    <div className="space-y-8">
      {/* Skills Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Habilidades y Destrezas</h2>
          <p className="text-lg text-[#5e3929]">
            Comparte tus habilidades para servir mejor en la iglesia
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="technicalSkills"
              className="mb-2 block text-sm font-medium text-[#5e3929]"
            >
              Habilidades técnicas
            </label>
            <input
              type="text"
              id="technicalSkills"
              name="technicalSkills"
              value={formData.technicalSkills}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
              placeholder="Ej: Computación, música, carpintería..."
            />
          </div>

          <div>
            <label htmlFor="softSkills" className="mb-2 block text-sm font-medium text-[#5e3929]">
              Habilidades blandas
            </label>
            <input
              type="text"
              id="softSkills"
              name="softSkills"
              value={formData.softSkills}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
              placeholder="Ej: Liderazgo, comunicación, trabajo en equipo..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="languages" className="mb-2 block text-sm font-medium text-[#5e3929]">
            Idiomas que hablas
          </label>
          <input
            type="text"
            id="languages"
            name="languages"
            value={formData.languages}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
            placeholder="Ej: Español, inglés, portugués..."
          />
        </div>

        <div>
          <label
            htmlFor="interestsHobbies"
            className="mb-2 block text-sm font-medium text-[#5e3929]"
          >
            Intereses y hobbies
          </label>
          <input
            type="text"
            id="interestsHobbies"
            name="interestsHobbies"
            value={formData.interestsHobbies}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
            placeholder="Ej: Lectura, deportes, manualidades..."
          />
        </div>

        <div>
          <label
            htmlFor="volunteeringAvailability"
            className="mb-2 block text-sm font-medium text-[#5e3929]"
          >
            Disponibilidad para voluntariado
          </label>
          <select
            id="volunteeringAvailability"
            name="volunteeringAvailability"
            value={formData.volunteeringAvailability}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
          >
            <option value="">Selecciona una opción</option>
            <option value="weekends">Fines de semana</option>
            <option value="weekdays">Días de semana</option>
            <option value="evenings">Noches</option>
            <option value="flexible">Horario flexible</option>
            <option value="limited">Tiempo limitado</option>
            <option value="not_available">No disponible por el momento</option>
          </select>
        </div>
      </div>

      {/* Health Section */}
      <div className="space-y-6 border-t border-gray-200 pt-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Salud y Necesidades Especiales</h2>
          <p className="text-lg text-[#5e3929]">
            Información para brindarte mejor atención y apoyo
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="medicalConditions"
              className="mb-2 block text-sm font-medium text-[#5e3929]"
            >
              Condiciones médicas
            </label>
            <input
              type="text"
              id="medicalConditions"
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
              placeholder="Ej: Diabetes, hipertensión, alergias..."
            />
          </div>

          <div>
            <label htmlFor="specialNeeds" className="mb-2 block text-sm font-medium text-[#5e3929]">
              Necesidades especiales
            </label>
            <input
              type="text"
              id="specialNeeds"
              name="specialNeeds"
              value={formData.specialNeeds}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
              placeholder="Ej: Movilidad reducida, silla de ruedas..."
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-full border border-[#4b207f] bg-white px-8 py-3 font-medium text-[#4b207f] shadow-md transition-colors hover:bg-[#4b207f] hover:text-white"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f]"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
