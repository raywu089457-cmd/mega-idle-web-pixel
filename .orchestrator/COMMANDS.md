# Orchestrator — 指令參考

## CLI 指令

### `/build <system>`
建構指定系統，自動生成 task tree 並依賴順序執行。

```
/build save-system    # 存檔系統（Tier 0，所有系統的基礎）
/build resource-system # 資源系統
/build monument-system # 紀念碑系統
/build hero-system    # 英雄系統
/build shop-system    # 商店系統
/build map-system    # 地圖系統
/build offline-system # 離線系統
/build tick-system    # Tick 主迴圈
/build visual-canvas  # Canvas 視覺層
/build visual-ui     # UI 面板層
/build pwa           # PWA 基礎設施
```

### `/status`
查詢目前所有 task 的執行狀態。

### `/continue <task-id>`
繼續被阻斷的 task（如依賴已解決）。

### `/abort <task-id>`
放棄指定 task。

### `/report`
輸出完整進度報告。

### `/review <file>`
對單一檔案發起 code review flow。

---

## Task Status Flow

```
pending → in_progress → completed
                        ↘ blocked (依賴未滿)
                        ↘ failed (執行失敗)
```

## System Tier Map

| Tier | 系統 | 說明 |
|------|------|------|
| 0 | save-system, pwa | 無依賴，可並行 |
| 1 | resource-system | 依賴 save-system |
| 2 | monument-system, hero-system | 依賴 tier 0-1 |
| 3 | shop-system, map-system, offline-system | 依賴 tier 0-2 |
| 4 | tick-system | 依賴幾乎所有系統 |
| 5 | visual-canvas, visual-ui | 依賴 logic 完成 |

## 系統建構優先順序

```
save-system (Tier 0，基礎)
    ├── resource-system (Tier 1)
    │       ├── monument-system (Tier 2)
    │       └── hero-system (Tier 2)
    │               ├── shop-system (Tier 3)
    │               └── map-system (Tier 3)
    └── pwa (Tier 0)
            └── offline-system (Tier 3)

tick-system (Tier 4，依賴上方)

視覺層 (Tier 5，並行)
    ├── visual-canvas
    └── visual-ui
```

---

## Orchestrator 目錄結構

```
.orchestrator/
├── tasks/                    # Task card JSONs
│   └── {id}-{taskName}-task.json
├── outputs/                  # Sub-agent 執行結果
│   └── {id}-{agentType}-output.md
└── state/
    ├── orchestration-state.json   # 全域進度狀態
    ├── system-dependency-map.json # 系統依賴圖
    └── task-queue.json           # Task 佇列
```
