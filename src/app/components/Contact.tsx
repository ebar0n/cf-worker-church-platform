export default function Contact() {
  return (
    <section className="bg-[#f8f6f2] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-[#2f557f] md:text-4xl">
          Visítanos
        </h2>
        <p className="mb-12 text-center text-lg text-[#5e3929]">
          Estamos ubicados en el barrio El Jordan, Ibagué. Te esperamos con los brazos abiertos.
        </p>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="rounded-lg border-l-4 border-[#3e8391] bg-white p-8 shadow-md">
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-[#4b207f]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-[#2f557f]">Dirección</h3>
                  <p className="text-[#5e3929]">
                    Mza 3 Casa 12 Jordan 4 Etapa, Ibagué, Tolima, Colombia
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-[#e36520]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-[#2f557f]">Teléfono</h3>
                  <p className="text-[#5e3929]">+57 320 854 0929</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 text-[#448d21]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-[#2f557f]">Horario de Servicios</h3>
                  <p className="text-[#5e3929]">Sábados: 9:30 AM - 1:00 PM</p>
                  <p className="text-[#5e3929]">Miércoles: 7:30 PM - 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[400px] overflow-hidden rounded-lg shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4610.009238907434!2d-75.19363153228265!3d4.43726144745299!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c51b91b9a5b3%3A0x733a569dee0ddf36!2sIglesia%20Adventista%20del%207%C2%B0%20D%C3%ADa%20El%20Jord%C3%A1n!5e0!3m2!1ses!2sco!4v1746830988052!5m2!1ses!2sco"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
