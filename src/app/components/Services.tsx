export default function Services() {
  return (
    <section className="bg-[#f8f6f2] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#2f557f] md:text-4xl">
          Nuestros Servicios
        </h2>
        <div className="grid gap-12 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border-t-4 border-[#e36520] bg-white p-8 text-center shadow-md">
            <h3 className="mb-2 text-xl font-semibold text-[#4b207f]">Escuela Sabática</h3>
            <p className="mb-2 text-[#5e3929]">9:30 AM</p>
            <p className="text-[#5e3929]">Estudio bíblico para todas las edades</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border-t-4 border-[#ffa92d] bg-white p-8 text-center shadow-md">
            <h3 className="mb-2 text-xl font-semibold text-[#4b207f]">Culto Principal</h3>
            <p className="mb-2 text-[#5e3929]">11:00 AM</p>
            <p className="text-[#5e3929]">Adoración y predicación</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border-t-4 border-[#448d21] bg-white p-8 text-center shadow-md">
            <h3 className="mb-2 text-xl font-semibold text-[#4b207f]">Reunión de Oración</h3>
            <p className="mb-2 text-[#5e3929]">Miércoles 7:30 PM</p>
            <p className="text-[#5e3929]">Momento de comunión y oración</p>
          </div>
        </div>
      </div>
    </section>
  );
}
