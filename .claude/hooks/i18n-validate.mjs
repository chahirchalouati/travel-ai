#!/usr/bin/env node
// PostToolUse(Write|Edit) hook for Travel AI.
// When an i18n bundle (assets/i18n/{en,es,fr,it}.json) is edited:
//   - hard-fail (exit 2) if the edited file is no longer valid JSON
//     (the documented "brace-depth silently corrupts a namespace" gotcha),
//   - warn (exit 0) if the four locales drift in their key sets.
// Uses only Node — no external tooling.

import { readFileSync } from "node:fs";
import { dirname, basename, join } from "node:path";

const LOCALES = ["en", "es", "fr", "it"];

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function leafKeys(obj, prefix = "", out = new Set()) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      leafKeys(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.add(prefix);
  }
  return out;
}

const input = readStdin();
const filePath = input?.tool_input?.file_path || "";
const isBundle =
  /assets\/i18n\/(en|es|fr|it)\.json$/.test(filePath.replace(/\\/g, "/"));
if (!isBundle) process.exit(0);

const dir = dirname(filePath);
const edited = basename(filePath, ".json");

// 1) The edited file must still be valid JSON.
let editedJson;
try {
  editedJson = JSON.parse(readFileSync(filePath, "utf8"));
} catch (e) {
  console.error(
    `[i18n] BLOCKED: ${basename(filePath)} is not valid JSON — ${e.message}\n` +
      `[i18n] A stray brace corrupts the whole bundle. Fix it before continuing.`
  );
  process.exit(2);
}

// 2) Soft drift check across all four locales.
const sets = {};
for (const loc of LOCALES) {
  try {
    const json =
      loc === edited ? editedJson : JSON.parse(readFileSync(join(dir, `${loc}.json`), "utf8"));
    sets[loc] = leafKeys(json);
  } catch {
    // A sibling locale unreadable/invalid — note and skip drift math.
    console.error(`[i18n] warning: could not read/parse ${loc}.json`);
  }
}

const union = new Set();
for (const loc of Object.keys(sets)) for (const k of sets[loc]) union.add(k);

const gaps = [];
for (const loc of LOCALES) {
  if (!sets[loc]) continue;
  const missing = [...union].filter((k) => !sets[loc].has(k));
  if (missing.length) gaps.push(`${loc}: missing ${missing.length} key(s) e.g. ${missing.slice(0, 5).join(", ")}`);
}

if (gaps.length) {
  console.error(
    `[i18n] warning: locale key drift — every string must exist in all four (${LOCALES.join("/")}), fr is the default:\n` +
      gaps.map((g) => `  - ${g}`).join("\n") +
      `\n[i18n] run /i18n-sync to reconcile.`
  );
}
process.exit(0);
