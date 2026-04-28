# Orchestrator Design — Tree Callback Multi-Agent System

> **Project**: mega-idle-web
> **Parent Doc**: 2026-04-26-idle-kingdom-web-design-ARCHITECTURE.md
> **Date**: 2026-04-26
> **Status**: Design Spec

---

## 1. 設計決策

| 決策 | 選擇 |
|------|------|
| Orchestrator 位置 | Claude Code CLI 原生內建（使用 Agent tool） |
| 任務格式 | JSON task card + Markdown task description |
| 匯報時機 | 每個系統完成時 |
| 依賴機制 | Tree callback — parent 收集 output 後觸發下一層 |
| 對話歷史 | 統一由 parent (CLI) 持有，sub-agent 無狀態 |

---

## 2. 目錄結構

```
mega-idle-web/
├── .orchestrator/
│   ├── tasks/                    # 待執行 task card (.json)
│   │   ├── 01-data-architect-task.json
│   │   ├── 02-monument-system-dev-task.json
│   │   └── ...
│   ├── outputs/                 # 各 agent 執行結果 (.md)
│   │   ├── 01-data-architect-output.md
│   │   └── ...
│   └── state/
│       ├── orchestration-state.json   # 當前進度
│       └── task-queue.json           # 任務佇列
├── js/
│   └── ...
└── index.html
```

---

## 3. Task Card Schema

每個 task card 是固定格式的 JSON，sub-agent 讀取後執行：

```json
{
  "id": "01",
  "taskName": "data-architect-monument",
  "agentType": "data-architect",
  "files": {
    "read": ["docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md"],
    "write": ["js/data/gameData.js"]
  },
  "dependsOn": [],
  "context": {
    "system": "monumentSystem",
    "description": "設計紀念碑系統的資料結構與初始數值",
    "prompt": "## 任務\n\n使用 data-architect 的角色，設計 monumentSystem 的資料結構。\n\n### 輸入 spec\n讀取 `docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md` 第 6.1 節。\n\n### 產出\n在 `js/data/gameData.js` 的 MONUMENT 區塊寫入：\n- 等級結構造（level, multiplier, maxCapacity）\n- 初始數值（baseOutput: 1-3 per material per second）\n- 升級成本公式\n\n## 輸出格式\n完成後在 `.orchestrator/outputs/01-data-architect-output.md` 寫入：\n- 做的更動摘要\n- 任何疑問或假設\n- 後續建議"
  },
  "reportAt": "system-complete",
  "status": "pending"
}
```

### Task Card 欄位說明

| 欄位 | 意義 |
|------|------|
| `id` | 序列號，越小越先執行 |
| `taskName` | 識別名稱 |
| `agentType` | 對應架構中的 Agent 角色 |
| `files.read` | 此 task 需要讀取的檔案 |
| `files.write` | 此 task 需要寫入的檔案 |
| `dependsOn` | 依賴的 task id（陣列），這些 task 完成後才執行 |
| `context.prompt` | 給 sub-agent 的完整任務描述（Markdown） |
| `reportAt` | `"system-complete"` = 此系統完成時匯報 |
| `status` | `pending` / `in-progress` / `completed` / `blocked` |

---

## 4. Output Report Schema

sub-agent 完成後寫入 `.orchestrator/outputs/{id}-{agentType}-output.md`：

```markdown
# [Task Name] — 執行報告

## 狀態
✅ 完成 / ⚠️ 有疑慮 / ❌ 失敗

## 做的更動
- [file.js]: 變更摘要

## 輸出資料（供下游使用）
```json
{
  "monumentLevels": [ ... ],
  "productionFormula": "..."
}
```

## 疑問 / 假設
- 升級成本是否線性遞增？假設為 `level * 100` 金幣

## 後續建議
- 下一步應由 `balance-designer` 驗證數值
- `monument-system-dev` 需要此输出来實作
```

---

## 5. Orchestrator State Machine

