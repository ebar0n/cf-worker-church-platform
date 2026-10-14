'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import {
  ChevronDown,
  Download,
  GraduationCap,
  ImagePlus,
  Loader2,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { Course, CourseEnrollment, CourseEnrollmentStatus } from '@/app/types';
import { calculateAge as calculateAgeAt, parseDateOnly } from '@/lib/age-classification';
import { downloadCsv } from '@/lib/csv';

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

// Native select dressed as a kit field
function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <ChevronDown
        className="text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
        strokeWidth={1.5}
      />
    </div>
  );
}

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
  const [savingCourse, setSavingCourse] = useState(false);

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
    whatsappGroupUrl: '',
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
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<
    'all' | CourseEnrollmentStatus
  >('all');
  const [enrollmentMemberFilter, setEnrollmentMemberFilter] = useState<
    'all' | 'member' | 'non-member'
  >('all');

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

  // `loading` starts true and is only cleared here: refreshes after a mutation
  // stay silent so the full-page loader doesn't unmount an open modal.
  const fetchData = async () => {
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
    // Submitting mid-upload would save without the image, and a second submit
    // while the first is in flight would create a duplicate course.
    if (savingCourse || uploadingImage) return;
    setSavingCourse(true);

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
    } finally {
      setSavingCourse(false);
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
      whatsappGroupUrl: '',
      isActive: true,
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
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
      whatsappGroupUrl: course.whatsappGroupUrl || '',
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
        setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? updatedEnrollment : e)));
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
    return parseDateOnly(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (birthDate: string | Date) =>
    calculateAgeAt(parseDateOnly(birthDate), new Date());

  const getStatusBadge = (status: CourseEnrollmentStatus) => {
    const styles = {
      pending: 'bg-warm-soft text-ink',
      confirmed: 'bg-green-50 text-green-800',
      rejected: 'bg-red-50 text-[#b3261e]',
    };

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      rejected: 'Rechazado',
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
      >
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

      const csvHeaders = [
        'Nombre',
        'Documento',
        'Teléfono',
        'Fecha Nacimiento',
        'Edad',
        'Miembro IASD',
        'Estado',
        'Comprobante',
        'Fecha Inscripción',
      ];

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

      downloadCsv(`${course.title}_inscritos.csv`, [csvHeaders, ...csvData]);
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
          <div className="text-ink-soft flex items-center gap-2 text-lg">
            <Loader2 className="text-ink h-5 w-5 animate-spin" strokeWidth={1.5} />
            Cargando...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-ink text-[40px] leading-[1.04]">Gestión de Cursos</h1>
            <p className="text-ink-soft">
              Crea cursos, revisa sus inscripciones y comparte el enlace de cada uno.
            </p>
          </div>
          <Button onClick={() => setShowCourseForm(true)} className="self-start sm:self-auto">
            <Plus className="h-5 w-5" strokeWidth={1.5} />
            Nuevo Curso
          </Button>
        </div>

        {/* Filters */}
        <div className="border-line rounded-2xl border bg-white p-5 md:p-6">
          <h3 className="text-ink mb-4 text-xl">Filtros</h3>
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
              <SelectField
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </SelectField>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="h-12 w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="border-line overflow-hidden rounded-2xl border bg-white">
          <div className="border-line border-b px-5 py-4">
            <h3 className="text-ink text-xl">Cursos Registrados ({filteredCourses.length})</h3>
          </div>

          {/* Desktop Table View */}
          {/* inline-size containment keeps the wide table from stretching the admin main
              column, so it scrolls inside the card on narrow screens instead */}
          <div className="hidden overflow-x-auto [contain:inline-size] md:block">
            <table className="divide-line min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-ink-soft px-5 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                    Curso
                  </th>
                  <th className="text-ink-soft px-5 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                    Costo
                  </th>
                  <th className="text-ink-soft px-5 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                    Estado
                  </th>
                  <th className="text-ink-soft px-5 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                    Inscritos
                  </th>
                  <th className="text-ink-soft px-5 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y bg-white">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <div>
                          <div className="text-ink text-[15px] font-medium">{course.title}</div>
                          <div className="text-ink-soft max-w-56 truncate text-sm">
                            {course.description}
                          </div>
                          {(course.startDate || course.endDate) && (
                            <div className="text-ink-soft mt-0.5 text-xs">
                              {formatDate(course.startDate)} - {formatDate(course.endDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-ink whitespace-nowrap px-5 py-4 text-sm">
                      {course.cost > 0 ? formatCurrency(course.cost) : 'Gratis'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          course.isActive
                            ? 'bg-green-50 text-green-800'
                            : 'text-ink-soft bg-gray-100'
                        }`}
                      >
                        {course.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="text-sm">
                        <span className="font-medium">{course._count.enrollments}</span> total
                      </div>
                      <div className="text-ink-soft mt-1 flex gap-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="bg-warm h-1.5 w-1.5 rounded-full" />
                          {course._count.pending} pend.
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-700" />
                          {course._count.confirmed} conf.
                        </span>
                      </div>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-5 py-4 text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewEnrollments(course)}
                      >
                        Ver Inscritos
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditCourse(course)}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyPublicUrl(course.slug)}>
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
            <div className="divide-line divide-y">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-2.5 w-2.5 flex-none rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <h3 className="text-ink text-xl leading-tight">{course.title}</h3>
                    </div>
                    <span
                      className={`inline-flex flex-none rounded-full px-2.5 py-1 text-xs font-medium ${
                        course.isActive ? 'bg-green-50 text-green-800' : 'text-ink-soft bg-gray-100'
                      }`}
                    >
                      {course.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p className="text-ink-soft mb-3 text-sm">{course.description}</p>

                  <div className="text-ink mb-4 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {course.cost > 0 ? formatCurrency(course.cost) : 'Gratis'}
                    </span>
                    <span>
                      {course._count.enrollments} inscritos ({course._count.pending} pend.)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handleViewEnrollments(course)}>
                      Ver Inscritos
                    </Button>
                    <Button variant="secondary" onClick={() => handleEditCourse(course)}>
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 && (
            <div className="m-5 flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
              <span className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                <GraduationCap className="text-ink h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="text-ink text-[15px] font-semibold">
                No hay cursos registrados. Crea uno nuevo para empezar.
              </p>
            </div>
          )}
        </div>

        {/* Course Form Modal */}
        {showCourseForm && (
          <div
            className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCourseForm(false);
              setEditingCourse(null);
              resetCourseForm();
            }}
          >
            <div
              className="border-line flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-line flex items-center justify-between border-b p-4 md:p-6">
                <h2 className="text-ink text-[28px] leading-tight">
                  {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar"
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                    resetCourseForm();
                  }}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </Button>
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
                    <Textarea
                      value={courseFormData.content}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      className="font-mono text-sm"
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
                    <p className="text-ink-soft mt-2 text-[13px]">
                      Usa formato Markdown para dar formato al contenido
                    </p>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Color del Curso
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCourseFormData((prev) => ({ ...prev, color }))}
                          className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${
                            courseFormData.color === color ? 'ring-ink ring-2 ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={courseFormData.color}
                          onChange={(e) =>
                            setCourseFormData((prev) => ({ ...prev, color: e.target.value }))
                          }
                          className="h-9 w-9 cursor-pointer rounded-lg border border-gray-300 bg-white p-0.5"
                        />
                        <span className="text-ink-soft font-mono text-sm">
                          {courseFormData.color}
                        </span>
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
                      step="any"
                      placeholder="0 para cursos gratuitos"
                    />
                    <p className="text-ink-soft mt-2 text-[13px]">
                      Si el costo es mayor a 0, se pedirá comprobante de pago al inscribirse
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                  {/* WhatsApp Group URL */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      URL del Grupo de WhatsApp (opcional)
                    </label>
                    <Input
                      type="url"
                      value={courseFormData.whatsappGroupUrl}
                      onChange={(e) =>
                        setCourseFormData((prev) => ({ ...prev, whatsappGroupUrl: e.target.value }))
                      }
                      placeholder="https://chat.whatsapp.com/..."
                    />
                    <p className="text-ink-soft mt-2 text-[13px]">
                      Si no se define, se usará el número por defecto (3153455511)
                    </p>
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
                          className="border-line h-40 w-auto rounded-xl border object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {uploadingImage && (
                          <div className="bg-ink/50 absolute inset-0 flex items-center justify-center rounded-xl">
                            <Loader2
                              className="text-paper h-8 w-8 animate-spin"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={removeImage}
                          aria-label="Quitar imagen"
                          className="border-line text-ink absolute -right-2 -top-2 rounded-full border bg-white p-1.5 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <label className="hover:border-ink flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 transition-colors hover:bg-gray-50">
                        <span className="bg-warm-soft mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                          <ImagePlus className="text-ink h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <span className="text-ink text-[15px] font-semibold">
                          {uploadingImage ? 'Subiendo...' : 'Haz clic para subir imagen'}
                        </span>
                        <span className="text-ink-soft mt-1 text-sm">
                          PNG, JPG, WebP (max. 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-ink-soft mt-2 text-[13px]">
                      Imagen para compartir en redes sociales (recomendado: 1200x630px)
                    </p>
                  </div>

                  {/* Active */}
                  <div className="flex items-center gap-3">
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
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCourseForm(false);
                        setEditingCourse(null);
                        resetCourseForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={savingCourse || uploadingImage}>
                      {savingCourse ? 'Guardando...' : editingCourse ? 'Actualizar' : 'Crear'}
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
            className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
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
              className="border-line flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-line flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between md:p-6">
                <div>
                  <h2 className="text-ink text-[28px] leading-tight">
                    Inscritos en {selectedCourse.title}
                  </h2>
                  <p className="text-ink-soft mt-1 text-sm">
                    {selectedCourse.cost > 0
                      ? `Curso de pago: ${formatCurrency(selectedCourse.cost)}`
                      : 'Curso gratuito'}
                  </p>
                </div>
                <div className="flex flex-none gap-2">
                  <Button variant="outline" onClick={() => downloadCSV(selectedCourse)}>
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                    Descargar CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEnrollmentsModal(false);
                      setEnrollments([]);
                      setLoadingEnrollments(false);
                      setEnrollmentSearchTerm('');
                      setEnrollmentStatusFilter('all');
                      setEnrollmentMemberFilter('all');
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Filters */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
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
                    <SelectField
                      value={enrollmentStatusFilter}
                      onChange={(e) =>
                        setEnrollmentStatusFilter(e.target.value as 'all' | CourseEnrollmentStatus)
                      }
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendientes</option>
                      <option value="confirmed">Confirmados</option>
                      <option value="rejected">Rechazados</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tipo</label>
                    <SelectField
                      value={enrollmentMemberFilter}
                      onChange={(e) =>
                        setEnrollmentMemberFilter(e.target.value as 'all' | 'member' | 'non-member')
                      }
                    >
                      <option value="all">Todos</option>
                      <option value="member">Miembros IASD</option>
                      <option value="non-member">Visitantes</option>
                    </SelectField>
                  </div>
                </div>

                {enrollmentSearchTerm ||
                enrollmentStatusFilter !== 'all' ||
                enrollmentMemberFilter !== 'all' ? (
                  <p className="text-ink-soft mb-4 text-sm">
                    Mostrando {filteredEnrollments.length} de {enrollments.length} inscritos
                  </p>
                ) : null}

                {loadingEnrollments ? (
                  <div className="text-ink-soft py-8 text-center">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="text-ink h-4 w-4 animate-spin" strokeWidth={1.5} />
                      Cargando inscritos...
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="border-line hidden overflow-x-auto rounded-2xl border lg:block">
                      <table className="divide-line min-w-full divide-y">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                              Participante
                            </th>
                            <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                              Contacto
                            </th>
                            <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                              Edad
                            </th>
                            <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                              Estado
                            </th>
                            {selectedCourse.cost > 0 && (
                              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                                Comprobante
                              </th>
                            )}
                            <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-line divide-y bg-white">
                          {filteredEnrollments.map((enrollment) => (
                            <tr key={enrollment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    {enrollment.fullName}
                                    {enrollment.isMember && (
                                      <span className="border-line text-ink-soft rounded-full border px-2 py-0.5 text-xs font-medium">
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
                                  className="text-denim hover:text-ink text-sm hover:underline"
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
                                      className="text-denim hover:text-ink hover:underline"
                                    >
                                      Ver comprobante
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">Sin comprobante</span>
                                  )}
                                </td>
                              )}
                              <td className="whitespace-nowrap px-4 py-4">
                                <div className="flex gap-2">
                                  {enrollment.status !== 'confirmed' && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateEnrollmentStatus(enrollment.id, 'confirmed')
                                      }
                                      disabled={updatingStatus === enrollment.id}
                                      variant="outline"
                                    >
                                      {updatingStatus === enrollment.id ? '...' : 'Confirmar'}
                                    </Button>
                                  )}
                                  {enrollment.status !== 'rejected' && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateEnrollmentStatus(enrollment.id, 'rejected')
                                      }
                                      disabled={updatingStatus === enrollment.id}
                                      variant="secondary"
                                      className="text-[#b3261e] hover:bg-red-50"
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
                                      variant="secondary"
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
                          className="border-line rounded-2xl border bg-white p-4"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-ink text-lg leading-tight">
                                  {enrollment.fullName}
                                </h3>
                                {enrollment.isMember && (
                                  <span className="border-line text-ink-soft rounded-full border px-2 py-0.5 text-xs font-medium">
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
                                className="text-denim hover:text-ink"
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
                                  className="text-denim hover:text-ink"
                                >
                                  Ver
                                </a>
                              ) : (
                                <span className="text-gray-500">Sin comprobante</span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {enrollment.status !== 'confirmed' && (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleUpdateEnrollmentStatus(enrollment.id, 'confirmed')
                                }
                                disabled={updatingStatus === enrollment.id}
                              >
                                Confirmar
                              </Button>
                            )}
                            {enrollment.status !== 'rejected' && (
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  handleUpdateEnrollmentStatus(enrollment.id, 'rejected')
                                }
                                disabled={updatingStatus === enrollment.id}
                                className="text-[#b3261e] hover:bg-red-50"
                              >
                                Rechazar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredEnrollments.length === 0 && (
                      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
                        <span className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
                          <Users className="text-ink h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <p className="text-ink text-[15px] font-semibold">
                          {enrollmentSearchTerm ||
                          enrollmentStatusFilter !== 'all' ||
                          enrollmentMemberFilter !== 'all'
                            ? 'No se encontraron inscritos con los filtros aplicados'
                            : 'No hay inscritos en este curso aún.'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-line flex justify-end border-t p-4 md:p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEnrollmentsModal(false);
                    setEnrollments([]);
                    setLoadingEnrollments(false);
                    setEnrollmentSearchTerm('');
                    setEnrollmentStatusFilter('all');
                    setEnrollmentMemberFilter('all');
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
