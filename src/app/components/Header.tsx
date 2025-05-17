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
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </Link>
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
