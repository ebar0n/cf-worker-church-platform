import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { E2E_PORT, BASE_URL, TEST_COURSE_SLUG, E2E_PREFIX, DOC_IDS } from './config';

// Cloudflare Turnstile testing secret: siteverify always answers success
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

function d1(command: string) {
  execSync(`npx wrangler d1 execute church-jordan --local --command "${command}"`, {
    stdio: 'pipe',
  });
}

// Every entity the suite creates carries the E2E prefix in its title/name or
// uses one of the fixed document IDs, so cleanup is a plain sweep. It runs
// before AND after the suite so a crashed run never leaves residue behind.
function cleanTestData() {
  const docIds = Object.values(DOC_IDS)
    .map((id) => `'${id}'`)
    .join(',');

  d1(`DELETE FROM VolunteerRegistration WHERE memberDocumentID IN (${docIds})`);
  d1(`DELETE FROM CourseEnrollment WHERE documentNumber IN (${docIds})`);
  d1(
    `DELETE FROM Enrollment WHERE childId IN (SELECT id FROM Child WHERE documentID IN (${docIds}))`
  );
  d1(
    `DELETE FROM ChildGuardian WHERE childId IN (SELECT id FROM Child WHERE documentID IN (${docIds}))`
  );
  d1(`DELETE FROM Child WHERE documentID IN (${docIds})`);
  d1(`DELETE FROM Member WHERE documentID IN (${docIds})`);
  d1(`DELETE FROM FriendRequest WHERE name LIKE '${E2E_PREFIX}%'`);
  d1(`DELETE FROM Announcement WHERE title LIKE '${E2E_PREFIX}%'`);
  d1(`DELETE FROM Program WHERE title LIKE '${E2E_PREFIX}%'`);
  d1(`DELETE FROM VolunteerEvent WHERE title LIKE '${E2E_PREFIX}%'`);
  d1(`DELETE FROM Course WHERE slug='${TEST_COURSE_SLUG}' OR title LIKE '${E2E_PREFIX}%'`);
}

async function waitForServer(logs: string[]) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/turnstile-config`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`wrangler dev did not become ready. Last output:\n${logs.slice(-30).join('')}`);
}

export default async function setup() {
  // The e2e suite runs the real worker bundle: build it if missing.
  // Re-run `yarn cf:build` manually after changing app code.
  if (!existsSync('.open-next/worker.js')) {
    console.log('No .open-next/worker.js found, running cf:build (this takes a while)...');
    execSync('yarn cf:build', { stdio: 'inherit' });
  }

  execSync('npx wrangler d1 migrations apply church-jordan --local', { stdio: 'pipe' });

  cleanTestData();
  d1(
    `INSERT INTO Course (slug, title, description, content, cost, isActive) ` +
      `VALUES ('${TEST_COURSE_SLUG}', '${E2E_PREFIX}Curso Smoke', 'desc', 'contenido', 5000, 1)`
  );

  // The Turnstile secret is overridden via --var so .dev.vars is never touched
  const proc: ChildProcess = spawn(
    'npx',
    [
      'wrangler',
      'dev',
      '--port',
      String(E2E_PORT),
      '--var',
      `TURNSTILE_SECRET_KEY:${TURNSTILE_TEST_SECRET_KEY}`,
    ],
    { detached: true, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const logs: string[] = [];
  proc.stdout?.on('data', (chunk: Buffer) => logs.push(chunk.toString()));
  proc.stderr?.on('data', (chunk: Buffer) => logs.push(chunk.toString()));

  try {
    await waitForServer(logs);
  } catch (error) {
    if (proc.pid) process.kill(-proc.pid, 'SIGTERM');
    throw error;
  }

  return async () => {
    if (proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        // already gone
      }
    }
    cleanTestData();
  };
}
