'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { downloadCsv } from '@/lib/csv';
import { genderLabel } from '@/lib/utils';
import { ChevronDown, Download, Eye, Search, SlidersHorizontal, X } from 'lucide-react';

interface MembersListProps {
  adminEmail: string;
}

type MinistryFilter = 'todos' | 'predicacion' | 'musica' | 'jovenes' | 'ninos' | 'otros';
type MaritalStatusFilter = 'todos' | 'soltero' | 'casado' | 'divorciado' | 'viudo';

export default function MembersList({ adminEmail }: MembersListProps) {
  // Helper function to format dates without timezone issues
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return `${day}/${month}/${year}`;
  };

  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ministryFilter, setMinistryFilter] = useState<MinistryFilter>('todos');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<MaritalStatusFilter>('todos');
  const [willingToLeadFilter, setWillingToLeadFilter] = useState<'todos' | 'si' | 'no'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const pageSize = 10;
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberChildren, setMemberChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

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
      'Género',
      'Fecha de nacimiento',
      'Estado civil',
      'Dirección',
      'Teléfono',
      'Email',
      'Método de contacto preferido',
      'Año de bautismo',
      'Ministerio',
      'Áreas para servir',
      'Dispuesto a liderar',
      'Sugerencias',
      'Notas pastorales',
      'Año de aceptación actual',
      'Método de aceptación actual',
      'Iglesia de membresía actual',
      'Autorización de transferencia',
      'Ocupación actual',
      'Lugar de trabajo/estudio',
      'Área profesional',
      'Nivel de educación',
      'Profesión',
      'Experiencia laboral',
      'Habilidades técnicas',
      'Habilidades blandas',
      'Idiomas',
      'Disponibilidad de voluntariado',
      'Condiciones médicas',
      'Necesidades especiales',
      'Intereses y pasatiempos',
      'Fecha de registro',
      'Última actualización',
    ];
    downloadCsv('miembros.csv', [
      headers,
      ...filteredMembers.map((m) => [
        m.id,
        m.name,
        m.documentID,
        genderLabel(m.gender),
        formatDate(m.birthDate),
        m.maritalStatus || '',
        m.address,
        m.phone,
        m.email || '',
        m.preferredContactMethod || '',
        m.baptismYear || '',
        m.ministry || '',
        m.areasToServe || '',
        m.willingToLead ? 'Sí' : 'No',
        m.suggestions || '',
        m.pastoralNotes || '',
        m.currentAcceptanceYear || '',
        m.currentAcceptanceMethod || '',
        m.currentMembershipChurch || '',
        m.transferAuthorization ? 'Sí' : 'No',
        m.currentOccupation || '',
        m.workOrStudyPlace || '',
        m.professionalArea || '',
        m.educationLevel || '',
        m.profession || '',
        m.workExperience || '',
        m.technicalSkills || '',
        m.softSkills || '',
        m.languages || '',
        m.volunteeringAvailability || '',
        m.medicalConditions || '',
        m.specialNeeds || '',
        m.interestsHobbies || '',
        new Date(m.createdAt).toLocaleString(),
        new Date(m.updatedAt).toLocaleString(),
      ]),
    ]);
  };

  const handleOpenDetails = async (member: any) => {
    setSelectedMember(member);
    setLoadingChildren(true);
    setMemberChildren([]);

    try {
      const response = await fetch(`/api/admin/members/${member.id}/children`);
      if (response.ok) {
        const children = (await response.json()) as any[];
        setMemberChildren(children);
      }
    } catch (error) {
      console.error('Error fetching member children:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMember(null);
    setMemberChildren([]);
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <h2 className="mb-6 text-[32px] leading-tight md:text-[40px]">Miembros Registrados</h2>

      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, teléfono o documento..."
              className="pl-11"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search
              className="text-ink-soft pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
              strokeWidth={1.5}
            />
          </div>
          <div className="grid gap-3 sm:flex sm:items-center md:justify-end">
            <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
              Filtros avanzados
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="h-5 w-5" strokeWidth={1.5} />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-line rounded-2xl border bg-white p-5">
            <div>
              <h3 className="mb-4 text-xl leading-tight">Filtros avanzados</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-ink mb-2 block text-sm font-medium">Estado Civil</label>
                  <div className="relative">
                    <select
                      value={maritalStatusFilter}
                      onChange={(e) => {
                        setMaritalStatusFilter(e.target.value as MaritalStatusFilter);
                        handleFilterChange();
                      }}
                      className="focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <option value="todos">Todos</option>
                      <option value="soltero">Soltero(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viudo">Viudo(a)</option>
                    </select>
                    <ChevronDown
                      className="text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-ink mb-2 block text-sm font-medium">
                    Dispuesto a Liderar
                  </label>
                  <div className="relative">
                    <select
                      value={willingToLeadFilter}
                      onChange={(e) => {
                        setWillingToLeadFilter(e.target.value as 'todos' | 'si' | 'no');
                        handleFilterChange();
                      }}
                      className="focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <option value="todos">Todos</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    <ChevronDown
                      className="text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="border-line hidden overflow-x-auto rounded-2xl border bg-white md:block">
        <table className="divide-line w-full divide-y text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Documento
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Nombre
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Teléfono
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Última actualización
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {paginatedMembers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{m.documentID}</td>
                <td className="text-ink px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3">{m.phone}</td>
                <td className="text-ink-soft px-4 py-3">
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
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleOpenDetails(m)}
                    className="text-ink-soft hover:text-ink flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                    title="Ver detalles"
                  >
                    <Eye className="h-5 w-5" strokeWidth={1.5} />
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
          <div key={m.id} className="border-line rounded-2xl border bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-ink text-base font-semibold">{m.documentID}</span>
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Nombre:</span> {m.name}
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Teléfono:</span> {m.phone}
            </div>
            <div className="text-ink-soft mb-1 text-sm">
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
                className="text-ink-soft hover:text-ink flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                title="Ver detalles"
              >
                <Eye className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-ink-soft flex items-center px-3 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedMember && (
        <div className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="border-line flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-white">
            <div className="border-line flex items-center justify-between gap-4 border-b p-4 md:p-6">
              <h3 className="text-[28px] leading-tight">Detalles del miembro</h3>
              <button
                onClick={handleCloseDetails}
                aria-label="Cerrar"
                className="text-ink-soft hover:text-ink flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h4 className="text-xl leading-tight">Información Personal</h4>
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
                    <span className="font-semibold">Género:</span>{' '}
                    {genderLabel(selectedMember.gender)}
                  </div>
                  <div>
                    <span className="font-semibold">Fecha de nacimiento:</span>{' '}
                    {selectedMember.birthDate
                      ? formatDate(selectedMember.birthDate)
                      : 'No especificada'}
                  </div>
                  <div>
                    <span className="font-semibold">Estado civil:</span>{' '}
                    {selectedMember.maritalStatus || 'No especificado'}
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
                  <h4 className="text-xl leading-tight">Información de la Iglesia</h4>
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
                  <div>
                    <span className="font-semibold">Año de aceptación actual:</span>{' '}
                    {selectedMember.currentAcceptanceYear || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Método de aceptación actual:</span>{' '}
                    {selectedMember.currentAcceptanceMethod || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Iglesia de membresía actual:</span>{' '}
                    {selectedMember.currentMembershipChurch || 'No especificado'}
                  </div>
                  <div>
                    <span className="font-semibold">Autorización de transferencia:</span>{' '}
                    {selectedMember.transferAuthorization ? 'Sí' : 'No'}
                  </div>
                </div>

                {/* Información Profesional */}
                <div className="space-y-4">
                  <h4 className="text-xl leading-tight">Información Profesional</h4>
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
                  <h4 className="text-xl leading-tight">Habilidades y Disponibilidad</h4>
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
                    <span className="font-semibold">Disponibilidad de voluntariado:</span>{' '}
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

                {/* Niños a Cargo */}
                <div className="space-y-4">
                  <h4 className="text-xl leading-tight">Niños a Cargo</h4>
                  {loadingChildren ? (
                    <div className="text-ink-soft">Cargando niños...</div>
                  ) : memberChildren.length > 0 ? (
                    <div className="space-y-3">
                      {memberChildren.map((child) => (
                        <div key={child.id} className="border-line rounded-xl border p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">{child.name}</h5>
                            <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                              {child.relationship === 'father'
                                ? 'Padre'
                                : child.relationship === 'mother'
                                  ? 'Madre'
                                  : child.relationship === 'guardian' ||
                                      child.relationship === 'tutor'
                                    ? 'Tutor'
                                    : 'Responsable'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-ink-soft font-medium">Documento:</span>
                              <div className="text-gray-900">{child.documentID}</div>
                            </div>
                            <div>
                              <span className="text-ink-soft font-medium">Género:</span>
                              <div className="text-gray-900">{genderLabel(child.gender)}</div>
                            </div>
                            <div>
                              <span className="text-ink-soft font-medium">
                                Fecha de Nacimiento:
                              </span>
                              <div className="text-gray-900">
                                {child.birthDate ? formatDate(child.birthDate) : 'No especificada'}
                              </div>
                            </div>
                            <div>
                              <span className="text-ink-soft font-medium">Registrado:</span>
                              <div className="text-gray-900">
                                {new Date(child.createdAt).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-ink-soft">No tiene niños registrados a su cargo</div>
                  )}
                </div>
              </div>

              <div className="border-line text-ink-soft mt-6 flex flex-col gap-2 border-t pt-4 text-sm md:flex-row md:justify-between">
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

            <div className="border-line flex justify-end border-t p-4 md:p-6">
              <Button variant="outline" onClick={handleCloseDetails}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
