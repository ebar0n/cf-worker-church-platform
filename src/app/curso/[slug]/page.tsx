import { Metadata } from 'next';
import CourseLandingClient from '@/app/curso/[slug]/components/CourseLandingClient';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface CourseRow {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  imageUrl: string | null;
  color: string;
  cost: number;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  isActive: number; // D1 returns 0 or 1
  createdAt: string;
  updatedAt: string;
}

// Generate metadata for the course page (SEO + Open Graph)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Access database directly using Cloudflare context
    const { env } = getCloudflareContext();
    const course = (await env.DB.prepare('SELECT * FROM Course WHERE slug = ? AND isActive = 1')
      .bind(slug)
      .first()) as CourseRow | null;

    if (!course) {
      return {
        title: 'Curso No Encontrado',
        description: 'El curso solicitado no está disponible.',
      };
    }

    const formattedCourse = {
      ...course,
      isActive: course.isActive === 1,
    };

    if (!formattedCourse.isActive) {
      return {
        title: 'Curso No Disponible',
        description: 'Este curso no está disponible para inscripciones en este momento.',
      };
    }

    // Use course image or default
    const imageUrl = formattedCourse.imageUrl || '/images/church-logo.png';
    const fullImageUrl = formattedCourse.imageUrl?.startsWith('http')
      ? formattedCourse.imageUrl
      : `https://iglesiajordanibague.org${imageUrl}`;

    const metadata: Metadata = {
      title: formattedCourse.title,
      description: formattedCourse.description,
      keywords: [formattedCourse.title, 'curso', 'iglesia', 'inscripción', 'capacitación'],
      authors: [{ name: 'Iglesia Adventista El Jordán' }],
      openGraph: {
        title: formattedCourse.title,
        description: formattedCourse.description,
        type: 'website',
        url: `https://iglesiajordanibague.org/curso/${slug}`,
        siteName: 'Iglesia Adventista del 7mo día - El Jordán',
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: formattedCourse.title,
            type: 'image/png',
          },
        ],
        locale: 'es_CO',
      },
      twitter: {
        card: 'summary_large_image',
        title: formattedCourse.title,
        description: formattedCourse.description,
        images: [fullImageUrl],
      },
      other: {
        'theme-color': formattedCourse.color,
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Curso - Iglesia Adventista',
      description: 'Inscríbete a nuestros cursos y únete a nuestra comunidad.',
    };
  }
}

export default function CoursePage() {
  return <CourseLandingClient />;
}
