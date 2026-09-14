import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DonatePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center">
      <LoadingSpinner
        size="lg"
        showText={true}
        text="Cargando información del aporte..."
      />
    </div>
  );
}
