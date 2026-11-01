import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

export type RefreshState = {
  state: "idle" | "requested" | "running" | "completed" | "failed";
  requested_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  last_success_at: string | null;
  generated_at: string | null;
  error: string | null;
  pid: number | null;
};

const emptyStatus = (): RefreshState => ({
  state: "idle",
  requested_at: null,
  started_at: null,
  finished_at: null,
  last_success_at: null,
  generated_at: null,
  error: null,
  pid: null,
});

function analysisDir() {
  return path.join(process.cwd(), "..", "Module1_Analysis", "output");
}

function statusPath() {
  return path.join(analysisDir(), "refresh_status.json");
}

function lockPath() {
  return path.join(analysisDir(), "refresh.lock");
}

function writeAtomic(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, file);
}

export function readRefresh(): RefreshState {
  const file = statusPath();
  if (!existsSync(file)) {
    const summary = path.join(analysisDir(), "summary.json");
    const fallback = emptyStatus();
    if (existsSync(summary)) {
      try {
        const pack = JSON.parse(readFileSync(summary, "utf8")) as { generated_at?: string };
        fallback.last_success_at = pack.generated_at || null;
        fallback.generated_at = pack.generated_at || null;
        fallback.state = "completed";
      } catch {
        /* keep idle */
      }
    }
    return fallback;
  }
  try {
    return { ...emptyStatus(), ...(JSON.parse(readFileSync(file, "utf8")) as Partial<RefreshState>) };
  } catch {
    return { ...emptyStatus(), state: "failed", error: "Refresh status file could not be read." };
  }
}

function saveRefresh(next: RefreshState) {
  writeAtomic(statusPath(), next);
}

function lockHeld(): boolean {
  const lock = lockPath();
  if (!existsSync(lock)) return false;
  try {
    const pid = Number(readFileSync(lock, "utf8").trim());
    if (!Number.isFinite(pid)) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    try {
      unlinkSync(lock);
    } catch {
      /* stale lock */
    }
    return false;
  }
}

function summaryGeneratedAt(): string | null {
  const file = path.join(analysisDir(), "summary.json");
  if (!existsSync(file)) return null;
  try {
    return (JSON.parse(readFileSync(file, "utf8")) as { generated_at?: string }).generated_at || null;
  } catch {
    return null;
  }
}

let running = false;
let queued = false;

/** Start Module 1. Returns the persisted refresh state. One child at a time. */
export function scheduleAnalysis(): RefreshState {
  const current = readRefresh();
  if (running || lockHeld()) {
    queued = true;
    return { ...current, state: current.state === "idle" ? "requested" : current.state };
  }
  running = true;
  const now = new Date().toISOString();
  const next: RefreshState = {
    ...current,
    state: "requested",
    requested_at: now,
    error: null,
  };
  saveRefresh(next);
  const cwd = path.join(process.cwd(), "..");
  const script = path.join(cwd, "Module1_Analysis", "pipeline.py");
  const child = spawn("python3", [script], { cwd, stdio: ["ignore", "pipe", "pipe"] });
  const started: RefreshState = {
    ...next,
    state: "running",
    started_at: new Date().toISOString(),
    pid: child.pid || null,
  };
  saveRefresh(started);
  let stderr = "";
  child.stderr?.on("data", (chunk) => {
    stderr += String(chunk);
  });
  child.on("close", (code) => {
    running = false;
    const generated = summaryGeneratedAt();
    if (code === 0) {
      saveRefresh({
        ...readRefresh(),
        state: "completed",
        finished_at: new Date().toISOString(),
        last_success_at: generated,
        generated_at: generated,
        error: null,
        pid: null,
      });
    } else {
      saveRefresh({
        ...readRefresh(),
        state: "failed",
        finished_at: new Date().toISOString(),
        error: (stderr.trim() || `pipeline exited ${code}`).slice(0, 400),
        pid: null,
      });
    }
    if (queued) {
      queued = false;
      scheduleAnalysis();
    }
  });
  child.on("error", (error) => {
    running = false;
    saveRefresh({
      ...readRefresh(),
      state: "failed",
      finished_at: new Date().toISOString(),
      error: error.message,
      pid: null,
    });
  });
  return started;
}
