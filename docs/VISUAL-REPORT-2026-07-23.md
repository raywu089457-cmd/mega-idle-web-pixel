# 視覺驗收報告 2026-07-23

> 自動產生 via Playwright MCP;在 file:// 模式下載入 index.html,save-edit 切 4 個 building level 狀態,截 scene canvas。

## 截圖 4 個(每個對應一個 stage)

| 階段 | 截圖 | 描述 |
|---|---|---|
| 初建 Lv1-2 | [visual-default-lv1.png](./visual-default-lv1.png) | 預設狀態:Lv1 為主,木褐牆壁為主色 |
| 改建 Lv3 | [visual-lv3-developed.png](./visual-lv3-developed.png) | Lv3 全部建築:石牆色 + 煙囪 + 貨架,無區域裝飾 |
| 專業 Lv7 | [visual-lv7-professional.png](./visual-lv7-professional.png) | Lv7:銀灰石牆 + 旗幟(主堡/市集/研究所) + 暖黃窗(酒館/餐廳/飲料店) |
| 地標 Lv10 + 全解鎖 | [visual-lv10-full-build.png](./visual-lv10-full-build.png) | Lv10 + 5 zone bosses 擊敗 + 5 trophy + commerce tradition ×1 |

## 驗收流程

1. 載入 `index.html?skiponboard=1`(跳過 onboard + tutorial)
2. evaluate JS 設定 localStorage `kingdomBuilderSave`:
   - 所有 buildings level 設為目標值
   - mapProgress 5 個 zone bossDefeated = true(只有 Lv10 case)
   - 5 個 trophy resources 設為 1(只有 Lv10 case)
   - prestige traditions 設為目標值
3. 重新 navigate(觸發 init 載入新 state)
4. resize 到 480×800(手機預覽尺寸)
5. Screenshot scene canvas 480×800 → PNG
6. 重新 navigate + 重複

## 視覺差異對照

| 元素 | Lv1 | Lv3 | Lv7 | Lv10 |
|---|---|---|---|---|
| 牆色 | 木褐 | 灰石 | 銀石 | 米金 |
| 煙囪 | ❌ | ✅ | ✅ | ✅ |
| 貨架 | ❌ | ✅ | ✅ | ✅ |
| 旗幟 | ❌ | ❌ | ✅(主堡/市集/研究所) | ❌(被塔取代) |
| 塔樓 | ❌ | ❌ | ❌ | ✅(僅主堡) |
| 燈籠 | ❌ | ❌ | ❌ | ✅(全 8 棟) |
| 外光暈 | ❌ | ❌ | ❌ | ✅(全 8 棟) |
| 區域裝飾 | ❌ | ❌ | ❌ | ✅(需擊敗對應 boss) |
| 服務圈分區色帶 | ✅(隨建築存在)| ✅ | ✅ | ✅ |

## 截圖腳本(下次可重跑)

```bash
# 透過 Playwright MCP 跑以下 evaluate:
# 1. 載入頁面
mcp__playwright__playwright_navigate url="file:///C:/Users/ray/Desktop/Claude%20code/mega-idle-web-pixel/index.html?skiponboard=1"
# 2. 設定 save state (見上方 evaluate 內容)
mcp__playwright__playwright_evaluate script='...'
# 3. 重新 navigate 讓 init 重新讀 state
mcp__playwright__playwright_navigate url="file:///.../index.html?skiponboard=1"
# 4. 截圖
mcp__playwright__playwright_screenshot name="visual-X" width=480 height=800 savePng=true downloadsDir=docs/
```

## 結論

✅ 4 個 stage 在 scene canvas 視覺差異清晰
✅ 區域解鎖(zone 1-5 boss 擊敗後的 trophy 裝飾)正確顯示
✅ service zone 色帶在每個 stage 都保留
✅ 建築 layout 在不同 stage 之間結構穩定(座標未移位)

4 個截圖保留在 `docs/visual-*.png`,總計 ~131 KB。
