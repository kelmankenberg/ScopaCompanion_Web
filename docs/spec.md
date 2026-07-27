# Specification & Architecture Document: Scopa Companion

**Project Name:** Scopa Companion  
**Goal:** A modern, mobile-first, highly aesthetic scorekeeper and game assistant for physical matches of the traditional Italian card game _Scopa_.

---

## 1. Overview & Objectives

Scopa Companion serves as a digital scoresheet and interactive game assistant for physical Scopa matches. It eliminates manual math mistakes—especially around complex rules like the **Primiera** (Prime) score—while delivering an immersive, premium user experience.

### Key Objectives

- **Zero-friction scoring:** Guided step-by-step wizard alongside quick manual entry override.
- **Slideout Rules Panel:** Built-in slideout drawer providing comprehensive official rules, scoring cheat sheets, Primiera lookup tables, and variant guides accessible anytime during gameplay.
- **Automated Primiera Calculation:** Interactive card selector per suit to auto-calculate Primiera scores and handle suit qualification rules automatically.
- **Multi-Player & Team Support:** Full 1v1 (head-to-head), 2v2 (teams), and 3-Player (cutthroat) support.
- **Support for Standard & Variant Rules:** Configurable target scores (11, 16, 21 pts) and toggles for popular variants (**Il Napola**, **Re Bello**).
- **Interactive Italian Card Aesthetic:** Rich green felt textures, gold foil accents, and authentic Napoletane/Piacentine suit iconography (Denari, Coppe, Spade, Bastoni).
- **Dealer Rotation Tracker:** Dynamic turn indicator showing who deals next every round.
- **Game Statistics & Match History:** Comprehensive post-game and round-by-round statistics (total Scopas, Primiera win rate, Settebello control).
- **Sound & Audio Effects:** Web Audio API synth sounds for tactile clicks, card dealing, Scopa sweeps, and victory fanfares.

---

## 2. Rule Specifications

### 2.1 Supported Game Formats

- **1v1 (Head-to-Head):** 2 players.
- **2v2 (Team Play):** 4 players divided into Team A and Team B.
- **3-Player (Cutthroat):** 3 independent players competing.

### 2.2 Target Winning Scores

- **11 Points:** Standard short game (Default).
- **16 Points:** Medium length game.
- **21 Points:** Traditional long match.
- **End Game Rule:** When a round finishes and one or more players/teams meet or exceed the target score, the highest score wins. In the event of a tie at or above the target score, additional rounds are played until a clear leader breaks the tie.

### 2.3 Round Scoring Breakdown

Every round evaluates 4 standard category points plus bonus points for Scopas and enabled variants:

| Category                      | Description & Logic                                                                  |   Default Points   |
| :---------------------------- | :----------------------------------------------------------------------------------- | :----------------: |
| **Carte** _(Cards)_           | Player/Team with $>20$ total captured cards (out of 40). Tied ($20–20$) = 0 pts.     |      **1 pt**      |
| **Denari** _(Coins)_          | Player/Team with $>5$ captured Coin cards (out of 10). Tied ($5–5$) = 0 pts.         |      **1 pt**      |
| **Settebello** _(7 of Coins)_ | Player/Team capturing the **7 of Coins** ($\mathbf{7 \diamondsuit}$).                |      **1 pt**      |
| **Primiera** _(Prime)_        | Player/Team with highest Primiera sum (highest scoring card in each of the 4 suits). |      **1 pt**      |
| **Scopa** _(Sweep)_           | Clearing the table on a turn (except the final trick of a round).                    | **1 pt per Scopa** |

#### Optional Variant Rules (Toggleable in Settings)

- **Il Napola (Napoleone):** Bonus points if a player captures Ace, 2, and 3 of Denari ($3$ pts). If they also captured 4 of Denari, it becomes $4$ pts, up to $7$ of Denari ($7$ pts max).
- **Re Bello (Beautiful King):** $1$ extra point awarded for capturing the King of Denari.

### 2.4 Primiera Point System & Qualification

Card weights for Primiera scoring:

- **7** = 21 pts
- **6** = 18 pts
- **Ace (A)** = 16 pts
- **5** = 15 pts
- **4** = 14 pts
- **3** = 13 pts
- **2** = 12 pts
- **Face Cards (Fante, Cavallo, Re)** = 10 pts each

> **Rule:** A player/team must have captured at least 1 card in **all 4 suits** (Coppe, Denari, Spade, Bastoni) to qualify for Primiera. If only one player/team satisfies all 4 suits, they win Primiera automatically regardless of total point values.

---

## 3. UI/UX Architecture & Feature Plan

### 3.1 Views & Screens

1. **Game Configuration / Setup:**
   - Mode selector (1v1, 2v2 Teams, 3-Player).
   - Target score selector (11, 16, 21, or Custom).
   - Rule Variant toggles (Napola, Re Bello).
   - Player/Team names and color badges.
   - Initial dealer selection (Random or Manual).
2. **Main Match Dashboard:**
   - Top Bar: Dealer indicator, target score badge, slideout "Rules" button, audio toggle.
   - Live Score Cards: Animated progress bar toward target score.
   - Action Hub: "Enter Round Results" (Primary CTA), "Quick Manual Score Override".
   - Round History Feed: Compact card list of each completed round with expand-to-inspect feature and undo option.
3. **Slideout Rules Drawer / Panel:**
   - Quick-access sidebar/drawer toggleable from top navigation bar at any time.
   - Tabbed sections:
     - **Quick Rules Summary & Objective**
     - **Standard Scoring Breakdown (Carte, Denari, Settebello, Primiera, Scopas)**
     - **Primiera Point Lookup Table & Qualification Rules**
     - **Variant Rules (Il Napola, Re Bello)**
     - **FAQ / Edge Cases (e.g. Tie-breaks, last trick sweeps)**
4. **Hybrid Round Entry Modal:**
   - **Wizard Tab (Guided):**
     - Step 1: Scopas count per player.
     - Step 2: Settebello card holder.
     - Step 3: Denari count (slider or quick counter, auto-detects majority).
     - Step 4: Total Cards count (slider or counter, auto-validates to 40 max).
     - Step 5: Primiera Interactive Card Picker (visual grid of cards per suit; auto-computes qualification and highest score).
     - Step 6 (If Napola enabled): Napola length selector.
     - Step 7 (If Re Bello enabled): Re Bello holder.
   - **Quick Override Tab:** Direct numeric inputs for total round points.
5. **Post-Game Stats & Victory Modal:**
   - Winner celebration with confetti and audio fanfare.
   - Key stats: Total Scopas swept, Primieras won, Settebellos captured, Denari control %.

---

## 4. Technical Architecture

- **Stack:** Vite + React + TypeScript + HTML5 Canvas / Audio API
- **Styling:** Custom CSS with CSS variables, Glassmorphism, animations, responsive grid/flexbox
- **Persistence:** `localStorage` state management for active game auto-save, game history logs, and user preferences.
- **Audio:** Web Audio API sound synthesizer (no external audio assets required, fast and lightweight).
