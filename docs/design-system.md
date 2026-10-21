# Design system — Royal Arena

Direzione: **"Clash potenziato"**. Il sito deve sembrare un menu di gioco di Clash Royale: pannelli blu con bordo scuro e profondità, testi bianchi con contorno, pulsanti 3D lucidi, oro per ciò che conta (vittorie, azione principale). Il fan site deve restare riconoscibilmente *non ufficiale* (vedi Regole legali).

- Token e componenti: [`app/assets/css/ui.css`](../app/assets/css/ui.css) (prefisso `ra-`).
- Vetrina live con dati finti: pagina `/design` ([`app/pages/design.vue`](../app/pages/design.vue)), non linkata dal sito.
- Colore di sistema (theme-color, splash PWA): `#040820`, uguale al fondo della tab bar.
- Il vecchio CSS ([`app/assets/css/style.css`](../app/assets/css/style.css)) viene sostituito pagina per pagina durante il redesign; i nuovi elementi usano **solo** classi `ra-`.

## Regole vincolanti

1. **Colori solo da token** (`--ra-*` in `ui.css`). Oro = azione principale o vittoria; rosso = annulla/avversario/live; verde = conferma/selezionato; blu = tutto il resto.
2. **Una sola azione oro per schermata** (`ra-btn--gold`). Le azioni secondarie sono blu o `ra-btn--ghost`.
3. **Testi grandi sempre `ra-display`** (contorno scuro); testo corrente senza contorno sotto i 14px.
4. **Ogni superficie è un `ra-panel`** (o un componente che ne eredita lo stile: chip, stat, match). Niente card con bordo sottile o piatte.
5. **Profondità = ombra piena verso il basso** (`--ra-depth`), non ombre sfocate da sole. Premere = scendere di 3px.
6. **Animazioni brevi e con rimbalzo** (`--ra-ease-pop`), mai bloccanti; tutte disattivate con `prefers-reduced-motion`.
7. **Target touch ≥ 44px** (pulsanti 52px, chip 56px; `ra-btn--xs` è 32px visibili ma con area di tocco estesa).
8. **Una sola area che scorre per pagina**: la pagina è `[PageHeader] + <main> + [ra-actionbar] + [BottomNav]`. Scorre solo `<main>`, con rimbalzo iOS. Mai `overscroll-behavior: none`, mai altri contenitori con scroll verticale (eccezioni: dialoghi lunghi, strisce orizzontali).
9. **I nomi stanno su una riga**: troncati con "…" (`white-space: nowrap; text-overflow: ellipsis`). Gruppi di nomi = `ra-strip` orizzontale, mai a capo.
10. **Mai `confirm()`/`alert()` del browser**: si usa `await askConfirm({...})` (`useConfirm`). Nel dialogo, il tasto che chiude si chiama "Indietro", per non confondersi con azioni tipo "Annulla torneo".
11. **Caricamento = `SkeletonList`**, vuoto = `EmptyState` con icona e possibilmente un'azione. Niente testi "Caricamento...".
12. **Font**: `--ra-font-display` (Lilita One) per titoli, nomi, numeri e pulsanti; `--ra-font-text` (sistema) per le frasi. Dimensioni solo dalla scala `--ra-fs-*`.
13. **Tocco da app**: niente evidenziazione al tocco né selezione del testo con la pressione lunga (si riattiva con `ra-selectable`). Ogni elemento toccabile reagisce alla pressione.

## Catalogo

