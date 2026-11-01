// Cursor/agent shells interrupt the next shebang and Next 16+Node 23
// can throw on browserslist `firefox.esr` after Ready. Run next via node
// and patch that one assignment so the server stays up.
"use strict";

process.env.NEXT_TELEMETRY_DISABLED = "1";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const browserslist = path.join(
  __dirname,
  "../node_modules/next/dist/compiled/browserslist/index.js",
);
const broken = "browserslist.versionAliases.firefox.esr=y";
const fixed =
  "(browserslist.versionAliases.firefox||(browserslist.versionAliases.firefox={})).esr=y";

if (fs.existsSync(browserslist)) {
  const src = fs.readFileSync(browserslist, "utf8");
  if (src.includes(broken)) {
    fs.writeFileSync(browserslist, src.split(broken).join(fixed));
  }
}

function nodeBin() {
  const nvm20 = path.join(
    process.env.HOME || "",
    ".nvm/versions/node/v20.17.0/bin/node",
  );
  if (fs.existsSync(nvm20)) return nvm20;
  return process.execPath;
}

const cssScript = path.join(__dirname, "build-css.mjs");
const cssOut = path.join(__dirname, "../src/app/globals.built.css");
const cssSrc = path.join(__dirname, "../src/app/globals.css");
const cssStale =
  !fs.existsSync(cssOut) ||
  fs.statSync(cssSrc).mtimeMs > fs.statSync(cssOut).mtimeMs;
if (cssStale) {
  const css = require("child_process").spawnSync(process.execPath, [cssScript], {
    stdio: "inherit",
  });
  if (css.status) process.exit(css.status || 1);
}

const nextBin = path.join(__dirname, "../node_modules/next/dist/bin/next");
const node = nodeBin();
const child = spawn(node, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    PATH: `${path.dirname(node)}${path.delimiter}${process.env.PATH || ""}`,
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
