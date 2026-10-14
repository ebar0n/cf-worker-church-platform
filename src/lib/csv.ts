// CSV for Excel: every cell quoted (names, addresses and notes carry commas
// and newlines), a BOM so accents survive, and a leading apostrophe on cells
// Excel would run as formulas (=, +, -, @) since many values come from
// public forms.
export function toCsv(rows: unknown[][]): string {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, rows: unknown[][]) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
