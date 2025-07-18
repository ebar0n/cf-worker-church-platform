import React from 'react';

interface ChurchInfoStepProps {
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
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function ChurchInfoStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: ChurchInfoStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-[#5e3929]">Información de la Iglesia</h2>
        <p className="text-[#5e3929] opacity-80">Ministerios y áreas donde puedes servir</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="ministry" className="text-sm font-medium text-[#5e3929]">
            Ministerio o cargo que desempeñas actualmente
          </label>
          <input
            type="text"
            id="ministry"
            name="ministry"
            value={formData.ministry}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Diácono, Maestro de escuela sabática"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="areasToServe" className="text-sm font-medium text-[#5e3929]">
            Ministerio o área donde te gustaría servir
          </label>
          <input
            type="text"
            id="areasToServe"
            name="areasToServe"
            value={formData.areasToServe}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Música, Jóvenes, Evangelismo"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-[#d4c5b9] bg-[#f8f6f4] p-4">
        <input
          type="checkbox"
          id="willingToLead"
          name="willingToLead"
          checked={formData.willingToLead}
          onChange={onChange}
          onBlur={onBlur}
          className="rounded border-[#d4c5b9] text-[#4b207f] focus:ring-[#4b207f]"
        />
        <label htmlFor="willingToLead" className="text-sm text-[#5e3929]">
          ¿Estás dispuesto a liderar algún ministerio o grupo?
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="suggestions" className="text-sm font-medium text-[#5e3929]">
          Sugerencias para la iglesia
        </label>
        <textarea
          id="suggestions"
          name="suggestions"
          value={formData.suggestions}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          rows={3}
          placeholder="Comparte tus ideas y sugerencias para mejorar la iglesia"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pastoralNotes" className="text-sm font-medium text-[#5e3929]">
          Notas pastorales (opcional)
        </label>
        <textarea
          id="pastoralNotes"
          name="pastoralNotes"
          value={formData.pastoralNotes}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          rows={3}
          placeholder="Información adicional que consideres importante"
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
