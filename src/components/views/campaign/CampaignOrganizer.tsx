import { MapPin, Calendar, Award } from "lucide-react";
import { getRegionDisplayName, Region } from "@/lib/region-utils";

interface CampaignOrganizerProps {
  name: string;
  role: string;
  location: Region;
  memberSince: string;
  successfulCampaigns: number;
  bio: string;
}

export function CampaignOrganizer({
  name,
  role,
  location,
  memberSince,
  successfulCampaigns,
  bio,
}: CampaignOrganizerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-[#e8f0e9] flex items-center justify-center">
          <span className="text-lg font-medium text-[#2c6e49]">{name[0]}</span>
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{getRegionDisplayName(location)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Miembro desde {memberSince}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Award className="h-4 w-4" />
          <span>
            {successfulCampaigns === 1
              ? "1 campaña"
              : `${successfulCampaigns} campañas`}
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Biografía</h4>
        <p className="text-sm text-gray-600">{bio}</p>
      </div>
    </div>
  );
}
