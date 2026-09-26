import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts, PDFRawStream, decodePDFRawStream, degrees } from 'pdf-lib';
import { buildFamilyPdf } from '@/lib/program-family-pdf';
import type { ProgramFamily } from '@/lib/program-family';

const base = {
  birthDate: '1990-01-01',
  gender: 'M',
  bloodType: 'O+',
  eps: 'Sanitas',
  allergies: 'Polen',
  conditions: 'Asma',
  medications: 'Ninguno',
  photoUrl: '/photo',
  idDocumentUrl: '/identity',
  epsCertificateUrl: '/eps',
  phone: '3000000000',
  emergencyContactName: 'Contacto QA',
  emergencyContactPhone: '3000000001',
  dataTreatmentAcceptedAt: '2026-01-01',
  participationConfirmedAt: '2026-01-01',
};
const family: ProgramFamily = {
  id: '1-2',
  adults: [
    { ...base, memberId: 1, name: 'Padre QA', documentID: '991', relationship: 'father' },
    { ...base, memberId: 2, name: 'Madre QA', documentID: '992', relationship: 'mother' },
  ],
  children: [
    {
      ...base,
      birthDate: '2020-01-01',
      childId: 1,
      guardianMemberIds: [1, 2],
      name: 'Menor QA',
      documentID: '993',
    },
  ],
};

async function pageTexts(pdf: PDFDocument) {
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  return pdf.getPages().map((page) => {
    const contents = page.node.Contents();
    const streams = !contents ? [] : 'asArray' in contents ? contents.asArray() : [contents];
    const raw = streams
      .map((ref) =>
        new TextDecoder().decode(
          decodePDFRawStream(pdf.context.lookup(ref) as PDFRawStream).decode()
        )
      )
      .join('\n');
    return (text: string) => raw.includes(font.encodeText(text).toString());
  });
}

const png = new Uint8Array(readFileSync('tests/fixtures/enrollment/foto.png'));
async function epsPdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText('Certificado EPS - pagina 1');
  pdf.addPage([400, 600]).drawText('Certificado EPS - pagina 2');
  pdf.getPage(1).setRotation(degrees(90));
  return { bytes: await pdf.save(), contentType: 'application/pdf' };
}

