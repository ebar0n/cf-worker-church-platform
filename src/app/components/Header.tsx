import Link from 'next/link';
import { ClipboardList, LogIn, Menu } from 'lucide-react';
import ReloadInAppButton from './ReloadInAppButton';

const NAV = [
  { key: 'inicio', href: '/', label: 'Inicio' },
  { key: 'anuncios', href: '/announcements', label: 'Anuncios' },
  { key: 'horarios', href: '/#horarios', label: 'Horarios' },
  { key: 'contacto', href: '/#contacto', label: 'Contacto' },
] as const;

type Section = (typeof NAV)[number]['key'];

/**
 * Site header. `overlay` sits transparent over the home hero; the default is
 * the solid bar for interior pages. The mobile menu is a native <details>, so
 * it works without client JS.
 */
export default function Header({
  variant = 'solid',
  current,
}: {
  variant?: 'overlay' | 'solid';
  current?: Section;
}) {
  const overlay = variant === 'overlay';

  return (
    <header
      className={
        overlay
          ? 'text-paper absolute inset-x-0 top-0 z-20'
          : 'border-line bg-paper/95 text-ink sticky top-0 z-30 border-b backdrop-blur-md'
      }
    >
      <div
        className={`mx-auto flex w-full max-w-[75rem] items-center justify-between px-5 md:px-8 xl:px-0 ${overlay ? 'h-[68px] lg:h-[88px]' : 'h-16 lg:h-20'}`}
      >
        <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline lg:gap-3">
          <img
            src="/church-logo.png"
            alt=""
            className={`h-[38px] w-[38px] rounded-full object-cover lg:h-10 lg:w-10 ${overlay ? 'border-paper/90 border-2 lg:h-11 lg:w-11' : ''}`}
          />
          <span className="font-heading text-2xl font-bold tracking-[-0.01em] lg:text-[26px]">
            El Jordán
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden gap-9 text-[15px] font-medium lg:flex">
          {NAV.map(({ key, href, label }) => (
            <Link
              key={key}
              href={href}
              aria-current={key === current ? 'page' : undefined}
              className={`aria-[current=page]:border-warm border-b-2 border-transparent py-2 text-inherit no-underline transition-colors duration-200 ${overlay ? 'hover:border-paper/60' : 'hover:border-gray-300'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          {/* Only renders in the installed app, which has no reload button */}
          <ReloadInAppButton />
          {/* Volunteers reach the surveys without going through the admin */}
          <Link
            href="/admin/surveys"
            title="Encuestas de salud"
            aria-label="Encuestas de salud"
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-inherit transition-colors duration-200 ${overlay ? 'hover:bg-paper/15' : 'text-ink-soft hover:bg-gray-100'}`}
          >
            <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/admin"
            title="Administración"
            aria-label="Administración"
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-inherit transition-colors duration-200 ${overlay ? 'hover:bg-paper/15' : 'text-ink-soft hover:bg-gray-100'}`}
          >
            <LogIn className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/friend"
            className="bg-warm text-ink hover:bg-warm-hover ml-3 flex h-11 items-center rounded-xl px-5 text-[15px] font-medium no-underline transition duration-200 hover:-translate-y-px"
          >
            Quiero ser contactado
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ReloadInAppButton />
          <details className="relative">
            <summary
              aria-label="Menú"
              className={`flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border [&::-webkit-details-marker]:hidden ${overlay ? 'border-paper/40 bg-ink/30 backdrop-blur-md' : 'border-line bg-white'}`}
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </summary>
            <nav
              aria-label="Principal"
              className="border-line bg-paper text-ink absolute right-0 top-14 flex w-64 flex-col rounded-2xl border p-2 text-[15px] shadow-[0_8px_24px_rgb(28_27_25/0.12)]"
            >
              {NAV.map(({ key, href, label }) => (
                <Link
                  key={key}
                  href={href}
                  aria-current={key === current ? 'page' : undefined}
                  className="text-ink hover:bg-warm-soft rounded-xl px-4 py-3 no-underline aria-[current=page]:font-semibold"
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
      </div>
    </header>
  );
}
