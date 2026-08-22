# Health Survey — Implementation

**Status:** Implemented (August 2026).

**Context:** the "Encuesta de Salud" (Asociación Sur Colombiana / ¡Quiero Vivir
Sano!) is filled in during volunteer events. Volunteers carry iPads installed as
an app and interview people in the street or door to door, often with no signal:
the volunteer operates the device and the person answers out loud.

## Questionnaire

`src/lib/health-survey.ts` is the single source of truth. `SURVEY_BLOCKS` holds
every question with its field name, Spanish label, type (`check`, `yesno`,
`frequency`, `text`, `textarea`, `number`) and its keyboard hints; the form, the
API validation, the dashboard and the CSV all derive from it, so a new question
means one entry plus a column.

The order is **not** the printed sheet's. It was rebuilt around a spoken
interview:

1. **Autorización** — Ley 1581 consent, one tap. Nothing sensitive is asked
   before permission, and a "no" costs 20 seconds instead of eight minutes. The
   label is the spoken script; the formal text and the `/privacy` link live in
   the hint.
2. **Hábitos** — a neutral opening nobody resents: water, exercise, fruit and
   vegetables, sleep (all `frequency`), plus "¿En el último año se hizo exámenes
   médicos de control?" (yes/no).
3. **Enfermedades** — the sensitive part, once there is rapport: six checkboxes,
   "Otra enfermedad" as free text, and the family-history question beside the
   list its wording refers to, with "¿Cuáles?" as its follow-up.
4. **¿Cuál de estos le gustaría?** — the four courses as checkboxes of one spoken
   question, right after the person has admitted they do not sleep or exercise.
5. **Su barrio** — the two open questions, the emotional high point.
6. **Datos de contacto** — nombre, teléfono, edad, barrio. All optional.

Deliberate decisions:

- **Habits use three levels** (`'si' | 'aveces' | 'no'`, null = sin responder).
  As a binary, "¿toma 8 vasos de agua al día?" forced false precision: the honest
  answer for most people is "a veces", which landed in "No" next to those who
  never do it, making change between jornadas unmeasurable.
- **The courses are one question, not five.** Five near-identical yes/no
  questions in a row hit the fatigue point and got Sí to everything or No to
  everything — precisely the data that decides which courses open. The vaguest of
  them ("¿escuchar algún tema de salud?") was dropped.
- **Nothing is required but the consent.** Someone willing to answer about their
  health but not to leave a phone number must still be recordable, and a survey
  with no identifiers is not personal data at all.
- **Edad, never a birth date**: prevalence and course interest mean little unread
  by age group, the exact number can be re-banded later, and it is not a "dato
  sensible". An impossible age is a validation error, not a silent null.
- **Barrio stays categorical** (with a `datalist` of the values already used in
  that event, since one jornada is one barrio) and there is **no address field**:
  a full address is unique per person, ungroupable, the slowest thing to dictate,
  and the most sensitive part of a record that already holds "depresión".
- **Follow-ups** (`dependsOn`) are nested under their parent, only shown once it
  is answered "Sí", and cleared server-side otherwise, so a stale detail cannot
  outlive its answer whatever the client posts.
- Wording fixes worth keeping: "Presión arterial alta (hipertensión)" — asking
  "¿padece de presión arterial?" has no answer, everyone has blood pressure;
  "Depresión, ansiedad o estrés"; "Colesterol o triglicéridos altos".

## Consent (Ley 1581)

The health answers are sensitive data, so consent opens the interview and gates
storage: `normalizeSurveyPayload` rejects any payload whose
`acceptsDataTreatment` is not "Sí", which means the API refuses the record — the
same rule for the form and for any other client.

## Who ran the interview

Three questions that used to be one: who interviewed the person, who delivered
the record, and which account was signed in. With an offline queue they diverge —
if María captures 20 surveys with no signal, signs out, and Pedro syncs them,
`capturedBy` (written from the Access header when the POST lands) credits all 20
to Pedro.

