// --- DATA CONFIGURATION ---
const AREAS = [
    "Work, job, or career",
    "School or education",
    "Finances",
    "Physical environment (Home/Neighborhood)",
    "Recreation, Creativity, and Fun",
    "Physical health",
    "Mental health",
    "Self-development and personal growth",
    "Friends and social connection",
    "Intimate relationships & romance",
    "Sex life",
    "Family relationships",
    "Spirituality or Faith"
];

// --- STATE ---
let currentAreaIndex = 0;
let results = []; // Stores the user data

// --- DOM ELEMENTS ---
const get = (id) => document.getElementById(id);
const screens = {
    intro: get('intro-view'),
    assessment: get('assessment-view'),
    resolution: get('resolution-view'),
    completion: get('completion-view')
};

// Inputs
const sliderSat = get('input-satisfaction');
const sliderImp = get('input-importance');
const sliderEff = get('input-effort');
const textReflect = get('input-reflection');

// Value Displays
const valSat = get('val-satisfaction');
const valImp = get('val-importance');
const valEff = get('val-effort');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    get('start-btn').addEventListener('click', startAssessment);
    get('next-btn').addEventListener('click', saveAndNext);
    get('skip-btn').addEventListener('click', skipAndNext);
    get('finish-btn').addEventListener('click', finishAssessment);

    // Attach slider listeners to update numbers in real-time
    sliderSat.addEventListener('input', (e) => valSat.textContent = e.target.value);
    sliderImp.addEventListener('input', (e) => valImp.textContent = e.target.value);
    sliderEff.addEventListener('input', (e) => valEff.textContent = e.target.value);
});

// --- NAVIGATION LOGIC ---

function startAssessment() {
    showScreen('assessment');
    get('progress-container').classList.remove('hidden');
    loadArea(0);
}

function loadArea(index) {
    // 1. Update Progress Bar
    const percent = ((index) / AREAS.length) * 100;
    get('progress-bar').style.width = `${percent}%`;

    // 2. Update Title
    get('area-title').textContent = AREAS[index];

    // 3. Reset Inputs to Default
    sliderSat.value = 5; valSat.textContent = '5';
    sliderImp.value = 5; valImp.textContent = '5';
    sliderEff.value = 5; valEff.textContent = '5';
    textReflect.value = '';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function saveAndNext() {
    // Save current data
    const areaData = {
        area: AREAS[currentAreaIndex],
        satisfaction: sliderSat.value,
        importance: sliderImp.value,
        effort: sliderEff.value,
        reflection: textReflect.value,
        skipped: false
    };
    results.push(areaData);
    advance();
}

function skipAndNext() {
    const areaData = {
        area: AREAS[currentAreaIndex],
        skipped: true
    };
    results.push(areaData);
    advance();
}

function advance() {
    currentAreaIndex++;
    if (currentAreaIndex < AREAS.length) {
        loadArea(currentAreaIndex);
    } else {
        showScreen('resolution');
        get('progress-container').classList.add('hidden');
    }
}

function finishAssessment() {
    // Capture resolution answers
    const finalData = {
        assessments: results,
        resolution: {
            focusArea: get('res-focus').value,
            action: get('res-action').value,
            other: get('res-other').value
        },
        date: new Date().toISOString()
    };

    // Save to LocalStorage (Or Supabase later if you want)
    localStorage.setItem('areas_reflection_last', JSON.stringify(finalData));
    
    // Optional: Console log to verify data structure
    console.log("Saved Data:", finalData);

    showScreen('completion');
}

// --- HELPER ---
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}
