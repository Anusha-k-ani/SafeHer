import { fail, json, requireUser } from "@/lib/suraksha/http";
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
    const body = (await request.json()) as { category?: string; when?: "now" | "past"; occurred_at?: string; description?: string; lat?: number | null; lon?: number | null };
    if (!body.category) throw new Error("Choose an incident type.");
    const report = createReport(user.id, {
      category: body.category,
      when: body.when === "past" ? "past" : "now",
      occurred_at: body.when === "past" && body.occurred_at ? body.occurred_at : new Date().toISOString(),
      description: body.description,
      lat: body.lat ?? null,
      lon: body.lon ?? null,
    });
    return json({ ok: true, report });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { id?: string; status?: IncidentReport["status"] };
    if (!body.id || !body.status) throw new Error("id and status are required");
    return json({ ok: true, report: reviewReport(user, body.id, body.status) });
  } catch (error) {
    return fail(error, 401);
  }
}
