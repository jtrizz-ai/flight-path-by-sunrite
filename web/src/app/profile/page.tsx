import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/fp/ProfileForm";

// Force this page to be dynamic so the session is always read fresh.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-fp-bg)", color: "var(--color-fp-ink)" }}
    >
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1
          className="text-4xl uppercase tracking-tight"
          style={{ fontFamily: "var(--font-fp-display)" }}
        >
          Profile
        </h1>
        <p
          className="mt-2 text-xs uppercase tracking-[0.2em]"
          style={{
            fontFamily: "var(--font-fp-mono)",
            color: "var(--color-fp-ink-3)",
          }}
        >
          {session.user.email}
        </p>
        <div className="mt-10">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}
