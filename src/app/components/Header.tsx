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
          className="inline-flex items-center gap-2 rounded-lg bg-[#4b207f] px-6 py-3 text-white transition-colors hover:bg-[#4b207f]/90"
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
              d="M11.25 9V5.25A2.25 2.25 0 0013.5 3h6A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3-3h8.25m0 0l-3-3m3 3l-3 3"
            />
          </svg>
        </Link>
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
