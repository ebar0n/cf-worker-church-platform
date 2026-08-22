# Health Survey — Implementation

**Status:** Implemented (August 2026).

**Context:** the "Encuesta de Salud" (Asociación Sur Colombiana / ¡Quiero Vivir
Sano!) is filled in during volunteer events. Volunteers carry configured iPads
and capture one record per person: conditions, habits, interest in courses, two
open questions about their neighborhood, and contact data.

## Questionnaire

`src/lib/health-survey.ts` is the single source of truth. `SURVEY_BLOCKS` holds
every question with its field name, Spanish label and type (`check`, `yesno`,
`text`, `textarea`, `number`); the form, the API validation, the dashboard and
the CSV all derive from it, so a new question means one entry plus a migration
for its column.

Blocks, in order:

1. **Conditions** — checkboxes, plus "Otra enfermedad" as free text.
2. **Family history** — yes/no with the follow-up "¿Cuál enfermedad?".
3. **Habits** — five yes/no, with the follow-up "¿Cuáles exámenes?".
4. **Interest in courses** — five yes/no, including **salud financiera** (added
   by hand on the printed sheet).
5. **Neighborhood** — "¿Cuál cree que es la problemática más importante a tratar
   en su barrio?" and "¿Cómo cree que se podría mejorar?".
6. **Autorización** — the Ley 1581 consent, linking to `/privacy`.
7. **Contact data** — `nombre` and `teléfono` required; `edad`, `barrio (sector o
etapa)` and `dirección` optional.

Deliberate differences from the printed sheet:

- The open neighborhood questions come **before** the contact data: once someone
  writes their name and phone the form feels finished and open answers get
  skipped.
- The sheet's two bare "¿Cuál?" lines are modeled as **follow-ups**
  (`dependsOn`): the form nests them under their parent, indented behind a left
  rule, and only shows them once the parent is answered "Sí". Their labels say
  what they ask. `normalizeSurveyPayload` also clears a follow-up whose parent is
  not "Sí", so a stale detail cannot outlive its answer whatever the client
  posts.
- **Edad** is asked (the sheet does not): prevalence and course interest mean
  little unread by age group. The exact age, never a birth date — it can be
  re-banded later without asking again and it is not a "dato sensible".
- The handwritten "salud financiera" course kept that wording.

Yes/no answers are nullable, so **"sin responder" stays distinct from "No"**;
tapping the selected option again clears it.

## Consent (Ley 1581)

The health answers are sensitive data, so consent is a question in the form and
a hard gate: `normalizeSurveyPayload` rejects any payload whose
`acceptsDataTreatment` is not "Sí", which means the API refuses to store the
record — the same rule for the form and for any other client. The wording
mirrors the club flow and the block links to `/privacy`. The row's `createdAt`
is the moment consent was given.

## Data (migrations 0022–0024)

`HealthSurvey`, one row per surveyed person, cascading from `VolunteerEvent`.
Checkbox columns `INTEGER NOT NULL DEFAULT 0`, yes/no columns nullable,
`name`/`phone` `NOT NULL`, `age INTEGER` and `acceptsDataTreatment INTEGER`
nullable at the column level (the app enforces the consent), `capturedBy` from
`cf-access-authenticated-user-email`.

Timestamps are stored in UTC (`new Date().toISOString()`) and rendered in the
viewer's timezone; the table's date cell carries the raw instant in its `title`
for auditing.

Indexed by `volunteerEventId`, `createdAt` and `phone`. The phone index is **not
unique** on purpose: a household can share one line and the same person can be
surveyed again at a later event. The real failure mode — two volunteers
capturing the same person at one event, from iPads that cannot see each other's
lists — is handled in the API: a POST whose phone already exists for that event
answers **409** with `{duplicate: true}`, and the form turns Guardar into
"Guardar de todas formas", which retries with `allowDuplicate: true`.

## Routes

- Page: `/admin/surveys/[eventId]`, rendered **without** `AdminLayout`, so the
  view carries no admin navigation. (`AdminLayout` is a component each page
  imports, not a Next.js layout, so opting out costs nothing.) The page also
  paints `body` `#f7f6f3` and sets `overscroll-behavior-y: none`: the view fills
  the viewport with its own color, so the rubber-band scroll used to expose a
  white strip that read as a blank section, and the bounce let volunteers drag
  the whole page while filling the form.
