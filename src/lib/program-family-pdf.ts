import { PDFDocument, StandardFonts, degrees, type PDFImage } from 'pdf-lib';
import {
  PdfWriter,
  PRINT_PAGE,
  buildProgramAuthorizationPdf,
  documentTypeByAge,
} from './program-pdf';
import { type FamilyPerson, type ProgramFamily } from './program-family';
import { classify } from './age-classification';

export class FamilyPdfError extends Error {}
export interface FamilyAttachment {
  bytes: Uint8Array;
  contentType: string;
}
// 'photo' is a profile picture (may be cropped around the face); 'document'
// attachments must keep their full content.
export type AttachmentKind = 'photo' | 'document';
type LoadAttachment = (
  url: string,
  label: string,
  kind: AttachmentKind
) => Promise<FamilyAttachment | null>;
const CONTENT_WIDTH = PRINT_PAGE.width - PRINT_PAGE.left - PRINT_PAGE.right;
// pdf-lib embeds JPEG bytes as-is but decodes and re-deflates PNG pixels in JS,
// which can exceed the Worker CPU limit. Larger PNGs must be re-uploaded (the
// form converts them to JPEG).
const MAX_PNG_PIXELS = 2_000_000;

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8;
const isPng = (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50;
// Width and height live in the IHDR chunk, right after the 8-byte signature.
const pngPixels = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return bytes.byteLength < 24 ? 0 : view.getUint32(16) * view.getUint32(20);
};
const roles: Record<string, string> = {
  father: 'Padre',
  mother: 'Madre',
  tutor: 'Tutor / acudiente',
};

function ageAndClass(person: FamilyPerson): string {
  const role = person.memberId ? roles[person.relationship || ''] || 'Responsable' : null;
  if (!person.birthDate) return role || 'Edad y clasificación pendientes';
  try {
    const { age, category, className } = classify(person.birthDate);
    if (age < 0) return 'Fecha de nacimiento por corregir';
    return `${age} ${age === 1 ? 'año' : 'años'} - ${role || category}${!role && className ? ` - ${className}` : ''}`;
  } catch {
    return 'Fecha de nacimiento por corregir';
  }
}

