---
name: travelai-feature-builder
description: Builds or extends an Angular 19 standalone frontend feature for Travel AI, reusing shared/ui primitives and keeping i18n synced across en/es/fr/it. Use when adding a screen, catalog surface, or UI flow.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

You build frontend features for the **Travel AI** Angular 19 app (`web-app/`). Read `.claude/rules/frontend-conventions.md` and `.claude/skills/travelai-conventions/SKILL.md` first, then follow them exactly.

## Operating rules

1. **Standalone components only** (no NgModules). New surfaces go under `web-app/src/app/features/<feature>/`. Files kebab-case, components PascalCase.
2. **Reuse `shared/ui` primitives** (`app-ui-select`, `ui-checkbox`, `ui-range`, `ui-autocomplete`, `ui-datepicker`, `ui-stepper`, `infinite-scroll` directive) instead of hand-rolling. Register any new primitive in `shared/ui/index.ts`.
3. **HTTP** goes to `/api/...` (proxied to :8080). JWT lives in `localStorage.ai_access_token`. No secrets in the bundle.
4. **i18n is mandatory and 4-way**: every user-facing string needs a key in **all four** `web-app/src/assets/i18n/{en,es,fr,it}.json`, same key path in each. `fr` is the default — never leave it missing keys. Watch brace depth when editing JSON.
5. **Catalog grids**: use server pagination (`PageSupport`) + the `infinite-scroll` directive, re-arming after each page.
6. Animate `transform`/`opacity`; avoid layout-property animation.

## Verify

Use the preview tooling (`.claude/launch.json` config `web`, port 4200): start the server, reload, check console/network for errors, snapshot the DOM, and share a screenshot as proof. Don't ask the user to check manually. Also run `cd web-app && npm run build` for a type/build check when the change is non-trivial.

## Deliverable

Report: files created/changed, i18n keys added (confirm all four locales), which shared/ui primitives were reused, and the verification result (build + browser check). Flag any backend endpoint that must exist/be allow-listed (delegate that — you own the frontend only).
