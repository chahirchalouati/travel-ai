# Travel AI — Complete Local Setup & Run Guide (macOS)

**Read this first.** This guide assumes you have **never** coded before. It explains
every single step, every command, and what should happen after each one. Follow it
top to bottom and the app will run on your own Mac.

You already have **Claude Code** installed. The easiest path:

> Open this project in Claude Code and type:
> **"Read CLAUDE.md and set up and run this app for me, explaining each step."**
> Claude Code will run the commands below for you. If you'd rather do it yourself,
> every command is written out so you can copy‑paste them one at a time.

---

## What this app is made of (plain English)

This project has two programs that run at the same time and talk to each other:

1. **Backend** (folder `travel-ai-backend/`) — the "engine." It handles data,
   accounts, and the AI. It runs at the web address `http://localhost:8080`.
2. **Frontend** (folder `web-app/`) — the "website" you actually look at. It runs at
   `http://localhost:4200`.

Both of those need some **support services** (a database, etc.). We run those with a
tool called **Docker**, which packages them so you don't have to install each one by
hand.

`localhost` just means "this Mac." Nothing is on the internet — it all runs on your
own computer.

---

## How to open the Terminal (you'll type commands here)

1. Press **Cmd (⌘) + Space** to open Spotlight search.
2. Type **Terminal** and press **Return**.
3. A window with text appears. This is where you paste commands.

**How to run a command:** click the Terminal window, paste the command (Cmd+V),
then press **Return**. Wait until the text stops moving and you see the prompt
(a line ending in `%`) again before running the next one.

To **paste**, use **Cmd+V**. To **stop** a program that's running, click the Terminal
and press **Ctrl+C** (the Control key, not Cmd).

---

## STEP 0 — Install the tools (one time only)

You need 4 tools: **Homebrew**, **Docker Desktop**, **Java 21**, and **Node**.
You only ever do this once on a given Mac.

### 0a. Install Homebrew (a tool that installs other tools)

