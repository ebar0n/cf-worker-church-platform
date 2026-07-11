import { describe, it, expect } from 'vitest';
import { BASE_URL, TEST_COURSE_SLUG, DOC_IDS } from './config';
import { getRes, postJson, paymentProofForm, ANY_TOKEN } from './helpers';

const enrollFields = (documentNumber: string, birthDate = '1990-05-10') => ({
  token: ANY_TOKEN,
  documentNumber,
  fullName: 'Prueba Smoke Uno',
  phone: '3001234567',
  birthDate,
  isMember: 'false',
});

const enroll = (form: FormData) =>
  fetch(`${BASE_URL}/api/courses/${TEST_COURSE_SLUG}/enroll`, { method: 'POST', body: form });

describe('public course API', () => {
  it('returns the course by slug', async () => {
    const res = await getRes(`/api/courses/${TEST_COURSE_SLUG}`);
    expect(res.status).toBe(200);
    const course = (await res.json()) as { slug: string; cost: number };
    expect(course.slug).toBe(TEST_COURSE_SLUG);
    expect(course.cost).toBe(5000);
  });

  it('404s for unknown slugs', async () => {
    const res = await getRes('/api/courses/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('course enrollment (multipart with payment proof)', () => {
  it('enrolls with the proof in the same request', async () => {
    const res = await enroll(paymentProofForm(enrollFields(DOC_IDS.courseEnrollment)));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { success: boolean };
    expect(data.success).toBe(true);
  });

  it('masks personal data in the captcha-free enrollment check', async () => {
    const res = await postJson(`/api/courses/${TEST_COURSE_SLUG}/check-enrollment`, {
      documentNumber: DOC_IDS.courseEnrollment,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      found: boolean;
      enrollment: { fullName: string; phone: string };
    };
    expect(data.found).toBe(true);
    expect(data.enrollment.fullName).toBe('Prueba S. U.');
    expect(data.enrollment.phone).toBe('***4567');
  });

  it('rejects a duplicate enrollment', async () => {
    const res = await enroll(paymentProofForm(enrollFields(DOC_IDS.courseEnrollment)));
    expect(res.status).toBe(400);
  });

  it('requires the proof when the course has a cost', async () => {
    const res = await enroll(paymentProofForm(enrollFields(DOC_IDS.courseNoProof), false));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('comprobante');
  });

  it('rejects minors', async () => {
    const res = await enroll(paymentProofForm(enrollFields(DOC_IDS.courseMinor, '2015-01-01')));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('18');
  });

  it('requires a token', async () => {
    const fields = enrollFields(DOC_IDS.courseNoProof);
    const form = paymentProofForm({ ...fields, token: '' });
    const res = await enroll(form);
    expect(res.status).toBe(400);
  });
});
