import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { BASE_URL, E2E_PREFIX, DOC_IDS } from './config';
import { getRes, postJson, del, ANY_TOKEN } from './helpers';

let programId: number;

const health = {
  bloodType: 'O+',
  eps: 'Sanitas',
  allergies: 'Polen',
  conditions: 'Asma',
  medications: 'Medicamento QA',
};

// Adult registration form (multipart). relationship is father/mother/tutor;
// the frontend derives it from gender + a tutor checkbox, but the API takes
// it directly.
function adultForm(fields: Record<string, string>, withFiles = false): FormData {
  const form = new FormData();
  form.append('token', ANY_TOKEN);
  for (const [key, value] of Object.entries({ ...health, ...fields })) form.append(key, value);
  if (withFiles) {
    form.append(
      'photo',
      new File([readFileSync('tests/fixtures/enrollment/foto.png')], 'foto.png', {
        type: 'image/png',
      })
    );
    form.append(
      'idDocument',
      new File([readFileSync('tests/fixtures/enrollment/documento.png')], 'documento.png', {
        type: 'image/png',
      })
    );
  }
  return form;
}

const join = (form: FormData) =>
  fetch(`${BASE_URL}/api/programs/${programId}/join`, { method: 'POST', body: form });

const addChild = (form: FormData) =>
  fetch(`${BASE_URL}/api/programs/${programId}/children`, { method: 'POST', body: form });

interface LookupResult {
  found: boolean;
  adult: {
    relationship?: string;
    bloodType?: string;
    dataTreatmentAcceptedAt?: string | null;
    participationConfirmedAt?: string | null;
    photoUrl?: string;
    emergencyContactName?: string | null;
  } | null;
  adults?: Array<{
    documentID: string;
    relationship?: string;
    isSelf?: boolean;
    allergies?: string;
    conditions?: string;
    medications?: string;
    email?: string;
  }>;
  children: Array<{
    documentID: string;
    gender?: string | null;
    relationship?: string;
    classification?: { className: string };
  }>;
  member?: { name: string; phone: string; gender?: string } | null;
}

const lookup = (documentID: string) =>
  postJson(`/api/programs/${programId}/lookup`, { documentID, token: ANY_TOKEN }).then(
    (r) => r.json() as Promise<LookupResult>
  );

beforeAll(async () => {
  const res = await postJson('/api/admin/programs', {
    title: `${E2E_PREFIX}Aventureros`,
    department: 'club-aventureros',
    content: 'programa de prueba',
    isActive: true,
  });
  expect(res.status).toBe(201);
  programId = ((await res.json()) as { id: number }).id;
});

afterAll(async () => {
  if (programId) await del(`/api/admin/programs/${programId}`);
});

