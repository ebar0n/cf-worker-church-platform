import Image from 'next/image';
import Link from 'next/link';
import localFont from 'next/font/local';
import { UserRound } from 'lucide-react';
import Announcements from '@/app/components/Announcements';
import Contact from '@/app/components/Contact';
import Gallery from '@/app/components/Gallery';
import Hero from '@/app/components/Hero';
import HomeFooter from '@/app/components/HomeFooter';
import HomeHeader from '@/app/components/HomeHeader';
import RevealOnScroll from '@/app/components/RevealOnScroll';
import Services from '@/app/components/Services';
import Welcome from '@/app/components/Welcome';

// Headings font for the home v2 redesign. Loaded here, not globally, so
// interior pages (which reference 'Advent Pro' without ever loading it) keep
// rendering exactly as before until their own redesign.
const adventPro = localFont({
  src: [
    { path: '../../public/fonts/adventpro-semibold.ttf', weight: '600' },
    { path: '../../public/fonts/adventpro-bold.ttf', weight: '700' },
  ],
  variable: '--font-advent',
  display: 'swap',
});

export default function Home() {
  return (
    <div className={`${adventPro.variable} bg-paper text-ink relative min-h-screen`}>
      <HomeHeader />
      <main>
        <Hero />
        <Services />
        <Welcome />
        <Announcements />

        <section className="bg-warm-soft flex flex-col pb-10 lg:grid lg:min-h-[520px] lg:grid-cols-2 lg:pb-0">
          <div className="relative h-60 overflow-hidden lg:order-2 lg:my-12 lg:h-auto lg:rounded-l-3xl">
            <Image
              src="/home/congregacion.jpg"
              alt="La congregación reunida"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_55%]"
            />
          </div>
          <div
            data-reveal
            className="flex flex-col justify-center gap-3.5 px-5 pt-7 md:px-8 lg:gap-5 lg:py-24 lg:pl-[max(2rem,calc((100vw-75rem)/2))] lg:pr-16"
          >
            <p className="text-ink-soft m-0 hidden items-center gap-2 text-[13px] font-semibold uppercase leading-none tracking-[.06em] lg:flex">
              <span className="bg-warm h-0.5 w-6" />
              Miembros
            </p>
            <h2 className="font-heading m-0 text-[34px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[56px] lg:leading-[1.02]">
              ¿Eres miembro de nuestra iglesia?
            </h2>
            <p className="text-ink-soft m-0 text-base lg:text-lg">Mantén tus datos actualizados</p>
            <Link
              href="/member"
              className="bg-ink text-paper flex h-[54px] items-center gap-2.5 rounded-xl px-5 text-base font-medium no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-[#36332f] lg:mt-2 lg:h-14 lg:self-start lg:px-[26px]"
            >
              <UserRound className="h-5 w-5" strokeWidth={1.5} />
              Actualizar mis datos
            </Link>
          </div>
        </section>

        <Gallery />
        <Contact />
      </main>
      <HomeFooter />
      <RevealOnScroll />
    </div>
  );
}
