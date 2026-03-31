import Link from "next/link"
import { Check, Clock, Award } from "lucide-react"

interface CampaignDetailsProps {
  organizer: {
    name: string
    role: string
    location: string
    memberSince: string
    successfulCampaigns: number
    bio: string
  }
  description: string
}

export function CampaignDetails({ organizer, description }: CampaignDetailsProps) {
  return (
    <div className="space-y-8">
      {/* Organizer Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center">
          <span className="text-sm font-medium text-[#2c6e49]">
            {organizer.name[0]}
          </span>
        </div>
        <div>
          <h3 className="font-medium">{organizer.name}</h3>
          <p className="text-sm text-gray-600">
            {organizer.role} | {organizer.location}
          </p>
        </div>
      </div>

      {/* Verification Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-[#2c6e49]" />
          <span className="text-[#2c6e49]">Campaña verificada por Minka</span>
        </div>
        <Link href="#" className="text-sm text-[#2c6e49] underline">
          Más información sobre la verificación
        </Link>
      </div>

      {/* Campaign Description */}
      <div className="space-y-4 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49]">
          Descripción de la campaña
        </h2>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>

      {/* About Organizer */}
      <div className="space-y-6 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49]">
          Sobre el organizador
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center">
            <span className="text-sm font-medium text-[#2c6e49]">
              {organizer.name[0]}
            </span>
          </div>
          <div>
            <h3 className="font-medium">{organizer.name}</h3>
            <p className="text-sm text-gray-600">
              Gestor de campaña | {organizer.location}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Tiempo en la plataforma</span>
          </div>
          <p className="pl-6">Miembro desde {organizer.memberSince}</p>

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Otras campañas</span>
          </div>
          <p className="pl-6">
            {organizer.successfulCampaigns} campañas exitosas
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Biografía</h4>
          <p className="text-gray-700">{organizer.bio}</p>
        </div>
      </div>
    </div>
  );
}

