/** C0 (MIDI 12) = 0, C8 (MIDI 108) = 127, huit octaves réparties sur le knob. */
export function noteToPitch(note) {
  const pitch = Math.round((note - 12) * 127 / 96);
  if (pitch < 0) return 0;
  if (pitch > 127) return 127;
  return pitch;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI 12 = C0, MIDI 60 = C4. */
export function noteName(note) {
  const name = NAMES[((note % 12) + 12) % 12];
  const octave = Math.floor(note / 12) - 1;
  return name + octave;
}

export const FACTORY_PARTS = [
  { name: "Synth 1", channel: 1, trigger: 36, cc: 12, nrpnLsb: 2 },
  { name: "Synth 2", channel: 2, trigger: 38, cc: 22, nrpnLsb: 12 },
  { name: "Synth 3", channel: 3, trigger: 40, cc: 95, nrpnLsb: 22 },
  { name: "Synth 4", channel: 4, trigger: 41, cc: 42, nrpnLsb: 32 },
];
