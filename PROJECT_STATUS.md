# 🛠️ Project Status Dashboard

**Last Updated:** Dec 11, 2025
**Current Focus:** Testing new "Goal Hierarchy" flow and finalizing "Areas of Life" navigation.

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
| **SMART Goals** | 🟡 Needs Testing | Goal Wizard | Local Storage |

---

## 📝 Detailed Status & Wishlist

### 1. The Mental Bank
**Current State:** Fully functional. Calculates "Fantasy Value" and saves to Supabase.
* [x] Basic Input Fields
* [x] Math Logic & RLS Security

**Wishlist:**
* [ ] Add a graph to show "Value Value" growth.
* [ ] Calendar view of past entries.
* [ ] **Integration:** Link completed SMART Goal actions here as "Value Events".

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
* [x] **UX Polish:** Sliders default to 0 (forcing choice), Blue thumb style.
* [x] **Navigation:** Full "Back" support to review previous answers.
* [x] Resolution/Reflection screen.

**Wishlist:**
* [ ] **Visuals:** Add a "Wheel of Life" radar chart at the end.
* [ ] **Admin:** Connect to Supabase to let Admin view client answers.

### 7. SMART Goals (Goal Architect)
**Current State:** **New "Hierarchy" Flow implemented but untested.**
* [x] **Flow:** Vision (Destination) -> Brainstorm Milestones -> Select Target -> SMART Refinement.
* [x] **Calendar:** Google/Apple Calendar integration for the "First Action".
* [ ] **TESTING:** Need to verify the new Vision/Milestone screens work correctly.

**Wishlist:**
* [ ] **Logic:** Ensure "Time-bound" deadline is distinct from "Action Date".
* [ ] **Accountability:** Email the goal to a friend.

---

## 🐛 Tech Debt / Maintenance
* **Supabase:** RLS enabled on `goals` table (Security fix applied).
* **Mobile:** Need to test "Focus Wheel" and "Simpson Protocol" buttons on iPhone screens.
