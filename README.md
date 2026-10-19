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

Per provare i colpi uno per uno c'è il **laboratorio colpi**: `http://localhost:8000/shot-lab.html` (un giocatore, un lanciatore nella metà avversaria, lista dei colpi provati, modalità AI).

Serve la connessione a internet: Three.js viene caricato da CDN (cdnjs).

## Comandi

| Tasto | Azione |
|---|---|
| Frecce / WASD | Corsa · da piantato: muovono il **mirino** · in rincorsa: la **traiettoria** · in aria: la direzione della schiacciata |
| `Z` (o `J`) | Bagher: il giocatore si pianta e compare il mirino; il colpo parte da solo quando la palla è in portata |
| `X` (o `K`) | Alzata (palleggio, o alzata in bagher su palla bassa), stesso schema del bagher |
| `Spazio` | Servizio · tasto "intelligente": il gioco sceglie il tocco |
| Tenere premuto `Z`/`X`/`Spazio` | Più a lungo lo tieni, più alta va la palla (barra sopra il giocatore) |
| Doppia pressione `Z`/`X`/`Spazio` | Tuffo verso il cerchio di caduta (entro ~3 m) |
| `C` (o `L`) | Rincorsa in 3 passi (sx · dx-sx + caricamento) e salto; `C` di nuovo in aria = schiacciata (premuto durante la rincorsa colpisce da solo) |
| `1` / `2` / `3` | Campo centrale / laterale sinistro / laterale destro |
| `P` | Configurazione gamepad (con pad collegato) |
| `Invio` | Nuova partita a fine match |

Supportato il gamepad tipo PlayStation (Gamepad API), con configurazione dei tasti; i pulsanti bagher e alzata tenuti premuti caricano l'altezza come da tastiera.

## Cosa c'è

- **Gioco**: 2 contro 2, un giocatore umano e tre controllati dal computer.
- **Fisica della palla**: spin, servizio flottante, palla sul nastro (resta in gioco), palla nella rete, aftertouch dopo il servizio.
- **Regole**: massimo 3 tocchi, doppio tocco, palla fuori, regola degli 8 secondi per servire, alternanza del battitore. Partita a 15 punti.
- **Comandi "mi pianto e miro"**: mirino nel proprio campo (ricezione, alzata) o in quello avversario (terzo tocco), carica dell'altezza, tuffo con doppia pressione, rincorsa d'attacco in tre passi.
- **Animazioni**: pose dei giocatori (ready, bagher, difesa, alzata, rincorsa, schiacciata) con busto dritto o in diagonale verso il mirino, sbuffi di sabbia, scia della palla, anello sul punto di caduta.
- **Arbitri**: primo arbitro sulla torretta con i segnali, secondo arbitro che segue il gioco lungo la rete.
- **Impianto**: campo centrale con tribune, folla e striscioni, più due campi laterali con recinzione di protezione.

## Struttura

```
sensible-beach-volley.html   pagina + servizio, movimento AI, lettura tasti/gamepad, HUD, audio
shot-lab.html                laboratorio colpi: un giocatore, lanciatore, tutti i colpi
js/
  logic/                     simulazione pura: niente Three.js, niente DOM
    constants.js             misure del campo, zona libera, squadre, regole per tipo di campo
    court.js                 campo come dati + geometria: dentro/fuori, lato, passaggio rete
    venue.js                 impianto (centrale + 2 laterali), campo attivo, coordinate
    ball.js                  fisica della palla: lancio, caduta, spin, float, nastro/rete
                             (restituisce eventi, non segna punti)
    players.js               stato e fisica dei giocatori: corsa (con frenata), salto, tuffo,
                             recupero, rincorsa d'attacco in tre passi
    aim.js                   "mi pianto e miro": mirino, carica dell'altezza, contatto
                             automatico, doppia pressione = tuffo, punto d'attacco
    humanControl.js          cosa fanno i tasti del giocatore umano (condiviso da gioco e lab)
    match.js                 regole della partita: fasi, punteggio, ordine di servizio,
                             tempo di servizio (8 s), tocchi e falli, chi vince lo scambio
    shots.js                 colpi: bagher, alzata, alzata in bagher, palleggio su palla
                             forte, free ball, tuffo, schiacciata; colpi e attacchi dell'AI;
                             qualità del tocco e direzione della palla
  view/                      tutto ciò che si disegna (Three.js)
    textures.js              helper per texture pixel art e piani
    venueView.js             disegna l'impianto, inquadra la camera, posiziona gli arbitri
    court/
      mainCourtView.js       campo centrale (assembla gli elementi)
      sideCourtView.js       campi laterali
      presets.js             colori, altezze di disegno, ripetizione delle texture
      courtTextures.js       sabbia + pre-caricamento texture
      elements/              un file per elemento: lines, net, netPosts, refTower,
                             stands, banners, protectionNet
    playersView.js           maglie, pose e animazioni dei giocatori (dritte e a 3/4)
    aimView.js               mirino, linea tratteggiata e barra di carica
    ballView.js              sprite, ombra, anello di caduta, scia
    npcView.js               arbitri e folla
```

**Regola:** `logic/` non importa mai da `view/`. La grafica legge lo stato della logica e lo disegna (`createXView(scene, stato)` + `sync()`), quindi la logica si può far girare e testare senza browser.

## Prossimi passi

- Focus sui colpi (direzione e qualità della schiacciata, mirino in aria).
- Rincorsa d'attacco anche per gli avversari (oggi saltano da fermi).
- Separare dall'HTML il movimento e le decisioni dell'AI e la lettura dei tasti in moduli dedicati.
- Punteggio regolamentare: set a 21 (terzo a 15), 2 punti di scarto, cambi campo.
- Modalità 2 giocatori in locale e livelli di difficoltà dell'AI.
- Aggiornare Three.js (oggi r128, caricato come variabile globale).