describe('adult registration', () => {
  it('rejects minors as responsible adults', async () => {
    const res = await join(
      adultForm({
        documentID: '000',
        name: 'Menor Responsable',
        phone: '3000000000',
        birthDate: '2015-01-01',
        gender: 'M',
        relationship: 'father',
        acceptDataTreatment: 'true',
        confirmParticipation: 'true',
      })
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toContain('16');
  });

  it('allows a minimal registration without consent or health (collected later)', async () => {
    const form = new FormData();
    form.append('token', ANY_TOKEN);
    form.append('documentID', DOC_IDS.clubConsejero); // isolated: no health/children
    form.append('name', 'E2E Minimo');
    form.append('phone', '3060007700');
    form.append('birthDate', '1991-06-15');
    form.append('gender', 'M');
    form.append('relationship', 'father');
    const res = await join(form);
    expect(res.status).toBe(201);

    // The responsible exists but is not yet "complete": no health record.
    const data = await lookup(DOC_IDS.clubConsejero);
    expect(data.found).toBe(true);
    expect(data.adult?.bloodType).toBeFalsy();
    expect(data.adult?.dataTreatmentAcceptedAt).toBeNull();
    expect(data.adult?.participationConfirmedAt).toBeNull();
  });

  it('rejects a partial health record (blood type without the rest)', async () => {
    const form = adultForm({
      documentID: DOC_IDS.clubTutor,
      name: 'E2E Padre',
      phone: '3060007777',
      birthDate: '1990-02-10',
      gender: 'M',
      relationship: 'father',
      acceptDataTreatment: 'true',
      confirmParticipation: 'true',
    });
    form.delete('bloodType'); // eps still present -> partial -> invalid
    const res = await join(form);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toContain('bloodType');
  });

  it('registers a father with health record and files', async () => {
    const res = await join(
      adultForm(
        {
          documentID: DOC_IDS.clubTutor,
          name: 'E2E Padre',
          phone: '3060007777',
          birthDate: '1990-02-10',
          gender: 'M',
          relationship: 'father',
          acceptDataTreatment: 'true',
          confirmParticipation: 'true',
        },
        true
      )
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      relationship: string;
      classification: { category: string };
    };
    expect(data.relationship).toBe('father');
    expect(data.classification.category).toBe('Guía Mayor');
  });
});

describe('explicit consent', () => {
  it('rejects unchecked boxes, persists explicit acceptance, and preserves its date on retry', async () => {
    const path = `/api/programs/${programId}/consent`;
    const data = {
      documentID: DOC_IDS.clubConsejero,
      token: ANY_TOKEN,
      acceptDataTreatment: true,
      confirmParticipation: false,
    };
    expect((await postJson(path, data)).status).toBe(400);
    expect((await lookup(DOC_IDS.clubConsejero)).adult?.dataTreatmentAcceptedAt).toBeNull();
    data.confirmParticipation = true;
    expect((await postJson(path, data)).status).toBe(200);
    const first = (await lookup(DOC_IDS.clubConsejero)).adult!;
    expect(first.dataTreatmentAcceptedAt).toBeTruthy();
    expect(first.participationConfirmedAt).toBeTruthy();
    expect((await postJson(path, data)).status).toBe(200);
    expect((await lookup(DOC_IDS.clubConsejero)).adult?.dataTreatmentAcceptedAt).toBe(
      first.dataTreatmentAcceptedAt
    );
  });
});

describe('children', () => {
  it('rejects a child registered by someone not enrolled', async () => {
    const res = await addChild(
      adultForm({
        tutorDocumentID: '404404404',
        documentID: DOC_IDS.clubChild,
        name: 'E2E Nino',
        birthDate: '2019-03-05',
      })
    );
    expect(res.status).toBe(403);
  });

  it('registers a child that inherits the classification and the tutor relationship', async () => {
    const res = await addChild(
      adultForm(
        {
          tutorDocumentID: DOC_IDS.clubTutor,
          documentID: DOC_IDS.clubChild,
          name: 'E2E Nino',
          gender: 'M',
          birthDate: '2019-03-05', // 7 years old in July 2026
        },
        true
      )
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as { classification: { category: string; className: string } };
    expect(data.classification.category).toBe('Aventurero');
    expect(data.classification.className).toBe('Rayos de Sol');
  });

  it('is idempotent for an already enrolled child', async () => {
    const res = await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubChild,
        name: 'E2E Nino',
        birthDate: '2019-03-05',
      })
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { alreadyEnrolled: boolean }).alreadyEnrolled).toBe(true);
  });

  it('rejects 16+ as a child', async () => {
    const res = await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: '000',
        name: 'Adulto Como Nino',
        birthDate: '2000-01-01',
      })
    );
    expect(res.status).toBe(400);
  });

  it('persists an edited gender on the child', async () => {
    const res = await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubChild,
        name: 'E2E Nino',
        gender: 'F', // changed from M
        birthDate: '2019-03-05',
      })
    );
    expect(res.status).toBe(200);
    const data = await lookup(DOC_IDS.clubTutor);
    expect(data.children.find((c) => c.documentID === DOC_IDS.clubChild)?.gender).toBe('F');
  });
});