// No remote URL fetches: the caller supplies a loader restricted to our private R2 prefix.
export async function buildFamilyPdf(options: {
  programTitle: string;
  family: ProgramFamily;
  loadAttachment: LoadAttachment;
  treeIllustration?: Uint8Array;
}): Promise<Uint8Array> {
  const { programTitle, family, loadAttachment } = options;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const writer = (layout: 'standard' | 'profile' = 'standard') =>
    new PdfWriter(doc, font, bold, layout);
  const people = [...family.children, ...family.adults];
  const photos = new Map<FamilyPerson, PDFImage | null>();
  const load = async (
    url: string | null | undefined,
    label: string,
    kind: AttachmentKind = 'document'
  ) => (url ? loadAttachment(url, label, kind) : null);
  const embedImage = async (file: FamilyAttachment, label: string) => {
    try {
      if (isJpeg(file.bytes)) return await doc.embedJpg(file.bytes);
      if (isPng(file.bytes) && pngPixels(file.bytes) <= MAX_PNG_PIXELS)
        return await doc.embedPng(file.bytes);
    } catch {
      throw new FamilyPdfError(`${label}: la imagen está dañada. Vuelve a cargarla.`);
    }
    if (isPng(file.bytes))
      throw new FamilyPdfError(
        `${label}: la imagen PNG es demasiado grande para la carpeta. Vuelve a cargarla desde el formulario (se convertirá a JPG) o conviértela a JPG.`
      );
    throw new FamilyPdfError(
      `${label}: convierte la imagen a JPG o PNG y vuelve a cargarla para incluirla en la carpeta.`
    );
  };
  const emergency =
    family.adults.find((adult) => adult.emergencyContactName && adult.emergencyContactPhone) ??
    family.adults.find((adult) => adult.emergencyContactName || adult.emergencyContactPhone);

  const appendProfile = async (person: FamilyPerson) => {
    const label = `${person.name} - foto`;
    const photo = await load(person.photoUrl, label, 'photo');
    const image = photo ? await embedImage(photo, label) : null;
    photos.set(person, image);
    const sheet = writer('profile');
    sheet.photo(image);
    sheet.heading(person.memberId ? 'Datos del responsable' : 'Datos del niño / niña');
    sheet.field('Nombre completo', person.name);
    sheet.field(documentTypeByAge(person.birthDate), person.documentID);
    sheet.field('Fecha de nacimiento', person.birthDate?.slice(0, 10));
    sheet.field(
      'Género',
      person.gender === 'F' ? 'Femenino' : person.gender === 'M' ? 'Masculino' : null
    );
    sheet.field(person.memberId ? 'Edad / rol' : 'Edad / clasificación', ageAndClass(person));
    if (person.memberId) {
      sheet.field('Parentesco', roles[person.relationship || ''] || 'Responsable');
      sheet.field('Teléfono', person.phone);
      sheet.field('Correo electrónico', person.email);
    } else {
      // Older enrollments may only link one parent to a sibling. The packet
      // includes every responsible already registered in this family group.
      sheet.field('Responsables', family.adults.map((a) => a.name).join(' / '));
    }
    sheet.heading('Información de salud');
    sheet.field('Tipo de sangre', person.bloodType);
    sheet.field('EPS', person.eps);
    sheet.field('Alergias', person.allergies || 'No informado');
    sheet.field('Enfermedades / condiciones', person.conditions || 'No informado');
    sheet.field('Medicamentos', person.medications || 'No informado');
  };

  const appendAttachment = async (
    person: FamilyPerson,
    field: 'epsCertificateUrl' | 'idDocumentUrl',
    title: string
  ) => {
    const label = `${person.name} - ${title}`;
    const file = await load(person[field], label);
    const heading = () => {
      const page = writer();
      page.title(title);
      page.subtitle(person.name);
      return page;
    };
    if (!file) {
      const page = heading();
      page.heading('ANEXO FALTANTE');
      page.paragraph('Este documento no se ha cargado o no está disponible.');
      return;
    }
    if (new TextDecoder().decode(file.bytes.slice(0, 5)) === '%PDF-') {
      let source: PDFDocument;
      try {
        source = await PDFDocument.load(file.bytes);
        if (source.getForm().getFields().length) source.getForm().flatten();
      } catch {
        throw new FamilyPdfError(
          `${label}: no se puede abrir el PDF. Revisa que no esté dañado o protegido con contraseña.`
        );
      }
      if (source.getPageCount() === 0 || source.getPageCount() > 100)
        throw new FamilyPdfError(`${label}: el PDF debe tener entre 1 y 100 páginas.`);
      for (const sourcePage of source.getPages()) {
        const sheet = heading();
        const page = doc.getPage(doc.getPageCount() - 1);
        const embedded = await doc.embedPage(sourcePage);
        const rotation = ((sourcePage.getRotation().angle % 360) + 360) % 360;
        const radians = (-rotation * Math.PI) / 180;
        const { width, height } = sourcePage.getSize();
        const corners = [
          [0, 0],
          [width, 0],
          [0, height],
          [width, height],
        ].map(([x, y]) => [
          x * Math.cos(radians) - y * Math.sin(radians),
          x * Math.sin(radians) + y * Math.cos(radians),
        ]);
        const minX = Math.min(...corners.map(([x]) => x));
        const minY = Math.min(...corners.map(([, y]) => y));
        const displayWidth = Math.max(...corners.map(([x]) => x)) - minX;
        const displayHeight = Math.max(...corners.map(([, y]) => y)) - minY;
        const availableHeight = sheet.y - PRINT_PAGE.bottom;
        const scale = Math.min(CONTENT_WIDTH / displayWidth, availableHeight / displayHeight);
        page.drawPage(embedded, {
          x: PRINT_PAGE.left + (CONTENT_WIDTH - displayWidth * scale) / 2 - minX * scale,
          y: PRINT_PAGE.bottom + (availableHeight - displayHeight * scale) / 2 - minY * scale,
          xScale: scale,
          yScale: scale,
          rotate: degrees(-rotation),
        });
      }
    } else {
      const image = await embedImage(file, label);
      const sheet = heading();
      const page = doc.getPage(doc.getPageCount() - 1);
      const size = image.scaleToFit(CONTENT_WIDTH, sheet.y - PRINT_PAGE.bottom);
      page.drawImage(image, {
        x: PRINT_PAGE.left + (CONTENT_WIDTH - size.width) / 2,
        y: PRINT_PAGE.bottom + (sheet.y - PRINT_PAGE.bottom - size.height) / 2,
        ...size,
      });
    }
    if (doc.getPageCount() > 200)
      throw new FamilyPdfError(
        'La carpeta supera 200 páginas. Reduce los anexos antes de descargar.'
      );
  };
  for (const person of people) {
    await appendProfile(person);
    await appendAttachment(person, 'epsCertificateUrl', 'Certificado de afiliación a la EPS');
    await appendAttachment(person, 'idDocumentUrl', 'Documento de identidad');
    const isChild = !person.memberId;
    const tutors = isChild ? family.adults : [];
    if (isChild && !tutors.length)
      throw new FamilyPdfError(
        `${person.name}: falta vincular un padre o tutor para la autorización.`
      );
    const bytes = await buildProgramAuthorizationPdf({
      programTitle,
      person,
      tutors,
      tutor: tutors[0] || null,
      isChild,
      familyPacket: true,
    });
    const source = await PDFDocument.load(bytes);
    for (const page of await doc.copyPages(source, source.getPageIndices())) doc.addPage(page);
  }

  const bodyPageCount = doc.getPageCount();
  const cover = writer();
  cover.y -= 24;
  cover.title('Grupo familiar', 28);
  cover.y -= 40;
  cover.familyTree(
    family.adults.map((person) => ({
      name: person.name,
      detail: ageAndClass(person),
      photo: photos.get(person),
    })),
    family.children.map((person) => ({
      name: person.name,
      detail: ageAndClass(person),
      photo: photos.get(person),
    })),
    options.treeIllustration
      ? isJpeg(options.treeIllustration)
        ? await doc.embedJpg(options.treeIllustration)
        : await doc.embedPng(options.treeIllustration)
      : undefined
  );
  cover.y -= 30;
  cover.familyContacts(family.adults, {
    name: emergency?.emergencyContactName,
    phone: emergency?.emergencyContactPhone,
    relation: emergency?.emergencyContactRelation,
  });
  // Move the cover and any overflow pages to the front without copying resources.
  const covers = doc.getPages().slice(bodyPageCount);
  for (let index = doc.getPageCount() - 1; index >= bodyPageCount; index--) doc.removePage(index);
  covers.forEach((page, index) => doc.insertPage(index, page));
  if (doc.getPageCount() > 200)
    throw new FamilyPdfError(
      'La carpeta supera 200 páginas. Reduce los anexos antes de descargar.'
    );
  const responsibleNames = family.adults
    .map((adult) => adult.name.trim())
    .filter(Boolean)
    .join(' / ');
  cover.numberFamilyPages(`Familia ${responsibleNames}`.trim());
  doc.setTitle(`Carpeta familiar - ${family.adults.map((adult) => adult.name).join(' / ')}`);
  return doc.save();
}
