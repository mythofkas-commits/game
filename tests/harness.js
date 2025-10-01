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

(async function run(){
  const frameEl = document.getElementById('app');
  await new Promise(r => frameEl.addEventListener('load', r, { once: true }));

  // set deterministic seed before the app reads it
  try { frameEl.contentWindow.localStorage.setItem('seed','1234'); } catch {}

  const win = frameEl.contentWindow;
  const doc = frameEl.contentDocument;

  if (typeof win.startPresidency === 'function') win.startPresidency();

  // wait for crisis UI and a decision button
  await waitFor(doc, '[data-testid="crisis-panel"]');
  const preChaos = win.game.chaos;
  const preEnergy = win.game.energy;

  const btn = await waitFor(doc, '[data-testid="decision-btn"]');
  btn.click();
  // Wait for either chaos or energy to change, up to 5 seconds
  const timeout = 5000;
  const pollInterval = 50;
  const startTime = performance.now();
  let postChaos, postEnergy;
  for (;;) {
    postChaos = win.game.chaos;
    postEnergy = win.game.energy;
    if (postChaos !== preChaos || postEnergy !== preEnergy) break;
    if (performance.now() - startTime > timeout) {
      throw new Error('Timeout waiting for decision to change state');
    }
    await sleep(pollInterval);
  }

  document.body.dataset.pass = '1';
  console.log('PASS: basic decision changes state');
})().catch(e=>{
  console.error(e);
  document.body.dataset.fail = e.message;
});
