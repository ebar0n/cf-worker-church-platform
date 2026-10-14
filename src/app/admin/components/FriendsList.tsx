'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TableWithPagination from '@/app/admin/components/TableWithPagination';
import {
  ChevronDown,
  CircleCheck,
  Download,
  Eye,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { downloadCsv } from '@/lib/csv';

interface FriendsListProps {
  adminEmail: string;
}

type RequestType = 'oracion' | 'visita' | 'informacion' | 'todos';
type ReadStatus = 'todos' | 'leido' | 'no-leido';

export default function FriendsList({ adminEmail }: FriendsListProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [requestType, setRequestType] = useState<RequestType>('todos');
  const [readStatus, setReadStatus] = useState<ReadStatus>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const pageSize = 10;
  const [selectedFriend, setSelectedFriend] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/friends')
      .then((res) => res.json())
      .then((data) => setFriends(data as any[]));
  }, []);

  const toggleReadStatus = async (id: string) => {
    const friend = friends.find((f) => f.id === id);
    if (!friend) return;

    const res = await fetch(`/api/admin/friends/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: !friend.isRead }),
    });
    if (!res.ok) return;

    const { friend: updated } = (await res.json()) as { friend: { isRead: boolean } };
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, isRead: updated.isRead } : f)));
  };

  const filteredFriends = friends.filter((f) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(searchLower) || f.phone.toLowerCase().includes(searchLower);

    const matchesRequestType = requestType === 'todos' || f.reason === requestType;

    const matchesReadStatus =
      readStatus === 'todos' ||
      (readStatus === 'leido' && f.isRead) ||
      (readStatus === 'no-leido' && !f.isRead);

    return matchesSearch && matchesRequestType && matchesReadStatus;
  });

  const totalPages = Math.ceil(filteredFriends.length / pageSize);
  // Marking as read can empty the last page of a filtered view
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginatedFriends = filteredFriends.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Teléfono',
      'Dirección',
      'Tipo de solicitud',
      'Nota',
      'Estado',
      'Fecha de creación',
      'Última actualización',
    ];
    downloadCsv('solicitudes.csv', [
      headers,
      ...filteredFriends.map((f) => [
        f.id,
        f.name,
        f.phone,
        f.address || '',
        f.reason,
        f.note || '',
        f.isRead ? 'Leído' : 'No leído',
        new Date(f.createdAt).toLocaleString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        new Date(f.updatedAt).toLocaleString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      ]),
    ]);
  };

  const handleOpenDetails = (friend: any) => {
    setSelectedFriend(friend);
  };

  const handleCloseDetails = () => {
    setSelectedFriend(null);
  };

  return (
    <AdminLayout adminEmail={adminEmail}>
      <h2 className="mb-6 text-[32px] leading-tight md:text-[40px]">Solicitudes registradas</h2>

      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              className="pl-11"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search
              className="text-ink-soft pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
              strokeWidth={1.5}
            />
          </div>
          <div className="grid gap-3 sm:flex sm:items-center md:justify-end">
            <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
              Filtros avanzados
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="h-5 w-5" strokeWidth={1.5} />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-line rounded-2xl border bg-white p-5">
            <div>
              <h3 className="mb-4 text-xl leading-tight">Filtros avanzados</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-ink mb-2 block text-sm font-medium">
                    Tipo de solicitud
                  </label>
                  <div className="relative">
                    <select
                      value={requestType}
                      onChange={(e) => {
                        setRequestType(e.target.value as RequestType);
                        handleFilterChange();
                      }}
                      className="focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <option value="todos">Todos</option>
                      <option value="oracion">Oración</option>
                      <option value="visita">Visita</option>
                      <option value="informacion">Información</option>
                    </select>
                    <ChevronDown
                      className="text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-ink mb-2 block text-sm font-medium">Estado</label>
                  <div className="relative">
                    <select
                      value={readStatus}
                      onChange={(e) => {
                        setReadStatus(e.target.value as ReadStatus);
                        handleFilterChange();
                      }}
                      className="focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <option value="todos">Todos</option>
                      <option value="leido">Leídos</option>
                      <option value="no-leido">No leídos</option>
                    </select>
                    <ChevronDown
                      className="text-ink-soft pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="border-line hidden overflow-x-auto rounded-2xl border bg-white md:block">
        <table className="divide-line w-full divide-y text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Nombre
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Teléfono
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Fecha de registro
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Tipo de solicitud
              </th>
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {paginatedFriends.map((f) => (
              <tr key={f.id} className={!f.isRead ? 'bg-warm-soft' : 'hover:bg-gray-50'}>
                <td className="text-ink px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3">{f.phone}</td>
                <td className="px-4 py-3">
                  {new Date(f.createdAt).toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </td>
                <td className="px-4 py-3 capitalize">{f.reason}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenDetails(f)}
                      className="text-ink-soft hover:text-ink flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                      title="Ver detalles"
                    >
                      <Eye className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => toggleReadStatus(f.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 ${
                        f.isRead
                          ? 'text-ink-soft hover:text-ink'
                          : 'text-green-700 hover:text-green-800'
                      }`}
                      title={f.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
                    >
                      <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-4 md:hidden">
        {paginatedFriends.map((f) => (
          <div
            key={f.id}
            className={`border-line rounded-2xl border p-4 ${
              !f.isRead ? 'bg-warm-soft' : 'bg-white'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-ink text-base font-semibold">{f.name}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  !f.isRead ? 'text-ink bg-white' : 'text-ink-soft bg-gray-100'
                }`}
              >
                {f.reason}
              </span>
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Teléfono:</span> {f.phone}
            </div>
            <div className="mb-1 text-sm">
              <span className="font-semibold">Fecha:</span>{' '}
              {new Date(f.createdAt).toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
            <div className="mt-2 flex justify-end gap-1">
              <button
                onClick={() => handleOpenDetails(f)}
                className="text-ink-soft hover:text-ink flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
                title="Ver detalles"
              >
                <Eye className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => toggleReadStatus(f.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 ${
                  f.isRead ? 'text-ink-soft hover:text-ink' : 'text-green-700 hover:text-green-800'
                }`}
                title={f.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
              >
                <CircleCheck className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-ink-soft flex items-center px-3 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedFriend && (
        <div
          className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="border-line flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-line flex items-center justify-between gap-4 border-b p-4 md:p-6">
              <h3 className="text-[28px] leading-tight">Detalles de la solicitud</h3>
              <button
                onClick={handleCloseDetails}
                aria-label="Cerrar"
                className="text-ink-soft hover:text-ink flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Nombre:</span> {selectedFriend.name}
                </div>
                <div>
                  <span className="font-semibold">Documento:</span> {selectedFriend.documentID}
                </div>
                <div>
                  <span className="font-semibold">Teléfono:</span> {selectedFriend.phone}
                </div>
                <div>
                  <span className="font-semibold">Email:</span>{' '}
                  {selectedFriend.email || 'No especificado'}
                </div>
                <div>
                  <span className="font-semibold">Dirección:</span> {selectedFriend.address}
                </div>
                <div>
                  <span className="font-semibold">Motivo de la solicitud:</span>{' '}
                  {selectedFriend.reason}
                </div>
                <div>
                  <span className="font-semibold">Mensaje:</span>{' '}
                  {selectedFriend.note || 'No especificado'}
                </div>
                <div>
                  <span className="font-semibold">Estado:</span>{' '}
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      selectedFriend.isRead ? 'bg-green-50 text-green-800' : 'bg-warm-soft text-ink'
                    }`}
                  >
                    {selectedFriend.isRead ? 'Leído' : 'Nuevo'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Fecha de solicitud:</span>{' '}
                  {new Date(selectedFriend.createdAt).toLocaleString('es-ES')}
                </div>
              </div>
            </div>

            {/* Footer with Close Button */}
            <div className="border-line flex justify-end border-t p-4 md:p-6">
              <Button variant="outline" onClick={handleCloseDetails}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
