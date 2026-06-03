import { Suspense } from "react";
import { DonatePageContent, DonatePageLoading } from "./client";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Apoyar campaña | ${id}`,
    description: "Realiza una donación a esta campaña",
  };
}

// Server component as async function
export default async function DonatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DonatePageLoading />}>
      <DonatePageContent campaignId={id} />
    </Suspense>
  );
}
