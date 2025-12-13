# 🛠️ Project Status Dashboard

**Last Updated:** Dec 13, 2025
**Current Focus:** Building the "Ask & It Is Given" Process Hub.

---

## 🚦 Application Overview

| Tool Name | Status | Type | Storage |
| :--- | :---: | :--- | :--- |
| **Process Hub** | 🟢 Live | Main Menu | Static |
| **#1 Rampage** | 🟢 Beta | Text Stream | Local |
| **#2 Magic Box** | 🟢 Beta | Visual List | Local |
| **#3 Workshop** | 🟢 Beta | Structured Form | Local |
| **#4 VR (Viz)** | 🟢 Beta | Timer/Prompt | Local |
| **#5 Prosperity** | 🟢 Beta | Interactive Game | Local |
| **#6 Meditation** | 🟢 Beta | Visual Breath | Local |
| **Mental Bank** | 🟢 Stable | Ledger | Supabase |

---

## 📝 "Ask & It Is Given" Progress

We are converting the 22 processes into a unified "Hub" (`ask-processes/`).

* [x] **Hub Structure:** `index.html` (Grid), `style.css` (Shared), `script.js` (Shared).
* [x] **Process #1 (Rampage):** Completed.
* [x] **Process #2 (Magic Box):** Completed.
* [x] **Process #3 (Creative Workshop):** Completed.
* [x] **Process #4 (Virtual Reality):** Completed (30s Timer).
* [x] **Process #5 (Prosperity Game):** Completed (Dashboard + Logic).
* [x] **Process #6 (Meditation):** Completed (Breathing Animation).
* [ ] **Process #7 (Evaluating Dreams):** *Next Up*
* [ ] **Process #8 (Book of Positive Aspects):** *Next Up*
* [ ] **Process #9 (Scripting):** *Next Up*
* [ ] **Process #16 (Placemat):** Existing tool, linked in Grid.
* [ ] **Process #17 (Focus Wheel):** Existing tool, linked in Grid.

---

## 🚀 Future Feature: Habit Tracker
**Concept:** A dashboard to track daily habits and integrate with iPhone Health data.
* **Status:** On Hold while finishing the "Ask Processes" library.

## 🐛 Tech Debt / Maintenance
* **Supabase:** `script.js` in the `ask-processes` folder needs to be connected to Supabase eventually so user data (like "Magic Box" items) persists across devices.
