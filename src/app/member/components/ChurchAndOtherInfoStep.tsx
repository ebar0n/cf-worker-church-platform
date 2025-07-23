import React from 'react';

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
    <div className="space-y-8">
      {/* Church Information Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Información de Iglesia</h2>
          <p className="text-lg text-[#5e3929]">
            Ayúdanos a conocer cómo puedes servir en la iglesia
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="ministry" className="mb-2 block text-sm font-medium text-[#5e3929]">
              Ministerio actual o de interés
            </label>
            <select
              id="ministry"
              name="ministry"
              value={formData.ministry}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
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
            </select>
          </div>

          <div>
            <label htmlFor="areasToServe" className="mb-2 block text-sm font-medium text-[#5e3929]">
              Áreas donde te gustaría servir
            </label>
            <input
              type="text"
              id="areasToServe"
              name="areasToServe"
              value={formData.areasToServe}
              onChange={onChange}
              onBlur={onBlur}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
              placeholder="Ej: Música, enseñanza, administración..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="willingToLead"
            name="willingToLead"
            checked={formData.willingToLead}
            onChange={onChange}
            onBlur={onBlur}
            className="h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f] focus:ring-opacity-50"
          />
          <label htmlFor="willingToLead" className="text-sm font-medium text-[#5e3929]">
            ¿Estarías dispuesto/a a liderar algún ministerio o grupo?
          </label>
        </div>

        <div>
          <label htmlFor="suggestions" className="mb-2 block text-sm font-medium text-[#5e3929]">
            Sugerencias para mejorar la iglesia
          </label>
          <textarea
            id="suggestions"
            name="suggestions"
            value={formData.suggestions}
            onChange={onChange}
            onBlur={onBlur}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
            placeholder="Comparte tus ideas y sugerencias..."
          />
        </div>

        <div>
          <label htmlFor="pastoralNotes" className="mb-2 block text-sm font-medium text-[#5e3929]">
            Notas pastorales (opcional)
          </label>
          <textarea
            id="pastoralNotes"
            name="pastoralNotes"
            value={formData.pastoralNotes}
            onChange={onChange}
            onBlur={onBlur}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
            placeholder="Información adicional que consideres importante..."
          />
        </div>
      </div>

      {/* Other Information Section */}
      <div className="space-y-6 border-t border-gray-200 pt-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Información Adicional</h2>
          <p className="text-lg text-[#5e3929]">
            Cualquier otra información que consideres relevante
          </p>
        </div>

        <div>
          <label htmlFor="additionalInfo" className="mb-2 block text-sm font-medium text-[#5e3929]">
            Información adicional
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[#5e3929] placeholder-gray-400 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f] focus:ring-opacity-50"
            placeholder="Comparte cualquier información adicional que consideres importante para conocerte mejor..."
          />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="font-semibold text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-center">
          <p className="font-semibold text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation and Submit Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-full border border-[#4b207f] bg-white px-8 py-3 font-medium text-[#4b207f] shadow-md transition-colors hover:bg-[#4b207f] hover:text-white"
        >
          Atrás
        </button>
        <button
          type="submit"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full bg-[#4b207f] px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-[#2f557f] disabled:opacity-50"
        >
          {submitting
            ? 'Guardando...'
            : isExisting
              ? 'Actualizar información'
              : 'Completar registro'}
        </button>
      </div>
    </div>
  );
}
