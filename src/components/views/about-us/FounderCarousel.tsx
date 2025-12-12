import Image from "next/image";

interface Founder {
  id: string;
  image: string;
  name: string;
  role: string;
}

const founders: Founder[] = [
  {
    id: "founder-1",
    image: "/founders/Kurt Guardia.png",
    name: "Kurt Guardia Gamarra",
    role: "Co-fundador",
  },
  {
    id: "founder-2",
    image: "/founders/Florence Hugard.png",
    name: "Florence Hugard",
    role: "Co-fundadora",
  },
  {
    id: "founder-3",
    image: "/founders/Marco Herbas.png",
    name: "Marco Herbas",
    role: "Co-fundador",
  },
  {
    id: "founder-4",
    image: "/founders/Carolina Orias.jpeg",
    name: "Carolina Arias",
    role: "Co-fundadora",
  },
  {
    id: "founder-5",
    image: "/founders/Leonor Revollo.jpeg",
    name: "Leonor Revollo",
    role: "Co-fundadora",
  },
];

export function FoundersCarousel() {
  return (
    <div className="px-4 md:px-16">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-16 text-center md:text-left">
        Los fundadores
      </h2>

      {/* Grid layout: 3 on first row, 2 centered on second row */}
      <div className="flex flex-col gap-8 md:gap-12">
        {/* First row - 3 founders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {founders.slice(0, 3).map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>

        {/* Second row - 2 founders centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-10 max-w-2xl lg:max-w-3xl mx-auto w-full">
          {founders.slice(3, 5).map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FounderCard({ founder }: { founder: Founder }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl overflow-hidden mb-4 md:mb-6 aspect-[2/3] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[350px] mx-auto shadow-md hover:shadow-lg transition-shadow duration-300">
        <Image
          src={founder.image}
          alt={founder.name}
          width={400}
          height={600}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center">
        <p className="text-sm md:text-base text-gray-600 mb-1 md:mb-2">
          {founder.role}
        </p>
        <h3 className="font-medium text-lg sm:text-xl md:text-2xl">{founder.name}</h3>
      </div>
    </div>
  );
}
