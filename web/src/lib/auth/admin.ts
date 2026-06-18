/**
 * Admin permission helpers
 * Phase 1: Simple role check (only Admin can manage users)
 */

import type { Session } from "next-auth";
import type { UserRole } from "@/lib/types";

/**
 * Check if the current session user has Admin role.
 * Returns false if no session or role is not Admin.
 * Type guard: narrows session to non-null when returns true.
 */
export function isAdmin(session: Session | null): session is Session {
  console.log(`[isAdmin] Checking session:`, {
    hasSession: !!session,
    hasUser: !!session?.user,
    role: session?.user?.role,
    email: session?.user?.email,
  });
  if (!session?.user?.role) {
    console.log(`[isAdmin] No session or role, returning false`);
    return false;
  }
  const result = session.user.role === "Admin";
  console.log(`[isAdmin] Role check result:`, result);
  return result;
}

/**
 * Type guard for TypeScript to narrow session.user.role
 */
export function assertAdmin(session: Session | null): asserts session is Session & { user: { role: "Admin" } } {
  if (!isAdmin(session)) {
    throw new Error("Unauthorized: Admin role required");
  }
}
