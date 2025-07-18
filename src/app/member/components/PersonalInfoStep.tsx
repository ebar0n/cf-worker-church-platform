import React, { useState } from 'react';

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
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#5e3929] mb-2">Información Personal</h2>
        <p className="text-[#5e3929] opacity-80">
          Datos básicos de identificación y contacto
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-[#5e3929]">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-[#d4c5b9]'} px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none`}
            placeholder="Tu nombre completo"
            required
          />
          {errors.name && <span className="text-sm text-red-500">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="gender" className="text-sm font-medium text-[#5e3929]">
            Género
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu género</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-sm font-medium text-[#5e3929]">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full rounded-lg border ${errors.phone ? 'border-red-500' : 'border-[#d4c5b9]'} px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none`}
            placeholder="Tu número de teléfono"
            required
          />
          {errors.phone && <span className="text-sm text-red-500">{errors.phone}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="birthDate" className="text-sm font-medium text-[#5e3929]">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm font-medium text-[#5e3929]">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Tu dirección actual"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="maritalStatus" className="text-sm font-medium text-[#5e3929]">
            Estado civil
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu estado civil</option>
            <option value="soltero">Soltero(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="separado">Separado(a)</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viudo">Viudo(a)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-[#5e3929]">
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
            placeholder="Tu correo electrónico"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="preferredContactMethod" className="text-sm font-medium text-[#5e3929]">
            Método de contacto preferido
          </label>
          <select
            id="preferredContactMethod"
            name="preferredContactMethod"
            value={formData.preferredContactMethod}
            onChange={onChange}
            onBlur={onBlur}
            className="w-full rounded-lg border border-[#d4c5b9] px-4 py-2 text-[#5e3929] focus:border-[#4b207f] focus:outline-none"
          >
            <option value="">Selecciona tu método preferido</option>
            <option value="phone">Teléfono</option>
            <option value="email">Correo electrónico</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
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
          onClick={handleNext}
          className="flex-1 rounded-lg bg-[#4b207f] px-6 py-2 text-white hover:bg-[#3a1a5f] md:flex-none md:px-8"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
