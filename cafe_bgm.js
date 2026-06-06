(function () {
  'use strict';

  // Embedded games share the persistent player owned by the landing page.
  if (window.self !== window.top) return;

  const STORAGE_KEY = 'free_lunch_cafe_bgm';
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const style = document.createElement('style');
  style.textContent = `
    .cafe-bgm {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 250;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 42px;
      padding: 8px 13px;
      border: 2.5px solid var(--ink, #3a2415);
      border-radius: 999px;
      background: var(--paper, #fffaf2);
      color: var(--ink, #3a2415);
      box-shadow: 2.5px 2.5px 0 var(--ink, #3a2415);
      font: 700 12px var(--body, system-ui, sans-serif);
      cursor: pointer;
      transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
    }
    .cafe-bgm:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3.5px 3.5px 0 var(--ink, #3a2415);
    }
    .cafe-bgm[aria-pressed="true"] {
      background: var(--pickle, #5fc26a);
    }
    .cafe-bgm .notes {
      display: inline-block;
      min-width: 18px;
      font-size: 16px;
      line-height: 1;
    }
    .cafe-bgm.playing .notes {
      animation: cafe-notes 1.2s ease-in-out infinite;
    }
    .cafe-music-gate {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(58, 36, 21, .42);
      backdrop-filter: blur(5px);
    }
    .cafe-music-card {
      width: min(390px, 92vw);
      padding: 26px;
      border: 3px solid var(--ink, #3a2415);
      border-radius: 22px;
      background: var(--paper, #fffaf2);
      color: var(--ink, #3a2415);
      box-shadow: 7px 7px 0 var(--ink, #3a2415);
      text-align: center;
      font-family: var(--body, system-ui, sans-serif);
    }
    .cafe-music-card .cup {
      display: block;
      margin-bottom: 8px;
      font-size: 48px;
    }
    .cafe-music-card h2 {
      margin: 0 0 7px;
      font-family: var(--disp, system-ui, sans-serif);
      font-size: 28px;
      font-weight: 400;
    }
    .cafe-music-card p {
      margin: 0 0 18px;
      color: var(--ink-soft, #7a5c43);
      font-size: 14px;
      line-height: 1.55;
    }
    .cafe-enter {
      padding: 11px 18px;
      border: 2.5px solid var(--ink, #3a2415);
      border-radius: 13px;
      background: var(--mustard, #ffb627);
      color: var(--ink, #3a2415);
      box-shadow: 2.5px 2.5px 0 var(--ink, #3a2415);
      font: 700 15px var(--body, system-ui, sans-serif);
      cursor: pointer;
    }
    .cafe-enter:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3.5px 3.5px 0 var(--ink, #3a2415);
    }
    @keyframes cafe-notes {
      0%, 100% { transform: rotate(-7deg) translateY(1px); }
      50% { transform: rotate(7deg) translateY(-2px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cafe-bgm.playing .notes { animation: none; }
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.className = 'cafe-bgm';
  button.type = 'button';
  button.title = 'Toggle café background music';
  button.innerHTML = '<span class="notes" aria-hidden="true">♫</span><span class="label">café music</span>';
  document.body.appendChild(button);

  let context = null;
  let master = null;
  let timer = null;
  let nextNoteTime = 0;
  let step = 0;
  let playing = false;
  let wanted = true;
  let unlockArmed = false;
  let gate = null;

  try {
    wanted = localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch (error) {
    wanted = true;
  }

  const tempo = 94;
  const beat = 60 / tempo;
  const melody = [
    72, null, 76, 79, 76, null, 74, 72,
    69, null, 72, 76, 74, null, 71, null,
    72, 74, 76, null, 79, 76, 74, null,
    71, 74, 72, 69, 67, null, 69, null
  ];
  const chords = [
    [60, 64, 67, 71],
    [57, 60, 64, 67],
    [62, 65, 69, 72],
    [55, 59, 62, 65]
  ];
  const bass = [48, 45, 50, 43];

  function frequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function voice(midi, time, duration, volume, type) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency(midi), time);
    oscillator.detune.setValueAtTime(type === 'triangle' ? -3 : 3, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.04);
  }

  function schedule(currentStep, time) {
    const bar = Math.floor(currentStep / 8) % chords.length;
    const withinBar = currentStep % 8;

    if (withinBar === 0) {
      chords[bar].forEach((note, index) => {
        voice(note, time + index * 0.018, beat * 3.7, 0.018, 'sine');
      });
      voice(bass[bar], time, beat * 1.3, 0.035, 'triangle');
    }
    if (withinBar === 4) {
      voice(bass[bar] + 7, time, beat * 1.15, 0.025, 'triangle');
    }

    const note = melody[currentStep % melody.length];
    if (note) voice(note, time, beat * 0.42, 0.025, 'triangle');
  }

  function scheduler() {
    while (nextNoteTime < context.currentTime + 0.12) {
      schedule(step, nextNoteTime);
      nextNoteTime += beat / 2;
      step = (step + 1) % melody.length;
    }
  }

  function updateButton() {
    button.setAttribute('aria-pressed', wanted ? 'true' : 'false');
    button.classList.toggle('playing', playing);
    button.querySelector('.label').textContent =
      playing ? 'music on' : wanted ? 'tap for music' : 'music off';
    button.querySelector('.notes').textContent = wanted ? '♪' : '♫';
  }

  function hideGate() {
    if (!gate) return;
    gate.remove();
    gate = null;
  }

  function showGate() {
    if (gate || playing || !wanted) return;
    gate = document.createElement('div');
    gate.className = 'cafe-music-gate';
    gate.innerHTML = `
      <div class="cafe-music-card">
        <span class="cup" aria-hidden="true">☕</span>
        <h2>Welcome to the café!</h2>
        <p>Browsers need one tiny tap before the house band can play. After that, the music stays with you through both games.</p>
        <button class="cafe-enter" type="button">Enter with music ♪</button>
      </div>
    `;
    document.body.appendChild(gate);
    gate.querySelector('.cafe-enter').addEventListener('click', function () {
      start();
      window.setTimeout(function () {
        if (playing) hideGate();
      }, 50);
    });
  }

  function beginPlayback() {
    if (playing || !wanted || !context || context.state !== 'running') return;
    master = context.createGain();
    master.gain.setValueAtTime(0.7, context.currentTime);
    master.connect(context.destination);
    nextNoteTime = context.currentTime + 0.06;
    step = 0;
    scheduler();
    timer = window.setInterval(scheduler, 50);
    playing = true;
    hideGate();
    disarmUnlock();
    updateButton();
  }

  function unlock(event) {
    if (button.contains(event.target)) return;
    start();
  }

  function armUnlock() {
    if (unlockArmed || !wanted) return;
    unlockArmed = true;
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }

  function disarmUnlock() {
    if (!unlockArmed) return;
    unlockArmed = false;
    document.removeEventListener('pointerdown', unlock, true);
    document.removeEventListener('keydown', unlock, true);
  }

  function start() {
    if (!wanted) return;
    if (!context || context.state === 'closed') context = new AudioContext();
    if (context.state === 'running') {
      beginPlayback();
      return;
    }
    const resumed = context.resume();
    if (resumed && typeof resumed.then === 'function') {
      resumed.then(function () {
        if (context && context.state === 'running') beginPlayback();
        else armUnlock();
      }).catch(armUnlock);
    } else {
      armUnlock();
    }
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
    playing = false;
    wanted = false;
    hideGate();
    disarmUnlock();
    if (context) context.close();
    context = null;
    master = null;
    try { localStorage.setItem(STORAGE_KEY, 'off'); } catch (error) {}
    updateButton();
  }

  button.addEventListener('click', function () {
    if (playing) {
      stop();
    } else if (wanted) {
      start();
    } else {
      wanted = true;
      try { localStorage.setItem(STORAGE_KEY, 'on'); } catch (error) {}
      updateButton();
      start();
    }
  });

  if (wanted) {
    try { localStorage.setItem(STORAGE_KEY, 'on'); } catch (error) {}
    start();
    armUnlock();
    window.setTimeout(showGate, 250);
  }

  updateButton();
})();
