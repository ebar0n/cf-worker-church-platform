import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Select from './Select';

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
    <div className="flex flex-col gap-8">
      {/* Skills Section */}
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Habilidades y Destrezas</h2>
          <p className="text-ink-soft text-[15px] md:text-base">
            Comparte tus habilidades para servir mejor en la iglesia
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="technicalSkills" className="text-sm font-medium">
              Habilidades técnicas
            </label>
            <Input
              type="text"
              id="technicalSkills"
              name="technicalSkills"
              value={formData.technicalSkills}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Computación, música, carpintería..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="softSkills" className="text-sm font-medium">
              Habilidades blandas
            </label>
            <Input
              type="text"
              id="softSkills"
              name="softSkills"
              value={formData.softSkills}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Liderazgo, comunicación, trabajo en equipo..."
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor="languages" className="text-sm font-medium">
              Idiomas que hablas
            </label>
            <Input
              type="text"
              id="languages"
              name="languages"
              value={formData.languages}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Español, inglés, portugués..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="interestsHobbies" className="text-sm font-medium">
              Intereses y hobbies
            </label>
            <Input
              type="text"
              id="interestsHobbies"
              name="interestsHobbies"
              value={formData.interestsHobbies}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Lectura, deportes, manualidades..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="volunteeringAvailability" className="text-sm font-medium">
              Disponibilidad para voluntariado
            </label>
            <Select
              id="volunteeringAvailability"
              name="volunteeringAvailability"
              value={formData.volunteeringAvailability}
              onChange={onChange}
              onBlur={onBlur}
            >
              <option value="">Selecciona una opción</option>
              <option value="weekends">Fines de semana</option>
              <option value="weekdays">Días de semana</option>
              <option value="evenings">Noches</option>
              <option value="flexible">Horario flexible</option>
              <option value="limited">Tiempo limitado</option>
              <option value="not_available">No disponible por el momento</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Health Section */}
      <div className="border-line flex flex-col gap-6 border-t pt-8 md:gap-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[28px] leading-[1.15] md:text-[32px]">
            Salud y Necesidades Especiales
          </h2>
          <p className="text-ink-soft text-[15px] md:text-base">
            Información para brindarte mejor atención y apoyo
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="medicalConditions" className="text-sm font-medium">
              Condiciones médicas
            </label>
            <Input
              type="text"
              id="medicalConditions"
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Diabetes, hipertensión, alergias..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="specialNeeds" className="text-sm font-medium">
              Necesidades especiales
            </label>
            <Input
              type="text"
              id="specialNeeds"
              name="specialNeeds"
              value={formData.specialNeeds}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Movilidad reducida, silla de ruedas..."
            />
          </div>
        </div>
      </div>

      <div className="border-line flex items-center justify-between gap-3 border-t pt-6">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Atrás
        </Button>
        <Button type="button" size="lg" onClick={onNext} className="flex-1 md:flex-none">
          Siguiente
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
