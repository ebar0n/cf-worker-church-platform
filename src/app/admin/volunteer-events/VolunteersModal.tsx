'use client';
import React, { useState, useEffect } from 'react';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Car, ChevronDown, Download, Loader2, Phone, Users, X } from 'lucide-react';

// Native select dressed as a kit field; the chevron sits over it
const SELECT_CLASS =
  'text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2';
const SELECT_CHEVRON =
  'text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2';

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
      // 'Dieta',
      'Fecha Registro',
    ];

    const rows = filteredVolunteers.map((volunteer) => [
      volunteer.member?.name || 'N/A',
      volunteer.memberDocumentID,
      volunteer.member?.phone || 'N/A',
      volunteer.selectedService,
      volunteer.hasTransport ? 'Sí' : 'No',
      volunteer.transportSlots?.toString() || 'N/A',
      // volunteer.dietType,
      new Date(volunteer.createdAt).toLocaleDateString('es-ES'),
    ]);

    downloadCsv(`voluntarios_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`, [headers, ...rows]);
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

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        alert(data.error || 'Error al eliminar el registro');
        return;
      }

      await fetchVolunteers();
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      alert('Error al eliminar el registro');
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
    <div className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="border-line my-auto w-full max-w-6xl rounded-2xl border bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-ink text-[28px] leading-tight">Voluntarios - {eventTitle}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-warm-soft rounded-2xl p-4">
            <div className="font-heading text-ink text-[32px] font-bold leading-none">
              {volunteers.length}
            </div>
            <div className="text-ink-soft mt-1 text-sm">Total Voluntarios</div>
          </div>
          <div className="border-line rounded-2xl border bg-white p-4">
            <div className="font-heading text-ink text-[32px] font-bold leading-none">
              {volunteers.filter((v) => v.hasTransport).length}
            </div>
            <div className="text-ink-soft mt-1 text-sm">Con Transporte</div>
          </div>
          <div className="border-line rounded-2xl border bg-white p-4">
            <div className="font-heading text-ink text-[32px] font-bold leading-none">
              {volunteers.reduce((sum, v) => sum + (v.transportSlots || 0), 0)}
            </div>
            <div className="text-ink-soft mt-1 text-sm">Cupos Disponibles</div>
          </div>
          {/* <div className="rounded-lg bg-orange-100 p-4">
            <div className="text-2xl font-bold text-orange-700">
              {volunteers.filter((v) => v.dietType === 'vegetariana').length}
            </div>
            <div className="text-sm text-gray-700">Vegetarianos</div>
          </div> */}
        </div>

        {/* Filters */}
        <div className="mb-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={downloadCSV} className="h-12 w-full sm:w-auto">
              <Download className="h-4 w-4" strokeWidth={1.5} />
              Descargar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Servicio</label>
              <div className="relative">
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="all">Todos los servicios</option>
                  {availableServices.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                <ChevronDown className={SELECT_CHEVRON} strokeWidth={1.5} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Transporte</label>
              <div className="relative">
                <select
                  value={filterTransport}
                  onChange={(e) => setFilterTransport(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="all">Todos</option>
                  <option value="yes">Con transporte</option>
                  <option value="no">Sin transporte</option>
                </select>
                <ChevronDown className={SELECT_CHEVRON} strokeWidth={1.5} />
              </div>
            </div>

            {/* <div>
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
            </div> */}
          </div>
        </div>

        {/* Volunteers List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-ink h-8 w-8 animate-spin" strokeWidth={1.5} />
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
            <span className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <Users className="text-ink h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-ink text-[15px] font-semibold">
              {volunteers.length === 0
                ? 'No hay voluntarios registrados para este evento'
                : 'No se encontraron voluntarios con los filtros seleccionados'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVolunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="border-line flex items-center justify-between gap-3 rounded-xl border bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-ink text-lg leading-tight">
                      {volunteer.member?.name || 'Miembro no encontrado'}
                    </h4>
                    <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                      {volunteer.memberDocumentID}
                    </span>
                  </div>
                  <div className="text-ink-soft mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {volunteer.member?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {volunteer.member.phone}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="border-line text-ink inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium">
                      <span className="bg-warm h-1.5 w-1.5 rounded-full" />
                      {volunteer.selectedService}
                    </span>
                    {volunteer.hasTransport ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
                        <Car className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Transporte
                        {volunteer.transportSlots && volunteer.transportSlots > 0
                          ? ` (${volunteer.transportSlots} cupos extra)`
                          : ''}
                      </span>
                    ) : (
                      <span className="text-ink-soft inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                        <Car className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Sin transporte
                      </span>
                    )}
                    {/* <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        volunteer.dietType === 'vegetariana'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      🍽️ {volunteer.dietType === 'vegetariana' ? 'Vegetariana' : 'Normal'}
                    </span> */}
                    <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                      {new Date(volunteer.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteVolunteer(volunteer.id)}
                  className="text-[#b3261e] hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