describe('family group lookup', () => {
  it('returns the tutor with children, health and the inherited relationship', async () => {
    const data = await lookup(DOC_IDS.clubTutor);
    expect(data.found).toBe(true);
    expect(data.adult?.relationship).toBe('father');
    expect(data.adult?.bloodType).toBe('O+');
    expect(data.adults?.find((a) => a.documentID === DOC_IDS.clubTutor)).toMatchObject(health);
    expect(data.adult?.photoUrl).toMatch(/^\/api\/admin\/files\/enrollments\//);
    expect(data.children).toHaveLength(1);
    // child inherits the tutor's relationship (father)
    expect(data.children[0].relationship).toBe('father');
    expect(data.children[0].classification?.className).toBe('Rayos de Sol');
  });

  it('returns found:false for unknown adults', async () => {
    const data = await lookup('404404404');
    expect(data.found).toBe(false);
    expect(data.member).toBeFalsy();
  });

  it('pre-fills from Member (including gender) when not enrolled yet', async () => {
    const created = await postJson('/api/member', {
      documentID: DOC_IDS.clubPrefill,
      name: 'E2E Miembro Prefill',
      phone: '3070008888',
      token: ANY_TOKEN,
    });
    expect(created.status).toBe(200);

    const data = await lookup(DOC_IDS.clubPrefill);
    expect(data.found).toBe(false);
    expect(data.member?.phone).toBeTruthy();
  });
});

describe('emergency contact (one per family group)', () => {
  it('sets the contact and shows it for every adult of the group', async () => {
    const res = await fetch(`${BASE_URL}/api/programs/${programId}/emergency-contact`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorDocumentID: DOC_IDS.clubTutor,
        token: ANY_TOKEN,
        emergencyContactName: 'Abuela QA',
        emergencyContactPhone: '3110002222',
      }),
    });
    expect(res.status).toBe(200);

    const data = await lookup(DOC_IDS.clubTutor);
    expect(data.adult?.emergencyContactName).toBe('Abuela QA');
  });
});

describe('co-responsible adults', () => {
  it('registers a mother (from gender F) linked to the group children', async () => {
    const form = new FormData();
    form.append('token', ANY_TOKEN);
    form.append('tutorDocumentID', DOC_IDS.clubTutor);
    form.append('documentID', DOC_IDS.clubPrefill);
    form.append('name', 'E2E Madre');
    form.append('phone', '3090001111');
    form.append('birthDate', '1992-04-20');
    form.append('gender', 'F');
    form.append('relationship', 'mother');
    form.append('email', 'madre.qa@example.invalid');

    const res = await fetch(`${BASE_URL}/api/programs/${programId}/adults`, {
      method: 'POST',
      body: form,
    });
    expect(res.status).toBe(201);
    expect(((await res.json()) as { linkedChildren: number }).linkedChildren).toBe(1);

    // The mother can now manage the same group with her own document, and
    // inherited the group's emergency contact
    const group = await lookup(DOC_IDS.clubPrefill);
    expect(group.found).toBe(true);
    expect(group.adult?.relationship).toBe('mother');
    expect(group.adult?.emergencyContactName).toBe('Abuela QA');
    expect(group.children).toHaveLength(1);
    // both parents appear in the responsibles list
    expect(group.adults?.length).toBe(2);
    expect(group.adults?.find((a) => a.documentID === DOC_IDS.clubPrefill)?.email).toBe(
      'madre.qa@example.invalid'
    );
  });

  it('rejects partial health without changing the mother identity', async () => {
    const form = adultForm({
      tutorDocumentID: DOC_IDS.clubTutor,
      documentID: DOC_IDS.clubPrefill,
      name: 'SHOULD NOT PERSIST',
      phone: '3090001111',
      birthDate: '1992-04-20',
      gender: 'F',
      relationship: 'mother',
    });
    form.delete('eps');
    const res = await fetch(`${BASE_URL}/api/programs/${programId}/adults`, {
      method: 'POST',
      body: form,
    });
    expect(res.status).toBe(400);
    const group = await lookup(DOC_IDS.clubPrefill);
    expect(group.adult).toMatchObject({ name: 'E2E Madre' });
  });

  it('removes a co-responsible from the group', async () => {
    const res = await fetch(`${BASE_URL}/api/programs/${programId}/adults`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubPrefill,
        token: ANY_TOKEN,
      }),
    });
    expect(res.status).toBe(200);

    const group = await lookup(DOC_IDS.clubTutor);
    expect(group.adults?.length).toBe(1);

    // re-add so downstream suites keep the two-parent fixture
    const form = new FormData();
    form.append('token', ANY_TOKEN);
    form.append('tutorDocumentID', DOC_IDS.clubTutor);
    form.append('documentID', DOC_IDS.clubPrefill);
    form.append('name', 'E2E Madre');
    form.append('phone', '3090001111');
    form.append('birthDate', '1992-04-20');
    form.append('gender', 'F');
    form.append('relationship', 'mother');
    form.append('email', 'madre.qa@example.invalid');
    const readd = await fetch(`${BASE_URL}/api/programs/${programId}/adults`, {
      method: 'POST',
      body: form,
    });
    expect(readd.status).toBe(201);
  });
});

