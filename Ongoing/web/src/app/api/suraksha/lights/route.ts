import { fail, json, requireUser } from "@/lib/suraksha/http";
import { advanceLight, createLight, listLights, reportLightToPolice, type StreetlightReport } from "@/lib/suraksha/store";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return json({ ok: true, lights: listLights(user.role, user.id) });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    if (user.role !== "public" && user.role !== "admin") throw new Error("Public login is required to report a streetlight.");
    const body = (await request.json()) as { fault?: string; description?: string; lat?: number | null; lon?: number | null };
    if (!body.fault) throw new Error("Choose a fault type.");
    return json({
      ok: true,
      light: createLight(user.id, { fault: body.fault, description: body.description, lat: body.lat ?? null, lon: body.lon ?? null }),
    });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { id?: string; status?: StreetlightReport["status"]; reason?: string; action?: string };
    if (!body.id) throw new Error("id is required");
    if (body.action === "report_to_police") return json({ ok: true, light: reportLightToPolice(user, body.id) });
    if (!body.status) throw new Error("id and status are required");
    return json({ ok: true, light: advanceLight(user, body.id, body.status, body.reason) });
  } catch (error) {
    return fail(error, 401);
  }
}
