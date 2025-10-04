import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../assets/state.js';

test('clamps chaos and energy within 0-100', () => {
  const state = new GameState({ powerCenters: [{ id: 'media', value: 40 }] });
  state.setEnergy(150);
  state.setChaos(-25);
  const snapshot = state.snapshot;
  assert.equal(snapshot.energy, 100);
  assert.equal(snapshot.chaos, 0);
});

test('rejects updates to unknown power centers', () => {
  const state = new GameState({ powerCenters: [{ id: 'media', value: 40 }] });
  assert.throws(() => state.updatePower('unknown', 5), /Unknown power center/);
});

test('applyEffects is atomic when validation fails', () => {
  const state = new GameState({ powerCenters: [{ id: 'media', value: 40 }] });
  const before = state.snapshot;
  assert.throws(() => state.applyEffects({ power: { unknown: 5 } }));
  assert.deepStrictEqual(state.snapshot, before);
});

test('onChange emits structured diffs', () => {
  const state = new GameState({
    powerCenters: [
      { id: 'media', value: 40 },
      { id: 'public', value: 55 }
    ]
  });

  let payload = null;
  state.onChange((diff, prev, next, meta) => {
    if (!payload) payload = { diff, prev, next, meta };
  });

  state.applyEffects({
    chaosDelta: 5,
    energyDelta: -10,
    power: { media: 8 }
  }, { source: 'test', powerReasons: { media: 'unit-test' } });

  assert.ok(payload);
  assert.deepStrictEqual(payload.diff.chaos, [0, 5]);
  assert.deepStrictEqual(payload.diff.energy, [100, 90]);
  assert.deepStrictEqual(payload.diff.power.media, [40, 48]);
  assert.equal(payload.meta.source, 'test');
  assert.equal(payload.meta.powerChanges[0].reason, 'unit-test');
});
