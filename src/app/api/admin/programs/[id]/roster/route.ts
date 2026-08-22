import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { classify } from '@/lib/age-classification';

// GET /api/admin/programs/[id]/roster - Full program roster grouped into
// family units (núcleos): adults who share any child are one family (e.g. a
// married couple), with the family's children listed once. Each adult's
// relationship comes from their enrollment (pae.relationship), so a person is
// never shown twice (e.g. father AND tutor). Children whose adult is not
// enrolled appear under unassignedChildren.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: programIdParam } = await params;

  try {
    const programId = parseInt(programIdParam);
    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program' }, { status: 400 });
    }

    const program = await env.DB.prepare('SELECT id, title, department FROM Program WHERE id = ?')
      .bind(programId)
      .first();
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const adults = await env.DB.prepare(
      `SELECT m.id as memberId, m.name, m.documentID, m.phone, m.birthDate, m.email,
              pae.relationship, pae.dataTreatmentAcceptedAt, pae.participationConfirmedAt,
              pae.physicalFormReceivedAt,
              pae.emergencyContactName, pae.emergencyContactPhone, pae.emergencyContactRelation,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              hp.photoUrl, hp.idDocumentUrl
       FROM ProgramAdultEnrollment pae
       JOIN Member m ON m.id = pae.memberId
       LEFT JOIN HealthProfile hp ON hp.memberId = m.id
       WHERE pae.programId = ?
       ORDER BY m.name`
    )
      .bind(programId)
      .all();

    const children = await env.DB.prepare(
      `SELECT c.id as childId, c.name, c.documentID, c.gender, c.birthDate,
              e.physicalFormReceivedAt, e.enrolledByMemberId,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              hp.photoUrl, hp.idDocumentUrl
       FROM Enrollment e
       JOIN Child c ON c.id = e.childId
       LEFT JOIN HealthProfile hp ON hp.childId = c.id
       WHERE e.programId = ?
       ORDER BY c.name`
    )
      .bind(programId)
      .all();

    const guardians = await env.DB.prepare(
      `SELECT cg.childId, cg.memberId, cg.relationship
       FROM ChildGuardian cg
       JOIN Enrollment e ON e.childId = cg.childId AND e.programId = ?`
    )
      .bind(programId)
      .all();

    const withClassification = (person: any) => ({
      ...person,
      classification: person.birthDate ? classify(person.birthDate) : null,
    });

    const guardianRows = (guardians.results || []) as Array<{
      childId: number;
      memberId: number;
      relationship: string;
    }>;

    const adultRows = ((adults.results || []) as any[]).map((adult) => withClassification(adult));
    const adultMemberIds = new Set(adultRows.map((a) => a.memberId));

    // Union-find over adults: two adults are in the same family if they share a
    // child (via ChildGuardian, or the registering adult as a fallback).
    const parent = new Map<number, number>();
    const find = (x: number): number => {
      let root = x;
      while (parent.get(root) !== root) root = parent.get(root)!;
      while (parent.get(x) !== root) {
        const next = parent.get(x)!;
        parent.set(x, root);
        x = next;
      }
      return root;
    };
    const union = (a: number, b: number) => parent.set(find(a), find(b));
    for (const a of adultRows) parent.set(a.memberId, a.memberId);

    // Resolve each child's enrolled guardian adults (deduped by memberId).
    const childGuardianMembers = new Map<number, number[]>();
    const unassignedChildren: any[] = [];
    const childEntries = new Map<number, any>();
    for (const child of (children.results || []) as any[]) {
      const memberIds = Array.from(
        new Set(
          guardianRows
            .filter((g) => g.childId === child.childId && adultMemberIds.has(g.memberId))
            .map((g) => g.memberId)
        )
      );
      if (
        memberIds.length === 0 &&
        child.enrolledByMemberId &&
        adultMemberIds.has(child.enrolledByMemberId)
      ) {
        memberIds.push(child.enrolledByMemberId);
      }

      const entry = withClassification({ ...child });
      childEntries.set(child.childId, entry);

      if (memberIds.length === 0) {
        unassignedChildren.push(entry);
        continue;
      }
      childGuardianMembers.set(child.childId, memberIds);
      for (let i = 1; i < memberIds.length; i++) union(memberIds[0], memberIds[i]);
    }

    // Group adults and children by family root.
    const families = new Map<number, { adults: any[]; children: any[] }>();
    const familyOf = (memberId: number) => {
      const root = find(memberId);
      if (!families.has(root)) families.set(root, { adults: [], children: [] });
      return families.get(root)!;
    };
    for (const a of adultRows) familyOf(a.memberId).adults.push(a);
    for (const [childId, memberIds] of childGuardianMembers) {
      familyOf(memberIds[0]).children.push(childEntries.get(childId));
    }

    // Stable, self-describing families: id + the members' names for a header.
    const familyList = Array.from(families.values()).map((fam) => ({
      id: fam.adults
        .map((a) => a.memberId)
        .sort((x, y) => x - y)
        .join('-'),
      adults: fam.adults,
      children: fam.children,
    }));

    return NextResponse.json({ program, families: familyList, unassignedChildren });
  } catch (error) {
    console.error('Error fetching program roster:', error);
    return NextResponse.json({ error: 'Failed to fetch program roster' }, { status: 500 });
  }
}
