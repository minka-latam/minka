import { redirect } from "next/navigation";

export default function LegacyVerificationRequestsPage() {
  redirect("/dashboard/verification");
}
