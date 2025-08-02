'use client';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { DEPARTMENTS } from '@/lib/constants';
import DepartmentSelector from './DepartmentSelector';
import AnnouncementModal from './AnnouncementModal';

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

      if (!response.ok) throw new Error('Failed to save announcement');

      await fetchAnnouncements();
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
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

      if (!response.ok) throw new Error('Failed to delete announcement');

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#4b207f] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#4b207f]">Gestión de Anuncios</h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
        >
          Nuevo Anuncio
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
            className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 ${
              !announcement.isActive ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#4b207f]">{announcement.title}</h3>
                  {announcement.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="mb-2 prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Customize link styling
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-[#4b207f] underline transition-colors duration-200 hover:text-[#e36520]"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      // Customize heading styles
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="mb-2 text-lg font-bold text-[#4b207f]" />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="mb-2 text-base font-bold text-[#4b207f]" />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                      ),
                      h5: ({ node, ...props }) => (
                        <h5 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                      ),
                      h6: ({ node, ...props }) => (
                        <h6 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
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
                          className="mb-2 border-l-4 border-[#4b207f] bg-gray-50 pl-3 text-sm italic text-gray-700"
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
                      img: ({ node, ...props }) => {
                        const [imageError, setImageError] = React.useState(false);
                        const [imageLoading, setImageLoading] = React.useState(true);

                        if (imageError) {
                          return (
                            <div className="mb-2 flex items-center justify-center rounded bg-gray-100 p-3 text-xs text-gray-500">
                              <svg
                                className="mr-1 h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Imagen no disponible
                            </div>
                          );
                        }

                        return (
                          <div className="relative mb-2">
                            {imageLoading && (
                              <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4b207f] border-t-transparent"></div>
                              </div>
                            )}
                            <img
                              {...props}
                              className={`max-w-full rounded shadow-sm transition-opacity duration-200 ${
                                imageLoading ? 'opacity-0' : 'opacity-100'
                              }`}
                              loading="lazy"
                              onLoad={() => setImageLoading(false)}
                              onError={() => {
                                setImageLoading(false);
                                setImageError(true);
                              }}
                              style={{ maxHeight: '200px', objectFit: 'contain' }}
                            />
                          </div>
                        );
                      },
                    }}
                  >
                    {announcement.content}
                  </ReactMarkdown>
                </div>
                <div className="text-sm text-gray-500">
                  <span>
                    Fecha: {new Date(announcement.announcementDate).toLocaleDateString('es-ES')}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Creado: {new Date(announcement.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="rounded-lg border border-[#4b207f] px-3 py-1 text-sm text-[#4b207f] hover:bg-[#4b207f]/10"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="rounded-lg border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            {filterStatus === 'all'
              ? 'No hay anuncios registrados'
              : filterStatus === 'active'
                ? 'No hay anuncios activos'
                : 'No hay anuncios inactivos'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
