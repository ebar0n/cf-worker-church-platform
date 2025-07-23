import { NextRequest, NextResponse } from 'next/server';
import { withTurnstileProtection } from '@/lib/turnstile';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// POST /api/enrollments/create - Create new enrollment with Turnstile protection
export async function POST(request: NextRequest) {
  return withTurnstileProtection(request, async (req) => {
    const { env } = getCloudflareContext();

    try {
      const body = (await req.json()) as {
        programId: number;
        childName: string;
        childDocumentID: string;
        childGender?: string;
        childBirthDate?: string;
        // Guardian information
        guardianName?: string;
        guardianDocumentID?: string;
        guardianPhone?: string;
        relationship?: string;
        // Parent information
        fatherName?: string;
        fatherDocumentID?: string;
        fatherPhone?: string;
        motherName?: string;
        motherDocumentID?: string;
        motherPhone?: string;
        useGuardian?: boolean;
      };
      const {
        programId,
        childName,
        childDocumentID,
        childGender,
        childBirthDate,
        guardianName,
        guardianDocumentID,
        guardianPhone,
        relationship,
        fatherName,
        fatherDocumentID,
        fatherPhone,
        motherName,
        motherDocumentID,
        motherPhone,
        useGuardian,
      } = body;

      // Validate required fields
      if (!programId || !childName || !childDocumentID) {
        return NextResponse.json({ error: 'Missing required child fields' }, { status: 400 });
      }

      // Validate guardian or parent information based on useGuardian flag
      if (useGuardian) {
        // Guardian mode - validate guardian fields
        if (!guardianName || !guardianDocumentID || !guardianPhone) {
          return NextResponse.json({ error: 'Missing required guardian fields' }, { status: 400 });
        }
      } else {
        // Parent mode - validate parent fields
        if (
          !fatherName ||
          !fatherDocumentID ||
          !fatherPhone ||
          !motherName ||
          !motherDocumentID ||
          !motherPhone
        ) {
          return NextResponse.json({ error: 'Missing required parent fields' }, { status: 400 });
        }
      }

      const now = new Date().toISOString();

      // Check if program exists and is active
      const program = (await env.DB.prepare('SELECT id FROM Program WHERE id = ? AND isActive = 1')
        .bind(programId)
        .first()) as any;

      if (!program) {
        return NextResponse.json({ error: 'Program not found or inactive' }, { status: 404 });
      }

      // Check if child already exists
      const existingChild = (await env.DB.prepare('SELECT id FROM Child WHERE documentID = ?')
        .bind(childDocumentID)
        .first()) as any;

      let childId: number;
      let memberIds: number[] = [];

      // Create or get child
      if (existingChild) {
        childId = existingChild.id;
        // Update child information if needed
        await env.DB.prepare(
          'UPDATE Child SET name = ?, gender = ?, birthDate = ?, updatedAt = ? WHERE id = ?'
        )
          .bind(childName, childGender || null, childBirthDate || null, now, childId)
          .run();
      } else {
        const childResult = await env.DB.prepare(
          'INSERT INTO Child (name, documentID, gender, birthDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
        )
          .bind(childName, childDocumentID, childGender || null, childBirthDate || null, now, now)
          .run();
        childId = childResult.meta.last_row_id as number;
      }

      // Create or get guardian/members based on useGuardian flag
      if (useGuardian) {
        // Guardian mode - check if guardian exists first
        const existingGuardian = (await env.DB.prepare('SELECT id FROM Member WHERE documentID = ?')
          .bind(guardianDocumentID)
          .first()) as any;

        let guardianId: number;
        if (existingGuardian) {
          // Update existing guardian
          await env.DB.prepare('UPDATE Member SET name = ?, phone = ?, updatedAt = ? WHERE id = ?')
            .bind(guardianName, guardianPhone, now, existingGuardian.id)
            .run();
          guardianId = existingGuardian.id;
        } else {
          // Create new guardian
          const guardianResult = await env.DB.prepare(
            'INSERT INTO Member (name, documentID, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(guardianName, guardianDocumentID, guardianPhone, now, now)
            .run();
          guardianId = guardianResult.meta.last_row_id as number;
        }
        memberIds.push(guardianId);
      } else {
        // Parent mode - check if parents exist first
        const existingFather = (await env.DB.prepare('SELECT id FROM Member WHERE documentID = ?')
          .bind(fatherDocumentID)
          .first()) as any;

        let fatherId: number;
        if (existingFather) {
          // Update existing father
          await env.DB.prepare('UPDATE Member SET name = ?, phone = ?, updatedAt = ? WHERE id = ?')
            .bind(fatherName, fatherPhone, now, existingFather.id)
            .run();
          fatherId = existingFather.id;
        } else {
          // Create new father
          const fatherResult = await env.DB.prepare(
            'INSERT INTO Member (name, documentID, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(fatherName, fatherDocumentID, fatherPhone, now, now)
            .run();
          fatherId = fatherResult.meta.last_row_id as number;
        }
        memberIds.push(fatherId);

        const existingMother = (await env.DB.prepare('SELECT id FROM Member WHERE documentID = ?')
          .bind(motherDocumentID)
          .first()) as any;

        let motherId: number;
        if (existingMother) {
          // Update existing mother
          await env.DB.prepare('UPDATE Member SET name = ?, phone = ?, updatedAt = ? WHERE id = ?')
            .bind(motherName, motherPhone, now, existingMother.id)
            .run();
          motherId = existingMother.id;
        } else {
          // Create new mother
          const motherResult = await env.DB.prepare(
            'INSERT INTO Member (name, documentID, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(motherName, motherDocumentID, motherPhone, now, now)
            .run();
          motherId = motherResult.meta.last_row_id as number;
        }
        memberIds.push(motherId);
      }

      // Create or update child-guardian relationships
      if (useGuardian) {
        // Guardian mode - check if guardian relationship exists
        const existingGuardianRel = await env.DB.prepare(
          'SELECT id, memberId FROM ChildGuardian WHERE childId = ? AND relationship = ?'
        )
          .bind(childId, 'guardian')
          .first();

        if (existingGuardianRel) {
          // Update existing guardian relationship
          await env.DB.prepare('UPDATE ChildGuardian SET memberId = ?, updatedAt = ? WHERE id = ?')
            .bind(memberIds[0], now, existingGuardianRel.id)
            .run();
        } else {
          // Create new guardian relationship
          await env.DB.prepare(
            'INSERT INTO ChildGuardian (childId, memberId, relationship, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(childId, memberIds[0], 'guardian', now, now)
            .run();
        }
      } else {
        // Parent mode - handle father and mother separately
        // Handle father relationship
        const existingFatherRel = await env.DB.prepare(
          'SELECT id, memberId FROM ChildGuardian WHERE childId = ? AND relationship = ?'
        )
          .bind(childId, 'father')
          .first();

        if (existingFatherRel) {
          // Update existing father relationship
          await env.DB.prepare('UPDATE ChildGuardian SET memberId = ?, updatedAt = ? WHERE id = ?')
            .bind(memberIds[0], now, existingFatherRel.id)
            .run();
        } else {
          // Create new father relationship
          await env.DB.prepare(
            'INSERT INTO ChildGuardian (childId, memberId, relationship, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(childId, memberIds[0], 'father', now, now)
            .run();
        }

        // Handle mother relationship
        const existingMotherRel = await env.DB.prepare(
          'SELECT id, memberId FROM ChildGuardian WHERE childId = ? AND relationship = ?'
        )
          .bind(childId, 'mother')
          .first();

        if (existingMotherRel) {
          // Update existing mother relationship
          await env.DB.prepare('UPDATE ChildGuardian SET memberId = ?, updatedAt = ? WHERE id = ?')
            .bind(memberIds[1], now, existingMotherRel.id)
            .run();
        } else {
          // Create new mother relationship
          await env.DB.prepare(
            'INSERT INTO ChildGuardian (childId, memberId, relationship, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(childId, memberIds[1], 'mother', now, now)
            .run();
        }
      }

      // Try to create new enrollment, if it fails due to unique constraint, update existing one
      try {
        const enrollmentResult = await env.DB.prepare(
          'INSERT INTO Enrollment (programId, childId, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
        )
          .bind(programId, childId, now, now)
          .run();

        return NextResponse.json(
          {
            message: 'Enrollment created successfully',
            enrollmentId: enrollmentResult.meta.last_row_id,
          },
          { status: 201 }
        );
      } catch (error) {
        // Check if it's a unique constraint violation
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
          // Update existing enrollment's updatedAt timestamp
          const existingEnrollment = (await env.DB.prepare(
            'SELECT id FROM Enrollment WHERE programId = ? AND childId = ?'
          )
            .bind(programId, childId)
            .first()) as any;

          if (existingEnrollment) {
            await env.DB.prepare('UPDATE Enrollment SET updatedAt = ? WHERE id = ?')
              .bind(now, existingEnrollment.id)
              .run();

            return NextResponse.json(
              {
                message: 'Enrollment updated successfully',
                enrollmentId: existingEnrollment.id,
              },
              { status: 200 }
            );
          }
        }

        // If it's not a unique constraint violation or we can't find the enrollment, re-throw
        throw error;
      }
    } catch (error) {
      console.error('Error creating enrollment:', error);

      // Check if it's a Turnstile error
      if (
        error instanceof Error &&
        error.message.includes('Invalid Turnstile token: timeout-or-duplicate')
      ) {
        return NextResponse.json(
          {
            error: 'Invalid Turnstile token: timeout-or-duplicate',
            code: 'TURNSTILE_TIMEOUT_OR_DUPLICATE',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }
  });
}
