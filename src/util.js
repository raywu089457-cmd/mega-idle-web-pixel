// src/util.js — L0 純函式 + L0.5 DOM 控件
// 零 import 依賴;所有 helper 對外 export
// 從 index.html L1411-1425 + L1803-1808 + L2649-2650 + L3541-3542 + L3570-3577 搬出

// ─── DOM query ───────────────────────────────────────────────────────
export const $ = (id) => document.getElementById(id);

// ─── Random / math ───────────────────────────────────────────────────
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randf = (min, max) => Math.random() * (max - min) + min;
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// ─── UID / format ────────────────────────────────────────────────────
export const uid = () => 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const fmt = (n) => {
  n = Math.floor(n || 0);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
};
export const pct = (cur, max) => clamp(max > 0 ? (cur / max) * 100 : 0, 0, 100);
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ─── Date / time ─────────────────────────────────────────────────────
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + '秒前';
  if (s < 3600) return Math.floor(s / 60) + '分前';
  return Math.floor(s / 3600) + '時前';
}
export const todayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d); }

// ─── Canvas color ────────────────────────────────────────────────────
export const mixColor = (a, b, k) => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
export const rgb = (arr) => `rgb(${arr[0]},${arr[1]},${arr[2]})`;

// ─── Modal / toast (DOM-only,不依賴 game state) ─────────────────────
export function showModal(id) { $(id).classList.add('open'); }
export function hideModal(id) { $(id).classList.remove('open'); }
export function closeModal() { hideModal('modal-detail'); }
export function showToast(msg, type = 'info') {
  const box = $('toast-container'); if (!box) return;
  const el = document.createElement('div'); el.className = `toast toast-${type} show`; el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => el.remove(), 320); }, 2200);
}
