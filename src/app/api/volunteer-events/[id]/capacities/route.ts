import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET - Get service capacities for a volunteer event
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id: eventId } = await params;

  try {
    // Get event with services and maxCapacities
    const event = await env.DB.prepare(
      'SELECT services, maxCapacities FROM VolunteerEvent WHERE id = ? AND isActive = 1'
    )
      .bind(eventId)
      .first();

    if (!event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    const eventData = event as any;
    if (!eventData.services) {
      return NextResponse.json({});
    }

    const services = JSON.parse(eventData.services);
    const maxCapacities = eventData.maxCapacities ? JSON.parse(eventData.maxCapacities) : [];

    // Get current registration counts for each service
    const capacityData: { [key: string]: { current: number; max: number } } = {};

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const maxCapacity = maxCapacities[i] || null;

      // Count current registrations for this service
      const registrationCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM VolunteerRegistration WHERE volunteerEventId = ? AND selectedService = ?'
      )
        .bind(eventId, service)
        .first();

      const currentCount = registrationCount ? (registrationCount as any).count : 0;

      capacityData[service] = {
        current: currentCount,
        max: maxCapacity,
      };
    }

    return NextResponse.json(capacityData);
  } catch (error) {
    console.error('Error fetching service capacities:', error);
    return NextResponse.json({ error: 'Failed to fetch service capacities' }, { status: 500 });
  }
}
