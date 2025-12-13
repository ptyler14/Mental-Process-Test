# 🛠️ Project Status Dashboard

**Last Updated:** Dec 12, 2025
**Current Focus:** Polishing SMART Goals and planning the Habit Tracker.

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
| **SMART Goals** | 🟢 Beta | Goal Wizard | Local Storage |

---

## 📝 Detailed Status & Wishlist

### 1. The Mental Bank
**Current State:** Fully functional. Calculates "Fantasy Value" and saves to Supabase.
* [x] Basic Input Fields
* [x] Math Logic & RLS Security

**Wishlist:**
* [ ] **Integration:** Link completed SMART Goal actions here as "Value Events".
* [ ] **Visuals:** Add a graph to show "Value Value" growth.

### 2. The Placemat
**Current State:** Functional. Tasks persist in browser memory.
* [x] "Me" vs. "Universe" columns

### 3. Segment Intending
**Current State:** Basic card exists.
* [x] Basic Input

**Wishlist:**
* [ ] Add a timer for segments.

### 4. Focus Wheel
**Current State:** Visuals fixed. Text aligns at 3 o'clock and rotates correctly.
* [x] 12-spoke wheel logic
* [x] "Spinning" animation

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

**Wishlist:**
* [ ] **Visuals:** Add a "Wheel of Life" radar chart at the end.
* [ ] **Admin:** Connect to Supabase to let Admin view client answers.

### 7. SMART Goals (Goal Architect)
**Current State:** "Therapeutic" Flow (matches Google Doc).
* [x] **Education:** Intro screen with placeholder for video.
* [x] **Flow:** Draft -> Confidence -> Breakdown -> Obstacles -> Resources.
* [x] **Calendar:** Google/Apple Calendar integration for the "First Action".
* [x] **UX:** Custom "Hour : Min : AM/PM" dropdowns implemented.

**Wishlist:**
* [ ] **Content:** Add the real infographic/video to Step 1.
* [ ] **Accountability:** Option to email the goal summary to a friend.

---

## 🚀 Future Feature: Habit Tracker & Automation
**Concept:** A dashboard to track daily habits and integrate with iPhone Health data.

**Technical Plan:**
1.  **Database:** Create `habit_logs` table in Supabase.
2.  **Web Interface:** A visual "Streak Counter" or Calendar view on the dashboard.
3.  **Automation (Apple Shortcuts):**
    * Create an iOS Shortcut that triggers "When Workout Ends".
    * Shortcut sends a Webhook (POST request) to our Supabase database.
    * **Action:** Log the workout automatically.
    * **Action:** Send a text/notification to the user (Positive Reinforcement).

---

## 🐛 Tech Debt / Maintenance
* **Supabase:** RLS enabled on `goals` table (Security fix applied).
* **Mobile:** Need to test "Focus Wheel" and "Simpson Protocol" buttons on iPhone screens.
