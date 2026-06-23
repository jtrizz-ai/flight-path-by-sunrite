import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LevelsView } from "@/components/fp/LevelsView";

export default async function LevelsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/?error=auth_required");
  }
  return <LevelsView />;
}
