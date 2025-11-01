'use client';
import React, { useState, useEffect } from 'react';

interface VolunteerRegistration {
  id: number;
  memberDocumentID: string;
  selectedService: string;
  hasTransport: boolean;
  transportSlots: number | null;
  dietType: string;
  createdAt: string;
  member?: {
    id: number;
    name: string;
    phone: string;
  };
}

interface VolunteersModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventTitle: string;
  eventServices: string[];
}

export default function VolunteersModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventServices,
}: VolunteersModalProps) {
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState<string>('all');
  const [filterTransport, setFilterTransport] = useState<string>('all');
  const [filterDiet, setFilterDiet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      fetchVolunteers();
    }
  }, [isOpen, eventId]);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/volunteer-events/${eventId}/registrations`);
      if (!response.ok) throw new Error('Failed to fetch volunteers');
      const data = await response.json();
      setVolunteers(data as VolunteerRegistration[]);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (filteredVolunteers.length === 0) {
      alert('No hay voluntarios para descargar');
      return;
    }

    const headers = [
      'Nombre',
      'Documento',
      'Teléfono',
      'Servicio',
      'Transporte',
      'Cupos',
      'Dieta',
      'Fecha Registro',
    ];

    const rows = filteredVolunteers.map((volunteer) => [
      volunteer.member?.name || 'N/A',
      volunteer.memberDocumentID,
      volunteer.member?.phone || 'N/A',
      volunteer.selectedService,
      volunteer.hasTransport ? 'Sí' : 'No',
      volunteer.transportSlots?.toString() || 'N/A',
      volunteer.dietType,
      new Date(volunteer.createdAt).toLocaleDateString('es-ES'),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `voluntarios_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteVolunteer = async (volunteerId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro de voluntario?')) return;

    try {
      const response = await fetch(
        `/api/admin/volunteer-events/${eventId}/registrations/${volunteerId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to delete volunteer');

      await fetchVolunteers();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
    }
  };

  // Use event services for filtering (not just from registered volunteers)
  const availableServices = eventServices;

  // Apply filters
  const filteredVolunteers = volunteers.filter((volunteer) => {
    const matchesService = filterService === 'all' || volunteer.selectedService === filterService;
    const matchesTransport =
      filterTransport === 'all' ||
      (filterTransport === 'yes' && volunteer.hasTransport) ||
      (filterTransport === 'no' && !volunteer.hasTransport);
    const matchesDiet = filterDiet === 'all' || volunteer.dietType === filterDiet;
    const matchesSearch =
      searchQuery === '' ||
      volunteer.member?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.memberDocumentID.includes(searchQuery);

    return matchesService && matchesTransport && matchesDiet && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-6xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#4b207f]">Voluntarios - {eventTitle}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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

        {/* Stats */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-[#4b207f]/10 p-4">
            <div className="text-2xl font-bold text-[#4b207f]">{volunteers.length}</div>
            <div className="text-sm text-gray-700">Total Voluntarios</div>
          </div>
          <div className="rounded-lg bg-green-100 p-4">
            <div className="text-2xl font-bold text-green-700">
              {volunteers.filter((v) => v.hasTransport).length}
            </div>
            <div className="text-sm text-gray-700">Con Transporte</div>
          </div>
          <div className="rounded-lg bg-blue-100 p-4">
            <div className="text-2xl font-bold text-blue-700">
              {volunteers.reduce((sum, v) => sum + (v.transportSlots || 0), 0)}
            </div>
            <div className="text-sm text-gray-700">Cupos Disponibles</div>
          </div>
          <div className="rounded-lg bg-orange-100 p-4">
            <div className="text-2xl font-bold text-orange-700">
              {volunteers.filter((v) => v.dietType === 'vegetariana').length}
            </div>
            <div className="text-sm text-gray-700">Vegetarianos</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4b207f] focus:outline-none"
            />
            <button
              onClick={downloadCSV}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 sm:w-auto"
            >
              Descargar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Servicio</label>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="all">Todos los servicios</option>
                {availableServices.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Transporte</label>
              <select
                value={filterTransport}
                onChange={(e) => setFilterTransport(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="all">Todos</option>
                <option value="yes">Con transporte</option>
                <option value="no">Sin transporte</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Dieta</label>
              <select
                value={filterDiet}
                onChange={(e) => setFilterDiet(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="all">Todas</option>
                <option value="normal">Normal</option>
                <option value="vegetariana">Vegetariana</option>
              </select>
            </div>
          </div>
        </div>

        {/* Volunteers List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {volunteers.length === 0
              ? 'No hay voluntarios registrados para este evento'
              : 'No se encontraron voluntarios con los filtros seleccionados'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVolunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[#4b207f]">
                      {volunteer.member?.name || 'Miembro no encontrado'}
                    </h4>
                    <span className="rounded-full bg-[#4b207f]/10 px-2 py-0.5 text-xs text-[#4b207f]">
                      {volunteer.memberDocumentID}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {volunteer.member?.phone && <span>📱 {volunteer.member.phone}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      {volunteer.selectedService}
                    </span>
                    {volunteer.hasTransport && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        🚗 Transporte ({volunteer.transportSlots} cupos)
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        volunteer.dietType === 'vegetariana'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      🍽️ {volunteer.dietType === 'vegetariana' ? 'Vegetariana' : 'Normal'}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {new Date(volunteer.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteVolunteer(volunteer.id)}
                  className="ml-2 rounded-lg border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
