'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TableWithPagination from '@/app/admin/components/TableWithPagination';

interface FriendsListProps {
  adminEmail: string;
}

export default function FriendsList({ adminEmail }: FriendsListProps) {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/friends')
      .then((res) => res.json())
      .then((data) => setFriends(data as any[]));
  }, []);

  return (
    <AdminLayout adminEmail={adminEmail}>
      <h2 className="mb-6 text-2xl font-bold">Amigos Registrados</h2>
      <TableWithPagination
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'documentID', label: 'Documento' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'email', label: 'Email' },
          { key: 'createdAt', label: 'Fecha Registro' },
        ]}
        data={friends}
        pageSize={10}
        searchPlaceholder="Buscar por nombre, documento, teléfono..."
        searchKeys={['name', 'documentID', 'phone', 'email']}
        renderRow={(f, openDetails) => (
          <tr key={f.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-3">{f.name}</td>
            <td className="px-4 py-3">{f.documentID}</td>
            <td className="px-4 py-3">{f.phone}</td>
            <td className="px-4 py-3">{f.email || '-'}</td>
            <td className="px-4 py-3">{new Date(f.createdAt).toLocaleString()}</td>
            <td className="px-4 py-3">
              <button
                className="text-xs font-semibold text-[#4b207f] underline hover:text-[#e36520]"
                onClick={() => openDetails(f)}
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