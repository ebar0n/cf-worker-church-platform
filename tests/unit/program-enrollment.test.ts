import { describe, it, expect, vi } from 'vitest';
import { GUARDIAN_RELATIONSHIPS, uploadEnrollmentFiles } from '@/lib/program-enrollment';

// The frontend derives the family relationship from gender + a tutor flag.
// This mirrors relationshipFrom in ProgramEnrollmentClient so the rule is
// pinned by a test even though the component logic is exercised via e2e.
const relationshipFrom = (gender: string, isTutor: boolean): string =>
  isTutor ? 'tutor' : gender === 'F' ? 'mother' : 'father';

describe('relationship derivation from gender', () => {
  it('maps female to mother, male to father', () => {
    expect(relationshipFrom('F', false)).toBe('mother');
    expect(relationshipFrom('M', false)).toBe('father');
  });

  it('the tutor flag overrides gender', () => {
    expect(relationshipFrom('F', true)).toBe('tutor');
    expect(relationshipFrom('M', true)).toBe('tutor');
  });

  it('every derived value is an accepted guardian relationship', () => {
    for (const value of [
      relationshipFrom('F', false),
      relationshipFrom('M', false),
      relationshipFrom('M', true),
    ]) {
      expect(GUARDIAN_RELATIONSHIPS).toContain(value);
    }
  });
});

// Mirrors appendHealth in ProgramEnrollmentClient: optional health fields left
// blank are stored as "n/a"; required ones (bloodType, eps) are simply omitted
// when empty so server validation catches them.
const OPTIONAL_HEALTH = ['allergies', 'conditions', 'medications'];
const appendHealth = (form: FormData, health: Record<string, string>) => {
  for (const key of Object.keys(health)) {
    const value = health[key]?.trim();
    if (value) form.append(key, value);
    else if (OPTIONAL_HEALTH.includes(key)) form.append(key, 'n/a');
  }
};

describe('appendHealth (n/a for optional blanks)', () => {
  it('keeps values, fills optional blanks with n/a, omits required blanks', () => {
    const form = new FormData();
    appendHealth(form, {
      bloodType: 'O+',
      eps: '',
      allergies: '',
      conditions: '  ',
      medications: 'Loratadina',
    });
    expect(form.get('bloodType')).toBe('O+');
    expect(form.get('eps')).toBeNull(); // required blank omitted
    expect(form.get('allergies')).toBe('n/a');
    expect(form.get('conditions')).toBe('n/a');
    expect(form.get('medications')).toBe('Loratadina');
  });
});

// Mirrors isPersonComplete: identity + required health + both documents, with
// gender optional for tutors.
interface CompletablePerson {
  birthDate: string | null;
  gender?: string | null;
  relationship?: string;
  bloodType?: string | null;
  eps?: string | null;
  photoUrl?: string | null;
  idDocumentUrl?: string | null;
}
const isPersonComplete = (p: CompletablePerson): boolean =>
  Boolean(
    p.birthDate &&
      (p.gender || p.relationship === 'tutor') &&
      p.bloodType &&
      p.eps &&
      p.photoUrl &&
      p.idDocumentUrl
  );

describe('isPersonComplete (green tint rule)', () => {
  const base: CompletablePerson = {
    birthDate: '1990-01-01',
    gender: 'M',
    bloodType: 'O+',
    eps: 'Sanitas',
    photoUrl: '/x',
    idDocumentUrl: '/y',
  };

  it('is true when everything is present', () => {
    expect(isPersonComplete(base)).toBe(true);
  });

  it('is false when a document is missing', () => {
    expect(isPersonComplete({ ...base, idDocumentUrl: null })).toBe(false);
  });

  it('accepts a tutor without a gender', () => {
    expect(isPersonComplete({ ...base, gender: null, relationship: 'tutor' })).toBe(true);
  });

  it('rejects a non-tutor without a gender', () => {
    expect(isPersonComplete({ ...base, gender: null, relationship: 'father' })).toBe(false);
  });
});

describe('enrollment upload validation', () => {
  it('validates the EPS certificate before uploading any companion files', async () => {
    const put = vi.fn();
    const form = new FormData();
    form.append('photo', new File(['photo'], 'photo.png', { type: 'image/png' }));
    form.append(
      'epsCertificate',
      new File(['bad'], 'eps.exe', { type: 'application/octet-stream' })
    );
    const result = await uploadEnrollmentFiles({ put } as unknown as R2Bucket, form);
    expect(result).toMatchObject({
      success: false,
      error: expect.stringContaining('Certificado EPS'),
    });
    expect(put).not.toHaveBeenCalled();
  });

  it('does not upload a valid photo when the companion document is invalid', async () => {
    const put = vi.fn();
    const form = new FormData();
    form.append('photo', new File(['dummy'], 'photo.png', { type: 'image/png' }));
    form.append(
      'idDocument',
      new File(['dummy'], 'document.exe', { type: 'application/octet-stream' })
    );
    const result = await uploadEnrollmentFiles({ put } as unknown as R2Bucket, form);
    expect(result.success).toBe(false);
    expect(put).not.toHaveBeenCalled();
  });
});
