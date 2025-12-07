// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SCRIPT DATA ---
const SESSION_SCRIPT = {
    start: {
        text: "Session starting. Please close your eyes and take a deep breath.",
        next: "induction_1"
    },
    induction_1: {
        text: "Relaxing your eyelids... Going deeper... 5... 4... 3... 2... 1...",
        next: "check_ready"
    },
    check_ready: {
        type: "question",
        text: "Are you ready to allow your mind to go as deep as needed? Signal Yes.",
        yes: "suds_intro",
        no: "induction_1"
    },
    suds_intro: {
        type: "speech",
        text: "On a scale of minus ten to plus ten, how intense is the issue? Speak the number.",
        next: "finish"
    },
    finish: {
        text: "Thank you. Integrating changes. Wide awake, fully refreshed.",
        next: null
    }
};

// --- STATE ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false; 
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let userKeys = { yes: 'Space', no: 'KeyN' };
let currentStep = 'start';
let isPartnerMode = false;
let sessionActive = false;
let listenMode = 'idle'; // 'idle' or 'active'

// --- DOM ELEMENTS ---
const get = (id) => document.getElementById(id);
const screens = {
    mode: get('mode-select-screen'),
    soloStart: get('solo-start-screen'),
    partnerStart: get('partner-start-screen'),
    confirm: get('confirm-keys-screen'),
    practice: get('practice-screen'),
    session: get('session-screen')
};

// --- MIC KEEP-ALIVE ---
recognition.onend = () => {
    if (sessionActive) {
        try { recognition.start(); } catch(e) {}
    }
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    
    // Only process if we are actively waiting for voice input
    if (listenMode === 'active') {
        const score = parseSuds(transcript);
        if (score !== null) {
            handleVoiceSuccess(score);
        }
    }
    // If 'idle', we ignore background noise
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkUser();
    attachEventListeners();
});

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) window.location.href = "../index.html";
}

function attachEventListeners() {
    // Mode Selection
    if (get('mode-solo')) get('mode-solo').addEventListener('click', () => {
        isPartnerMode = false;
        showScreen('soloStart');
    });

    if (get('mode-partner')) get('mode-partner').addEventListener('click', () => {
        isPartnerMode = true;
        showScreen('partnerStart');
    });

    // Start Buttons (These are the critical "User Gestures")
    if (get('solo-begin-btn')) get('solo-begin-btn').addEventListener('click', () => {
        // KICKSTART MIC HERE
        startMicLoop();
        checkHistory();
    });
    
    if (get('partner-begin-btn')) get('partner-begin-btn').addEventListener('click', startPartnerSession);

    // Key Setup Flow
    if (get('keep-keys-btn')) get('keep-keys-btn').addEventListener('click', startPracticeMode);
    if (get('change-keys-btn')) get('change-keys-btn').addEventListener('click', startCalibration);
}

function startMicLoop() {
    sessionActive = true;
    try {
        recognition.start();
        console.log("Mic started");
    } catch(e) {
        console.log("Mic start error (might be already running)", e);
    }
}

// --- FLOW LOGIC ---

function showScreen(name) {
    Object.values(screens).forEach(s => { if(s) s.classList.add('hidden'); });
    if (screens[name]) screens[name].classList.remove('hidden');
}

function checkHistory() {
    const saved = localStorage.getItem('sp_keys');
    if (saved) {
        userKeys = JSON.parse(saved);
        if (get('saved-yes-key')) get('saved-yes-key').textContent = userKeys.yes;
        if (get('saved-no-key')) get('saved-no-key').textContent = userKeys.no;
        showScreen('confirm');
    } else {
        startCalibration();
    }
}

// --- PARTNER SESSION ---
function startPartnerSession() {
    showScreen('session');
    get('solo-view').classList.add('hidden');
    get('partner-view').classList.remove('hidden');
    runStep('start');
}

// --- SOLO SESSION / PRACTICE ---
async function startCalibration() {
    showScreen('practice');
    updateStatus("Calibrating...");
    
    await speak("Press the key you want for YES.");
    userKeys.yes = await waitForAnyKey();
    log(`YES: ${userKeys.yes}`);
    
    await speak("Press the key you want for NO.");
    userKeys.no = await waitForAnyKey();
    log(`NO: ${userKeys.no}`);

    localStorage.setItem('sp_keys', JSON.stringify(userKeys));
    startPracticeMode();
}

async function startPracticeMode() {
    showScreen('practice');
    updateStatus("Practice Mode");
    await speak("Let's practice. Signal YES.");
    
    let resp = await waitForKeyResponse();
    if (resp === 'yes') {
        playTone(440);
        await speak("Good. Now say 'Five'.");
    } else {
        playTone(200);
        await speak("That was No. Let's try voice.");
    }
    
    // Voice Test
    updateStatus("Listening...");
    listenMode = 'active'; // Enable processing
    
    // We wait for the global onresult to trigger success
    const voiceResult = await waitForVoiceResult();
    listenMode = 'idle';
    
    if (voiceResult) {
        await speak(`Heard ${voiceResult}. Starting session.`);
        startSoloSession();
    } else {
        await speak("I didn't hear you. Starting session anyway.");
        startSoloSession();
    }
}

function startSoloSession() {
    showScreen('session');
    get('solo-view').classList.remove('hidden');
    get('partner-view').classList.add('hidden');
    runStep('start');
}

