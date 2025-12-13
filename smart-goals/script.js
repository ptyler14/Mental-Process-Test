// --- STATE ---
// The list of screens in order
const steps = [
    'view-education', 
    'view-initial', 
    'view-smart-breakdown', 
    'view-rewrite',
    'view-breakdown', 
    'view-obstacles', 
    'view-resources', 
    'view-review'
];
let currentStepIndex = 0;

// --- DOM HELPER ---
const get = (id) => document.getElementById(id);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Listeners for the Confidence Sliders (to show the number as you drag)
    if(get('inp-conf-1')) {
        get('inp-conf-1').addEventListener('input', (e) => get('val-conf-1').textContent = e.target.value);
    }
    if(get('inp-conf-2')) {
        get('inp-conf-2').addEventListener('input', (e) => get('val-conf-2').textContent = e.target.value);
    }
});

// --- NAVIGATION ---
function startExercise() {
    get('progress-container').classList.remove('hidden');
    nextStep('view-initial');
}

function nextStep(targetId) {
    // Hide current step
    const currentId = steps[currentStepIndex];
    if (currentId && get(currentId)) get(currentId).classList.add('hidden');

    // Show next step
    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    
    // Update progress bar and text references
    updateProgress();
    updateReferences();
}

function prevStep(targetId) {
    // Hide current step
    const currentId = steps[currentStepIndex];
    if (currentId) get(currentId).classList.add('hidden');

    // Show previous step
    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    
    updateProgress();
}

function updateProgress() {
    // Calculate percentage (Education screen 0 doesn't count toward bar)
    const percent = (currentStepIndex / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

function updateReferences() {
    // 1. Update "My Goal" reference text on future pages
    const goal = get('inp-initial').value;
    const refs = document.querySelectorAll('.ref-goal');
    refs.forEach(el => el.textContent = goal || "your goal");

    // 2. Update S, M, T previews on the "Rewrite" page
    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- REVIEW GENERATION ---
function generateReview() {
    // 1. Output text answers to the final summary card
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    // 2. Prepare Data for Calendar
    const actionName = get('inp-this-week').value || "Work on Goal";
    const actionDate = get('action-date').value;
    let actionTime = null;

    // --- NEW TIME LOGIC ---
    // Read the three custom dropdowns
    const hr = get('time-hour').value;
    const min = get('time-min').value;
    const ampm = get('time-ampm').value;

    if (hr && min && ampm) {
        // Convert to 24-hour format (e.g., "14:30") for the system
        let hour24 = parseInt(hr);
        if (ampm === "PM" && hour24 < 12) hour24 += 12;
        if (ampm === "AM" && hour24 === 12) hour24 = 0;
        
        // Pad with zero (e.g., 9 -> 09)
        const hourStr = hour24.toString().padStart(2, '0');
        actionTime = `${hourStr}:${min}`;
    }
    // ----------------------

    // 3. Setup Buttons
    if (actionDate && actionTime) {
        setupCalendarButtons(actionName, actionDate, actionTime);
    } else {
        // Disable buttons if time is missing
        const btnGoogle = get('btn-google-cal');
        const btnApple = get('btn-apple-cal');
        
        btnGoogle.style.opacity = '0.5';
        btnGoogle.onclick = () => alert("Please set a date and time to use the calendar.");
        
        btnApple.style.opacity = '0.5';
        btnApple.onclick = () => alert("Please set a date and time to use the calendar.");
    }

    // 4. Save to local storage (optional backup)
    const data = {
        initial: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        thisWeek: get('inp-this-week').value,
        date: new Date().toISOString()
    };
    localStorage.setItem('smart_goal_exercise', JSON.stringify(data));

    // 5. Show Review Screen
    nextStep('view-review');
}

// --- CALENDAR LOGIC ---
function setupCalendarButtons(title, dateStr, timeStr) {
    // Create Date Objects
    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // Default 1 Hour

    // Helper to format date for Google (YYYYMMDDTHHMMSS)
    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    // 1. Google Calendar Link
    const gTitle = encodeURIComponent(`Goal Action: ${title}`);
    const gDates = `${formatGoogle(startDateTime)}/${formatGoogle(endDateTime)}`;
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}`;
    
    const btnGoogle = get('btn-google-cal');
    btnGoogle.onclick = () => window.open(googleUrl, '_blank');
    btnGoogle.style.opacity = '1';

    // 2. Apple/Outlook (.ics file)
    const btnApple = get('btn-apple-cal');
    btnApple.onclick = () => downloadICS(startDateTime, endDateTime, title);
    btnApple.style.opacity = '1';
}

function downloadICS(startDate, endDate, title) {
    // Helper to format date for ICS
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Goal Action: ${title}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'goal-action.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
