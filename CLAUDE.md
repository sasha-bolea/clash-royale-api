# Royal Arena — istruzioni di progetto

Web app (PWA) per tornei di Clash Royale tra amici di un clan: si scelgono i giocatori, si gioca su Clash Royale, l'app rileva da sola le partite e costruisce tabellone e classifica. Live su https://royalarena.it.

- Stack: Nuxt 4 (SPA, `ssr: false`) + TypeScript, Pinia, Supabase (Postgres, nessuna auth), proxy RoyaleAPI per l'API Clash Royale. Dettagli in [`docs/architettura.md`](docs/architettura.md).
- Repo GitHub: `sasha-bolea/clash-royale-api` (nome storico, il progetto è Royal Arena).

## ⚠ Deploy automatico
**Ogni push su `main` va subito online su royalarena.it** (Vercel, ~1 minuto). Ogni altro branch crea un'anteprima Vercel (`royalarena-git-<branch>-sasha-boleas-projects.vercel.app`) che però usa il **database vero**. Non pushare su `main` senza l'ok di Sasha. Dettagli in [`docs/deploy.md`](docs/deploy.md).

## Comandi
- `npm ci` — installa le dipendenze.
- `npm test` — test unitari (vitest, logica pura in `tests/`).
- `npm run build` — build di produzione (da fare prima di ogni push).
- Prova locale con dati veri: vedi [`docs/procedure.md`](docs/procedure.md) ("Anteprima locale").

## Convenzioni
- **UI**: prima di toccare l'interfaccia leggi [`docs/design-system.md`](docs/design-system.md) — kit `ra-*` in `app/assets/css/ui.css`, regole vincolanti (una sola area che scorre per pagina, nomi su una riga, niente `confirm()` nativi, font, target ≥ 44px). Aggiorna il catalogo appena aggiungi o cambi un elemento.
- **Tabellone**: la logica sta in `app/composables/useBracket.ts` (analisi tollerante per il torneo dal vivo, `analyzeTournament` sceglie l'analizzatore per dimensione) e `app/utils/pastTournament.ts` (validazione rigorosa per i tornei recuperati). Nuova logica pura → test in `tests/` prima del codice.
- **Asset Supercell**: solo come da Fan Content Policy (sezione legale del design system); disclaimer in `AppFooter.vue` sempre visibile in home.
- **iOS PWA**: le modifiche a nome/icona/colori del manifest richiedono di reinstallare l'icona; il resto si aggiorna da solo (avviso "Nuova versione disponibile").
- Il sito si prova sul telefono: su Chrome desktop molti difetti iOS non si vedono (vedi `docs/bug-risolti.md`).
