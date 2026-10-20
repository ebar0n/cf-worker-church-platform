import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { E2E_PREFIX, DOC_IDS } from './config';
import { getRes, postJson, putJson, del, expectJson, ANY_TOKEN } from './helpers';

let programId: number;

beforeAll(async () => {
  const res = await postJson('/api/admin/programs', {
    title: `${E2E_PREFIX}Programa Infantil`,
    department: 'ministerio-infantil-adolescente',
    content: 'contenido de prueba',
    isActive: true,
  });
  expect(res.status, JSON.stringify(await res.clone().json())).toBe(201);
  programId = ((await res.json()) as { id: number }).id;
});

afterAll(async () => {
  if (programId) await del(`/api/admin/programs/${programId}`);
});

describe('public program API', () => {
  it('returns the program', async () => {
    const res = await getRes(`/api/programs/${programId}`);
    expect(res.status).toBe(200);
    const program = (await res.json()) as { title: string };
    expect(program.title).toContain('Programa Infantil');
  });

  it('404s for unknown programs', async () => {
    const res = await getRes('/api/programs/999999');
    expect(res.status).toBe(404);
  });
});

describe('program enrollment (guardian mode)', () => {
  it('requires a token', async () => {
    const res = await postJson('/api/enrollments/create', {
      programId,
      childName: 'E2E Nino',
      childDocumentID: DOC_IDS.enrollChild,
    });
    expect(res.status).toBe(400);
  });

  it('enrolls a child with guardian data', async () => {
    const res = await postJson('/api/enrollments/create', {
      token: ANY_TOKEN,
      programId,
      childName: 'E2E Nino Uno',
      childDocumentID: DOC_IDS.enrollChild,
      childGender: 'M',
      childBirthDate: '2016-08-01',
      useGuardian: true,
      guardianName: 'E2E Acudiente',
      guardianDocumentID: DOC_IDS.guardian,
      guardianPhone: '3040005555',
      relationship: 'tio',
    });
    expect(res.status, JSON.stringify(await res.clone().json())).toBeLessThan(300);
  });

  it('the child is now searchable from public forms', async () => {
    const res = await postJson('/api/children/search', {
      documentID: DOC_IDS.enrollChild,
      token: ANY_TOKEN,
    });
    const data = (await res.json()) as { found: boolean; child: { name: string } };
    expect(data.found).toBe(true);
    expect(data.child.name).toBe('E2E Nino Uno');
  });

  it('admin sees the enrollment', async () => {
    const res = await getRes(`/api/admin/programs/${programId}/enrollments`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: number }[] | { enrollments: { id: number }[] };
    const enrollments = Array.isArray(body) ? body : body.enrollments;
    expect(enrollments.length).toBe(1);
  });
});

describe('admin program CRUD', () => {
  it('updates the program', async () => {
    const res = await putJson(`/api/admin/programs/${programId}`, {
      title: `${E2E_PREFIX}Programa Renombrado`,
      department: 'ministerio-infantil-adolescente',
      content: 'nuevo contenido',
      isActive: true,
    });
    expect(res.status).toBeLessThan(300);

    const check = await getRes(`/api/programs/${programId}`);
    const program = (await check.json()) as { title: string };
    expect(program.title).toContain('Renombrado');
  });
});

describe('adult program enrollment (document ID only)', () => {
  let adultProgramId: number;
  const register = (body: Record<string, string>) =>
    postJson(`/api/programs/${adultProgramId}/register`, { ...body, token: ANY_TOKEN });

  beforeAll(async () => {
    const res = await postJson('/api/admin/programs', {
      title: `${E2E_PREFIX}Programa Mujer`,
      department: 'ministerio-mujer',
      eventDate: '2026-11-15',
      eventTime: '19:00',
      imageUrl: '/api/files/programs/e2e.png',
      isActive: true,
    });
    adultProgramId = (await expectJson<{ id: number }>(res, 201)).id;
  });

  it('returns the event date, time and image', async () => {
    const program = await expectJson(await getRes(`/api/programs/${adultProgramId}`), 200);
    expect(program).toMatchObject({
      eventDate: '2026-11-15',
      eventTime: '19:00',
      imageUrl: '/api/files/programs/e2e.png',
    });
  });

  it('renders the document-only landing, not the child flow', async () => {
    const html = await (await getRes(`/program/${adultProgramId}`)).text();
    expect(html).toContain('Ingresa tu número de documento');
    expect(html).not.toContain('Documento del Niño');
  });

  it('asks for name and phone when the document is unknown', async () => {
    const res = await register({ documentID: DOC_IDS.adultProgram });
    expect(await expectJson(res, 200)).toEqual({ needsDetails: true });
  });

  it('enrolls a newcomer with name and phone', async () => {
    const res = await register({
      documentID: DOC_IDS.adultProgram,
      name: 'E2E Hermana',
      phone: '3040006666',
    });
    expect(await expectJson(res, 201)).toEqual({ name: 'E2E Hermana', alreadyEnrolled: false });
  });

  it('recognizes a known member by document alone', async () => {
    const res = await register({ documentID: DOC_IDS.adultProgram });
    expect(await expectJson(res, 200)).toEqual({ name: 'E2E Hermana', alreadyEnrolled: true });
  });

  it('admin sees the adult enrollment', async () => {
    const enrollments = await expectJson<{ member: { documentID: string } | null }[]>(
      await getRes(`/api/admin/programs/${adultProgramId}/enrollments`),
      200
    );
    expect(enrollments.map((e) => e.member?.documentID)).toEqual([DOC_IDS.adultProgram]);
  });
});
