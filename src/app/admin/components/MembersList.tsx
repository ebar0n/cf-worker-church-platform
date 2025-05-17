'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import TableWithPagination from '@/app/admin/components/TableWithPagination';

interface MembersListProps {
  adminEmail: string;
}

export default function MembersList({ adminEmail }: MembersListProps) {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/members')
      .then((res) => res.json())
      .then((data) => setMembers(data as any[]));
  }, []);

  return (
    <AdminLayout adminEmail={adminEmail}>
      <h2 className="mb-6 text-2xl font-bold">Miembros Registrados</h2>
      <TableWithPagination
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'documentID', label: 'Documento' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'email', label: 'Email' },
          { key: 'baptismYear', label: 'Año Bautismo' },
          { key: 'ministry', label: 'Ministerio' },
          { key: 'createdAt', label: 'Fecha Registro' },
        ]}
        data={members}
        pageSize={10}
        searchPlaceholder="Buscar por nombre, documento, teléfono..."
        searchKeys={['name', 'documentID', 'phone', 'email', 'ministry']}
        renderRow={(m, openDetails) => (
          <tr key={m.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-3">{m.name}</td>
            <td className="px-4 py-3">{m.documentID}</td>
            <td className="px-4 py-3">{m.phone}</td>
            <td className="px-4 py-3">{m.email || '-'}</td>
            <td className="px-4 py-3">{m.baptismYear}</td>
            <td className="px-4 py-3">{m.ministry}</td>
            <td className="px-4 py-3">{new Date(m.createdAt).toLocaleString()}</td>
            <td className="px-4 py-3">
              <button
                className="text-xs font-semibold text-[#4b207f] underline hover:text-[#e36520]"
                onClick={() => openDetails(m)}
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