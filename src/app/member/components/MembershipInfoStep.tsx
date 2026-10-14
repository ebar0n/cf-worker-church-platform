import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Select from './Select';

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
    if (
      formData.currentMembershipChurch &&
      formData.currentMembershipChurch !== JORDAN_CHURCH_VALUE
    ) {
      return 'other';
    }
    return formData.currentMembershipChurch === JORDAN_CHURCH_VALUE ? 'Jordan' : '';
  });

  // Sincronizar el estado local cuando cambien los datos del formulario
  React.useEffect(() => {
    if (
      formData.currentMembershipChurch &&
      formData.currentMembershipChurch !== JORDAN_CHURCH_VALUE
    ) {
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
          value: value,
        },
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
            value: 'other',
          },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(modifiedEvent);
      } else if (value === 'Jordan') {
        // Si selecciona "Jordan", guardar el texto completo
        const modifiedEvent = {
          ...e,
          target: {
            ...e.target,
            name: 'currentMembershipChurch',
            value: JORDAN_CHURCH_VALUE,
          },
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
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Datos de Feligresía</h2>
        <p className="text-ink-soft text-[15px] md:text-base">
          Información sobre tu membresía y aceptación en la iglesia
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="baptismYear" className="text-sm font-medium">
            Año de bautismo
          </label>
          <Input
            type="number"
            id="baptismYear"
            name="baptismYear"
            value={formData.baptismYear || ''}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder="Ej: 2015"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentAcceptanceYear" className="text-sm font-medium">
            Año de aceptación en la iglesia actual
          </label>
          <Input
            type="number"
            id="currentAcceptanceYear"
            name="currentAcceptanceYear"
            value={formData.currentAcceptanceYear || ''}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder="Ej: 2020"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentAcceptanceMethod" className="text-sm font-medium">
            Método de aceptación en la iglesia actual
          </label>
          <Select
            id="currentAcceptanceMethod"
            name="currentAcceptanceMethod"
            value={formData.currentAcceptanceMethod}
            onChange={handleChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona el método</option>
            <option value="BAPTISM">Bautismo</option>
            <option value="PROFESSION_OF_FAITH">Profesión de fe</option>
            <option value="TRANSFER">Traslado</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="currentMembershipChurch" className="text-sm font-medium">
            Iglesia donde tiene su feligresía actualmente
          </label>
          <Select
            id="currentMembershipChurch"
            name="currentMembershipChurch"
            value={selectValue}
            onChange={handleChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona tu iglesia de feligresía</option>
            <option value="Jordan">Jordan - Distrito Jordan - Asociación Sur Colombiana</option>
            <option value="other">Otra iglesia</option>
          </Select>
        </div>
      </div>

      {selectValue === 'other' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="otherChurch" className="text-sm font-medium">
            Especifica tu iglesia de feligresía
          </label>
          <Input
            type="text"
            id="otherChurch"
            name="otherChurch"
            value={
              formData.currentMembershipChurch === 'other' ? '' : formData.currentMembershipChurch
            }
            onChange={handleChange}
            onBlur={onBlur}
            placeholder="Ej: Iglesia Central - Distrito Norte - Asociación Central"
          />
        </div>
      )}

      {selectValue === 'other' && (
        <div className="bg-warm-soft flex items-center gap-3 rounded-xl p-4">
          <input
            type="checkbox"
            id="transferAuthorization"
            name="transferAuthorization"
            checked={formData.transferAuthorization}
            onChange={handleChange}
            onBlur={onBlur}
            className="accent-ink h-5 w-5 flex-none"
          />
          <label htmlFor="transferAuthorization" className="text-base">
            Autorizo el traslado de mi feligresía a la Iglesia Jordan
          </label>
        </div>
      )}

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
