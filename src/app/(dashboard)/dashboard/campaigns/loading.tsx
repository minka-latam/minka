import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CampaignsLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <LoadingSpinner size="lg" />
    </div>
  );
}
