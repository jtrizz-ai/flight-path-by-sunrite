/**
 * Notion Sync API (admin only)
 *
 * POST /api/sync -> runs the node-worker manual crawl, then refreshes
 *                   sync_meta and returns the new page count + timestamp.
 *
 * The worker is spawned as a child process in `manual` mode. It loads its own
 * env from node-worker/.env and writes results to the shared Postgres DB.
 * Configure its location with NODE_WORKER_DIR (default: ../node-worker).
 */

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "node:path";
import fs from "node:fs";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYNC_TIMEOUT_MS = 4 * 60 * 1000;

function runWorkerOnce(): Promise<{ code: number; stderr: string }> {
  const workerDir =
    process.env.NODE_WORKER_DIR ||
    path.resolve(process.cwd(), "..", "node-worker");
  // Built at runtime (not a string literal) so the bundler doesn't try to
  // resolve it as a module.
  const workerScript = ["dist", "index.js"].join("/");
  const distEntry = path.join(workerDir, "dist", "index.js");

  if (!fs.existsSync(distEntry)) {
    return Promise.reject(
      new Error(
        "node-worker is not built. Run `npm run build` inside the node-worker folder, then try again."
      )
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn("node", [workerScript], {
      cwd: workerDir,
      env: { ...process.env, WORKER_MODE: "manual" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Sync timed out after 4 minutes."));
    }, SYNC_TIMEOUT_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stderr });
    });
  });
}

export async function POST() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const result = await runWorkerOnce();
    if (result.code !== 0) {
      console.error("[api/sync] worker exit code", result.code, result.stderr);
      return NextResponse.json(
        { error: "Crawler did not finish cleanly. Check the server logs." },
        { status: 502 }
      );
    }

    const total = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM notion_pages`
    );
    const totalPages = Number(total.rows[0]?.count ?? 0);

    await query(
      `INSERT INTO sync_meta (id, last_sync, page_count)
       VALUES (1, now(), $1)
       ON CONFLICT (id) DO UPDATE SET last_sync = now(), page_count = $1`,
      [totalPages]
    );

    const last = await query<{ last_sync: string | null }>(
      `SELECT last_sync FROM sync_meta WHERE id = 1`
    );

    return NextResponse.json({
      ok: true,
      totalPages,
      lastSync: last.rows[0]?.last_sync ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[api/sync] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
