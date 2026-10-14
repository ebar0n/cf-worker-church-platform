'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import VolunteersModal from './VolunteersModal';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Bold,
  Calendar,
  HandHeart,
  Heading,
  Italic,
  LinkIcon,
  List,
  Loader2,
  Plus,
  X,
} from 'lucide-react';

const TOOL_BUTTON =
  'text-ink flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-200';

interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  services: string | null; // JSON string array
  maxCapacities: string | null; // JSON string array of numbers corresponding to services
  whatsappGroupUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
    healthSurveys: number;
  };
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function VolunteerEventsAdmin({ adminEmail }: { adminEmail: string }) {
  const [events, setEvents] = useState<VolunteerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<VolunteerEvent | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    services: [] as string[],
    maxCapacities: [] as string[],
    whatsappGroupUrl: '',
    isActive: true,
  });
  const [serviceInput, setServiceInput] = useState('');
  const [showVolunteersModal, setShowVolunteersModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url =
        filterStatus === 'all'
          ? '/api/admin/volunteer-events'
          : `/api/admin/volunteer-events?status=${filterStatus}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch volunteer events');
      const data = await response.json();
      setEvents(data as VolunteerEvent[]);
    } catch (error) {
      console.error('Error fetching volunteer events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingEvent
        ? `/api/admin/volunteer-events/${editingEvent.id}`
        : '/api/admin/volunteer-events';

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxCapacities: formData.maxCapacities.map((v) => Math.max(1, parseInt(v) || 1)),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        alert(data.error || 'Error al guardar el evento');
        return;
      }

      await fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving volunteer event:', error);
      alert('Error al guardar el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (event: VolunteerEvent) => {
    setEditingEvent(event);
    const services = event.services ? JSON.parse(event.services) : [];
    const maxCapacities = event.maxCapacities ? JSON.parse(event.maxCapacities).map(String) : [];
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate.split('T')[0],
      services: services,
      maxCapacities: maxCapacities,
      whatsappGroupUrl: event.whatsappGroupUrl || '',
      isActive: event.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento de voluntariado?')) return;

    try {
      const response = await fetch(`/api/admin/volunteer-events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        alert(data.error || 'Error al eliminar el evento');
        return;
      }

      await fetchEvents();
    } catch (error) {
      console.error('Error deleting volunteer event:', error);
      alert('Error al eliminar el evento');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      services: [],
      maxCapacities: [],
      whatsappGroupUrl: '',
      isActive: true,
    });
    setServiceInput('');
    setEditingEvent(null);
    setShowModal(false);
  };

  const addService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData({
        ...formData,
        services: [...formData.services, serviceInput.trim()],
        maxCapacities: [...formData.maxCapacities, '1'],
      });
      setServiceInput('');
    }
  };

  const removeService = (service: string) => {
    const serviceIndex = formData.services.indexOf(service);
    const newServices = formData.services.filter((s) => s !== service);
    const newMaxCapacities = formData.maxCapacities.filter((_, index) => index !== serviceIndex);
    setFormData({
      ...formData,
      services: newServices,
      maxCapacities: newMaxCapacities,
    });
  };

  const updateMaxCapacity = (serviceIndex: number, value: string) => {
    const newMaxCapacities = [...formData.maxCapacities];
    newMaxCapacities[serviceIndex] = value;
    setFormData({ ...formData, maxCapacities: newMaxCapacities });
  };

  const handleViewVolunteers = (eventId: number) => {
    setSelectedEventId(eventId);
    setShowVolunteersModal(true);
  };

  const copyRegistrationLink = (eventId: number) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/volunteer/${eventId}`;

    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert('Enlace copiado al portapapeles');
      })
      .catch(() => {
        alert('Error al copiar el enlace');
      });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('El título es obligatorio');
      return false;
    }
    if (!formData.description.trim()) {
      alert('La descripción es obligatoria');
      return false;
    }
    if (!formData.eventDate) {
      alert('La fecha del evento es obligatoria');
      return false;
    }
    if (formData.services.length === 0) {
      alert('Debes agregar al menos un servicio');
      return false;
    }
    const invalidCapacity = formData.maxCapacities.some((v) => {
      const n = parseInt(v);
      return isNaN(n) || n < 1 || String(n) !== String(v).trim();
    });
    if (invalidCapacity) {
      alert('La capacidad máxima de cada servicio debe ser un número entero mayor a 0');
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <AdminLayout adminEmail={adminEmail}>
        <div className="flex justify-center py-8">
          <Loader2 className="text-ink h-8 w-8 animate-spin" strokeWidth={1.5} />
        </div>
      </AdminLayout>
    );
  }

  // Selected filter reads as a kit choice card
  const filterClass = (status: FilterStatus) =>
    `h-11 rounded-xl border px-4 text-sm font-medium transition-colors ${
      filterStatus === status
        ? 'border-ink bg-warm-soft text-ink'
        : 'border-gray-300 bg-white text-ink-soft hover:bg-gray-100'
    }`;

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-ink text-[40px] leading-[1.04]">
            Gestión de Eventos de Voluntariado
          </h1>
          <p className="text-ink-soft">
            Organiza los eventos, sus servicios y las personas que se inscriben para servir.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="self-start sm:self-auto">
          <Plus className="h-5 w-5" strokeWidth={1.5} />
          Nuevo Evento
        </Button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-ink text-sm font-medium">Filtrar por estado:</span>
        <div className="flex gap-2">
          <button onClick={() => setFilterStatus('active')} className={filterClass('active')}>
            Activos
          </button>
          <button onClick={() => setFilterStatus('all')} className={filterClass('all')}>
            Todos
          </button>
          <button onClick={() => setFilterStatus('inactive')} className={filterClass('inactive')}>
            Inactivos
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="border-line max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-white p-5 md:p-6">
            <h2 className="text-ink mb-5 text-[28px] leading-tight">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento de Voluntariado'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Título <span className="text-[#b3261e]">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Jornada de limpieza comunitaria"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descripción (Markdown) <span className="text-[#b3261e]">*</span>
                </label>
                <div data-color-mode="light" className="markdown-editor-container">
                  <div className="focus-within:border-denim focus-within:outline-denim/25 overflow-hidden rounded-xl border border-gray-300 focus-within:outline-2 focus-within:outline-offset-2">
                    {/* Custom Toolbar */}
                    <div className="border-line flex items-center gap-1 border-b bg-gray-50 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            '.w-md-editor-text textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const selection = text.substring(start, end);
                            const after = text.substring(end);
                            const newText = before + `**${selection}**` + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className={TOOL_BUTTON}
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            '.w-md-editor-text textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const selection = text.substring(start, end);
                            const after = text.substring(end);
                            const newText = before + `*${selection}*` + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className={TOOL_BUTTON}
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <div className="mx-1 h-4 w-px bg-gray-300"></div>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            '.w-md-editor-text textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(start);
                            const newText = before + '\n## ' + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className={TOOL_BUTTON}
                        title="Heading"
                      >
                        <Heading className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            '.w-md-editor-text textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(start);
                            const newText = before + '\n- ' + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className={TOOL_BUTTON}
                        title="List"
                      >
                        <List className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector(
                            '.w-md-editor-text textarea'
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const selection = text.substring(start, end);
                            const after = text.substring(end);
                            const newText = before + `[${selection}](url)` + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className={TOOL_BUTTON}
                        title="Link"
                      >
                        <LinkIcon className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Editor without toolbar */}
                    <MDEditor
                      value={formData.description}
                      onChange={(value: string | undefined) =>
                        setFormData({ ...formData, description: value || '' })
                      }
                      height={250}
                      preview="edit"
                      hideToolbar={true}
                      className="rounded-none! border-0! shadow-none!"
                      textareaProps={{
                        placeholder:
                          'Describe el evento usando Markdown...\n\n**Negrita** *cursiva*\n\n- Listas\n- Con viñetas',
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.description && (
                  <div className="border-line mt-3 rounded-2xl border bg-gray-50 p-3">
                    <h4 className="text-ink-soft mb-2 font-sans text-xs font-medium tracking-normal">
                      Vista previa:
                    </h4>
                    <div className="border-line max-h-32 overflow-y-auto rounded-xl border bg-white p-3">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formData.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fecha del Evento <span className="text-[#b3261e]">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Servicios a Ofrecer <span className="text-[#b3261e]">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addService();
                      }
                    }}
                    className="flex-1"
                    placeholder="Ej: Limpieza, Cocina, Transporte..."
                  />
                  <Button type="button" variant="outline" onClick={addService} className="h-12">
                    Agregar
                  </Button>
                </div>
                {formData.services.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.services.map((service, index) => (
                      <div
                        key={index}
                        className="border-line flex flex-wrap items-center gap-3 rounded-xl border bg-gray-50 p-3"
                      >
                        <span className="text-ink flex-1 text-sm font-medium">{service}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-ink-soft text-xs">Capacidad máxima:</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.maxCapacities[index] ?? '1'}
                            onChange={(e) => updateMaxCapacity(index, e.target.value)}
                            className="text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-10 w-16 rounded-lg border border-gray-300 bg-white px-2 text-center text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="text-ink-soft flex h-9 w-9 items-center justify-center rounded-lg hover:bg-red-50 hover:text-[#b3261e]"
                          title="Eliminar servicio"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  URL del Grupo de WhatsApp (opcional)
                </label>
                <Input
                  type="url"
                  value={formData.whatsappGroupUrl}
                  onChange={(e) => setFormData({ ...formData, whatsappGroupUrl: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                />
                <p className="text-ink-soft mt-2 text-[13px]">
                  Si no se define, se usará el número por defecto (3153455511)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="accent-ink h-5 w-5"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Evento activo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingEvent ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`border-line rounded-2xl border bg-white p-5 md:p-6 ${
              !event.isActive ? 'opacity-75' : ''
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-ink text-2xl leading-tight">{event.title}</h3>
                  {event.isActive ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-ink-soft mb-3 whitespace-pre-wrap text-sm">
                  {event.description}
                </p>
                {event.services && (
                  <div className="mb-3">
                    <span className="text-ink text-sm font-medium">Servicios: </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {JSON.parse(event.services).map((service: string, index: number) => {
                        const maxCapacities = event.maxCapacities
                          ? JSON.parse(event.maxCapacities)
                          : [];
                        const capacity = maxCapacities[index] || 'Sin límite';
                        return (
                          <span
                            key={index}
                            className="border-line text-ink inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium"
                            title={`Capacidad máxima: ${capacity}`}
                          >
                            <span className="bg-warm h-1.5 w-1.5 rounded-full" />
                            {service} {capacity !== 'Sin límite' && `(${capacity})`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="text-ink-soft flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  <span>
                    Fecha del evento:{' '}
                    {new Date(
                      new Date(event.eventDate).getTime() + new Date().getTimezoneOffset() * 60000
                    ).toLocaleDateString('es-ES')}
                  </span>
                  <span>•</span>
                  <span>Creado: {new Date(event.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleViewVolunteers(event.id)}>
                    Ver Voluntarios
                    {event._count && ` (${event._count.registrations})`}
                  </Button>
                  <Button asChild variant="secondary">
                    <a href={`/admin/surveys/${event.id}`}>
                      Encuestas
                      {event._count && ` (${event._count.healthSurveys})`}
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => copyRegistrationLink(event.id)}
                    title="Copiar enlace de registro"
                  >
                    <LinkIcon className="h-4 w-4" strokeWidth={1.5} />
                    Copiar Enlace
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleEdit(event)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(event.id)}
                  className="text-[#b3261e] hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
            <span className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <HandHeart className="text-ink h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-ink text-[15px] font-semibold">
              {filterStatus === 'all'
                ? 'No hay eventos registrados'
                : filterStatus === 'active'
                  ? 'No hay eventos activos'
                  : 'No hay eventos inactivos'}
            </p>
          </div>
        )}
      </div>

      {/* Volunteers Modal */}
      {showVolunteersModal && selectedEventId && (
        <VolunteersModal
          isOpen={showVolunteersModal}
          onClose={() => {
            setShowVolunteersModal(false);
            setSelectedEventId(null);
            fetchEvents(); // Refresh to update counts
          }}
          eventId={selectedEventId}
          eventTitle={events.find((e) => e.id === selectedEventId)?.title || ''}
          eventServices={
            events.find((e) => e.id === selectedEventId)?.services
              ? JSON.parse(events.find((e) => e.id === selectedEventId)!.services!)
              : []
          }
        />
      )}
    </AdminLayout>
  );
}
