import assert from "node:assert/strict";
import test from "node:test";
import { noteName, noteToPitch } from "../midi/pitch.mjs";
import { emptyState, route } from "../midi/router.mjs";

const config = {
  erChannel: 10,
  mode: "cc",
  delayMs: 5,
  parts: [
    { enabled: true, channel: 1, trigger: 36, cc: 12, nrpnLsb: 2 },
    { enabled: true, channel: 2, trigger: 38, cc: 22, nrpnLsb: 12 },
    { enabled: true, channel: 3, trigger: 40, cc: 95, nrpnLsb: 22 },
    { enabled: true, channel: 4, trigger: 41, cc: 42, nrpnLsb: 32 },
  ],
};

test("C0 est 0 et C8 est 127", () => {
  assert.equal(noteToPitch(12), 0);
  assert.equal(noteToPitch(108), 127);
  assert.equal(noteName(12), "C0");
  assert.equal(noteName(108), "C8");
  assert.equal(noteName(60), "C4");
});

test("repères de basse", () => {
  const expected = [
    [24, 16],
    [28, 21],
    [33, 28],
    [36, 32],
    [40, 37],
    [45, 44],
    [48, 48],
    [60, 64],
  ];
  for (const [note, pitch] of expected) {
    assert.equal(noteToPitch(note), pitch, noteName(note));
  }
});

test("les notes hors des huit octaves sont bornées", () => {
  assert.equal(noteToPitch(0), 0);
  assert.equal(noteToPitch(11), 0);
  assert.equal(noteToPitch(109), 127);
  assert.equal(noteToPitch(127), 127);
});

test("une note sur le canal 1 envoie le pitch puis le trig d'usine", () => {
  const { steps } = route(emptyState(), { type: "on", channel: 1, note: 36, velocity: 100 }, config);
  assert.deepEqual(steps, [
    { delay: 0, messages: [[0xb9, 12, 32]] },
    { delay: 5, messages: [[0x99, 36, 100]] },
  ]);
});

test("le synth 2 utilise son CC et sa note de trig", () => {
  const { steps } = route(emptyState(), { type: "on", channel: 2, note: 28, velocity: 80 }, config);
  assert.deepEqual(steps[0].messages, [[0xb9, 22, 21]]);
  assert.deepEqual(steps[1].messages, [[0x99, 38, 80]]);
});

test("le mode NRPN envoie MSB 2, le LSB de la part, puis la valeur", () => {
  const nrpn = { ...config, mode: "nrpn" };
  const { steps } = route(emptyState(), { type: "on", channel: 3, note: 36, velocity: 64 }, nrpn);
  assert.deepEqual(steps[0].messages, [
    [0xb9, 99, 2],
    [0xb9, 98, 22],
    [0xb9, 6, 32],
  ]);
  assert.deepEqual(steps[1].messages, [[0x99, 40, 64]]);
});

test("une deuxième note relâche le trig avant de rejouer", () => {
  const first = route(emptyState(), { type: "on", channel: 1, note: 36, velocity: 90 }, config);
  const second = route(first.state, { type: "on", channel: 1, note: 40, velocity: 70 }, config);
  assert.deepEqual(second.steps[0].messages[0], [0x89, 36, 0]);
  assert.deepEqual(second.steps[0].messages[1], [0xb9, 12, 37]);
  assert.deepEqual(second.steps[1].messages, [[0x99, 36, 70]]);
});

test("relâcher la note aiguë revient à la note encore tenue", () => {
  let state = emptyState();
  state = route(state, { type: "on", channel: 1, note: 36, velocity: 90 }, config).state;
  state = route(state, { type: "on", channel: 1, note: 40, velocity: 70 }, config).state;
  const released = route(state, { type: "off", channel: 1, note: 40 }, config);
  assert.deepEqual(released.steps[0].messages[0], [0x89, 36, 0]);
  assert.deepEqual(released.steps[0].messages[1], [0xb9, 12, 32]);
  assert.deepEqual(released.steps[1].messages, [[0x99, 36, 90]]);
});

test("relâcher la dernière note coupe le trig", () => {
  const first = route(emptyState(), { type: "on", channel: 4, note: 36, velocity: 40 }, config);
  const released = route(first.state, { type: "off", channel: 4, note: 36 }, config);
  assert.deepEqual(released.steps, [{ delay: 0, messages: [[0x89, 41, 0]] }]);
  assert.deepEqual(released.state.held[3], []);
});

test("le panic coupe le trig et vide les notes tenues", () => {
  const first = route(emptyState(), { type: "on", channel: 1, note: 36, velocity: 100 }, config);
  const stopped = route(first.state, { type: "panic", channel: 1 }, config);
  assert.deepEqual(stopped.steps, [{ delay: 0, messages: [[0x89, 36, 0]] }]);
  assert.deepEqual(stopped.state.held[0], []);
});

test("une part désactivée ne produit rien", () => {
  const quiet = {
    ...config,
    parts: config.parts.map((part, index) => ({ ...part, enabled: index !== 0 })),
  };
  const { steps } = route(emptyState(), { type: "on", channel: 1, note: 36, velocity: 100 }, quiet);
  assert.deepEqual(steps, []);
});
