# Travel AI — Analisi Funzionale: Stato di Implementazione

> **Documento di allineamento** tra l'Analisi Funzionale di business (v1.0 / v2.0, 27 Giugno 2026, Giacomo Fanari) e ciò che è **effettivamente implementato nel codice** alla data di revisione.
>
> **Versione:** 1.0 — **Data:** 29 Giugno 2026 · **Branch:** `master`
> **Scope:** backend `travel-ai-backend` (Spring Boot 3 / Java 21) + frontend `web-app` (Angular 19).
>
> Documento complementare a:
> - `TravelAI_Analisi_Funzionale_Tecnica_v3.docx` (requisiti, architettura, rischi)
> - `TravelAI_Analisi_Funzionale_Dettaglio_App_v1.docx` (flussi utente, logica AI)
> - `Go_To_Production_Master_Plan.md` (costi, marketing, strategie, lancio)

---

## 0. Sintesi esecutiva (TL;DR)

Il prodotto è **molto più avanti** di quanto descritto nei documenti di business del 27 Giugno, che presentano come "concettuali" o "da validare" funzionalità che sono **già implementate e funzionanti** in locale:

- ✅ **Il motore AI multi-agente di pianificazione è reale** (orchestratore + agenti Hotel/Ristoranti/Voli + ranking + budget splitter), guidato da eventi asincroni (Spring Modulith).
- ✅ **Il Travel Concierge è implementato** (chat RAG su Ollama + pgvector, attivazione N giorni prima della partenza).
- ✅ **Catalogo multi-servizio** completo a livello applicativo: hotel, ristoranti, voli, crociere, destinazioni, attrazioni.
- ✅ **Booking, pagamenti (flusso), recensioni, forum, storie di viaggio, messaggistica, pannello admin, onboarding partner, media storage** sono presenti.

I **veri gap verso la produzione** non sono più "costruire le feature" ma:

1. 🔴 **Pagamenti reali**: il gateway è **simulato** (nessuna integrazione SDK Stripe/Klarna/PayPal live).
2. 🔴 **Inventario reale**: catalogo popolato da **dati seed/mock**, nessuna integrazione con fornitori/PMS/channel manager o API di disponibilità reale.
3. 🔴 **Scalabilità AI**: gira su **Ollama locale** (`qwen2.5:7b`), non dimensionato per la produzione.
4. 🟠 **Hardening go-live**: legale/GDPR/consenso, test & coverage, CI/CD, osservabilità, sicurezza, email transazionale reale.

Legenda stato: ✅ **FATTO** · 🟡 **PARZIALE** (presente ma incompleto/mock) · 🔴 **DA FARE**.

---

## 1. Mappatura requisiti funzionali (dalla v2.0) → stato reale

