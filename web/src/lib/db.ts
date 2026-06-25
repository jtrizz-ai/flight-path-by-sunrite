import { Pool, type QueryResultRow } from "pg";

// ─────────────────────────────────────────────────────────────────────────
// Postgres connection (REMOTE cluster on the trashcan, over Tailscale).
//
// Only the backend (this Next.js app) talks to the database. Browser and iOS
// code never import this file. Per CLAUDE.md: the front ends never hold DB
// credentials and everything is behind the login gate.
//
// The pool is created lazily on first use so that `next build` (which imports
// route modules to collect metadata but does not run them) does not require
// DATABASE_URL at build time. The real value is injected at runtime via the
// Docker container's env_file.
// ─────────────────────────────────────────────────────────────────────────

const globalForDb = globalThis as unknown as { __flightPathPool?: Pool };

/** Create the shared pool, validating DATABASE_URL on first actual use. */
function getPool(): Pool {
  if (globalForDb.__flightPathPool) return globalForDb.__flightPathPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy web/.env.example to web/.env and point " +
        "it at the trashcan Postgres (100.117.75.7:5432) over Tailscale."
    );
  }

  const created = new Pool({ connectionString, max: 5 });
  // Cache on globalThis so the pool survives Next's module re-evaluation in dev
  // and is reused across requests in production.
  globalForDb.__flightPathPool = created;
  return created;
}

/** Tiny wrapper so call sites can `await query(sql, [params])`. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
) {
  return getPool().query<T>(text, params as unknown[]);
}
