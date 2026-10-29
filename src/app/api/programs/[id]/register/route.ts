import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import { withTurnstileProtection } from '@/lib/turnstile';
import { getOrCreateMember } from '@/lib/program-enrollment';

const registerSchema = z.object({
  documentID: z.string().trim().min(3),
  name: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(5).optional(),
});

// POST /api/programs/[id]/register - Adult enrollment by document ID, for
// programs outside the children/club departments. A known member is enrolled
// right away; an unknown document answers { needsDetails: true } and the form
// resends it with name + phone (the form_pass cookie covers that second call).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return withTurnstileProtection(
    request,
    async (req) => {
      const { env } = getCloudflareContext();

      try {
        const programId = parseInt(id);
        const program = isNaN(programId)
          ? null
          : await env.DB.prepare('SELECT id FROM Program WHERE id = ? AND isActive = 1')
              .bind(programId)
              .first();
        if (!program) {
          return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 });
        }

        const parse = registerSchema.safeParse(await req.json());
        if (!parse.success) {
          return NextResponse.json(
            { error: 'Datos inválidos', details: parse.error.issues },
            { status: 400 }
          );
        }
        const { documentID, name, phone } = parse.data;

        let member = await env.DB.prepare('SELECT id, name FROM Member WHERE documentID = ?')
          .bind(documentID)
          .first<{ id: number; name: string }>();

        if (!member) {
          if (!name || !phone) {
            return NextResponse.json({ needsDetails: true });
          }
          const created = await getOrCreateMember(env.DB, { documentID, name, phone });
          member = { id: created.id, name };
        }

        const now = new Date().toISOString();
        const result = await env.DB.prepare(
          `INSERT INTO ProgramAdultEnrollment (programId, memberId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?) ON CONFLICT (programId, memberId) DO NOTHING`
        )
          .bind(programId, member.id, now, now)
          .run();
        const alreadyEnrolled = result.meta.changes === 0;

        return NextResponse.json(
          { name: member.name, alreadyEnrolled },
          { status: alreadyEnrolled ? 200 : 201 }
        );
      } catch (error) {
        console.error('Error registering for program:', error);
        return NextResponse.json({ error: 'Error al procesar la inscripción' }, { status: 500 });
      }
    },
    { allowFormPass: true }
  );
}
