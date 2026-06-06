(function () {
  'use strict';

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
  let wanted = false;

  try {
    wanted = localStorage.getItem(STORAGE_KEY) === 'on';
  } catch (error) {
    wanted = false;
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
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.classList.toggle('playing', playing);
    button.querySelector('.label').textContent = playing ? 'music on' : 'café music';
    button.querySelector('.notes').textContent = playing ? '♪' : '♫';
  }

  function start() {
    if (playing) return;
    context = new AudioContext();
    master = context.createGain();
    master.gain.setValueAtTime(0.7, context.currentTime);
    master.connect(context.destination);
    nextNoteTime = context.currentTime + 0.06;
    step = 0;
    scheduler();
    timer = window.setInterval(scheduler, 50);
    playing = true;
    wanted = true;
    try { localStorage.setItem(STORAGE_KEY, 'on'); } catch (error) {}
    updateButton();
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
    playing = false;
    wanted = false;
    if (context) context.close();
    context = null;
    master = null;
    try { localStorage.setItem(STORAGE_KEY, 'off'); } catch (error) {}
    updateButton();
  }

  button.addEventListener('click', function () {
    if (playing) stop();
    else start();
  });

  if (wanted) {
    const resumeOnGesture = function (event) {
      if (!playing && wanted && !button.contains(event.target)) start();
      document.removeEventListener('pointerdown', resumeOnGesture, true);
      document.removeEventListener('keydown', resumeOnGesture, true);
    };
    document.addEventListener('pointerdown', resumeOnGesture, true);
    document.addEventListener('keydown', resumeOnGesture, true);
  }

  updateButton();
})();
