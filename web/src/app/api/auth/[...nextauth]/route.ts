import { handlers } from "@/auth";

// Mounts the Auth.js (NextAuth) GET/POST handlers at /api/auth/*.
// Google's OAuth callback hits /api/auth/callback/google (registered in Google Cloud).
export const { GET, POST } = handlers;
