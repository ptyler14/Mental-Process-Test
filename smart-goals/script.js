// --- STATE ---
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
let dateTimePicker = null; // Store the picker instance

// --- DOM HELPER ---
const get = (id) => document.getElementById(id);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize the Beautiful Date/Time Picker
    if (get('action-datetime')) {
        dateTimePicker = flatpickr("#action-datetime", {
            enableTime: true,
            dateFormat: "F j, Y at h:i K", // e.g. "October 4, 2025 at 3:30 PM"
            minDate: "today",
            time_24hr: false
        });
    }

    // 2. Sliders
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
    const currentId = steps[currentStepIndex];
    if (currentId && get(currentId)) get(currentId).classList.add('hidden');

    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    
    updateProgress();
    updateReferences();
}

function prevStep(targetId) {
    const currentId = steps[currentStepIndex];
    if (currentId) get(currentId).classList.add('hidden');

    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    updateProgress();
}

function updateProgress() {
    const percent = (currentStepIndex / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

function updateReferences() {
    const goal = get('inp-initial').value;
    const refs = document.querySelectorAll('.ref-goal');
    refs.forEach(el => el.textContent = goal || "your goal");

    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- REVIEW GENERATION ---
function generateReview() {
    // 1. Output answers
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    // 2. Handle the Date/Time
    const actionName = get('inp-this-week').value || "Work on Goal";
    
    // We grab the "real" computer dates from our fancy picker
    // selectedDates is an array provided by Flatpickr
    if (dateTimePicker && dateTimePicker.selectedDates.length > 0) {
        const dateObj = dateTimePicker.selectedDates[0];
        setupCalendarButtons(actionName, dateObj);
    } else {
        // Disable buttons nicely
        const btnGoogle = get('btn-google-cal');
        const btnApple = get('btn-apple-cal');
        btnGoogle.style.opacity = '0.5';
        btnGoogle.onclick = () => alert("Please set a date and time first.");
        btnApple.style.opacity = '0.5';
        btnApple.onclick = () => alert("Please set a date and time first.");
    }

    // 3. Save Data
    const data = {
        initial: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        thisWeek: get('inp-this-week').value,
        date: new Date().toISOString()
    };
    localStorage.setItem('smart_goal_exercise', JSON.stringify(data));

    nextStep('view-review');
}

// --- CALENDAR LOGIC ---
function setupCalendarButtons(title, startDateObj) {
    // 1 Hour Duration
    const endDateTime = new Date(startDateObj.getTime() + (60 * 60 * 1000));

    // Helper for Google Format
    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    // Google Link
    const gTitle = encodeURIComponent(`Goal Action: ${title}`);
    const gDates = `${formatGoogle(startDateObj)}/${formatGoogle(endDateTime)}`;
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}&details=Reminder+set+from+Goal+Architect`;
    
    const btnGoogle = get('btn-google-cal');
    btnGoogle.onclick = () => window.open(googleUrl, '_blank');
    btnGoogle.style.opacity = '1';

    // Apple/Outlook Link
    const btnApple = get('btn-apple-cal');
    btnApple.onclick = () => downloadICS(startDateObj, endDateTime, title);
    btnApple.style.opacity = '1';
}

function downloadICS(startDate, endDate, title) {
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Goal Action: ${title}`,
        "DESCRIPTION:Reminder set from Goal Architect",
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
