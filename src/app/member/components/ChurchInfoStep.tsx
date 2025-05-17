import React from 'react';

interface ChurchInfoStepProps {
  formData: {
    baptismYear: string;
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
    <div className="flex flex-col gap-4">
      <label>Año de bautismo</label>
      <input
        name="baptismYear"
        type="number"
        value={parseInt(formData.baptismYear) || ''}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Ministerio o cargo que desempeñas</label>
      <input
        name="ministry"
        value={formData.ministry}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label>Ministerio o cargo que desearía desempeñar</label>
      <input
        name="areasToServe"
        value={formData.areasToServe}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="willingToLead"
          checked={formData.willingToLead}
          onChange={onChange}
          onBlur={onBlur}
          className="rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
        />
        ¿Dispuesto a liderar?
      </label>
      <label>Sugerencias</label>
      <textarea
        name="suggestions"
        value={formData.suggestions}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
        rows={3}
      />
      <label>Notas pastorales</label>
      <textarea
        name="pastoralNotes"
        value={formData.pastoralNotes}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
        rows={3}
      />
      <div className="mt-4 flex justify-between">
        <button type="button" onClick={onPrev} className="text-[#4b207f] underline">
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
