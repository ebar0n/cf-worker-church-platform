import {
  PDFDocument,
  StandardFonts,
  rgb,
  beginText,
  endText,
  setWordSpacing,
  pushGraphicsState,
  popGraphicsState,
  drawEllipsePath,
  clip,
  endPath,
  type PDFImage,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

// Pre-filled authorization PDFs. Health records are kept in a separate format.
// Administration prints the family packet for the responsible adults to sign.

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
  birthDate?: string | null;
  name: string;
  documentID: string;
  phone?: string | null;
  relationship?: string | null;
}

interface FamilyTreeNode {
  name: string;
  detail: string;
  photo?: PDFImage | null;
}

// US Letter, with a wider left margin for the shared physical binder.
export const PRINT_PAGE = {
  width: 612,
  height: 792,
  left: 72,
  right: 54,
  top: 54,
  bottom: 54,
} as const;
const PAGE_WIDTH = PRINT_PAGE.width;
const PAGE_HEIGHT = PRINT_PAGE.height;
const CONTENT_WIDTH = PAGE_WIDTH - PRINT_PAGE.left - PRINT_PAGE.right;
const BLACK = rgb(0, 0, 0);

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Padre',
  mother: 'Madre',
  guardian: 'Acudiente',
  tutor: 'Tutor / acudiente',
  representative: 'Representante',
};

export function documentTypeByAge(
  birthDate: string | null | undefined,
  fallback = 'Documento de identidad'
): string {
  if (!birthDate) return fallback;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return fallback;
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const current = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  let age = current('year') - birth.getUTCFullYear();
  if (
    current('month') < birth.getUTCMonth() + 1 ||
    (current('month') === birth.getUTCMonth() + 1 && current('day') < birth.getUTCDate())
  )
    age--;
  if (age < 0) return 'Documento de identidad';
  return age < 7 ? 'RC' : age < 18 ? 'TI' : 'CC';
}

