import Image from "next/image";

interface Founder {
  id: string;
  image: string;
  name: string;
}

const founders: Founder[] = [
  {
    id: "founder-1",
    image: "/founders/Kurt Guardia.png",
    name: "Kurt Guardia",
  },
  {
    id: "founder-2",
    image: "/founders/Florence Hugard.png",
    name: "Florence Hugard",
  },
  {
    id: "founder-3",
    image: "/founders/Marco Herbas.png",
    name: "Marco Herbas",
  },
  {
    id: "founder-4",
    image: "/founders/Carolina Orias.jpeg",
    name: "Carolina Orias",
  },
  {
    id: "founder-5",
    image: "/founders/Leonor Revollo.jpeg",
    name: "Leonor Revollo",
  },
];

export function FoundersCarousel() {
  return (
    <div className="px-4 md:px-16">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-16 text-center md:text-left">
        Los fundadores
      </h2>

      {/* Grid layout: 3 on first row, 2 centered on second row */}
      <div className="flex flex-col gap-10 md:gap-14">
        {/* First row - 3 founders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {founders.slice(0, 3).map((founder) => (
            <FounderCard key={founder.id} founder={founder} />
          ))}
        </div>

        {/* Second row - 2 founders centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10 lg:gap-12 max-w-2xl lg:max-w-3xl mx-auto w-full">
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
      <div
        className="group relative rounded-full overflow-hidden mb-4 md:mb-6 aspect-square w-48 sm:w-60 md:w-72 lg:w-80 mx-auto focus:outline-none"
        tabIndex={0}
      >
        <Image
          src={founder.image}
          alt={founder.name}
          width={320}
          height={320}
          className="w-full h-full object-cover scale-110 transition-all duration-500 ease-out group-hover:scale-100 group-hover:blur-sm group-active:scale-100 group-active:blur-sm group-focus:scale-100 group-focus:blur-sm"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#2c6e49]/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100 group-focus:opacity-100">
          <span className="px-5 text-center text-2xl font-semibold text-white">
            {founder.name}
          </span>
        </div>
      </div>
      <div className="text-center lg:hidden">
        <h3 className="font-medium text-lg sm:text-xl md:text-2xl">
          {founder.name}
        </h3>
      </div>
    </div>
  );
}
