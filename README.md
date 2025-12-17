# Mental-Process-Test
I am using this to practice creating a website that prompts a user to do different tasks. 
# My Wellness Tools (Life Hub)

**Description:** A comprehensive life-design platform ("My Life Hub") containing a suite of mental and productivity tools. It uses a "Hub & Spoke" architecture where a main landing page launches distinct micro-apps.

## Tech Stack
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (No frameworks).
* **Auth:** Supabase (Client-side integration).
* **Data:** LocalStorage (Primary) + Supabase (Auth).
* **Style:** Clean, card-based UI with CSS variables (`--primary: #2c3e50`, `--accent: #2980b9`).

## File Structure
* **`/index.html`**: Main Hub (Cards for Goals, Library, Mental Bank).
* **`/style.css`**: Global Styles (Variables, Cards, Modals, Auth).

### The Tool Suite (Sub-folders)
* **`smart-goals/`** (Goal Architect)
    * `dashboard.html`: Main Dashboard (Grid View, Tasks, Calendar Links).
    * `wizard.html`: S.M.A.R.T. Goal Creation Wizard.
* **`library/`** (The Wisdom Vault)
    * `index.html`: Reader Interface.
    * `books.js`: Content Data (e.g., The Secret, Atomic Habits).
* **`mental-bank/`**: Ledger for subconscious reprogramming.
* **`placemat/`**: Task delegation process ("Me" vs "Universe").
* **`segment-intending/`**: Intention setting tool.
* **`focus-wheel/`**: Vibrational shifting tool.
* **`simpson-protocol/`**: Holistic hypnosis session.
* **`areas-of-life/`**: 13-domain assessment.
* **`ask-processes/`**: Abraham-Hicks process library.

## Key Integrations
1.  **Library ➡️ Goals:** The Library allows creation of "Action Items" from book chapters, which are pushed to `user_goals_db` in LocalStorage.
2.  **Auth:** The Home page handles Login/Signup via Supabase.

## Data Schema (LocalStorage)
* **`user_goals_db`**: Stores goals and task lists.
* **`user_categories_db`**: Stores custom dashboard categories.
