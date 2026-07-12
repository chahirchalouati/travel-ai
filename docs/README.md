# Documentazione Travel AI

Documenti HTML autonomi (si aprono con doppio clic nel browser, nessun server richiesto).

| Documento | Per chi | Contenuto |
|-----------|---------|-----------|
| [guida-uso.html](guida-uso.html) | Utente finale | Racconto d'uso dell'app in 13 capitoli: dal primo accesso al biglietto, seguendo una viaggiatrice. Ogni capitolo = un caso d'uso con i passi concreti. |
| [api-spec.html](api-spec.html) | Sviluppatori / integratori | Specifica API completa in stile RFC/OpenID Connect. Copre **54 controller / 225 endpoint** in 10 parti + registri. |

## `api-spec.html` — struttura

- **Parte I** — Fondamenti: envelope `ApiResponse<T>`, paginazione, errori, rate limit (60/min), auth Bearer, ruoli.
- **Parte II** — Scoperta pubblica: destinations, 5 cataloghi + suggest, attractions, contenuti pubblici.
- **Parte III** — Identità: auth completo (13 endpoint), users, profilo.
- **Parte IV** — Transazioni: bookings, payments (fan-out asincrono), invoices, price-watch. Pricing server-authoritative.
- **Parte V** — AI: chat RAG, planner multi-agente, concierge.
- **Parte VI** — Coinvolgimento: reviews, forum, notifiche, messaggi, media, loyalty, subscriptions.
- **Parte VII** — Viaggi collaborativi: travel requests, itinerario live, budget, inviti/voti.
- **Parte VIII** — Partner.
- **Parte IX** — Amministrazione: console (22), catalog CRUD (28) con campi `Upsert`, altre aree.
- **Parte X** — Webhook (stripe/paypal/klarna, itinerary).
- **Registri**: codici d'errore, indice per dominio (§13), **Appendice C** (indice piatto di tutti i 225 endpoint), **Appendice D** (modelli di risposta).

Distribuzione auth: **pub 64 · bearer 95 · ADMIN 66**.

## Manutenzione

I documenti sono derivati dal codice reale (controller, DTO, `SecurityConfig`, `ErrorCode`). Se cambi endpoint o modelli backend, aggiorna `api-spec.html` di conseguenza. Lo script che ha generato l'indice piatto degli endpoint riclassifica l'auth dalla allow-list di `shared/config/SecurityConfig.java`.
