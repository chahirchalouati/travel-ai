# Travel AI — Go-To-Production Master Plan

> **Tutto ciò che serve per andare in produzione**: gap tecnici, infrastruttura, costi, sicurezza & compliance, modello di ricavo, pricing, go-to-market, marketing, metriche, roadmap e checklist di lancio.
>
> **Versione:** 1.0 — **Data:** 29 Giugno 2026
> **Companion:** `Analisi_Funzionale_Stato_Implementazione.md` (stato feature) · `TravelAI_Analisi_Funzionale_Tecnica_v3.docx` (architettura/rischi)
>
> ⚠️ **Tutti i costi sono stime indicative** (EUR, IVA esclusa) basate sui listini cloud/SaaS standard. Vanno confermati con preventivi reali. Le cifre di mercato/conversione sono benchmark di settore, non garanzie.

---

## 1. Stato di partenza (in una frase)

Il prodotto è **costruito e funzionante in locale** (motore AI multi-agente, concierge RAG, catalogo multi-servizio, booking, recensioni, community, admin). Mancano **integrazioni reali** (pagamenti, inventario, email, AI hosting) e il **pacchetto di lancio** (legale, sicurezza, osservabilità, marketing). Vedi gap dettagliati in `Analisi_Funzionale_Stato_Implementazione.md` §5.

---

## 2. Blocchi tecnici verso la produzione (priorità)

| # | Blocco | Cosa fare | Effort | Costo setup |
|---|--------|-----------|--------|-------------|
| 1 | **Pagamenti reali** | Stripe Payment Intents + webhook firmati (sostituire mock). Klarna/PayPal in fase 2 | 1–2 sett. | Solo dev (Stripe: no fee fisse) |
| 2 | **Email transazionale** | Resend/SES/Postmark + dominio verificato (SPF/DKIM/DMARC) | 1–2 gg | ~0–20 €/mese |
| 3 | **AI in produzione** | Ollama gestito (GPU) **oppure** API esterna (vedi §5) | 2–5 gg | da 0 a 200+ €/mese |
| 4 | **Inventario reale** | Pilota: ≥10 hotel + ≥10 ristoranti caricati via Admin | dipende commerciale | 0 (manuale) |
| 5 | **Sicurezza** | HSTS/CSP, rate-limit auth, secrets manager, rotazione JWT | 3–5 gg | ~0 |
| 6 | **Osservabilità** | Sentry + logging strutturato + alerting uptime | 2–3 gg | ~0–26 €/mese |
| 7 | **CI/CD** | GitHub Actions: build+test+deploy | 1–2 gg | 0 (free tier) |
| 8 | **Test/coverage** | Verificare 80%, E2E flussi critici | 1 sett. | 0 |
| 9 | **Legale/GDPR** | Privacy, T&C, cookie, DPA, consenso granulare | esterno | 1.500–5.000 € una tantum |

**Percorso minimo al pilota:** blocchi 1–6 + 9 → **~3–5 settimane** di lavoro tecnico + parallelo legale/commerciale.

---

## 3. Architettura di deploy raccomandata (per stadio)

### Stadio A — Pilota / Beta (0 → ~1.000 utenti)
Obiettivo: **costo quasi-zero**, validare con utenti reali. I file `render.yaml` e `fly.toml` sono già predisposti.

| Componente | Servizio | Piano | Costo/mese |
|------------|----------|-------|-----------|
| Backend (Spring Boot) | Render / Fly.io | Free / 512MB | 0 € (Render free) o ~2 € (Fly) |
| DB Postgres + pgvector | Supabase | Free (500MB) | 0 € |
| Redis cache | Upstash | Free (10k cmd/gg) | 0 € |
| Object storage | Cloudflare R2 | Free (10GB) | 0 € |
| Email | Resend | Free (3k/mese) | 0 € |
| AI | Ollama self-host (VPS GPU spot) o API a consumo | — | 0–50 € |
| Frontend | Cloudflare Pages / Vercel | Free | 0 € |
| Dominio | Registrar | annuale | ~1 €/mese |
| Error tracking | Sentry | Free | 0 € |
| **TOTALE** | | | **~5–55 €/mese** |

> ⚠️ I free tier "dormono" (cold start) e hanno limiti: ottimi per pilota, **non per traffico reale**.

### Stadio B — Lancio pubblico (~1k → ~20k utenti, target primo anno)

