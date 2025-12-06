// --- CONFIGURATION ---
// Note: 'text' is what the robot says OR what the partner reads
const SESSION_SCRIPT = {
    start: {
        text: "Welcome. Take a deep breath and close your eyes. We are beginning the induction.",
        next: "check_ready"
    },
    check_ready: {
        type: "question",
        text: "Are you ready to allow your mind to go as deep as needed? Signal Yes.",
        yes: "induction_deepener",
        no: "start"
    },
    induction_deepener: {
        text: "Relaxing your eyelids... Going deeper... 10... 9... 8... deeper and deeper.",
        next: "establish_communication"
    },
    establish_communication: {
        type: "question",
        text: "Superconscious, are you present? Signal Yes.",
        yes: "suds_check",
        no: "induction_deepener"
    },
    suds_check: {
        type: "speech", // In partner mode, this means Partner types the number
        text: "On a scale of minus ten to plus ten, how does this issue feel right now? Speak the number.",
        next: "process_suds" // In this demo, logic happens in handler
    },
    finish: {
        text: "Thank you. Integrating changes. Wide awake, fully refreshed.",
        next: null
    }
};

// --- STATE ---
let currentStep = "start";
let isPartnerMode = false;
let sessionActive = false;
let listenMode = 'idle';

const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false; 
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let userKeys = JSON.parse(localStorage.getItem('sp_keys')) || { yes: 'Space', no: null }; 
let isCalibrated = localStorage.getItem('sp_calibrated') === 'true';

// --- DOM ---
const get = (id) => document.getElementById(id);
const screens = {
    mode: get('mode-select-screen'),
    soloStart: get('solo-start-screen'),
    partnerStart: get('partner-start-screen'),
    confirm: get('confirm-keys-screen'),
    practice: get('practice-screen'),
    session: get('session-screen')
};
const views = {
    solo: get('solo-view'),
    partner: get('partner-view')
};

// --- INIT ---
get('mode-solo').addEventListener('click', () => {
    isPartnerMode = false;
    showScreen('soloStart');
});

get('mode-partner').addEventListener('click', () => {
    isPartnerMode = true;
    showScreen('partnerStart');
});

get('solo-begin-btn').addEventListener('click', checkHistory);
get('partner-begin-btn').addEventListener('click', startPartnerSession);

// Keys Flow Listeners
get('keep-keys-btn').addEventListener('click', startPracticeMode);
get('change-keys-btn').addEventListener('click', startCalibration);

// --- PARTNER MODE LOGIC ---
function startPartnerSession() {
    showScreen('session');
    views.solo.classList.add('hidden');
    views.partner.classList.remove('hidden');
    
    // Attach Partner Controls
    get('partner-next-btn').addEventListener('click', () => {
        const step = SESSION_SCRIPT[currentStep];
        if (step.next) runStep(step.next);
    });
    
    // Yes/No/Suds handlers attached dynamically in runStep
    
    runStep('start');
}

// --- SOLO FLOW LOGIC ---
function checkHistory() {
    if (localStorage.getItem('sp_keys')) {
        userKeys = JSON.parse(localStorage.getItem('sp_keys'));
        get('saved-yes-key').textContent = userKeys.yes;
        get('saved-no-key').textContent = userKeys.no;
        showScreen('confirm');
    } else {
        startCalibration();
    }
}
// ... (Calibration and Practice functions same as before) ...
// For brevity, I'm focusing on the runStep changes. 
// Assume startCalibration and startPracticeMode are here as defined previously.

// --- SHARED SESSION ENGINE ---

async function runStep(stepId) {
    const stepData = SESSION_SCRIPT[stepId];
    if (!stepData) return endSession();

    currentStep = stepId;
    
    if (isPartnerMode) {
        // --- PARTNER MODE ---
        // 1. Show Script
        get('partner-script-text').textContent = stepData.text;
        
        // 2. Show Controls based on Type
        const controls = get('partner-controls');
        const nextBtn = get('partner-next-btn');
        const yesBtn = get('partner-yes-btn');
        const noBtn = get('partner-no-btn');
        const sudsBox = get('partner-suds-input');
        
        controls.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        yesBtn.classList.add('hidden');
        noBtn.classList.add('hidden');
        sudsBox.classList.add('hidden');

        if (stepData.type === "question") {
            yesBtn.classList.remove('hidden');
            noBtn.classList.remove('hidden');
            
            // Clear old listeners (simple clone hack)
            const newYes = yesBtn.cloneNode(true);
            const newNo = noBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYes, yesBtn);
            noBtn.parentNode.replaceChild(newNo, noBtn);
            
            newYes.addEventListener('click', () => runStep(stepData.yes));
            newNo.addEventListener('click', () => runStep(stepData.no));
            
        } else if (stepData.type === "speech") {
            sudsBox.classList.remove('hidden');
            const submitSuds = get('partner-suds-btn');
            
            const newSubmit = submitSuds.cloneNode(true);
            submitSuds.parentNode.replaceChild(newSubmit, submitSuds);
            
            newSubmit.addEventListener('click', () => {
                const val = get('partner-suds-val').value;
                console.log("Partner recorded SUDs:", val);
                // In real app, save to DB
                // Logic jump to finish for demo
                runStep("finish"); 
            });
            
        } else {
            // Text only
            nextBtn.classList.remove('hidden');
        }

    } else {
        // --- SOLO MODE ---
        updateStatus("Speaking...");
        get('visual-indicator').className = "pulse-circle speaking";
        
        await speak(stepData.text);
        
        get('visual-indicator').className = "pulse-circle";

        if (stepData.type === "question") {
            updateStatus("Waiting for Signal...");
            waitForKeyResponse(stepData);
        } else if (stepData.type === "speech") {
            updateStatus("Listening...");
            get('visual-indicator').className = "pulse-circle listening";
            listenMode = 'suds'; // Start analyzing mic stream
        } else {
            if (stepData.next) setTimeout(() => runStep(stepData.next), 1000);
            else endSession();
        }
    }
}

// ... (Rest of existing helper functions: speak, waitForKeyResponse, etc.) ...
// Ensure you include the full file content when you implement.
