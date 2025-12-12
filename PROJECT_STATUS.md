# 🛠️ Project Status Dashboard

**Last Updated:** Dec 12, 2025
**Current Focus:** Refining the "SMART Goal" UX and styling.

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
| **SMART Goals** | 🟡 Beta / Polish | Goal Wizard | Local Storage |

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
* [x] **Solo/Partner Modes:** Audio/Keyboard vs. Teleprompter/Mouse.
* [x] **Calibration:** Key setup and Mic test.
* [x] **SUDs:** Tap-to-count or Voice input.

**Wishlist:**
* [ ] **Audio:** Replace Robot voice with real recorded MP3s.
* [ ] **Logic:** Add branching paths based on specific answers.

### 6. Areas of Life
**Current State:** Multi-step assessment form.
* [x] 13 Life Areas with Sliders (0-10).
* [x] **UX Polish:** Sliders default to 0, Blue thumb style.
* [x] **Navigation:** Full "Back" support to review previous answers.

**Wishlist:**
* [ ] **Visuals:** Add a "Wheel of Life" radar chart at the end.
* [ ] **Admin:** Connect to Supabase to let Admin view client answers.

### 7. SMART Goals (Goal Architect)
**Current State:** Refactored "Therapeutic" Flow (matches Google Doc).
* [x] **Education:** Intro screen with placeholder for video.
* [x] **Logic:** Draft -> Confidence Check -> Deconstruction -> Breakdown -> Obstacles -> Resources.
* [x] **Calendar:** Integration added to "Breaking it Down" step.

**To-Do / Wishlist:**
* [ ] **UI Polish:** **Redesign the Date/Time Picker** (Current browser default is ugly/hard to use).
* [ ] **Content:** Add the real infographic/video to Step 1.
* [ ] **Accountability:** Option to email the goal summary to a friend.

---

## 🐛 Tech Debt / Maintenance
* **Supabase:** RLS enabled on `goals` table (Security fix applied).
* **Mobile:** Need to test "Focus Wheel" and "Simpson Protocol" buttons on iPhone screens.