| ID | Requisito | Priorità | Stato | Evidenza nel codice | Note / gap |
|----|-----------|----------|-------|---------------------|------------|
| **RF-01** | Budget & preferenze utente (gerarchiche) | Must | ✅ FATTO | `travel/TravelController` `POST /travel/requests`, `TravelRequest`, `AiBudgetSplitter` | Budget, date, gruppo, `spendingPriority`; split budget per categoria implementato. |
| **RF-02** | Motore AI di pianificazione (2-3 proposte) | Must | ✅ FATTO | `ai/planning/` — `PlanningOrchestrator`, `OrchestratorAgent`, `RankingAgent` | Pipeline asincrona event-driven (Spring Modulith), `max-proposals: 3`, tolleranza budget +10%. |
| **RF-03** | Prenotazione hotel + disponibilità | Must | 🟡 PARZIALE | `booking/BookingService`, `catalog/hotel/` | Flusso di booking presente; **disponibilità reale non integrata** (dati seed). |
| **RF-03b** | Prenotazione ristorante (≥100 partner) | Must | 🟡 PARZIALE | `catalog/restaurant/`, migrazione `V16__seed_restaurants` | Modello e booking ok; **base partner reale assente** (seed). |
| **RF-03c** | Prenotazione volo (volume diretto) | Must | 🟡 PARZIALE | `catalog/flight/`, `V17__seed_flights` | Modello ok; **nessuna integrazione GDS/aggregatore volo reale**. |
| **RF-04** | Lista d'attesa cancellazioni | Should | ✅ FATTO | `booking/WaitlistEntry`, `JoinWaitlistRequest`, `WaitlistEntryRepository` | Iscrizione waitlist su strutture esaurite implementata. |
| **RF-05** | Contatto diretto struttura | Should | 🟡 PARZIALE | `messaging/MessagingController` | Messaggistica in-app presente; **canale WhatsApp/struttura non integrato**. |
| **RF-06** | Pagamento centralizzato in-app | Must | 🟡 PARZIALE | `payment/PaymentService`, `PaymentController`, `WebhookController` | Flusso completo (initiate/confirm/refund/webhook) ma **gateway SIMULATO** (`simulateCheckoutUrl`). |
| **RF-07** | Pagamento rateale (Klarna / PayPal) | Should | 🔴 DA FARE | enum `PaymentGateway{STRIPE,KLARNA,PAYPAL}`, config `klarna.api-key` | Solo placeholder; **nessuna integrazione SDK reale**. |
| **RF-08** | Gestione dati cliente | Must | ✅ FATTO | `user/`, `auth/`, `profile`, `booking/BookingTraveler` | Anagrafica, storico prenotazioni, preferenze, profilo con foto/luoghi. |
| **RF-09** | Log AI / audit trail | Must | ✅ FATTO | `audit/` module, `TravelProposal` persistite, event log Modulith (`V6`) | Ogni proposta AI e azione persistita. |

### Servizi accessori cross-sell

| Servizio | Fase | Stato | Note |
|----------|------|-------|------|
| Auto a noleggio | Fase 2 | 🔴 DA FARE | Non presente nel catalogo. |
| Lettini / spiaggia | Fase 2 | 🔴 DA FARE | Non presente. |
| Treni | Fase 3 | 🔴 DA FARE | Non presente. |
| Crociere | *extra* | ✅ FATTO | `catalog/cruise/`, `CruiseController`, `V13`/`V19` — **non previsto nei doc di business, ma implementato**. |

---

## 2. Travel Concierge — da "concettuale" a implementato

I documenti di business marcano il Concierge come **"resta concettuale"**. Nel codice è **implementato**:

| Componente del concept | Stato | Evidenza |
|------------------------|-------|----------|
| Chat in linguaggio naturale contestuale al viaggio | ✅ FATTO | `ai/concierge/ConciergeService`, `ConciergeController`, `ChatController` |
| Attivazione N giorni prima della partenza | ✅ FATTO | `ConciergeScheduler`, config `concierge.activation-days-before-departure: 3` |
| Grounding sui dati reali (no allucinazioni) | ✅ FATTO | RAG su **pgvector** + Ollama `nomic-embed-text` (768 dim, HNSW, cosine), `ai/rag/` |
| Contesto viaggio (destinazione, date, hotel, gruppo) | ✅ FATTO | `RagEntityResolver`, `RagIngestionService`, threshold 0.45 |
| **Context API / layer partner aderenti terzi** | 🔴 DA FARE | Nessun modulo "partner context layer" esterno. |
| **Consent & data minimization layer (GDPR)** | 🔴 DA FARE | Da progettare con referente privacy. |

> **Nota tecnica:** il Concierge oggi risponde e raccomanda; la **prenotazione diretta last-minute via concierge** verso partner terzi non integrati resta un limite (coerente con il concept). Modello AI: `qwen2.5:7b`, temperatura 0.4 (factual), `num-predict: 2048`.

---

## 3. Funzionalità implementate **oltre** il perimetro documentato

Il codice contiene moduli **non descritti** nell'analisi funzionale di business — vanno censiti perché impattano scope, costi e marketing:

