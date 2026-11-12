// Dev-only: the /sync page saves lyric timings here.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("dev only", { status: 403 });
  const body = (await req.json()) as { lines?: unknown };
  if (!Array.isArray(body.lines) || !body.lines.every((t) => t === null || typeof t === "number")) {
    return new Response("bad timings", { status: 400 });
  }
  await writeFile(join(process.cwd(), "src", "lib", "timings.json"), JSON.stringify({ lines: body.lines }, null, 2) + "\n");
  return Response.json({ ok: true, count: body.lines.filter((t) => t !== null).length });
}
