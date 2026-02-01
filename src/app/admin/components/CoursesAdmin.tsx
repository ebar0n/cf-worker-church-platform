'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Course, CourseEnrollment, CourseEnrollmentStatus } from '@/app/types';

interface CoursesAdminProps {
  adminEmail: string;
}

interface CourseWithCounts extends Course {
  _count: {
    enrollments: number;
    pending: number;
    confirmed: number;
    rejected: number;
  };
}

// Predefined color palette
const COLOR_PALETTE = [
  '#4b207f', // Primary purple
  '#1e40af', // Blue
  '#047857', // Green
  '#b91c1c', // Red
  '#c2410c', // Orange
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#4338ca', // Indigo
  '#15803d', // Emerald
];

export default function CoursesAdmin({ adminEmail }: CoursesAdminProps) {
  const [courses, setCourses] = useState<CourseWithCounts[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithCounts[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithCounts | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseWithCounts | null>(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    color: '#4b207f',
    cost: 0,
    startDate: '',
    endDate: '',
    capacity: '',
    isActive: true,
  });

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Enrollment search and filter state
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<'all' | CourseEnrollmentStatus>('all');
  const [enrollmentMemberFilter, setEnrollmentMemberFilter] = useState<'all' | 'member' | 'non-member'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  // Filter courses when filters change
  useEffect(() => {
    let filtered = courses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((course) =>
        statusFilter === 'active' ? course.isActive : !course.isActive
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const coursesResponse = await fetch('/api/admin/courses');
      if (coursesResponse.ok) {
        const coursesData = (await coursesResponse.json()) as CourseWithCounts[];
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : '/api/admin/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...courseFormData,
          cost: parseFloat(courseFormData.cost.toString()) || 0,
          capacity: courseFormData.capacity ? parseInt(courseFormData.capacity) : null,
          startDate: courseFormData.startDate || null,
          endDate: courseFormData.endDate || null,
          imageUrl: courseFormData.imageUrl || null,
        }),
      });

      if (response.ok) {
        setShowCourseForm(false);
        setEditingCourse(null);
        resetCourseForm();
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al guardar el curso');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error al guardar el curso');
    }
  };

  const resetCourseForm = () => {
    setCourseFormData({
      title: '',
      description: '',
      content: '',
      imageUrl: '',
      color: '#4b207f',
      cost: 0,
      startDate: '',
      endDate: '',
      capacity: '',
      isActive: true,
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'course-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = (await response.json()) as { url: string };
        setCourseFormData((prev) => ({ ...prev, imageUrl: data.url }));
        setImagePreview(data.url);
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to R2
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setCourseFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
  };

  const handleEditCourse = (course: CourseWithCounts) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      content: course.content,
      imageUrl: course.imageUrl || '',
      color: course.color,
      cost: course.cost,
      startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
      endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
      capacity: course.capacity?.toString() || '',
      isActive: course.isActive,
    });
    setImagePreview(course.imageUrl || null);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = async (id: number) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este curso? Esta acción eliminará también todas las inscripciones asociadas.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al eliminar el curso');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error al eliminar el curso');
    }
  };

  const toggleCourseStatus = async (course: CourseWithCounts) => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !course.isActive }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al cambiar el estado del curso');
      }
    } catch (error) {
      console.error('Error toggling course status:', error);
      alert('Error al cambiar el estado del curso');
    }
  };

  const handleViewEnrollments = async (course: CourseWithCounts) => {
    setSelectedCourse(course);
    setShowEnrollmentsModal(true);
    setLoadingEnrollments(true);
    setEnrollments([]);
    setEnrollmentSearchTerm('');
    setEnrollmentStatusFilter('all');
    setEnrollmentMemberFilter('all');

    try {
      const response = await fetch(`/api/admin/courses/${course.id}/enrollments`);
      if (response.ok) {
        const enrollmentsData = (await response.json()) as CourseEnrollment[];
        setEnrollments(enrollmentsData);
      } else {
        console.error('Error fetching enrollments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleUpdateEnrollmentStatus = async (
    enrollmentId: number,
    newStatus: CourseEnrollmentStatus
  ) => {
    if (!selectedCourse) return;

    // Confirmation dialog
    const statusLabels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      rejected: 'Rechazado',
    };
    
    const enrollment = enrollments.find((e) => e.id === enrollmentId);
    const confirmMessage = `¿Estás seguro de cambiar el estado de "${enrollment?.fullName}" a "${statusLabels[newStatus]}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUpdatingStatus(enrollmentId);
    try {
      const response = await fetch(`/api/admin/courses/${selectedCourse.id}/enrollments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, status: newStatus }),
      });

      if (response.ok) {
        const updatedEnrollment = (await response.json()) as CourseEnrollment;
        setEnrollments((prev) =>
          prev.map((e) => (e.id === enrollmentId ? updatedEnrollment : e))
        );
        // Refresh courses to update counts
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string };
        alert(error.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filter enrollments by search term and status
  const filteredEnrollments = enrollments.filter((enrollment) => {
    // Filter by status
    if (enrollmentStatusFilter !== 'all' && enrollment.status !== enrollmentStatusFilter) {
      return false;
    }

    // Filter by member status
    if (enrollmentMemberFilter === 'member' && !enrollment.isMember) {
      return false;
    }
    if (enrollmentMemberFilter === 'non-member' && enrollment.isMember) {
      return false;
    }

    // Filter by search term
    if (!enrollmentSearchTerm) return true;

    const searchLower = enrollmentSearchTerm.toLowerCase();
    return (
      enrollment.fullName.toLowerCase().includes(searchLower) ||
      enrollment.documentNumber.toLowerCase().includes(searchLower) ||
      enrollment.phone.includes(searchLower)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: string | Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: CourseEnrollmentStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      rejected: 'Rechazado',
    };

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const downloadCSV = async (course: CourseWithCounts) => {
    try {
      const response = await fetch(`/api/admin/courses/${course.id}/enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const courseEnrollments = (await response.json()) as CourseEnrollment[];

      const csvHeaders = ['Nombre', 'Documento', 'Teléfono', 'Fecha Nacimiento', 'Edad', 'Miembro IASD', 'Estado', 'Comprobante', 'Fecha Inscripción'];

      const csvData = courseEnrollments.map((enrollment) => [
        enrollment.fullName,
        enrollment.documentNumber,
        enrollment.phone,
        formatDate(enrollment.birthDate),
        calculateAge(enrollment.birthDate).toString(),
        enrollment.isMember ? 'Sí' : 'No',
        enrollment.status,
        enrollment.paymentProofUrl || 'N/A',
        formatDate(enrollment.createdAt),
      ]);

      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        csvHeaders.map(escapeCSV).join(','),
        ...csvData.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${course.title}_inscritos.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error al descargar el archivo CSV');
    }
  };

  const copyPublicUrl = (slug: string) => {
    const url = `${window.location.origin}/curso/${slug}`;
    navigator.clipboard.writeText(url);
    alert('URL copiada al portapapeles');
  };

  if (loading) {
    return (
      <AdminLayout adminEmail={adminEmail}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Cargando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#4b207f]">Gestión de Cursos</h1>
          <Button
            onClick={() => setShowCourseForm(true)}
            className="rounded-lg bg-[#4b207f] px-6 py-2 font-medium text-white hover:bg-[#4b207f]/90"
          >
            Nuevo Curso
          </Button>
        </div>

        {/* Filters */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Filtros</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Buscar</label>
              <Input
                type="text"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Cursos Registrados ({filteredCourses.length})
            </h3>
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Inscritos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          <div className="max-w-xs truncate text-sm text-gray-500">
                            {course.description}
                          </div>
                          {(course.startDate || course.endDate) && (
                            <div className="text-xs text-gray-400">
                              {formatDate(course.startDate)} - {formatDate(course.endDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {course.cost > 0 ? formatCurrency(course.cost) : 'Gratis'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {course.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium">{course._count.enrollments}</span> total
                      </div>
                      <div className="flex space-x-2 text-xs">
                        <span className="text-yellow-600">{course._count.pending} pend.</span>
                        <span className="text-green-600">{course._count.confirmed} conf.</span>
                      </div>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <Button
                        size="sm"
                        onClick={() => handleViewEnrollments(course)}
                        className="border border-[#4b207f] bg-white text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                      >
                        Ver Inscritos
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                        className="border border-blue-600 bg-white text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => copyPublicUrl(course.slug)}
                        className="border border-gray-400 bg-white text-gray-600 hover:bg-gray-100"
                      >
                        Copiar URL
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <div className="divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-4 hover:bg-gray-50">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <h3 className="text-sm font-medium text-gray-900">{course.title}</h3>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {course.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="mb-2 text-sm text-gray-500">{course.description}</p>

                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {course.cost > 0 ? formatCurrency(course.cost) : 'Gratis'}
                    </span>
                    <span>
                      {course._count.enrollments} inscritos ({course._count.pending} pend.)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewEnrollments(course)}
                      className="border border-[#4b207f] bg-white text-xs text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                    >
                      Ver Inscritos
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                      className="border border-blue-600 bg-white text-xs text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No hay cursos registrados. Crea uno nuevo para empezar.
            </div>
          )}
        </div>

        {/* Course Form Modal */}
        {showCourseForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowCourseForm(false);
              setEditingCourse(null);
              resetCourseForm();
            }}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
                <h2 className="text-xl font-semibold text-[#4b207f]">
                  {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <button
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                    resetCourseForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <form onSubmit={handleCourseSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Título del Curso *
                    </label>
                    <Input
                      type="text"
                      value={courseFormData.title}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                      placeholder="Ej: Curso de Música Sacra 2025"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción Breve *
                    </label>
                    <Input
                      type="text"
                      value={courseFormData.description}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      required
                      placeholder="Breve descripción para mostrar en el listado"
                    />
                  </div>

                  {/* Content (Markdown) */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Detalles del Curso (Markdown) *
                    </label>
                    <textarea
                      value={courseFormData.content}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
                      rows={8}
                      required
                      placeholder={`## Instructor
Nombre del instructor

## Fechas
- Inicio: 1 de Febrero 2025
- Fin: 28 de Febrero 2025

## Ubicación
Templo de la Iglesia El Jordán

## Requisitos
- Ser mayor de 15 años
- Tener disponibilidad los sábados`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Usa formato Markdown para dar formato al contenido
                    </p>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Color del Curso
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCourseFormData((prev) => ({ ...prev, color }))}
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            courseFormData.color === color
                              ? 'border-gray-900 ring-2 ring-gray-400'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={courseFormData.color}
                          onChange={(e) =>
                            setCourseFormData((prev) => ({ ...prev, color: e.target.value }))
                          }
                          className="h-8 w-8 cursor-pointer rounded border-0"
                        />
                        <span className="text-sm text-gray-500">{courseFormData.color}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Costo (COP)
                    </label>
                    <Input
                      type="number"
                      value={courseFormData.cost}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({
                          ...prev,
                          cost: parseFloat(e.target.value) || 0,
                        }))
                      }
                      min="0"
                      step="1000"
                      placeholder="0 para cursos gratuitos"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Si el costo es mayor a 0, se pedirá comprobante de pago al inscribirse
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fecha de Inicio
                      </label>
                      <Input
                        type="date"
                        value={courseFormData.startDate}
                        onChange={(e) =>
                          setCourseFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fecha de Fin
                      </label>
                      <Input
                        type="date"
                        value={courseFormData.endDate}
                        onChange={(e) =>
                          setCourseFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Capacidad Máxima
                    </label>
                    <Input
                      type="number"
                      value={courseFormData.capacity}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, capacity: e.target.value }))
                      }
                      min="1"
                      placeholder="Dejar vacío para sin límite"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Imagen del Curso
                    </label>
                    
                    {imagePreview || courseFormData.imageUrl ? (
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview || courseFormData.imageUrl}
                          alt="Preview"
                          className="h-40 w-auto rounded-lg object-cover shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {uploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-[#4b207f] hover:bg-gray-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="mb-2 h-10 w-10 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">
                          {uploadingImage ? 'Subiendo...' : 'Haz clic para subir imagen'}
                        </span>
                        <span className="mt-1 text-xs text-gray-500">PNG, JPG, WebP (max. 10MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Imagen para compartir en redes sociales (recomendado: 1200x630px)
                    </p>
                  </div>

                  {/* Active */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={courseFormData.isActive}
                      onCheckedChange={(checked) =>
                        setCourseFormData((prev) => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Curso activo (visible para inscripciones)
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowCourseForm(false);
                        setEditingCourse(null);
                        resetCourseForm();
                      }}
                      className="border border-[#4b207f] bg-white text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#4b207f] text-white hover:bg-[#4b207f]/90">
                      {editingCourse ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments Modal */}
        {showEnrollmentsModal && selectedCourse && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowEnrollmentsModal(false);
              setEnrollments([]);
              setLoadingEnrollments(false);
              setEnrollmentSearchTerm('');
              setEnrollmentStatusFilter('all');
              setEnrollmentMemberFilter('all');
            }}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#4b207f]">
                    Inscritos en {selectedCourse.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedCourse.cost > 0
                      ? `Curso de pago: ${formatCurrency(selectedCourse.cost)}`
                      : 'Curso gratuito'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => downloadCSV(selectedCourse)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Descargar CSV
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEnrollmentsModal(false);
                      setEnrollments([]);
                      setLoadingEnrollments(false);
                      setEnrollmentSearchTerm('');
                      setEnrollmentStatusFilter('all');
                      setEnrollmentMemberFilter('all');
                    }}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Filters */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Buscar por nombre, documento o teléfono
                    </label>
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={enrollmentSearchTerm}
                      onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={enrollmentStatusFilter}
                      onChange={(e) =>
                        setEnrollmentStatusFilter(e.target.value as 'all' | CourseEnrollmentStatus)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="confirmed">Confirmados</option>
                      <option value="rejected">Rechazados</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={enrollmentMemberFilter}
                      onChange={(e) =>
                        setEnrollmentMemberFilter(e.target.value as 'all' | 'member' | 'non-member')
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
                    >
                      <option value="all">Todos</option>
                      <option value="member">Miembros IASD</option>
                      <option value="non-member">Visitantes</option>
                    </select>
                  </div>
                </div>

                {enrollmentSearchTerm || enrollmentStatusFilter !== 'all' || enrollmentMemberFilter !== 'all' ? (
                  <p className="mb-4 text-sm text-gray-500">
                    Mostrando {filteredEnrollments.length} de {enrollments.length} inscritos
                  </p>
                ) : null}

                {loadingEnrollments ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="inline-flex items-center">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Cargando inscritos...
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Participante
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Contacto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Edad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Estado
                            </th>
                            {selectedCourse.cost > 0 && (
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Comprobante
                              </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredEnrollments.map((enrollment) => (
                            <tr key={enrollment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    {enrollment.fullName}
                                    {enrollment.isMember && (
                                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                        IASD
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Doc: {enrollment.documentNumber}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <a
                                  href={`https://wa.me/57${enrollment.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:text-green-800 hover:underline"
                                >
                                  {enrollment.phone}
                                </a>
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                                {calculateAge(enrollment.birthDate)} años
                              </td>
                              <td className="whitespace-nowrap px-4 py-4">
                                {getStatusBadge(enrollment.status)}
                              </td>
                              {selectedCourse.cost > 0 && (
                                <td className="whitespace-nowrap px-4 py-4 text-sm">
                                  {enrollment.paymentProofUrl ? (
                                    <a
                                      href={enrollment.paymentProofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      Ver comprobante
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">Sin comprobante</span>
                                  )}
                                </td>
                              )}
                              <td className="whitespace-nowrap px-4 py-4">
                                <div className="flex space-x-1">
                                  {enrollment.status !== 'confirmed' && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateEnrollmentStatus(enrollment.id, 'confirmed')
                                      }
                                      disabled={updatingStatus === enrollment.id}
                                      className="bg-green-600 text-xs text-white hover:bg-green-700"
                                    >
                                      {updatingStatus === enrollment.id
                                        ? '...'
                                        : 'Confirmar'}
                                    </Button>
                                  )}
                                  {enrollment.status !== 'rejected' && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateEnrollmentStatus(enrollment.id, 'rejected')
                                      }
                                      disabled={updatingStatus === enrollment.id}
                                      className="bg-red-600 text-xs text-white hover:bg-red-700"
                                    >
                                      {updatingStatus === enrollment.id ? '...' : 'Rechazar'}
                                    </Button>
                                  )}
                                  {enrollment.status !== 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateEnrollmentStatus(enrollment.id, 'pending')
                                      }
                                      disabled={updatingStatus === enrollment.id}
                                      className="border border-gray-300 bg-white text-xs text-gray-700 hover:bg-gray-50"
                                    >
                                      {updatingStatus === enrollment.id ? '...' : 'Pendiente'}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-4 lg:hidden">
                      {filteredEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {enrollment.fullName}
                                </h3>
                                {enrollment.isMember && (
                                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                    IASD
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                Doc: {enrollment.documentNumber}
                              </p>
                            </div>
                            {getStatusBadge(enrollment.status)}
                          </div>

                          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Teléfono: </span>
                              <a
                                href={`https://wa.me/57${enrollment.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600"
                              >
                                {enrollment.phone}
                              </a>
                            </div>
                            <div>
                              <span className="text-gray-500">Edad: </span>
                              {calculateAge(enrollment.birthDate)} años
                            </div>
                          </div>

                          {selectedCourse.cost > 0 && (
                            <div className="mb-3 text-sm">
                              <span className="text-gray-500">Comprobante: </span>
                              {enrollment.paymentProofUrl ? (
                                <a
                                  href={enrollment.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600"
                                >
                                  Ver
                                </a>
                              ) : (
                                <span className="text-gray-400">Sin comprobante</span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {enrollment.status !== 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateEnrollmentStatus(enrollment.id, 'confirmed')
                                }
                                disabled={updatingStatus === enrollment.id}
                                className="bg-green-600 text-xs text-white hover:bg-green-700"
                              >
                                Confirmar
                              </Button>
                            )}
                            {enrollment.status !== 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateEnrollmentStatus(enrollment.id, 'rejected')
                                }
                                disabled={updatingStatus === enrollment.id}
                                className="bg-red-600 text-xs text-white hover:bg-red-700"
                              >
                                Rechazar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredEnrollments.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        {enrollmentSearchTerm || enrollmentStatusFilter !== 'all' || enrollmentMemberFilter !== 'all'
                          ? 'No se encontraron inscritos con los filtros aplicados'
                          : 'No hay inscritos en este curso aún.'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-gray-200 p-4 md:p-6">
                <button
                  onClick={() => {
                    setShowEnrollmentsModal(false);
                    setEnrollments([]);
                    setLoadingEnrollments(false);
                    setEnrollmentSearchTerm('');
                    setEnrollmentStatusFilter('all');
                    setEnrollmentMemberFilter('all');
                  }}
                  className="rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