| Elemento | Classe | Uso | Esempio |
|---|---|---|---|
| Sfondo arena | `ra-bg` | Riflettore dall'alto + vignetta + rombi; sul contenitore radice della pagina | [`design.vue:35`](../app/pages/design.vue#L35) |
| Testo display | `ra-display` + `--xl/--lg/--md`, `--gold` | Titoli di stato ("TORNEO CONCLUSO"), numeri importanti | [`design.vue:43`](../app/pages/design.vue#L43) |
| Etichetta sezione | `ra-label` | Titoletto maiuscolo azzurro sopra un gruppo | [`design.vue:42`](../app/pages/design.vue#L42) |
| Nastro titolo | `ra-ribbon` | Titolo pagina in alto, uno per pagina; riflesso animato | [`design.vue:37`](../app/pages/design.vue#L37) |
| Pannello | `ra-panel`, `--interactive`, `--gold` | Card generiche; `--gold` per il vincitore/evidenza; `--interactive` se cliccabile | [`design.vue:154`](../app/pages/design.vue#L154) |
| Pulsante 3D | `ra-btn` + `--gold/--red/--green/--ghost`, `--lg`, `--block`, `--round` | Azioni; vedi regola 2 | [`design.vue:50`](../app/pages/design.vue#L50) |
| Tab | `ra-tabs` > `ra-tab.is-active`, `ra-tabs--sm` per filtri compatti | Scelta tra 2–3 viste nella stessa pagina; `--sm` per filtri (1M/3M/TUTTO) | [`statistiche.vue:91`](../app/pages/clans/[code]/statistiche.vue#L91) |
| Chip giocatore | componente `PlayerChip` → `ra-chip.is-selected` (+ `__body`, `__name`, `__tag`, `__trophies`, `__check`) | Selezione giocatori per il torneo, dentro il vassoio incassato `player-list-card` | [`PlayerChip.vue:17`](../app/components/PlayerChip.vue#L17) |
| Avatar | `ra-avatar`, `--red`, `--gold`, `--sm` | Iniziale del giocatore; blu = lato sinistro, rosso = avversario | [`design.vue:84`](../app/pages/design.vue#L84) |
| Riga partita | componente `MatchRow` → `ra-match` (+ `__side.is-winner`, `__score`, `__crown`) | Partita blu vs rosso con corone | [`MatchRow.vue:13`](../app/components/MatchRow.vue#L13) |
| Tile statistica | `ra-stat` (+ `__icon`, `__value`, `__value--sm`, `__label`) | Numeri chiave in griglia da 3 (`ra-stats-summary`) o 2 (`ra-pstats__grid`) | [`statistiche.vue:119`](../app/pages/clans/[code]/statistiche.vue#L119) |
| Podio | `ra-podium` > `__place--1/2/3` (+ `__crown`, `__name`, `__wins`, `__step`) | Fine torneo; gradini che salgono, corona che fluttua | [`design.vue:140`](../app/pages/design.vue#L140) |
| Fine torneo | componente `Podium` → `ra-final` (+ `__title`, `__stage`, `__rays`, `__others`, `__row`, `__actions`) | Podio su palco con raggi rotanti; dal 4° posto in lista; NUOVO TORNEO + storico | [`Podium.vue:38`](../app/components/Podium.vue#L38) |
| Tab bar | componente `BottomNav` → `bottom-nav ra-tabbar` > `__item.is-active`, `__center` | Navigazione in basso delle pagine clan; centro rialzato per ARENA | [`BottomNav.vue:14`](../app/components/BottomNav.vue#L14) |
| Badge | `ra-badge`, `--live`, `--gold` | Codici clan, contatori, stato LIVE pulsante | [`design.vue:94`](../app/pages/design.vue#L94) |
| Entrata a cascata | `ra-pop-in` + `animation-delay` | Liste che compaiono (60ms tra un elemento e l'altro) | [`design.vue:79`](../app/pages/design.vue#L79) |
| Pulsante piccolo | `ra-btn--sm` (anche con `--round`) | Azioni in intestazione e nelle righe di lista (rimuovi, copia) | [`PageHeader.vue:13`](../app/components/PageHeader.vue#L13) |
| Intestazione pagina | componente `PageHeader` (`title`, `backTo`, slot `action`) → `ra-header` | In cima a **ogni** pagina: nastro + indietro a sinistra + azione a destra | [`torneo.vue:244`](../app/pages/clans/[code]/torneo.vue#L244) |
| Finestra di dialogo | `ra-modal-overlay` > `ra-modal ra-pop-in` (+ `__title`, `__actions`) | Tutti i dialoghi; azioni in griglia 2 colonne: secondaria `ghost` a sinistra, principale a destra | [`JoinByCodeModal.vue:43`](../app/components/JoinByCodeModal.vue#L43) |
| Campo di testo | `ra-input` (automatico per `input[type=text]` dentro `ra-modal`) | Input incassato con anello oro al focus | [`JoinByCodeModal.vue:48`](../app/components/JoinByCodeModal.vue#L48) |
| Home | `ra-home`, `ra-hero` (+ `__logo`, `__sub`, `__cta`) | Landing senza clan (logo che fluttua) e lista clan | [`index.vue:14`](../app/pages/index.vue#L14) |
| Card clan | componente `ClanCard` → `ra-panel--interactive ra-clan-card` | Un clan salvato: scudo, nome, codice | [`ClanCard.vue:8`](../app/components/ClanCard.vue#L8) |
| Footer disclaimer | componente `AppFooter` → `ra-footer` | Solo in home; testo legale Supercell, non rimuovere | [`AppFooter.vue:7`](../app/components/AppFooter.vue#L7) |
| Toast | componente `Toast` → `ra-toast.is-visible` | Messaggi brevi, sopra la tab bar (conferme di azioni riuscite) | [`Toast.vue:6`](../app/components/Toast.vue#L6) |
| Dialogo con passaggi | componente `InfoDialog` (`title`, `steps`) → `ra-info`, `ra-steps` | Spiegazioni "Come funziona": numeri dorati, X rotonda in alto a destra | [`torneo.vue:312`](../app/pages/clans/[code]/torneo.vue#L312) |
| Riga etichetta + contatore | `ra-arena__label-row` (`ra-label` + `ra-badge`) | Titolo di sezione con conteggio a destra; badge oro quando il valore è valido | [`torneo.vue:276`](../app/pages/clans/[code]/torneo.vue#L276) |
| Stato live | `ra-panel ra-live` (+ `__text`, `__timer`, `__players`, `__player`, `__tools`) | Torneo in corso: badge LIVE, timer, partecipanti come pillole con avatar | [`torneo.vue:316`](../app/pages/clans/[code]/torneo.vue#L316) |
| Interruttore | `ra-toggle` > `input` + `ra-toggle__track` | Opzioni on/off (verde = attivo) | [`torneo.vue:342`](../app/pages/clans/[code]/torneo.vue#L342) |
| Sezione richiudibile | `ra-details` > `ra-details__summary` + `ra-details__body` | Elenchi secondari a scomparsa | [`torneo.vue:360`](../app/pages/clans/[code]/torneo.vue#L360) |
| Tabellone | `bk-*` in `style.css` (card `bk-match-box` 3D, vincitore `bk-slot-win` oro + corona) | Bracket del torneo; connettori in `--ra-navy-600` | [`Slot.vue:14`](../app/components/bracket/Slot.vue#L14) |
| Pillola giocatore | `ra-pill` (+ `ra-avatar--sm`) | Partecipanti di un torneo (live e storico) | [`TournamentHistoryCard.vue:33`](../app/components/TournamentHistoryCard.vue#L33) |
| Card storico | componente `TournamentHistoryCard` → `ra-panel ra-history` (`.is-invalid` per gli annullati) | Un torneo passato: data, tipo, partecipanti, partite come `MatchRow` | [`TournamentHistoryCard.vue:23`](../app/components/TournamentHistoryCard.vue#L23) |
| Pannello richiudibile | `ra-panel ra-collapse.is-open` > `__head` (+ `__title`, `__meta`, `__chev`) + `__body` | Card di statistiche espandibili; il corpo si monta solo da aperto | [`PlayerStatsCard.vue:33`](../app/components/PlayerStatsCard.vue#L33) |
| Medaglia posizione | `ra-place--1/2/3`, `--sm` | Posizione in classifica: oro, argento, bronzo, poi blu | [`TournamentStatsCard.vue:28`](../app/components/TournamentStatsCard.vue#L28) |
| Righe valore | `ra-rows` > `ra-rows__row` (`dt`/`dd`), `__gold/__green/__red` | Elenchi etichetta → numero | [`TournamentStatsCard.vue:42`](../app/components/TournamentStatsCard.vue#L42) |
| Grafico | `ra-panel ra-chart` + `PointsChart` (palette oro, azzurro, rosso, verde, bronzo, viola) | Andamento vittorie nel tempo | [`statistiche.vue:140`](../app/pages/clans/[code]/statistiche.vue#L140) |
| Impostazioni | `ra-settings`, `ra-settings__block`, `__code`, `__help`, `__players`, `__player` | Blocchi impostazioni; codice clan in grande oro; liste giocatori (anche nei dialoghi) | [`settings.vue:111`](../app/pages/clans/[code]/settings.vue#L111) |
| Scelta singola | `ra-radio` > `input[type=radio]` | Opzioni esclusive nei dialoghi | [`LeaveClanDialog.vue:22`](../app/components/LeaveClanDialog.vue#L22) |
| Struttura pagina | `body` ancorato + `main` unico che scorre (`style.css`, sezione APP SHELL) | Tutte le pagine; contenuto centrato a 480px tramite padding di `main` | [`style.css:58`](../app/assets/css/style.css#L58) |
| Barra azione | `ra-actionbar` (+ `__hint`) | Azione principale sempre in vista tra contenuto e tab bar (AVVIA TORNEO) | [`torneo.vue:372`](../app/pages/clans/[code]/torneo.vue#L372) |
| Striscia orizzontale | `ra-strip` | Pillole o chip su una riga che scorre di lato, con bordi sfumati | [`torneo.vue:306`](../app/pages/clans/[code]/torneo.vue#L306) |
| Pulsante info | `ra-btn--round ra-btn--xs` | Accessorio accanto a un titolo ("?") | [`torneo.vue:274`](../app/pages/clans/[code]/torneo.vue#L274) |
| Conferma | `useConfirm().askConfirm()` + `ConfirmHost` (in `app.vue`) → `ConfirmDialog` | Azioni distruttive o irreversibili | [`torneo.vue:233`](../app/pages/clans/[code]/torneo.vue#L233) |
| Pannello dal basso | automatico per ogni `ra-modal` sotto i 600px (maniglia, sale dal basso) | Tutti i dialoghi su telefono | [`ui.css`](../app/assets/css/ui.css) (sezione "Dialoghi come pannello") |
| Caricamento | componente `SkeletonList` (`count`, `height`) → `ra-skeleton` | Al posto di qualsiasi "Caricamento..." | [`torneo.vue:267`](../app/pages/clans/[code]/torneo.vue#L267) |
| Stato vuoto | componente `EmptyState` (`icon`, `title`, `text`, slot azione) → `ra-empty` | Liste e pagine senza dati | [`storico.vue:46`](../app/pages/clans/[code]/storico.vue#L46) |
| Attesa breve | `ra-waiting` | Messaggio d'attesa dentro una sezione | [`torneo.vue`](../app/pages/clans/[code]/torneo.vue) |
| Card installazione | componente `PwaInstallBanner` → `ra-install` | Solo in home e solo nel browser; si nasconde per sempre con la X | [`PwaInstallBanner.vue:30`](../app/components/PwaInstallBanner.vue#L30) |
| Transizione pagine | `ra-page-*` (nuxt.config `pageTransition`) | Dissolvenza breve tra le pagine | [`nuxt.config.ts:29`](../nuxt.config.ts#L29) |

## Font e immagini

- **Lilita One** (SIL OFL 1.1), ospitato in [`public/fonts/`](../public/fonts/) con la licenza [`OFL.txt`](../public/fonts/OFL.txt). Mai caricarlo da Google Fonts (GDPR: trasferimento dell'IP a Google).
- **Icone di gioco** in [`public/images/ui/`](../public/images/ui/) (corone, trofeo, scudo, ecc.): asset Supercell usati secondo la Fan Content Policy.
- **Icone di interfaccia** (storico, statistiche, info): SVG inline disegnati a mano, `stroke="currentColor"`.
- Sorgenti grafici pesanti (logo, icona 1024px, cover) in [`design/sorgenti/`](../design/sorgenti/), **fuori** da `public/`: tutto ciò che sta in `public/` viene scaricato da ogni utente per l'uso offline.

## Regole legali (Supercell Fan Content Policy)

- Disclaimer sempre visibile nella home ([`AppFooter.vue`](../app/components/AppFooter.vue)).
- Sito gratuito; asset di gioco ok, ma **mai** il logo di Clash Royale o di Supercell, e niente che faccia sembrare l'app ufficiale.
- Nuovi asset: solo da fonti ufficiali Supercell o disegnati da noi; niente immagini prese da altri fan site o con licenza incerta.