| Componente | Servizio | Piano | Costo/mese |
|------------|----------|-------|-----------|
| Backend (2 istanze) | Render/Fly/Railway | Standard | ~25–60 € |
| DB Postgres gestito | Supabase Pro / Neon | Pro | ~25–50 € |
| Redis | Upstash pay-as-you-go | — | ~10 € |
| Object storage | Cloudflare R2 | a consumo | ~5–15 € |
| Email | Resend/Postmark | Pro | ~20–40 € |
| **AI inference** | vedi §5 | — | **80–400 €** |
| CDN/Frontend | Cloudflare/Vercel | Pro | ~20 € |
| Osservabilità | Sentry + uptime | Team | ~26–50 € |
| Backup/DR | snapshot | — | ~10 € |
| **TOTALE** | | | **~220–650 €/mese** |

### Stadio C — Scala (50k+ utenti)
Kubernetes/autoscaling, read-replica DB, GPU dedicate o inference batch, observability stack completo: **indicativamente 1.500–5.000+ €/mese**, da dimensionare su metriche reali.

---

## 4. Costo AI — la decisione che muove il margine

L'app oggi usa **Ollama locale `qwen2.5:7b`** (gratis in dev, ma serve GPU in prod). Tre opzioni:

| Opzione | Costo | Pro | Contro |
|---------|-------|-----|--------|
| **A. Ollama self-host (GPU VPS)** | ~80–250 €/mese fisso | Costo fisso prevedibile, dati on-prem, **margine alto a volume** | Ops/manutenzione, scaling manuale |
| **B. API gestita open-weight** (Together/Groq/Fireworks, Qwen/Llama) | ~0,10–0,60 €/M token | Zero ops, scala automatica, modelli equivalenti | Costo variabile, dipendenza terzi |
| **C. Frontier API** (Claude / GPT) per orchestrazione, locale per il resto | premium su token | Massima qualità su ragionamento complesso | Costo maggiore — usare solo dove serve |

**Raccomandazione:** Stadio A–B → **opzione B** (API open-weight a consumo, nessuna GPU da gestire, modello equivalente al qwen attuale). A scala → valutare **A** (self-host) quando il volume rende il costo fisso più conveniente del per-token — coerente con la strategia "agenti proprietari" già nei doc di business. Mantenere l'astrazione provider per poter switchare. **Rate limiting già implementato** (`rate-limit-per-minute: 60`) protegge il costo.

> **Regola di margine:** monitorare **costo AI per proposta generata** e per **conversazione concierge**. Tenere il costo AI < 3–5% del GMV per proposta.

---

## 5. Sicurezza & Compliance (bloccante legale)

### GDPR / Privacy (mercato UE — obbligatorio)
- [ ] **Privacy Policy** + **Termini & Condizioni** + **Cookie Policy** (avvocato).
- [ ] **Cookie/consent banner** conforme (consenso prima di tracking).
- [ ] **Registro dei trattamenti** + base giuridica per ogni dato.
- [ ] **DPA** (Data Processing Agreement) con ogni fornitore (Stripe, Supabase, email, AI).
- [ ] **Consenso granulare per categoria** per il Travel Concierge / condivisione contesto con partner (requisito già segnalato nei doc business).
- [ ] **Diritti dell'utente**: export dati, cancellazione account ("right to be forgotten").
- [ ] **Minimizzazione**: confermare che non si conservano dati di pagamento sensibili (delegati al gateway — coerente con architettura).

### Sicurezza applicativa
- [ ] Security headers: **HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy**.
- [ ] **Rate limiting** su login/registrazione (anti brute-force) oltre al rate limit AI già presente.
- [ ] **Secrets manager** (no secrets in repo); rotazione `JWT_SECRET`, chiavi gateway, DB.
- [ ] **HTTPS ovunque** (già `force_https` su Fly).
- [ ] Verifica **firma webhook** pagamenti (oggi mock).
- [ ] Audit dipendenze (CVE) + allow-list endpoint pubblici in `SecurityConfig` (già pratica nel repo).
- [ ] **PCI-DSS**: delegando il pagamento al gateway (Stripe Elements/Checkout) si resta in **SAQ-A** (scope minimo) — da confermare.

### Business/Legale di settore
- [ ] Inquadramento **agenzia viaggi / intermediazione**: verificare con legale se serve licenza/assicurazione in base al modello di incasso (i doc business già segnalano il rischio).
- [ ] Termini per **partner** (commissioni 10% hotel / 3% altri — già in config), fatturazione, payout.
- [ ] Assicurazione RC professionale (valutare).