describe('family print packet', () => {
  afterEach(() => vi.useRealTimers());
  it('groups each profile, annex pages and its authorization with both linked guardians signing', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T12:00:00Z'));
    const eps = await epsPdf();
    const load = vi.fn(async (url: string) =>
      url === '/eps' ? eps : { bytes: png, contentType: 'image/png' }
    );
    const pdf = await PDFDocument.load(
      await buildFamilyPdf({
        programTitle: '🌟 Club QA 🌟',
        family,
        loadAttachment: load,
        treeIllustration: png,
      })
    );
    // 1 cover + 3 profiles + 6 EPS pages + 3 identity pages + 3 authorizations.
    expect(pdf.getPageCount()).toBe(16);
    // Includes portrait/rotated uploaded PDF pages, photos and authorizations.
    for (const page of pdf.getPages()) {
      expect(page.getSize()).toEqual({ width: 612, height: 792 });
    }
    const pages = await pageTexts(pdf);
    for (let index = 0; index < pages.length; index++) {
      expect(pages[index](`Familia Padre QA / Madre QA · ${index + 1} de 16`)).toBe(true);
    }
    expect(pages[0]('Padre QA')).toBe(true);
    expect(pages[0]('Madre QA')).toBe(true);
    expect(pages[0]('Menor QA')).toBe(true);
    expect(pages[0]('36 años - Padre')).toBe(true);
    expect(pages[0]('36 años - Madre')).toBe(true);
    for (const page of pages) expect(page('36 años - Guía Mayor')).toBe(false);
    expect(pages[0]('6 años - Aventurero - Abejas Industriosas')).toBe(true);
    expect(pages[0]('Teléfono: 3000000000')).toBe(true);
    expect(pages[0]('Contacto de emergencia')).toBe(true);
    expect(pages[0]('Contacto QA')).toBe(true);
    expect(pages[0]('Teléfono: 3000000001')).toBe(true);
    for (const page of pages.slice(1)) {
      expect(page('Contacto de emergencia')).toBe(false);
      expect(page('Contacto QA')).toBe(false);
      expect(page('3000000001')).toBe(false);
      expect(page('CC 991')).toBe(false);
      expect(page('CC 992')).toBe(false);
      expect(page('RC 993')).toBe(false);
    }
    expect(pages[0]('Carpeta del grupo familiar')).toBe(false);
    expect(pages[0]('Datos y anexos completos')).toBe(false);
    for (const page of pages) {
      expect(page('Club QA')).toBe(false); // no standalone program heading
      expect(page('Iglesia Adventista del Séptimo Día - El Jordán')).toBe(false);
    }
    expect(pages[1]('BORRADOR - información pendiente')).toBe(false);
    expect(pages[1]('FICHA DEL PARTICIPANTE')).toBe(true);
    expect(pages[1]('Menor QA')).toBe(true);
    for (const [start, name] of [
      [1, 'Menor QA'],
      [6, 'Padre QA'],
      [11, 'Madre QA'],
    ] as const) {
      expect(pages[start]('FICHA DEL PARTICIPANTE')).toBe(true);
      expect(pages[start]('Datos personales y de salud')).toBe(true);
      expect(pages[start]('HOJA DE VIDA')).toBe(false);
      expect(pages[start](name)).toBe(true);
      for (const offset of [1, 2]) {
        expect(pages[start + offset]('Certificado de afiliación a la EPS')).toBe(true);
        expect(pages[start + offset](name)).toBe(true);
      }
      expect(pages[start + 3]('Documento de identidad')).toBe(true);
      expect(pages[start + 3](name)).toBe(true);
      expect(pages[start + 4](name)).toBe(true);
      expect(
        pages[start + 4](
          start === 1
            ? 'Autorización de participación del menor'
            : 'Autorización de tratamiento de datos personales'
        )
      ).toBe(true);
    }
    expect(pages[5]('Firma del responsable - Padre')).toBe(true);
    expect(pages[5]('Firma del responsable - Madre')).toBe(true);
    expect(load).toHaveBeenCalledTimes(9);
  });

  it.each([1, 2])(
    'includes all %i family responsibles for every child, including older incomplete guardian links',
    async (adultCount) => {
      const olderFamily: ProgramFamily = {
        ...family,
        adults: family.adults.slice(0, adultCount),
        children: [
          family.children[0],
          { ...family.children[0], childId: 2, name: 'Hermano QA', guardianMemberIds: [1] },
        ],
      };
      const pdf = await PDFDocument.load(
        await buildFamilyPdf({
          programTitle: 'Club QA',
          family: olderFamily,
          loadAttachment: async () => null,
        })
      );
      const pages = await pageTexts(pdf);
      // Cover, then four pages per person: profile, EPS, identity, authorization.
      expect(pdf.getPageCount()).toBe(1 + (2 + adultCount) * 4);
      for (const profileIndex of [1, 5]) {
        expect(pages[profileIndex](adultCount === 2 ? 'Padre QA / Madre QA' : 'Padre QA')).toBe(
          true
        );
        const authorization = pages[profileIndex + 3];
        expect(authorization('Firma del responsable - Padre')).toBe(true);
        expect(authorization('Firma del responsable - Madre')).toBe(adultCount === 2);
      }
    }
  );

  it('identifies missing attachments without marking the packet as a draft', async () => {
    const incomplete = {
      ...family,
      adults: family.adults.slice(0, 1).map((a) => ({ ...a, dataTreatmentAcceptedAt: null })),
      children: [],
    };
    const pdf = await PDFDocument.load(
      await buildFamilyPdf({
        programTitle: 'Club QA',
        family: incomplete,
        loadAttachment: async () => null,
      })
    );
    const pages = await pageTexts(pdf);
    expect(pdf.getPageCount()).toBe(5);
    expect(pages[0]('Padre QA')).toBe(true);
    expect(pages[0]('BORRADOR - información pendiente')).toBe(false);
    expect(pages[1]('BORRADOR - información pendiente')).toBe(false);
    expect(pages[1]('Foto pendiente')).toBe(true);
    expect(pages[2]('ANEXO FALTANTE')).toBe(true);
    expect(pages[3]('ANEXO FALTANTE')).toBe(true);
  });

  it('identifies unreadable attachments so administrators can fix them', async () => {
    await expect(
      buildFamilyPdf({
        programTitle: 'Club QA',
        family,
        loadAttachment: async () => ({
          bytes: new Uint8Array([1, 2, 3]),
          contentType: 'image/heic',
        }),
      })
    ).rejects.toThrow('Menor QA - foto');
    await expect(
      buildFamilyPdf({
        programTitle: 'Club QA',
        family,
        loadAttachment: async (url) =>
          url === '/eps'
            ? { bytes: new TextEncoder().encode('%PDF-broken'), contentType: 'application/pdf' }
            : { bytes: png, contentType: 'image/png' },
      })
    ).rejects.toThrow('Menor QA - Certificado');
  });
});
