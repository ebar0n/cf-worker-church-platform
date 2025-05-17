import React from 'react';

interface IdentificationStepProps {
  documentID: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheck: () => void;
  loading: boolean;
  isExisting: boolean;
  registerInfo: { createdAt: string; updatedAt: string } | null;
  error: string | null;
  termsAccepted: boolean;
}

export default function IdentificationStep({
  documentID,
  onChange,
  onCheck,
  loading,
  isExisting,
  registerInfo,
  error,
  termsAccepted,
}: IdentificationStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col items-center justify-center">
        <label
          htmlFor="documentID"
          className="mb-1 block text-center text-base font-medium text-[#5e3929]"
        >
          Número de documento
        </label>
        <span className="mb-2 block text-center text-xs text-[#8c7b6b]">
          (Ejemplo: registro civil, cédula, pasaporte o cualquier documento legal vigente que
          permita identificarte)
        </span>
        <input
          id="documentID"
          name="documentID"
          type="text"
          value={documentID}
          onChange={onChange}
          className="w-full max-w-md rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          placeholder="Número de documento"
          autoComplete="off"
          required
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-center gap-2">
        <input
          type="checkbox"
          id="termsAccepted"
          name="termsAccepted"
          checked={termsAccepted}
          onChange={onChange}
          className="h-4 w-4 rounded border-[#d4c5b9] text-[#4b207f] focus:ring-[#4b207f]"
        />
        <label htmlFor="termsAccepted" className="text-sm text-[#5e3929]">
          Acepto los{' '}
          <a href="/privacy" target="_blank" className="text-[#4b207f] hover:underline">
            términos y condiciones
          </a>
        </label>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onCheck}
          disabled={loading || !documentID || !termsAccepted}
          className="rounded-lg bg-[#4b207f] px-6 py-2 text-white hover:bg-[#3a1a5f] disabled:bg-[#d4c5b9]"
        >
          {loading ? 'Buscando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
