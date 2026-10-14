import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import Select from './Select';

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
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Información Profesional</h2>
        <p className="text-ink-soft text-[15px] md:text-base">
          Datos sobre tu formación académica y experiencia laboral
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="currentOccupation" className="text-sm font-medium">
            Ocupación actual
          </label>
          <Input
            id="currentOccupation"
            name="currentOccupation"
            value={formData.currentOccupation}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: Estudiante, Empleado, Independiente"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="workOrStudyPlace" className="text-sm font-medium">
            Lugar de trabajo o estudio
          </label>
          <Input
            id="workOrStudyPlace"
            name="workOrStudyPlace"
            value={formData.workOrStudyPlace}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Empresa, Universidad, Institución"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="professionalArea" className="text-sm font-medium">
            Área profesional
          </label>
          <Input
            id="professionalArea"
            name="professionalArea"
            value={formData.professionalArea}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: Tecnología, Salud, Educación"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="educationLevel" className="text-sm font-medium">
            Nivel de educación
          </label>
          <Select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={onChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona tu nivel de educación</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
            <option value="tecnico">Técnico</option>
            <option value="tecnologo">Tecnólogo</option>
            <option value="universitario">Universitario</option>
            <option value="posgrado">Posgrado</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="profession" className="text-sm font-medium">
            Profesión
          </label>
          <Input
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Ej: Ingeniero, Médico, Profesor"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="workExperience" className="text-sm font-medium">
            Experiencia laboral
          </label>
          <Textarea
            id="workExperience"
            name="workExperience"
            value={formData.workExperience}
            onChange={onChange}
            onBlur={onBlur}
            rows={3}
            placeholder="Describe brevemente tu experiencia laboral"
          />
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
