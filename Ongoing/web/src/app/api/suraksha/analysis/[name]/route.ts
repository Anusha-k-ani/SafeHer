import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED = new Set([
  "summary",
  "hotspots",
  "alerts",
  "areas",
  "geography",
  "street_stats",
  "temporal",
  "coverage",
  "method_compare",
]);

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!ALLOWED.has(name)) {
    return NextResponse.json({ error: "Unknown analysis product" }, { status: 404 });
  }
  const file = path.join(process.cwd(), "..", "Module1_Analysis", "output", `${name}.json`);
  const fallback = path.join(process.cwd(), "public", "data", "analysis", `${name}.json`);
  const target = existsSync(file) ? file : fallback;
  if (!existsSync(target)) {
    return NextResponse.json({ error: "Analysis file is not available" }, { status: 404 });
  }
  const body = readFileSync(target, "utf8");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