| Modulo | Stato | Evidenza | Valore prodotto |
|--------|-------|----------|-----------------|
| **Recensioni** con sub-rating e voti "utile" | ✅ FATTO | `review/`, `V25__review_subratings_helpful_votes` | Leva di trust / differenziazione vs TripAdvisor. |
| **Forum / community** | ✅ FATTO | `forum/ForumController`, `V28__create_forum` | Engagement, UGC, SEO. |
| **Travel Stories** (contenuti editoriali/UGC) | ✅ FATTO | `stories/TravelStoryController`, `V21` | Content marketing nativo. |
| **Attrazioni** + dettaglio | ✅ FATTO | `attraction/`, `V26__create_attractions` | Arricchisce l'itinerario. |
| **Reactive Living Itinerary** | ✅ FATTO | `itinerary/`, `LiveItineraryController`, `V27`, spec `reactive-living-itinerary-spec.md` | Itinerario "vivo" reattivo (flagship differenziante). Tutte le fasi 1-5 a bordo: trigger manuale/webhook/scheduler, re-plan AI con gate di approvazione, push SSE real-time, email. Webhook protetto da secret condiviso + rate limit; test su service e listener; badge "Live" su trips e bookings. |
| **Pannello Admin schema-driven** | ✅ FATTO | `admin/`, `AdminCatalogController` (CRUD catalogo/contenuti/partner) | Operatività interna. |
| **Onboarding partner** | ✅ FATTO | `partner/PartnerController` | Coerente con flusso onboarding 4-step della v2.0. |
| **Media storage S3-compatibile** | ✅ FATTO | `media/`, MinIO/S3 (`MediaController`) | Foto profilo, contenuti, luoghi. |
| **Statistiche piattaforma** | ✅ FATTO | `stats/PlatformStatsController` | Dati homepage / trust. |
| **Notifiche email** (event-driven) | 🟡 PARZIALE | `notification/`, eventi `PaymentCompletedEvent` etc. | Funziona, ma su **Mailpit (sink dev)** — manca provider reale. |
| **Auth JWT** (access + refresh) | ✅ FATTO | `auth/`, JJWT, refresh 7d / access 24h | Registrazione, login, refresh. |
| **i18n** 4 lingue (en/it/fr/es) | ✅ FATTO | `web-app/src/assets/i18n/` | Mercato multi-paese. |

---

## 4. Architettura effettiva (as-built)

```
┌─────────────────────────────────────────────────────────────┐
│  web-app (Angular 19, mobile-first)                          │
│  features/: hero, catalog, planner, itinerary-live,         │
│  concierge chat, forum, stories, profile, admin, bookings   │
└───────────────────────────┬─────────────────────────────────┘
                            │ /api (proxy :4200 → :8080)
┌───────────────────────────▼─────────────────────────────────┐
│  travel-ai-backend (Spring Boot 3, Java 21, Spring Modulith) │
│                                                              │
│  Moduli: auth · user · travel · ai(planning/concierge/rag/  │
│  chat) · catalog(hotel/restaurant/flight/cruise) ·          │
│  destination · attraction · booking · payment · review ·    │
│  forum · stories · messaging · partner · admin · media ·    │
│  notification · stats · audit · shared                      │
│                                                              │
│  Comunicazione inter-modulo: eventi (Spring Modulith)       │
└───┬──────────┬──────────┬───────────┬───────────┬───────────┘
    │          │          │           │           │
┌───▼───┐ ┌────▼────┐ ┌───▼────┐ ┌────▼─────┐ ┌───▼────────┐
│Postgres│ │ Redis   │ │ Ollama │ │ MinIO/S3 │ │ SMTP        │
│pgvector│ │ cache   │ │qwen2.5 │ │ media    │ │ (Mailpit)   │
│+ Flyway│ │         │ │+nomic  │ │          │ │             │
└────────┘ └─────────┘ └────────┘ └──────────┘ └─────────────┘
```

