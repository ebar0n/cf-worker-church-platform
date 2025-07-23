import { Metadata } from 'next';
import { getDepartmentImage, getDepartmentName, getDepartmentColor } from '@/lib/constants';
import ProgramLandingPageClient from '@/app/program/[id]/components/ProgramLandingPageClient';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface Program {
  id: number;
  title: string;
  content: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generate metadata for the program page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      return {
        title: 'Programa No Encontrado',
        description: 'El programa solicitado no está disponible.',
      };
    }

    // Access database directly using Cloudflare context
    const { env } = getCloudflareContext();
    const program = (await env.DB.prepare('SELECT * FROM Program WHERE id = ? AND isActive = 1')
      .bind(programId)
      .first()) as any;

    if (!program) {
      return {
        title: 'Programa No Encontrado',
        description: 'El programa solicitado no está disponible.',
      };
    }

    const formattedProgram = {
      id: program.id,
      title: program.title,
      department: program.department,
      content: program.content,
      isActive: program.isActive === 1,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };

    if (!formattedProgram.isActive) {
      return {
        title: 'Programa No Disponible',
        description: 'Este programa no está disponible para inscripciones en este momento.',
      };
    }

    const departmentName = getDepartmentName(formattedProgram.department);
    const departmentImage = getDepartmentImage(formattedProgram.department);
    const departmentColor = getDepartmentColor(formattedProgram.department);

    // Create description from content or default
    const description = formattedProgram.content
      ? formattedProgram.content.replace(/\s+/g, ' ').trim().substring(0, 160) + '...'
      : `Inscríbete al programa ${formattedProgram.title} del departamento ${departmentName}. ¡Únete a esta increíble aventura!`;

    const metadata = {
      title: formattedProgram.title,
      description,
      keywords: [`${formattedProgram.title}`, departmentName, 'iglesia', 'programa', 'inscripción'],
      authors: [{ name: 'Iglesia Adventista' }],
      openGraph: {
        title: formattedProgram.title,
        description,
        type: 'website',
        url: `https://iglesiajordanibague.org/program/${id}`,
        siteName: 'Iglesia Adventista del 7mo día',
        images: [
          {
            url: departmentImage,
            width: 400,
            height: 400,
            alt: `Logo ${departmentName}`,
            type: 'image/png',
          },
        ],
        locale: 'es_ES',
      },
      twitter: {
        card: 'summary_large_image',
        title: formattedProgram.title,
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
      title: 'Programa - Iglesia Adventista',
      description: 'Inscríbete a nuestros programas y únete a nuestra comunidad.',
    };
  }
}

export default function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProgramLandingPageClient />;
}
