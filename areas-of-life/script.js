// --- CONFIGURATION ---
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
// We initialize the results array with empty objects so we can save/overwrite by index
let results = new Array(AREAS.length).fill(null);

// --- DOM ---
const get = (id) => document.getElementById(id);
const screens = {
    intro: get('intro-view'),
    assessment: get('assessment-view'),
    resolution: get('resolution-view'),
    completion: get('completion-view')
};

const sliderSat = get('input-satisfaction');
const sliderImp = get('input-importance');
const sliderEff = get('input-effort');
const textReflect = get('input-reflection');

const valSat = get('val-satisfaction');
const valImp = get('val-importance');
const valEff = get('val-effort');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    get('start-btn').addEventListener('click', startAssessment);
    get('next-btn').addEventListener('click', () => saveAndMove(1)); // Forward
    get('skip-btn').addEventListener('click', () => saveAndMove(1, true)); // Skip Forward
    get('prev-btn').addEventListener('click', () => saveAndMove(-1)); // Backward
    get('finish-btn').addEventListener('click', finishAssessment);

    // Live update sliders
    const updateVal = (slider, display) => {
        slider.addEventListener('input', (e) => display.textContent = e.target.value);
    };
    updateVal(sliderSat, valSat);
    updateVal(sliderImp, valImp);
    updateVal(sliderEff, valEff);
});

// --- LOGIC ---

function startAssessment() {
    showScreen('assessment');
    get('progress-container').classList.remove('hidden');
    loadArea(0);
}

function loadArea(index) {
    // 1. Progress Bar
    const percent = ((index) / AREAS.length) * 100;
    get('progress-bar').style.width = `${percent}%`;

    // 2. Title
    get('area-title').textContent = AREAS[index];

    // 3. Button State
    // Hide 'Previous' if we are at the start
    if (index === 0) get('prev-btn').classList.add('hidden');
    else get('prev-btn').classList.remove('hidden');

    // 4. Load Existing Data (if we are going back) OR Reset
    const savedData = results[index];
    
    if (savedData && !savedData.skipped) {
        sliderSat.value = savedData.satisfaction; valSat.textContent = savedData.satisfaction;
        sliderImp.value = savedData.importance; valImp.textContent = savedData.importance;
        sliderEff.value = savedData.effort; valEff.textContent = savedData.effort;
        textReflect.value = savedData.reflection || "";
    } else {
        // Reset to default 5
        sliderSat.value = 5; valSat.textContent = '5';
        sliderImp.value = 5; valImp.textContent = '5';
        sliderEff.value = 5; valEff.textContent = '5';
        textReflect.value = '';
    }
    
    window.scrollTo(0, 0);
}

function saveAndMove(direction, isSkipped = false) {
    // 1. Save current inputs to the current index
    const currentData = {
        area: AREAS[currentAreaIndex],
        satisfaction: sliderSat.value,
        importance: sliderImp.value,
        effort: sliderEff.value,
        reflection: textReflect.value,
        skipped: isSkipped
    };
    
    results[currentAreaIndex] = currentData;

    // 2. Move Index
    currentAreaIndex += direction;

    // 3. Routing
    if (currentAreaIndex < 0) {
        currentAreaIndex = 0; // Safety clamp
    } 
    else if (currentAreaIndex < AREAS.length) {
        loadArea(currentAreaIndex);
    } 
    else {
        // Done with all areas
        showScreen('resolution');
        get('progress-container').classList.add('hidden');
    }
}

function finishAssessment() {
    const finalData = {
        assessments: results,
        resolution: {
            focusArea: get('res-focus').value,
            action: get('res-action').value,
            other: get('res-other').value
        },
        date: new Date().toISOString()
    };

    localStorage.setItem('areas_reflection_last', JSON.stringify(finalData));
    console.log("Saved:", finalData);
    showScreen('completion');
}

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}
