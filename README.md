# Sensible Beach Volley

Gioco arcade di beach volley 2 contro 2 (USA vs Svezia) con visuale dall'alto in stile retrò, ispirato a Sensible Soccer. Gira nel browser con [Three.js](https://threejs.org/) r128 e grafica pixel art generata via codice: non ci sono immagini o file audio esterni.

> Stato: prototipo giocabile, refactoring in moduli in corso.

## Avvio

Il gioco usa moduli ES, quindi **non si apre con doppio clic** sul file HTML: va servito da un server locale.

```bash
# dalla cartella del progetto, uno dei due:
python -m http.server 8000
npx serve .
```

Poi apri `http://localhost:8000/sensible-beach-volley.html` (con `npx serve` usa la porta indicata nel terminale).

Serve la connessione a internet: Three.js viene caricato da CDN (cdnjs).

## Comandi

| Tasto | Azione |
|---|---|
| Frecce / WASD | Movimento |
| `Z` (o `J`) | Bagher / tuffo |
| `X` (o `K`) | Alzata |
| `C` (o `L`) | Attacco (salto + schiacciata) |
| `Spazio` | Servizio / azione automatica |
| `1` / `2` / `3` | Campo centrale / laterale sinistro / laterale destro |
| `P` | Configurazione gamepad (con pad collegato) |
| `Invio` | Nuova partita a fine match |

Supportato il gamepad tipo PlayStation (Gamepad API), con configurazione dei tasti.

## Cosa c'è

- **Gioco**: 2 contro 2, un giocatore umano e tre controllati dal computer.
- **Fisica della palla**: spin, servizio flottante, palla sul nastro (resta in gioco), palla nella rete, aftertouch dopo il servizio.
- **Regole**: massimo 3 tocchi, doppio tocco, palla fuori, regola degli 8 secondi per servire, alternanza del battitore. Partita a 15 punti.
- **Animazioni**: pose dei giocatori (ready, bagher, difesa, alzata, schiacciata), sbuffi di sabbia, scia della palla, anello sul punto di caduta.
- **Arbitri**: primo arbitro sulla torretta con i segnali, secondo arbitro che segue il gioco lungo la rete.
- **Impianto**: campo centrale con tribune, folla e striscioni, più due campi laterali con recinzione di protezione.

## Struttura

```
sensible-beach-volley.html   pagina + logica di gioco (fisica, regole, AI, input, HUD, audio)
js/
  court/                     campi e impianto
    courtController.js       punto d'accesso: campo attivo, coordinate, camera, cambio campo
    createMainCourt.js       campo centrale (assembla gli elementi)
    createSideCourt.js       campi laterali
    courtGameplay.js         regole geometriche: dentro/fuori, lato, passaggio della rete
    constants.js, presets.js misure e preset per tipo di campo
    elements/                un file per elemento: lines, net, netPosts, refTower,
                             stands, banners, protectionNet
  players/players.js         sprite e pose dei giocatori, squadre, creazione
  npc/npc.js                 arbitri e folla
  render/textures.js         helper per texture pixel art e piani
```

Ogni elemento possiede la propria texture e una funzione `createX(scene, opts)`. Il gioco accede ai campi solo tramite `createCourtController`.

## Prossimi passi

- Separare dall'HTML palla, AI, input e regole della partita in moduli dedicati.
- Punteggio regolamentare: set a 21 (terzo a 15), 2 punti di scarto, cambi campo.
- Modalità 2 giocatori in locale e livelli di difficoltà dell'AI.
- Aggiornare Three.js (oggi r128, caricato come variabile globale).
