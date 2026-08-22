import { z } from 'zod';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  validateUploadFile,
  uploadFileToR2,
} from './uploads';

// Shared helpers for family enrollment (specs/program-family-enrollment.md)

export const healthFieldsSchema = z.object({
  bloodType: z.string().min(1),
  eps: z.string().min(1),
  allergies: z.string().optional().default(''),
  conditions: z.string().optional().default(''),
  medications: z.string().optional().default(''),
});

export type HealthFields = z.infer<typeof healthFieldsSchema>;

// Emergency contact is a family-group attribute, collected once from the
// responsible adult and shared across the whole núcleo.
export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(5),
  emergencyContactRelation: z.string().optional().default(''),
});

export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export function formString(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function parseHealthFields(
  form: FormData
): { success: true; data: HealthFields } | { success: false; error: string } {
  const parse = healthFieldsSchema.safeParse({
    bloodType: formString(form, 'bloodType'),
    eps: formString(form, 'eps'),
    allergies: formString(form, 'allergies'),
    conditions: formString(form, 'conditions'),
    medications: formString(form, 'medications'),
  });
  if (!parse.success) {
    const fields = parse.error.issues.map((e) => e.path.join('.')).join(', ');
    return { success: false, error: `Datos de salud incompletos o inválidos: ${fields}` };
  }
  return { success: true, data: parse.data };
}

export function parseEmergencyContact(
  form: FormData
): { success: true; data: EmergencyContact } | { success: false; error: string } {
  const parse = emergencyContactSchema.safeParse({
    emergencyContactName: formString(form, 'emergencyContactName'),
    emergencyContactPhone: formString(form, 'emergencyContactPhone'),
    emergencyContactRelation: formString(form, 'emergencyContactRelation'),
  });
  if (!parse.success) {
    return { success: false, error: 'Contacto de emergencia del núcleo incompleto' };
  }
  return { success: true, data: parse.data };
}

// The núcleo emergency contact is denormalized onto every adult of the group.
// Propagate a change from one adult to all adults who share a child with them.
export async function propagateEmergencyContact(
  db: D1Database,
  programId: number,
  fromMemberId: number,
  contact: EmergencyContact
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE ProgramAdultEnrollment
       SET emergencyContactName = ?, emergencyContactPhone = ?,
           emergencyContactRelation = ?, updatedAt = ?
       WHERE programId = ?
         AND memberId IN (
           SELECT DISTINCT cg2.memberId
           FROM ChildGuardian cg1
           JOIN ChildGuardian cg2 ON cg2.childId = cg1.childId
           WHERE cg1.memberId = ?
           UNION SELECT ?
         )`
    )
    .bind(
      contact.emergencyContactName,
      contact.emergencyContactPhone,
      contact.emergencyContactRelation,
      now,
      programId,
      fromMemberId,
      fromMemberId
    )
    .run();
}

// Uploads photo/idDocument if present; returns admin-route URLs.
// the enrollments/ prefix is not public, so these files are only reachable through
// the Access-protected admin files route.
export async function uploadEnrollmentFiles(
  bucket: R2Bucket,
  form: FormData
): Promise<
  { success: true; photoUrl?: string; idDocumentUrl?: string } | { success: false; error: string }
> {
  const result: { photoUrl?: string; idDocumentUrl?: string } = {};

  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const validation = validateUploadFile(photo, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) return { success: false, error: `Foto: ${validation.error}` };
    result.photoUrl = `/api/admin/files/${await uploadFileToR2(bucket, photo, 'enrollments')}`;
  }

  const idDocument = form.get('idDocument');
  if (idDocument instanceof File && idDocument.size > 0) {
    const validation = validateUploadFile(idDocument, ALLOWED_DOCUMENT_TYPES);
    if (!validation.valid) return { success: false, error: `Documento: ${validation.error}` };
    result.idDocumentUrl = `/api/admin/files/${await uploadFileToR2(bucket, idDocument, 'enrollments')}`;
  }

  return { success: true, ...result };
}

// Insert-or-update the health record for a child XOR member
export async function upsertHealthProfile(
  db: D1Database,
  ref: { childId?: number; memberId?: number },
  fields: HealthFields,
  files: { photoUrl?: string; idDocumentUrl?: string }
): Promise<void> {
  const refColumn = ref.childId ? 'childId' : 'memberId';
  const refValue = ref.childId ?? ref.memberId;
  const now = new Date().toISOString();

  const existing = await db
    .prepare(`SELECT id FROM HealthProfile WHERE ${refColumn} = ?`)
    .bind(refValue)
    .first();

  if (existing) {
    const fileUpdates =
      (files.photoUrl ? ', photoUrl = ?' : '') + (files.idDocumentUrl ? ', idDocumentUrl = ?' : '');
    const bindings: unknown[] = [
      fields.bloodType,
      fields.eps,
      fields.allergies,
      fields.conditions,
      fields.medications,
      now,
    ];
    if (files.photoUrl) bindings.push(files.photoUrl);
    if (files.idDocumentUrl) bindings.push(files.idDocumentUrl);
    bindings.push(existing.id);

    await db
      .prepare(
        `UPDATE HealthProfile SET bloodType = ?, eps = ?, allergies = ?, conditions = ?,
         medications = ?, updatedAt = ?${fileUpdates} WHERE id = ?`
      )
      .bind(...bindings)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO HealthProfile (${refColumn}, bloodType, eps, allergies, conditions,
       medications, photoUrl, idDocumentUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      refValue,
      fields.bloodType,
      fields.eps,
      fields.allergies,
      fields.conditions,
      fields.medications,
      files.photoUrl || null,
      files.idDocumentUrl || null,
      now,
      now
    )
    .run();
}

export async function getOrCreateMember(
  db: D1Database,
  data: {
    documentID: string;
    name: string;
    phone: string;
    birthDate?: string;
    email?: string;
    gender?: string;
  }
): Promise<{ id: number; birthDate: string | null }> {
  const existing = await db
    .prepare('SELECT id, birthDate FROM Member WHERE documentID = ?')
    .bind(data.documentID)
    .first<{ id: number; birthDate: string | null }>();

  const now = new Date().toISOString();
  if (existing) return existing;

  const result = await db
    .prepare(
      `INSERT INTO Member (documentID, name, phone, birthDate, email, gender, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      data.documentID,
      data.name,
      data.phone,
      data.birthDate || null,
      data.email || null,
      data.gender || null,
      now,
      now
    )
    .run();
  return { id: result.meta.last_row_id as number, birthDate: data.birthDate || null };
}

export async function getOrCreateChild(
  db: D1Database,
  data: { documentID: string; name: string; gender?: string; birthDate: string }
): Promise<number> {
  const existing = await db
    .prepare('SELECT id FROM Child WHERE documentID = ?')
    .bind(data.documentID)
    .first<{ id: number }>();

  const now = new Date().toISOString();
  if (existing) {
    await db
      .prepare('UPDATE Child SET name = ?, gender = ?, birthDate = ?, updatedAt = ? WHERE id = ?')
      .bind(data.name, data.gender || null, data.birthDate, now, existing.id)
      .run();
    return existing.id;
  }

  const result = await db
    .prepare(
      `INSERT INTO Child (name, documentID, gender, birthDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(data.name, data.documentID, data.gender || null, data.birthDate, now, now)
    .run();
  return result.meta.last_row_id as number;
}

export const GUARDIAN_RELATIONSHIPS = ['father', 'mother', 'tutor'];

export interface EnrollmentPdfData {
  programTitle: string;
  person: {
    name: string;
    documentID: string;
    birthDate: string | null;
    bloodType: string | null;
    eps: string | null;
    allergies: string | null;
    conditions: string | null;
    medications: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  };
  tutor: {
    name: string;
    documentID: string;
    phone: string | null;
    relationship: string | null;
  } | null;
}

// Resolves the data for the authorization PDF: the person can be an enrolled
// child (tutor attached) or an enrolled adult (tutor null).
export async function getEnrollmentPdfData(
  db: D1Database,
  programId: number,
  documentID: string
): Promise<EnrollmentPdfData | null> {
  const program = await db
    .prepare('SELECT title FROM Program WHERE id = ?')
    .bind(programId)
    .first<{ title: string }>();
  if (!program) return null;

  const child = await db
    .prepare(
      `SELECT c.name, c.documentID, c.birthDate,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              e.enrolledByMemberId
       FROM Child c
       JOIN Enrollment e ON e.childId = c.id AND e.programId = ?
       LEFT JOIN HealthProfile hp ON hp.childId = c.id
       WHERE c.documentID = ?`
    )
    .bind(programId, documentID)
    .first<any>();

  if (child) {
    const tutor = await db
      .prepare(
        `SELECT m.name, m.documentID, m.phone, cg.relationship,
                pae.emergencyContactName, pae.emergencyContactPhone
         FROM Member m
         JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
         LEFT JOIN ChildGuardian cg
           ON cg.memberId = m.id
           AND cg.childId = (SELECT id FROM Child WHERE documentID = ?)
         WHERE m.id = COALESCE(
           ?,
           (SELECT cg2.memberId FROM ChildGuardian cg2
            JOIN Child c2 ON c2.id = cg2.childId
            WHERE c2.documentID = ? ORDER BY cg2.id LIMIT 1)
         )`
      )
      .bind(programId, documentID, child.enrolledByMemberId, documentID)
      .first<any>();

    return {
      programTitle: program.title,
      person: {
        ...child,
        emergencyContactName: tutor?.emergencyContactName ?? null,
        emergencyContactPhone: tutor?.emergencyContactPhone ?? null,
      },
      tutor: tutor || null,
    };
  }

  const adult = await db
    .prepare(
      `SELECT m.name, m.documentID, m.birthDate,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              pae.emergencyContactName, pae.emergencyContactPhone
       FROM Member m
       JOIN ProgramAdultEnrollment pae ON pae.memberId = m.id AND pae.programId = ?
       LEFT JOIN HealthProfile hp ON hp.memberId = m.id
       WHERE m.documentID = ?`
    )
    .bind(programId, documentID)
    .first<any>();

  if (!adult) return null;
  return { programTitle: program.title, person: adult, tutor: null };
}
