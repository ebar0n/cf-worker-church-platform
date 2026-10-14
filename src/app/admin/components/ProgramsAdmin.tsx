'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Program, Enrollment } from '@/app/types';
import { DEPARTMENTS, getDepartmentName, usesFamilyEnrollment } from '@/lib/constants';

interface ProgramsAdminProps {
  adminEmail: string;
}

interface ProgramWithEnrollments extends Program {
  _count: {
    enrollments: number;
  };
}

export default function ProgramsAdmin({ adminEmail }: ProgramsAdminProps) {
  const [programs, setPrograms] = useState<ProgramWithEnrollments[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramWithEnrollments[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [programFormData, setProgramFormData] = useState({
    title: '',
    department: '',
    content: '',
    isActive: true,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Enrollment search state
  const [enrollmentSearchTerm, setEnrollmentSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Filter programs when filters change
  useEffect(() => {
    let filtered = programs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((program) =>
        program.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((program) =>
        statusFilter === 'active' ? program.isActive : !program.isActive
      );
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter((program) => program.department === departmentFilter);
    }

    setFilteredPrograms(filtered);
  }, [programs, searchTerm, statusFilter, departmentFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch programs
      const programsResponse = await fetch('/api/admin/programs');
      if (programsResponse.ok) {
        const programsData = (await programsResponse.json()) as ProgramWithEnrollments[];
        setPrograms(programsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Disables the submit button meanwhile, so a double click can't create
    // two identical programs.
    setSavingProgram(true);

    try {
      const url = editingProgram
        ? `/api/admin/programs/${editingProgram.id}`
        : '/api/admin/programs';

      const method = editingProgram ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programFormData),
      });

      if (response.ok) {
        setShowProgramForm(false);
        setEditingProgram(null);
        setProgramFormData({ title: '', department: '', content: '', isActive: true });
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string; message?: string };
        alert(error.error ?? error.message ?? 'Error al guardar el programa');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error al guardar el programa');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramFormData({
      title: program.title,
      department: program.department,
      content: program.content || '',
      isActive: program.isActive,
    });
    setShowProgramForm(true);
  };

  const handleDeleteProgram = async (id: number) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este programa? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/programs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string; message?: string };
        alert(error.error ?? error.message ?? 'Error al eliminar el programa');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Error al eliminar el programa');
    }
  };

  const toggleProgramStatus = async (program: Program) => {
    try {
      const response = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...program, isActive: !program.isActive }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = (await response.json()) as { error?: string; message?: string };
        alert(error.error ?? error.message ?? 'Error al cambiar el estado del programa');
      }
    } catch (error) {
      console.error('Error toggling program status:', error);
      alert('Error al cambiar el estado del programa');
    }
  };

  const handleViewEnrollments = async (program: Program) => {
    setSelectedProgram(program);
    setShowEnrollmentsModal(true);
    setLoadingEnrollments(true);
    setEnrollments([]); // Clear previous enrollments

    try {
      const response = await fetch(`/api/admin/programs/${program.id}/enrollments`);
      if (response.ok) {
        const enrollmentsData = (await response.json()) as Enrollment[];
        setEnrollments(enrollmentsData);
      } else {
        console.error('Error fetching enrollments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching program enrollments:', error as Error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const getProgramEnrollments = (programId: number) => {
    return enrollments.filter((enrollment) => enrollment.programId === programId);
  };

  // Filter enrollments by search term
  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (!enrollmentSearchTerm) return true;

    const searchTerm = enrollmentSearchTerm.toLowerCase();
    const participant = enrollment.child || enrollment.member;

    // Search in participant name and document
    const participantName = participant?.name || '';
    const participantDocument = participant?.documentID || '';

    // Check if participant matches
    if (
      participantName.toLowerCase().includes(searchTerm) ||
      participantDocument.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    // Search in guardians/parents (for children)
    if (enrollment.child && enrollment.child.guardians) {
      for (const guardian of enrollment.child.guardians) {
        const guardianName = guardian.name || '';
        const guardianDocument = guardian.documentID || '';

        if (
          guardianName.toLowerCase().includes(searchTerm) ||
          guardianDocument.toLowerCase().includes(searchTerm)
        ) {
          return true;
        }
      }
    }

    return false;
  });

  const downloadCSV = async (program: Program) => {
    try {
      // Fetch enrollments for this specific program
      const response = await fetch(`/api/admin/programs/${program.id}/enrollments`);
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }

      const programEnrollments = (await response.json()) as Enrollment[];

      // Prepare CSV data - same as table display
      const csvHeaders = ['Nombre', 'Tipo', 'Documento', 'Responsables', 'Fecha Inscripción'];

      const csvData = programEnrollments.map((enrollment) => {
        const participant = enrollment.child || enrollment.member;

        // Get contact information and guardian names (same logic as table)
        let phone = 'N/A';
        let guardianNames = 'N/A';

        if (enrollment.child && enrollment.child.guardians) {
          // For children, get all guardians with their relationships and phones
          const guardianList = enrollment.child.guardians
            .map((guardian: any) => {
              const relationship =
                guardian.relationship === 'father'
                  ? 'Padre'
                  : guardian.relationship === 'mother'
                    ? 'Madre'
                    : guardian.relationship === 'guardian'
                      ? 'Tutor'
                      : guardian.relationship;
              const phoneInfo = guardian.phone ? ` - ${guardian.phone}` : '';
              return `${guardian.name} (${relationship})${phoneInfo}`;
            })
            .join(', ');
          guardianNames = guardianList;

          // Get all phones
          const phones = enrollment.child.guardians
            .map((guardian: any) => guardian.phone)
            .filter((phone: string) => phone && phone !== 'N/A')
            .join(', ');
          phone = phones || 'N/A';
        } else if (enrollment.member) {
          // For adults, get contact info directly
          phone = enrollment.member.phone || 'N/A';
          guardianNames = enrollment.member.name || 'N/A';
        }

        return [
          participant?.name || 'N/A',
          enrollment.child ? 'Niño' : 'Adulto',
          participant?.documentID || 'N/A',
          guardianNames,
          new Date(enrollment.createdAt).toLocaleDateString('es-ES'),
        ];
      });

      // Create CSV content with proper escaping
      const escapeCSV = (value: string) => {
        // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        csvHeaders.map(escapeCSV).join(','),
        ...csvData.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${program.title}_inscritos.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error as Error);
      alert('Error al descargar el archivo CSV');
    }
  };

  if (loading) {
    return (
      <AdminLayout adminEmail={adminEmail}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-ink-soft text-lg">Cargando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[40px] leading-[1.04]">Gestión de Programas</h1>
            <p className="text-ink-soft mt-2">
              Programas de los departamentos, sus inscritos y la página de inscripción.
            </p>
          </div>
          <Button onClick={() => setShowProgramForm(true)}>Nuevo Programa</Button>
        </div>

        {/* Filters */}
        <div className="border-line rounded-2xl border bg-white p-5 md:p-6">
          <h3 className="mb-4 text-xl">Filtros</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className={labelClass}>Buscar por nombre</label>
              <Input
                type="text"
                placeholder="Buscar programas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Departamento</label>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">Todos los departamentos</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDepartmentFilter('');
                }}
                className="h-12 w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Programs Table */}
        <div className="border-line overflow-hidden rounded-2xl border bg-white">
          <div className="border-line border-b px-6 py-4">
            <h3 className="text-xl">Programas Registrados ({filteredPrograms.length})</h3>
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="divide-line min-w-full divide-y">
              <thead className="text-ink-soft bg-gray-50 text-xs font-semibold uppercase tracking-[.04em]">
                <tr>
                  <th className="px-5 py-3 text-left">Título</th>
                  <th className="px-5 py-3 text-left">Departamento</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-left">Inscritos</th>
                  <th className="px-5 py-3 text-left">URL de Inscripción</th>
                  <th className="px-5 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="text-ink whitespace-nowrap px-5 py-4 text-sm font-medium">
                      {program.title}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <DepartmentTag code={program.department} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusPill active={program.isActive} />
                    </td>
                    <td className="text-ink-soft whitespace-nowrap px-5 py-4 text-sm">
                      {program._count?.enrollments || 0}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <a
                        href={`/program/${program.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-denim hover:text-ink underline underline-offset-4"
                      >
                        /program/{program.id}
                      </a>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-5 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewEnrollments(program)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditProgram(program)}
                      >
                        Editar
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
              {filteredPrograms.map((program) => (
                <div key={program.id} className="space-y-3 p-5">
                  <div>
                    <h3 className="mb-2 text-xl">{program.title}</h3>
                    <DepartmentTag code={program.department} />
                  </div>
                  <div className="text-ink-soft flex items-center gap-3 text-sm">
                    <StatusPill active={program.isActive} />
                    <span>{program._count?.enrollments || 0} inscritos</span>
                  </div>

                  <div>
                    <p className="text-ink-soft text-[13px]">URL de inscripción:</p>
                    <a
                      href={`/program/${program.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-denim hover:text-ink text-sm underline underline-offset-4"
                    >
                      /program/{program.id}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handleViewEnrollments(program)}>
                      Ver Detalles
                    </Button>
                    <Button variant="secondary" onClick={() => handleEditProgram(program)}>
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Program Form Modal */}
        {showProgramForm && (
          <div
            className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowProgramForm(false);
              setEditingProgram(null);
              setProgramFormData({
                title: '',
                department: '',
                content: '',
                isActive: true,
              });
            }}
          >
            <div
              className="border-line flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-line flex items-center justify-between border-b px-5 py-4 md:px-6">
                <h2 className="text-[28px] leading-tight">
                  {editingProgram ? 'Editar Programa' : 'Nuevo Programa'}
                </h2>
                <button
                  onClick={() => {
                    setShowProgramForm(false);
                    setEditingProgram(null);
                    setProgramFormData({
                      title: '',
                      department: '',
                      content: '',
                      isActive: true,
                    });
                  }}
                  className={closeButtonClass}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6">
                <form onSubmit={handleProgramSubmit} className="space-y-5">
                  <div>
                    <label className={labelClass}>
                      Título del Programa <span className="text-[#b3261e]">*</span>
                    </label>
                    <Input
                      type="text"
                      value={programFormData.title}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                      placeholder="Ej: Club de Aventureros 2024"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Departamento <span className="text-[#b3261e]">*</span>
                    </label>
                    <Select
                      value={programFormData.department}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      required
                    >
                      <option value="">Seleccionar departamento</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className={labelClass}>Contenido del Programa</label>
                    <Textarea
                      value={programFormData.content}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={4}
                      placeholder="Detalles del programa, directores, organizadores, horarios, ubicación, requisitos, etc."
                    />
                    <p className="text-ink-soft mt-2 text-[13px]">
                      Información opcional sobre el programa que se mostrará en la página pública
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isActive"
                      checked={programFormData.isActive}
                      onCheckedChange={(checked) =>
                        setProgramFormData((prev) => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <label htmlFor="isActive" className="text-ink text-base">
                      Programa activo
                    </label>
                  </div>

                  <div className="border-line flex justify-end gap-3 border-t pt-5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowProgramForm(false);
                        setEditingProgram(null);
                        setProgramFormData({
                          title: '',
                          department: '',
                          content: '',
                          isActive: true,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={savingProgram}>
                      {editingProgram ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments Modal */}
        {showEnrollmentsModal && selectedProgram && (
          <div
            className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEnrollmentsModal(false);
              setEnrollments([]);
              setLoadingEnrollments(false);
              setEnrollmentSearchTerm('');
            }}
          >
            <div
              className="border-line flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-line flex flex-col gap-4 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                <h2 className="text-[28px] leading-tight">Inscritos en {selectedProgram.title}</h2>
                <div className="flex flex-wrap gap-2 md:flex-none">
                  {usesFamilyEnrollment(selectedProgram.department) && (
                    <a
                      href={`/admin/programs/${selectedProgram.id}/roster`}
                      className={buttonVariants({ variant: 'outline' })}
                    >
                      Grupos familiares
                    </a>
                  )}
                  <Button onClick={() => downloadCSV(selectedProgram)}>Descargar CSV</Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEnrollmentsModal(false);
                      setEnrollments([]);
                      setLoadingEnrollments(false);
                      setEnrollmentSearchTerm('');
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6">
                {/* Enrollment Search */}
                <div className="mb-5">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className={labelClass}>
                        Buscar por nombre o documento (niños, padres, responsables)
                      </label>
                      <Input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        value={enrollmentSearchTerm}
                        onChange={(e) => setEnrollmentSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setEnrollmentSearchTerm('')}
                      className="h-12"
                    >
                      Limpiar
                    </Button>
                  </div>
                  {enrollmentSearchTerm && (
                    <p className="text-ink-soft mt-2 text-sm">
                      Mostrando {filteredEnrollments.length} de {enrollments.length} inscritos
                    </p>
                  )}
                </div>

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
                    <div className="border-line hidden overflow-hidden rounded-2xl border lg:block">
                      <table className="divide-line min-w-full divide-y">
                        <thead className="text-ink-soft bg-gray-50 text-xs font-semibold uppercase tracking-[.04em]">
                          <tr>
                            <th className="px-6 py-3 text-left">Participante</th>
                            <th className="px-6 py-3 text-left">Tipo</th>
                            <th className="px-6 py-3 text-left">Responsables/Contacto</th>
                            <th className="px-6 py-3 text-left">Fecha de Inscripción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-line divide-y bg-white">
                          {filteredEnrollments.map((enrollment: any) => {
                            const participant = enrollment.child || enrollment.member;
                            return (
                              <tr
                                key={`${enrollment.child ? 'child' : 'adult'}-${enrollment.id}`}
                                className="hover:bg-gray-50"
                              >
                                <td className="whitespace-nowrap px-6 py-4">
                                  <div>
                                    <div className="text-ink text-sm font-medium">
                                      {participant?.name || 'N/A'}
                                    </div>
                                    <div className="text-ink-soft text-sm">
                                      Doc: {participant?.documentID || 'N/A'}
                                    </div>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <TypePill child={Boolean(enrollment.child)} />
                                </td>
                                <td className="px-6 py-4">
                                  {enrollment.child &&
                                  enrollment.child.guardians &&
                                  enrollment.child.guardians.length > 0 ? (
                                    <div className="space-y-2">
                                      {enrollment.child.guardians.map(
                                        (guardian: any, index: number) => (
                                          <Guardian key={index} guardian={guardian} />
                                        )
                                      )}
                                    </div>
                                  ) : enrollment.member ? (
                                    <div>
                                      <p className="text-ink text-sm">{enrollment.member.name}</p>
                                      <p className="text-ink-soft font-mono text-xs">
                                        {enrollment.member.phone || 'Sin teléfono'}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-ink-soft text-sm">Sin información</span>
                                  )}
                                </td>
                                <td className="text-ink-soft whitespace-nowrap px-6 py-4 text-sm">
                                  {new Date(enrollment.createdAt).toLocaleDateString('es-ES')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-3 lg:hidden">
                      {filteredEnrollments.map((enrollment: any) => {
                        const participant = enrollment.child || enrollment.member;
                        return (
                          <div
                            key={`${enrollment.child ? 'child' : 'adult'}-${enrollment.id}`}
                            className="border-line rounded-2xl border bg-white p-4"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="text-ink font-sans text-sm font-medium tracking-normal">
                                  {participant?.name || 'N/A'}
                                </h3>
                                <p className="text-ink-soft mt-1 text-xs">
                                  Doc: {participant?.documentID || 'N/A'}
                                </p>
                              </div>
                              <TypePill child={Boolean(enrollment.child)} />
                            </div>

                            {/* Responsables Section */}
                            {enrollment.child &&
                            enrollment.child.guardians &&
                            enrollment.child.guardians.length > 0 ? (
                              <div className="mb-3">
                                <h4 className="text-ink-soft mb-2 font-sans text-xs font-medium tracking-normal">
                                  Responsables:
                                </h4>
                                <div className="space-y-2">
                                  {enrollment.child.guardians.map(
                                    (guardian: any, index: number) => (
                                      <Guardian key={index} guardian={guardian} />
                                    )
                                  )}
                                </div>
                              </div>
                            ) : enrollment.member ? (
                              <div className="mb-3">
                                <h4 className="text-ink-soft mb-1 font-sans text-xs font-medium tracking-normal">
                                  Contacto:
                                </h4>
                                <p className="text-ink text-sm">{enrollment.member.name}</p>
                                <p className="text-ink-soft font-mono text-xs">
                                  {enrollment.member.phone || 'Sin teléfono'}
                                </p>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <p className="text-ink-soft text-xs">Sin información de contacto</p>
                              </div>
                            )}

                            <div className="text-ink-soft text-xs">
                              Inscrito: {new Date(enrollment.createdAt).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredEnrollments.length === 0 && (
                      <div className="text-ink-soft py-8 text-center">
                        {enrollmentSearchTerm
                          ? `No se encontraron inscritos con el nombre "${enrollmentSearchTerm}"`
                          : 'No hay inscritos en este programa aún.'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer with Close Button */}
              <div className="border-line flex justify-end border-t px-5 py-4 md:px-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEnrollmentsModal(false);
                    setEnrollments([]);
                    setLoadingEnrollments(false);
                    setEnrollmentSearchTerm('');
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

const labelClass = 'text-ink mb-2 block text-sm font-medium';
const closeButtonClass =
  'text-ink-soft hover:text-ink flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100';

// Kit select: the field box with a lucide chevron in place of the native arrow
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <ChevronDown
        className="text-ink-soft pointer-events-none absolute right-3.5 top-3.5 h-5 w-5"
        strokeWidth={1.5}
      />
    </div>
  );
}

function DepartmentTag({ code }: { code: string }) {
  return (
    <span className="border-line text-ink inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[13px] font-medium">
      <span className="bg-warm h-1.5 w-1.5 rounded-full" />
      {getDepartmentName(code)}
    </span>
  );
}

const pillClass = 'inline-flex rounded-full px-2.5 py-1 text-xs font-medium';

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`${pillClass} ${active ? 'bg-green-50 text-green-800' : 'text-ink-soft bg-gray-100'}`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function TypePill({ child }: { child: boolean }) {
  return (
    <span
      className={`${pillClass} ${child ? 'bg-warm-soft text-ink' : 'text-ink-soft bg-gray-100'}`}
    >
      {child ? 'Niño' : 'Adulto'}
    </span>
  );
}

function Guardian({ guardian }: { guardian: any }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${pillClass} text-ink-soft bg-gray-100`}>
        {guardian.relationship === 'father'
          ? 'Padre'
          : guardian.relationship === 'mother'
            ? 'Madre'
            : guardian.relationship === 'guardian'
              ? 'Tutor'
              : guardian.relationship}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink truncate text-sm">{guardian.name}</p>
        <p className="text-ink-soft font-mono text-xs">{guardian.phone || 'Sin teléfono'}</p>
      </div>
    </div>
  );
}
