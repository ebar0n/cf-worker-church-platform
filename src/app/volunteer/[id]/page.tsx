import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import Header from '@/app/components/Header';
import VolunteerRegistrationForm from './VolunteerRegistrationForm';

interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  services: string | null;
  isActive: boolean;
}

// Generate metadata for the volunteer event page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return {
        title: 'Evento No Encontrado',
        description: 'El evento de voluntariado solicitado no está disponible.',
      };
    }

    // Access database directly using Cloudflare context
    const { env } = getCloudflareContext();
    const event = (await env.DB.prepare(
      'SELECT id, title, description, eventDate, isActive FROM VolunteerEvent WHERE id = ? AND isActive = 1'
    )
      .bind(eventId)
      .first()) as any;

    if (!event) {
      return {
        title: 'Evento No Encontrado',
        description: 'El evento de voluntariado solicitado no está disponible.',
      };
    }

    // Format event date
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create description
    const description = event.description
      ? `${event.description.substring(0, 150)}... | ${formattedDate}`
      : `Únete como voluntario al evento "${event.title}" de Vida y Esperanza. ${formattedDate}`;

    const logoUrl = 'https://iglesiajordanibague.org/logo-vida-y-esperanza.jpg';

    const metadata: Metadata = {
      title: `${event.title} - Vida y Esperanza`,
      description,
      keywords: ['voluntariado', 'Vida y Esperanza', event.title, 'iglesia', 'comunidad'],
      authors: [{ name: 'Centro de Bienestar Integral Vida y Esperanza' }],
      openGraph: {
        title: `${event.title} - Programa de Voluntariado`,
        description,
        type: 'website',
        url: `https://iglesiajordanibague.org/volunteer/${id}`,
        siteName: 'Vida y Esperanza - Centro de Bienestar Integral',
        images: [
          {
            url: logoUrl,
            width: 1200,
            height: 630,
            alt: 'Vida y Esperanza - Centro de Bienestar Integral',
            type: 'image/jpeg',
          },
        ],
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${event.title} - Vida y Esperanza`,
        description,
        images: [logoUrl],
      },
      other: {
        'theme-color': '#4b207f',
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Voluntariado - Vida y Esperanza',
      description:
        'Únete al programa de voluntariado de Vida y Esperanza, Centro de Bienestar Integral.',
    };
  }
}

async function getVolunteerEvent(id: string): Promise<VolunteerEvent | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/volunteer-events/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json() as Promise<VolunteerEvent>;
  } catch (error) {
    console.error('Error fetching volunteer event:', error);
    return null;
  }
}

export default async function VolunteerEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getVolunteerEvent(id);

  if (!event || !event.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      <VolunteerRegistrationForm event={event} />
    </div>
  );
}
