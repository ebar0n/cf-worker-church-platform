'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Program, Enrollment } from '@/app/types';
import { DEPARTMENTS, getDepartmentName } from '@/lib/constants';

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
        const error = (await response.json()) as { message?: string };
        alert(error.message || 'Error al guardar el programa');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error al guardar el programa');
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
        const error = (await response.json()) as { message?: string };
        alert(error.message || 'Error al eliminar el programa');
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
        const error = (await response.json()) as { message?: string };
        alert(error.message || 'Error al cambiar el estado del programa');
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
          <h1 className="text-3xl font-bold text-[#4b207f]">Gestión de Programas</h1>
          <Button
            onClick={() => setShowProgramForm(true)}
            className="rounded-lg bg-[#4b207f] px-6 py-2 font-medium text-white hover:bg-[#4b207f]/90"
          >
            Nuevo Programa
          </Button>
        </div>

        {/* Filters */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Filtros</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Buscar por nombre
              </label>
              <Input
                type="text"
                placeholder="Buscar programas..."
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
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Departamento</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
              >
                <option value="">Todos los departamentos</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDepartmentFilter('');
                }}
                className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Programs Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Programas Registrados ({filteredPrograms.length})
            </h3>
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Inscritos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    URL de Inscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {program.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {getDepartmentName(program.department)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          program.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {program.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {program._count?.enrollments || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <a
                        href={`/program/${program.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        /program/{program.id}
                      </a>
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <Button
                        size="sm"
                        onClick={() => handleViewEnrollments(program)}
                        className="border border-[#4b207f] bg-white text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditProgram(program)}
                        className="border border-blue-600 bg-white text-blue-600 hover:bg-blue-600 hover:text-white"
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
            <div className="divide-y divide-gray-200">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="p-4 hover:bg-gray-50">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-medium text-gray-900">{program.title}</h3>
                      <p className="mb-2 text-sm text-gray-500">
                        {getDepartmentName(program.department)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            program.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {program.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <span>{program._count?.enrollments || 0} inscritos</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500">URL de inscripción:</p>
                    <a
                      href={`/program/${program.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      /program/{program.id}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewEnrollments(program)}
                      className="border border-[#4b207f] bg-white text-xs text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditProgram(program)}
                      className="border border-blue-600 bg-white text-xs text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
              className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
                <h2 className="text-xl font-semibold text-[#4b207f]">
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
                <form onSubmit={handleProgramSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Título del Programa *
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Departamento *
                    </label>
                    <select
                      value={programFormData.department}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, department: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
                      required
                    >
                      <option value="">Seleccionar departamento</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Contenido del Programa
                    </label>
                    <textarea
                      value={programFormData.content}
                      onChange={(e) =>
                        setProgramFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4b207f]"
                      rows={4}
                      placeholder="Detalles del programa, directores, organizadores, horarios, ubicación, requisitos, etc."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Información opcional sobre el programa que se mostrará en la página pública
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={programFormData.isActive}
                      onCheckedChange={(checked) =>
                        setProgramFormData((prev) => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Programa activo
                    </label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
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
                      className="border border-[#4b207f] bg-white text-[#4b207f] hover:bg-[#4b207f] hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#4b207f] text-white hover:bg-[#4b207f]/90">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowEnrollmentsModal(false);
              setEnrollments([]);
              setLoadingEnrollments(false);
              setEnrollmentSearchTerm('');
            }}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 md:p-6">
                <h2 className="text-xl font-semibold text-[#4b207f]">
                  Inscritos en {selectedProgram.title}
                </h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => downloadCSV(selectedProgram)}
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
                    }}
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {/* Enrollment Search */}
                <div className="mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    <div className="flex items-end">
                      <Button
                        onClick={() => setEnrollmentSearchTerm('')}
                        className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                  {enrollmentSearchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                      Mostrando {filteredEnrollments.length} de {enrollments.length} inscritos
                    </p>
                  )}
                </div>

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
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Participante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Responsables/Contacto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                              Fecha de Inscripción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredEnrollments.map((enrollment: any) => {
                            const participant = enrollment.child || enrollment.member;
                            return (
                              <tr key={enrollment.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-6 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {participant?.name || 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Doc: {participant?.documentID || 'N/A'}
                                    </div>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                      enrollment.child
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {enrollment.child ? 'Niño' : 'Adulto'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {enrollment.child &&
                                  enrollment.child.guardians &&
                                  enrollment.child.guardians.length > 0 ? (
                                    <div className="space-y-1">
                                      {enrollment.child.guardians.map(
                                        (guardian: any, index: number) => (
                                          <div key={index} className="flex items-center space-x-2">
                                            <span
                                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                guardian.relationship === 'father'
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : guardian.relationship === 'mother'
                                                    ? 'bg-pink-100 text-pink-800'
                                                    : 'bg-purple-100 text-purple-800'
                                              }`}
                                            >
                                              {guardian.relationship === 'father'
                                                ? 'Padre'
                                                : guardian.relationship === 'mother'
                                                  ? 'Madre'
                                                  : guardian.relationship === 'guardian'
                                                    ? 'Tutor'
                                                    : guardian.relationship}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm text-gray-900">
                                                {guardian.name}
                                              </p>
                                              <p className="font-mono text-xs text-gray-500">
                                                {guardian.phone || 'Sin teléfono'}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : enrollment.member ? (
                                    <div>
                                      <p className="text-sm text-gray-900">
                                        {enrollment.member.name}
                                      </p>
                                      <p className="font-mono text-xs text-gray-500">
                                        {enrollment.member.phone || 'Sin teléfono'}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">Sin información</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                  {new Date(enrollment.createdAt).toLocaleDateString('es-ES')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-4 lg:hidden">
                      {filteredEnrollments.map((enrollment: any) => {
                        const participant = enrollment.child || enrollment.member;
                        return (
                          <div
                            key={enrollment.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {participant?.name || 'N/A'}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500">
                                  Doc: {participant?.documentID || 'N/A'}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  enrollment.child
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {enrollment.child ? 'Niño' : 'Adulto'}
                              </span>
                            </div>

                            {/* Responsables Section */}
                            {enrollment.child &&
                            enrollment.child.guardians &&
                            enrollment.child.guardians.length > 0 ? (
                              <div className="mb-3">
                                <h4 className="mb-2 text-xs font-medium text-gray-700">
                                  Responsables:
                                </h4>
                                <div className="space-y-2">
                                  {enrollment.child.guardians.map(
                                    (guardian: any, index: number) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <span
                                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                            guardian.relationship === 'father'
                                              ? 'bg-blue-100 text-blue-800'
                                              : guardian.relationship === 'mother'
                                                ? 'bg-pink-100 text-pink-800'
                                                : 'bg-purple-100 text-purple-800'
                                          }`}
                                        >
                                          {guardian.relationship === 'father'
                                            ? 'Padre'
                                            : guardian.relationship === 'mother'
                                              ? 'Madre'
                                              : guardian.relationship === 'guardian'
                                                ? 'Tutor'
                                                : guardian.relationship}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm text-gray-900">
                                            {guardian.name}
                                          </p>
                                          <p className="font-mono text-xs text-gray-500">
                                            {guardian.phone || 'Sin teléfono'}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            ) : enrollment.member ? (
                              <div className="mb-3">
                                <h4 className="mb-1 text-xs font-medium text-gray-700">
                                  Contacto:
                                </h4>
                                <p className="text-sm text-gray-900">{enrollment.member.name}</p>
                                <p className="font-mono text-xs text-gray-500">
                                  {enrollment.member.phone || 'Sin teléfono'}
                                </p>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500">Sin información de contacto</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              Inscrito: {new Date(enrollment.createdAt).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {filteredEnrollments.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        {enrollmentSearchTerm
                          ? `No se encontraron inscritos con el nombre "${enrollmentSearchTerm}"`
                          : 'No hay inscritos en este programa aún.'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer with Close Button */}
              <div className="flex justify-end border-t border-gray-200 p-4 md:p-6">
                <button
                  onClick={() => {
                    setShowEnrollmentsModal(false);
                    setEnrollments([]);
                    setLoadingEnrollments(false);
                    setEnrollmentSearchTerm('');
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
