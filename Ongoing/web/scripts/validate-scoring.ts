import { computeSafetyBreakdown } from "../src/lib/scoring";
import streets from "../public/data/streets.json";

const samples = [0, 100, 1000];
let ok = true;
for (const i of samples) {
  const s = streets[i] as (typeof streets)[0];
  const b = computeSafetyBreakdown(s);
  const diff = Math.abs(b.total - s.Safety_Score);
  console.log(
    s.Street_ID,
    "excel:",
    s.Safety_Score,
    "computed:",
    b.total,
    "diff:",
    diff
  );
  if (diff > 0.05) ok = false;
}
console.log(ok ? "Scoring validation PASSED" : "Scoring validation FAILED");
process.exit(ok ? 0 : 1);
