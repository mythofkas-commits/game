function assert(cond, msg){ if(!cond) throw new Error('Assert: ' + msg); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function waitFor(doc, sel, ms=5000){
  const start = performance.now();
  for(;;){
    const el = doc.querySelector(sel);
    if (el) return el;
    if (performance.now() - start > ms) throw new Error('Timeout waiting for ' + sel);
    await sleep(50);
  }
}

function snapshotGame(win){
  return {
    chaos: win.game?.chaos,
    energy: win.game?.energy,
    power: Object.fromEntries((win.game?.powerCenters || []).map(p => [p.id, p.value])),
    relationships: win.game?.relationships ? { ...win.game.relationships } : null
  };
}

function stateChanged(a, b){
  if (a == null || b == null) return false;
  if (a.chaos !== b.chaos) return true;
  if (a.energy !== b.energy) return true;
  const keys = new Set([...Object.keys(a.power || {}), ...Object.keys(b.power || {})]);
  for (const k of keys){
    if ((a.power || {})[k] !== (b.power || {})[k]) return true;
  }
  if (a.relationships && b.relationships){
    const rk = new Set([...Object.keys(a.relationships), ...Object.keys(b.relationships)]);
    for (const k of rk){
      if (a.relationships[k] !== b.relationships[k]) return true;
    }
  }
  return false;
}

(async function run(){
  const frameEl = document.getElementById('app');
  await new Promise(r => frameEl.addEventListener('load', r, { once: true }));

  // Optional deterministic seed if the app uses it
  try { frameEl.contentWindow.localStorage.setItem('seed','1234'); } catch {}

  const win = frameEl.contentWindow;
  const doc = frameEl.contentDocument;

  if (typeof win.startPresidency === 'function') win.startPresidency();

  // Wait for crisis UI and options
  await waitFor(doc, '[data-testid="crisis-panel"], #crisisPanel');
  await sleep(50); // allow render flush
  const buttons = Array.from(doc.querySelectorAll('[data-testid="decision-btn"], #crisisOptions .decision-btn'));
  if (!buttons.length) throw new Error('No decision buttons found');

  // Try each option until one produces a measurable change
  let changed = false;
  for (const b of buttons){
    const pre = snapshotGame(win);
    b.click();
    await sleep(120); // small cushion for async state updates
    const post = snapshotGame(win);
    if (stateChanged(pre, post)) {
      changed = true;
      break;
    }
  }

  assert(changed, 'No decision option produced any measurable state change (chaos, energy, power centers, or relationships)');

  document.body.dataset.pass = '1';
  console.log('PASS: at least one decision produced a measurable state change');
})().catch(e=>{
  console.error(e);
  document.body.dataset.fail = e.message;
});
