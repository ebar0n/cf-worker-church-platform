import { NextRequest, NextResponse } from 'next/server';
import { withTurnstileProtection } from '@/lib/turnstile';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

const friendRequestSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  address: z.string().optional(),
  reason: z.enum(['oracion', 'visita', 'informacion']),
  note: z.string().optional(),
});

const friendRequestWithTokenSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  address: z.string().optional(),
  reason: z.enum(['oracion', 'visita', 'informacion']),
  note: z.string().optional(),
  token: z.string().min(1), // Turnstile token
});

export async function POST(req: NextRequest) {
  return withTurnstileProtection(req, async (request) => {
    const { env } = getCloudflareContext();

    try {
      const data = await request.json();

      const parse = friendRequestSchema.safeParse(data);
      if (!parse.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: parse.error.errors },
          { status: 400 }
        );
      }

      const { name, phone, address, reason, note } = parse.data;

      const now = new Date().toISOString();

      const result = await env.DB.prepare(
        'INSERT INTO FriendRequest (name, phone, address, reason, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(name, phone, address || '', reason, note || '', now, now)
        .run();

      const friend = await env.DB.prepare('SELECT * FROM FriendRequest WHERE id = ?')
        .bind(result.meta.last_row_id)
        .first();

      return NextResponse.json({ success: true, friend });
    } catch (error) {
      console.error('Friend API: Error processing request:', error);
      return NextResponse.json({ error: 'Server error', details: error }, { status: 500 });
    }
  });
}
