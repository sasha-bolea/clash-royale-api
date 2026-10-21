# Architettura

## Componenti
| Parte | Dove | Cosa fa |
|---|---|---|
| Frontend SPA | `app/` (Nuxt 4, `ssr: false`) | Tutte le pagine girano nel browser; PWA con service worker (`@vite-pwa/nuxt`, `registerType: 'prompt'`). |
| Database | Supabase (progetto `mehxfizbkmmjwmueydse`), schema in [`schema.sql`](schema.sql) | Tabelle `clans`, `players`, `tournaments`, `tournament_players`, `tournament_matches`, `standings`. RLS aperta: la "sicurezza" è l'oscurità del codice clan. Chiamato dal browser con la chiave pubblica (`app/plugins/supabase.client.ts`). |
| Proxy Clash Royale | `server/api/cr/*` + `server/utils/crFetch.ts` (funzioni serverless Vercel) | Inoltra a `proxy.royaleapi.dev` aggiungendo `CR_API_KEY`, che non arriva mai al browser. |
| Cron | `pg_cron` su Supabase (`schema.sql`) | Elimina clan vuoti dopo 24h; annulla tornei attivi da >2h senza partite. |

## Flussi principali
- **Torneo dal vivo** (`app/composables/useTournamentPolling.ts`): ogni 30s legge il battlelog di ogni partecipante, salva le nuove partite 1v1 tra partecipanti giocate dopo l'avvio (`cr_battle_id` deterministico da orario + tag, unico per torneo), aggiunge +1 vittoria in `standings`. Quando le partite bastano, `useBracket().analyzeTournament` calcola il podio e il torneo passa a `finished`.
- **Tabellone** (`app/composables/useBracket.ts`, `useBracketView.ts`): nessun calendario fisso, sono le partite giocate a definire gli accoppiamenti (es. a 4: le prime due partite disgiunte sono le semifinali). L'analisi del dal vivo è **tollerante** (cerca le partite che servono).
- **Torneo passato** (`app/pages/clans/[code]/recupera.vue`, `app/utils/pastTournament.ts`): l'utente sceglie partite recenti non già in un torneo valido; la validazione è **rigorosa** (numero esatto di partite, accoppiamenti, ordine cronologico) perché le partite sono scelte a mano. Salvataggio in `useApi().savePastTournament`: creato `invalid`, passato a `finished` solo a partite salvate (niente transazioni lato client).
- **Clan e sessione**: i clan aperti sono salvati nel `localStorage` del telefono (`useBrowserSession`); il middleware `clan-access` risolve il codice con l'RPC `get_clan_by_code` a ogni cambio clan.

## Impaginazione (app shell)
`body` ancorato (`position: fixed`) con altezza `--ra-app-h` fissata in `app.vue` all'altezza reale dello schermo quando l'app è installata (iOS a volte riporta 47px in meno). Ogni pagina è `PageHeader` + `<main>` (unica area che scorre, rimbalzo iOS) + eventuale `ra-actionbar` + `BottomNav`. Regole in `design-system.md`.

## Limiti noti
- L'API Clash Royale restituisce solo le **ultime 25 battaglie** per giocatore: il rilevamento e il recupero dei tornei passati funzionano solo su partite recenti.
- Torneo dal vivo a 6: se la finale di un girone è una rivincita, `detectTriangles` non trova il girone e il torneo non si chiude da solo (la validazione dei tornei passati invece lo gestisce). In backlog.
