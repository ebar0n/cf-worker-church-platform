'use client';
import React, { useEffect, useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Baby, Download, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { genderLabel } from '@/lib/utils';

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

  // createdAt/updatedAt are UTC timestamps, not calendar dates: show the
  // Bogotá day (a 9 p.m. registration is not tomorrow's).
  const formatTimestamp = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

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
          genderLabel(child.gender),
          child.birthDate || 'No especificada',
          `"${guardians}"`,
          `"${phones}"`,
          formatTimestamp(child.createdAt),
          formatTimestamp(child.updatedAt),
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[32px] leading-tight md:text-[40px]">Niños Registrados</h1>
            <p className="text-ink-soft mt-1">Gestiona los niños registrados en el sistema</p>
          </div>
          <Button onClick={exportToCSV} className="self-start sm:self-auto">
            <Download className="h-5 w-5" strokeWidth={1.5} />
            Exportar CSV
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
          <Search
            className="text-ink-soft pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
            strokeWidth={1.5}
          />
        </div>

        {/* Children List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-ink-soft">Cargando niños...</div>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-300 p-5">
            <div className="bg-warm-soft flex h-11 w-11 flex-none items-center justify-center rounded-xl">
              <Baby className="text-ink h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="text-[15px] font-semibold">
              {searchTerm ? 'No se encontraron niños con esa búsqueda' : 'No hay niños registrados'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="border-line hidden overflow-hidden rounded-2xl border bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="divide-line min-w-full divide-y">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Nombre
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Documento
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Género
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Fecha de Nacimiento
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Responsables
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Teléfonos
                      </th>
                      <th className="text-ink-soft px-6 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                        Fecha de Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-line divide-y bg-white">
                    {filteredChildren.map((child) => (
                      <tr key={child.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{child.name}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">{child.documentID}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                            {genderLabel(child.gender)}
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
                                      <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                                        {guardian.relationship === 'father'
                                          ? 'Padre'
                                          : guardian.relationship === 'mother'
                                            ? 'Madre'
                                            : guardian.relationship === 'guardian' ||
                                                guardian.relationship === 'tutor'
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
                              <span className="text-ink-soft">Sin responsables registrados</span>
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
                                      <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                                        {guardian.relationship === 'father'
                                          ? 'Padre'
                                          : guardian.relationship === 'mother'
                                            ? 'Madre'
                                            : guardian.relationship === 'guardian' ||
                                                guardian.relationship === 'tutor'
                                              ? 'Tutor'
                                              : 'Responsable'}
                                      </span>
                                    </div>
                                    <div className="ml-0 mt-1 tabular-nums text-gray-900">
                                      {guardian.phone || 'No especificado'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-ink-soft">Sin teléfonos</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatTimestamp(child.createdAt)}
                          </div>
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
                <div key={child.id} className="border-line rounded-2xl border bg-white p-4">
                  <div className="space-y-3">
                    {/* Header with name and gender */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl leading-tight">{child.name}</h3>
                      <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                        {genderLabel(child.gender)}
                      </span>
                    </div>

                    {/* Document and birth date */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-ink-soft font-medium">Documento:</span>
                        <div className="text-gray-900">{child.documentID}</div>
                      </div>
                      <div>
                        <span className="text-ink-soft font-medium">Fecha de Nacimiento:</span>
                        <div className="text-gray-900">
                          {child.birthDate ? formatDate(child.birthDate) : 'No especificada'}
                        </div>
                      </div>
                    </div>

                    {/* Guardians */}
                    <div>
                      <span className="text-ink-soft font-medium">Responsables:</span>
                      <div className="mt-2 space-y-2">
                        {child.guardians && child.guardians.length > 0 ? (
                          child.guardians.map((guardian, index) => (
                            <div
                              key={`${child.id}-mobile-guardian-${guardian.id}-${index}`}
                              className="border-line rounded-xl border p-3"
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-ink-soft inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                                  {guardian.relationship === 'father'
                                    ? 'Padre'
                                    : guardian.relationship === 'mother'
                                      ? 'Madre'
                                      : guardian.relationship === 'guardian' ||
                                          guardian.relationship === 'tutor'
                                        ? 'Tutor'
                                        : 'Responsable'}
                                </span>
                              </div>
                              <div className="font-medium text-gray-900">{guardian.name}</div>
                              <div className="text-ink-soft text-sm tabular-nums">
                                {guardian.phone || 'No especificado'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-ink-soft">Sin responsables registrados</div>
                        )}
                      </div>
                    </div>

                    {/* Registration date */}
                    <div className="border-line border-t pt-3">
                      <span className="text-ink-soft text-xs">
                        Registrado: {formatTimestamp(child.createdAt)}
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
          <div>
            <div className="text-ink-soft text-sm">
              Mostrando {filteredChildren.length} de {children.length} niños
              {searchTerm && ` para "${searchTerm}"`}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
