import { DefaultSession } from "next-auth";

// Adds our internal `id` + `role` to the session user so server components and
// route handlers can read them off `auth()`. (JWT fields are typed locally in
// auth.ts as AppJWT instead of via augmentation, which is more stable.)

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "member" | "admin";
    } & DefaultSession["user"];
  }
}
