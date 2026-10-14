import { describe, it, expect } from 'vitest';
import { getProgramRoster } from '@/lib/program-roster';

// Minimal D1 stand-in: each roster query is answered by the table it reads.
function fakeDb(rows: { adults: object[]; children: object[]; guardians: object[] }) {
  return {
    prepare: (sql: string) => ({
      bind: () => ({
        first: async () => ({ id: 1, title: 'Club QA', department: 'conquistadores' }),
        all: async () => ({
          results: sql.includes('FROM ProgramAdultEnrollment')
            ? rows.adults
            : sql.includes('FROM ChildGuardian')
              ? rows.guardians
              : rows.children,
        }),
      }),
    }),
  } as unknown as D1Database;
}

const adult = (memberId: number, contact: { name?: string; phone?: string } = {}) => ({
  memberId,
  name: `Adulto ${memberId}`,
  documentID: `10${memberId}`,
  birthDate: '1990-01-01',
  familyMemberId: null,
  emergencyContactName: contact.name ?? null,
  emergencyContactPhone: contact.phone ?? null,
  emergencyContactRelation: contact.name ? 'Abuela' : null,
});
const child = (childId: number) => ({
  childId,
  name: `Niño ${childId}`,
  documentID: `20${childId}`,
  birthDate: '2016-05-01',
  enrolledByMemberId: null,
});

describe('getProgramRoster', () => {
  it("copies each family's emergency contact onto its children", async () => {
    const roster = await getProgramRoster(
      fakeDb({
        // Family A: only the second adult carries the contact. Family B: its own.
        adults: [
          adult(1),
          adult(2, { name: 'Abuela A', phone: '3001' }),
          adult(3, { name: 'Tía B', phone: '3003' }),
        ],
        children: [child(10), child(11), child(12)],
        guardians: [
          { childId: 10, memberId: 1, relationship: 'father' },
          { childId: 10, memberId: 2, relationship: 'mother' },
          { childId: 11, memberId: 3, relationship: 'tutor' },
        ],
      }),
      1
    );

    const childrenById = new Map(
      roster!.families.flatMap((family) => family.children).map((c) => [c.childId, c])
    );
    expect(childrenById.get(10)).toMatchObject({
      emergencyContactName: 'Abuela A',
      emergencyContactPhone: '3001',
      emergencyContactRelation: 'Abuela',
    });
    expect(childrenById.get(11)).toMatchObject({
      emergencyContactName: 'Tía B',
      emergencyContactPhone: '3003',
    });
    // A child without enrolled adults has no family contact to inherit.
    expect(roster!.unassignedChildren[0].emergencyContactName).toBeUndefined();
  });
});
