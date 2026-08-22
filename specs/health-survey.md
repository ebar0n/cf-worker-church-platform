# Health Survey — Implementation

**Status:** Implemented (August 2026).

**Context:** the "Encuesta de Salud" (Asociación Sur Colombiana / ¡Quiero Vivir
Sano!) is filled in during volunteer events. Volunteers carry configured iPads
and capture one record per person: conditions, habits, interest in courses, two
open questions about their neighborhood, and contact data.

## Questionnaire

`src/lib/health-survey.ts` is the single source of truth. `SURVEY_BLOCKS` holds
every question with its field name, Spanish label and type (`check`, `yesno`,
`text`, `textarea`); the form, the validation and the table all derive from it,
so a new question means one entry plus a migration for its column.

Block order follows the printed sheet with one deliberate change: the two open
questions about the neighborhood come **before** the contact data. Once someone
writes their name and phone the form feels finished and open answers get
skipped.

1. Conditions the person has — checkboxes + free-text "Otra enfermedad".
2. Family history — yes/no + "¿Cuál?".
3. Habits — five yes/no (water, exercise, fruit and vegetables, sleep, checkups)
   plus "¿Cuál?" for the checkups.
4. Interest in courses — five yes/no, including **finanzas personales** (added by
   hand on the printed sheet as "salud financiera"; the wording was changed
   because "finanzas personales" sets the expectation of budget/debt/saving,
   while "salud financiera" reads as jargon and "finanzas" as corporate).
5. Neighborhood — "¿Cuál cree que es la problemática más importante a tratar en
   su barrio?" and "¿Cómo cree que se podría mejorar?".
6. Contact data — **nombre and teléfono are required**; barrio and dirección are
   optional.

Yes/no answers are nullable: "unanswered" stays distinguishable from "No", and
tapping the selected option again clears it.

## Data (migration 0022)

`HealthSurvey` holds one row per surveyed person, `volunteerEventId` →
`VolunteerEvent` with `ON DELETE CASCADE`. Checkbox columns are `INTEGER NOT
NULL DEFAULT 0`, yes/no columns are nullable `INTEGER`, `name` and `phone` are
`NOT NULL`. `capturedBy` stores the `cf-access-authenticated-user-email` of the
device that captured the record.

Indexes: `volunteerEventId`, `createdAt`, `phone`. The phone index is **not
unique** on purpose — a household can share one line and the same person can be
surveyed again at a later event. To catch the real failure mode (two volunteers
capturing the same person at one event) the form warns when a new record repeats
a phone already in that event's list and requires a second Guardar.

## Routes

- Page: `/admin/surveys/[eventId]` — rendered **without** `AdminLayout`, so it
  carries no admin navigation. `AdminLayout` is a component each page imports,
  not a Next.js layout, so opting out needs nothing else.
- API: `/api/admin/surveys/[eventId]` (GET list + event, POST create) and
  `/api/admin/surveys/[eventId]/[surveyId]` (PUT, DELETE). Surveys are always
  addressed through their event, so a mistyped id cannot reach another event's
  records.
- Entry point: an **Encuestas** button next to "Ver Voluntarios" in
  `/admin/volunteer-events`, with the captured count
  (`_count.healthSurveys`).

Both paths live under a dedicated `surveys` prefix instead of nesting under
`volunteer-events/[id]` so a Cloudflare Access policy can be expressed as two
plain prefixes, with no wildcard in the middle of the path.

## Access

The capture screen is used by volunteers who are not administrators. Hiding the
navigation is cosmetic — anyone with a session for the main `/admin`
application can type `/admin/members`. To make it a real boundary, create two
Cloudflare Access applications, both with the volunteers' policy (for example
one-time PIN restricted to a list of emails):

| Application      | Path                                        |
| ---------------- | ------------------------------------------- |
| Encuestas (page) | `iglesiajordanibague.org/admin/surveys`     |
| Encuestas (API)  | `iglesiajordanibague.org/api/admin/surveys` |

Access matches the most specific application, so these take precedence over the
existing `/admin` and `/api/admin` applications without changing them. Both are
needed: the page cannot work if the API stays behind the administrators-only
policy.

This also makes `capturedBy` meaningful — each record is attributed to the
volunteer who filled it in, instead of to whoever owns the shared admin session.

## UI

Single page, no modals: the list and the form swap in place. The list shows
nombre, teléfono, barrio, fecha and who captured it, plus a search box over
nombre/teléfono/barrio, an **Editar** button and a **Eliminar** button that
turns into an inline "¿Eliminar? Sí, eliminar / Cancelar" confirmation. The form
renders the blocks from `SURVEY_BLOCKS` with iPad-sized tap targets (48px rows,
Sí/No as segmented buttons) and offers **Guardar**, **Guardar y registrar otra**
(for consecutive captures in the field) and **Cancelar**.

## Tests

- `tests/unit/health-survey.test.ts`: questionnaire integrity (unique fields,
  block order, required fields) and payload normalization both ways.
- `tests/e2e/health-surveys.test.ts`: full CRUD against the built worker,
  validation, the cross-event guard, the count on the events list, and that the
  page renders without the admin navigation.

## Deploy

`yarn db:migrate` (migration 0022) before `yarn deploy`, then create the two
Access applications described above.
