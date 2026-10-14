import { fail, json, requireUser } from "@/lib/suraksha/http";
import { listAudit, listNotices, overview } from "@/lib/suraksha/store";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    return json({
      ok: true,
      notices: listNotices(user.id),
      audit: listAudit(user.role),
      overview: user.role === "public" || user.role === "patrol" ? null : overview(),
    });
  } catch (error) {
    return fail(error, 401);
  }
}
