import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  canCommandPatrol,
  canManageLights,
  canReviewIncidents,
  canVerifyRepair,
  matchDistrict,
  moveLight,
  moveSos,
  moveTask,
  type DistrictPoint,
  type LightStatus,
  type LocationFix,
  type Role,
  type SosStatus,
  type TaskStatus,
} from "./domain";

export type IncidentReport = {
  id: string;
  owner_id: string;
  category: string;
  when: "now" | "past";
  occurred_at: string;
  description: string;
  location: LocationFix;
  status: "submitted" | "under_review" | "verified" | "flagged";
  simulated: false;
  created_at: string;
};

export type SosAlert = {
  id: string;
  owner_id: string;
  status: SosStatus;
  location: LocationFix;
  suggested_unit_id: string | null;
  assigned_unit_id: string | null;
  simulated_dispatch: true;
  user_message: string;
  created_at: string;
  updated_at: string;
};

export type PatrolUnit = {
  id: string;
  name: string;
  district: string;
  member_user_id: string;
  availability: "available" | "assigned" | "unavailable";
  simulated: true;
  location_status: "unavailable";
  location_note: string;
};

export type PatrolTask = {
  id: string;
  type: string;
  status: TaskStatus;
  unit_id: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  instruction: string;
  sos_id: string | null;
  report_id: string | null;
  history: { at: string; by: string; status: TaskStatus; note: string }[];
  created_at: string;
};

export type StreetlightReport = {
  id: string;
  owner_id: string;
  fault: string;
  description: string;
  location: LocationFix;
  status: LightStatus;
  rejection_reason: string | null;
  simulated_referral: true;
  created_at: string;
  updated_at: string;
};

export type Notice = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  delivery: "simulated_not_sent_to_a_phone";
  created_at: string;
  read: boolean;
};

export type Audit = { id: string; at: string; actor_id: string; action: string; target: string; detail: string };

type Db = {
  reports: IncidentReport[];
  sos: SosAlert[];
  units: PatrolUnit[];
  tasks: PatrolTask[];
  lights: StreetlightReport[];
  notices: Notice[];
  audit: Audit[];
  seq: number;
};

function filePath(): string {
  return process.env.SURAKSHA_STORE || path.join(process.cwd(), "data", "suraksha-store.json");
}

function empty(): Db {
  return {
    reports: [],
    sos: [],
    units: [
      {
        id: "unit-demo-kalaburagi",
        name: "Demo patrol unit",
        district: "Kalaburagi",
        member_user_id: "u-patrol",
        availability: "available",
        simulated: true,
        location_status: "unavailable",
        location_note: "Simulated unit for the presentation. No live GPS position is stored.",
      },
    ],
    tasks: [],
    lights: [],
    notices: [],
    audit: [],
    seq: 1,
  };
}

function load(): Db {
  const file = filePath();
  if (!existsSync(file)) return empty();
  return JSON.parse(readFileSync(file, "utf8")) as Db;
}

function save(db: Db) {
  const file = filePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(db, null, 2));
}

function nextId(db: Db, prefix: string): string {
  const id = `${prefix}-${String(db.seq).padStart(4, "0")}`;
  db.seq += 1;
  return id;
}

function audit(db: Db, actor: string, action: string, target: string, detail: string) {
  db.audit.unshift({ id: nextId(db, "AUD"), at: new Date().toISOString(), actor_id: actor, action, target, detail });
}

function notify(db: Db, userId: string, title: string, body: string) {
  db.notices.unshift({
    id: nextId(db, "NTF"),
    user_id: userId,
    title,
    body,
    delivery: "simulated_not_sent_to_a_phone",
    created_at: new Date().toISOString(),
    read: false,
  });
}

let districtsCache: DistrictPoint[] | null = null;

export function districtPoints(): DistrictPoint[] {
  if (districtsCache) return districtsCache;
  const file = path.join(process.cwd(), "..", "Module1_Analysis", "input", "osm_districts.json");
  if (!existsSync(file)) return [];
  const pack = JSON.parse(readFileSync(file, "utf8")) as { districts?: { district: string; latitude: number; longitude: number }[] };
  districtsCache = (pack.districts || []).map((d) => ({
    district: d.district,
    latitude: d.latitude,
    longitude: d.longitude,
  }));
  return districtsCache;
}