export class PdfWriter {
  y = PAGE_HEIGHT - PRINT_PAGE.top;
  private page: PDFPage;
  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
    private layout: 'standard' | 'profile' = 'standard'
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  private space(height: number) {
    if (this.y - height < PRINT_PAGE.bottom) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - PRINT_PAGE.top;
    }
  }

  // Wrap values as well as prose, including long words and explicit newlines.
  private lines(text: string, font: PDFFont, size: number, width: number): string[] {
    // Standard PDF fonts use WinAnsi. Decorative emoji in program titles must
    // not make every authorization fail. Keep Spanish accents and punctuation;
    // show a placeholder for other unsupported letters instead of dropping them.
    const supported = new Set(font.getCharacterSet());
    const printable = Array.from(
      text
        .normalize('NFC')
        .replace(/\p{Extended_Pictographic}|[\u200B-\u200D\uFE0E\uFE0F\uFEFF]/gu, '')
        .replace(/[\u2010-\u2011]/g, '-')
    )
      .map((char) => (/\s/.test(char) || supported.has(char.codePointAt(0)!) ? char : '?'))
      .join('');
    const result: string[] = [];
    for (const paragraph of printable.trim().split(/\r?\n/)) {
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

  private centeredText(text: string, font: PDFFont, size: number) {
    this.page.drawText(text, {
      x: PRINT_PAGE.left + (CONTENT_WIDTH - font.widthOfTextAtSize(text, size)) / 2,
      y: this.y,
      size,
      font,
      color: BLACK,
    });
  }

  title(text: string, size = 14) {
    const lineHeight = size + 8;
    for (const line of this.lines(text, this.bold, size, CONTENT_WIDTH)) {
      this.space(lineHeight);
      this.centeredText(line, this.bold, size);
      this.y -= lineHeight;
    }
    this.y -= 4;
  }

  subtitle(text: string) {
    for (const line of this.lines(text, this.font, 11, CONTENT_WIDTH)) {
      this.space(16);
      this.centeredText(line, this.font, 11);
      this.y -= 16;
    }
    this.y -= 12;
  }

  familyTree(adults: FamilyTreeNode[], children: FamilyTreeNode[], illustration?: PDFImage) {
    const labelsFit = (nodes: FamilyTreeNode[], columns: number, maxNames: number) =>
      nodes.every((node) => {
        const width = CONTENT_WIDTH / Math.max(1, Math.min(nodes.length, columns)) - 14;
        return (
          this.lines(node.name, this.bold, 13, width).length <= maxNames &&
          this.lines(node.detail, this.font, 10, width).length <= 3
        );
      });
    if (
      illustration &&
      adults.length <= 3 &&
      children.length <= 6 &&
      labelsFit(adults, 3, 3) &&
      labelsFit(children, 3, 2)
    ) {
      this.illustratedFamilyTree(adults, children, illustration);
      return;
    }
    const treeLeft = PRINT_PAGE.left + 12;
    const treeWidth = CONTENT_WIDTH - 12;
    const gap = 24;
    const rows: Array<{
      page: PDFPage;
      centers: number[];
      top: number;
      bottom: number;
      adult: boolean;
    }> = [];
    const drawGroup = (nodes: FamilyTreeNode[], columns: number, adult: boolean) => {
      const count = Math.min(columns, nodes.length);
      if (!count) return;
      const width = Math.min(280, (treeWidth - gap * (count - 1)) / count);
      for (let start = 0; start < nodes.length; start += count) {
        const cards = nodes.slice(start, start + count).map((node) => ({
          names: this.lines(node.name, this.bold, 14, width - 24),
          details: this.lines(node.detail, this.font, 11, width - 24),
        }));
        const height = Math.max(
          78,
          ...cards.map((card) => card.names.length * 18 + card.details.length * 14 + 34)
        );
        this.space(height + 24);
        const top = this.y;
        const left = treeLeft + (treeWidth - cards.length * width - (cards.length - 1) * gap) / 2;
        const centers: number[] = [];
        cards.forEach((card, index) => {
          const x = left + index * (width + gap);
          const center = x + width / 2;
          centers.push(center);
          this.page.drawRectangle({
            x,
            y: top - height,
            width,
            height,
            borderColor: BLACK,
            borderWidth: 0.5,
          });
          let y = top - 23;
          for (const line of card.names) {
            this.page.drawText(line, {
              x: center - this.bold.widthOfTextAtSize(line, 14) / 2,
              y,
              font: this.bold,
              size: 14,
              color: BLACK,
            });
            y -= 18;
          }
          y -= 7;
          for (const line of card.details) {
            this.page.drawText(line, {
              x: center - this.font.widthOfTextAtSize(line, 11) / 2,
              y,
              font: this.font,
              size: 11,
              color: BLACK,
            });
            y -= 14;
          }
        });
        rows.push({ page: this.page, centers, top, bottom: top - height, adult });
        this.y = top - height - 48;
      }
    };
    drawGroup(adults, 2, true);
    drawGroup(children, 3, false);
    if (!adults.length || !children.length) return;
    // A shared family branch, not a claim of biological parentage. For larger
    // groups the branch runs beside the cards; never through their text.
    for (const page of new Set(rows.map((row) => row.page))) {
      const pageRows = rows.filter((row) => row.page === page);
      const trunk = rows.length === 2 ? treeLeft + treeWidth / 2 : PRINT_PAGE.left;
      const branchYs: number[] = [];
      for (const row of pageRows) {
        const edge = row.adult ? row.bottom : row.top;
        const branchY = edge + (row.adult ? -20 : 20);
        branchYs.push(branchY);
        const line = (x1: number, y1: number, x2: number, y2: number) =>
          page.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            color: BLACK,
            thickness: 0.6,
          });
        for (const x of row.centers) line(x, edge, x, branchY);
        line(Math.min(trunk, ...row.centers), branchY, Math.max(trunk, ...row.centers), branchY);
      }
      page.drawLine({
        start: { x: trunk, y: Math.min(...branchYs) },
        end: { x: trunk, y: Math.max(...branchYs) },
        color: BLACK,
        thickness: 0.6,
      });
    }
  }

  private illustratedFamilyTree(
    adults: FamilyTreeNode[],
    children: FamilyTreeNode[],
    illustration: PDFImage
  ) {
    const green = rgb(0.23, 0.34, 0.22);
    const center = PRINT_PAGE.left + CONTENT_WIDTH / 2;
    const dense = children.length > 3 || adults.length > 2;
    // Print the illustration behind the content without panels behind names.
    const watermarkSize = 400;
    this.page.drawImage(illustration, {
      x: center - watermarkSize / 2,
      y: 290,
      width: watermarkSize,
      height: watermarkSize,
      opacity: 0.12,
    });
    this.y = 658;
    const row = (nodes: FamilyTreeNode[], radius: number) => {
      if (!nodes.length) return;
      const columnWidth = CONTENT_WIDTH / Math.max(nodes.length, 1);
      const textHeight = Math.max(
        ...nodes.map(
          (node) =>
            this.lines(node.name, this.bold, 13, columnWidth - 14).length * 16 +
            this.lines(node.detail, this.font, 10, columnWidth - 14).length * 13
        )
      );
      const height = radius * 2 + 23 + textHeight;
      this.space(height);
      const cy = this.y - radius - 3;
      nodes.forEach((node, index) => {
        const cx = PRINT_PAGE.left + columnWidth * (index + 0.5);
        this.page.drawCircle({
          x: cx,
          y: cy,
          size: radius + 3,
          color: rgb(1, 1, 1),
          borderColor: green,
          borderWidth: 1,
        });
        if (node.photo) {
          this.page.pushOperators(
            pushGraphicsState(),
            ...drawEllipsePath({ x: cx, y: cy, xScale: radius, yScale: radius }),
            clip(),
            endPath()
          );
          const scale = Math.max((radius * 2) / node.photo.width, (radius * 2) / node.photo.height);
          this.page.drawImage(node.photo, {
            x: cx - (node.photo.width * scale) / 2,
            y: cy - (node.photo.height * scale) / 2,
            width: node.photo.width * scale,
            height: node.photo.height * scale,
          });
          this.page.pushOperators(popGraphicsState());
        } else {
          const initials = this.lines(
            node.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0])
              .join('') || '?',
            this.bold,
            18,
            radius * 2
          )[0];
          this.page.drawText(initials, {
            x: cx - this.bold.widthOfTextAtSize(initials, 18) / 2,
            y: cy - 6,
            size: 18,
            font: this.bold,
            color: green,
          });
        }
        const names = this.lines(node.name, this.bold, 13, columnWidth - 14);
        const details = this.lines(node.detail, this.font, 10, columnWidth - 14);
        const top = cy - radius - 9;
        let y = top - 11;
        for (const line of names) {
          this.page.drawText(line, {
            x: cx - this.bold.widthOfTextAtSize(line, 13) / 2,
            y,
            size: 13,
            font: this.bold,
            color: green,
          });
          y -= 16;
        }
        for (const line of details) {
          this.page.drawText(line, {
            x: cx - this.font.widthOfTextAtSize(line, 10) / 2,
            y,
            size: 10,
            font: this.font,
            color: BLACK,
          });
          y -= 13;
        }
      });
      this.y -= height;
    };
    row(adults, dense ? 26 : 40);
    if (adults.length && children.length) {
      // Retain the breathing room between the two generations.
      const gap = dense ? 66 : 108;
      this.space(gap);
      this.y -= gap;
    } else {
      this.y -= 20;
    }
    for (let i = 0; i < children.length; i += 3) {
      row(children.slice(i, i + 3), dense ? 24 : 38);
      this.y -= dense ? 10 : 16;
    }
  }

  familyContacts(
    adults: Array<{ name: string; phone?: string | null }>,
    emergency: {
      name?: string | null;
      phone?: string | null;
      relation?: string | null;
    }
  ) {
    const green = rgb(0.23, 0.34, 0.22);
    const rule = rgb(0.8, 0.83, 0.79);
    const phoneWidth = 150;
    const nameWidth = CONTENT_WIDTH - phoneWidth - 20;
    const contactRow = (name: string, phone: string | null | undefined) => {
      const names = this.lines(name, this.font, 11, nameWidth);
      const phones = this.lines(`Teléfono: ${phone || 'No informado'}`, this.font, 11, phoneWidth);
      const height = Math.max(names.length, phones.length) * 15 + 7;
      this.space(height);
      for (const [index, line] of names.entries()) {
        this.page.drawText(line, {
          x: PRINT_PAGE.left,
          y: this.y - index * 15,
          size: 11,
          font: this.font,
          color: BLACK,
        });
      }
      for (const [index, line] of phones.entries()) {
        this.page.drawText(line, {
          x: PAGE_WIDTH - PRINT_PAGE.right - this.font.widthOfTextAtSize(line, 11),
          y: this.y - index * 15,
          size: 11,
          font: this.font,
          color: BLACK,
        });
      }
      this.y -= height;
    };
    const section = (title: string) => {
      this.space(58);
      this.page.drawLine({
        start: { x: PRINT_PAGE.left, y: this.y + 9 },
        end: { x: PAGE_WIDTH - PRINT_PAGE.right, y: this.y + 9 },
        thickness: 0.5,
        color: rule,
      });
      this.page.drawText(title, {
        x: PRINT_PAGE.left,
        y: this.y - 8,
        size: 10,
        font: this.bold,
        color: green,
      });
      this.y -= 28;
    };
    section('Contacto de responsables');
    for (const adult of adults) contactRow(adult.name, adult.phone);
    this.y -= 14;
    section('Contacto de emergencia');
    contactRow(emergency.name || 'Nombre no informado', emergency.phone);
    if (emergency.relation) {
      for (const line of this.lines(emergency.relation, this.font, 10, CONTENT_WIDTH)) {
        this.space(14);
        this.page.drawText(line, {
          x: PRINT_PAGE.left,
          y: this.y + 5,
          size: 10,
          font: this.font,
          color: green,
        });
        this.y -= 14;
      }
    }
  }

  heading(text: string) {
    const size = this.layout === 'profile' ? 14 : 12;
    const lineHeight = size + 6;
    this.space(55);
    this.y -= 8;
    for (const line of this.lines(text, this.bold, size, CONTENT_WIDTH)) {
      this.space(lineHeight);
      this.page.drawText(line, {
        x: PRINT_PAGE.left,
        y: this.y,
        size,
        font: this.bold,
        color: BLACK,
      });
      this.y -= lineHeight;
    }
    if (this.layout === 'profile') this.y -= 8;
  }

  field(label: string, value: string | null | undefined) {
    const isProfile = this.layout === 'profile';
    const size = isProfile ? 12 : 11;
    const lineHeight = isProfile ? 18 : 16;
    const valueOffset = isProfile ? 170 : 150;
    const labels = this.lines(`${label}:`, this.bold, size, valueOffset - 12);
    const values = this.lines(value || '—', this.font, size, CONTENT_WIDTH - valueOffset);
    const rowCount = Math.max(labels.length, values.length);
    this.space(lineHeight * Math.min(rowCount, 3) + (isProfile ? 8 : 0));
    for (let index = 0; index < rowCount; index++) {
      this.space(lineHeight);
      if (labels[index])
        this.page.drawText(labels[index], {
          x: PRINT_PAGE.left,
          y: this.y,
          size,
          font: this.bold,
          color: BLACK,
        });
      if (values[index])
        this.page.drawText(values[index], {
          x: PRINT_PAGE.left + valueOffset,
          y: this.y,
          size,
          font: this.font,
          color: BLACK,
        });
      this.y -= lineHeight;
    }
    if (isProfile) {
      this.page.drawLine({
        start: { x: PRINT_PAGE.left, y: this.y + 5 },
        end: { x: PAGE_WIDTH - PRINT_PAGE.right, y: this.y + 5 },
        color: BLACK,
        thickness: 0.25,
      });
      this.y -= 8;
    }
  }

  paragraph(text: string) {
    const width = CONTENT_WIDTH;
    // Justify prose, keeping each paragraph's final line left aligned.
    for (const paragraph of text.split(/\r?\n/)) {
      const lines = this.lines(paragraph, this.font, 12, width);
      lines.forEach((line, index) => {
        this.space(16);
        const spaces = (line.match(/ /g) || []).length;
        const extra =
          index < lines.length - 1 && spaces > 0
            ? (width - this.font.widthOfTextAtSize(line, 12)) / spaces
            : 0;
        this.page.pushOperators(beginText(), setWordSpacing(extra), endText());
        this.page.drawText(line, {
          x: PRINT_PAGE.left,
          y: this.y,
          size: 12,
          font: this.font,
          color: BLACK,
        });
        this.page.pushOperators(beginText(), setWordSpacing(0), endText());
        this.y -= 16;
      });
      this.y -= 8;
    }
  }

  photo(image: import('pdf-lib').PDFImage | null) {
    const x = PRINT_PAGE.left;
    const top = this.y;
    const width = 96;
    const height = 120;
    this.page.drawRectangle({
      x,
      y: top - height,
      width,
      height,
      borderColor: BLACK,
      borderWidth: 0.6,
    });
    if (image) {
      const scaled = image.scaleToFit(width - 8, height - 8);
      this.page.drawImage(image, {
        x: x + (width - scaled.width) / 2,
        y: top - height + (height - scaled.height) / 2,
        ...scaled,
      });
    } else {
      this.page.drawText('Foto pendiente', {
        x: x + 14,
        y: top - height / 2,
        size: 10,
        font: this.font,
        color: BLACK,
      });
    }
    const textLeft = x + width + 24;
    const textWidth = CONTENT_WIDTH - width - 24;
    const title = 'FICHA DEL PARTICIPANTE';
    const subtitle = 'Datos personales y de salud';
    this.page.drawText(title, {
      x: textLeft + (textWidth - this.bold.widthOfTextAtSize(title, 20)) / 2,
      y: top - 48,
      size: 20,
      font: this.bold,
      color: BLACK,
    });
    this.page.drawText(subtitle, {
      x: textLeft + (textWidth - this.font.widthOfTextAtSize(subtitle, 12)) / 2,
      y: top - 70,
      size: 12,
      font: this.font,
      color: BLACK,
    });
    this.y = top - height - 24;
  }

  keepTogether(height: number) {
    const previousPage = this.page;
    this.space(height);
    return previousPage !== this.page;
  }

  numberFamilyPages(familyLabel: string) {
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      const suffix = ` · ${index + 1} de ${pages.length}`;
      const labelLines = this.lines(
        familyLabel,
        this.font,
        9,
        CONTENT_WIDTH - this.font.widthOfTextAtSize(`${suffix}...`, 9)
      );
      const label = labelLines[0] + (labelLines.length > 1 ? '...' : '');
      const text = label + suffix;
      page.drawText(text, {
        x: PRINT_PAGE.left + (CONTENT_WIDTH - this.font.widthOfTextAtSize(text, 9)) / 2,
        y: 27,
        size: 9,
        font: this.font,
        color: BLACK,
      });
    });
  }

  signature(person: PdfTutor, label: string, blankHeight = 56) {
    // Keep each signature and its identifying information on the same page.
    const nameLines = this.lines(person.name, this.font, 11, CONTENT_WIDTH - 150);
    this.space(blankHeight + 70 + nameLines.length * 16);
    this.y -= blankHeight;
    this.page.drawLine({
      start: { x: PRINT_PAGE.left, y: this.y },
      end: { x: PRINT_PAGE.left + 280, y: this.y },
      color: BLACK,
      thickness: 0.7,
    });
    this.y -= 14;
    this.paragraph(label);
    this.field('Nombre', person.name);
    this.field(documentTypeByAge(person.birthDate, 'CC'), person.documentID);
    this.field('Fecha de firma', '____________________');
  }
}

