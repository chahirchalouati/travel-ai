---
description: Check that all i18n keys are in sync across en/es/fr/it and report/fix gaps
argument-hint: [optional: key path or feature to focus on]
allowed-tools: Bash, Read, Edit, Grep, Glob
---

Audit the Travel AI i18n bundles for key parity across all four locales.

Focus (optional): **$ARGUMENTS**

The four bundles live in `web-app/src/assets/i18n/`: `en.json`, `es.json`, `fr.json`, `it.json`. `fr` is the default UI language.

Steps:
1. Parse all four JSON files and compute the full set of leaf key paths in each.
2. Report, per locale, any key paths **missing** relative to the union of all four (these break the UI in that locale). Call out `fr` gaps as highest priority.
3. Report keys present in only some files (drift), and any JSON that fails to parse (often a brace-depth error from a bad merge — pinpoint the namespace).
4. If asked to fix (or if the gaps are unambiguous placeholders), add the missing keys in the right nested path for each locale, translating the value appropriately per language — never leave a locale with a missing key. Keep identical key ordering/nesting across files.
5. Summarize: keys checked, gaps found, gaps fixed.

Do not invent new feature strings — only reconcile existing keys unless told otherwise.
