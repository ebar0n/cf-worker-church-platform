import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { classify } from './age-classification';

// Pre-filled authorization / health record PDF for program participants.
// The tutor downloads it, prints it and signs it: the signed printout is the
// physical confirmation of joining the program (specs/program-family-enrollment.md).

export interface PdfPerson {
  name: string;
  documentID: string;
  birthDate: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyContactRelation?: string | null;
  bloodType?: string | null;
  eps?: string | null;
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface PdfTutor {
  name: string;
  documentID: string;
  phone?: string | null;
  relationship?: string | null;
}

const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const PURPLE = rgb(0.29, 0.13, 0.5); // church primary #4b207f

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Padre',
  mother: 'Madre',
  guardian: 'Acudiente',
  tutor: 'Tutor / acudiente',
  representative: 'Representante',
};

class PdfWriter {
  y = PAGE_HEIGHT - MARGIN;
  private page: PDFPage;
  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  private space(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  // Wrap values as well as prose, including long words and explicit newlines.
  private lines(text: string, font: PDFFont, size: number, width: number): string[] {
    const result: string[] = [];
    for (const paragraph of text.normalize('NFC').split(/\r?\n/)) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
          continue;
        }
        if (line) result.push(line);
        line = '';
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) {
            result.push(line);
            line = '';
          }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }

  title(text: string) {
    for (const line of this.lines(text, this.bold, 15, PAGE_WIDTH - MARGIN * 2)) {
      this.space(22);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 15, font: this.bold, color: PURPLE });
      this.y -= 22;
    }
    this.y -= 4;
  }

  heading(text: string) {
    this.space(55);
    this.y -= 8;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 11, font: this.bold, color: PURPLE });
    this.y -= 17;
  }

  field(label: string, value: string | null | undefined) {
    const lines = this.lines(value || '—', this.font, 10, PAGE_WIDTH - MARGIN * 2 - 165);
    this.space(15 * Math.min(lines.length, 3));
    this.page.drawText(`${label}:`, { x: MARGIN, y: this.y, size: 10, font: this.bold });
    for (const line of lines) {
      this.space(15);
      this.page.drawText(line, { x: MARGIN + 165, y: this.y, size: 10, font: this.font });
      this.y -= 15;
    }
  }

  paragraph(text: string) {
    for (const line of this.lines(text, this.font, 9.5, PAGE_WIDTH - MARGIN * 2)) {
      this.space(13);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 9.5, font: this.font });
      this.y -= 13;
    }
    this.y -= 4;
  }

  keepTogether(height: number) {
    this.space(height);
  }

  signature(person: PdfTutor, label: string) {
    // Keep each signature and its identifying information on the same page.
    const nameLines = this.lines(person.name, this.font, 10, PAGE_WIDTH - MARGIN * 2 - 165);
    this.space(105 + nameLines.length * 15);
    this.y -= 38;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: MARGIN + 280, y: this.y },
      thickness: 0.7,
    });
    this.y -= 14;
    this.paragraph(label);
    this.field('Nombre', person.name);
    this.field('Documento', person.documentID);
    this.field('Fecha de firma', '____________________');
  }

  footer(documentID: string) {
    const pages = this.doc.getPages();
    pages.forEach((page, index) =>
      page.drawText(`Documento ${documentID} | Página ${index + 1} de ${pages.length}`, {
        x: MARGIN,
        y: 28,
        size: 8,
        font: this.font,
        color: rgb(0.4, 0.4, 0.4),
      })
    );
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().split('T')[0];
}

