import { auth } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { FlightPathApp } from "@/components/fp/FlightPathApp";

export default async function FlightPathPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/?error=auth_required");
  }

  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";

  // Fetch visible Notion pages for the Schedule/Library view.
  const { rows: pageRows } = await query<{
    slug: string;
    title: string;
    icon: string | null;
  }>(
    `SELECT slug, title, icon
     FROM notion_pages
     WHERE is_hidden = false
     ORDER BY title ASC`
  );

  return <FlightPathApp userName={userName} userEmail={userEmail} pages={pageRows} />;
}
