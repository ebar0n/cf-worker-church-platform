import Image from 'next/image';

export default function Header() {
  return (
    <>
      <header className="fixed left-0 top-0 z-30 flex h-20 w-full items-center bg-[#4b207f] px-6 shadow-md">
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
      </header>
      <div className="h-20" /> {/* Spacer for fixed header */}
    </>
  );
}