- `interviewerName` (migration 0023) is the volunteer's own name, asked **on
  arrival** at a jornada and remembered on the device. It is the attribution:
  with a shared Access account the email identifies nobody, and unlike the Access
  identity it cannot go stale — offline the page comes from the service worker
  cache, which may have been rendered for whoever used the iPad before.
- `capturedBy` stays as the trusted record of who delivered it.

An earlier `capturedByDevice` (the Access identity at capture) was dropped: it
was as untrusted as the typed name and could be stale, which is worse than
absent — a wrong value with an air of authority.

## Data (migrations 0022-0023)

`HealthSurvey`, one row per surveyed person, cascading from `VolunteerEvent`. The
table was built over several iterations while the questionnaire was being
redesigned; since none of them ever reached production, they are consolidated
into a single migration.

- Habit columns are `TEXT` with a `CHECK` for `'si' | 'aveces' | 'no'`: a dump
  reads without a legend, and a direct SQL write cannot introduce a fourth value.
- Yes/no and habit columns are nullable so "sin responder" stays different from
  "No"; checkbox columns default to 0, where unmarked means no.
- `name`, `phone`, `age` and `neighborhood` are nullable.
- `capturedAt` is the **device's** time. With the offline queue, `createdAt` is
  when the row reached the server — for a jornada synced hours later that would
  stamp every survey with the moment the signal came back. Both are kept:
  `capturedAt` is what the UI and the CSV report, `createdAt` is the audit trail.
- `clientId` is the idempotency key minted on the device, with a **partial**
  unique index so rows without one never collide.

Indexes lead with `volunteerEventId`, because every query is event-scoped, and
their leftmost prefix already serves "all surveys of this event":
`(volunteerEventId, capturedAt DESC)` for the list and `(volunteerEventId,
phone)` for the duplicate check. Single-column indexes on those fields would only
add write cost. The phone index is **not** unique: a household can share one
line, and the same person can be surveyed again at a later event. The real
failure mode — two volunteers capturing the same person at one event, from iPads
that cannot see each other's lists — is handled in the API: a POST whose phone
already exists for that event answers **409** with `{duplicate: true}`, and the
form turns Guardar into "Guardar de todas formas".

## Offline

Volunteers work with no signal, so the app has to open and keep capturing
without it.

- **Installed as an app.** `public/manifest.webmanifest` ("Iglesia Jordán",
  `start_url: /`, standalone) plus the icons generated from the church logo and
  long-press shortcuts to Encuestas, Admin and Inicio (Android and desktop only:
  iOS ignores `shortcuts`, which is why the site header carries the same two
  entry points). Not cosmetic: iOS evicts site data — caches **and the IndexedDB queue** — after
  about seven days without visits, and home-screen web apps are exempt. An iPad
  stored for two weeks with unsynced surveys in a Safari tab can come back empty.
- **Service worker** (`public/sw.js`, registered by
  `src/app/components/ServiceWorkerRegistrar.tsx`): cache-first for
  `/_next/static`, fonts and icons; network-first with a cached fallback for
  navigations, which is what makes the app open with no signal. It **never**
  touches POST/PUT/DELETE — a service worker answering "ok" to a mutation it did
  not send is how data disappears silently — and it never caches a redirect, an
  opaque response or anything that is not a 200 from our own origin, which is
  what keeps Cloudflare Access login pages out of the cache.
- **Survey reads are not cached at all.** Cache Storage ignores `Cache-Control`,
  so caching them would leave the health data of everyone surveyed on the iPad in
  clear text indefinitely — to serve a screen (the list and the metrics) that is
  read with signal anyway. Offline the app answers 503 and says so; the
  volunteer's own pending surveys come from the device queue. The only health
  data at rest on the device is therefore what has not been delivered yet, and it
  is deleted as soon as it is.
- **Outbox** (`src/lib/survey-outbox.ts` + `useSurveyOutbox`): every new survey
  is written to IndexedDB **first** and only then sent, so a tab that dies
  mid-request still has it. The one rule that matters: **a queued survey is
  deleted only when the server answers with the stored row**. A network error, an
  expired Access session answering with its login page (HTML, not JSON), a
  validation error or a real duplicate all keep the record. "The request did not
  throw" is not proof that a survey was saved. Sync runs on `online`, on window
  focus (iOS has no Background Sync) and on demand, oldest first, stopping at the
  first auth failure instead of burning the queue.
