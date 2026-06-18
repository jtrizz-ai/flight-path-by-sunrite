import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FlightPathApp } from "@/components/fp/FlightPathApp";

export default async function FlightPathPage() {
  const session = await auth();

  // Auth gate - must be logged in
  if (!session?.user) {
    redirect("/?error=auth_required");
  }

  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";

  return <FlightPathApp userName={userName} userEmail={userEmail} />;
}
