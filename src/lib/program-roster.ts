import { classify } from './age-classification';

// Shared grouping for the admin roster and its printable family packet.
export async function getProgramRoster(db: D1Database, programId: number) {
  const program = await db
    .prepare('SELECT id, title, department FROM Program WHERE id = ?')
    .bind(programId)
    .first();
  if (!program) {
    return null;
  }

  const adults = await db
    .prepare(
      `SELECT m.id as memberId, m.name, m.documentID, m.phone, m.birthDate, m.email, m.gender,
              pae.relationship, pae.familyMemberId, pae.dataTreatmentAcceptedAt, pae.participationConfirmedAt,
              pae.physicalFormReceivedAt,
              pae.emergencyContactName, pae.emergencyContactPhone, pae.emergencyContactRelation,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
       FROM ProgramAdultEnrollment pae
       JOIN Member m ON m.id = pae.memberId
       LEFT JOIN HealthProfile hp ON hp.memberId = m.id
       WHERE pae.programId = ?
       ORDER BY m.birthDate DESC, m.name`
    )
    .bind(programId)
    .all();

  const children = await db
    .prepare(
      `SELECT c.id as childId, c.name, c.documentID, c.gender, c.birthDate,
              e.physicalFormReceivedAt, e.enrolledByMemberId,
              hp.bloodType, hp.eps, hp.allergies, hp.conditions, hp.medications,
              hp.photoUrl, hp.idDocumentUrl, hp.epsCertificateUrl
       FROM Enrollment e
       JOIN Child c ON c.id = e.childId
       LEFT JOIN HealthProfile hp ON hp.childId = c.id
       WHERE e.programId = ?
       ORDER BY c.birthDate DESC, c.name`
    )
    .bind(programId)
    .all();

  const guardians = await db
    .prepare(
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

  const adultRows = ((adults.results || []) as any[]).map((adult) => ({
    ...adult,
    classification: null,
  }));
  const adultMemberIds = new Set(adultRows.map((a) => a.memberId));

  // Union-find over adults: two adults are in the same family if they share a
  // child (via ChildGuardian, or the registering adult as a fallback) or the
  // family anchor (adults linked before any child was enrolled).
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
  for (const a of adultRows) {
    if (a.familyMemberId && adultMemberIds.has(a.familyMemberId))
      union(a.memberId, a.familyMemberId);
  }

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

    const entry = withClassification({ ...child, guardianMemberIds: memberIds });
    childEntries.set(child.childId, entry);

    if (memberIds.length === 0) {
      unassignedChildren.push(entry);
      continue;
    }
    childGuardianMembers.set(child.childId, memberIds);
    for (let i = 1; i < memberIds.length; i++) union(memberIds[0], memberIds[i]);
  }

  // Group adults and children by family root. Both keep the query order
  // (youngest first), which the family PDF tree and sheets follow.
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

  return { program, families: familyList, unassignedChildren };
}
