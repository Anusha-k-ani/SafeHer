import { json, fail, requireUser } from "@/lib/suraksha/http";
import { readRefresh, scheduleAnalysis } from "@/lib/suraksha/refresh";

export async function GET(request: Request) {
  try {
    requireUser(request);
    return json({ ok: true, refresh: readRefresh() });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    if (!["supervisor", "reviewer", "admin"].includes(user.role)) {
      throw new Error("Only authority roles can refresh analysis.");
    }
    const refresh = scheduleAnalysis();
    return json({
      ok: true,
      refresh,
      note:
        refresh.state === "running" || refresh.state === "requested"
          ? "Module 1 is running. Figures on screen stay at the last successful run until this finishes."
          : "Refresh status recorded.",
    });
  } catch (error) {
    return fail(error, 401);
  }
}
