import assert from "node:assert/strict";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { matchDistrict, moveLight, moveSos, moveTask } from "../src/lib/suraksha/domain";

process.env.SURAKSHA_STORE = path.join(mkdtempSync(path.join(tmpdir(), "suraksha-")), "store.json");

async function main() {
const { authenticate } = await import("../src/lib/suraksha/auth");
const store = await import("../src/lib/suraksha/store");

const outside = matchDistrict(1, 1, [{ district: "Kolar", latitude: 13.1, longitude: 78.1 }]);
assert.equal(outside.match_status, "outside_karnataka");
assert.equal(outside.street_id, null);

const missing = matchDistrict(null, null, []);
assert.equal(missing.match_status, "missing");

const near = matchDistrict(13.14, 78.13, [{ district: "Kolar", latitude: 13.1, longitude: 78.1 }]);
assert.equal(near.district, "Kolar");
assert.equal(near.match_status, "district_only");
assert.equal(near.street_id, null);

assert.throws(() => moveSos("resolved", "created"));
assert.throws(() => moveTask("completed", "notified"));
assert.throws(() => moveLight("verified_closed", "reported"));

assert.equal(authenticate("citizen", "suraksha-demo")?.role, "public");
assert.equal(authenticate("patrol", "wrong"), null);

const citizen = { id: "u-citizen", role: "public" as const };
const patrol = { id: "u-patrol", role: "patrol" as const };
const municipal = { id: "u-municipal", role: "municipal" as const };
const reviewer = { id: "u-reviewer", role: "reviewer" as const };
const supervisor = { id: "u-supervisor", role: "supervisor" as const };

const report = store.createReport(citizen.id, {
  category: "Stalking or being followed",
  when: "now",
  occurred_at: new Date().toISOString(),
  lat: 17.33,
  lon: 76.83,
});
assert.ok(report.id.startsWith("INC-"));
assert.equal(store.listReports("municipal", municipal.id).length, 0);
assert.equal(store.listReports("public", "someone-else").length, 0);
assert.throws(() => store.reviewReport(patrol, report.id, "verified"));
store.reviewReport(reviewer, report.id, "under_review");
assert.equal(store.listReports("reviewer", reviewer.id)[0].status, "under_review");

const sos = store.createSos(citizen.id, null, null);
assert.equal(sos.status, "location_unavailable");
assert.match(sos.user_message, /112/);
assert.throws(() => store.assignSos(patrol, sos.id, "unit-demo-kalaburagi"));

const placed = store.createSos(citizen.id, 17.33, 76.83);
assert.equal(placed.status, "notification_attempted");
assert.equal(placed.simulated_dispatch, true);
const assigned = store.assignSos(supervisor, placed.id, "unit-demo-kalaburagi");
assert.equal(assigned.alert.status, "unit_assigned");
assert.equal(assigned.task.status, "notified");
store.advanceTask(patrol, assigned.task.id, "acknowledged", "seen");
assert.throws(() => store.advanceTask(patrol, assigned.task.id, "cancelled", "no"));
assert.throws(() => store.createTask(municipal, { type: "Patrol", unit_id: "unit-demo-kalaburagi", instruction: "", district: null, latitude: null, longitude: null, report_id: null }));

const light = store.createLight(citizen.id, { fault: "Streetlight not working", lat: 17.33, lon: 76.83 });
assert.throws(() => store.advanceLight(municipal, light.id, "forwarded"));
store.advanceLight(reviewer, light.id, "under_review");
store.advanceLight(reviewer, light.id, "forwarded");
store.advanceLight(municipal, light.id, "accepted");
store.advanceLight(municipal, light.id, "work_assigned");
store.advanceLight(municipal, light.id, "repair_in_progress");
store.advanceLight(municipal, light.id, "repair_completed");
assert.throws(() => store.advanceLight(municipal, light.id, "verified_closed"));
store.advanceLight(reviewer, light.id, "awaiting_verification");
assert.equal(store.advanceLight(supervisor, light.id, "verified_closed").status, "verified_closed");
const handed = store.createLight(citizen.id, { fault: "Streetlight flickering", lat: 17.33, lon: 76.83 });
assert.equal(store.reportLightToPolice(municipal, handed.id).status, "awaiting_verification");
assert.throws(() => store.reportLightToPolice(patrol, handed.id));
assert.ok(store.listNotices("u-supervisor").some((n) => n.body.includes(handed.id)));

const notices = store.listNotices(citizen.id);
assert.ok(notices.every((n) => n.delivery === "simulated_not_sent_to_a_phone"));
assert.ok(store.listAudit("supervisor").length > 0);
assert.equal(store.listAudit("public").length, 0);

console.log("suraksha-check ok");
}

main();
