'use client';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { DEPARTMENTS } from '@/lib/constants';
import { parseDateOnly } from '@/lib/age-classification';
import DepartmentSelector from './DepartmentSelector';
import AnnouncementModal from './AnnouncementModal';
import { MarkdownImage } from '@/app/components/MarkdownImage';
import { Button } from '@/app/components/ui/button';
import { Calendar, Loader2, Megaphone, Plus } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcementDate: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterStatus = 'all' | 'active' | 'inactive';

export default function AnnouncementsAdmin({ adminEmail }: { adminEmail: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcementDate: '',
    department: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [filterStatus]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const url =
        filterStatus === 'all'
          ? '/api/admin/announcements'
          : `/api/admin/announcements?status=${filterStatus}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      setAnnouncements(data as Announcement[]);
    } catch (error) {
      console.error('Error fetching announcements:', error);
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
      const url = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements';

      const method = editingAnnouncement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al guardar el anuncio');
        return;
      }

      await fetchAnnouncements();
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error al guardar el anuncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcementDate: announcement.announcementDate.split('T')[0],
      department: announcement.department || '',
      isActive: announcement.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este anuncio?')) return;

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al eliminar el anuncio');
        return;
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error al eliminar el anuncio');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      announcementDate: '',
      department: '',
      isActive: true,
    });
    setEditingAnnouncement(null);
    setShowModal(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('El título es obligatorio');
      return false;
    }
    if (!formData.content.trim()) {
      alert('El contenido es obligatorio');
      return false;
    }
    if (!formData.announcementDate) {
      alert('La fecha del anuncio es obligatoria');
      return false;
    }
    if (!formData.department) {
      alert('El departamento es obligatorio');
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
          <h1 className="text-ink text-[40px] leading-[1.04]">Gestión de Anuncios</h1>
          <p className="text-ink-soft">Publica y edita los anuncios que aparecen en el sitio.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="self-start sm:self-auto">
          <Plus className="h-5 w-5" strokeWidth={1.5} />
          Nuevo Anuncio
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
      <AnnouncementModal
        isOpen={showModal}
        onClose={resetForm}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingAnnouncement={editingAnnouncement}
        isLoading={isSubmitting}
      />

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`border-line rounded-2xl border bg-white p-5 md:p-6 ${
              !announcement.isActive ? 'opacity-75' : ''
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-ink text-2xl leading-tight">{announcement.title}</h3>
                  {announcement.isActive ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="text-ink-soft rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="prose prose-sm mb-2 max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Customize link styling
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-denim hover:text-ink underline transition-colors duration-200"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      // Customize heading styles
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="text-ink mb-2 text-lg font-bold" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="text-ink mb-2 text-base font-bold" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="text-ink mb-2 text-sm font-bold" />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 {...props} className="text-ink mb-2 text-sm font-bold" />
                      ),
                      h5: ({ node, ...props }) => (
                        <h5 {...props} className="text-ink mb-2 text-sm font-bold" />
                      ),
                      h6: ({ node, ...props }) => (
                        <h6 {...props} className="text-ink mb-2 text-sm font-bold" />
                      ),
                      // Customize paragraph styling
                      p: ({ node, ...props }) => <p {...props} className="mb-2 text-sm" />,
                      // Customize strong/bold styling
                      strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
                      // Customize emphasis/italic styling
                      em: ({ node, ...props }) => <em {...props} className="italic" />,
                      // Customize list styling
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="mb-2 ml-4 list-disc space-y-1 text-sm" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="mb-2 ml-4 list-decimal space-y-1 text-sm" />
                      ),
                      li: ({ node, ...props }) => (
                        <li {...props} className="text-sm text-gray-700" />
                      ),
                      // Customize code styling
                      code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              {...props}
                              className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800"
                            />
                          );
                        }
                        return (
                          <code
                            {...props}
                            className="block overflow-x-auto rounded bg-gray-100 p-2 font-mono text-xs text-gray-800"
                          />
                        );
                      },
                      pre: ({ node, ...props }) => (
                        <pre
                          {...props}
                          className="mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs"
                        />
                      ),
                      // Customize blockquote styling
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          {...props}
                          className="border-warm mb-2 border-l-4 bg-gray-50 pl-3 text-sm italic text-gray-700"
                        />
                      ),
                      // Customize table styling
                      table: ({ node, ...props }) => (
                        <div className="mb-2 overflow-x-auto">
                          <table
                            {...props}
                            className="min-w-full border-collapse border border-gray-300 text-xs"
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead {...props} className="bg-gray-100" />,
                      tbody: ({ node, ...props }) => <tbody {...props} />,
                      tr: ({ node, ...props }) => (
                        <tr {...props} className="border-b border-gray-300" />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          {...props}
                          className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold text-gray-700"
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          {...props}
                          className="border border-gray-300 px-2 py-1 text-xs text-gray-700"
                        />
                      ),
                      // Customize horizontal rule
                      hr: ({ node, ...props }) => (
                        <hr {...props} className="my-2 border-gray-300" />
                      ),
                      // Customize image styling
                      img: (props) => <MarkdownImage {...props} size="sm" />,
                    }}
                  >
                    {announcement.content}
                  </ReactMarkdown>
                </div>
                <div className="text-ink-soft flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  <span>
                    Fecha:{' '}
                    {parseDateOnly(announcement.announcementDate).toLocaleDateString('es-ES')}
                  </span>
                  <span>•</span>
                  <span>
                    Creado: {new Date(announcement.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleEdit(announcement)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(announcement.id)}
                  className="text-[#b3261e] hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
            <span className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <Megaphone className="text-ink h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-ink text-[15px] font-semibold">
              {filterStatus === 'all'
                ? 'No hay anuncios registrados'
                : filterStatus === 'active'
                  ? 'No hay anuncios activos'
                  : 'No hay anuncios inactivos'}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