Paste this into Terminal and press Return:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- It will ask for your **Mac password** — type it (you won't see characters appear,
  that's normal) and press Return.
- It may take a few minutes. When it finishes, **close the Terminal and open a new
  one** (Cmd+Q, then reopen) so Homebrew is ready.
- Check it worked — paste this; it should print a version number:

```bash
brew --version
```

> On Apple Silicon Macs (M1/M2/M3), if `brew` is "not found" after install, paste:
> `echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile && eval "$(/opt/homebrew/bin/brew shellenv)"`
> then try `brew --version` again.

### 0b. Install Docker Desktop, Java 21, and Node

Paste these three commands one at a time:

```bash
brew install --cask docker
brew install openjdk@21
brew install node
```

Then make Java findable (copy‑paste the whole block):

```bash
sudo ln -sfn $(brew --prefix)/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk
echo 'export PATH="$(brew --prefix)/opt/openjdk@21/bin:$PATH"' >> ~/.zprofile
export PATH="$(brew --prefix)/opt/openjdk@21/bin:$PATH"
```

Check each tool prints a version:

```bash
java -version     # should say "21"
node --version    # should say v18 or higher
```

### 0c. Start Docker Desktop

1. Open **Docker Desktop**: Cmd+Space → type **Docker** → Return.
2. The first time, accept the terms and wait. You'll see a **whale icon** 🐳 in the
   top menu bar. When the whale stops animating / says "Docker Desktop is running,"
   it's ready.
3. Leave Docker Desktop running the whole time you use the app.

Check it works (should print a version, no error):

```bash
docker --version
```

---

## STEP 1 — Go into the project folder

Every command below must be run **from inside the project**. First, go there. If the
project is in your home folder under `IdeaProjects`, paste:

```bash
cd ~/IdeaProjects/Travel\ AI
```

> If that errors with "No such file or directory," the project is somewhere else.
> Find the folder in Finder, then drag it onto the Terminal window after typing
> `cd ` (with a space) — that pastes the correct path — and press Return.

Confirm you're in the right place (should list `travel-ai-backend` and `web-app`):

```bash
ls
```

---

## STEP 2 — Start the support services (Docker)

Paste:

```bash
cd travel-ai-backend
docker compose up -d
```

- The **first** time this runs it downloads several things and can take **5–15
  minutes**. Let it finish.
- `-d` means it runs quietly in the background.

This starts these services (you don't interact with them directly):

| Service  | What it is                | Address you can open in a browser |
|----------|---------------------------|-----------------------------------|
| postgres | the database              | (no page)                         |
| redis    | a fast cache              | (no page)                         |
| mailpit  | catches test emails       | http://localhost:8025             |
| ollama   | the local AI engine       | (no page)                         |
| minio    | stores uploaded images    | http://localhost:9001             |

Check they're running (you should see several lines, all "Up" / "running"):

```bash
docker compose ps
```

### Download the AI models (one time, ~5 GB, takes a while)

The AI assistant needs two "models." Paste these one at a time:

```bash
docker exec -it travelai-ollama ollama pull qwen2.5:7b
docker exec -it travelai-ollama ollama pull nomic-embed-text
```

> **Optional.** Skip these two if you don't care about the AI chat assistant — the
> rest of the app still works. Without them, only the AI features fail.

---

## STEP 3 — Start the backend (the engine)

Keep the first Terminal as is. Open a **second** Terminal window (Cmd+N), go to the
project, and start the backend:

```bash
cd ~/IdeaProjects/Travel\ AI/travel-ai-backend
./mvnw spring-boot:run
```

- The **first** run downloads dependencies and may take a few minutes.
- It sets up the database automatically (you don't do anything).
- **Leave this window open and running.** When you see a line like
  `Started TravelAiBackendApplication in ... seconds`, the engine is ready.
- The app already uses the **dev** profile automatically — you don't need any extra
  setting.

Check it's alive — open this in your web browser:
**http://localhost:8080/actuator/health** → it should show `{"status":"UP"}`.

> To stop the backend later: click this Terminal window and press **Ctrl+C**.

---

## STEP 4 — Start the frontend (the website)

Open a **third** Terminal window (Cmd+N). Go to the website folder and start it:

```bash
cd ~/IdeaProjects/Travel\ AI/web-app
npm install
npm start
```

- `npm install` (first time only) downloads the website's pieces — a few minutes.
- `npm start` launches the website. When you see
  **"Compiled successfully"** / a line mentioning `localhost:4200`, it's ready.
- **Leave this window open and running** too.

> To stop the website later: click this Terminal window and press **Ctrl+C**.

---

## STEP 5 — Open the app 🎉

In your web browser go to: **http://localhost:4200**

You should see the Travel AI homepage. The page gets its data live from the backend
you started in Step 3, so make sure that one is still running.

You now have **three** things running at once: Docker (Step 2), the backend (Step 3),
and the frontend (Step 4). That's normal — leave all three open while you use the app.

---

## Starting it again next time (after the one-time setup)

You don't repeat Step 0. Each time you want to run the app:

1. Open **Docker Desktop** and wait for the whale 🐳 to say it's running.
2. Terminal 1: `cd ~/IdeaProjects/Travel\ AI/travel-ai-backend && docker compose up -d`
3. Terminal 2: `cd ~/IdeaProjects/Travel\ AI/travel-ai-backend && ./mvnw spring-boot:run`
4. Terminal 3: `cd ~/IdeaProjects/Travel\ AI/web-app && npm start`
5. Open **http://localhost:4200**

## Shutting everything down

1. In the backend Terminal (Step 3) and the frontend Terminal (Step 4): press **Ctrl+C**.
2. Stop the Docker services:

```bash
cd ~/IdeaProjects/Travel\ AI/travel-ai-backend
docker compose down
```

> `docker compose down` keeps your data. If you ever want a completely fresh start
> (wipes the database and uploaded images), use `docker compose down -v` instead.

---

## If something goes wrong (troubleshooting)

| Problem | What to do |
|---------|-----------|
| `command not found: brew` | Close Terminal, open a new one. Still failing? Re-run the Apple Silicon line in Step 0a. |
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running. Open it and wait for the 🐳 whale, then retry. |
| Backend error: `Connection refused` to port 5432 | Docker services aren't up. Run `docker compose up -d` (Step 2) first. |
| `port 8080 (or 4200) already in use` | Something is already running on it. Quit the other copy, or restart your Mac. |
| `java: command not found` or wrong version | Re-run the Java block in Step 0b, then open a new Terminal. |
| The website loads but is empty / errors | The backend (Step 3) isn't running or finished starting. Check its Terminal and http://localhost:8080/actuator/health. |
| The AI chat doesn't answer | You skipped the model downloads. Run the two `ollama pull` commands in Step 2. |
| Stuck? | In Claude Code, paste the exact error text and ask: "What does this mean and how do I fix it?" |

---

## Useful addresses (bookmarks)

- The app: **http://localhost:4200**
- Backend health check: **http://localhost:8080/actuator/health**
- Backend API explorer (Swagger): **http://localhost:8080/swagger-ui.html**
- Test email inbox (Mailpit): **http://localhost:8025**
- Image storage console (MinIO): **http://localhost:9001** — login `travelai` / `travelai-secret`

---

## Notes for Claude Code (technical, ignore if you're not coding)

- Stack: Spring Boot 3.5 (Java 21, Maven wrapper `./mvnw`, Spring Modulith 1.3.5, Spring AI 1.0) + Angular 19 standalone (TypeScript 5.6, SCSS, Signals + RxJS). Spring profile `dev` is the default via `SPRING_PROFILES_ACTIVE:dev` in `application.yml`.
- **40 backend modules** under `com.travelai.*` (flat layout, event-driven cross-module). **56 frontend features** under `web-app/src/app/features/`. **29 shared/ui primitives** (app-ui-input, select, textarea, range, datepicker, etc.).
- Design: Swiss International Typographic (paper-white #F6F5F1, ink #111, red #E5352B, Inter + IBM Plex Mono). Admin uses same light theme.
- Infra is `travel-ai-backend/docker-compose.yml` (postgres+pgvector, redis, mailpit, ollama, minio). Flyway runs 63 migrations on boot (next: V64); `spring-boot-devtools` hot-restarts on `./mvnw -o compile`.
- AI: Ollama (qwen2.5:7b chat + nomic-embed-text embeddings), pgvector RAG store (~367 docs, threshold ~0.45), multi-agent planning (Orchestrator → Flight/Hotel/Restaurant/Ranking agents).
- Frontend `proxy.conf.json` proxies `/api` → `http://localhost:8080`. Default UI language is French; i18n bundles in `web-app/src/assets/i18n/` (en/es/fr/it) — a new string needs a key in all four files.
- New public endpoints must be allow-listed in `shared/config/SecurityConfig.java`. Admin endpoints use `@PreAuthorize("hasRole('ADMIN')")` instead. Auth: JWT (24h) + TOTP 2FA + Google OAuth. Token: `localStorage.ai_access_token`.
- `/planner` is the only trip planner (no `/trip-planner`). Everything backend-driven.
- No hardcoded geo/reference data (coords, city lists) — use DB or open APIs.
- No `Co-Authored-By` trailers in commits.

---

## Project Claude Code config (`.claude/`)

This repo ships a project-scoped Claude Code setup. Read the relevant rule/skill before doing work in that area.

**Rules** (`.claude/rules/` — read on demand):
- `backend-conventions.md` — 40 Spring Modulith modules, event-driven cross-module, Flyway V1-V63 (next V64), SecurityConfig allowlist vs @PreAuthorize, server-authoritative pricing, AI subsystem config.
- `frontend-conventions.md` — 56 features, 29 shared/ui primitives, Swiss design tokens, i18n 4-way sync, admin shell+child-routes, intentionally-native elements list.
- `project-workflow.md` — full-stack feature checklist, run & verify, memory index.

**Skills** (`.claude/skills/`):
- `travelai-conventions` — canonical backend + frontend conventions reference (single-file summary).
- `travelai-rag-concierge` — AI concierge RAG pipeline (Ollama qwen2.5:7b + nomic-embed-text, ~0.45 similarity threshold, idempotent ingestion, debugging checklist).

**Agents** (`.claude/agents/`):
- `travelai-module-builder` — backend module scaffolder (Sonnet, follows Modulith conventions).
- `travelai-feature-builder` — Angular feature scaffolder (Sonnet, reuses shared/ui, syncs i18n).

**Commands** (`.claude/commands/`): `/feature` (full-stack feature end-to-end), `/verify` (build + test both sides), `/new-migration` (next Flyway V-number), `/i18n-sync` (reconcile the four i18n bundles), `/reingest` (rebuild the RAG store), `/dev-up` (bring up the whole stack).

**Hooks** (`.claude/hooks/`, wired in `.claude/settings.json`):
- `guard-file-size.mjs` — blocks source writes over 800 lines.
- `i18n-validate.mjs` — blocks invalid i18n JSON and warns on en/es/fr/it key drift.

**Memory** (`memory/MEMORY.md`): full project structure tree — overview, 40 backend modules, 56 frontend features, 42 core services + 29 UI primitives, behavioral rules.

Node-only; no external formatter/linter is configured in this repo. Personal permissions stay in `.claude/settings.local.json` (untracked).