**Punti di forza architetturali (già acquisiti):**
- Modularità forte (Spring Modulith) con confini di modulo verificabili.
- Pipeline AI **disaccoppiata via eventi** (resiliente, scalabile orizzontalmente).
- RAG con vector store nativo Postgres (no servizio vettoriale esterno a pagamento).
- Migrazioni versionate (Flyway, V1→V28), `ddl-auto: validate` (sicuro in prod).
- Astrazione gateway pagamenti (sostituire mock con SDK reale = cambio localizzato).
- Storage media S3-compatibile (portabile MinIO ↔ AWS S3 / Cloudflare R2).

---

## 5. Gap analysis — cosa manca per andare in produzione

### 🔴 Bloccanti (no go-live senza)

1. **Pagamenti reali** — sostituire `simulateCheckoutUrl` con SDK Stripe (Payment Intents) + verifica firma webhook reale; Klarna/PayPal come fase 2. *Stima: 1–2 settimane.*
2. **Inventario/disponibilità reale** — almeno il pilota (≥10 hotel + ≥10 ristoranti) con dati e disponibilità veri (anche manuali via admin all'inizio). *Stima: dipende dal commerciale.*
3. **Email transazionale reale** — passare da Mailpit a provider (Resend / SES / Postmark) con dominio verificato (SPF/DKIM/DMARC). *Stima: 1–2 giorni.*
4. **AI in produzione** — decidere hosting Ollama gestito vs provider API (vedi Master Plan §AI Cost). *Stima: 2–5 giorni.*
5. **Legale/GDPR** — privacy policy, T&C, cookie/consent banner, registro trattamenti, DPA con fornitori, modello consenso granulare per il Concierge/partner. *Bloccante legale.*

### 🟠 Importanti (qualità/sicurezza)

6. **Test & coverage** — verificare suite e coverage (target 80%); E2E sui flussi critici (planner → booking → pagamento).
7. **CI/CD** — pipeline build/test/deploy (oggi deploy manuale Render/Fly).
8. **Sicurezza** — security headers (HSTS, CSP), rate limiting su auth, audit secrets, hardening `SecurityConfig`, rotazione `JWT_SECRET`.
9. **Osservabilità** — logging strutturato, error tracking (Sentry), metriche/health oltre `/actuator/health`, alerting.
10. **Performance/scalabilità** — il free tier Render/Fly va bene per pilot, non per scala (vedi Master Plan).

### 🟢 Successivi (post-lancio)

11. Cross-sell auto/lettini/treni (Fase 2-3).
12. Context API partner aderenti (ecosistema Concierge).
13. App mobile nativa (oggi web mobile-first).
14. Reactive Living Itinerary — ✅ completato (fasi 1-5 + hardening). Estensioni opzionali: integrazione push reali compagnie aeree/venue sui webhook, detection disruption via polling esterno (oggi scheduler = solo tick di manutenzione).

---

## 6. Stato per macro-fase (dai documenti di business)

| Fase (doc business) | Descrizione | Stato reale |
|---------------------|-------------|-------------|
| **Fase 2 — POC** | Validare fattibilità tecnica (agent AI, data ingestion) | ✅ **Superata** — POC realizzato e funzionante. |
| **Fase 3 — MVP** | Ricerca hotel, pianificazione AI, prenotazione, DB iniziale, UI | ✅ **In gran parte fatto** — manca solo inventario+pagamenti reali. |
| **Fase 4 — Validazione** | Pilota ~10 hotel + ~10 ristoratori, feedback | 🟡 **Pronta a partire** appena chiusi i 5 bloccanti §5. |

> **Conclusione:** il progetto non è in fase "POC da costruire" ma in fase **"pre-lancio da hardenizzare"**. Le 4 voci bloccanti tecniche (pagamenti, inventario, email, AI hosting) + il pacchetto legale sono ciò che separa il codice attuale da un pilota reale con utenti paganti.

---

*Documento di stato implementazione — allineato al codice su `master` al 29/06/2026. Da rivedere ad ogni milestone. Le stime sono indicative e vanno confermate in planning tecnico.*
