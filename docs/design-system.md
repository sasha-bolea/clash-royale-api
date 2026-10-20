# Design system — Royal Arena

Direzione: **"Clash potenziato"**. Il sito deve sembrare un menu di gioco di Clash Royale: pannelli blu con bordo scuro e profondità, testi bianchi con contorno, pulsanti 3D lucidi, oro per ciò che conta (vittorie, azione principale). Il fan site deve restare riconoscibilmente *non ufficiale* (vedi Regole legali).

- Token e componenti: [`app/assets/css/ui.css`](../app/assets/css/ui.css) (prefisso `ra-`).
- Vetrina live con dati finti: pagina `/design` ([`app/pages/design.vue`](../app/pages/design.vue)), non linkata dal sito.
- Il vecchio CSS ([`app/assets/css/style.css`](../app/assets/css/style.css)) viene sostituito pagina per pagina durante il redesign; i nuovi elementi usano **solo** classi `ra-`.

## Regole vincolanti

1. **Colori solo da token** (`--ra-*` in `ui.css`). Oro = azione principale o vittoria; rosso = annulla/avversario/live; verde = conferma/selezionato; blu = tutto il resto.
2. **Una sola azione oro per schermata** (`ra-btn--gold`). Le azioni secondarie sono blu o `ra-btn--ghost`.
3. **Testi grandi sempre `ra-display`** (contorno scuro); testo corrente senza contorno sotto i 14px.
4. **Ogni superficie è un `ra-panel`** (o un componente che ne eredita lo stile: chip, stat, match). Niente card con bordo sottile o piatte.
5. **Profondità = ombra piena verso il basso** (`--ra-depth`), non ombre sfocate da sole. Premere = scendere di 3px.
6. **Animazioni brevi e con rimbalzo** (`--ra-ease-pop`), mai bloccanti; tutte disattivate con `prefers-reduced-motion`.
7. **Target touch ≥ 44px** (pulsanti 52px, chip 56px).

## Catalogo

| Elemento | Classe | Uso | Esempio |
|---|---|---|---|
| Sfondo arena | `ra-bg` | Riflettore dall'alto + vignetta + rombi; sul contenitore radice della pagina | [`design.vue:35`](../app/pages/design.vue#L35) |
| Testo display | `ra-display` + `--xl/--lg/--md`, `--gold` | Titoli di stato ("TORNEO CONCLUSO"), numeri importanti | [`design.vue:43`](../app/pages/design.vue#L43) |
| Etichetta sezione | `ra-label` | Titoletto maiuscolo azzurro sopra un gruppo | [`design.vue:42`](../app/pages/design.vue#L42) |
| Nastro titolo | `ra-ribbon` | Titolo pagina in alto, uno per pagina; riflesso animato | [`design.vue:37`](../app/pages/design.vue#L37) |
| Pannello | `ra-panel`, `--interactive`, `--gold` | Card generiche; `--gold` per il vincitore/evidenza; `--interactive` se cliccabile | [`design.vue:154`](../app/pages/design.vue#L154) |
| Pulsante 3D | `ra-btn` + `--gold/--red/--green/--ghost`, `--lg`, `--block`, `--round` | Azioni; vedi regola 2 | [`design.vue:50`](../app/pages/design.vue#L50) |
| Tab | `ra-tabs` > `ra-tab.is-active` | Scelta tra 2–3 viste nella stessa pagina | [`design.vue:65`](../app/pages/design.vue#L65) |
| Chip giocatore | `ra-chip.is-selected` (+ `__name`, `__tag`, `__check`) | Selezione giocatori per il torneo | [`design.vue:79`](../app/pages/design.vue#L79) |
| Avatar | `ra-avatar`, `--red`, `--gold` | Iniziale del giocatore; blu = lato sinistro, rosso = avversario | [`design.vue:84`](../app/pages/design.vue#L84) |
| Riga partita | `ra-match` (+ `__side.is-winner`, `__score`, `__crown`) | Partita blu vs rosso con corone | [`design.vue:96`](../app/pages/design.vue#L96) |
| Tile statistica | `ra-stat` (+ `__icon`, `__value`, `__label`) | Numeri chiave in griglia da 3 | [`design.vue:116`](../app/pages/design.vue#L116) |
| Podio | `ra-podium` > `__place--1/2/3` (+ `__crown`, `__name`, `__wins`, `__step`) | Fine torneo; gradini che salgono, corona che fluttua | [`design.vue:140`](../app/pages/design.vue#L140) |
| Tab bar | `ra-tabbar` > `__item.is-active`, `__center` | Navigazione in basso delle pagine clan; centro rialzato per ARENA | [`design.vue:164`](../app/pages/design.vue#L164) |
| Badge | `ra-badge`, `--live`, `--gold` | Codici clan, contatori, stato LIVE pulsante | [`design.vue:94`](../app/pages/design.vue#L94) |
| Entrata a cascata | `ra-pop-in` + `animation-delay` | Liste che compaiono (60ms tra un elemento e l'altro) | [`design.vue:79`](../app/pages/design.vue#L79) |

## Font e immagini

- **Lilita One** (SIL OFL 1.1), ospitato in [`public/fonts/`](../public/fonts/) con la licenza [`OFL.txt`](../public/fonts/OFL.txt). Mai caricarlo da Google Fonts (GDPR: trasferimento dell'IP a Google).
- **Icone di gioco** in [`public/images/ui/`](../public/images/ui/) (corone, trofeo, scudo, ecc.): asset Supercell usati secondo la Fan Content Policy.
- **Icone di interfaccia** (storico, statistiche, info): SVG inline disegnati a mano, `stroke="currentColor"`.
- Sorgenti grafici pesanti (logo, icona 1024px, cover) in [`design/sorgenti/`](../design/sorgenti/), **fuori** da `public/`: tutto ciò che sta in `public/` viene scaricato da ogni utente per l'uso offline.

## Regole legali (Supercell Fan Content Policy)

- Disclaimer sempre visibile nella home ([`AppFooter.vue`](../app/components/AppFooter.vue)).
- Sito gratuito; asset di gioco ok, ma **mai** il logo di Clash Royale o di Supercell, e niente che faccia sembrare l'app ufficiale.
- Nuovi asset: solo da fonti ufficiali Supercell o disegnati da noi; niente immagini prese da altri fan site o con licenza incerta.
