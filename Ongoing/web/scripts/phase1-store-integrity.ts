/**
 * Isolated Phase 1 store checks. Uses a temp SURAKSHA_STORE. Does not touch
 * Ongoing/web/data/suraksha-store.json.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import path from "path";

process.env.SURAKSHA_SKIP_GEOCODE = "1";
process.env.SURAKSHA_STORE = path.join(mkdtempSync(path.join(tmpdir(), "ss-p1-")), "store.json");

const { createReport, reviewReport, listReports } = await import("../src/lib/suraksha/store.ts");

const citizen = "u-citizen";
const reviewer = { id: "u-reviewer", role: "reviewer" as const };
const patrol = { id: "u-patrol", role: "patrol" as const };
const results: { name: string; ok: boolean; detail: string }[] = [];

const jobs: { name: string; fn: () => void | Promise<void> }[] = [];
function check(name: string, fn: () => void | Promise<void>) {
  jobs.push({ name, fn });
}

check("1 valid incident submission", async () => {
  const row = await createReport(citizen, {
    category: "Stalking or being followed",
    when: "now",
    occurred_at: new Date().toISOString(),
    description: "isolated phase1 check",
    lat: 17.33,
    lon: 76.83,
  });
  assert.match(row.id, /^INC-/);
  assert.equal(row.status, "submitted");
  assert.equal(row.simulated, false);
  const disk = JSON.parse(readFileSync(process.env.SURAKSHA_STORE!, "utf8"));
  assert.ok(disk.reports.some((r: { id: string }) => r.id === row.id));
});

check("2 missing required category", async () => {
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "",
        when: "now",
        occurred_at: new Date().toISOString(),
        lat: null,
        lon: null,
      }),
    /listed incident type/,
  );
});

check("3 invalid incident category", async () => {
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Not a real category",
        when: "now",
        occurred_at: new Date().toISOString(),
        lat: 17.33,
        lon: 76.83,
      }),
    /listed incident type/,
  );
});

check("4 coordinates outside Karnataka bbox", async () => {
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Other incident",
        when: "now",
        occurred_at: new Date().toISOString(),
        lat: 28.61,
        lon: 77.21,
      }),
    /outside the Karnataka map/,
  );
});

check("5 invalid / future occurrence including when=now", async () => {
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Other incident",
        when: "past",
        occurred_at: "not-a-date",
        lat: null,
        lon: null,
      }),
    /invalid/,
  );
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Other incident",
        when: "past",
        occurred_at: future,
        lat: null,
        lon: null,
      }),
    /future/,
  );
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Other incident",
        when: "now",
        occurred_at: future,
        lat: 12.97,
        lon: 77.59,
      }),
    /future/,
  );
});

check("6 duplicate client_id", async () => {
  const input = {
    category: "Threats or intimidation" as const,
    when: "now" as const,
    occurred_at: new Date().toISOString(),
    lat: 12.97,
    lon: 77.59,
    client_id: "phase1-dup-key",
  };
  await createReport(citizen, input);
  await assert.rejects(() => createReport(citizen, input), /already received/);
});

let pendingId = "";
check("7 pending incident stays submitted", async () => {
  const row = await createReport(citizen, {
    category: "Verbal harassment / eve-teasing",
    when: "now",
    occurred_at: new Date().toISOString(),
    lat: 13.0,
    lon: 77.6,
  });
  pendingId = row.id;
  assert.equal(row.status, "submitted");
});

let verifiedId = "";
check("8 verified incident updates only that row", async () => {
  const row = await createReport(citizen, {
    category: "Unwanted touching / sexual harassment",
    when: "past",
    occurred_at: "2026-09-01T10:00:00.000Z",
    description: "verify me",
    lat: 15.35,
    lon: 75.12,
  });
  verifiedId = row.id;
  const beforePending = listReports("reviewer", reviewer.id).find((r) => r.id === pendingId);
  assert.equal(beforePending?.status, "submitted");
  assert.throws(() => reviewReport(patrol, row.id, "verified"), /Not allowed/);
  reviewReport(reviewer, row.id, "under_review");
  const verified = reviewReport(reviewer, row.id, "verified");
  assert.equal(verified.status, "verified");
  assert.equal(verified.id, verifiedId);
  const stillPending = listReports("reviewer", reviewer.id).find((r) => r.id === pendingId);
  assert.equal(stillPending?.status, "submitted");
});

check("9 rejected / flagged incident requires reason", async () => {
  const row = await createReport(citizen, {
    category: "Physical assault",
    when: "now",
    occurred_at: new Date().toISOString(),
    lat: 14.2,
    lon: 76.4,
  });
  assert.throws(() => reviewReport(reviewer, row.id, "flagged"), /reason/);
  reviewReport(reviewer, row.id, "flagged", "Not enough evidence to verify.");
  const flagged = listReports("reviewer", reviewer.id).find((r) => r.id === row.id);
  assert.equal(flagged?.status, "flagged");
  assert.equal(flagged?.flag_reason, "Not enough evidence to verify.");
});

check("10 missing optional fields", async () => {
  const row = await createReport(citizen, {
    category: "Not sure",
    when: "now",
    occurred_at: new Date().toISOString(),
    lat: null,
    lon: null,
  });
  assert.equal(row.description, "");
  assert.equal(row.location.latitude, null);
  assert.equal(row.location.match_status, "missing");
});

check("existing records preserved after later writes", async () => {
  const ids = listReports("reviewer", reviewer.id).map((r) => r.id);
  assert.ok(ids.includes(pendingId));
  assert.ok(ids.includes(verifiedId));
});

check("client_id is stored on disk", async () => {
  await createReport(citizen, {
    category: "Other incident",
    when: "now",
    occurred_at: new Date().toISOString(),
    lat: 12.9,
    lon: 77.5,
    client_id: "persist-across-restart",
  });
  const disk = JSON.parse(readFileSync(process.env.SURAKSHA_STORE!, "utf8"));
  assert.ok(disk.client_keys.includes("u-citizen:persist-across-restart"));
  await assert.rejects(
    () =>
      createReport(citizen, {
        category: "Other incident",
        when: "now",
        occurred_at: new Date().toISOString(),
        lat: 12.9,
        lon: 77.5,
        client_id: "persist-across-restart",
      }),
    /already received/,
  );
});

check("load fills missing flag_reason/client_id without clobbering", async () => {
  const file = process.env.SURAKSHA_STORE!;
  const disk = JSON.parse(readFileSync(file, "utf8"));
  disk.reports.unshift(
    {
      id: "INC-LEGACY-MISSING",
      owner_id: citizen,
      category: "Other incident",
      when: "now",
      occurred_at: "2026-06-01T00:00:00.000Z",
      description: "",
      location: {
        latitude: null,
        longitude: null,
        district: null,
        street_id: null,
        street_name: null,
        match_status: "missing",
        note: "legacy row without optional keys",
      },
      status: "submitted",
      simulated: false,
      created_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "INC-LEGACY-KEPT",
      owner_id: citizen,
      category: "Other incident",
      when: "now",
      occurred_at: "2026-06-01T00:00:00.000Z",
      description: "",
      location: {
        latitude: null,
        longitude: null,
        district: null,
        street_id: null,
        street_name: null,
        match_status: "missing",
        note: "legacy row with optional keys",
      },
      status: "flagged",
      flag_reason: "keep this reason",
      client_id: "keep-this-client",
      simulated: false,
      created_at: "2026-06-01T00:00:00.000Z",
    },
  );
  writeFileSync(file, JSON.stringify(disk));
  const reports = listReports("reviewer", reviewer.id);
  const missing = reports.find((r) => r.id === "INC-LEGACY-MISSING");
  const kept = reports.find((r) => r.id === "INC-LEGACY-KEPT");
  assert.equal(missing?.flag_reason, null);
  assert.equal(missing?.client_id, null);
  assert.equal(kept?.flag_reason, "keep this reason");
  assert.equal(kept?.client_id, "keep-this-client");
});

check("atomic persist file exists and is valid JSON", async () => {
  const file = process.env.SURAKSHA_STORE!;
  assert.equal(existsSync(`${file}.tmp`), false);
  JSON.parse(readFileSync(file, "utf8"));
});

check("corrupt store does not silently become empty", async () => {
  writeFileSync(process.env.SURAKSHA_STORE!, "{not-json");
  assert.throws(() => listReports("reviewer", reviewer.id), /could not be read/);
});

for (const job of jobs) {
  try {
    await job.fn();
    results.push({ name: job.name, ok: true, detail: "pass" });
  } catch (error) {
    results.push({ name: job.name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

const failed = results.filter((r) => !r.ok);
for (const row of results) {
  console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.name}  ${row.detail}`);
}
if (failed.length) {
  process.exitCode = 1;
} else {
  console.log("phase1-store-integrity ok", results.length);
}
