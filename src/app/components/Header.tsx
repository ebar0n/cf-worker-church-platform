import Image from 'next/image';
import Link from 'next/link';
import ReloadInAppButton from './ReloadInAppButton';

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
            passing through the rest of the admin. Icons only — labels crowded
            the header on a phone. */}
        <nav className="flex items-center gap-1">
          {/* Only renders in the installed app, which has no reload button */}
          <ReloadInAppButton />
          <Link
            href="/admin/surveys"
            title="Encuestas de salud"
            aria-label="Encuestas de salud"
            className="rounded-lg p-3 text-white transition-colors hover:bg-white/10"
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
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </Link>
          <Link
            href="/admin"
            title="Administración"
            aria-label="Administración"
            className="rounded-lg p-3 text-white transition-colors hover:bg-white/10"
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
                d="M11.25 9V5.25A2.25 2.25 0 0113.5 3h6A2.25 2.25 0 0121.75 5.25v13.5A2.25 2.25 0 0119.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3-3h8.25m0 0l-3-3m3 3l-3 3"
              />
            </svg>
          </Link>
        </nav>
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