- API: `/api/admin/surveys/[eventId]` (GET list + event, POST) and
  `/api/admin/surveys/[eventId]/[surveyId]` (PUT, DELETE). Surveys are always
  addressed through their event, so a mistyped id cannot reach another event's
  records.
- Entry point: an **Encuestas** button with its count next to "Ver Voluntarios"
  in `/admin/volunteer-events`.

Both live under a dedicated `surveys` prefix instead of nesting under
`volunteer-events/[id]`, so the Access policy below is two plain path prefixes
with no wildcard in the middle.

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
`/admin` and `/api/admin` without changing them. Both are needed: the page
cannot work if the API stays behind the administrators-only policy. **Include
the admin emails alongside the volunteers in both policies** (ideally via one
Access group) — these applications inherit nothing from the `/admin` one, so an
admin left out of them loses access to this view.

## UI

One page, no modals: the list and the form swap in place, and every swap scrolls
to the top (the form is far taller than the list, so keeping the scroll position
left the viewport past the end of the new content).

The list view has two tabs, **Métricas** (the landing tab) and **Encuestas**,
because the dashboard pushed the records below the fold. "Descargar CSV" and
"+ Nueva encuesta" sit above the tabs, reachable from both.

- **Métricas** — four indicator cards (personas encuestadas, con alguna
  enfermedad, con antecedente familiar, interesadas en un curso) and four
  charts: conditions as single-series horizontal bars (the categories are not
  mutually exclusive, so a pie would be wrong; "Otras enfermedades" counts by
  presence of text), habits and interest as **stacked Sí / No / Sin responder**
  over the same total — a plain "Sí" count cannot tell a real "No" from a
  question nobody asked — and age in bands. Charts use the institutional
  palette; the brand purple is chrome, not data. Everything follows the search,
  and a note says so while a filter is active.
- **Encuestas** — search over nombre/teléfono/barrio, sortable columns (nombre,
  teléfono, barrio, registrada; `aria-sort` set, newest first by default) and
  pagination of 25. Search and sort reset to page 1; the page index is clamped,
  so deleting the last row of the last page lands on the new last page rather
  than on a blank one. Rows carry **Editar** and an **Eliminar** that turns into
  an inline "¿Eliminar? Sí, eliminar / Cancelar". Below 640px the table becomes
  cards: six columns do not fit and a horizontally scrolled table hides the
  actions.
- **Form** — blocks rendered from the definition with iPad-sized tap targets
  (48px rows, Sí/No as segmented buttons carrying `aria-pressed`), and
  **Guardar**, **Guardar y registrar otra** (for consecutive captures in the
  field) and **Cancelar**. Validation errors and the duplicate warning render in
  the sticky footer, right above Guardar: at the top of a long form they scroll
  out of sight.

Search, sort and pagination are client-side over the single GET; at ~810 bytes
per record that is 79 KB for 100 surveys and 395 KB for 500. Moving them to the
server would also need an aggregation endpoint for the metrics (computed over
the whole set, not one page) and one for the export, so it is only worth it past
a few thousand records per event.

## CSV

`surveysToCsv` builds header + rows with the **contact data first** — that is
what identifies a row in a spreadsheet — then every question in the order it is
asked, then `Registrada` and `Registrada por`. Checks export as `Sí`/blank,
yes/no as `Sí`/`No`/blank (unanswered stays blank rather than pretending to be a
"No"). The download covers the current filter.

## Tests

- `tests/unit/health-survey.test.ts`: questionnaire integrity, payload
  normalization both ways, follow-up clearing, the consent gate, age parsing and
  banding, dashboard counts, CSV layout.
- `tests/e2e/health-surveys.test.ts`: CRUD against the built worker, validation,
  the consent gate, the duplicate 409 and its `allowDuplicate` retry, the
  cross-event guard, the count on the events list, and that the page renders
  without the admin navigation.

## Deploy

`yarn db:migrate` (migrations 0022–0024) before `yarn deploy`, then create the
two Access applications described above.
