# Deploy

## Come funziona
- Hosting: **Vercel**, progetto `royalarena` (team `sasha-boleas-projects`), collegato al repo GitHub `sasha-bolea/clash-royale-api`.
- **Push su `main` → produzione** su https://royalarena.it in ~1 minuto. Il vecchio dominio `royalarena-six.vercel.app` non esiste più.
- **Push su qualsiasi altro branch → anteprima** su `https://royalarena-git-<branch>-sasha-boleas-projects.vercel.app` (pubblica, senza login). ⚠ Usa lo **stesso database** di produzione.
- Vercel a volte ritarda o salta l'anteprima di un branch nuovo (visto il 21/10: >15 minuti senza stato). Si controlla dallo stato del commit su GitHub:
  `curl -s https://api.github.com/repos/sasha-bolea/clash-royale-api/commits/<sha>/status` → `"state": "success"`.

## Variabili d'ambiente (su Vercel)
| Variabile | Uso |
|---|---|
| `SUPABASE_URL` | URL del progetto Supabase (pubblico) |
| `SUPABASE_ANON_KEY` | chiave pubblica Supabase (finisce nel sito) |
| `CR_API_KEY` | chiave developer.clashroyale.com autorizzata per l'IP del proxy RoyaleAPI (`45.79.218.79`) — solo lato server |
| `CR_PROXY_URL` | `https://proxy.royaleapi.dev/v1` |

## Passi per una release
1. `npm test` e `npm run build` puliti.
2. Prova su anteprima (branch) quando la modifica è visibile.
3. Ok di Sasha → merge in `main` e push.
4. Verifica: il bundle pubblicato contiene la modifica (es. `curl -s https://royalarena.it/ | grep -oE '/_nuxt/[^"]+\.js'` e cercare una stringa nuova nel JS) e l'API risponde (`/api/cr/player/%23<TAG>` → 200).
5. Sul telefono: l'app si aggiorna da sola (avviso "Nuova versione disponibile" o riapertura). Reinstallare l'icona solo se cambiano nome, icona o colori del manifest.
