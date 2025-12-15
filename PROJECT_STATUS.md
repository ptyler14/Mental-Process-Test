# 🛠️ Project Status Dashboard

**Last Updated:** Dec 14, 2025
**Current Focus:** expanding Goal Architect into a Dashboard System.

---

## 🚦 Application Overview

| Tool Name | Status | Type | Storage |
| :--- | :---: | :--- | :--- |
| **Process Hub** | 🟢 Beta | Mental Tools | Local Storage |
| **Goal Architect** | 🟡 In Dev | Dashboard System | Local Storage |
| **Mental Bank** | 🟢 Stable | Ledger | Supabase (Cloud) |
| **The Placemat** | 🟢 Stable | Task Manager | Local Storage |
| **Focus Wheel** | 🟢 Stable | Visual Shifting | Local Storage |

---

## 📝 Recent Accomplishments

### 1. Goal Architect (Major Update)
We shifted from a single-pass wizard to a **Dashboard System**.
* [x] **New Flow:** Home Page -> Dashboard -> Wizard -> Dashboard.
* [x] **Dynamic Dashboard:** Shows goals categorized by Life Area.
* [x] **Custom Categories:** Users can add their own areas (e.g., "Spirituality").
* [x] **Storage:** Supports saving multiple goals via LocalStorage.

### 2. Ask & It Is Given Processes
Batch 1 & 2 are complete with UX polish (Enter key, Edit/Delete buttons).
* [x] **#1 Rampage:** Text Stream with Edit/Delete.
* [x] **#2 Magic Box:** Visual List.
* [x] **#3 Workshop:** Structured Form.
* [x] **#4 VR (Viz):** Timer with Pause/Resume.
* [x] **#5 Prosperity:** Bank logic with Day Counter.
* [x] **#6 Meditation:** Breathing Animation.

---

## 🚀 Next Up: Goal Architect Features

We are building the "Hierarchy of Goals" features using Local Storage first (Option A).

1.  **The "Check-In" (Retrospective):**
    * Logic to check if a goal's `actionDate` has passed.
    * Modal to ask: "Did you do it?" + "What was the obstacle?"
2.  **The Goal Pyramid (Superordinate Goals):**
    * UI to capture "Identity/Values" (Why) before the "Action" (How).

---

## 📋 Future Batch: Ask Processes
* **#7 Evaluating Dreams:** Dream Logger.
* **#8 Book of Positive Aspects:** Digital Notebook.
* **#9 Scripting:** Creative Writing Interface.

---

## 🐛 Tech Debt / Maintenance
* **Supabase Migration:** Currently, the Dashboard and Ask Processes use `localStorage`. We will migrate them to Supabase later to enable cross-device syncing.
