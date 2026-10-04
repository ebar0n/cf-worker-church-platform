import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getProgramRoster } from '@/lib/program-roster';
import {
  buildFamilyPdf,
  FamilyPdfError,
  type AttachmentKind,
  type FamilyAttachment,
} from '@/lib/program-family-pdf';
import { familyPdfFilename } from '@/lib/program-family';

// pdf-lib embeds JPEG bytes as-is but decodes PNG pixels in JS, which can
// exceed the Worker CPU limit; Cloudflare Images converts images to JPEG
// outside that budget. Profile photos are also cropped to the 4:5 photo box
// around the face; documents are only resized. On failure the original bytes
// are kept and buildFamilyPdf reports the attachment it cannot embed.
async function printableJpeg(
  images: ImagesBinding | undefined,
  buffer: ArrayBuffer,
  contentType: string,
  kind: AttachmentKind
): Promise<FamilyAttachment> {
  const original = { bytes: new Uint8Array(buffer), contentType };
  if (!images) return original;
  try {
    const result = await images
      .input(new Blob([buffer]).stream())
      .transform(
        kind === 'photo'
          ? { width: 800, height: 1000, fit: 'cover', gravity: 'face' }
          : { width: 2000, height: 2000, fit: 'scale-down' }
      )
      .output({ format: 'image/jpeg', quality: 85 });
    return {
      bytes: new Uint8Array(await result.response().arrayBuffer()),
      contentType: 'image/jpeg',
    };
  } catch (error) {
    console.error('Error converting attachment to JPEG:', error);
    return original;
  }
}

// Administrative route: protected by the same Cloudflare Access policy as the roster.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; familyId: string }> }
) {
  const { id, familyId } = await params;
  const programId = Number(id);
  if (!Number.isSafeInteger(programId) || programId < 1 || !/^\d+(?:-\d+)*$/.test(familyId)) {
    return NextResponse.json({ error: 'Programa o familia inválidos' }, { status: 400 });
  }
  try {
    const { env } = getCloudflareContext();
    const roster = await getProgramRoster(env.DB, programId);
    const family = roster?.families.find((candidate) => candidate.id === familyId);
    if (!roster || !family)
      return NextResponse.json(
        { error: 'Familia no encontrada en este programa' },
        { status: 404 }
      );
    // Public decoration is bundled with the app; generation never fetches third-party images.
    let treeIllustration: Uint8Array;
    if (process.env.NODE_ENV === 'development') {
      const { readFile } = await import('node:fs/promises');
      treeIllustration = new Uint8Array(
        await readFile(`${process.cwd()}/public/pdf/family-tree.jpg`)
      );
    } else {
      if (!env.ASSETS) throw new Error('Missing static assets binding');
      const asset = await env.ASSETS.fetch('https://assets.local/pdf/family-tree.jpg');
      if (!asset.ok) throw new Error('Missing family tree illustration');
      treeIllustration = new Uint8Array(await asset.arrayBuffer());
    }
    let totalBytes = 0;
    const pdf = await buildFamilyPdf({
      programTitle: String(roster.program.title),
      family,
      treeIllustration,
      loadAttachment: async (url, label, kind) => {
        const prefix = '/api/admin/files/';
        if (
          !url.startsWith(`${prefix}enrollments/`) ||
          url.includes('..') ||
          url.includes('?') ||
          url.includes('#')
        ) {
          throw new FamilyPdfError(`${label}: la referencia del archivo es inválida.`);
        }
        const object = await env.UPLOADS.get(url.slice(prefix.length));
        if (!object) return null;
        totalBytes += object.size;
        if (object.size > 10 * 1024 * 1024 || totalBytes > 40 * 1024 * 1024) {
          throw new FamilyPdfError(
            'Los anexos de la familia superan 40 MB en total o un archivo supera 10 MB. Reduce su tamaño antes de imprimir.'
          );
        }
        const buffer = await object.arrayBuffer();
        const contentType = object.httpMetadata?.contentType || '';
        const bytes = new Uint8Array(buffer);
        const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
        return contentType.startsWith('image/') && (kind === 'photo' || !isJpeg)
          ? printableJpeg(env.IMAGES, buffer, contentType, kind)
          : { bytes, contentType };
      },
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${familyPdfFilename(family)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof FamilyPdfError)
      return NextResponse.json({ error: error.message }, { status: 422 });
    console.error('Error generating family PDF:', error);
    return NextResponse.json(
      { error: 'No se pudo generar la carpeta familiar. Revisa los anexos e inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
