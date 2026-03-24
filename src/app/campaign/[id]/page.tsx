import { Suspense } from "react";
import { notFound } from "next/navigation";
import Loading from "./loading";
import CampaignClientPage from "@/components/views/campaign/CampaignClientPage";

// Server component that passes the campaign ID to the client component
export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  if (!id) {
    console.error("Server: Campaign ID is required but not provided");
    return notFound();
  }

  // Use Suspense to show loading state while client component fetches data
  return (
    <div className="flex flex-col min-h-screen overflow-wrap break-words">
      <Suspense fallback={<Loading />}>
        <CampaignClientPage id={id} />
      </Suspense>
    </div>
  );
}
