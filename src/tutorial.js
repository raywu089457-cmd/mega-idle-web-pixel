// src/tutorial.js — L1 玩家引導教學(§X 5 個新機制)
// 設計:首次登入後,5 個 modal 依序介紹 4 階段建築/區域 trophy/重建傳統/專精分支/服務圈配置
// settings.tutorialDone flag 控制;玩家可跳過;HUD "? " 按鈕可手動再觸發

import { showModal, closeModal, $, showToast } from './util.js'
import { settings, setSettings } from './state.js'

export const TUTORIAL_STEPS = Object.freeze([
  {
    id: 'stages', icon: '🏰', title: '🏰 建築 4 階段升級',
    body: `<div style="font-size:13px;line-height:1.6;">每棟建築隨等級提升會經歷 <b>初建/改建/專業/地標</b> 4 階段:
<br><br>• <b>初建</b>(Lv1-2):基礎外觀
<br>• <b>改建</b>(Lv3-6):石牆 + 煙囪 + <b style="color:var(--gold)">+20% 容量/產量</b>
<br>• <b>專業</b>(Lv7-9):銀灰石牆 + 旗幟 + 暖黃窗
<br>• <b>地標</b>(Lv10+):金邊 + 塔樓 + 燈籠 + 外光暈
<br><br>建到 Lv3 起卡片會出現 <b>階段徽章</b>,快來升級看差異!
</div>`,
  },
  {
    id: 'region', icon: '🏆', title: '🏆 區域解鎖',
    body: `<div style="font-size:13px;line-height:1.6;">擊敗 5 個區域 boss 各獲得 1 種 <b>特殊 trophy</b>:
<br><br>• 🌫️ 霧靈核心 / 🛡 母巢甲殼 / ⛏ 礦心金核 / 🔥 熔核之心 / 🌌 虛空碎片
<br><br>trophy 自動入庫(可用於建築升級 -20%/個 折扣,最多 -80%)
<br>並在對應建築加 <b>區域裝飾</b>(例:煉金工房加綠玻璃瓶、市集加紫水晶秤)
<br><br>畫面下方 <b>地圖</b> 開外圈門就能挑戰 boss!
</div>`,
  },
  {
    id: 'traditions', icon: '🌀', title: '🌀 重建傳統',
    body: `<div style="font-size:13px;line-height:1.6;">擊敗 <b>魔域大君</b>(Zone 5) 後可解鎖「重建」功能。
<br><br>每次重建選擇 1 項村莊傳統:
<br>• 💰 商業:商店營收 +25%/次
<br>• ⚒️ 鍛造:精良/傳說出現率 +8%/次
<br>• 🏹 狩獵:金幣/經驗/素材 +15%/次
<br>• 📚 學術:技能 AP +1/次
<br>• 🗺 開拓:boss 戰前置寬鬆 1 階
<br><br><b style="color:var(--gold)">比「每片 +10%」線性更有策略性</b>;可疊加,每次重建選不同。
</div>`,
  },
  {
    id: 'specializations', icon: '⚒️', title: '⚒️ 建築專精',
    body: `<div style="font-size:13px;line-height:1.6;">建築到達 <b>Lv3</b> 時彈出 <b style="color:var(--gold)">專精選擇</b> modal,二選一永久鎖定。
<br><br>例:武器店可選
<br>• ⚔️ 量產線:產量 +50%
<br>• ✨ 匠心坊:精良裝備出現率 +3%/級
<br><br>目前 <b>10 棟</b> 可選(酒館/旅館/餐廳/飲料店/鐵匠/皮甲/煉金/研究所/強化爐/魔核研究所)
<br><br><b>一旦選了就無法更改</b>,請謹慎。
</div>`,
  },
  {
    id: 'layouts', icon: '🏘', title: '🏘 服務區配置',
    body: `<div style="font-size:13px;line-height:1.6;">建築面板頂部有 <b>3 種一鍵布局</b>:
<br><br>• 🏥 服務型:急救/煉金靠近主路
<br>• ⚒️ 鍛造型:鐵匠在中央
<br>• 💰 商業型:市集靠近主路
<br><br>點擊套用會自動批量 swap 所有建築位置。
<br><br>9 棟建築的 <b style="color:var(--gold)">可達性</b> 也有 BFS 檢查,主路斷了會出現 ⚠️ 路徑中斷 警示。
</div>`,
  },
])

let _idx = 0

function renderStep(idx) {
  const step = TUTORIAL_STEPS[idx]
  if (!step) return false
  $('tutorial-title').textContent = step.title
  $('tutorial-body').innerHTML = step.body
  $('tutorial-progress').textContent = `${idx + 1}/${TUTORIAL_STEPS.length}`
  // 按鈕可見性
  const prevBtn = $('tutorial-prev')
  const nextBtn = $('tutorial-next')
  if (prevBtn) prevBtn.style.display = idx === 0 ? 'none' : 'inline-block'
  if (nextBtn) nextBtn.textContent = idx === TUTORIAL_STEPS.length - 1 ? '完成 ✓' : '下一步 →'
  return true
}

export function showTutorialIntro() {
  if (settings.tutorialDone) return false
  _idx = 0
  if (!renderStep(_idx)) return false;
  showModal('modal-tutorial')
  return true
}

export function tutorialNext() {
  if (_idx < TUTORIAL_STEPS.length - 1) {
    _idx++
    renderStep(_idx)
  } else {
    // 完成 → 標記 done + close
    setSettings({ ...settings, tutorialDone: true });
    closeModal()
    showToast('✨ 教學完成,祝獵魔愉快!', 'success', 3000)
  }
}
export function tutorialPrev() {
  if (_idx > 0) {
    _idx--
    renderStep(_idx)
  }
}
export function tutorialSkip() {
  setSettings({ ...settings, tutorialDone: true });
  closeModal()
  showToast('已跳過教學(可在「設定」重新開啟)', 'info')
}
export function tutorialRestart() {
  _idx = 0
  if (!renderStep(0)) return;
  showModal('modal-tutorial')
}
