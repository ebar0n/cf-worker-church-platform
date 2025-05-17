import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

const toggleReadSchema = z.object({
  isRead: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  if (isNaN(parseInt(id))) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  try {
    const data = await req.json();
    const parse = toggleReadSchema.safeParse(data);

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parse.error.errors },
        { status: 400 }
      );
    }

    const { isRead } = parse.data;
    const now = new Date().toISOString();

    // Actualizar el estado de lectura
    await env.DB.prepare(
      'UPDATE FriendRequest SET isRead = ?, updatedAt = ? WHERE id = ?'
    ).bind(
      isRead ? 1 : 0,
      now,
      id
    ).run();

    // Obtener el registro actualizado
    const friend = await env.DB.prepare(
      'SELECT * FROM FriendRequest WHERE id = ?'
    ).bind(id).first();

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      friend: {
        ...friend,
        isRead: Boolean(friend.isRead) // Convertir el 0/1 de SQLite a boolean
      }
    });
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { error: 'Server error', details: error },
      { status: 500 }
    );
  }
}