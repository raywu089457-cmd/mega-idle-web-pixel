# mega-idle-web-pixel → 2.5D/3D 改造完整計畫

> 產出於 2026-07-21。涵蓋兩條保留像素風的路線:
> **路線 A — 零依賴 Canvas 等角 2.5D**、**路線 B — three.js 2.5D 廣告牌**。
> 兩者的可運行 PoC 已在 `poc/` 建好並截圖驗證(見文末)。
>
> **狀態(2026-07-21):Phase 1 + 2A + 2B + 3 全部完成並整合進真實遊戲。**
> 三種渲染後端 `?render=canvas2d|iso|three` 皆可跑,`node scripts/verify-all.mjs` 4/4、a11y 0 violation、offline ✓(v24)。Phase 3 視覺對齊全部完成:h p血條/effect icon/state icon/泡泡/建築 label/天氣粒子/夜火/建築 pips/獵場 label。

---

## 0. 結論先講

| | 路線 A(Canvas 等角) | 路線 B(three.js billboard) |
|---|---|---|
| 破壞「零依賴」約束? | ❌ 不破 | ✅ 破(需你拍板 + 改 CLAUDE.md) |
| 需 build tool? | 否 | 否(ESM importmap) |
| 遊戲邏輯改動 | **0 行** | **0 行** |
| `scene.js` 改寫比例 | ~40% | ~80% |
| 視覺提升 | 小~中(平面等角) | 中~大(真景深/光影/陰影) |
| 手機效能風險 | 最低 | 低(場景僅數十 mesh) |
| 離線 PWA 影響 | 無 | 需 vendor three(~150KB gzip)進 `sw.js` |
| 估工(單人) | 1~2 天 | 3~5 天 |
| 建議定位 | 保守升級 / 相容基準 | **主推:ROI 最高** |

**核心事實:** 全遊戲的 combat / heroes-stats / inventory / meta / expeditions / skills / resources-buildings / bonuses / state 這 9 個模組(約 2000+ 行)**完全不知道畫面怎麼畫**。3D 化只動 `scene.js` 一個檔的「繪製」段,以及少量投影輔助函式。

---

## 1. 為什麼可行:渲染 / 邏輯已解耦

`src/scene.js` 是唯一視覺模組。它做兩件事:

1. **場景 AI 更新**(`updateWanderingScene(dt)`、`moveActor`、`stepActor`):純數學,操作 `state.js` 裡的 `h.sx/h.sy`、`m.x/m.y`。**與渲染無關,兩條路線都原封不動。**
2. **繪製**(`drawScene / drawStaticLayer / drawWanderingActors / drawVillagers / spawnFloat`):把狀態畫成 Canvas 2D。**這才是要換的部分。**

DOM 也天生分層(已確認 `index.html`):

```
[#scene-canvas]  ← 底層渲染,路線 A 沿用 / 路線 B 換成 WebGL canvas
[#float-canvas]  ← 全螢幕飄字粒子 overlay (pointer-events:none) — 幾乎不動
[DOM 面板/HUD]   ← 最上層 — 完全不動
```

→ 換渲染器 = 抽換底層畫布,上面兩層照常運作。無障礙(a11y)由 DOM 承載,canvas 本來就對讀屏器不可見,**零回歸**。

---

## 2. 座標映射(兩路線共用)

現行世界為 **240(x) × 360(y)** 邏輯像素(直式)。3D 化把 `y` 重新解讀為「地面深度」軸。

| 現行 | 路線 A(等角) | 路線 B(three.js) |
|---|---|---|
| `(x, y)` 地面 | `sx=(x−y)·ISO_X`、`sy=(x+y)·ISO_Y−z·H` | `(x−120, 0, y−180)`(置中) |
| `sceneToClient(x,y)`(飄字用) | 改為等角 project() | 改為 `vec.project(camera)` → 螢幕 px |
| hotspot 矩形命中 | 逆投影 / 多邊形點測試 | `THREE.Raycaster` |
| 建築 plot `PLOT_COORDS[i]` | 直接當地面錨點 | `mapX/mapZ` 後放 mesh |
| 演員 `moveActor` 數學 | 不變 | 不變(sy→z) |

