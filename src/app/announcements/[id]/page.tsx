import { Metadata } from 'next';
import { getDepartmentImage, getDepartmentName, getDepartmentColor } from '@/lib/constants';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import AnnouncementDetailPageClient from './components/AnnouncementDetailPageClient';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcementDate: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generate metadata for the announcement page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return {
        title: 'Anuncio No Encontrado',
        description: 'El anuncio solicitado no está disponible.',
      };
    }

    // Access database directly using Cloudflare context
    const { env } = getCloudflareContext();
    const announcement = (await env.DB.prepare('SELECT * FROM Announcement WHERE id = ?')
      .bind(announcementId)
      .first()) as any;

    if (!announcement) {
      return {
        title: 'Anuncio No Encontrado',
        description: 'El anuncio solicitado no está disponible.',
      };
    }

    const formattedAnnouncement = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      announcementDate: announcement.announcementDate,
      department: announcement.department,
      isActive: announcement.isActive === 1,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };

    const departmentName = formattedAnnouncement.department
      ? getDepartmentName(formattedAnnouncement.department)
      : null;
    const departmentImage = formattedAnnouncement.department
      ? getDepartmentImage(formattedAnnouncement.department)
      : '/church-logo.png';
    const departmentColor = formattedAnnouncement.department
      ? getDepartmentColor(formattedAnnouncement.department)
      : '#4b207f';

    // Create description from content or default
    const description = formattedAnnouncement.content
      ? formattedAnnouncement.content
          .replace(/[#*`]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 160) + '...'
      : `Lee el anuncio "${formattedAnnouncement.title}"${departmentName ? ` del departamento ${departmentName}` : ''}.`;

    const metadata = {
      title: `${formattedAnnouncement.title} - Iglesia Adventista del 7mo día`,
      description,
      keywords: [
        formattedAnnouncement.title,
        departmentName,
        'iglesia',
        'anuncio',
        'noticias',
      ].filter(Boolean),
      authors: [{ name: 'Iglesia Adventista' }],
      openGraph: {
        title: formattedAnnouncement.title,
        description,
        type: 'article',
        url: `https://iglesiajordanibague.org/announcements/${id}`,
        siteName: 'Iglesia Adventista del 7mo día',
        images: [
          {
            url: departmentImage,
            width: 1200,
            height: 630,
            alt: departmentName ? `Logo ${departmentName}` : 'Logo Iglesia Adventista',
            type: 'image/png',
          },
        ],
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title: formattedAnnouncement.title,
        description,
        images: [departmentImage],
      },
      other: {
        'theme-color': departmentColor,
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Anuncio - Iglesia Adventista del 7mo día',
      description: 'Lee los anuncios y noticias de nuestra iglesia.',
    };
  }
}

export default function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  return <AnnouncementDetailPageClient />;
}
