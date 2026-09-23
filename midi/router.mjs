import { noteToPitch } from "./pitch.mjs";

function status(kind, channel) {
  return kind | ((channel - 1) & 0x0f);
}

function pitchMessages(erChannel, part, pitch, mode) {
  const cc = status(0xb0, erChannel);
  if (mode === "nrpn") {
    return [
      [cc, 99, 2],
      [cc, 98, part.nrpnLsb],
      [cc, 6, pitch],
    ];
  }
  return [[cc, part.cc, pitch]];
}

function noteOn(erChannel, trigger, velocity) {
  const vel = velocity < 1 ? 1 : velocity > 127 ? 127 : velocity;
  return [status(0x90, erChannel), trigger & 0x7f, vel];
}

function noteOff(erChannel, trigger) {
  return [status(0x80, erChannel), trigger & 0x7f, 0];
}

export function emptyState(partCount = 4) {
  return { held: Array.from({ length: partCount }, () => []) };
}

/**
 * Traduit une note de clavier en Pitch + trig de la part ER-1.
 * `steps` est une liste { delay, messages } déjà ordonnée.
 * Le Pitch part tout de suite, le trig suit après `delayMs`.
 */
export function route(state, event, config) {
  const next = { held: state.held.map((stack) => stack.slice()) };
  const steps = [];
  const delayMs = config.delayMs > 0 ? config.delayMs : 0;

  config.parts.forEach((part, index) => {
    if (!part.enabled || part.channel !== event.channel) return;
    const stack = next.held[index];
    const immediate = [];
    const delayed = [];

    if (event.type === "off" || event.type === "panic") {
      if (event.type === "panic") {
        if (stack.length) immediate.push(noteOff(config.erChannel, part.trigger));
        stack.length = 0;
      } else {
        const pos = stack.findIndex((held) => held.note === event.note);
        if (pos < 0) return;
        const wasTop = pos === stack.length - 1;
        stack.splice(pos, 1);
        if (!wasTop) return;
        immediate.push(noteOff(config.erChannel, part.trigger));
        const restored = stack[stack.length - 1];
        if (restored) {
          const pitch = noteToPitch(restored.note);
          immediate.push(...pitchMessages(config.erChannel, part, pitch, config.mode));
          delayed.push(noteOn(config.erChannel, part.trigger, restored.velocity));
        }
      }
    } else if (event.type === "on") {
      const wasSounding = stack.length > 0;
      const pos = stack.findIndex((held) => held.note === event.note);
      if (pos >= 0) stack.splice(pos, 1);
      stack.push({ note: event.note, velocity: event.velocity });
      if (wasSounding) immediate.push(noteOff(config.erChannel, part.trigger));
      const pitch = noteToPitch(event.note);
      immediate.push(...pitchMessages(config.erChannel, part, pitch, config.mode));
      delayed.push(noteOn(config.erChannel, part.trigger, event.velocity));
    }

    if (immediate.length) steps.push({ delay: 0, messages: immediate });
    if (delayed.length) steps.push({ delay: delayMs, messages: delayed });
  });

  return { state: next, steps };
}