**關鍵:** `moveActor` / `stepActor` 用的是世界座標差值,與投影無關 → 移動邏輯零改動。只有「把世界座標畫到螢幕」這一步換公式。

---

## 3. 路線 A — 零依賴 Canvas 等角 2.5D

### 3.1 改動檔案
- **`src/scene.js`(主要)**
  - 新增 `project(wx,wy,wz)` 等角投影 + `computeView()`(依畫布置中/縮放)。
  - `drawStaticLayer`:大地菱形 + 格線 + 主幹道,取代原本正視天空漸層。
  - 建築:新增 `drawBox(wx,wy,halfW,halfD,h, wall, roof)` 畫等角箱(頂/東/南三面明暗 + 門),取代 `house()`。沿用 `PLOT_COORDS` 當地面錨點。
  - 演員/怪/墓碑:改為在 `project()` 後的螢幕點繪製「直立像素小人」(billboard 概念),沿用職業配色與 bob 動畫。
  - **y-sort**:建築與演員合併依 `(wx+wy)` 排序後繪製(遠者先畫)→ 正確遮擋。
  - hotspot:`hotspotAt` 改為對「屋頂多邊形 + 南面」做點測試,取 `(wx+wy)` 最大者。
- **`src/state.js`**:無需改(座標欄位沿用)。
- **`index.html` / `style.css`**:`#scene-canvas` 移除 `image-rendering:pixelated` 依舊 OK;可能要放大畫布容器。

### 3.2 保留不動
`updateWanderingScene` 整段狀態機、飄字 `float-canvas`、DOM UI、所有業務模組。

### 3.3 風險
- 等角命中測試需仔細(重疊建築取最上層)——PoC 已用多邊形 raycast 解掉。
- 高建築會遮住後方小人 → 靠 y-sort 解;深度是「基準點」排序,極少數跨格重疊會有瑕疵(可接受)。

---

## 4. 路線 B — three.js 2.5D 廣告牌(主推)

### 4.1 新增/改動檔案
- **`assets/vendor/three.module.js`**(vendor,離線用;PoC 先走 CDN importmap)。
- **`index.html`**:加 `<script type="importmap">` 指向 vendor 路徑;`#scene-canvas` 換成 three 的 WebGL canvas(或讓 three 掛在同容器)。
- **`src/scene3d.js`(新模組,取代 scene.js 繪製段)**:
  - `initScene3d()`:renderer / scene / PerspectiveCamera(斜俯視)/ OrbitControls(可選)/ Hemi+Directional 光。
  - 地面 `PlaneGeometry(240,360)` + 主幹道;9 棟建築 = `Box + Cone(4段=金字塔屋頂) + 門 plane`,`castShadow`。
  - 演員 = `THREE.Sprite` + `CanvasTexture`(離屏 canvas 畫原像素小人,`NearestFilter` 保留像素邊緣),依 `state` 的 `sx/sy` 更新 `position.x/z`,billboard 自動面向相機。
  - 日夜:現行 `Math.sin(t/18)` 直接驅動 `DirectionalLight` 角度/強度/顏色 + `scene.background`/`fog`。
  - `drawScene(t,dt)` → `renderScene3d(t,dt)`:先 `updateWanderingScene(dt)`(共用!)再更新 sprite 位置 + `renderer.render`。
  - `sceneToClient` → `worldToScreen`(`vector.project(camera)`)供飄字定位。
  - 點擊 → `Raycaster` 命中建築 mesh → 呼叫原 `openPanel(id)` / `handleHotspot`。
- **`src/scene.js`**:保留 AI 狀態機與 `spawnFloat`,繪製函式改由 `scene3d.js` 接手(或 scene.js 只留邏輯、繪製全搬 scene3d)。

### 4.2 保留不動
所有業務模組、DOM UI/HUD、`float-canvas` 飄字(只換座標投影來源)、AI 狀態機。

