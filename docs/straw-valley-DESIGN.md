# Design System Inspired by Stardew Valley

## 1. Visual Theme & Atmosphere

Stardew Valley captures the warmth of a simpler time -- pixel art rendered with love, where every pixel has purpose. The aesthetic evokes 16-bit nostalgia (SNES/Genesis era) while feeling cozy and inviting, not retro-for-retro's-sake. It's the feeling of a sunny afternoon in a small farming town: neighbors wave, chickens cluck, and the jukebox plays familiar tunes.

The design blends **pixel-perfect minimalism** with **rich, earthy warmth**. Sharp pixel edges meet soft乡村 colors. UI elements feel like they were drawn on graph paper, then colored with a limited but harmonious palette. Everything scales cleanly while maintaining crisp pixel boundaries.

**Key Characteristics:**
- Pixel art aesthetic with clean, intentional sprite work
- Limited but warm color palette (earth tones, muted greens, golden yellows)
- Hand-crafted UI elements that feel like game menus
- Cozy, nostalgic atmosphere -- small-town America meets fantasy RPG
- Subtle animations (idle bobbing, gentle particle effects like fireflies)
- Wood grain textures, stone borders, and rustic UI frames
- Character portraits with personality and charm

## 2. Color Palette & Roles

### Primary
- **Rich Soil Brown** (`#5d4037`): Primary UI frame color, headers, borders. Deep brown like tilled earth.
- **Warm Wood** (`#8b5a2b`): Secondary frames, buttons, panels. Lighter wood tone.
- **Golden Wheat** (`#f4d03f`): Highlight color, coins, selected states, important UI elements.
- **Leaf Green** (`#6aaa64`): Nature accents, healthy crops, positive states.
- **Soft Sky** (`#87ceeb`): Backgrounds, water, calm elements.

### Secondary
- **Dark Stone** (`#555555`): Text borders, shadow depths, pixel outlines.
- **Parchment** (`#fff8dc`): Menu backgrounds, text areas, document-style panels.
- **Burnt Orange** (`#e67e22`): Fall/harvest accents, fire, warm highlights.
- **Wine Purple** (`#6c3483`): Mystical elements, gem crystals, evening sky.
- **Soft Pink** (`#f5b7b1`): Flower accents, cherry blossoms, friendly elements.

### Neutrals
- **Charcoal** (`#2c2c2c`): Primary text color, high contrast elements.
- **Stone Gray** (`#888888`): Disabled text, secondary information.
- **Paper Cream** (`#faf0e6`): Light backgrounds, interior panels.
- **Light Tan** (`#d2b48c`): Wood lighter areas, craft surfaces.

### Interactive
- **Hover Highlight** (`#ffd700`): Selection highlight, important hover states
- **Active Green** (`#58a649`): Confirmed actions, success states
- **Warning Orange** (`#d35400`): Time warnings, urgent notifications

### In-Game Element Colors
- **Crop Green** (`#4a7c23`): Growing crops, healthy plants
- **Harvest Gold** (`#daa520`): Ripe wheat, fall foliage
- **Water Blue** (`#3498db`): Rivers, ponds, hydration elements
- **Mine Gray** (`#7f8c8d`): Stone, ore, mining UI
- **Evening Purple** (`#8e44ad`): Night time, magical elements

## 3. Typography Rules

### Font Family
- **Primary**: `Stardew_Valley.ttf` (custom pixel font), fallback: `Press Start 2P` from Google Fonts
- **Body**: `Lora`, fallback: `Georgia`, serif -- for longer text like mail/journal entries
- **UI Numbers**: Pixel-style numerals for game stats (health, money, time)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Title | Press Start 2P | 24px | 400 | 1.4 | Game title, menu headers |
| Menu Header | Press Start 2P | 16px | 400 | 1.3 | Section titles in menus |
| Button Text | Press Start 2P | 12px | 400 | 1.2 | In-game buttons, options |
| Body Text | Lora | 16px | 400 | 1.6 | Journal entries, mail, descriptions |
| Caption | Lora | 14px | 400 | 1.4 | NPC dialogue, item descriptions |
| Small Label | Press Start 2P | 8px | 400 | 1.2 | Stats, inventory numbers |
| HUD | Press Start 2P | 10px | 400 | 1.1 | Health, stamina, money display |

