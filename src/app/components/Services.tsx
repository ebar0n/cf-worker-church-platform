import { SERVICES } from '@/lib/services';
import NextService from './NextService';

// Desktop: one bar overlapping the bottom of the hero. Phones: a horizontal
// snap scroller under it. Same markup, the layout switches at lg.
export default function Services() {
  return (
    <section
      id="horarios"
      aria-labelledby="horarios-title"
      className="relative z-10 flex scroll-mt-6 flex-col gap-4 pb-16 pt-10 lg:-mt-28 lg:block lg:p-0"
    >
      <div className="flex items-center justify-between px-5 md:px-8 lg:sr-only">
        <h2
          id="horarios-title"
          className="font-heading m-0 text-[34px] font-bold tracking-[-0.02em]"
        >
          Horarios
        </h2>
        <span aria-hidden className="text-ink-soft text-[13px]">
          Desliza →
        </span>
      </div>

      <div
        data-reveal
        className="no-scrollbar lg:border-line flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:px-8 lg:mx-auto lg:grid lg:w-[calc(100%-4rem)] lg:max-w-[75rem] lg:grid-cols-[1.15fr_1fr_1fr_1fr] lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:border lg:bg-white lg:px-0 lg:shadow-[0_24px_48px_-24px_rgba(28,27,25,.25)]"
      >
        <div className="bg-warm flex w-[250px] flex-none snap-start flex-col gap-2.5 rounded-[18px] p-[22px] lg:w-auto lg:gap-3.5 lg:rounded-none lg:p-8">
          <p className="m-0 flex items-center gap-2 text-xs font-semibold uppercase leading-none tracking-[.04em] lg:text-[13px]">
            <span className="bg-ink hidden h-2 w-2 rounded-full lg:block" />
            Próximo servicio
          </p>
          <NextService />
        </div>

        {SERVICES.map((service) => (
          <div
            key={service.name}
            className="border-line flex w-[220px] flex-none snap-start flex-col gap-2.5 rounded-[18px] border bg-white p-[22px] lg:w-auto lg:gap-3.5 lg:rounded-none lg:border-0 lg:border-l lg:p-8"
          >
            <p className="text-ink-soft m-0 text-[13px] leading-none lg:text-sm lg:font-medium">
              {service.day}
            </p>
            <p className="font-heading m-0 flex items-baseline gap-1.5 font-bold leading-none tracking-[-0.02em]">
              <span className="text-[40px] lg:text-[52px]">{service.time}</span>
              <span className="text-ink-soft text-lg font-semibold lg:text-xl">
                {service.period}
              </span>
            </p>
            <div>
              <h3 className="m-0 text-[15px] font-semibold leading-snug lg:text-[17px]">
                {service.name}
              </h3>
              <p className="text-ink-soft m-0 hidden text-[15px] leading-normal lg:block">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
