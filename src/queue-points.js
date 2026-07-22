// src/queue-points.js — L1 服務建築排隊點(§七 2)
// 設計:每棟商店定義 3 個 slot offset,排隊者依序分配到不同 slot,避免全擠在門口
// slot 是相對建築錨點 (BUILDING_ANCHORS[shopId]) 的偏移,scene.js 套用 plotDelta 自動跟著擺位走

// 每棟最多 3 個排隊點;dx/dy 為相對 anchor 的像素偏移
export const QUEUE_SLOTS = Object.freeze({
  // 飲料店(anchor: 166, 214)
  drink: Object.freeze([
    { dx: 12, dy:  8 },   // 1 號等候
    { dx: 18, dy: 14 },
    { dx: 24, dy: 20 },   // 3 號等候(最遠)
  ]),
  // 煉金工房(anchor: 121, 286)
  alchemy: Object.freeze([
    { dx: -10, dy: 18 },
    { dx: -16, dy: 26 },
    { dx: -22, dy: 34 },
  ]),
  // 鐵匠鋪(anchor: 44, 278)
  forge: Object.freeze([
    { dx: -14, dy: 22 },
    { dx: -20, dy: 30 },
    { dx: -26, dy: 38 },
  ]),
});

/**
 * 取第 idx 個排隊點的 offset(相對於 anchor)
 * @param {string} shopId - 'drink' | 'alchemy' | 'forge'
 * @param {number} idx - 排隊序號 0/1/2 (超過容量 fallback 到最後一個)
 * @returns {{dx:number, dy:number}|null}
 */
export function getQueueSlotOffset(shopId, idx) {
  const slots = QUEUE_SLOTS[shopId];
  if (!slots || slots.length === 0) return null;
  const clamped = Math.max(0, Math.min(idx, slots.length - 1));
  return slots[clamped];
}

/** 該 shop 最多排隊容量(用於 UI 顯示 / NPC 行為決策) */
export function getQueueCapacity(shopId) {
  return QUEUE_SLOTS[shopId]?.length ?? 0;
}
