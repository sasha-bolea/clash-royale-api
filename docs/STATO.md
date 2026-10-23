# Stato del progetto

_Ultimo aggiornamento: 2026-10-24 (correzioni rilevamento partite, codice clan, Suggerisci)_

## Stato attuale
- **Online** su https://royalarena.it (Vercel, deploy automatico da `main`). Database Supabase attivo con dati reali (clan "torneo fioi", codice MTHV83).
- **Redesign "Clash potenziato"** completo su tutte le pagine (kit `ra-*`, [`design-system.md`](design-system.md)).
- **Refactor UX** online: una sola area che scorre con rimbalzo iOS, header e tab bar fermi, barra azione AVVIA, dialoghi dal basso, conferme in-app, skeleton, stati vuoti, card "Installa l'app".
- **Nuove funzioni** online: vincitore in evidenza nello storico; "Registra un torneo passato" con validazione rigorosa (17 test vitest).
- Online anche: partite doppie e partite del torneo precedente scartate dal rilevamento; codici clan non validi rifiutati; Suggerisci disattivato con una sola combinazione.
- iPhone: la striscia in basso (iOS dà a volte 47px in meno all'app) non si può eliminare, solo mimetizzare col colore della tab bar; pagina vuota corretta. **In attesa di conferma sul telefono** di Sasha.

## Problemi aperti
- Il middleware `clan-access` aspetta una richiesta al database a ogni cambio clan: se su iOS si blocca alla riapertura, il cambio pagina sembra non rispondere (prima della correzione causava la pagina vuota).
- Torneo dal vivo a 6: se la finale di un girone è una rivincita, il torneo non si chiude da solo (`detectTriangles`).
- `npx nuxi typecheck` non funziona (manca `vue-tsc` nel progetto).

## Decisioni
| Data | Decisione | Motivo |
|---|---|---|
| 2026-10-20 | Stile "Clash potenziato" con asset Supercell dove servono | Scelta di Sasha; consentito dalla Fan Content Policy con disclaimer, mai loghi ufficiali |
| 2026-10-20 | Font Lilita One ospitato sul sito, niente Google Fonts | GDPR (sentenza LG München 2022) |
| 2026-10-20 | Asset non usati rimossi, sorgenti grafici in `design/sorgenti/` | Tutto `public/` viene scaricato offline dalla PWA (da ~6 MB a 1,3 MB) |
| 2026-10-20 | Lavoro su branch con anteprima Vercel, `main` solo con ok di Sasha | `main` va in produzione a ogni push |
| 2026-10-23 | Niente altezza forzata dell'app installata (tolto `--ra-app-h` del 21/10) | In quello stato iOS dà davvero 47px in meno: allungare l'app tagliava la tab bar |
| 2026-10-23 | Stessa partita = stessi giocatori e orari entro 10s; il rilevamento scarta partite già in tornei non annullati | Clash Royale riporta la stessa battaglia con 1s di differenza; la tolleranza di 2 minuti all'avvio riprendeva la finale precedente |
| 2026-10-21 | Niente transizione tra pagine | Con `out-in` su iOS restava la pagina vuota |
| 2026-10-21 | Torneo passato: ogni 1v1 tra membri; partite dei tornei annullati riusabili; classifica completa dedotta dal numero di partite; vittorie contate in classifica | Scelte di Sasha, coerenti con il torneo dal vivo |
| 2026-10-21 | Validazione rigorosa separata (`utils/pastTournament.ts`) invece di riusare l'analisi del dal vivo | Le partite scelte a mano vanno controllate in numero, accoppiamenti e ordine; l'analisi del dal vivo è tollerante |
| 2026-10-21 | Salvataggio torneo passato: prima `invalid`, poi `finished` | Nessuna transazione dal browser: un errore a metà non lascia dati che contano |
| 2026-10-21 | `vitest` per la logica pura, test prima del codice | Regola di lavoro per le nuove funzioni |

## Backlog
1. Middleware `clan-access` non bloccante: usare subito il clan salvato sul telefono e verificare col database dopo (proposto, in attesa dell'ok).
2. Correggere il torneo dal vivo a 6 con finale di girone in rivincita, riusando la logica di `pastTournament.ts` (proposto, in attesa dell'ok).
3. Aggiungere `vue-tsc` per il typecheck.
4. Cancellare i branch già uniti (`redesign`, `ux-refactor`, `storico-vincitore`, `torneo-passato`, `hotfix-pagina-vuota`) — locali e remoto `redesign`.
5. Valutare la vetrina `/design` (non linkata): tenerla come riferimento o rimuoverla.