const hits = new Map<string, number[]>();

function rateOk(key: string): boolean {
  const now = Date.now();
  const window = (hits.get(key) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (window.length >= 20) return false;
  window.push(now);
  hits.set(key, window);
  return true;
}

export function createReport(ownerId: string, input: { category: string; when: "now" | "past"; occurred_at: string; description?: string; lat: number | null; lon: number | null }): IncidentReport {
  if (!rateOk(ownerId)) throw new Error("Too many submissions this hour.");
  const db = load();
  const row: IncidentReport = {
    id: nextId(db, "INC"),
    owner_id: ownerId,
    category: input.category,
    when: input.when,
    occurred_at: input.occurred_at,
    description: (input.description || "").slice(0, 500),
    location: matchDistrict(input.lat, input.lon, districtPoints()),
    status: "submitted",
    simulated: false,
    created_at: new Date().toISOString(),
  };
  db.reports.unshift(row);
  notify(db, ownerId, "Report received", `${row.id} is submitted. This is an in-app record, not a police FIR.`);
  for (const id of ["u-supervisor", "u-reviewer"]) {
    notify(db, id, "New incident report", `${row.id}  -  ${row.category}`);
  }
  audit(db, ownerId, "report.create", row.id, row.category);
  save(db);
  return row;
}

export function listReports(role: Role, userId: string): IncidentReport[] {
  const db = load();
  if (role === "public" || role === "patrol") return db.reports.filter((r) => r.owner_id === userId);
  if (role === "municipal") return [];
  return db.reports;
}

export function reviewReport(actor: { id: string; role: Role }, id: string, status: IncidentReport["status"]) {
  if (!canReviewIncidents(actor.role)) throw new Error("Not allowed to review incidents.");
  const db = load();
  const row = db.reports.find((r) => r.id === id);
  if (!row) throw new Error("Report not found.");
  const allowed: Record<IncidentReport["status"], IncidentReport["status"][]> = {
    submitted: ["under_review", "flagged"],
    under_review: ["verified", "flagged"],
    verified: [],
    flagged: ["under_review"],
  };
  if (!allowed[row.status].includes(status)) throw new Error(`Cannot move from ${row.status} to ${status}`);
  row.status = status;
  audit(db, actor.id, "report.review", id, status);
  notify(db, row.owner_id, "Report status", `${id} is now ${status.replaceAll("_", " ")}.`);
  save(db);
  return row;
}

export function createSos(ownerId: string, lat: number | null, lon: number | null): SosAlert {
  if (!rateOk(`sos:${ownerId}`)) throw new Error("Too many SOS attempts this hour.");
  const db = load();
  const location = matchDistrict(lat, lon, districtPoints());
  let status: SosStatus = "created";
  let message = "Alert saved in this demonstration system. No live police control room was contacted.";
  if (location.match_status === "missing") {
    status = moveSos(status, "location_unavailable");
    message = "Alert saved, but location is missing. Call 112. This app did not contact a police control room.";
  } else {
    status = moveSos(status, "notification_attempted");
    message = "A demonstration notification was recorded for the authority inbox. No phone was sent a message, and no live dispatch system was contacted.";
  }
  const unit = db.units.find((u) => u.availability === "available" && u.district === location.district) || null;
  const row: SosAlert = {
    id: nextId(db, "SOS"),
    owner_id: ownerId,
    status,
    location,
    suggested_unit_id: unit?.id ?? null,
    assigned_unit_id: null,
    simulated_dispatch: true,
    user_message: message,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.sos.unshift(row);
  notify(db, ownerId, "SOS status", message);
  notify(db, "u-supervisor", "SOS alert", `${row.id}  -  simulated dispatch  -  ${location.district || "location missing"}`);
  if (unit) notify(db, unit.member_user_id, "SOS in your district", `${row.id} is waiting for a supervisor assignment.`);
  audit(db, ownerId, "sos.create", row.id, status);
  save(db);
  return row;
}

export function listSos(role: Role, userId: string): SosAlert[] {
  const db = load();
  if (role === "public") return db.sos.filter((s) => s.owner_id === userId);
  if (role === "municipal") return [];
  if (role === "patrol") {
    const mine = db.units.filter((u) => u.member_user_id === userId).map((u) => u.id);
    return db.sos.filter((s) => (s.assigned_unit_id && mine.includes(s.assigned_unit_id)) || (s.suggested_unit_id && mine.includes(s.suggested_unit_id)));
  }
  return db.sos;
}

export function assignSos(actor: { id: string; role: Role }, sosId: string, unitId: string) {
  if (!canCommandPatrol(actor.role)) throw new Error("Only a supervisor can assign a patrol unit.");
  const db = load();
  const alert = db.sos.find((s) => s.id === sosId);
  const unit = db.units.find((u) => u.id === unitId);
  if (!alert || !unit) throw new Error("Alert or unit not found.");
  if (unit.availability === "unavailable") throw new Error("That unit is unavailable.");
  if (alert.status === "location_unavailable" || alert.status === "notification_failed" || alert.status === "created") {
    if (alert.status === "notification_failed" || alert.status === "created") {
      alert.status = moveSos(alert.status, "notification_attempted");
    } else {
      alert.status = moveSos("location_unavailable", "notification_attempted");
    }
  }
  if (alert.status === "escalated") alert.status = moveSos("escalated", "acknowledged");
  if (alert.status === "notification_attempted") alert.status = moveSos("notification_attempted", "acknowledged");
  alert.status = moveSos(alert.status, "unit_assigned");
  alert.assigned_unit_id = unit.id;
  alert.updated_at = new Date().toISOString();
  unit.availability = "assigned";
  const task: PatrolTask = {
    id: nextId(db, "TSK"),
    type: "Respond to SOS",
    status: "notified",
    unit_id: unit.id,
    district: alert.location.district,
    latitude: alert.location.latitude,
    longitude: alert.location.longitude,
    instruction: "Demonstration assignment. This is not a live dispatch order.",
    sos_id: alert.id,
    report_id: null,
    history: [{ at: new Date().toISOString(), by: actor.id, status: "notified", note: "Supervisor assignment" }],
    created_at: new Date().toISOString(),
  };
  task.history.unshift({ at: task.created_at, by: actor.id, status: "created", note: "created" });
  db.tasks.unshift(task);
  notify(db, unit.member_user_id, "Assignment", `${task.id}  -  Respond to ${alert.id}. Simulated notification only.`);
  notify(db, alert.owner_id, "SOS update", `${alert.id} has a demonstration unit assignment. A real patrol has not been confirmed on the road.`);
  audit(db, actor.id, "sos.assign", alert.id, unit.id);
  save(db);
  return { alert, task };
}

export function advanceSos(actor: { id: string; role: Role }, sosId: string, to: SosStatus) {
  const db = load();
  const alert = db.sos.find((s) => s.id === sosId);
  if (!alert) throw new Error("Alert not found.");
  const patrolOwns = db.units.some((u) => u.member_user_id === actor.id && u.id === alert.assigned_unit_id);
  if (actor.role === "patrol" && !patrolOwns) throw new Error("This alert is not assigned to you.");
  if (actor.role !== "patrol" && !canCommandPatrol(actor.role)) throw new Error("Not allowed.");
  alert.status = moveSos(alert.status, to);
  alert.updated_at = new Date().toISOString();
  if (to === "resolved" && alert.assigned_unit_id) {
    const unit = db.units.find((u) => u.id === alert.assigned_unit_id);
    if (unit) unit.availability = "available";
  }
  audit(db, actor.id, "sos.status", sosId, to);
  notify(db, alert.owner_id, "SOS update", `${sosId} is now ${to.replaceAll("_", " ")}.`);
  save(db);
  return alert;
}

export function listUnits(): PatrolUnit[] {
  return load().units;
}

export function setUnitAvailability(actor: { id: string; role: Role }, unitId: string, availability: PatrolUnit["availability"]) {
  const db = load();
  const unit = db.units.find((u) => u.id === unitId);
  if (!unit) throw new Error("Unit not found.");
  const self = actor.role === "patrol" && unit.member_user_id === actor.id;
  if (!self && !canCommandPatrol(actor.role)) throw new Error("Not allowed to change this unit.");
  unit.availability = availability;
  audit(db, actor.id, "unit.availability", unitId, availability);
  save(db);
  return unit;
}

export function createTask(actor: { id: string; role: Role }, input: { type: string; unit_id: string; instruction: string; district: string | null; latitude: number | null; longitude: number | null; report_id: string | null }) {
  if (!canCommandPatrol(actor.role)) throw new Error("Only a supervisor can create patrol tasks.");
  const db = load();
  const unit = db.units.find((u) => u.id === input.unit_id);
  if (!unit) throw new Error("Unit not found.");
  const task: PatrolTask = {
    id: nextId(db, "TSK"),
    type: input.type,
    status: "notified",
    unit_id: unit.id,
    district: input.district,
    latitude: input.latitude,
    longitude: input.longitude,
    instruction: input.instruction.slice(0, 300),
    sos_id: null,
    report_id: input.report_id,
    history: [
      { at: new Date().toISOString(), by: actor.id, status: "created", note: "created" },
      { at: new Date().toISOString(), by: actor.id, status: "notified", note: "notified" },
    ],
    created_at: new Date().toISOString(),
  };
  unit.availability = "assigned";
  db.tasks.unshift(task);
  notify(db, unit.member_user_id, "New task", `${task.id}  -  ${task.type}. Simulated notification only.`);
  audit(db, actor.id, "task.create", task.id, task.type);
  save(db);
  return task;
}

export function listTasks(role: Role, userId: string): PatrolTask[] {
  const db = load();
  if (role === "municipal" || role === "public") return [];
  if (role === "patrol") {
    const mine = db.units.filter((u) => u.member_user_id === userId).map((u) => u.id);
    return db.tasks.filter((t) => t.unit_id && mine.includes(t.unit_id));
  }
  return db.tasks;
}

export function advanceTask(actor: { id: string; role: Role }, taskId: string, to: TaskStatus, note: string) {
  const db = load();
  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found.");
  const unit = db.units.find((u) => u.id === task.unit_id);
  const self = actor.role === "patrol" && unit?.member_user_id === actor.id;
  if (!self && !canCommandPatrol(actor.role)) throw new Error("Not allowed to update this task.");
  if (actor.role === "patrol" && ["reassigned", "cancelled", "escalated"].includes(to)) {
    throw new Error("A patrol account cannot reassign or cancel.");
  }
  const previousUnit = task.unit_id;
  task.status = moveTask(task.status, to);
  task.history.unshift({ at: new Date().toISOString(), by: actor.id, status: to, note: note.slice(0, 200) });
  if ((to === "completed" || to === "cancelled" || to === "declined") && unit) unit.availability = "available";
  if (to === "unavailable" && unit) unit.availability = "unavailable";
  audit(db, actor.id, "task.status", taskId, `${previousUnit || ""} ${to}`);
  save(db);
  return task;
}

export function reassignTask(actor: { id: string; role: Role }, taskId: string, unitId: string) {
  if (!canCommandPatrol(actor.role)) throw new Error("Only a supervisor can reassign.");
  const db = load();
  const task = db.tasks.find((t) => t.id === taskId);
  const unit = db.units.find((u) => u.id === unitId);
  if (!task || !unit) throw new Error("Task or unit not found.");
  const previous = db.units.find((u) => u.id === task.unit_id);
  if (task.status !== "reassigned") task.status = moveTask(task.status, "reassigned");
  task.status = moveTask("reassigned", "unit_selected");
  task.status = moveTask(task.status, "notified");
  task.unit_id = unit.id;
  task.history.unshift({ at: new Date().toISOString(), by: actor.id, status: "notified", note: `Reassigned from ${previous?.id || "none"} to ${unit.id}` });
  if (previous) previous.availability = "available";
  unit.availability = "assigned";
  notify(db, unit.member_user_id, "Reassignment", `${task.id} is now yours. Simulated notification only.`);
  audit(db, actor.id, "task.reassign", taskId, unit.id);
  save(db);
  return task;
}

export function createLight(ownerId: string, input: { fault: string; description?: string; lat: number | null; lon: number | null }): StreetlightReport {
  if (!rateOk(`light:${ownerId}`)) throw new Error("Too many submissions this hour.");
  const db = load();
  const row: StreetlightReport = {
    id: nextId(db, "LGT"),
    owner_id: ownerId,
    fault: input.fault,
    description: (input.description || "").slice(0, 500),
    location: matchDistrict(input.lat, input.lon, districtPoints()),
    status: "reported",
    rejection_reason: null,
    simulated_referral: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.lights.unshift(row);
  notify(db, ownerId, "Streetlight report", `${row.id} is recorded. A municipality has not been contacted yet.`);
  notify(db, "u-reviewer", "Streetlight report", row.id);
  notify(db, "u-supervisor", "Streetlight report", row.id);
  audit(db, ownerId, "light.create", row.id, input.fault);
  save(db);
  return row;
}

export function listLights(role: Role, userId: string): StreetlightReport[] {
  const db = load();
  if (role === "public") return db.lights.filter((l) => l.owner_id === userId);
  if (role === "patrol") return [];
  if (canManageLights(role)) return db.lights;
  return [];
}

export function advanceLight(actor: { id: string; role: Role }, id: string, to: LightStatus, reason?: string) {
  const db = load();
  const row = db.lights.find((l) => l.id === id);
  if (!row) throw new Error("Streetlight report not found.");
  const policeStep = to === "under_review" || to === "forwarded" || to === "awaiting_verification" || to === "verified_closed";
  const civicStep = ["accepted", "rejected", "work_assigned", "repair_in_progress", "repair_completed"].includes(to);
  if (policeStep && !canVerifyRepair(actor.role) && !(to === "under_review" || to === "forwarded")) {
    throw new Error("Not allowed to verify this repair.");
  }
  if ((to === "under_review" || to === "forwarded") && !canReviewIncidents(actor.role)) {
    throw new Error("Only police review can forward a streetlight report.");
  }
  if (civicStep && actor.role !== "municipal" && !canReviewIncidents(actor.role)) {
    throw new Error("Only municipal staff or an authority account can update repair work.");
  }
  if ((to === "awaiting_verification" || to === "verified_closed") && !canVerifyRepair(actor.role)) {
    throw new Error("Only police review can close a repair.");
  }
  row.status = moveLight(row.status, to);
  if (to === "rejected") row.rejection_reason = (reason || "No reason recorded").slice(0, 300);
  row.updated_at = new Date().toISOString();
  if (to === "forwarded") {
    notify(db, "u-municipal", "Referral", `${row.id} was forwarded inside this demo. No external municipal system was called.`);
  }
  notify(db, row.owner_id, "Streetlight update", `${row.id} is now ${to.replaceAll("_", " ")}.`);
  audit(db, actor.id, "light.status", id, to);
  save(db);
  return row;
}

export function reportLightToPolice(actor: { id: string; role: Role }, id: string) {
  if (actor.role !== "municipal" && actor.role !== "admin") {
    throw new Error("Only municipal staff can report a finished repair to the authority.");
  }
  const db = load();
  const row = db.lights.find((l) => l.id === id);
  if (!row) throw new Error("Streetlight report not found.");
  if (row.status === "rejected" || row.status === "verified_closed") throw new Error("This complaint is already closed.");
  if (row.status === "awaiting_verification") throw new Error("This complaint is already with the authority.");
  row.status = "awaiting_verification";
  row.updated_at = new Date().toISOString();
  const note = `${row.id} was marked repaired and placed in the authority inbox. No live police unit was contacted.`;
  notify(db, row.owner_id, "Streetlight update", note);
  notify(db, "u-supervisor", "Streetlight repair reported", note);
  notify(db, "u-reviewer", "Streetlight repair reported", note);
  audit(db, actor.id, "light.report_to_police", id, "awaiting_verification");
  save(db);
  return row;
}

export function listNotices(userId: string): Notice[] {
  return load().notices.filter((n) => n.user_id === userId);
}

export function listAudit(role: Role): Audit[] {
  if (role !== "admin" && role !== "supervisor") return [];
  return load().audit.slice(0, 100);
}

export function overview() {
  const db = load();
  return {
    active_sos: db.sos.filter((s) => !["resolved", "cancelled"].includes(s.status)).length,
    unacknowledged_sos: db.sos.filter((s) => ["created", "notification_attempted", "location_unavailable", "notification_failed"].includes(s.status)).length,
    reports_waiting: db.reports.filter((r) => r.status === "submitted").length,
    units_available: db.units.filter((u) => u.availability === "available").length,
    units_assigned: db.units.filter((u) => u.availability === "assigned").length,
    open_lights: db.lights.filter((l) => !["verified_closed", "rejected"].includes(l.status)).length,
    lights_waiting_civic: db.lights.filter((l) => l.status === "forwarded").length,
    simulated: true,
  };
}
