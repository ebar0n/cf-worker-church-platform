export const E2E_PORT = 8971;
export const BASE_URL = `http://localhost:${E2E_PORT}`;

// Fixed identifiers so setup/teardown can clean previous runs.
// Every entity created by the suite uses the E2E prefix or one of these IDs.
export const E2E_PREFIX = 'E2E ';
export const TEST_COURSE_SLUG = 'e2e-curso-smoke';

export const DOC_IDS = {
  courseEnrollment: '9900110022',
  courseNoProof: '5500440033',
  courseMinor: '5500440034',
  member: '9900110023',
  child: '9900110024',
  guardian: '9900110025',
  volunteer: '9900110026',
  enrollChild: '9900110027',
  adminMember: '9900110028',
  clubTutor: '9900110029',
  clubChild: '9900110030',
  clubConsejero: '9900110031',
  clubPrefill: '9900110032',
};
