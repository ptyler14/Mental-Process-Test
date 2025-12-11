# 🛠️ Project Status Dashboard

**Last Updated:** Dec 11, 2025
**Current Focus:** Expanding toolset with Goal Setting and Reflection tools.

---

## 🚦 Application Overview

| Tool Name | Status | Type | Storage |
| :--- | :---: | :--- | :--- |
| **Mental Bank** | 🟢 Stable | Ledger / Journal | Supabase (Cloud) |
| **The Placemat** | 🟢 Stable | Task Manager | Local Storage |
| **Segment Intending** | 🟡 Needs Review | Intention Setting | Local Storage |
| **Focus Wheel** | 🟢 Stable | Visual Shifting | Local Storage |
| **Simpson Protocol** | 🟢 Stable | Interactive Hypnosis | Local Storage |
| **Areas of Life** | 🟢 Stable | Assessment Form | Local Storage |
| **SMART Goals** | 🟢 Stable | Goal Wizard | Local Storage |

---

## 📝 Detailed Status & Wishlist

### 1. The Mental Bank
**Current State:** Fully functional. Calculates "Fantasy Value" and saves to Supabase.
* [x] Basic Input Fields
* [x] Math Logic & RLS Security

**Wishlist:**
* [ ] Add a graph to show "Value Value" growth.
* [ ] Calendar view of past entries.

### 2. The Placemat
**Current State:** Functional. Tasks persist in browser memory.
* [x] "Me" vs. "Universe" columns

**Wishlist:**
* [ ] Animation when Universe "takes" a task.

### 3. Segment Intending
**Current State:** Basic card exists.
* [x] Basic Input

**Wishlist:**
* [ ] Add a timer for segments.

### 4. Focus Wheel
**Current State:** Visuals fixed. Text aligns at 3 o'clock and rotates correctly.
* [x] 12-spoke wheel logic
* [x] "Spinning" animation
* [x] Text alignment fixes

**Wishlist:**
* [ ] Save completed wheels to a gallery.

### 5. Simpson Protocol
**Current State:** Advanced logic with multiple modes.
* [x] **Solo Mode:** Audio prompts + Keyboard (Yes/No) + Voice (SUDs).
* [x] **Partner Mode:** Teleprompter for friend + Manual buttons.
* [x] **Calibration:** Key setup and Mic test.
* [x] **SUDs:** Tap-to-count or Voice input.

**Wishlist:**
* [ ] **Audio:** Replace Robot voice with real recorded MP3s.
* [ ] **Logic:** Add branching paths based on specific answers.

### 6. Areas of Life
**Current State:** Multi-step assessment form.
* [x] 13 Life Areas with Sliders (0-10).
* [x] Navigation (Next/Back/Skip).
* [x] Resolution/Reflection screen.

**Wishlist:**
* [ ] **Visuals:** Add a "Wheel of Life" radar chart at the end.
* [ ] **Admin:** Connect to Supabase to let Admin view client answers.

### 7. SMART Goals (Goal Architect)
**Current State:** Step-by-step Wizard.
* [x] Draft -> Refinement (S.M.A.R.T.) flow.
* [x] Obstacle planning.
* [x] "First Step" scheduling.
* [x] Calendar Integration (Google Link / Apple ICS download).

**Wishlist:**
* [ ] **Accountability:** Email the goal to a friend.
* [ ] **Long-term:** Better breakdown of Long-term vision into milestones.

---

## 🐛 Tech Debt / Maintenance
* **Supabase:** RLS enabled on `goals` table (Security fix applied).
* **Mobile:** Need to test "Focus Wheel" and "Simpson Protocol" buttons on iPhone screens.
