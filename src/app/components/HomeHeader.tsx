import Link from 'next/link';
import { ClipboardList, LogIn, Menu } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/announcements', label: 'Anuncios' },
  { href: '#horarios', label: 'Horarios' },
  { href: '#contacto', label: 'Contacto' },
];

// Transparent header laid over the home hero. The mobile menu is a native
// <details>, so it opens without any client JS.
export default function HomeHeader() {
  return (
    <header className="text-paper absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-[68px] w-full max-w-[75rem] items-center justify-between px-5 md:px-8 lg:h-[88px] xl:px-0">
        <Link href="/" className="text-paper flex items-center gap-2.5 no-underline lg:gap-3">
          <img
            src="/church-logo.png"
            alt=""
            className="border-paper/90 h-[38px] w-[38px] rounded-full border-2 object-cover lg:h-11 lg:w-11"
          />
          <span className="font-heading text-2xl font-bold tracking-[-0.01em] lg:text-[28px]">
            El Jordán
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden gap-9 text-[15px] font-medium lg:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={href === '/' ? 'page' : undefined}
              className="text-paper hover:border-paper/60 aria-[current=page]:border-warm border-b-2 border-transparent py-2 no-underline transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/admin/surveys"
            title="Encuestas de salud"
            aria-label="Encuestas de salud"
            className="text-paper hover:bg-paper/15 flex h-[42px] w-[42px] items-center justify-center rounded-xl transition-colors duration-200"
          >
            <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/admin"
            title="Administración"
            aria-label="Administración"
            className="text-paper hover:bg-paper/15 flex h-[42px] w-[42px] items-center justify-center rounded-xl transition-colors duration-200"
          >
            <LogIn className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/friend"
            className="bg-warm text-ink hover:bg-warm-hover ml-3 flex h-[46px] items-center rounded-xl px-[22px] text-[15px] font-medium no-underline transition duration-200 hover:-translate-y-px"
          >
            Quiero ser contactado
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary
            aria-label="Menú"
            className="border-paper/40 bg-ink/30 flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border backdrop-blur-md [&::-webkit-details-marker]:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </summary>
          <nav
            aria-label="Principal"
            className="border-line bg-paper text-ink absolute right-0 top-14 flex w-64 flex-col rounded-2xl border p-2 text-[15px] shadow-[0_8px_24px_rgb(28_27_25/0.12)]"
          >
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-ink hover:bg-warm-soft rounded-xl px-4 py-3 no-underline"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/admin/surveys"
              className="text-ink hover:bg-warm-soft flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
            >
              <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Encuestas de salud
            </Link>
            <Link
              href="/admin"
              className="text-ink hover:bg-warm-soft flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
            >
              <LogIn className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Administración
            </Link>
            <Link
              href="/friend"
              className="bg-warm text-ink hover:bg-warm-hover mt-1 flex h-12 items-center justify-center rounded-xl font-medium no-underline"
            >
              Quiero ser contactado
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
