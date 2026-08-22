import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { classify } from './age-classification';

// Pre-filled authorization / health record PDF for program participants.
// The tutor downloads it, prints it and signs it: the signed printout is the
// physical confirmation of joining the program (specs/program-family-enrollment.md).

export interface PdfPerson {
  name: string;
  documentID: string;
  birthDate: string | null;
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
  representative: 'Representante',
};

class PdfWriter {
  y = PAGE_HEIGHT - MARGIN;
  constructor(
    private page: PDFPage,
    private font: PDFFont,
    private bold: PDFFont
  ) {}

  title(text: string) {
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 15,
      font: this.bold,
      color: PURPLE,
    });
    this.y -= 26;
  }

  heading(text: string) {
    this.y -= 8;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 11, font: this.bold, color: PURPLE });
    this.y -= 17;
  }

  field(label: string, value: string | null | undefined) {
    this.page.drawText(`${label}:`, { x: MARGIN, y: this.y, size: 10, font: this.bold });
    this.page.drawText(value || '—', { x: MARGIN + 165, y: this.y, size: 10, font: this.font });
    this.y -= 15;
  }

  paragraph(text: string) {
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.font.widthOfTextAtSize(candidate, 9.5) > maxWidth) {
        this.page.drawText(line, { x: MARGIN, y: this.y, size: 9.5, font: this.font });
        this.y -= 13;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 9.5, font: this.font });
      this.y -= 13;
    }
    this.y -= 4;
  }

  signatureLine(label: string) {
    this.y -= 34;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: MARGIN + 220, y: this.y },
      thickness: 0.7,
    });
    this.y -= 12;
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 9, font: this.font });
    this.y -= 10;
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
  tutor: PdfTutor | null; // null when the person is the responsible adult
}): Promise<Uint8Array> {
  const { programTitle, person, tutor } = options;
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(page, font, bold);

  const classification = person.birthDate ? classify(person.birthDate) : null;

  writer.title('Iglesia Adventista del Séptimo Día - El Jordán');
  writer.paragraph(
    tutor
      ? `${programTitle} — Autorización de participación del menor y hoja de vida`
      : `${programTitle} — Autorización de tratamiento de datos personales y hoja de vida`
  );

  writer.heading('Datos del participante');
  writer.field('Nombre completo', person.name);
  writer.field('Documento de identidad', person.documentID);
  writer.field('Fecha de nacimiento', formatDate(person.birthDate));
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

  if (tutor) {
    writer.heading('Datos del padre / tutor responsable');
    writer.field('Nombre completo', tutor.name);
    writer.field('Documento de identidad', tutor.documentID);
    writer.field('Teléfono', tutor.phone);
    writer.field(
      'Parentesco',
      tutor.relationship ? RELATIONSHIP_LABELS[tutor.relationship] || tutor.relationship : null
    );

    writer.heading('Autorización de participación del menor');
    writer.paragraph(
      `Yo, ${tutor.name}, identificado(a) con documento ${tutor.documentID}, en calidad de responsable del menor ${person.name}, autorizo su participación en las actividades del programa "${programTitle}" de la Iglesia Adventista del Séptimo Día El Jordán (Ibagué), incluyendo salidas y campamentos organizados por el programa.`
    );
    writer.paragraph(
      'Asimismo, en cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, autorizo el tratamiento de los datos personales del menor aquí consignados, incluyendo datos de salud, con la finalidad exclusiva de la gestión del programa y la atención de emergencias durante sus actividades.'
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

  writer.signatureLine(tutor ? 'Firma del padre / tutor responsable' : 'Firma del participante');
  writer.field('Documento', tutor ? tutor.documentID : person.documentID);
  writer.field('Fecha', '');

  return doc.save();
}
