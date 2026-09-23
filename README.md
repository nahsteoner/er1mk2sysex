# ER-1 mkII — notes vers pitch

Page pour jouer les quatre synthés de l’Electribe ER-1 mkII au clavier, avec le firmware Shaman déjà en place. Chaque part écoute son propre canal MIDI. La hauteur suit la note : C0 envoie le Pitch 0, C8 envoie le Pitch 127, et les huit octaves entre les deux sont réparties sur le knob.

La page ne flashe rien. Elle se place entre le clavier et la machine.

## Lancer

Chrome est requis, à cause de Web MIDI.

```bash
npm test
npm start
```

Puis ouvrir http://localhost:8765/midi/

## Au studio

1. Régler le canal MIDI de l’ER-1, 10 par défaut dans la page.
2. Laisser les notes de trig d’usine, ou recopier celles affichées dans MIDI → Note No. : Synth 1 = C2 (36), Synth 2 = D2 (38), Synth 3 = E2 (40), Synth 4 = F2 (41).
3. Mettre les filtres MIDI P et C sur « o ».
4. Choisir l’entrée du clavier et la sortie vers l’ER-1.
5. Jouer le canal 1 pour le synth 1, le canal 2 pour le synth 2, et ainsi de suite.

Le message de pitch par défaut est le CC ajouté par Shaman (12, 22, 95, 42). Le mode NRPN Korg reste disponible. Le délai avant le trig laisse à la machine le temps de prendre la hauteur ; 5 ms au départ, 0 si l’attaque semble en retard.
