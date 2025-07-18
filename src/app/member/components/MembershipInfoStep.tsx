import React from 'react';

// Constantes para los valores de iglesia
const JORDAN_CHURCH_VALUE = 'Jordan - Distrito Jordan - Asociación Sur Colombiana';

interface MembershipInfoStepProps {
  formData: {
    baptismYear: number | null;
    currentAcceptanceYear: number | null;
    currentAcceptanceMethod: string;
    currentMembershipChurch: string;
    transferAuthorization: boolean;
    otherChurch?: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function MembershipInfoStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: MembershipInfoStepProps) {
  // Estado local para manejar el valor del select
  const [selectValue, setSelectValue] = React.useState(() => {
    // Si currentMembershipChurch tiene un valor y no es "Jordan", mostrar "other"
    if (formData.currentMembershipChurch && formData.currentMembershipChurch !== JORDAN_CHURCH_VALUE) {
      return 'other';
    }
    return formData.currentMembershipChurch === JORDAN_CHURCH_VALUE ? 'Jordan' : '';
  });

  // Sincronizar el estado local cuando cambien los datos del formulario
  React.useEffect(() => {
    if (formData.currentMembershipChurch && formData.currentMembershipChurch !== JORDAN_CHURCH_VALUE) {
      setSelectValue('other');
    } else if (formData.currentMembershipChurch === JORDAN_CHURCH_VALUE) {
      setSelectValue('Jordan');
    } else {
      setSelectValue('');
    }
  }, [formData.currentMembershipChurch]);

  // Manejar cambios específicos para este componente
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'otherChurch') {
      // Cuando se escribe en el campo de texto, actualizar currentMembershipChurch
      // pero mantener el select en "Otra iglesia"
      setSelectValue('other');
      const modifiedEvent = {
        ...e,
        target: {
          ...e.target,
          name: 'currentMembershipChurch',
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(modifiedEvent);
    } else if (name === 'currentMembershipChurch') {
      // Para el select, actualizar el estado local y el valor real
      setSelectValue(value);
      if (value === 'other') {
        // Si selecciona "Otra iglesia", establecer el valor como "other"
        const modifiedEvent = {
          ...e,
          target: {
            ...e.target,
            name: 'currentMembershipChurch',
            value: 'other'
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(modifiedEvent);
      } else if (value === 'Jordan') {
        // Si selecciona "Jordan", guardar el texto completo
        const modifiedEvent = {
          ...e,
          target: {
            ...e.target,
            name: 'currentMembershipChurch',
            value: JORDAN_CHURCH_VALUE
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(modifiedEvent);
      } else {
        // Si selecciona una opción específica, actualizar con ese valor
        onChange(e);
      }
    } else if (name === 'transferAuthorization') {
      // Para checkboxes, usar el onChange original para manejar correctamente el boolean
      onChange(e);
    } else {
      // Para todos los demás campos, incluyendo los numéricos, usar el onChange original
      onChange(e);
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#5e3929] mb-2">Datos de Feligresía</h2>
        <p className="text-[#5e3929] opacity-80">
          Información sobre tu membresía y aceptación en la iglesia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="baptismYear" className="text-sm font-medium text-[#5e3929]">
            Año de bautismo
          </label>
          <input
            type="number"
            id="baptismYear"
            name="baptismYear"
            value={formData.baptismYear || ''}
            onChange={handleChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: 2015"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentAcceptanceYear" className="text-sm font-medium text-[#5e3929]">
            Año de aceptación en la iglesia actual
          </label>
          <input
            type="number"
            id="currentAcceptanceYear"
            name="currentAcceptanceYear"
            value={formData.currentAcceptanceYear || ''}
            onChange={handleChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: 2020"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentAcceptanceMethod" className="text-sm font-medium text-[#5e3929]">
            Método de aceptación en la iglesia actual
          </label>
          <select
            id="currentAcceptanceMethod"
            name="currentAcceptanceMethod"
            value={formData.currentAcceptanceMethod}
            onChange={handleChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona el método</option>
            <option value="BAPTISM">Bautismo</option>
            <option value="PROFESSION_OF_FAITH">Profesión de fe</option>
            <option value="TRANSFER">Traslado</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentMembershipChurch" className="text-sm font-medium text-[#5e3929]">
            Iglesia donde tiene su feligresía actualmente
          </label>
          <select
            id="currentMembershipChurch"
            name="currentMembershipChurch"
            value={selectValue}
            onChange={handleChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu iglesia de feligresía</option>
            <option value="Jordan">Jordan - Distrito Jordan - Asociación Sur Colombiana</option>
            <option value="other">Otra iglesia</option>
          </select>
        </div>
      </div>

      {selectValue === 'other' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="otherChurch" className="text-sm font-medium text-[#5e3929]">
            Especifica tu iglesia de feligresía
          </label>
          <input
            type="text"
            id="otherChurch"
            name="otherChurch"
            value={formData.currentMembershipChurch === 'other' ? '' : formData.currentMembershipChurch}
            onChange={handleChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Ej: Iglesia Central - Distrito Norte - Asociación Central"
          />
        </div>
      )}

      {selectValue === 'other' && (
        <div className="flex items-center gap-3 p-4 bg-[#f8f6f4] rounded-lg border border-[#d4c5b9]">
          <input
            type="checkbox"
            id="transferAuthorization"
            name="transferAuthorization"
            checked={formData.transferAuthorization}
            onChange={handleChange}
            onBlur={onBlur}
            className="rounded border-[#d4c5b9] text-[#4b207f] focus:ring-[#4b207f]"
          />
          <label htmlFor="transferAuthorization" className="text-sm text-[#5e3929]">
            Autorizo el traslado de mi feligresía a la Iglesia Jordan
          </label>
        </div>
      )}

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