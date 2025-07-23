import React from 'react';
import { DEPARTMENTS } from '@/lib/constants';
import DepartmentSelector from './DepartmentSelector';

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

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    title: string;
    content: string;
    announcementDate: string;
    department: string;
    isActive: boolean;
  };
  setFormData: (data: any) => void;
  editingAnnouncement: Announcement | null;
  isLoading?: boolean;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingAnnouncement,
  isLoading = false,
}: AnnouncementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="relative mx-2 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 lg:p-8">
            <h3 className="text-2xl font-bold text-[#4b207f]">
              {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Título *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                    placeholder="Título del anuncio"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contenido *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                    placeholder="Contenido del anuncio..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fecha del Anuncio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.announcementDate}
                    onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <DepartmentSelector
                    selectedDepartment={formData.department}
                    onSelectDepartment={(department: string) =>
                      setFormData({ ...formData, department })
                    }
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Anuncio activo
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-[#4b207f] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4b207f]/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Guardando...
                  </div>
                ) : editingAnnouncement ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
