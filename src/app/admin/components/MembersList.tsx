'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';

interface MembersListProps {
  adminEmail: string;
}

type MinistryFilter = 'todos' | 'predicacion' | 'musica' | 'jovenes' | 'ninos' | 'otros';
type MaritalStatusFilter = 'todos' | 'soltero' | 'casado' | 'divorciado' | 'viudo';

export default function MembersList({ adminEmail }: MembersListProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ministryFilter, setMinistryFilter] = useState<MinistryFilter>('todos');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<MaritalStatusFilter>('todos');
  const [willingToLeadFilter, setWillingToLeadFilter] = useState<'todos' | 'si' | 'no'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const pageSize = 10;
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/members')
      .then((res) => res.json())
      .then((data) => setMembers(data as any[]));
  }, []);

  const filteredMembers = members.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(searchLower) ||
      String(m.phone).toLowerCase().includes(searchLower) ||
      m.documentID.toLowerCase().includes(searchLower);

    const matchesMinistry = ministryFilter === 'todos' || m.ministry === ministryFilter;

    const matchesMaritalStatus =
      maritalStatusFilter === 'todos' || m.maritalStatus === maritalStatusFilter;

    const matchesWillingToLead =
      willingToLeadFilter === 'todos' ||
      (willingToLeadFilter === 'si' && m.willingToLead) ||
      (willingToLeadFilter === 'no' && !m.willingToLead);

    return matchesSearch && matchesMinistry && matchesMaritalStatus && matchesWillingToLead;
  });

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Documento',
      'Fecha de nacimiento',
      'Dirección',
      'Teléfono',
      'Email',
      'Año de bautismo',
      'Ministerio',
      'Áreas para servir',
      'Nivel de educación',
      'Profesión',
      'Habilidades técnicas',
      'Habilidades blandas',
      'Idiomas',
      'Disponibilidad',
      'Dispuesto a liderar',
      'Sugerencias',
      'Fecha de registro',
      'Última actualización',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredMembers.map((m) =>
        [
          m.id,
          m.name,
          m.documentID,
          new Date(m.birthDate).toLocaleDateString(),
          m.address,
          m.phone,
          m.email || '',
          m.baptismYear || '',
          m.ministry || '',
          m.areasToServe || '',
          m.educationLevel || '',
          m.profession || '',
          m.technicalSkills || '',
          m.softSkills || '',
          m.languages || '',
          m.availability || '',
          m.willingToLead ? 'Sí' : 'No',
          m.suggestions || '',
          new Date(m.createdAt).toLocaleString(),
          new Date(m.updatedAt).toLocaleString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'miembros.csv';
    link.click();
  };

  const handleOpenDetails = (member: any) => {
    setSelectedMember(member);
  };

  const handleCloseDetails = () => {
    setSelectedMember(null);
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <h2 className="mb-6 text-center text-2xl font-bold text-[#4b207f] md:text-left">
        Miembros Registrados
      </h2>

      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o documento..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-[#4b207f] focus:outline-none"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-3 md:justify-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#4b207f] px-4 py-2 text-[#4b207f] hover:bg-[#4b207f]/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              Filtros avanzados
            </button>
            <button
              onClick={exportToCSV}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="mb-3 text-lg font-semibold text-[#4b207f]">Filtros avanzados</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Estado Civil
                  </label>
                  <select
                    value={maritalStatusFilter}
                    onChange={(e) => {
                      setMaritalStatusFilter(e.target.value as MaritalStatusFilter);
                      handleFilterChange();
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#4b207f] focus:outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="soltero">Soltero(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viudo">Viudo(a)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Dispuesto a Liderar
                  </label>
                  <select
                    value={willingToLeadFilter}
                    onChange={(e) => {
                      setWillingToLeadFilter(e.target.value as 'todos' | 'si' | 'no');
                      handleFilterChange();
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#4b207f] focus:outline-none"
                  >
                    <option value="todos">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full divide-y divide-gray-200 rounded-xl bg-white shadow-md">
          <thead className="bg-[#ede9f6]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4b207f]">
                Documento
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4b207f]">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4b207f]">
                Teléfono
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4b207f]">
                Última actualización
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#4b207f]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedMembers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{m.documentID}</td>
                <td className="px-4 py-3 font-medium text-[#4b207f]">{m.name}</td>
                <td className="px-4 py-3">{m.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(m.updatedAt).toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleOpenDetails(m)}
                    className="p-2 text-[#4b207f] transition-colors hover:text-[#e36520]"
                    title="Ver detalles"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-4 md:hidden">
        {paginatedMembers.map((m) => (
          <div key={m.id} className="rounded-xl border border-[#ede9f6] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-lg font-bold text-[#4b207f]">{m.documentID}</span>
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Nombre:</span> {m.name}
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Teléfono:</span> {m.phone}
            </div>
            <div className="mb-1 text-sm text-gray-500">
              <span className="font-semibold">Última actualización:</span>{' '}
              {new Date(m.updatedAt).toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleOpenDetails(m)}
                className="p-2 text-[#4b207f] transition-colors hover:text-[#e36520]"
                title="Ver detalles"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="flex items-center px-3 py-1 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
              <h3 className="text-xl font-bold text-[#4b207f]">Detalles del miembro</h3>
              <button onClick={handleCloseDetails} className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-[#4b207f]">Información Personal</h4>
                  <div>
                    <span className="font-semibold">ID:</span> {selectedMember.id}
                  </div>
                  <div>
                    <span className="font-semibold">Nombre:</span> {selectedMember.name}
                  </div>
                  <div>
                    <span className="font-semibold">Documento:</span> {selectedMember.documentID}
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de nacimiento:</span>{' '}
                    {new Date(selectedMember.birthDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-semibold">Estado civil:</span>{' '}
                    {selectedMember.maritalStatus}
                  </div>
                  <div>
                    <span className="font-semibold">Dirección:</span> {selectedMember.address}
                  </div>
                  <div>
                    <span className="font-semibold">Teléfono:</span> {selectedMember.phone}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{' '}
                    {selectedMember.email || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Método de contacto preferido:</span>{' '}
                    {selectedMember.preferredContactMethod || 'No especificado'}
                  </div>
                </div>

                {/* Información de la Iglesia */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-[#4b207f]">
                    Información de la Iglesia
                  </h4>
                  <div>
                    <span className="font-semibold">Año de bautismo:</span>{' '}
                    {selectedMember.baptismYear || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Ministerio:</span>{' '}
                    {selectedMember.ministry || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Áreas para servir:</span>{' '}
                    {selectedMember.areasToServe || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Dispuesto a liderar:</span>{' '}
                    {selectedMember.willingToLead ? 'Sí' : 'No'}
                  </div>
                  <div>
                    <span className="font-semibold">Sugerencias:</span>{' '}
                    {selectedMember.suggestions || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Notas pastorales:</span>{' '}
                    {selectedMember.pastoralNotes || 'No especificado'}
                  </div>
                </div>

                {/* Información Profesional */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-[#4b207f]">Información Profesional</h4>
                  <div>
                    <span className="font-semibold">Ocupación actual:</span>{' '}
                    {selectedMember.currentOccupation || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Lugar de trabajo/estudio:</span>{' '}
                    {selectedMember.workOrStudyPlace || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Área profesional:</span>{' '}
                    {selectedMember.professionalArea || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Nivel de educación:</span>{' '}
                    {selectedMember.educationLevel || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Profesión:</span>{' '}
                    {selectedMember.profession || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Experiencia laboral:</span>{' '}
                    {selectedMember.workExperience || 'No especificado'}
                  </div>
                </div>

                {/* Habilidades y Disponibilidad */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-[#4b207f]">
                    Habilidades y Disponibilidad
                  </h4>
                  <div>
                    <span className="font-semibold">Habilidades técnicas:</span>{' '}
                    {selectedMember.technicalSkills || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Habilidades blandas:</span>{' '}
                    {selectedMember.softSkills || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Idiomas:</span>{' '}
                    {selectedMember.languages || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Disponibilidad:</span>{' '}
                    {selectedMember.volunteeringAvailability || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Condiciones médicas:</span>{' '}
                    {selectedMember.medicalConditions || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Necesidades especiales:</span>{' '}
                    {selectedMember.specialNeeds || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Intereses y pasatiempos:</span>{' '}
                    {selectedMember.interestsHobbies || 'No especificado'}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:justify-between">
                <div>
                  <span className="font-semibold">Fecha de registro:</span>{' '}
                  {new Date(selectedMember.createdAt).toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
                <div>
                  <span className="font-semibold">Última actualización:</span>{' '}
                  {new Date(selectedMember.updatedAt).toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 p-4 md:p-6">
              <button
                onClick={handleCloseDetails}
                className="rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