```
                    ┌─────────────────────┐
                    │   IDLE              │
                    │  (等待 CLI 指令)     │
                    └──────────┬──────────┘
                               │ /build monument-system
                               ▼
                    ┌─────────────────────┐
                    │  PARSING             │
                    │  讀取 ARCHITECTURE   │
                    │  生成 task tree      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  PLANNING            │
                    │  寫入 tasks/*.json   │
                    │  決定執行順序         │
                    └──────────┬──────────┘
                               │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐   ┌────────────┐  ┌────────────┐
     │ Task A     │   │ Task B     │  │ Task C     │
     │ (無依賴)   │   │ (等 A 完成) │  │ (等 A 完成) │
     └─────┬──────┘   └─────┬──────┘  └─────┬──────┘
           │                │               │
           ▼                │               │
     ┌────────────┐         │               │
     │ 完成 →     │◄────────┘               │
     │ 寫 output  │                        │
     └─────┬──────┘                        │
           │  parent 讀取 output            │
           │  解除 block                    │
           ▼                               ▼
     ┌────────────┐                  ┌────────────┐
     │ Task B     │                  │ Task C     │
     │ 執行       │                  │ 執行        │
     └─────┬──────┘                  └─────┬──────┘
           │                               │
           ▼                               ▼
     ┌────────────┐                  ┌────────────┐
     │ 完成 →     │                  │ 完成 →     │
     │ 寫 output  │                  │ 寫 output  │
     └─────┬──────┘                  └─────┬──────┘
           │  parent 讀取 output            │
           └──────────────┬─────────────────┘
                          ▼
                 ┌────────────────┐
                 │ ALL COMPLETE    │
                 │ 匯報使用者      │
                 │ (system-complete)│
                 └────────────────┘
```

---

## 6. Task Tree 範例：興建紀念碑系統

```
/build monument-system

→ Orchestrator 生成以下 task tree：

Task 01: data-architect
  dependsOn: []
  → output: monument 資料結構 / 等級定義

Task 02: balance-designer
  dependsOn: [01]
  → output: 數值平衡 / 生產倍率公式

Task 03: monument-system-dev
  dependsOn: [02]
  → output: monumentSystem.js 實作

Task 04: canvas-renderer
  dependsOn: [03]
  → output: Canvas 視覺化（浮動數字）

Task 05: code-reviewer
  dependsOn: [03, 04]
  → output: 程式碼審核

Task 06: test-automation
  dependsOn: [05]
  → output: 測試結果
```

---

## 7. Orchestrator Prompt 模板

當你需要啟動 orchestrator 時，在 CLI 下指令，parent agent 使用以下 prompt template：

```
## Orchestrator Prompt Template

你是 mega-idle-web 專案的 Orchestrator。

### 任務
`{user_command}` (例如：/build monument-system)

### 讀取以下檔案
1. `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design.md`
2. `projects/mega-idle-web/docs/superpowers/specs/2026-04-26-idle-kingdom-web-design-ARCHITECTURE.md`
3. (現有相關實作檔案)

### 執行流程

1. **解析任務** — 分析需要哪些系統與 Agent
2. **建立 Task Tree** — 在 `.orchestrator/tasks/` 產生 task card JSONs
3. **依序執行** — 每次用 Agent tool 呼叫一個 sub-agent：
   - 傳遞 task card JSON 作為 context
   - sub-agent 執行後寫入 `.orchestrator/outputs/`
4. **匯報** — 每個 `reportAt: "system-complete"` 的 task 完成後向你（parent）匯報
5. **繼續或終止** — 根據你的決定繼續下一層或終止

### Task Card 寫入位置
`.orchestrator/tasks/{id}-{taskName}-task.json`

### Output 讀取位置
`.orchestrator/outputs/{id}-{agentType}-output.md`

### 當前狀態查詢
可用 `rtk cat .orchestrator/state/orchestration-state.json` 查看進度
```

---

## 8. 內建 Orchestrator 指令 (CLI Commands)

| 指令 | 動作 |
|------|------|
| `/build <system>` | 開始建立系統（如 `/build monument-system`） |
| `/review <file>` | 對單一檔案發起 code review flow |
| `/status` | 查詢目前所有 task 的執行狀態 |
| `/continue` | 繼續被阻斷的 task（如依賴已解決） |
| `/abort <task-id>` | 放棄指定 task |
| `/report` | 輸出完整進度報告 |

