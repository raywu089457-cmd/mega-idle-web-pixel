# Game Concept: Idle Kingdom Builder

*Created: 2026-03-29*
*Status: Draft*

---

## Elevator Pitch

> It's an **idle kingdom-building game** where you manage a growing settlement, recruit and deploy heroes to explore an increasingly dangerous world, and turn raw materials into profit — all while wandering mercenaries automatically raid your surroundings, keeping your economy flowing even when you're away.

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Idle / Kingdom Builder / Hero Collector |
| **Platform** | PC (primary), Mobile (stretch goal) |
| **Target Audience** | Casual idle game fans, hero collector enthusiasts |
| **Player Count** | Single-player |
| **Session Length** | 10-30 min sessions, passive idle when away |
| **Monetization** | None yet (pre-production) |
| **Estimated Scope** | Small-Medium (3-6 months) |
| **Comparable Titles** | Adventure Capitalist (idle), Kingdom (medieval builder), Idle Heroes (hero collector) |

### Currency System

| Currency | Use Case | Acquisition |
| ---- | ---- | ---- |
| **Gold Coins** | Building construction, hero recruitment, shop upgrades | Shop sales to wandering heroes, map rewards |
| **Ancient Magic Stones** | Ancient Monument upgrades (premium) | Map exploration (random drop) |

**Ancient Magic Stone Collection Rates:**
- Territory Heroes: 100% contribution to kingdom treasury
- Wandering Heroes: 20% contribution (80% kept for personal use)

---

## Core Fantasy

**"You are the lord of a thriving frontier kingdom."**

Your ancient monument churns out raw materials while caravans of wandering mercenaries pass through, eager to buy weapons, armor, and potions. Your own hand-picked heroes venture into the wilds, pushing deeper into hostile territory to bring back upgrade materials — while hired mercenaries automatically patrol explored lands, generating income around the clock.

The fantasy is **quiet prosperity**: watching your kingdom grow from a single ancient monument into a bustling settlement, all on the back of systems that hum along whether you're watching or not.

---

## Unique Hook

**Your mercenaries do the exploring — but you decide where to send your heroes.**

Most idle builders are passive. Most hero collectors give you no real territory to manage. This game combines:
- **Idle income** from the Ancient Monument and auto-fighting wandering heroes
- **Active strategy** by choosing which maps to explore and which heroes to send
- **Kingdom building** as the meta-progression that unlocks more heroes, better shops, and harder challenges

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics (What the player FEELS)

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Sensation** (sensory pleasure) | 4 | Satisfying UI animations, coin clinks, shop purchases with visual feedback |
| **Fantasy** (make-believe, role-playing) | 6 | Medieval kingdom atmosphere, named heroes with stats, mysterious ancient monument |
| **Narrative** (drama, story arc) | 3 | Procedural hero backstories, guild任务 narrative hints, map lore fragments |
| **Challenge** (obstacle course, mastery) | 5 | Increasing map difficulty, hero progression min-maxing, resource optimization |
| **Fellowship** (social connection) | 2 | Hero relationships (hired heroes visit your tavern), guild tasks |
| **Discovery** (exploration, secrets) | 7 | Procedurally varied maps, rare material drops, hidden monument upgrade tiers |
| **Expression** (self-expression, creativity) | 4 | Building layout choices, hero team composition, resource allocation priorities |
| **Submission** (relaxation, comfort zone) | 8 | True idle gameplay, forgiving progression, no punishing failure states |

### Key Dynamics (Emergent player behaviors)

- Players will obsess over hero team composition vs. map difficulty matching
- Players will feel clever optimizing material-to-coin conversion rates
- Players will check back "just to see" what wandering heroes bought
- Players will push to "just one more map" to unlock the next upgrade tier

### Core Mechanics (Systems we build)

