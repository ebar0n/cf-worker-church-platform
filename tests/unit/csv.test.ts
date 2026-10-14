import { describe, it, expect } from 'vitest';
import { toCsv } from '@/lib/csv';

describe('toCsv', () => {
  it('quotes every cell so commas, quotes and newlines stay in one column', () => {
    expect(toCsv([['Cra 5, #10-20', 'dijo "hola"', 'línea 1\nlínea 2', null, 7]])).toBe(
      '﻿"Cra 5, #10-20","dijo ""hola""","línea 1\nlínea 2","","7"'
    );
  });

  it('starts with a BOM and separates rows with CRLF', () => {
    expect(toCsv([['a'], ['b']])).toBe('﻿"a"\r\n"b"');
  });

  it('neutralizes cells Excel would run as formulas', () => {
    expect(toCsv([['=HYPERLINK("x")', '+57 315', '-1', '@SUM(A1)', 'José']])).toBe(
      '﻿"\'=HYPERLINK(""x"")","\'+57 315","\'-1","\'@SUM(A1)","José"'
    );
  });
});
