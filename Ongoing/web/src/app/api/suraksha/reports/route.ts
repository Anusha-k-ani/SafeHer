import { fail, json, requireUser } from "@/lib/suraksha/http";
import { scheduleAnalysis } from "@/lib/suraksha/refresh";
import { createReport, listReports, reviewReport, type IncidentReport } from "@/lib/suraksha/store";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return json({ ok: true, reports: listReports(user.role, user.id) });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    if (user.role !== "public" && user.role !== "admin") throw new Error("Public login is required to file a report.");
    const body = (await request.json()) as { category?: string; when?: "now" | "past"; occurred_at?: string; description?: string; lat?: number | null; lon?: number | null; client_id?: string };
    if (!body.category) throw new Error("Choose an incident type.");
    const report = await createReport(user.id, {
      category: body.category,
      when: body.when === "past" ? "past" : "now",
      occurred_at: body.when === "past" && body.occurred_at ? body.occurred_at : new Date().toISOString(),
      description: body.description,
      lat: body.lat ?? null,
      lon: body.lon ?? null,
      client_id: body.client_id,
    });
    scheduleAnalysis();
    return json({ ok: true, report, analysis: "queued" });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { id?: string; status?: IncidentReport["status"]; reason?: string };
    if (!body.id || !body.status) throw new Error("id and status are required");
    const report = reviewReport(user, body.id, body.status, body.reason);
    scheduleAnalysis();
    return json({ ok: true, report, analysis: "queued" });
  } catch (error) {
    return fail(error, 400);
  }
}
