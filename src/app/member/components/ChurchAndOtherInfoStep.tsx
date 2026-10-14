import React from 'react';
import { AlertCircle, ArrowLeft, CircleCheck } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import Select from './Select';

interface ChurchAndOtherInfoStepProps {
  formData: {
    ministry: string;
    areasToServe: string;
    willingToLead: boolean;
    suggestions: string;
    pastoralNotes: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onPrev: () => void;
  onBlur: () => void;
  submitting: boolean;
  isExisting: boolean;
  success: string | null;
  error: string | null;
}

export default function ChurchAndOtherInfoStep({
  formData,
  onChange,
  onSubmit,
  onPrev,
  onBlur,
  submitting,
  isExisting,
  success,
  error,
}: ChurchAndOtherInfoStepProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Church Information Section */}
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Información de Iglesia</h2>
          <p className="text-ink-soft text-[15px] md:text-base">
            Ayúdanos a conocer cómo puedes servir en la iglesia
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="ministry" className="text-sm font-medium">
              Ministerio actual o de interés
            </label>
            <Select
              id="ministry"
              name="ministry"
              value={formData.ministry}
              onChange={onChange}
              onBlur={onBlur}
            >
              <option value="">Selecciona un ministerio</option>
              <option value="ministerio-musica">Ministerio de Música</option>
              <option value="ministerio-infantil">Ministerio Infantil</option>
              <option value="ministerio-juvenil">Ministerio Juvenil</option>
              <option value="ministerio-familia">Ministerio de Familia</option>
              <option value="ministerio-mujer">Ministerio de Mujer</option>
              <option value="ministerio-hombre">Ministerio de Hombre</option>
              <option value="escuela-sabatica">Escuela Sabática</option>
              <option value="ministerio-salud">Ministerio de Salud</option>
              <option value="ministerio-publicaciones">Ministerio de Publicaciones</option>
              <option value="libertad-religiosa">Libertad Religiosa</option>
              <option value="mayordomia">Mayordomía Cristiana</option>
              <option value="servicios-comunidad">Servicios a la Comunidad</option>
              <option value="comunicacion">Comunicación</option>
              <option value="educacion">Educación</option>
              <option value="club-aventureros">Club de Aventureros</option>
              <option value="club-conquistadores">Club de Conquistadores</option>
              <option value="ministerios-personales">Ministerios Personales y Evangelismo</option>
              <option value="otro">Otro</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="areasToServe" className="text-sm font-medium">
              Áreas donde te gustaría servir
            </label>
            <Input
              type="text"
              id="areasToServe"
              name="areasToServe"
              value={formData.areasToServe}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Ej: Música, enseñanza, administración..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="willingToLead"
            name="willingToLead"
            checked={formData.willingToLead}
            onChange={onChange}
            onBlur={onBlur}
            className="accent-ink h-5 w-5 flex-none"
          />
          <label htmlFor="willingToLead" className="text-base">
            ¿Estarías dispuesto/a a liderar algún ministerio o grupo?
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="suggestions" className="text-sm font-medium">
            Sugerencias para mejorar la iglesia
          </label>
          <Textarea
            id="suggestions"
            name="suggestions"
            value={formData.suggestions}
            onChange={onChange}
            onBlur={onBlur}
            rows={3}
            placeholder="Comparte tus ideas y sugerencias..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="pastoralNotes" className="text-sm font-medium">
            Notas pastorales (opcional)
          </label>
          <Textarea
            id="pastoralNotes"
            name="pastoralNotes"
            value={formData.pastoralNotes}
            onChange={onChange}
            onBlur={onBlur}
            rows={3}
            placeholder="Información adicional que consideres importante..."
          />
        </div>
      </div>

      {/* Other Information Section */}
      <div className="border-line flex flex-col gap-6 border-t pt-8 md:gap-8">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Información Adicional</h2>
          <p className="text-ink-soft text-[15px] md:text-base">
            Cualquier otra información que consideres relevante
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="additionalInfo" className="text-sm font-medium">
            Información adicional
          </label>
          <Textarea
            id="additionalInfo"
            name="additionalInfo"
            rows={4}
            placeholder="Comparte cualquier información adicional que consideres importante para conocerte mejor..."
          />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="border-line flex items-center gap-3 rounded-xl border bg-white p-4">
          <CircleCheck className="h-5 w-5 flex-none text-green-700" strokeWidth={1.5} />
          <p className="text-[15px] font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="border-line flex items-center gap-3 rounded-xl border bg-white p-4 text-[#b3261e]">
          <AlertCircle className="h-5 w-5 flex-none" strokeWidth={1.5} />
          <p className="text-[15px] font-medium">{error}</p>
        </div>
      )}

      {/* Navigation and Submit Buttons */}
      <div className="border-line flex items-center justify-between gap-3 border-t pt-6">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Atrás
        </Button>
        <Button
          type="submit"
          size="lg"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 md:flex-none"
        >
          {submitting
            ? 'Guardando...'
            : isExisting
              ? 'Actualizar información'
              : 'Completar registro'}
        </Button>
      </div>
    </div>
  );
}
