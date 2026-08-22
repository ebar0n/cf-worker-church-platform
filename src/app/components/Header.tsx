import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <>
      <header className="fixed left-0 top-0 z-30 flex h-20 w-full items-center justify-between bg-[#4b207f] px-6 shadow-md">
        <a href="/" className="flex items-center gap-4">
          <Image
            src="/church-logo.png"
            alt="Logo Iglesia Adventista"
            width={48}
            height={48}
            className="rounded-full border-2 border-white object-cover shadow"
            priority
          />
          <span
            className="pt-1 text-xl font-bold tracking-wide text-white md:text-2xl"
            style={{ fontFamily: 'Advent Pro, Arial, sans-serif' }}
          >
            Iglesia Adventista del 7mo día
          </span>
        </a>
        {/* Two entry points on purpose: the site is installed as an app that
            starts at "/", and volunteers need to reach the surveys without
            passing through the rest of the admin. */}
        <nav className="flex items-center gap-2">
          <Link
            href="/admin/surveys"
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:text-base"
          >
            Encuestas
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:text-base"
          >
            Admin
          </Link>
        </nav>
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
