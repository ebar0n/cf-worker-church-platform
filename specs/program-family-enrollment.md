# Program Family Enrollment — Implementation

**Status:** Implemented (July 2026). This document reflects the shipped design.

**Context:** Club programs (Aventureros, Conquistadores) enroll whole families:
each attendee needs a health record (hoja de vida), photo and ID document, and
the parents sign a physical authorization. A program is just a `Program`; there
is no separate "club" entity — the family-enrollment flow is chosen by
department (`FAMILY_ENROLLMENT_DEPARTMENTS` in `src/lib/constants.ts`).

## Model

Anyone who attends registers as an adult participant. Some have a family group
(children + the responsible adults); some just attend alone. There are **no
ranks** — what matters is each adult's **relationship** to the children.

- **Relationship** is derived from gender + a "soy tutor/acudiente" checkbox:
  male → `father`, female → `mother`, checkbox → `tutor`. Stored on
  `ProgramAdultEnrollment.relationship`; children inherit it from the adult who
  registers them.
- **Emergency contact** is one per family group (name + phone), set from the
  dashboard, denormalized across the group's adults.
- **Age classification** (`src/lib/age-classification.ts`, computed from
  birthDate, never stored): Principiante (<4) · Aventurero 4–9 (Corderitos →
  Manos Ayudadoras) · Conquistador 10–15 (Amigo → Guía) · Guía Mayor (≥16).

## Data (migrations 0019–0021, reusing the existing backbone)

`Program`, `Child`, `ChildGuardian` (guardian = `Member`) and `Enrollment`
already model the family. Added:

- `HealthProfile` — hoja de vida, one per person (child XOR member): blood
  type, EPS, allergies, conditions, medications, photo + ID document (R2
  `enrollments/` prefix, served only via the Access-protected admin route).
- `ProgramAdultEnrollment` — an adult in a program: relationship, consents,
  signed-form tracking, and the group emergency contact. (`role` column is
  legacy/unused — relationship replaced it.)
- `Enrollment` gained `physicalFormReceivedAt` and `enrolledByMemberId`.
- `Member.gender` is now collected so the relationship can be derived.

## Public APIs (Turnstile token or form-pass cookie)

Under `/api/programs/[id]/` (a program _is_ the club — no `club` segment):
`lookup` (family group + Member prefill), `join` (adult upsert: identity +
gender + relationship, with **health, files and consents all optional** so a
first-time responsible can start with just basic data and complete the rest
later; consent timestamps are only set, never cleared), `children` (add/update
a child; inherits the tutor's relationship; one ChildGuardian row per
child+member), `adults` (POST add/edit a co-responsible with health + files;
DELETE remove), `emergency-contact` (PUT, group-level), `pdf/[documentID]`
(pre-filled authorization), `file/[...key]` (owner-scoped view of an
`enrollments/` file — form-pass protected, unguessable-UUID capability URL, so
the responsible can see their own uploaded photo/ID while editing). Admin
equivalents under `/api/admin/programs/[id]/`: `roster` (families), `physical-form`
(PATCH), `pdf`.

## UI

- Public: `/program/[id]` renders the family flow for club-department programs.
  First-time responsibles fill a **minimal basic-data form** (identity + phone +
  birthDate + gender/tutor) which creates them; everything else is the
  wizard-less dashboard ("Tu grupo familiar"), section order **Niños →
  Responsables → Contacto de emergencia → Finalizar**. Editing **any** responsible
  (including the primary/self) opens a modal — the big form is only the initial
  create. The **Finalizar** section shows the two consent checkboxes (only the
  primary responsible), and the per-person printable PDFs appear only once both
  are checked. Cards tint subtle green ("completo ✓") when fully filled
  (identity + gender/tutor + bloodType + eps + photo + ID); optional health
  fields are stored as `n/a` when blank. Photo/ID fields offer live camera
  capture (getUserMedia) or upload, and while editing show the already-uploaded
  file via the owner-scoped `file/` route. Upsert-by-cédula throughout.
- Admin: `/admin/programs/[id]/roster` — grouped into **families (núcleos)**:
  adults who share a child (e.g. a married couple) are one card with the child
  listed once; each adult's relationship comes from their enrollment so nobody
  shows twice (no father+tutor duplicate). Search by child or parent,
  classification badges, health cards, photo/ID viewing, per-person PDF,
  missing-items checklist, physical-form toggle, CSV export.

## Tests

- `tests/unit/`: age classification (boundary + timezone), relationship
  derivation, turnstile (form-pass HMAC, isDevelopmentRequest), uploads, cache
  middleware, components.
- `tests/e2e/program-enrollment.test.ts`: the full flow against the built
  worker in workerd — registration, children + inheritance, lookup, emergency
  contact, co-adults (add/edit/remove), remove child, landing branch, admin
  roster, physical-form, PDFs, file privacy.
- Browser-verified end to end (hero, register, add child + classification,
  finalize, modals) with the Turnstile test keys.

## Deploy

`yarn db:migrate` (migrations 0019–0021) before `yarn deploy`.
