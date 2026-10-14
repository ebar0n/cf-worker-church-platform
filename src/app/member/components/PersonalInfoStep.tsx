import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import Select from './Select';

const CONTACT_METHODS = [
  { value: 'phone', label: 'Teléfono' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

interface PersonalInfoStepProps {
  formData: {
    name: string;
    gender: string;
    birthDate: string;
    maritalStatus: string;
    address: string;
    phone: string;
    email: string;
    preferredContactMethod: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onNext: () => void;
  onPrev: () => void;
  onBlur: () => void;
}

export default function PersonalInfoStep({
  formData,
  onChange,
  onNext,
  onPrev,
  onBlur,
}: PersonalInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateFields()) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] leading-[1.15] md:text-[32px]">Información Personal</h2>
        <p className="text-ink-soft text-[15px] md:text-base">
          Datos básicos de identificación y contacto
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre completo <span className="text-[#b3261e]">*</span>
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={!!errors.name}
            placeholder="Tu nombre completo"
            required
          />
          {errors.name && (
            <span className="flex items-center gap-1.5 text-sm text-[#b3261e]">
              <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
              {errors.name}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="gender" className="text-sm font-medium">
            Género
          </label>
          <Select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona tu género</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono <span className="text-[#b3261e]">*</span>
          </label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={!!errors.phone}
            placeholder="Tu número de teléfono"
            required
          />
          {errors.phone && (
            <span className="flex items-center gap-1.5 text-sm text-[#b3261e]">
              <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
              {errors.phone}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="birthDate" className="text-sm font-medium">
            Fecha de nacimiento
          </label>
          <Input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={onChange}
            onBlur={onBlur}
            className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm font-medium">
            Dirección
          </label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Tu dirección actual"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="maritalStatus" className="text-sm font-medium">
            Estado civil
          </label>
          <Select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={onChange}
            onBlur={onBlur}
          >
            <option value="">Selecciona tu estado civil</option>
            <option value="soltero">Soltero(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="separado">Separado(a)</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viudo">Viudo(a)</option>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="email" className="text-sm font-medium">
            Correo electrónico
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Tu correo electrónico"
          />
        </div>

        <fieldset className="flex flex-col gap-2.5 md:col-span-2">
          <legend className="mb-2.5 text-sm font-medium">Método de contacto preferido</legend>
          <div className="grid gap-2 md:grid-cols-3 md:gap-3">
            {CONTACT_METHODS.map(({ value, label }) => (
              <label
                key={value}
                className="has-checked:border-ink has-checked:bg-warm-soft has-focus-visible:outline-denim has-checked:border-[1.5px] has-checked:font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 text-base"
              >
                <input
                  type="radio"
                  name="preferredContactMethod"
                  value={value}
                  checked={formData.preferredContactMethod === value}
                  onChange={onChange}
                  onBlur={onBlur}
                  className="accent-ink h-5 w-5 flex-none focus-visible:outline-none"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="border-line flex items-center justify-between gap-3 border-t pt-6">
        <Button type="button" variant="outline" size="lg" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Atrás
        </Button>
        <Button type="button" size="lg" onClick={handleNext} className="flex-1 md:flex-none">
          Siguiente
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