1. **Ancient Monument Production** — Passive timer-based resource generation (every 30-60 seconds)
2. **Hero Recruitment & Management** — Territory heroes (10 slots, expandable) vs. Wandering heroes (20 types, auto-team). Territory heroes can re-explore cleared maps for additional rewards.
3. **Shop System** — Buildings consume materials to produce items; wandering heroes auto-purchase items. Hero Training Ground allows upgrading hero stats (costs kingdom gold for territory heroes, personal gold for wandering heroes).
4. **Map Exploration** — Territory heroes deploy to maps; difficulty scaling per zone; material rewards. Maps randomly spawn: Elite Monsters, Normal Bosses, World Bosses (World Bosses requested via Guild tasks).
5. **Wandering Hero Auto-Combat** — Wandering heroes automatically fight explored周边 maps, generating passive income

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | Choosing which maps to explore, which heroes to deploy, how to prioritize building | Core |
| **Competence** | Optimizing production chains, matching hero power to map difficulty | Core |
| **Relatedness** | Collecting diverse heroes, watching wandering heroes return to buy gear | Supporting |

### Player Type Appeal (Bartle Taxonomy)

- [x] **Achievers** (goal completion, collection, progression) — Core: collect all 20 wandering hero types, max out territory heroes, push highest map
- [ ] **Explorers** (discovery, understanding systems, finding secrets) — Core: map variety, hidden upgrade paths, rare material drops
- [ ] **Socializers** (relationships, cooperation, community) — Supporting: hero visit flavor text, guild任务
- [ ] **Killers/Competitors** (domination, PvP, leaderboards) — Not a focus

### Flow State Design

- **Onboarding curve**: Tutorial walks player through monument → build first shop → see first wandering hero buy item → send first exploration team
- **Difficulty scaling**: Map zones increase linearly; hero power increases via equipment + upgrades
- **Feedback clarity**: Clear numbers: "+5 gold/sec from auto-combat", "+10 materials/min from monument"
- **Recovery from failure**: Exploration failure = heroes return to tavern to rest (no death, no penalty beyond lost time)

---

## Core Loop

### Moment-to-Moment (30 seconds)
Player opens game → glances at resource income → checks if any heroes need reassignment → closes. (Or stays to manually send heroes to new map.)

### Short-Term (5-15 minutes)
Player builds new shop → assigns territory hero to team → sends team to next map → watches result → collects materials → upgrades monument.

### Session-Level (30-120 minutes)
Full development sprint: optimize shop output, recruit new heroes, push through 2-3 new map zones, upgrade ancient monument, expand hero capacity with Castle.

### Long-Term Progression
- Monument upgrades (increase material output rate)
- Castle expansion (increase territory hero cap from 10 → 15 → 20...)
- Shop upgrades (higher-tier items unlock)
- Map progression (10+ zones, each harder with unique rewards)
- Hero collection (20 wandering hero types, each with unique stats)

### Retention Hooks
- **Curiosity**: "What does Zone 8 look like?" / "Will I get a rare material drop today?"
- **Investment**: Hero levels and monument upgrades feel permanent and meaningful
- **Mastery**: Perfecting the material-to-coin conversion chain

---

## Game Pillars

### Pillar 1: Always Something Happening
The kingdom never sleeps. Even when the player is away, wandering heroes fight and shop. When playing, there's always a shop producing, a hero resting, or a map to conquer.

*Design test*: If we're debating between a feature that requires player input vs. one that runs automatically — as long as both are fun, we choose the one that doesn't require attention.

### Pillar 2: Numbers Go Up
Progression feels good. Materials accumulate, heroes level, shops produce faster, maps unlock. Every action has a visible numerical reward.

*Design test*: If a feature doesn't create a sense of "I have more than before," we reconsider it.

### Pillar 3: Five-Minute Hero Fantasy
Every hero — territory or wandering — has a name, a class, and a reason to exist. Heroes aren't interchangeable; they have stats that matter.

*Design test*: If a hero choice doesn't change gameplay meaningfully, we simplify the system.

### Anti-Pillars (What This Game Is NOT)

