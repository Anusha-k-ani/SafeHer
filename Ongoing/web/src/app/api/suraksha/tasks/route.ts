import { fail, json, requireUser } from "@/lib/suraksha/http";
import { advanceTask, createTask, listTasks, listUnits, reassignTask, setUnitAvailability, type PatrolTask, type PatrolUnit } from "@/lib/suraksha/store";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return json({ ok: true, tasks: listTasks(user.role, user.id), units: user.role === "public" ? [] : listUnits() });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { type?: string; unit_id?: string; instruction?: string; district?: string | null; latitude?: number | null; longitude?: number | null; report_id?: string | null };
    if (!body.type || !body.unit_id) throw new Error("type and unit_id are required");
    return json({
      ok: true,
      task: createTask(user, {
        type: body.type,
        unit_id: body.unit_id,
        instruction: body.instruction || "",
        district: body.district ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        report_id: body.report_id ?? null,
      }),
    });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { id?: string; action?: string; status?: PatrolTask["status"]; unit_id?: string; note?: string; availability?: PatrolUnit["availability"] };
    if (body.action === "availability" && body.unit_id && body.availability) {
      return json({ ok: true, unit: setUnitAvailability(user, body.unit_id, body.availability) });
    }
    if (!body.id) throw new Error("id is required");
    if (body.action === "reassign" && body.unit_id) {
      return json({ ok: true, task: reassignTask(user, body.id, body.unit_id) });
    }
    if (!body.status) throw new Error("status is required");
    return json({ ok: true, task: advanceTask(user, body.id, body.status, body.note || "") });
  } catch (error) {
    return fail(error, 401);
  }
}
