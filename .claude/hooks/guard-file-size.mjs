#!/usr/bin/env node
// PreToolUse(Write) hook for Travel AI.
// Blocks writing a source file over 800 lines (project coding standard:
// many small, focused files). Reads the proposed content from the tool
// input, so it works even before the file exists. Uses only Node.

import { readFileSync } from "node:fs";

const MAX_LINES = 800;
// Data/config/lock files are allowed to be large.
const EXEMPT = /(\.json|\.lock|\.sql|\.min\.(js|css)|-lock\.yaml)$/i;

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path || "";
const content = input?.tool_input?.content ?? "";
if (EXEMPT.test(filePath)) process.exit(0);

const lines = content.split("\n").length;
if (lines > MAX_LINES) {
  console.error(
    `[size] BLOCKED: ${filePath || "file"} would be ${lines} lines (max ${MAX_LINES}).\n` +
      `[size] Split it into smaller, cohesive modules (Travel AI convention).`
  );
  process.exit(2);
}
process.exit(0);
