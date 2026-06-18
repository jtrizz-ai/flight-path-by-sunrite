import { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/types";

// Adds our internal `id` + `role` to the session user so server components and
// route handlers can read them off `auth()`. (JWT fields are typed locally in
// auth.ts as AppJWT instead of via augmentation, which is more stable.)
// Phase 1: Updated to use the new 5-role system

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}
