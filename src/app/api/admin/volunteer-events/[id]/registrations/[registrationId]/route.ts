import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// DELETE - Delete a volunteer registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const { env } = getCloudflareContext();
  const { id: eventId, registrationId } = await params;

  try {
    // Check if registration exists
    const existingRegistration = await env.DB.prepare(
      'SELECT * FROM VolunteerRegistration WHERE id = ? AND volunteerEventId = ?'
    )
      .bind(registrationId, eventId)
      .first();

    if (!existingRegistration) {
      return NextResponse.json({ error: 'Volunteer registration not found' }, { status: 404 });
    }

    await env.DB.prepare('DELETE FROM VolunteerRegistration WHERE id = ?')
      .bind(registrationId)
      .run();

    return NextResponse.json({ message: 'Volunteer registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting volunteer registration:', error);
    return NextResponse.json({ error: 'Failed to delete volunteer registration' }, { status: 500 });
  }
}
