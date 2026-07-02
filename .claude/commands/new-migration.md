---
description: Scaffold the next Flyway migration with the correct V-number for the Travel AI backend
argument-hint: <snake_case_description>
allowed-tools: Bash, Write, Read
---

Create a new Flyway migration for the Travel AI backend.

Description of the change: **$ARGUMENTS**

Steps:
1. List `travel-ai-backend/src/main/resources/db/migration/` and determine the current highest `V<n>` number (numeric max, not lexical — V54 > V9).
2. Create `V<max+1>__$ARGUMENTS.sql` in that directory. Never reuse or edit an already-applied migration; fix forward.
3. Write the SQL for the requested change. Conventions:
   - Enum-like columns stored as `VARCHAR` (see V7), not native enum types.
   - pgvector is available for embedding columns.
   - Add sensible NOT NULL / defaults / indexes; prefer additive, backward-compatible changes.
4. Show the final file path, the chosen version number (and the previous max you saw), and the SQL.
5. Remind: migrations run on backend boot via Flyway — restart `./mvnw spring-boot:run` to apply. If the change adds a public endpoint later, that endpoint must also be allow-listed in `SecurityConfig.java`.

Do not run the migration or start the backend unless asked.
