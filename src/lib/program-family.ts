// Shared by the administrative screen and the printable family packet.
export interface FamilyPerson {
  memberId?: number;
  childId?: number;
  guardianMemberIds?: number[];
  name: string;
  documentID: string;
  birthDate: string | null;
  gender?: string | null;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  bloodType?: string | null;
  eps?: string | null;
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  photoUrl?: string | null;
  idDocumentUrl?: string | null;
  epsCertificateUrl?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  dataTreatmentAcceptedAt?: string | null;
  participationConfirmedAt?: string | null;
}

export interface ProgramFamily {
  id: string;
  adults: FamilyPerson[];
  children: FamilyPerson[];
}

export function familyPdfFilename(family: Pick<ProgramFamily, 'adults'>): string {
  const names = family.adults
    .map((adult) => adult.name)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 180)
    .replace(/^-+|-+$/g, '');
  return names ? `familia-${names}.pdf` : 'familia.pdf';
}

export function familyPendingItems(family: ProgramFamily): string[] {
  const pending: string[] = [];
  for (const [people, isAdult] of [
    [family.children, false],
    [family.adults, true],
  ] as const) {
    for (const person of people) {
      const missing: string[] = [];
      if (!person.name?.trim()) missing.push('nombre');
      if (!person.documentID?.trim()) missing.push('documento');
      if (!person.birthDate) missing.push('fecha de nacimiento');
      if (!person.gender && person.relationship !== 'tutor') missing.push('género');
      if (isAdult && !person.phone) missing.push('teléfono');
      if (!person.bloodType) missing.push('tipo de sangre');
      if (!person.eps) missing.push('EPS');
      if (!person.photoUrl) missing.push('foto');
      if (!person.epsCertificateUrl) missing.push('certificado EPS');
      if (!person.idDocumentUrl) missing.push('documento de identidad adjunto');
      if (isAdult && (!person.dataTreatmentAcceptedAt || !person.participationConfirmedAt)) {
        missing.push('aceptación de políticas y confirmación de inscripción');
      }
      if (missing.length)
        pending.push(`${person.name || person.documentID}: ${missing.join(', ')}.`);
    }
  }
  if (
    !family.adults.some((person) => person.emergencyContactName && person.emergencyContactPhone)
  ) {
    pending.push('Familia: contacto de emergencia.');
  }
  return pending;
}
