// src/main.js — 入口
// import 順序很重要:讓 state.js / window-bridge.js 早於 init() 完整載入
// init() 本身在 settings-and-init.js — 從此處 import 後立即呼叫即可

import './util.js';                 // L0: $ / rand / fmt / showToast ...
import './data.js';                 // L0: 純資料
import './building-stages.js';      // L1: 4 階段定義(§十 第二優先)
import './building-effects.js';     // L1: 階段效果 wrapper(§十 第二優先)
import './reachability.js';         // L1: 建築可達性檢查(§七 1)
import './queue-points.js';         // L1: 服務建築排隊點(§七 2)
import './region-unlocks.js';       // L1: 區域綁建築升級(§十 第三)
import './state.js';                // L1: SOT
import './bonuses.js';              // L2: multiplier
import './resources-buildings.js';  // L2
import './skills.js';               // L2
import './audio.js';                // L2
import './inventory.js';            // L2
import './heroes-stats.js';         // L2
import './meta.js';                 // L2
import './combat.js';               // L2
import './combat-party.js';         // L2
import './expeditions.js';          // L2
import './scene.js';                // L2
import './ui.js';                   // L2
import './settings-and-init.js';    // L2 (含 init)
import './window-bridge.js';        // 觸發 window 掛載
import './selftest.js';             // 內建 console.MegaIdleSelftest

import { init } from './settings-and-init.js'

init();
