# Bug risolti

## 2026-10-23 — Il nuovo torneo parte con la finale del torneo precedente
- **Sintomo**: appena avviato un torneo (timer 0:13), il tabellone mostrava già "Partita 1" giocata.
- **Causa**: il rilevamento accetta partite fino a 2 minuti prima dell'avvio (tolleranza sugli orologi) e non controllava se una partita apparteneva già a un altro torneo: la finale del torneo precedente (finita 2 minuti prima) è stata ripresa.
- **Fix**: all'avvio del rilevamento si caricano le partite già in tornei non annullati del clan e si scartano.
- **File**: `app/composables/useTournamentPolling.ts`, `app/utils/sameBattle.ts`.

## 2026-10-23 — Stessa partita contata due volte
- **Sintomo**: nel torneo del 23/10 04:26 UTC la partita POLLOLOKO_717 – Swahx risulta due volte (04:46:39 e 04:46:40), con vittoria contata due volte.
- **Causa**: Clash Royale riporta la stessa battaglia con l'orario di 1 secondo diverso nello storico dei due giocatori; l'id della partita contiene l'orario, quindi risultavano due partite.
- **Fix**: una partita è "la stessa" se ha gli stessi giocatori e orari entro 10 secondi (`isSameBattle`), sia nel rilevamento dal vivo sia nel recupero dei tornei passati. Test in `tests/sameBattle.test.ts`.
- **File**: `app/utils/sameBattle.ts`, `app/composables/useTournamentPolling.ts`, `app/utils/pastTournament.ts`.

## 2026-10-23 — Tab bar tagliata in basso (app installata)
- **Sintomo**: le scritte STORICO / STATS uscivano dal fondo dello schermo.
- **Causa**: la correzione del 21/10 allungava l'app all'altezza dello schermo, ma in quello stato iOS dà davvero all'app 47px in meno: il fondo finiva fuori schermo.
- **Fix**: tolta l'altezza forzata (`--ra-app-h`); la striscia che iOS disegna sotto prende il colore del manifest, uguale al fondo della tab bar.
- **File**: `app/app.vue`, `app/assets/css/style.css`.

## 2026-10-21 — Pagina vuota su iPhone, tab bar in alto
- **Sintomo**: nell'app installata, cambiando pagina restava solo la barra di navigazione, spostata in cima; nessun contenuto.
- **Causa**: la transizione tra pagine (`pageTransition` mode `out-in`, aggiunta nel refactor UX) toglie la pagina vecchia prima che la nuova sia pronta; se la richiesta del middleware `clan-access` si blocca (iOS alla riapertura dell'app), la nuova non arriva mai. Su Chrome desktop non si riproduce.
- **Fix**: rimossa la transizione tra pagine (restano le animazioni interne).
- **File**: `nuxt.config.ts`, `app/assets/css/ui.css`.

## 2026-10-21 — Banda azzurra sotto la tab bar (app installata)
- **Sintomo**: in fondo allo schermo una striscia azzurra sotto la barra di navigazione, a intermittenza.
- **Causa**: iOS a volte riporta all'app un'altezza di 797px su 844 (manca la barra di stato, 47px) pur disegnandola da sotto l'orologio: i 47px in basso restano scoperti. Misurato con un riquadro di diagnosi.
- **Fix**: nell'app installata l'altezza del body è fissata a `max(innerHeight, screen.height)` (`--ra-app-h`, ricalcolata a resize/rotazione/riapertura); fondo `html` e colore del manifest = colore della tab bar (`#040820`), così un'eventuale striscia non si nota.
- **File**: `app/app.vue`, `app/assets/css/style.css`, `app/assets/css/ui.css`, `nuxt.config.ts`.
- **Storia**: problema presente dagli inizi; tentativi precedenti (`translateZ` sulla nav, app-shell flex, `inset: 0`) non bastavano perché la causa è l'altezza della finestra, non il CSS della nav.

## 2026-10-21 — Pulsante ARENA tagliato dal contenuto
- **Sintomo**: il cerchio rialzato di ARENA veniva coperto dalle card durante lo scorrimento.
- **Causa**: le card (posizionate) venivano disegnate sopra la tab bar (non posizionata).
- **Fix**: `.bottom-nav { position: relative; z-index: 20 }`.
- **File**: `app/assets/css/style.css`.

## 2026-10-20 — Comandi del browser dentro l'app installata
- **Sintomo**: su alcune pagine compariva la barra di Safari (indietro, condividi, ricarica, apri in Safari).
- **Causa**: icona installata con il manifest vecchio (prima dello `scope: '/'`); iOS non aggiorna il manifest delle app già installate.
- **Fix**: reinstallare l'icona da Safari (procedura in `procedure.md`). Nessuna modifica al codice.

## 2026-10-20 — Nessun modo di iniziare un nuovo torneo dal podio
- **Sintomo**: a fine torneo restava il podio, senza un modo per tornare alla selezione giocatori (solo ricaricando).
- **Causa**: il podio resta in memoria (`completedPositions` nello store) finché non si ricarica.
- **Fix**: pulsante NUOVO TORNEO che azzera lo store e ripropone gli stessi giocatori selezionati.
- **File**: `app/components/Podium.vue`, `app/pages/clans/[code]/torneo.vue`.

## 2026-10-20 — "Vedi storico" dal podio dava 404
- **Sintomo**: dal podio, "Vedi storico" apriva "Page not found: /storico".
- **Causa**: link fisso `to="/storico"`, residuo della versione HTML; le pagine stanno sotto `/clans/<codice>/`.
- **Fix**: link costruito con il codice del clan.
- **File**: `app/components/Podium.vue`.

## 2026-10-21 — Vincitore nello storico mai mostrato (tornei a 3)
- **Sintomo**: la fascia "Vincitore" non compariva in nessun torneo.
- **Causa**: `analyzeBracket3` restituisce le posizioni in ordine ma senza il campo `place`; il filtro cercava `place === 1`.
- **Fix**: stessa regola del podio, `place ?? indice + 1`.
- **File**: `app/components/TournamentHistoryCard.vue`.

## 2026-10-20 — Immagini delle arene inesistenti
- **Sintomo**: nessuno visibile, ma `arenaImg()` puntava a `/images/arenas/*.png`, cartella mai esistita.
- **Fix**: funzione rimossa (non era usata).
- **File**: `app/composables/useTournamentStats.ts`.

## 2026-05-29 — Bottom nav fluttuante su iOS (storico, dalla nota `bottom-nav-ios-fix.txt`)
- **Sintomo**: in PWA iOS la barra in basso a volte "fluttuava" con un vuoto sotto.
- **Causa** (diagnosi di allora): bug di repaint di `position: fixed` su iOS.
- **Fix** di allora: `translateZ(0)`, poi app-shell flex. Superato dal fix della banda del 2026-10-21 (causa reale: altezza della finestra).
