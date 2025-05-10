'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TableWithPagination from '@/app/admin/components/TableWithPagination';

export default function FriendsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/friends')
      .then((res) => res.json())
      .then((data) => setRequests(data as any[]));
  }, []);

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold">Solicitudes de Amigos/Visitas</h2>
      <TableWithPagination
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'address', label: 'Dirección' },
          { key: 'reason', label: 'Motivo' },
          { key: 'createdAt', label: 'Fecha' },
        ]}
        data={requests}
        pageSize={10}
        searchPlaceholder="Buscar por nombre, teléfono o motivo..."
        searchKeys={['name', 'phone', 'reason']}
        renderRow={(req, openDetails) => (
          <tr key={req.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-3">{req.name}</td>
            <td className="px-4 py-3">{req.phone}</td>
            <td className="px-4 py-3">{req.address}</td>
            <td className="px-4 py-3">
              {req.reason.charAt(0).toUpperCase() + req.reason.slice(1)}
            </td>
            <td className="px-4 py-3">{new Date(req.createdAt).toLocaleString()}</td>
            <td className="px-4 py-3">
              <button
                className="text-xs font-semibold text-[#4b207f] underline hover:text-[#e36520]"
                onClick={() => openDetails(req)}
              >
                Ver detalles
              </button>
            </td>
          </tr>
        )}
      />
    </AdminLayout>
  );
}
