import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative h-[80vh] min-h-[600px]">
      <div className="absolute inset-0">
        <Image
          src="/church-background.png"
          alt="Iglesia Adventista del 7mo día, el Jordan, Ibagué"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />
      </div>
      <div className="relative flex h-full items-center justify-center px-4 text-center text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h1 className="mb-2 text-4xl font-bold text-[#ffa92d] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] md:text-6xl">
            Iglesia Adventista del 7mo día
          </h1>
          <h2 className="mb-2 text-2xl font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] md:text-4xl">
            el Jordan, Ibagué
          </h2>
          <p className="mb-4 text-lg text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] md:text-2xl">
            Un lugar para encontrar paz, esperanza y comunidad
          </p>
          <a
            href="/friend"
            className="rounded-full bg-[#4b207f] bg-opacity-90 px-8 py-3 font-medium text-white shadow-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#2f557f]"
            style={{ minWidth: '220px' }}
          >
            Quiero ser contactado
          </a>
        </div>
      </div>
    </div>
  );
}
