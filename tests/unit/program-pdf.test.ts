import { describe, expect, it } from 'vitest';
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
  it('includes both guardians, their signature blocks and the actual health data', async () => {
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
      person.allergies,
      person.conditions,
      person.medications,
      ...tutors.flatMap((t) => [t.name, t.documentID, t.phone]),
      'Firma del responsable - Padre',
      'Firma del responsable - Madre',
    ]) {
      expect(content).toContain(encoded(text));
    }
  });

  it('includes each adult own identity, phone and signature', async () => {
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
        tutor.phone,
        'qa@example.invalid',
        'Firma del participante',
      ])
        expect(content).toContain(encoded(text));
    }
  });

  it('paginates long health answers and keeps text inside the printable area', async () => {
    const { doc, content, encoded } = await pdfContent(
      await buildProgramAuthorizationPdf({
        programTitle: 'Club QA',
        person: {
          ...person,
          allergies: 'Descripción médica extensa '.repeat(150),
          medications: 'X'.repeat(200),
        },
        tutor: tutors[0],
        tutors,
      })
    );
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(content).toContain(encoded('Firma del responsable - Madre'));
    for (const match of content.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm/g)) {
      expect(Number(match[1])).toBeGreaterThanOrEqual(56);
      expect(Number(match[1])).toBeLessThan(540);
      expect(Number(match[2])).toBeGreaterThanOrEqual(28);
      expect(Number(match[2])).toBeLessThanOrEqual(786);
    }
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
