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
  type, EPS, allergies, conditions, medications, photo + ID document + optional EPS certificate (R2
  `enrollments/` prefix, served only via the Access-protected admin route).
  Migration `0024_eps_certificate.sql` adds `epsCertificateUrl`; apply it before
  deploying the certificate upload UI/API. The family lookup also returns this
  URL for the existing owner file route. Edits without a replacement preserve it.
  Image previews and an on-demand PDF.js viewer let families check attachments
  before saving and when reopening them. PDF.js and its worker are served locally,
  with page navigation and an actionable message for unreadable/encrypted PDFs.
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
DELETE remove), `emergency-contact` (PUT, group-level), `consent` (POST, explicit
confirmation of both checkboxes for the current adult), `pdf/[documentID]`
(retired: returns 410; printing is administrative), `file/[...key]` (owner-scoped view of an
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
  create. The **Finalizar** section saves the current responsible's acceptance and participation
  confirmation; each adult accepts for themselves. Families no longer download or
  print forms. The legacy public PDF endpoint returns 410. The directiva prints a
  single packet per family from the administrative roster. Identity/health edits
  never imply consent; partial saves remain allowed. Forms
  show save guidance and warn before discarding unsaved changes. Cards tint subtle green ("completo ✓") when fully filled
  (identity + gender/tutor + bloodType + eps + photo + ID + EPS certificate); optional health
  fields are stored as `n/a` when blank. Photo/ID fields offer live camera
  capture (getUserMedia) or upload, and while editing show the already-uploaded
  file via the owner-scoped `file/` route. Upsert-by-cédula throughout.
- Admin: `/admin/programs/[id]/roster` — grouped into **families (núcleos)**:
  adults who share a child (e.g. a married couple) are one card with the child
  listed once; each adult's relationship comes from their enrollment so nobody
  shows twice (no father+tutor duplicate). Search by child or parent,
  classification badges, health cards, photo/ID viewing, a complete family PDF,
  missing-items checklist, physical-form toggle, CSV export.

## September 2026 audit

Children added after a co-responsible are linked to the existing family adults.
The child-backed family model requires saving the first child before adding
another responsible; the UI and API now explain/enforce that order. The lookup
includes all health answers so editing does not overwrite omitted fields.
Co-responsible health is optional but must be complete when supplied; attachments
require blood type and EPS. All three files are validated before any R2 write.

Child PDFs contain participation authorization, child/guardian identification and
separate handwritten signature blocks for the enrolled guardians only. Adult PDFs
contain personal-data authorization, name, identity document and the adult signature.
Neither PDF includes the health record, birth date, age classification or contact
details; the hoja de vida belongs to a separate format. Long values wrap, overflow creates new
pages, and signature pages identify the child. See the [local audit and four
sample PDFs](../docs/audits/program-1-2026-09-19/README.md).

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

Apply outstanding D1 migrations, including `0024_eps_certificate.sql`, before
deploying. The new roster and upload queries require `HealthProfile.epsCertificateUrl`.

## Family print packet

All output pages use US Letter (612 × 792 pt), including scaled attachments.
Margins are 72 pt on the left for binding and 54 pt on the other sides.

The administrative roster offers one download per family, including drafts. The
server resolves the family using the same shared grouping as the roster; caller
provided member IDs or attachment URLs are never used to build a packet.

Order: a family-album cover with responsible adults above and children below,
with a large cartoon tree at 12% opacity as a watermark behind the portraits. Uploaded photos appear as circular portraits
(initials when absent), with names on clear white space. Children show their age-based class; adults
show their age and family role, never an inferred Master Guide qualification.
Contact names and phones are aligned in full-width rows, with emergency contact
in its own section below the responsible adults.
Larger groups or unusually long names use the legible connected-card layout.
Adult phone numbers and the family emergency contact appear below; emergency
contact is printed only on the cover. Child
profiles followed by adult profiles with a photo box in the upper left, each
immediately followed by that person’s EPS certificates, identity documents and
authorization. Each child's participation authorization is signed by that child's
linked parents/tutors; each adult's authorization covers personal data. Multi-page PDFs keep
all pages, including rotation, with a person/type header. Missing attachments get
explicit missing-annex pages. Every page, including the cover, has a footer with the
responsibles' full names and the page/total within that family, counting the
cover. Profiles are titled “FICHA DEL PARTICIPANTE / Datos personales y de salud”.
The packet has no draft stamp or identity-document footer; the roster retains the pending-items checklist. Program
and institutional headings are omitted from this packet; authorization prose
still identifies the program and institution.
Unsigned physical forms do not block draft generation.

`GET /api/admin/programs/[id]/families/[familyId]/pdf` uses the admin Access policy
and private/no-store responses. It reads only private R2 enrollment files. It
embeds JPEG/PNG and PDF; browser-decodable WebP/HEIC uploads are converted to JPEG
before saving. Older unsupported or damaged files produce an actionable error
naming the person/attachment; they are never silently omitted. The current Worker
request is limited to 40 MB of source attachments and 200 output pages.

The decorative tree is bundled in `public/pdf/family-tree.png`; production loads it
through the static ASSETS binding, without third-party requests. Development reads
the same local asset. The illustration prompt is recorded in
`public/pdf/ARTWORK.md`. Photos are reused from the participant profiles.