describe('a second child added after both parents', () => {
  it('links both parents so either can retrieve and print both children', async () => {
    const res = await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubSecondChild,
        name: 'E2E Hermana',
        gender: 'F',
        birthDate: '2021-03-05',
      })
    );
    expect(res.status).toBe(201);
    for (const parent of [DOC_IDS.clubTutor, DOC_IDS.clubPrefill]) {
      const group = await lookup(parent);
      expect(group.children.map((c) => c.documentID).sort()).toEqual(
        [DOC_IDS.clubChild, DOC_IDS.clubSecondChild].sort()
      );
    }
    // Leave the original fixture unchanged for the remaining suites.
    const removed = await fetch(`${BASE_URL}/api/programs/${programId}/children`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubSecondChild,
        token: ANY_TOKEN,
      }),
    });
    expect(removed.status).toBe(200);
  });
});

describe('changing a guardian relationship', () => {
  it('lets a father re-register as tutor without a constraint error', async () => {
    // father with a child
    const dad = await join(
      adultForm({
        documentID: DOC_IDS.clubTutor,
        name: 'E2E Padre',
        phone: '3060007777',
        birthDate: '1990-02-10',
        gender: 'M',
        relationship: 'father',
        acceptDataTreatment: 'true',
        confirmParticipation: 'true',
      })
    );
    expect([200, 201]).toContain(dad.status);
    await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubChild,
        name: 'E2E Nino',
        birthDate: '2019-03-05',
      })
    );

    // now the same adult marks themselves as tutor: must not 500
    const asTutor = await join(
      adultForm({
        documentID: DOC_IDS.clubTutor,
        name: 'E2E Padre',
        phone: '3060007777',
        birthDate: '1990-02-10',
        gender: 'M',
        relationship: 'tutor',
        acceptDataTreatment: 'true',
        confirmParticipation: 'true',
      })
    );
    expect(asTutor.status).toBe(200);

    const group = await lookup(DOC_IDS.clubTutor);
    expect(group.adult?.relationship).toBe('tutor');
    expect(group.children).toHaveLength(1); // no duplication, no error

    // restore the father fixture for downstream suites
    await join(
      adultForm({
        documentID: DOC_IDS.clubTutor,
        name: 'E2E Padre',
        phone: '3060007777',
        birthDate: '1990-02-10',
        gender: 'M',
        relationship: 'father',
        acceptDataTreatment: 'true',
        confirmParticipation: 'true',
      })
    );
  });
});

describe('remove child', () => {
  it('removes a child from the program but keeps the Child record', async () => {
    const res = await fetch(`${BASE_URL}/api/programs/${programId}/children`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubChild,
        token: ANY_TOKEN,
      }),
    });
    expect(res.status).toBe(200);

    const group = await lookup(DOC_IDS.clubTutor);
    expect(group.children).toHaveLength(0);

    const search = await postJson('/api/children/search', {
      documentID: DOC_IDS.clubChild,
      token: ANY_TOKEN,
    });
    expect(((await search.json()) as { found: boolean }).found).toBe(true);

    // re-enroll for downstream suites
    const reenroll = await addChild(
      adultForm({
        tutorDocumentID: DOC_IDS.clubTutor,
        documentID: DOC_IDS.clubChild,
        name: 'E2E Nino',
        birthDate: '2019-03-05',
      })
    );
    expect(reenroll.status).toBe(201);
  });
});