export async function buildProgramAuthorizationPdf(options: {
  programTitle: string;
  person: PdfPerson;
  tutor: PdfTutor | null; // legacy primary guardian
  tutors?: PdfTutor[]; // all enrolled guardians sign the child authorization
  isChild?: boolean;
}): Promise<Uint8Array> {
  const { programTitle, person, tutor } = options;
  const tutors = options.tutors ?? (tutor ? [tutor] : []);
  const isChild = options.isChild ?? tutors.length > 0;
  if (isChild && !tutors.length) throw new Error('El menor no tiene un responsable inscrito');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(doc, font, bold);

  const classification = person.birthDate ? classify(person.birthDate) : null;

  writer.title('Iglesia Adventista del Séptimo Día - El Jordán');
  writer.paragraph(
    isChild
      ? `${programTitle} — Autorización de participación del menor y hoja de vida`
      : `${programTitle} — Autorización de tratamiento de datos personales y hoja de vida`
  );

  writer.heading('Datos del participante');
  writer.field('Nombre completo', person.name);
  writer.field('Documento de identidad', person.documentID);
  writer.field('Fecha de nacimiento', formatDate(person.birthDate));
  if (!isChild) {
    writer.field('Teléfono', person.phone);
    writer.field('Correo electrónico', person.email);
  }
  if (classification) {
    writer.field(
      'Clasificación',
      classification.className
        ? `${classification.category} — ${classification.className}`
        : classification.category
    );
  }

  writer.heading('Información de salud');
  writer.field('Tipo de sangre', person.bloodType);
  writer.field('EPS', person.eps);
  writer.field('Alergias', person.allergies);
  writer.field('Enfermedades / condiciones', person.conditions);
  writer.field('Medicamentos', person.medications);
  writer.field(
    'Contacto de emergencia',
    person.emergencyContactName
      ? `${person.emergencyContactName} — ${person.emergencyContactPhone || ''}`
      : null
  );

  if (person.emergencyContactRelation)
    writer.field('Parentesco del contacto', person.emergencyContactRelation);

  if (isChild) {
    for (const tutor of tutors) {
      writer.heading('Datos del padre / madre / tutor responsable');
      writer.field('Nombre completo', tutor.name);
      writer.field('Documento de identidad', tutor.documentID);
      writer.field('Teléfono', tutor.phone);
      writer.field(
        'Parentesco',
        tutor.relationship ? RELATIONSHIP_LABELS[tutor.relationship] || tutor.relationship : null
      );
    }
    writer.heading('Autorización de participación del menor');
    writer.paragraph(
      `Quienes firmamos este documento, ${tutors.map((t) => `${t.name} (documento ${t.documentID})`).join(' y ')}, en calidad de responsables del menor ${person.name}, autorizamos su participación en las actividades del programa "${programTitle}" de la Iglesia Adventista del Séptimo Día El Jordán (Ibagué), incluyendo salidas y campamentos organizados por el programa.`
    );
    writer.paragraph(
      'Asimismo, en cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, autorizamos el tratamiento de los datos personales del menor aquí consignados, incluyendo datos de salud, con la finalidad exclusiva de la gestión del programa y la atención de emergencias durante sus actividades.'
    );
  } else {
    writer.heading('Autorización de tratamiento de datos personales');
    writer.paragraph(
      `Yo, ${person.name}, identificado(a) con documento ${person.documentID}, en cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, autorizo a la Iglesia Adventista del Séptimo Día El Jordán (Ibagué) el tratamiento de mis datos personales aquí consignados, incluyendo datos de salud, con la finalidad exclusiva de la gestión del programa "${programTitle}" y la atención de emergencias durante sus actividades. Igualmente confirmo mi participación en el programa.`
    );
  }

  writer.paragraph(
    'Este documento debe entregarse impreso y firmado a la directiva del programa como confirmación física de la inscripción.'
  );

  if (isChild) {
    writer.keepTogether(Math.min(tutors.length, 2) * 130 + 95);
    writer.heading('Firmas de los responsables');
    writer.paragraph(programTitle);
    writer.field('Participante', person.name);
    writer.field('Documento del menor', person.documentID);
    for (const guardian of tutors) {
      writer.signature(
        guardian,
        `Firma del responsable - ${RELATIONSHIP_LABELS[guardian.relationship || ''] || 'Responsable'}`
      );
    }
  } else {
    writer.signature(person, 'Firma del participante');
  }
  writer.footer(person.documentID);

  return doc.save();
}
