# 🛠️ Project Status Dashboard

**Last Updated:** Dec 15, 2025
**Current Focus:** Polishing Goal Architect UI & Logic

---

## 🚦 Application Overview

| Tool Name | Status | Type | Storage |
| :--- | :---: | :--- | :--- |
| **Process Hub** | 🟢 Beta | Mental Tools | Local Storage |
| **Goal Architect** | 🟡 In Dev | Dashboard System | Local Storage |
| **Mental Bank** | 🟢 Stable | Ledger | Supabase (Cloud) |

---

## 📝 Recent Accomplishments (Dec 15)

### 1. Goal Architect (Logic Overhaul)
* [x] **Streamlined Wizard:** Removed "Goal Setting 101" and "3 Sub-goals" steps for faster entry.
* [x] **Smart Dashboard:** Added logic to scan for due dates and trigger a "Check-In" modal.
* [x] **Education Mode:** Moved the tutorial to a "Refresher" button on the dashboard instead of forcing it on every new goal.
* [x] **Navigation Fixes:** Rewired the "Next/Back" buttons to handle the new streamlined flow.

### 2. UI Updates
* [x] **Dashboard Header:** Centered layout with a clear call-to-action for education.
* [x] **Button Styling:** Standardized button classes (`btn-primary`) across the wizard (work in progress).

---

## 🚀 Next Up: The "Goal vs. Action" Refactor

We identified a critical UX improvement: Distinguishing the **Destination** from the **Steps**.

1.  **UI Separation:**
    * **Goal:** The persistent container (e.g., "Run a Marathon").
    * **Action:** The disposable task (e.g., "Buy Shoes") that lives inside the card.
2.  **The Loop:**
    * Checking off an Action should **not** close the Goal.
    * It should trigger a prompt: *"What is the immediate next step?"*
3.  **Visual Fixes:** Ensure all buttons on the "Starting Point" and "Make it Real" pages are rendering correctly.

---

## 🐛 Known Issues
* **Button Styles:** Some buttons on the Wizard pages are reverting to default grey boxes (HTML structure needs closing tags verified).
* **Navigation Leaks:** Buttons from one step occasionally appear on another (likely `</div>` mismatch in `index.html`).

---

## 📋 Future Roadmap
* **Goal Pyramid:** Adding "Identity/Values" (Superordinate Goals) to the dashboard.
* **Supabase Migration:** Eventually moving Goal data to the cloud for cross-device syncing.
* **Ask Processes (Batch 3):** Evaluating Dreams, Book of Positive Aspects.