---

## 6. Modello di ricavo & pricing

Modello già definito nei doc business e **codificato in `application.yml`**:

| Fonte | % | Note |
|-------|---|------|
| Commissione hotel | **10%** del GMV | `commission.hotel-pct: 10` |
| Commissione altri servizi (ristoranti, voli, accessori) | **3%** | `commission.other-pct: 3` |
| Pagamento rateale | margine neutro | incasso immediato piattaforma, rischio sul gateway |

**Leve di ricavo aggiuntive (post-lancio):**
- **Featured placement** partner (sponsorizzazioni catalogo) — alta marginalità.
- **Abbonamento partner premium** (analytics, priorità ranking).
- **Travel Concierge premium** per l'utente (tier a pagamento per assistenza estesa).
- **Lead/advertising** su Forum & Stories (alto traffico SEO).

**Esempio di unit economics (illustrativo):**
- Ticket medio viaggio: **600 €** · commissione media ~8% → **~48 € ricavo/prenotazione**.
- Costo AI+infra per prenotazione (a regime): **< 5 €**.
- Margine di contribuzione lordo: **> 85%** del ricavo commissione.
- Break-even infra Stadio B (~400 €/mese) ≈ **~9 prenotazioni/mese**. *(numeri da validare).*

---

## 7. Go-To-Market & Marketing

### 7.1 Posizionamento
> **"Travel AI pianifica, prenota e paga il tuo viaggio su misura del tuo budget — in un'unica app, senza redirect."**

Differenziatori da comunicare:
1. **Budget-first**: l'utente parte dal budget, l'AI costruisce il viaggio (non il contrario).
2. **Tutto in-app**: niente rimbalzo su Booking/OTA — prenoti e paghi qui.
3. **Concierge AI durante il viaggio** (assistenza contestuale reale).
4. **Itinerario "vivo"** + community/recensioni con sub-rating (trust vs TripAdvisor).
5. **Multi-lingua** (en/it/fr/es) → mercato europeo da subito.

### 7.2 Segmenti target
- **Primario:** viaggiatori leisure 25–45 anni, budget-conscious, mobile-first, coppie/famiglie short-break.
- **Secondario:** partner supply — hotel indipendenti e ristoranti locali (no big chain) che vogliono canale diretto a basso costo vs OTA al 15–25%.

### 7.3 Canali e tattiche

| Canale | Tattica | Costo | Priorità |
|--------|---------|-------|----------|
| **SEO/Content** | Stories, Forum, guide destinazioni (già nel prodotto → asset SEO nativi) | basso | 🔥 Alta |
| **Social organico** | Instagram/TikTok travel content, before/after itinerari AI | tempo | 🔥 Alta |
| **Paid (Meta/Google)** | Campagne su intent "viaggio + budget", retargeting | medio-alto | Media (post-PMF) |
| **Referral / inviti** | "Invita un amico, sconto su commissione" | basso | Media |
| **Partnership locali** | Co-marketing con hotel/ristoranti pilota | basso | 🔥 Alta (pilota) |
| **PR / launch** | Product Hunt, blog travel-tech, press locale | basso | Media |
| **Influencer micro** | Travel micro-influencer su destinazioni pilota | medio | Media |

### 7.4 Strategia di lancio (3 fasi)
1. **Closed Beta (waitlist)** — pilota ≥10 hotel + ≥10 ristoranti in **1 città/destinazione**. Inviti limitati, feedback intensivo, NPS. *(coerente con "Fase 4 — Validazione" dei doc).*
2. **Public Launch** — apertura sulla destinazione validata, push SEO + social + Product Hunt, attivazione paid leggero.
3. **Expansion** — nuove destinazioni/lingue una alla volta, ognuna con un nucleo partner locale.

> **Strategia geografica:** non lanciare "ovunque". Conquistare **una destinazione alla volta** con densità di supply sufficiente (il valore dell'app dipende dall'inventario locale). Espandere a macchia d'olio.

### 7.5 Budget marketing indicativo (primi 6 mesi)
| Voce | Stima |
|------|-------|
| Content/SEO (freelance + tool) | 500–1.500 €/mese |
| Paid ads (test) | 500–2.000 €/mese |
| Influencer micro (pilota) | 500–1.500 € una tantum |
| Tool (analytics, email mkt, design) | ~100 €/mese |
| **Totale 6 mesi** | **~8.000–25.000 €** (scalabile, partire lean) |

---

## 8. Metriche & KPI da strumentare

