'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';

interface Child {
  id: number;
  name: string;
  documentID: string;
  gender?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
  guardians?: {
    id: number;
    name: string;
    phone: string;
    relationship: string;
  }[];
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    // Get admin email from headers
    const getAdminEmail = async () => {
      try {
        const response = await fetch('/api/admin/me');
        const data = (await response.json()) as { email?: string };
        setAdminEmail(data.email || '');
      } catch (error) {
        console.error('Error fetching admin email:', error);
      }
    };
    getAdminEmail();
  }, []);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/children');
      if (response.ok) {
        const data = (await response.json()) as Child[];
        setChildren(data);
      } else {
        console.error('Error fetching children');
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.documentID.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    // Extract date components directly from string to avoid timezone issues
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return `${day}/${month}/${year}`;
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return 'No especificado';
    return gender === 'male' ? 'Masculino' : 'Femenino';
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Documento',
      'Género',
      'Fecha de Nacimiento',
      'Responsables',
      'Teléfonos',
      'Fecha de Registro',
      'Última Actualización',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredChildren.map((child) => {
        const guardians =
          child.guardians && child.guardians.length > 0
            ? child.guardians
                .map(
                  (g) =>
                    `${g.relationship === 'father' ? 'Padre' : g.relationship === 'mother' ? 'Madre' : 'Tutor'}: ${g.name}`
                )
                .join('; ')
            : 'Sin responsables';

        const phones =
          child.guardians && child.guardians.length > 0
            ? child.guardians
                .map(
                  (g) =>
                    `${g.relationship === 'father' ? 'Padre' : g.relationship === 'mother' ? 'Madre' : 'Tutor'}: ${g.phone || 'No especificado'}`
                )
                .join('; ')
            : 'Sin teléfonos';

        return [
          child.id,
          `"${child.name}"`,
          child.documentID,
          getGenderLabel(child.gender),
          child.birthDate || 'No especificada',
          `"${guardians}"`,
          `"${phones}"`,
          formatDate(child.createdAt),
          formatDate(child.updatedAt),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `niños_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <div className="space-y-6 px-4 py-4 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#4b207f]">Niños Registrados</h1>
            <p className="text-[#7c7c7c]">Gestiona los niños registrados en el sistema</p>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f]"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Children List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-lg text-[#7c7c7c]">Cargando niños...</div>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="text-lg text-[#7c7c7c]">
              {searchTerm ? 'No se encontraron niños con esa búsqueda' : 'No hay niños registrados'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Género
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha de Nacimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Responsables
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Teléfonos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha de Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredChildren.map((child) => (
                      <tr key={child.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{child.name}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{child.documentID}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                              child.gender === 'male'
                                ? 'bg-blue-100 text-blue-800'
                                : child.gender === 'female'
                                  ? 'bg-pink-100 text-pink-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getGenderLabel(child.gender)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {child.birthDate ? formatDate(child.birthDate) : 'No especificada'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {child.guardians && child.guardians.length > 0 ? (
                              <div className="space-y-2">
                                {child.guardians.map((guardian, index) => (
                                  <div
                                    key={`${child.id}-guardian-${guardian.id}-${index}`}
                                    className="flex flex-col"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
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
                                              : 'Responsable'}
                                      </span>
                                    </div>
                                    <div className="ml-0 mt-1 font-medium text-gray-900">
                                      {guardian.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-gray-500">
                                Sin responsables registrados
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {child.guardians && child.guardians.length > 0 ? (
                              <div className="space-y-2">
                                {child.guardians.map((guardian, index) => (
                                  <div
                                    key={`${child.id}-guardian-phone-${guardian.id}-${index}`}
                                    className="flex flex-col"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
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
                                              : 'Responsable'}
                                      </span>
                                    </div>
                                    <div className="ml-0 mt-1 font-mono text-gray-900">
                                      {guardian.phone || 'No especificado'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-gray-500">Sin teléfonos</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(child.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 lg:hidden">
              {filteredChildren.map((child) => (
                <div
                  key={child.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Header with name and gender */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          child.gender === 'male'
                            ? 'bg-blue-100 text-blue-800'
                            : child.gender === 'female'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getGenderLabel(child.gender)}
                      </span>
                    </div>

                    {/* Document and birth date */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Documento:</span>
                        <div className="text-gray-900">{child.documentID}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Fecha de Nacimiento:</span>
                        <div className="text-gray-900">
                          {child.birthDate ? formatDate(child.birthDate) : 'No especificada'}
                        </div>
                      </div>
                    </div>

                    {/* Guardians */}
                    <div>
                      <span className="font-medium text-gray-500">Responsables:</span>
                      <div className="mt-2 space-y-2">
                        {child.guardians && child.guardians.length > 0 ? (
                          child.guardians.map((guardian, index) => (
                            <div
                              key={`${child.id}-mobile-guardian-${guardian.id}-${index}`}
                              className="rounded-lg bg-gray-50 p-3"
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
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
                                        : 'Responsable'}
                                </span>
                              </div>
                              <div className="font-medium text-gray-900">{guardian.name}</div>
                              <div className="font-mono text-sm text-gray-600">
                                {guardian.phone || 'No especificado'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="italic text-gray-500">Sin responsables registrados</div>
                        )}
                      </div>
                    </div>

                    {/* Registration date */}
                    <div className="border-t border-gray-100 pt-2">
                      <span className="text-xs text-gray-500">
                        Registrado: {formatDate(child.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredChildren.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-[#7c7c7c]">
              Mostrando {filteredChildren.length} de {children.length} niños
              {searchTerm && ` para "${searchTerm}"`}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