export async function buildProgramAuthorizationPdf(options: {
  programTitle: string;
  person: PdfPerson;
  tutor: PdfTutor | null; // legacy primary guardian
  tutors?: PdfTutor[]; // all enrolled guardians sign the child authorization
  isChild?: boolean;
  familyPacket?: boolean; // omit repeated institutional headers in the shared binder
}): Promise<Uint8Array> {
  const { programTitle, person, tutor } = options;
  const tutors = options.tutors ?? (tutor ? [tutor] : []);
  const isChild = options.isChild ?? tutors.length > 0;
  const documentType = documentTypeByAge(
    person.birthDate,
    isChild ? 'Documento de identidad' : 'CC'
  );
  if (isChild && !tutors.length) throw new Error('El menor no tiene un responsable inscrito');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const writer = new PdfWriter(doc, font, bold);

  if (!options.familyPacket) {
    writer.title('Iglesia Adventista del Séptimo Día - El Jordán');
    writer.subtitle(programTitle);
  }
  writer.title(
    isChild
      ? 'Autorización de participación del menor'
      : 'Autorización de tratamiento de datos personales'
  );

  // Adult form: the established title gap plus one additional blank line.
  if (!isChild) writer.y -= 82;

  writer.heading(
    isChild ? 'Identificación del menor' : 'Identificación del padre / madre / responsable'
  );
  writer.field('Nombre completo', person.name);
  writer.field(documentType, person.documentID);
  if (isChild) {
    for (const tutor of tutors) {
      writer.heading('Datos del padre / madre / tutor responsable');
      writer.field('Nombre completo', tutor.name);
      writer.field(documentTypeByAge(tutor.birthDate, 'CC'), tutor.documentID);
      writer.field(
        'Parentesco',
        tutor.relationship ? RELATIONSHIP_LABELS[tutor.relationship] || tutor.relationship : null
      );
    }
    writer.y -= 28;
    writer.paragraph(
      tutors.length === 1
        ? `Yo, ${tutors[0].name}, identificado(a) con ${documentTypeByAge(tutors[0].birthDate, 'CC')} ${tutors[0].documentID}, en calidad de responsable del menor ${person.name}, autorizo su participación en las actividades del programa "${programTitle}" de la Iglesia Adventista del Séptimo Día El Jordán (Ibagué), incluyendo salidas y campamentos organizados por el programa.`
        : `Quienes firmamos este documento, ${tutors.map((t) => `${t.name} (${documentTypeByAge(t.birthDate, 'CC')} ${t.documentID})`).join(' y ')}, en calidad de responsables del menor ${person.name}, autorizamos su participación en las actividades del programa "${programTitle}" de la Iglesia Adventista del Séptimo Día El Jordán (Ibagué), incluyendo salidas y campamentos organizados por el programa.`
    );
  } else {
    writer.y -= 44;
    writer.paragraph(
      `Yo, ${person.name}, identificado(a) con ${documentType} ${person.documentID}, en cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, autorizo a la Iglesia Adventista del Séptimo Día El Jordán (Ibagué) el tratamiento de mis datos personales suministrados durante la inscripción, incluyendo datos de salud, con la finalidad exclusiva de la gestión del programa "${programTitle}" y la atención de emergencias durante sus actividades.`
    );
  }

  if (isChild) {
    const visibleSignatures = Math.min(tutors.length, 2);
    const signaturePage = writer.keepTogether(visibleSignatures * 142 + 26 + 12);
    if (signaturePage) {
      if (!options.familyPacket) writer.paragraph(programTitle);
      writer.field('Participante', person.name);
      writer.field(documentType, person.documentID);
    }
    // Keep a natural flow after the paragraph, reserving room for handwriting.
    writer.y -= 12;
    writer.heading(tutors.length === 1 ? 'Firma del responsable' : 'Firmas de los responsables');
    for (const guardian of tutors) {
      writer.signature(
        guardian,
        `Firma del responsable - ${RELATIONSHIP_LABELS[guardian.relationship || ''] || 'Responsable'}`
      );
    }
  } else {
    writer.keepTogether(162);
    writer.y -= 20;
    writer.signature(person, 'Firma del padre / madre / responsable');
  }

  return doc.save();
}
