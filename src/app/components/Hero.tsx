import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight } from 'lucide-react';

const stagger = (index: number) => ({ animationDelay: `${150 + index * 140}ms` });

export default function Hero() {
  return (
    <section className="bg-ink text-paper relative h-[780px] overflow-hidden lg:h-[900px]">
      <Image
        src="/home/templo.jpg"
        alt="Templo Adventista El Jordán al anochecer"
        fill
        priority
        sizes="100vw"
        className="ken-burns origin-[60%_40%] object-cover object-[50%_42%]"
      />
      {/* Darken where the text sits: bottom on phones, left side on desktop */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(0deg, rgba(28,27,25,.9) 0%, rgba(28,27,25,.55) 45%, rgba(28,27,25,.1) 70%, rgba(28,27,25,.45) 100%)',
        }}
      />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(28,27,25,.84) 0%, rgba(28,27,25,.58) 38%, rgba(28,27,25,.12) 70%, rgba(28,27,25,0) 100%), linear-gradient(0deg, rgba(28,27,25,.6) 0%, rgba(28,27,25,0) 38%), linear-gradient(180deg, rgba(28,27,25,.5) 0%, rgba(28,27,25,0) 18%)',
        }}
      />

      <div className="absolute inset-x-0 bottom-10 z-10 lg:bottom-[200px]">
        <div className="mx-auto w-full max-w-[75rem] px-5 md:px-8 xl:px-0">
          <div className="flex max-w-[760px] flex-col gap-[18px] lg:gap-7">
            <p
              className="hero-in border-paper/35 bg-ink/30 m-0 flex items-center gap-2 self-start rounded-full border px-3 py-[7px] text-xs font-medium leading-snug backdrop-blur-md lg:gap-2.5 lg:px-3.5 lg:py-2 lg:text-sm"
              style={stagger(0)}
            >
              <span className="bg-warm h-1.5 w-1.5 flex-none rounded-full lg:h-2 lg:w-2" />
              Iglesia Adventista del Séptimo Día · El Jordán, Ibagué
            </p>
            <h1
              className="hero-in font-heading m-0 text-balance text-[52px] font-bold leading-[.98] tracking-[-0.025em] md:text-7xl lg:text-8xl lg:leading-[.96]"
              style={stagger(1)}
            >
              Un lugar para encontrar paz, <span className="text-warm">esperanza</span> y comunidad
            </h1>
            <div
              className="hero-in flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center lg:gap-4 lg:pt-2"
              style={stagger(2)}
            >
              <Link
                href="/friend"
                className="bg-warm text-ink hover:bg-warm-hover flex h-[54px] items-center justify-between gap-2.5 rounded-xl px-5 text-base font-medium no-underline transition duration-200 hover:-translate-y-0.5 lg:h-14 lg:px-[26px] lg:text-[17px]"
              >
                Quiero ser contactado
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>
              <a
                href="#horarios"
                className="border-paper/55 text-paper hover:bg-paper/10 flex h-[52px] items-center justify-between gap-2.5 rounded-xl border px-5 text-base font-medium no-underline transition-colors duration-200 lg:h-14 lg:px-6 lg:text-[17px]"
              >
                Ver horarios
                <ArrowDown className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <p className="text-paper/80 absolute bottom-[150px] right-[max(2rem,calc((100vw-75rem)/2))] z-10 m-0 hidden text-[13px] lg:block">
        Templo El Jordán · Jordán 4ª Etapa
      </p>
    </section>
  );
}
