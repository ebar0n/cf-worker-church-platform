import React, { useState, useMemo } from 'react';

interface TableWithPaginationProps<T> {
  columns: { key: keyof T | string; label: string; className?: string }[];
  data: T[];
  pageSize?: number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  renderRow?: (row: T, openDetails: (row: T) => void) => React.ReactNode;
}

function exportToCSV<T>(
  data: T[],
  columns: { key: keyof T | string; label: string }[],
  filename = 'export.csv'
) {
  const header = columns.map((col) => col.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key as keyof T];
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TableWithPagination<T>({
  columns,
  data,
  pageSize = 10,
  searchPlaceholder = 'Buscar...',
  searchKeys = [],
  renderRow,
}: TableWithPaginationProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<T | null>(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, data, searchKeys]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <input
          className="w-80 rounded-lg border px-4 py-2 text-sm"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-[#4b207f] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#3a1762]"
            onClick={() => exportToCSV(filtered, columns)}
          >
            Descargar CSV
          </button>
          <span className="text-sm text-gray-500">
            Página <b>{page}</b> de <b>{totalPages || 1}</b> ({filtered.length} items)
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left font-semibold text-gray-700 ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-gray-400">
                  No hay datos para mostrar.
                </td>
              </tr>
            ) : (
              paginated.map((row) =>
                renderRow ? (
                  renderRow(row, setDetails)
                ) : (
                  <tr
                    key={(row as any).id || JSON.stringify(row)}
                    className="border-b hover:bg-gray-50"
                  >
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3">
                        {String(row[col.key as keyof T] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        className="text-xs font-semibold text-[#4b207f] underline hover:text-[#e36520]"
                        onClick={() => setDetails(row)}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          className="rounded border px-3 py-1 text-gray-600 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          &lt;
        </button>
        <button
          className="rounded border px-3 py-1 text-gray-600 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
        >
          &gt;
        </button>
      </div>
      {/* Modal de detalles */}
      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
            <button
              className="absolute right-3 top-3 text-xl font-bold text-gray-400 hover:text-[#e36520]"
              onClick={() => setDetails(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="mb-4 text-xl font-bold text-[#4b207f]">Detalles del registro</h3>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="min-w-[120px] font-semibold text-gray-700">{key}:</span>
                  <span className="break-all text-gray-600">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value ?? '-')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