### Principles
- **Pixel-perfect alignment**: All pixel font text aligns to an 8px grid
- **Retro character spacing**: Pixel fonts require slightly looser letter-spacing for readability
- **Warm body text**: Journal entries and lore use serif Lora for readability while maintaining cozy feel
- **Stat display**: Numbers use pixel font for game-authentic HUD feel
- **Limited hierarchy**: 3-4 text sizes max -- pixel art favors simplicity

## 4. Component Stylings

### Buttons

**Wood Frame Button (Standard)**
- Background: Wood grain texture (#8b5a2b with darker grain lines)
- Border: 4px pixel-perfect brown frame (#5d4037)
- Text: Press Start 2P 12px, color varies by context
- Padding: 12px 20px
- Hover: Slight brightness increase, text shadow appears
- Active: Inset shadow effect (pressed into wood)
- Use: Standard game menu buttons

**Stone Button (Secondary)**
- Background: Stone texture (#888888 base)
- Border: 2px darker stone (#555555)
- Text: Press Start 2P 10px, white
- Use: Mining, construction, harder actions

**Icon Button (Compact)**
- Size: 32x32px or 48x48px
- Border: 2px pixel frame
- Icon: Simple pixel art (tools, items, navigation arrows)
- Hover: Golden highlight (#ffd700) border glow
- Use: Quick actions, toolbar, inventory

### Cards & Containers

**Menu Panel (Parchment Style)**
- Background: Parchment (#fff8dc) with subtle paper texture
- Border: 4px wooden frame (#5d4037 outer, #8b5a2b inner)
- Shadow: None (pixel art uses border contrast, not shadows)
- Radius: 0px (sharp pixel corners for authenticity)
- Interior padding: 16px

**Inventory Slot**
- Size: 48x48px
- Border: 2px dark stone (#555555)
- Background: Semi-transparent black for empty slots
- Hover: Golden border (#ffd700)
- Selected: Pulsing golden glow animation

**Dialogue Box**
- Background: Parchment with wooden frame
- Character portrait: 64x64px pixel art on left
- Text area: Right side, Lora 16px body text
- Name tag: Press Start 2P 10px above portrait
- Tail: Small triangle pointing to speaker (optional)

### Badges & Tags

**Day Counter**
- Background: Dark brown (#5d4037)
- Text: Press Start 2P 10px, white
- Border: 2px black
- Use: Season/day display in HUD

**Heart (Health/Love)**
- Size: 16x16px or 32x32px
- Style: Pixel art heart sprite
- Colors: Red (full), pink (half), empty (gray outline)
- Use: Health, friendship meters, favorites

**Season Badge**
- Background: Color matches season
  - Spring: #87ceeb (Soft Sky)
  - Summer: #f4d03f (Golden Wheat)
  - Fall: #e67e22 (Burnt Orange)
  - Winter: #aed6f1 (Ice Blue)
- Text: White, Press Start 2P 8px
- Border: 2px dark border

### Inputs & Forms

**Text Input Field**
- Background: Parchment (#fff8dc)
- Border: 2px dark stone (#555555)
- Cursor: Blinking pixel cursor (animated)
- Text: Lora 16px, dark color
- Focus: Golden border (#ffd700)
- Use: Name entry, chat, search

### Navigation

**Menu Bar (Top HUD)**
- Background: Semi-transparent dark brown
- Position: Top of screen, full width
- Items: Icon + pixel text for stats (money, day, season)
- Style: Sits on top of game content

**Tab Navigation**
- Style: Horizontal tab bar with wooden frame
- Active tab: Elevated appearance, brighter
- Inactive: Slightly darker, recessed
- Use: Crafting menu, social menu, inventory

### Decorative Elements

**Wooden Sign**
- Background: Wood texture with grain
- Border: Dark brown pixel frame
- Text: Hand-painted style (slightly imperfect alignment)
- Nails/rivets: 4 small circles in corners
- Use: Location markers, shop names, quest hints

**Pixel Border Tiles**
- Corner pieces: 8x8px ornate corners
- Edge pieces: Tileable 8px wide segments
- Style: Wooden, stone, or magical based on context
- Use: Frame any panel or menu

**Seasonal Decorations**
- Spring: Flower petals, pastel colors, butterflies
- Summer: Sun rays, warm glow, beach elements
- Fall: Falling leaves, orange/red palette, harvest items
- Winter: Snowflakes, warm window glow, evergreens

## 5. Layout Principles

### Spacing System
- Base unit: 8px (pixel grid alignment)
- Scale: 8px, 16px, 24px, 32px, 48px, 64px
- UI padding: 8px, 16px, 24px standard
- Menu margins: 16px from frame edges
- Grid-based inventory: 48px slots on 4px padding

### Grid & Container
- **Inventory Grid**: 10 columns x 6 rows (60 slots), 48px per slot
- **Menu Panels**: Centered, max-width 640px for comfortable reading
- **Dialogue Width**: 480px max for readability
- **UI Scaling**: 1x (base), 2x (enhanced), 3x (4K displays)

### Whitespace Philosophy
- **Intentional emptiness**: Pixel art UI embraces "empty" dark slots -- they're meaningful
- **Breathing room in text**: Journal entries need 1.6 line-height for readability
- **Frame separation**: Clear boundaries between UI and game world
- **Layered menus**: Semi-transparent backgrounds let game world show through

### Border Radius Scale
- **Zero radius**: All UI elements use sharp 90-degree corners (pixel-perfect authenticity)
- **Exception**: Rare rounded elements use 4px radius (small stones, river tiles)

### Visual Rhythm
- **HUD**: Persistent top bar, always visible, semi-transparent
- **Menus**: Center-screen modals that pause game time
- **Dialogue**: Bottom third of screen, character + text format
- **Notifications**: Top-right toast messages, auto-dismiss

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Background | Game world visible | Overworld, farm view |
| Overlay | Semi-transparent panels | Menus, dialogue backdrop |
| HUD | Fixed position UI | Health, money, time display |
| Modal | Full panel with frame | Inventory, shop, crafting |
| Notification | Toast popup | Achievements, notifications |
| Cursor | Topmost layer | Mouse/touch interaction |

**Depth Philosophy**: Pixel art doesn't use traditional shadows for depth. Instead:
- **Border contrast**: Darker border = closer/elevated
- **Brightness**: Lighter elements feel closer to camera
- **Size**: Larger elements can feel closer (perspective)
- **Layer order**: Clear z-index layering for UI elements

### Pixel-Perfect Borders
- 2px dark border creates "raised" effect
- 2px light border inside creates "beveled" look
- No gradients, no blur -- pure color blocks

## 7. Do's and Don'ts

### Do
- Use pixel-perfect borders with sharp corners (0px radius)
- Align all UI elements to 8px grid
- Use Press Start 2P or similar pixel font for game UI
- Use Lora serif for longer text (journals, letters, dialogue)
- Include pixel art icons for items and actions
- Warm earth tones: browns, greens, golden yellows
- Wood grain textures for frames and panels
- Pixel heart icons for health and friendship
- Animated elements: idle bobbing, gentle pulsing

### Don't
- Don't use gradients on UI elements (flat colors only)
- Don't use rounded corners on pixel UI (90-degree only)
- Don't use thin or modern sans-serif fonts for game UI
- Don't use blue-heavy palettes (save blue for water/sky accents)
- Don't create shadows with blur (use solid color borders)
- Don't overcrowd UI -- pixel art favors simplicity
- Don't use photographic images in UI frames (pixel art only)
- Don't mix pixel and smooth fonts in same UI element

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Touch-optimized larger buttons, simplified menus |
| Tablet | 640-1024px | Full inventory grid, touch-friendly spacing |
| Desktop | 1024-1920px | Complete UI, keyboard/mouse optimization |
| Large | >1920px | UI scaling options (1x, 2x, 3x) |

### Touch Targets
- Minimum 48x48px for inventory slots
- Menu buttons: 44px minimum height
- Adequate spacing between clickable elements

### Collapsing Strategy
- Inventory: Scrollable grid with page indicators
- Crafting categories: Tab-based navigation
- Dialogue: Auto-scroll with skip option
- Menus: Stack vertically on narrow screens

### Image Behavior
- **Pixel art scaling**: Nearest-neighbor interpolation (no smoothing)
- **UI frames**: Tile-based for clean scaling
- **Backgrounds**: Parallax layers for game world depth
- **High DPI**: 4x pixel art for retina displays (preserves crispness)

## 9. Agent Prompt Guide

### Quick Color Reference
- UI Frame: Rich Soil Brown (`#5d4037`)
- Wood Panels: Warm Wood (`#8b5a2b`)
- Highlights: Golden Wheat (`#f4d03f`)
- Nature: Leaf Green (`#6aaa64`)
- Sky/Water: Soft Sky (`#87ceeb`)
- Text: Charcoal (`#2c2c2c`)
- Menu BG: Parchment (`#fff8dc`)
- Disabled: Stone Gray (`#888888`)

### Example Component Prompts

**Main Menu**
"Create a game main menu with pixel art aesthetic. Wooden frame border (#5d4037, #8b5a2b). Title in Press Start 2P font (24px, golden wheat color). Menu options as pixel-styled buttons with hover glow. Parchment background with subtle texture. Farm scene silhouette in background."

**Inventory Panel**
"Build an inventory panel: wooden frame with dark border. 10x6 grid of 48px slots with stone gray borders. Empty slots show dark background. Hover state: golden border highlight. Top shows character name in pixel font. Bottom has tabs for different categories (tools, items, equipment)."

**Dialogue Box**
"Design a dialogue box: parchment background, wooden frame. Left side: 64x64 pixel art character portrait with name tag above. Right side: dialogue text in Lora 16px. Dark charcoal text color. Bottom has small down arrow indicating more text."

**Health/Friendship Bar**
"Create a stat display with pixel hearts. Full hearts in red (#c41e3a pixel red), empty hearts as gray outlines. Press Start 2P font for numbers. Wooden frame around the meter. Smooth fill animation when value changes."

**Day/Season Counter**
"Build a HUD element showing current day and season. Wooden badge style. Season name in pixel font with colored background (spring=sky blue, summer=wheat gold, fall=orange, winter=ice blue). Day number below in smaller pixel text."

**Shop Interface**
"Design a shop panel: wooden sign header with shop name. Item slots with price tag on each. Golden wheat color for coin icon. Buy/Sell buttons styled as stone or wood. Inventory on right side for selecting items to sell."

### Iteration Guide
1. Use Press Start 2P pixel font for all game UI text
2. All corners are sharp 90-degrees -- no rounded corners on pixel UI
3. Colors are warm earth tones: browns, greens, golden yellows
4. Borders use solid colors with pixel-perfect 2px or 4px widths
5. No shadows with blur -- use border contrast for depth
6. Wood grain textures for frames, parchment for text areas
7. Pixel art icons for items, tools, and navigation
8. Heart icons for health and friendship meters
9. Scale UI elements to 8px grid for pixel-perfect alignment
10. Animations are subtle: bobbing, pulsing, gentle particle effects