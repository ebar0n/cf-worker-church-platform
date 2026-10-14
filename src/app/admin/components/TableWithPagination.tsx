import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { downloadCsv } from '@/lib/csv';

interface TableWithPaginationProps<T> {
  columns: { key: keyof T | string; label: string; className?: string }[];
  data: T[];
  pageSize?: number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  renderRow?: (row: T, openDetails: (row: T) => void) => React.ReactNode;
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
        <Input
          className="sm:w-80"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              downloadCsv('export.csv', [
                columns.map((col) => col.label),
                ...filtered.map((row) => columns.map((col) => row[col.key as keyof T])),
              ])
            }
          >
            Descargar CSV
          </Button>
          <span className="text-ink-soft text-sm">
            Página <b>{page}</b> de <b>{totalPages || 1}</b> ({filtered.length} items)
          </span>
        </div>
      </div>
      <div className="border-line overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-line border-b bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em] ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="text-ink-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-[.04em]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-ink-soft py-8 text-center">
                  No hay datos para mostrar.
                </td>
              </tr>
            ) : (
              paginated.map((row) =>
                renderRow ? (
                  renderRow(row, setDetails)
                ) : (
                  <tr key={(row as any).id || JSON.stringify(row)} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3">
                        {String(row[col.key as keyof T] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        className="text-denim hover:text-ink text-sm font-medium underline underline-offset-4"
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
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          &lt;
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
        >
          &gt;
        </Button>
      </div>
      {/* Modal de detalles */}
      {details && (
        <div className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="border-line relative w-full max-w-lg rounded-2xl border bg-white p-6 md:p-8">
            <button
              className="text-ink-soft hover:text-ink absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-gray-100"
              onClick={() => setDetails(null)}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <h3 className="mb-4 pr-10 text-[28px] leading-tight">Detalles del registro</h3>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="text-ink min-w-[120px] font-medium">{key}:</span>
                  <span className="text-ink-soft break-all">
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
