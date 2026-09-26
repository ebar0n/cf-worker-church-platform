import { afterEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument, PDFRawStream, decodePDFRawStream, StandardFonts } from 'pdf-lib';
import { buildProgramAuthorizationPdf } from '@/lib/program-pdf';

const person = {
  name: 'José Muñoz QA',
  documentID: '9900192603',
  birthDate: '2019-03-05',
  bloodType: 'O+',
  eps: 'Salud QA',
  allergies: 'Penicilina',
  conditions: 'Asma',
  medications: 'Medicamento QA',
  emergencyContactName: 'Ángela QA',
  emergencyContactPhone: '3000001904',
};
const tutors = [
  {
    name: 'Andrés Muñoz QA',
    documentID: '9900192601',
    relationship: 'father',
    phone: '3000001901',
  },
  { name: 'María Pérez QA', documentID: '9900192602', relationship: 'mother', phone: '3000001902' },
];

async function pdfContent(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes);
  const content = doc
    .getPages()
    .map((page) => {
      const streams = page.node.Contents();
      if (!streams) return '';
      const refs = 'asArray' in streams ? streams.asArray() : [streams];
      return refs
        .map((ref) => {
          const stream = doc.context.lookup(ref) as PDFRawStream;
          return new TextDecoder().decode(decodePDFRawStream(stream).decode());
        })
        .join('\n');
    })
    .join('\n');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  return { doc, content, encoded: (text: string) => font.encodeText(text).toString() };
}

describe('printable enrollment forms', () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    ['2019-09-26', '2026-09-26T04:59:00Z', 'RC'],
    ['2019-09-26', '2026-09-26T05:00:00Z', 'TI'],
    ['2008-09-26', '2026-09-26T04:59:00Z', 'TI'],
    ['2008-09-26', '2026-09-26T05:00:00Z', 'CC'],
    [null, '2026-09-26T05:00:00Z', 'Documento de identidad'],
  ])('prints %s as %s using the Colombian date (%s)', async (birthDate, now, type) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    const { content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person: { ...person, birthDate },
        tutor: tutors[0],
        tutors,
        isChild: true,
      })
    );
    expect(content).toContain(encoded(`${type}:`));
    expect(content).toContain(encoded(person.documentID));
    expect(content).not.toContain(encoded(`${type} ${person.documentID}`));
    expect(content).toContain(encoded('CC:'));
  });

  it('prints the production program title with emoji without failing font encoding', async () => {
    const { content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: '🌟 Club de Aventureros Elohe Israel 2026 🌟',
        person: { ...person, name: 'José Muñoz QA ✅' },
        tutor: tutors[0],
        tutors,
      })
    );
    expect(content).toContain(encoded('Club de Aventureros Elohe Israel 2026'));
    expect(content).toContain(encoded(person.name));
  });

  it('includes participation consent and signatures for both linked guardians', async () => {
    const { content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person,
        tutor: tutors[0],
        tutors,
        isChild: true,
      })
    );
    for (const text of [
      person.name,
      person.documentID,
      ...tutors.flatMap((t) => [t.name, t.documentID]),
      'Firma del responsable - Madre',
      'Firma del responsable - Padre',
    ]) {
      expect(content).toContain(encoded(text));
    }
    for (const text of [
      'Firma del participante',
      'Información de salud',
      'Fecha de nacimiento:',
      'EPS:',
      'hoja de vida',
      person.allergies,
      person.conditions,
      person.medications,
    ]) {
      expect(content).not.toContain(encoded(text));
    }
    expect(content).toContain(encoded('Autorización de participación del menor'));
  });

  it('includes each adult identity, data consent and signature without a health record', async () => {
    for (const tutor of tutors) {
      const { content, encoded } = await pdfContent(
        await buildProgramAuthorizationPdf({
          programTitle: 'Club QA',
          person: { ...person, ...tutor, birthDate: '1990-01-01', email: 'qa@example.invalid' },
          tutor: null,
        })
      );
      for (const text of [
        tutor.name,
        tutor.documentID,
        'Autorización de tratamiento de datos personales',
        'Firma del padre / madre / responsable',
        'CC:',
      ])
        expect(content).toContain(encoded(text));
      for (const text of [
        'Información de salud',
        'Fecha de nacimiento:',
        'EPS:',
        'hoja de vida',
        tutor.phone,
        'qa@example.invalid',
        person.allergies,
        person.conditions,
        person.medications,
        'Igualmente confirmo mi participación',
      ]) {
        expect(content).not.toContain(encoded(text));
      }
    }
  });

  it('paginates long identification values and keeps text inside the printable area', async () => {
    const { doc, content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person: {
          ...person,
          name: 'Nombre y apellidos extensos '.repeat(75),
          documentID: 'X'.repeat(200),
        },
        tutor: tutors[0],
        tutors,
      })
    );
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(content).toContain(encoded('Firma del responsable - Padre'));
    for (const match of content.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)) {
      expect(Number(match[1])).toBeGreaterThanOrEqual(72);
      expect(Number(match[1])).toBeLessThan(558);
      expect(Number(match[2])).toBeGreaterThanOrEqual(54);
      expect(Number(match[2])).toBeLessThanOrEqual(738);
    }
  });

  it('uses a single signature and singular consent when there is only one guardian', async () => {
    const { content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person,
        tutor: tutors[0],
        isChild: true,
      })
    );
    expect(content).toContain(encoded('Firma del responsable - Padre'));
    expect(content).not.toContain(encoded('Firma del responsable - Madre'));
    expect(content).not.toContain(encoded('Firmas de los responsables'));
    expect(content).not.toContain(encoded('Quienes firmamos'));
  });

  it('never generates adult self-consent for a child without a guardian', async () => {
    await expect(
      buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person,
        tutor: null,
        tutors: [],
        isChild: true,
      })
    ).rejects.toThrow('responsable');
  });
});
