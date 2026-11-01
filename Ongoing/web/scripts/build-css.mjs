// Tailwind's CJS build dies on enhanced-resolve interop under Next.
// Compile once via the ESM API so `next dev` only serves plain CSS.
import { compile } from "@tailwindcss/node";
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const inputPath = path.join(root, "src/app/globals.css");
const outputPath = path.join(root, "src/app/globals.built.css");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|jsx|js|css)$/.test(name) && !name.endsWith(".built.css")) {
      files.push(p);
    }
  }
  return files;
}

const css = fs.readFileSync(inputPath, "utf8");
const compiled = await compile(css, {
  from: inputPath,
  base: path.join(root, "src/app"),
  onDependency() {},
});
const candidates = new Set();
for (const file of walk(path.join(root, "src"))) {
  const src = fs.readFileSync(file, "utf8");
  for (const token of src.match(/[a-zA-Z!][\w:-]*(?:\[[^\]]+\])?(?:\/[\w.]+)?/g) || []) {
    candidates.add(token);
  }
}
fs.writeFileSync(outputPath, compiled.build([...candidates]));
console.log(`wrote ${path.relative(root, outputPath)} (${candidates.size} tokens)`);