### 4.3 PWA / sw.js(**路線 B 必做**)
- vendor `three.module.js` 進 `assets/vendor/`,加入 `sw.js` install precache 清單。
- **bump `CACHE_NAME`**(專案硬規:每次玩法/資產 release 必 bump,否則舊 client 吃舊快取)。
- importmap 路徑用相對 `./assets/vendor/…` 避免 GitHub Pages 子路徑問題(與現行 manifest 同策略)。

### 4.4 風險
- **離線**:CDN 版離線白畫面 → 必須 vendor 進本地並 precache(如上)。
- **效能**:陰影 `shadowMap` 在低階手機偏重 → 手機可關陰影或降 `shadow.mapSize`;`setPixelRatio(min(2,dpr))`。場景僅 ~9 建築 + 數十 sprite,draw call 極少,主流手機無虞。
- **`prefers-reduced-motion`**:需在 render loop 尊重(靜止相機、停 bob),與現行 guard 對齊。
- **bundle 體積**:three ~150KB gzip;首次載入成本,但一次快取後離線。

---

## 5. 測試鏈影響(專案現有 `scripts/`)

| 腳本 | 路線 A | 路線 B |
|---|---|---|
| `check-imports.mjs`(0 循環) | 需通過(新 project() 在 scene.js) | scene3d.js 併入依賴圖,需通過 |
| `check-onclick.mjs`(onclick 全覆蓋) | 不受影響 | 不受影響(onclick 仍走 window-bridge) |
| `smoke-test.mjs` | 需確認 init 無例外 | **需在有 WebGL 的環境跑**(jsdom 無 WebGL → 可能要 Playwright headless) |
| `screenshot.mjs`(視覺回歸) | baseline 需重拍 | baseline 需重拍 |
| `a11y-test.mjs` | 0 回歸(a11y 在 DOM) | 0 回歸 |
| `perf-bench.mjs` / `fps-bench.mjs` | 重設基準 | 重設基準(WebGL FPS) |
| `offline-test.mjs` | 不受影響 | **必跑**(確認 vendor three 已快取) |

**note:** 路線 B 的 smoke/單元測試若在 Node/jsdom 跑會缺 WebGL context;建議把「渲染煙霧測試」移到 Playwright(專案已裝 playwright + chromium 1228)。本次 PoC 即用它截圖驗證。

---

## 6. 分期建議(兩路線通用骨架)

1. **Phase 0 — PoC(已完成)**:`poc/` 兩檔各證明可行 + 截圖。
2. **Phase 1 — 抽繪製介面**:把 scene.js 的「繪製」與「AI 更新」明確切開(現已幾乎切開),定義 `renderScene(t,dt)` 介面。
3. **Phase 2 — 換渲染器**:實作 A 或 B 的 render 層,座標映射 + 建築 + 演員 + 日夜。
4. **Phase 3 — 互動回接**:hotspot 點擊 → `openPanel`;飄字投影;hover hint。
5. **Phase 4 — PWA/測試**:(B)vendor three + sw.js bump;重拍 screenshot/perf baseline;跑 offline/a11y/imports/onclick 全綠。
6. **Phase 5 — 手機打磨**:reduced-motion、陰影降階、觸控目標 44px 不回歸。

---

## 7. PoC 位置與如何看

```
poc/canvas-isometric.html   # 路線 A:純 Canvas,雙擊即開,無需網路
poc/three-billboard.html    # 路線 B:three.js,需網路抓 CDN(離線正式版會 vendor)
scripts/poc-shot.mjs        # 用專案 playwright 對 PoC 截圖驗證(node scripts/poc-shot.mjs <html> <out.png>)
```

兩者皆:等角/斜俯視村莊、9 棟真實 plot 建築、會走動的像素獵人(職業配色)+ 野怪、日夜循環、點擊建築回傳 `openPanel(id)`。已 headless 渲染、`0 page error` 驗證。

---

## 8. 待你決定
1. 是否為路線 B 破例引入 three.js(需同步修訂 `CLAUDE.md` 第 59 行「零依賴」約束)。
2. 若要進 Phase 1+,先做哪一條(或兩條並行,A 當離線相容基準、B 當主線)。