describe('owner-scoped enrollment file view', () => {
  it('serves the owner their uploaded file and rejects other prefixes', async () => {
    const group = await lookup(DOC_IDS.clubTutor);
    const adminUrl = group.adult?.photoUrl;
    expect(adminUrl).toMatch(/^\/api\/admin\/files\/enrollments\//);
    const key = adminUrl!.replace('/api/admin/files/', '');

    const ok = await getRes(`/api/programs/${programId}/file/${key}?token=${ANY_TOKEN}`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toContain('image');

    // A path outside the enrollments/ prefix is refused.
    const bad = await getRes(
      `/api/programs/${programId}/file/payments/whatever.jpg?token=${ANY_TOKEN}`
    );
    expect(bad.status).toBe(404);
  });

  it('requires a token or form-pass', async () => {
    const group = await lookup(DOC_IDS.clubTutor);
    const key = group.adult!.photoUrl!.replace('/api/admin/files/', '');
    const res = await getRes(`/api/programs/${programId}/file/${key}`);
    expect(res.status).toBe(400);
  });
});

describe('program landing branches to the family flow', () => {
  it('renders the family enrollment flow for club-department programs', async () => {
    const res = await getRes(`/program/${programId}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Inscripción familiar');
  });
});

describe('admin roster', () => {
  it('groups the couple into one family with the child shown once', async () => {
    const res = await getRes(`/api/admin/programs/${programId}/roster`);
    expect(res.status).toBe(200);
    const roster = (await res.json()) as {
      families: Array<{
        adults: Array<{ documentID: string; relationship?: string }>;
        children: Array<{ documentID: string; classification: { className: string } }>;
      }>;
      unassignedChildren: unknown[];
    };

    // father + mother share the child -> a single family, child listed once
    const family = roster.families.find((f) =>
      f.adults.some((a) => a.documentID === DOC_IDS.clubTutor)
    )!;
    expect(family.adults).toHaveLength(2);
    expect(family.adults.find((a) => a.documentID === DOC_IDS.clubTutor)!.relationship).toBe(
      'father'
    );
    expect(family.adults.find((a) => a.documentID === DOC_IDS.clubPrefill)!.relationship).toBe(
      'mother'
    );
    expect(family.children).toHaveLength(1);
    expect(family.children[0].classification.className).toBe('Rayos de Sol');

    expect(roster.unassignedChildren).toHaveLength(0);
  });

  it('marks and unmarks the physical form for child and adult', async () => {
    for (const documentID of [DOC_IDS.clubChild, DOC_IDS.clubTutor]) {
      const mark = await fetch(`${BASE_URL}/api/admin/programs/${programId}/physical-form`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentID, received: true }),
      });
      expect(mark.status).toBe(200);
    }

    const res = await getRes(`/api/admin/programs/${programId}/roster`);
    const roster = (await res.json()) as {
      families: Array<{ adults: Array<{ physicalFormReceivedAt: string | null }> }>;
    };
    expect(roster.families.some((f) => f.adults.some((a) => a.physicalFormReceivedAt))).toBe(true);
  });

  it('404s marking an unknown participant', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/programs/${programId}/physical-form`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentID: '000000', received: true }),
    });
    expect(res.status).toBe(404);
  });

  it('renders the admin roster page', async () => {
    const res = await getRes(`/admin/programs/${programId}/roster`);
    expect(res.status).toBe(200);
  });
});

describe('authorization PDF', () => {
  it('generates a pre-filled PDF for a child (public, token-protected)', async () => {
    const res = await fetch(
      `${BASE_URL}/api/programs/${programId}/pdf/${DOC_IDS.clubChild}?token=${ANY_TOKEN}`
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body.length).toBeGreaterThan(1000);
    expect(String.fromCharCode(...body.slice(0, 5))).toBe('%PDF-');
  });

  it('generates the adult PDF from the admin route', async () => {
    const res = await getRes(`/api/admin/programs/${programId}/pdf/${DOC_IDS.clubTutor}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('requires a token on the public route', async () => {
    const res = await fetch(`${BASE_URL}/api/programs/${programId}/pdf/${DOC_IDS.clubChild}`);
    expect(res.status).toBe(400);
  });

  it('404s for unknown participants', async () => {
    const res = await getRes(`/api/admin/programs/${programId}/pdf/000000`);
    expect(res.status).toBe(404);
  });
});

describe('enrollment file privacy', () => {
  it('files are never served publicly, only via the admin route', async () => {
    const data = await lookup(DOC_IDS.clubTutor);
    const key = data.adult!.photoUrl!.replace('/api/admin/files/', '');

    const publicRes = await getRes(`/api/files/${key}`);
    expect(publicRes.status).toBe(404);

    const adminRes = await getRes(data.adult!.photoUrl!);
    expect(adminRes.status).toBe(200);
    expect(adminRes.headers.get('cache-control')).toBe('private, no-store');
  });
});
