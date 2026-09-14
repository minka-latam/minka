import Image from "next/image";

export function SuccessStory() {
  return (
    <div>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-16 text-center">
        Historia de éxito
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-[400px] md:h-[800px] rounded-2xl overflow-hidden">
          <Image
            src="/about-us/success-case.png"
            alt="Historia de éxito"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="bg-[#478C5C] text-white p-6 md:p-10 flex flex-col justify-between rounded-2xl h-[400px] md:h-[800px]">
          <div className="space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Campaña &ldquo;Agua para todos&rdquo;
            </h3>
            <p className="text-xl md:text-2xl">
              Una comunidad rural en Bolivia logró recaudar fondos para
              construir un sistema de agua potable que beneficia a más de 200
              familias.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-white/80 text-lg md:text-xl">
              Gracias a la plataforma Minka, los organizadores pudieron
              compartir su historia, establecer metas claras y recibir
              aportes de manera transparente. El proyecto se completó en 6
              meses y ahora toda la comunidad tiene acceso a agua limpia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