// --- ENGINE ---

async function runStep(stepId) {
    const step = SESSION_SCRIPT[stepId];
    if (!step) {
        endSession();
        return;
    }

    currentStep = stepId;

    if (isPartnerMode) {
        // --- PARTNER MODE UI (Same as before) ---
        get('partner-script-text').textContent = step.text;
        const controls = get('partner-controls');
        const nextBtn = get('partner-next-btn');
        const yesBtn = get('partner-yes-btn');
        const noBtn = get('partner-no-btn');
        const sudsBox = get('partner-suds-wrapper');
        const sudsBtn = get('partner-suds-btn');

        controls.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        yesBtn.classList.add('hidden');
        noBtn.classList.add('hidden');
        sudsBox.classList.add('hidden');

        const replace = (el) => { const newEl = el.cloneNode(true); el.parentNode.replaceChild(newEl, el); return newEl; };

        if (step.type === 'question') {
            yesBtn.classList.remove('hidden');
            noBtn.classList.remove('hidden');
            const newYes = replace(yesBtn);
            const newNo = replace(noBtn);
            newYes.addEventListener('click', () => runStep(step.yes));
            newNo.addEventListener('click', () => runStep(step.no));
        } else if (step.type === 'speech') {
            sudsBox.classList.remove('hidden');
            const newSub = replace(sudsBtn);
            newSub.addEventListener('click', () => {
                const val = get('partner-suds-val').value;
                console.log("Partner entered:", val);
                if (step.next) runStep(step.next);
            });
        } else {
            nextBtn.classList.remove('hidden');
            const newNext = replace(nextBtn);
            newNext.addEventListener('click', () => { if (step.next) runStep(step.next); });
        }

    } else {
        // --- SOLO MODE UI ---
        updateStatus("Speaking...");
        const ind = get('session-indicator');
        if(ind) ind.className = "pulse-circle speaking";
        
        await speak(step.text);
        
        if(ind) ind.className = "pulse-circle";

        if (step.type === 'question') {
            updateStatus("Waiting for Signal...");
            const resp = await waitForKeyResponse();
            playTone(resp === 'yes' ? 440 : 330);
            if (resp === 'yes') runStep(step.yes);
            else runStep(step.no);
        } 
        else if (step.type === 'speech') {
            updateStatus("Listening...");
            if(ind) ind.className = "pulse-circle listening";
            
            listenMode = 'active'; // Turn on "hearing"
            
            // Wait for global handler to catch a number
            const num = await waitForVoiceResult();
            
            listenMode = 'idle'; // Turn off "hearing"
            
            if (num !== null) {
                speak(`Heard ${num}.`);
                if (step.next) runStep(step.next);
            } else {
                // Timeout or error
                speak("Moving on.");
                if (step.next) runStep(step.next);
            }
        } 
        else {
            if (step.next) setTimeout(() => runStep(step.next), 1000);
            else endSession();
        }
    }
}

// --- UTILS ---

function waitForVoiceResult() {
    return new Promise(resolve => {
        // Define a one-time success handler we can call from global scope
        window.handleVoiceSuccess = (score) => {
            window.handleVoiceSuccess = null; // Clear it
            resolve(score);
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (window.handleVoiceSuccess) {
                window.handleVoiceSuccess = null;
                resolve(null);
            }
        }, 10000);
    });
}

function waitForAnyKey() {
    return new Promise(resolve => {
        const handler = (e) => {
            document.removeEventListener('keydown', handler);
            resolve(e.code);
        };
        document.addEventListener('keydown', handler);
    });
}

function waitForKeyResponse() {
    return new Promise(resolve => {
        const handler = (e) => {
            if (e.code === userKeys.yes) {
                document.removeEventListener('keydown', handler);
                resolve('yes');
            } else if (e.code === userKeys.no) {
                document.removeEventListener('keydown', handler);
                resolve('no');
            }
        };
        document.addEventListener('keydown', handler);
    });
}

function speak(text) {
    return new Promise(resolve => {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9;
        u.onend = resolve;
        synth.speak(u);
    });
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playFeedback(type) {
    playTone(type === 'success' ? 440 : 200);
}

function updateStatus(msg) { 
    const el = get('status-text') || get('session-status');
    if(el) el.textContent = msg; 
}
function log(msg) { 
    const p = document.createElement('p'); p.textContent = msg; 
    const area = get('feedback-log');
    if(area) area.appendChild(p); 
}

function parseSuds(text) {
    if (!text) return null;
    const isNeg = text.includes('minus') || text.includes('negative');
    const nums = text.match(/\d+/);
    if(nums) return isNeg ? -parseInt(nums[0]) : parseInt(nums[0]);
    // Also check words
    const words = { "zero":0, "one":1, "two":2, "three":3, "four":4, "five":5, "six":6, "seven":7, "eight":8, "nine":9, "ten":10 };
    for (const [word, num] of Object.entries(words)) {
        if (text.includes(word)) return isNegative ? -num : num;
    }
    return null;
}

function endSession() {
    sessionActive = false;
    recognition.stop();
    updateStatus("Session Complete");
    if(get('session-indicator')) get('session-indicator').className = "pulse-circle";
    setTimeout(() => { window.location.href = "../index.html"; }, 3000);
}
