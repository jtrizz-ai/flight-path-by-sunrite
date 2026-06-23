import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RoofKnockabilityView } from "@/components/fp/RoofKnockabilityView";

export default async function RoofKnockabilityPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/?error=auth_required");
  }
  return <RoofKnockabilityView />;
}