- **Idempotency**: the device mints a `clientId` per survey; a POST for a
  `clientId` the event already has answers 200 with that row instead of
  inserting. Without it, a POST whose response was lost would be stored twice.
  The check runs **before** the duplicate-phone one: otherwise a legitimate retry
  would get a 409 and sit in the device queue forever.
- **What the volunteer sees**: an amber strip while offline, a panel listing what
  is still on the device with a "Enviar ahora" button, a per-item "Enviar de
  todas formas" when the blocker is a repeated phone, an explicit confirmation to
  discard anything, and a warning when closing the app with surveys pending.
  Saving offline says "Guardada en el dispositivo. Se enviará cuando haya señal",
  never just "guardada".
- **Editing an existing survey is online-only**: merging offline edits of a row
  someone else may have changed is a different problem from capturing a new one.
- **A half-filled form survives** a reload, a closed app or iOS killing the tab
  (`surveys.draft.<eventId>` in localStorage, written as the volunteer types).
  It is **never restored on its own**: the list shows "Hay una encuesta a medio
  llenar", with the name and how long ago, and Continuar / Descartar. Silently
  refilling the fields is how one person's answers end up saved under another's
  name. It is cleared on save and on an explicit cancel — the draft only outlives
  what nobody chose.
- Because of that draft, the capture view leaves the **rubber-band scroll alone**:
  in the installed app it is the only reload gesture there is, and an accidental
  pull no longer costs anything. The site header also carries a reload button
  that appears **only** in standalone mode, where there is no browser chrome.

Access notes for the field: use **One-time PIN** for the volunteers'
application, so the login stays on our own domain — a third-party IdP redirect
kicks the standalone app out to Safari, whose cookies iOS 17+ does not share with
it. Give that application a long session so the login screen is rare, and
authenticate every iPad during preparation, verifying in airplane mode that the
app opens.

## Routes

- `/admin/surveys` — volunteer-scoped event picker, the only list of events
  volunteers can reach and the way out of a capture screen.
- `/admin/surveys/[eventId]` — capture and metrics, rendered **without**
  `AdminLayout` so it carries no admin navigation. It paints `body` `#f7f6f3` and
  sets `overscroll-behavior-y: none`: the view fills the viewport with its own
  color, so the rubber-band scroll used to expose a white strip that read as a
  blank section, and the bounce let volunteers drag the whole page while filling
  the form.
- API: `/api/admin/surveys/[eventId]` (GET list + event, POST) and
  `/api/admin/surveys/[eventId]/[surveyId]` (PUT, DELETE). Surveys are always
  addressed through their event, so a mistyped id cannot reach another event's
  records.
- Entry points: **Encuestas** and **Admin** in the site header (the app starts at
  `/`, and volunteers must reach the surveys without passing through the admin),
  plus an **Encuestas** button with its count next to "Ver Voluntarios" in
  `/admin/volunteer-events`.

Both survey paths live under a dedicated `surveys` prefix instead of nesting
under `volunteer-events/[id]`, so the Access policy below is two plain path
prefixes with no wildcard in the middle.

## Access (required after deploy)

Hiding the menu is cosmetic: anyone holding a session for the main `/admin`
application can type `/admin/members`. To make it a real boundary — and to make
`capturedBy` meaningful instead of attributing every record to the shared admin
session — create two Cloudflare Access applications:

| Application      | Path                                        |
| ---------------- | ------------------------------------------- |
| Encuestas (page) | `iglesiajordanibague.org/admin/surveys`     |
| Encuestas (API)  | `iglesiajordanibague.org/api/admin/surveys` |

Access evaluates the most specific path match, so these take precedence over
`/admin` and `/api/admin` without changing them. Both are needed: the page cannot
work if the API stays behind the administrators-only policy. **Include the admin
emails alongside the volunteers in both policies** (ideally via one Access group)
— these applications inherit nothing from the `/admin` one, so an admin left out
of them loses access to this view.

