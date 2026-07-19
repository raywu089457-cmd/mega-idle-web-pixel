// src/audio.js — L2 WebAudio 合成(無音檔)
// 從 index.html L2692-2742 搬出
// 內部持有 audioCtx 與 musicTimer(不對外暴露)

import { settings } from './state.js';

let audioCtx = null;
let musicTimer = null;

export function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; } }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  if (audioCtx && !musicTimer) startMusic();
}

function tone(freq, dur = 0.08, type = 'square', vol = 0.15, when = 0) {
  if (!audioCtx || settings.sfx <= 0) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((settings.sfx / 100) * vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur + 0.02);
}

export function sfx(kind) {
  ensureAudio(); if (!audioCtx) return;
  const map = {
    click: () => tone(520, 0.05, 'square', 0.08),
    gold: () => { tone(880, 0.06, 'triangle', 0.12); tone(1320, 0.08, 'triangle', 0.1, 0.05); },
    craft: () => { tone(330, 0.07, 'square', 0.1); tone(660, 0.09, 'square', 0.1, 0.06); },
    equip: () => tone(740, 0.08, 'triangle', 0.12),
    enhance: () => { tone(500, 0.06, 'sawtooth', 0.08); tone(1000, 0.1, 'triangle', 0.1, 0.05); },
    heal: () => tone(620, 0.12, 'sine', 0.1),
    level: () => { tone(523, 0.08, 'triangle', 0.12); tone(659, 0.08, 'triangle', 0.12, 0.07); tone(784, 0.12, 'triangle', 0.12, 0.14); },
    ach: () => { tone(784, 0.08, 'triangle', 0.12); tone(988, 0.08, 'triangle', 0.12, 0.08); tone(1175, 0.14, 'triangle', 0.12, 0.16); },
    boss: () => { tone(196, 0.12, 'sawtooth', 0.12); tone(392, 0.16, 'triangle', 0.12, 0.1); },
    defeat: () => { tone(220, 0.12, 'sawtooth', 0.1); tone(147, 0.18, 'sawtooth', 0.1, 0.1); },
    dispatch: () => tone(440, 0.08, 'square', 0.08),
    recruit: () => { tone(659, 0.08, 'triangle', 0.1); tone(880, 0.1, 'triangle', 0.1, 0.07); },
    daily: () => { tone(523, 0.07, 'triangle', 0.1); tone(784, 0.1, 'triangle', 0.1, 0.08); },
    prestige: () => { tone(262, 0.12, 'sine', 0.12); tone(523, 0.12, 'sine', 0.12, 0.1); tone(1046, 0.2, 'sine', 0.12, 0.2); },
  };
  (map[kind] || map.click)();
}

function startMusic() {
  if (!audioCtx || musicTimer) return;
  const notes = [261.63, 329.63, 392.0, 493.88];
  let step = 0;
  musicTimer = setInterval(() => {
    if (!audioCtx || settings.music <= 0 || document.hidden) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(notes[step % notes.length] / 2, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((settings.music / 100) * 0.035, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 2);
    step += 1;
  }, 1600);
}
