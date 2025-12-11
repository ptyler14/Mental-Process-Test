# 🛠️ Project Status Dashboard

**Last Updated:** Dec 11, 2025
**Current Focus:** Polishing UI and adding functionality to "Areas of Life" and "Simpson Protocol".

---

## 🚦 Application Overview

| Tool Name | Status | Type | Storage |
| :--- | :---: | :--- | :--- |
| **Mental Bank** | 🟢 Stable | Ledger / Journal | Supabase (Cloud) |
| **The Placemat** | 🟢 Stable | Task Manager | Local Storage |
| **Segment Intending** | 🟡 Needs Review | Intention Setting | Local Storage |
| **Focus Wheel** | 🟢 Stable | Visual Shifting | Local Storage |
| **Simpson Protocol** | 🟡 Beta | Interactive Hypnosis | Local Storage |
| **Areas of Life** | 🟢 Stable | Assessment Form | Local Storage |

---

## 📝 Detailed Status & Wishlist

### 1. The Mental Bank
**Current State:** Fully functional. Calculates "Fantasy Value" and saves to Supabase database.
* [x] Basic Input Fields
* [x] Math Logic
* [x] Supabase Connection
* [x] Row Level Security (RLS)

**Wishlist / Future Features:**
* [ ] Add a graph to show "Value Value" growth over time.
* [ ] Add a calendar view of past entries.

### 2. The Placemat
**Current State:** Functional. Tasks persist in browser memory.
* [x] "Me" vs. "Universe" columns
* [x] Clear items button

**Wishlist / Future Features:**
* [ ] Add animation when the Universe "takes" a task.

### 3. Segment Intending
**Current State:** Basic card exists. Need to verify full functionality.
* [x] Basic Input

**Wishlist / Future Features:**
* [ ] Add a timer for segments.

### 4. Focus Wheel
**Current State:** Visuals fixed. Text now rotates and aligns correctly at 3 o'clock.
* [x] Central Desire input
* [x] 12-spoke wheel logic
* [x] "Spinning" animation on completion
* [x] CSS Text Alignment fix

**Wishlist / Future Features:**
* [ ] Save completed wheels to a gallery.

### 5. Simpson Protocol
**Current State:** Advanced Logic. Supports "Solo" (Audio/Keyboard) and "Partner" (Script reading) modes.
* [x] Audio/Script Engine
* [x] Keyboard Calibration (Yes/No)
* [x] Partner Mode (Teleprompter)
* [x] SUDs (0-10) via Voice (Solo) or Manual Input (Partner)

**Known Issues / To-Do:**
* [ ] **Review:** Ensure "Safe Mode" script is working correctly on all devices.
* [ ] **Content:** Replace Robot voice with real recorded MP3s.

**Wishlist / Future Features:**
* [ ] Add Branching Logic (if SUDs score goes up, do X; if down, do Y).

### 6. Areas of Life
**Current State:** Multi-step form with 13 sections.
* [x] Slider Inputs (0-10)
* [x] Navigation (Next/Back/Skip)
* [x] Resolution Screen
* [x] Local Storage Saving

**Wishlist / Future Features:**
* [ ] **Admin View:** Connect to Supabase so Admin can read client answers.
* [ ] **Visuals:** Create a "Wheel of Life" chart at the end showing the balance visually.

---

## 🐛 General Bugs / Tech Debt
* **Supabase RLS:** `goals` table needs RLS enabled (Fixed: Dec 11).
* **Mobile Responsiveness:** Need to test "Focus Wheel" on smaller iPhone screens.
