import { Pool, type QueryResultRow } from "pg";

// ─────────────────────────────────────────────────────────────────────────
// Postgres connection (REMOTE cluster on the trashcan, over Tailscale).
//
// Only the backend (this Next.js app) talks to the database. Browser and iOS
// code never import this file. Per CLAUDE.md: the front ends never hold DB
// credentials and everything is behind the login gate.
// ─────────────────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy web/.env.example to web/.env and point " +
      "it at the trashcan Postgres (100.117.75.7:5432) over Tailscale."
  );
}

// Reuse a single pool across hot-reloads in dev (Next recreates modules often).
const globalForDb = globalThis as unknown as { __flightPathPool?: Pool };

export const pool: Pool =
  globalForDb.__flightPathPool ??
  new Pool({ connectionString, max: 5 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__flightPathPool = pool;
}

/** Tiny wrapper so call sites can `await query(sql, [params])`. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
) {
  return pool.query<T>(text, params as unknown[]);
}