## UI

One page, no modals: the list and the form swap in place, and every swap scrolls
to the top (the form is far taller than the list).

The list view has two tabs, **Métricas** (the landing tab) and **Encuestas**.
"Descargar CSV" and "+ Nueva encuesta" sit above them, reachable from both. The
header carries the jornada's name as a refresh button (it reloads the records and
retries the queue) and, where the rest of the admin puts "Salir", a link back to
the picker.

- **Métricas** — four indicator cards (personas encuestadas, con alguna
  enfermedad, con antecedente familiar, interesadas en un curso) and four charts:
  conditions as single-series horizontal bars (the categories are not mutually
  exclusive, so a pie would be wrong; "Otras enfermedades" counts by presence of
  text), habits and interest **stacked** — habits as Sí / A veces / No / Sin
  responder, because a plain "Sí" count cannot tell a real "No" from a question
  nobody asked — and age in bands. Charts use the institutional palette; the
  brand purple is chrome, not data. Everything follows the search.
- **Encuestas** — search over nombre/teléfono/barrio, sortable columns with
  `aria-sort` (newest first), pagination of 25 with a clamped page index, and
  cards instead of the table below 640px.
- **Salir** closes the Cloudflare Access session for real
  (`/cdn-cgi/access/logout`, fetched rather than navigated to, since its page is
  a dead end in an installed app). It asks in a dialog first — getting back in
  means a new code — and offers **Solo ir al inicio** for the other intention
  behind that tap. In the capture view it warns when surveys are still queued:
  the outbox cannot sync without a session. The dialog disarms itself after 15
  seconds so a prompt left open cannot sign out the next person who taps.
- **Form** — iPad-sized tap targets (48px rows, segmented buttons with
  `aria-pressed`), a telephone keypad for the phone and `autoComplete="off"` on
  the text fields so Safari cannot offer the previous person's data to the next
  one. Errors and the duplicate warning render in the sticky footer next to
  Guardar, because at the top of a long form they scroll out of sight.

Search, sort and pagination are client-side over the single GET; at ~810 bytes
per record that is 79 KB for 100 surveys and 395 KB for 500. Moving them to the
server would also need an aggregation endpoint for the metrics (computed over the
whole set, not one page) and one for the export, so it is only worth it past a
few thousand records per event.

## CSV

Contact data first — that is what identifies a row in a spreadsheet — then every
question in the order it is asked, then `Registrada` (the capture
time), `Encuestada por` (the volunteer's typed name, falling back to whoever
delivered it) and `Entregada por` — `capturedBy`, the one field the device cannot
forge, kept for audit. Checks export as `Sí`/blank, yes/no as `Sí`/`No`/blank, habits
as `Sí`/`A veces`/`No`/blank; unanswered stays blank rather than pretending to be
a "No". The download covers the current filter.

## Tests

- `tests/unit/health-survey.test.ts`: block order, questionnaire integrity,
  payload normalization both ways, follow-up clearing, the consent gate, age
  parsing and banding, dashboard counts, CSV layout.
- `tests/unit/survey-outbox.test.ts`: the deletion rule, exhaustively — only a
  JSON answer carrying the stored row removes a queued survey; offline, an Access
  login page, a 2xx without an id, a duplicate, a validation error and a server
  error all keep it, and an auth failure stops the drain.
- `tests/e2e/health-surveys.test.ts`: CRUD against the built worker, the consent
  gate, an anonymous survey, an impossible age, the duplicate 409 and its
  `allowDuplicate` retry, idempotent retries by `clientId`, the cross-event
  guard, the count on the events list, and that the page renders without the
  admin navigation.

## Deploy

`yarn db:migrate` (migrations 0022-0023) before `yarn deploy`, then create the two
Access applications described above. Before a jornada: open the app once on each
iPad with signal, install it to the home screen, log in, and verify in airplane
mode that it opens and that saving queues.
