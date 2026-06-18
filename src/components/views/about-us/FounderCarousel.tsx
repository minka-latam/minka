import Image from "next/image";

interface Founder {
  id: string;
  image: string;
  name: string;
  role: "Co-fundador" | "Co-fundadora";
  title: string;
  status: "active" | "inactive";
}

const founders: Founder[] = [
  {
    id: "founder-1",
    image: "/founders/Kurt Guardia.png",
    name: "Kurt Guardia",
    role: "Co-fundador",
    title: "Ing. Comercial, Master en Business Admin & Desarrollador Web fullstack.",
    status: "active",
  },
  {
    id: "founder-2",
    image: "/founders/Florence Hugard.png",
    name: "Florence Hugard",
    role: "Co-fundadora",
    title: "Lic. Economía, Master in Science Finance.",
    status: "inactive",
  },
  {
    id: "founder-3",
    image: "/founders/Marco Herbas.png",
    name: "Marco Herbas",
    role: "Co-fundador",
    title: "Ing. electromecánico, Master en Ingeniería Nuclear.",
    status: "active",
  },
  {
    id: "founder-4",
    image: "/founders/Carolina Orias.jpeg",
    name: "Carolina Orias",
    role: "Co-fundadora",
    title: "Lic. Derecho, Máster en Prevención de la Violencia de Género.",
    status: "active",
  },
  {
    id: "founder-5",
    image: "/founders/Leonor Revollo.jpeg",
    name: "Leonor Revollo",
    role: "Co-fundadora",
    title: "Lic. Economía, Master in Science Finance.",
    status: "inactive",
  },
];

export function FoundersCarousel() {
  return (
    <div className="px-4 md:px-10 lg:px-16">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-14 text-center md:text-left">
        Los fundadores
      </h2>

      {/* Grid layout: 3 on first row, 2 centered on second row */}
      <div className="flex flex-col gap-12 md:gap-14">
        {/* First row - 3 founders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-x-10 lg:gap-x-12">
          {founders.slice(0, 3).map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>

        {/* Second row - 2 founders centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-10 lg:gap-x-12 max-w-2xl lg:max-w-3xl mx-auto w-full">
          {founders.slice(3, 5).map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FounderCard({ founder }: { founder: Founder }) {
  const isInactive = founder.status === "inactive";
  const statusLabel = isInactive ? "Inactivo" : "Activo";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="group relative rounded-full overflow-hidden mb-5 aspect-square w-48 sm:w-56 md:w-64 lg:w-72 mx-auto focus:outline-none"
        tabIndex={0}
      >
        <Image
          src={founder.image}
          alt={founder.name}
          width={320}
          height={320}
          className={`w-full h-full object-cover scale-110 transition-all duration-500 ease-out group-hover:scale-100 group-hover:blur-sm group-active:scale-100 group-active:blur-sm group-focus:scale-100 group-focus:blur-sm ${
            isInactive
              ? "group-hover:grayscale group-active:grayscale group-focus:grayscale"
              : ""
          }`}
        />
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-full px-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100 group-focus:opacity-100 ${
            isInactive ? "bg-black/65" : "bg-[#2c6e49]/40"
          }`}
        >
          <span className="text-center text-2xl font-semibold text-white">
            {founder.name}
          </span>
          <span
            className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              isInactive
                ? "bg-white/15 text-white ring-1 ring-white/35"
                : "bg-white/90 text-[#2c6e49] ring-1 ring-white/80"
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm md:text-base font-bold text-[#2c6e49]">
        {founder.role}
      </p>
      <p className="mt-2 max-w-xs text-sm md:text-base leading-relaxed text-gray-600">
        {founder.title}
      </p>
    </div>
  );
}
