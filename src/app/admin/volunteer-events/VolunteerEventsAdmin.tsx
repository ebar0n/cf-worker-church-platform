'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import VolunteersModal from './VolunteersModal';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  services: string | null; // JSON string array
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save volunteer event');

      await fetchEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving volunteer event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (event: VolunteerEvent) => {
    setEditingEvent(event);
    const services = event.services ? JSON.parse(event.services) : [];
    setFormData({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate.split('T')[0],
      services: services,
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

      if (!response.ok) throw new Error('Failed to delete volunteer event');

      await fetchEvents();
    } catch (error) {
      console.error('Error deleting volunteer event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      services: [],
      isActive: true,
    });
    setServiceInput('');
    setEditingEvent(null);
    setShowModal(false);
  };

  const addService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData({ ...formData, services: [...formData.services, serviceInput.trim()] });
      setServiceInput('');
    }
  };

  const removeService = (service: string) => {
    setFormData({ ...formData, services: formData.services.filter((s) => s !== service) });
  };

  const handleViewVolunteers = (eventId: number) => {
    setSelectedEventId(eventId);
    setShowVolunteersModal(true);
  };

  const copyRegistrationLink = (eventId: number) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/volunteer/${eventId}`;

    navigator.clipboard.writeText(link).then(() => {
      alert('Enlace copiado al portapapeles');
    }).catch(() => {
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
    return true;
  };

  if (loading) {
    return (
      <AdminLayout adminEmail={adminEmail}>
        <div className="flex justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#4b207f]">Gestión de Eventos de Voluntariado</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
        >
          Nuevo Evento
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('active')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#4b207f] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-[#4b207f]">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento de Voluntariado'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none"
                  placeholder="Ej: Jornada de limpieza comunitaria"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descripción (Markdown) <span className="text-red-500">*</span>
                </label>
                <div data-color-mode="light" className="markdown-editor-container">
                  <div className="rounded-lg border border-gray-300 focus-within:border-[#4b207f] focus-within:ring-2 focus-within:ring-[#4b207f]/20">
                    {/* Custom Toolbar */}
                    <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                        className="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                        className="rounded px-2 py-1 text-sm italic hover:bg-gray-200"
                        title="Italic"
                      >
                        I
                      </button>
                      <div className="mx-1 h-4 w-px bg-gray-300"></div>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(start);
                            const newText = before + '\n## ' + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                        title="Heading"
                      >
                        T
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const text = textarea.value;
                            const before = text.substring(0, start);
                            const after = text.substring(start);
                            const newText = before + '\n- ' + after;
                            setFormData({ ...formData, description: newText });
                          }
                        }}
                        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                        title="List"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                        className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                        title="Link"
                      >
                        🔗
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
                      className="border-0"
                      textareaProps={{
                        placeholder: 'Describe el evento usando Markdown...\n\n**Negrita** *cursiva*\n\n- Listas\n- Con viñetas',
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {formData.description && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h4 className="mb-2 text-xs font-medium text-gray-700">Vista previa:</h4>
                    <div className="max-h-32 overflow-y-auto rounded bg-white p-3">
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
                  Fecha del Evento <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Servicios a Ofrecer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addService();
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none"
                    placeholder="Ej: Limpieza, Cocina, Transporte..."
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="rounded-lg bg-[#e36520] px-4 py-2 text-white hover:bg-[#e36520]/90"
                  >
                    Agregar
                  </button>
                </div>
                {formData.services.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.services.map((service, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-2 rounded-full bg-[#4b207f]/10 px-3 py-1 text-sm text-[#4b207f]"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Evento activo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingEvent ? 'Actualizar' : 'Crear'}
                </button>
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
            className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 ${
              !event.isActive ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#4b207f]">{event.title}</h3>
                  {event.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="mb-2 whitespace-pre-wrap text-sm text-gray-700">
                  {event.description}
                </p>
                {event.services && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Servicios: </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {JSON.parse(event.services).map((service: string, index: number) => (
                        <span
                          key={index}
                          className="rounded-full bg-[#4b207f]/10 px-2 py-1 text-xs text-[#4b207f]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  <span>
                    Fecha del evento: {new Date(event.eventDate).toLocaleDateString('es-ES')}
                  </span>
                  <span className="mx-2">•</span>
                  <span>Creado: {new Date(event.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewVolunteers(event.id)}
                    className="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Ver Voluntarios
                    {event._count && (
                      <span className="ml-1">
                        ({event._count.registrations})
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => copyRegistrationLink(event.id)}
                    className="flex items-center gap-2 rounded-lg border border-[#4b207f] bg-white px-4 py-2 text-sm font-medium text-[#4b207f] hover:bg-[#4b207f]/10"
                    title="Copiar enlace de registro"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                      />
                    </svg>
                    Copiar Enlace
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="rounded-lg border border-[#4b207f] px-3 py-1 text-sm text-[#4b207f] hover:bg-[#4b207f]/10"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="rounded-lg border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            {filterStatus === 'all'
              ? 'No hay eventos registrados'
              : filterStatus === 'active'
                ? 'No hay eventos activos'
                : 'No hay eventos inactivos'}
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
