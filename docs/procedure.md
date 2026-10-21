# Procedure

## Anteprima locale con dati veri
**Quando**: provare una modifica nel browser prima di pushare.
```bash
npm run build
NUXT_PUBLIC_SUPABASE_URL=https://mehxfizbkmmjwmueydse.supabase.co \
NUXT_PUBLIC_SUPABASE_ANON_KEY=<chiave pubblica, è nel sito> \
NITRO_HOST=127.0.0.1 NITRO_PORT=3917 node .output/server/index.mjs
```
⚠ Usa il **database vero**: non avviare/annullare tornei né rimuovere giocatori. In locale non c'è `CR_API_KEY`, quindi le chiamate a Clash Royale danno 403 (niente trofei, niente rilevamento): per provare flussi che le usano, intercettare `/api/cr/**` dal browser di test con risposte finte e bloccare le scritture su `/rest/v1/**` (lasciando passare l'RPC `get_clan_by_code`). Il browser di test registra il service worker: cancellarlo dopo ogni build per non vedere la versione vecchia.

## Reinstallare l'app sull'iPhone
**Quando**: solo dopo modifiche a nome, icona o colori del manifest (iOS li legge solo all'installazione), o se compaiono i comandi del browser nell'app.
1. Segnarsi il codice del clan (i clan salvati non passano alla nuova icona).
2. Tenere premuta l'icona → Rimuovi app → Elimina dalla schermata Home.
3. Aprire https://royalarena.it **in Safari**, dalla pagina iniziale.
4. Condividi → Aggiungi alla schermata Home, con **"Apri come app web" attivo**.

## Recuperare un torneo dimenticato (utente)
**Quando**: un torneo è stato giocato senza avviarlo. Va fatto presto (ultime 25 battaglie per giocatore).
Arena (senza torneo in corso) → "↺ Registra un torneo passato" → selezionare le partite → quando la barra mostra "N giocatori · Vince X", REGISTRA TORNEO.

## Diagnosticare problemi di impaginazione su iOS
**Quando**: difetti visibili solo sull'iPhone (bande, elementi spostati).
Aggiungere temporaneamente un riquadro che mostra `matchMedia('(display-mode: standalone)')`, `screen.height`, `innerHeight`, `visualViewport.height`, bordo inferiore di body e tab bar e i safe-area inset (misurati con un elemento con `padding: env(...)`), più una linea rossa `position: fixed; bottom: 0`. Chiedere uno screenshot dall'app installata. Il componente usato il 20-21/10 è nella storia git (`app/components/DiagBadge.client.vue`, commit `f50e147`).