| Area | KPI | Target indicativo |
|------|-----|-------------------|
| **Acquisizione** | CAC, traffico organico, signup rate | CAC < 1/3 LTV |
| **Attivazione** | % che completa una richiesta di pianificazione | > 40% |
| **Conversione** | % proposta → prenotazione pagata | > 3–5% |
| **Ricavo** | GMV, ricavo commissione, AOV | crescita MoM |
| **Retention** | utenti ricorrenti, riprenotazioni, NPS | NPS > 40 |
| **AI/Costi** | costo AI per proposta, latenza pipeline, hit-rate RAG | costo < 5% ricavo |
| **Supply** | n° partner attivi, copertura per destinazione, tempo onboarding | densità per città |
| **Tech** | uptime, p95 latency, error rate, Core Web Vitals | uptime > 99,5% |

> Strumentare con: analytics privacy-friendly (Plausible/PostHog), Sentry per errori, dashboard GMV/commissioni dall'admin.

---

## 9. Roadmap go-live (timeline indicativa)

```
Settimana 1-2   ▸ Pagamenti reali (Stripe) + email transazionale + sicurezza headers
Settimana 2-3   ▸ AI hosting prod + osservabilità (Sentry) + CI/CD + rate-limit auth
Settimana 3-4   ▸ Legale/GDPR (parallelo) + caricamento inventario pilota (admin)
Settimana 4-5   ▸ Test/E2E flussi critici + hardening + load test leggero
Settimana 5-6   ▸ Closed Beta su 1 destinazione (waitlist) + raccolta feedback/NPS
Mese 2-3        ▸ Iterazione PMF → Public Launch destinazione validata
Mese 3-6        ▸ Klarna/PayPal, cross-sell auto/lettini, expansion destinazioni
Mese 6+         ▸ Context API partner aderenti, app mobile nativa, scala infra
```

---

## 10. Checklist finale "pronti per la produzione"

**Tecnico**
- [ ] Stripe live + webhook firmati testati end-to-end
- [ ] Email transazionale con dominio verificato (SPF/DKIM/DMARC)
- [ ] AI hosting prod scelto e dimensionato + rate limiting verificato
- [ ] Postgres gestito + backup automatici + restore testato
- [ ] HTTPS + security headers + secrets in vault + JWT ruotato
- [ ] Sentry + logging strutturato + uptime monitor + alert
- [ ] CI/CD verde (build+test+deploy) + coverage ≥ 80%
- [ ] E2E su planner → booking → pagamento → conferma
- [ ] `ddl-auto: validate` confermato + migrazioni Flyway pulite in prod

**Legale/Business**
- [ ] Privacy + T&C + Cookie + DPA fornitori firmati
- [ ] Consenso granulare Concierge/partner
- [ ] Inquadramento intermediazione viaggi verificato con legale
- [ ] Contratti partner + flusso payout + fatturazione
- [ ] Almeno 10 hotel + 10 ristoranti reali caricati e prenotabili

**Marketing/Lancio**
- [ ] Landing + waitlist live
- [ ] Asset SEO (stories/guide) pubblicati per la destinazione pilota
- [ ] Canali social attivi + piano contenuti 4 settimane
- [ ] Analytics + funnel + dashboard KPI operativi
- [ ] Piano supporto utenti (FAQ, canale assistenza)

---

## 11. Rischi principali & mitigazioni

| Rischio | Impatto | Mitigazione |
|---------|---------|-------------|
| **Cold-start supply** (poco inventario → poco valore) | Alto | Lancio per singola destinazione ad alta densità partner |
| Costi AI fuori controllo a volume | Medio | Rate limiting (presente) + monitor costo/proposta + provider switchabile |
| Compliance GDPR/intermediazione | Alto (legale) | Pacchetto legale prima del lancio pubblico |
| Dipendenza da free tier (downtime/limiti) | Medio | Upgrade a Stadio B prima del traffico reale |
| Frode/chargeback pagamenti | Medio | Stripe Radar + politiche cancellazione chiare |
| Qualità proposte AI (allucinazioni) | Medio | RAG grounding (presente) + temperatura bassa + feedback loop |
| Acquisizione costosa senza PMF | Alto | Beta lean, validare conversione prima di scalare paid |

---

*Master Plan di produzione — Travel AI · v1.0, 29/06/2026. Le stime di costo, mercato e timeline sono indicative e vanno confermate con preventivi e dati reali in fase di planning. Aggiornare ad ogni milestone.*
