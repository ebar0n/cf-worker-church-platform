import Image from 'next/image';
import { Instagram } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/iglesia.jordan.ibague/';

// Mosaic: 2 columns on phones, 4 columns × 2 rows on desktop. `tile` places
// each photo in both grids; captions only show on desktop.
const PHOTOS = [
  {
    src: '/home/ensamble.jpg',
    alt: 'Ensamble femenino',
    caption: 'Ensamble femenino',
    tile: 'row-span-2 lg:col-start-1 lg:row-span-2',
    position: 'object-center',
  },
  {
    src: '/home/conquistadores.jpg',
    alt: 'Club de Conquistadores',
    caption: 'Conquistadores',
    tile: 'lg:col-start-4 lg:row-start-1',
    position: 'object-center',
  },
  {
    src: '/home/drama.jpg',
    alt: 'Programa especial',
    tile: 'lg:col-start-2 lg:row-start-2',
    position: 'object-center',
  },
  {
    src: '/home/caminata.jpg',
    alt: 'Caminata a la Cascada La Plata',
    caption: 'Caminata Cascada La Plata',
    tile: 'col-span-2 lg:col-start-2 lg:row-start-1',
    position: 'object-[center_60%]',
  },
  {
    src: '/home/culto.jpg',
    alt: 'Culto de adoración',
    caption: 'Culto de adoración',
    tile: 'lg:col-span-2 lg:col-start-3 lg:row-start-2',
    position: 'object-[center_60%]',
  },
  {
    src: '/home/santa-cena.jpg',
    alt: 'Santa Cena',
    tile: 'lg:hidden',
    position: 'object-center',
  },
];

export default function Gallery() {
  return (
    <section
      aria-labelledby="galeria-title"
      className="bg-ink text-paper flex flex-col gap-6 px-3 pb-4 pt-14 lg:gap-12 lg:px-6 lg:pb-6 lg:pt-32"
    >
      <div
        data-reveal
        className="mx-auto flex w-full max-w-[75rem] flex-col gap-3 px-2 md:px-5 lg:flex-row lg:items-end lg:justify-between xl:px-0"
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-ink-muted m-0 hidden items-center gap-2 text-[13px] font-semibold uppercase leading-none tracking-[.06em] lg:flex">
            <span className="bg-warm h-0.5 w-6" />
            Galería
          </p>
          <h2
            id="galeria-title"
            className="font-heading m-0 text-[40px] font-bold leading-none tracking-[-0.02em] lg:text-[64px]"
          >
            Síguenos
          </h2>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-warm lg:bg-warm lg:text-ink lg:hover:bg-warm-hover flex h-8 items-center gap-2 self-start text-[15px] font-medium no-underline lg:h-[52px] lg:self-auto lg:rounded-xl lg:px-[22px] lg:text-base lg:transition-colors"
        >
          <Instagram className="h-[18px] w-[18px] lg:h-5 lg:w-5" strokeWidth={1.5} />
          @iglesia.jordan.ibague
        </a>
      </div>

      <div className="grid auto-rows-[170px] grid-cols-2 gap-2 lg:grid-cols-4 lg:grid-rows-[340px_340px] lg:gap-4">
        {PHOTOS.map(({ src, alt, caption, tile, position }, index) => (
          <div
            key={src}
            data-reveal
            style={{ '--reveal-delay': `${(index % 4) * 80}ms` } as React.CSSProperties}
            className={`group relative overflow-hidden rounded-[14px] lg:rounded-[20px] ${tile}`}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover ${position} transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]`}
            />
            {caption && (
              <span className="bg-ink/60 absolute bottom-4 left-4 hidden rounded-full px-3 py-2 text-[13px] font-medium leading-none backdrop-blur-md lg:block">
                {caption}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