---

## 9. Orchestration State JSON

```json
{
  "version": 1,
  "sessionId": "2026-04-26-001",
  "startedAt": "2026-04-26T10:00:00Z",
  "rootTask": "monument-system",
  "tasks": {
    "01": { "name": "data-architect", "status": "completed", "agentType": "data-architect" },
    "02": { "name": "balance-designer", "status": "in-progress", "agentType": "balance-designer" },
    "03": { "name": "monument-system-dev", "status": "blocked", "dependsOn": ["01", "02"] },
    "04": { "name": "canvas-renderer", "status": "pending", "dependsOn": ["03"] },
    "05": { "name": "code-reviewer", "status": "pending", "dependsOn": ["03", "04"] }
  },
  "nextAction": "等待 Task 02 完成後解除 Task 03 block"
}
```

---

## 10. 依賴圖（系統建構順序）

每個系統的建構依賴鏈：

```
resourceSystem
    ├── monumentSystem (依賴 resourceSystem)
    ├── shopSystem    (依賴 resourceSystem)
    └── heroSystem    (依賴 resourceSystem)
        ├── combatResolution (依賴 heroSystem)
        └── mapSystem        (依賴 heroSystem)

視覺層 (可在邏輯層完成後並行)
    ├── canvasRenderer (依賴各系統 logic 完成)
    └── uiManager      (依賴各系統 logic 完成)

横跨所有
    ├── offlineSystem (依賴 resourceSystem, heroSystem)
    └── saveSystem    (依賴所有系統)
```

---

## 11. Context 傳遞規則

| 層級 | 持有者 | 向下傳遞 |
|------|--------|----------|
| Task Card JSON | orchestrator | 完整 context，包含 dependsOn 的 output 摘要 |
| Sub-agent Prompt | orchestrator | `context.prompt` + 所有依賴 task 的 output 內容 |
| 寫入檔案 | sub-agent | 直接寫入專案檔案 |
| Output Report | sub-agent | 寫入 `.orchestrator/outputs/` |

parent 在 dispatch 每個 sub-agent 前，會把所有 dependsOn 的 output report 讀取後摘要進 prompt，確保 sub-agent 有足夠上下文。

---

## 12. 匯報觸發條件

```
when sub-agent 完成 task，且 task.reportAt === "system-complete":
    → 暫停，匯報給你（parent）
    → 你決定：
        a) 繼續下一個 task
        b) 終止並重定向
        c) 要求重新執行
```

每次匯報包含：
- 完成什麼
- 做的更動（下游需知）
- 任何警告或假設
- 建議下一步

---

## 13. 錯誤處理

| 情況 | 處理方式 |
|------|----------|
| sub-agent 執行失敗 | 寫入 error 到 output report，匯報給你，等待指示 |
| dependsOn 的 output 不符合預期 | 匯報問題，你決定是否重跑依賴或繼續 |
| task tree 有環形依賴 | orchestrator 在 planning 階段檢測並報錯 |
| 你要求 abort | 終止該 task，標記下游為 blocked，匯報 |

---

## 14. 實作：如何啟動 Orchestrator

### 步驟 1：建立目錄
```bash
mkdir -p projects/mega-idle-web/.orchestrator/tasks
mkdir -p projects/mega-idle-web/.orchestrator/outputs
mkdir -p projects/mega-idle-web/.orchestrator/state
```

### 步驟 2：啟動開發對話
在你（parent）的 CLI 中說：
```
/build monument-system
```

### 步驟 3：Orchestrator (parent agent) 自動執行
1. 讀取 spec 和 architecture doc
2. 在 `.orchestrator/tasks/` 產生 task cards
3. 按順序 dispatch sub-agents
4. 每個系統完成後匯報給你

---

## 15. 下一步

1. **你確認這個 design** — 有無需要調整之處？
2. **實作初始化** — 我幫你建立 `.orchestrator/` 目錄結構與 state file
3. **試跑第一個系統** — `/build save-system` 作為 pilot（因為其他系統都依賴它）
