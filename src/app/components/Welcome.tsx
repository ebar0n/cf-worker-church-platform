import Image from 'next/image';
import { ArrowRight, UserRound } from 'lucide-react';

export default function Welcome() {
  return (
    <section className="mx-auto grid w-full max-w-[75rem] gap-5 px-5 pb-16 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pb-32 lg:pt-36 xl:px-0">
      <div data-reveal className="flex flex-col gap-5 lg:col-span-6 lg:gap-7">
        <p className="text-ink-soft m-0 flex items-center gap-2 text-xs font-semibold uppercase leading-none tracking-[.06em] lg:text-[13px]">
          <span className="bg-warm h-0.5 w-5 lg:w-6" />
          Bienvenidos
        </p>
        <p className="font-heading m-0 text-pretty text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] lg:text-[52px] lg:leading-[1.1] lg:tracking-[-0.015em]">
          Somos una comunidad cristiana que busca compartir el{' '}
          <span className="decoration-warm underline decoration-4 underline-offset-[6px] lg:decoration-[6px] lg:underline-offset-8">
            amor de Dios
          </span>{' '}
          y construir relaciones significativas.
        </p>
        <a
          href="#anuncios"
          className="border-ink text-ink hidden items-center gap-2.5 self-start border-b py-2.5 text-base font-medium no-underline lg:flex"
        >
          Conoce lo que hacemos
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </a>
      </div>

      {/* Phones: two photos side by side */}
      <div data-reveal className="grid grid-cols-[1.2fr_1fr] items-end gap-2.5 lg:hidden">
        <div className="relative h-[260px] overflow-hidden rounded-2xl">
          <Image
            src="/home/lectura.jpg"
            alt="Padre e hijo leyendo la Biblia"
            fill
            sizes="55vw"
            className="object-cover object-[center_30%]"
          />
        </div>
        <div className="relative h-[190px] overflow-hidden rounded-2xl">
          <Image
            src="/home/predicacion.jpg"
            alt="Joven predicando"
            fill
            sizes="45vw"
            className="object-cover object-[center_30%]"
          />
        </div>
      </div>

      {/* Desktop: overlapping composition */}
      <div className="relative hidden h-[620px] lg:col-span-5 lg:col-start-8 lg:block">
        <div
          data-reveal
          style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
          className="absolute right-0 top-0 h-[500px] w-[400px] max-w-full overflow-hidden rounded-[20px]"
        >
          <Image
            src="/home/lectura.jpg"
            alt="Padre e hijo leyendo la Biblia"
            fill
            sizes="400px"
            className="object-cover object-[center_30%] transition-transform duration-700 ease-out hover:scale-105"
          />
        </div>
        <div
          data-reveal
          style={{ '--reveal-delay': '250ms' } as React.CSSProperties}
          className="border-paper absolute -left-6 bottom-0 h-[320px] w-[280px] overflow-hidden rounded-[20px] border-8"
        >
          <Image
            src="/home/predicacion.jpg"
            alt="Joven predicando"
            fill
            sizes="280px"
            className="object-cover object-[center_30%] transition-transform duration-700 ease-out hover:scale-105"
          />
        </div>
        <div
          data-reveal
          aria-hidden
          style={{ '--reveal-delay': '400ms' } as React.CSSProperties}
          className="bg-warm absolute bottom-14 right-8 flex h-[88px] w-[88px] items-center justify-center rounded-full"
        >
          <UserRound className="text-ink h-9 w-9" strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}