- **NOT a hardcore roguelike**: No permadeath, no punishing failures, no pixel-perfect combat
- **NOT a gacha game**: No paid loot boxes, no energy systems blocking progress
- **NOT a story-driven RPG**: Narrative exists for flavor, not as a primary hook

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| Adventure Capitalist | Idle income scaling, simple loop | Add hero management + exploration | Validates idle loop sustainability |
| Kingdom (Noam Kroll) | Medieval kingdom atmosphere, 2D pixel art | Hero collectors, shop production chains | Validates aesthetic direction |
| Idle Heroes | Hero collection, auto-combat | Territory building, active map exploration | Validates hero collector hook |

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 18-45 |
| **Gaming experience** | Casual to Mid-core (familiar with idle games) |
| **Time availability** | 10-30 min sessions, happy to leave game running |
| **Platform preference** | PC (mouse-driven UI) |
| **Current games they play** | Idle games (Adventure Capitalist, Cookie Clicker), mobile hero collectors |
| **What they're looking for** | Relaxing progression, satisfying number growth, collection goals |
| **What would turn them away** | Complexity, punishing mechanics, pay-to-win gates |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | Godot 4.6 — native 2D, lightweight, GDScript for rapid iteration |
| **Key Technical Challenges** | Timer-based production systems, hero AI auto-combat state machine |
| **Art Style** | 2D pixel art, medieval fantasy palette (16-bit nostalgic) |
| **Art Pipeline Complexity** | Low-Medium (asset store + custom modifications) |
| **Audio Needs** | Minimal — ambient sounds, coin clinks, shop purchase chimes |
| **Networking** | None (single-player, local save) |
| **Content Volume** | 10 map zones, 5 building types, 20+ wandering hero types, 5 material types |
| **Procedural Systems** | Map generation per zone (static seeds), wandering hero stat variance |

---

## Risks and Open Questions

### Design Risks
- Core loop may feel thin if shop production isn't satisfying to watch
- Auto-combat for wandering heroes may feel too passive (no player agency)

### Technical Risks
- Timer drift when app is backgrounded on mobile (need to handle correctly)

### Market Risks
- Idle game genre is saturated; need strong visual identity to stand out

### Scope Risks
- 20 wandering hero types may be too many for MVP; consider 5-8 for v1

### Open Questions
- How exactly do shop items get consumed? (wandering heroes auto-buy randomly, or queue up?)
- Do territory heroes need equipment, or just levels?
- What does the Castle actually unlock? (More heroes, or faster recruitment?)

---

## MVP Definition

**Core hypothesis**: Players find the build → produce → sell → upgrade loop engaging for 30+ minute sessions, and auto-combat wandering heroes provide satisfying passive income.

**Required for MVP**:
1. Ancient Monument producing 5 material types on a timer
2. 3 building types (Tavern, Weapon Shop, Potion Shop)
3. 5 territory hero slots with basic stats
4. 5 wandering hero types with auto-combat on explored maps
5. 3 map zones with increasing difficulty
6. Hero Training Ground (Territory heroes cost kingdom gold, Wandering heroes cost personal gold)

**Explicitly NOT in MVP**:
- Castle expansion system
- Guild / Tasks system (including World Boss requests)
- Elite Monsters, Normal Bosses, World Bosses
- Material refinement chains (Tier 2 materials)

### Scope Tiers

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **MVP** | 3 zones, 3 shops, 5 heroes | Core idle loop + basic exploration | 6-8 weeks |
| **Vertical Slice** | 5 zones, all shops | Full shop system, hero levels | +4 weeks |
| **Alpha** | 8 zones, 15 wandering heroes | All core systems, UI polish | +4 weeks |
| **Full Vision** | 10 zones, 20 heroes, guild | All features, art pass, sound | +4 weeks |

---

## Next Steps

- [x] Game concept documented (this file)
- [ ] Get concept approval from creative-director
- [x] Technology stack populated in CLAUDE.md (`/setup-engine` completed)
- [ ] Create game pillars document (`/design-review` to validate)
- [ ] Decompose concept into systems (`/map-systems`)
- [ ] Create first architecture decision record (`/architecture-decision`)
- [ ] Prototype core loop (`/prototype idle-production`)
- [ ] Validate core loop with playtest (`/playtest-report`)
- [ ] Plan first milestone (`/sprint-plan new`)
