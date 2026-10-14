import { fail, json, requireUser } from "@/lib/suraksha/http";
import { advanceSos, assignSos, createSos, listSos, type SosAlert } from "@/lib/suraksha/store";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return json({ ok: true, alerts: listSos(user.role, user.id) });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    if (user.role !== "public" && user.role !== "admin") throw new Error("Public login is required for SOS.");
    const body = (await request.json()) as { lat?: number | null; lon?: number | null };
    return json({ ok: true, alert: createSos(user.id, body.lat ?? null, body.lon ?? null) });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { id?: string; action?: string; unit_id?: string; status?: SosAlert["status"] };
    if (!body.id) throw new Error("id is required");
    if (body.action === "assign") {
      if (!body.unit_id) throw new Error("unit_id is required");
      return json({ ok: true, ...assignSos(user, body.id, body.unit_id) });
    }
    if (!body.status) throw new Error("status is required");
    return json({ ok: true, alert: advanceSos(user, body.id, body.status) });
  } catch (error) {
    return fail(error, 401);
  }
}
