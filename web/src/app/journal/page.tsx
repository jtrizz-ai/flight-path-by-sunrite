import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DailyJournalView } from "@/components/fp/DailyJournalView";

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/?error=auth_required");
  }
  return <DailyJournalView />;
}
