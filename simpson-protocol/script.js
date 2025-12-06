// --- CONFIGURATION ---
const SESSION_SCRIPT = {
    start: {
        text: "We are now beginning the main session. Close your eyes and take a deep breath.",
        next: "induction_1"
    },
    induction_1: {
        text: "Relaxing... deeper and deeper... 5... 4... 3... 2... 1...",
        next: "check_ready"
    },
    check_ready: {
        type: "question",
        text: "Are you ready to go deeper? Signal Yes.",
        yes: "suds_intro",
        no: "induction_1" // Loop back
    },
    suds_intro: {
        type: "speech",
        text: "On a scale of minus ten to plus ten, how do you feel? Speak the number.",
        next: "finish" // Shortcut for demo
    },
    finish: {
        text: "Thank you. You are now fully refreshed.",
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

// Default keys
let userKeys = { yes: 'Space', no: 'KeyN' }; 

// --- DOM ---
const get = (id) => document.getElementById(id);
const screens = {
    start: get('start-screen'),
    confirm: get('confirm-keys-screen'),
    practice: get('practice-screen')
};
const indicators = {
    visual: get('visual-indicator'),
    text: get('status-text'),
    log: get('feedback-log')
};

// --- INIT ---
get('begin-btn').addEventListener('click', checkHistory);
get('keep-keys-btn').addEventListener('click', startPracticeMode);
get('change-keys-btn').addEventListener('click', startCalibration);

// 1. Check if user has keys saved
function checkHistory() {
    showScreen('practice'); // Temp flash to init audio context if needed
    
    const savedKeys = localStorage.getItem('sp_keys');
    if (savedKeys) {
        userKeys = JSON.parse(savedKeys);
        get('saved-yes-key').textContent = userKeys.yes;
        get('saved-no-key').textContent = userKeys.no;
        showScreen('confirm');
    } else {
        startCalibration();
    }
}

// 2. Calibration (Pick Keys)
async function startCalibration() {
    showScreen('practice');
    updateStatus("Calibrating...");
    
    await speak("Please lie down. Press the key you want to use for YES.");
    userKeys.yes = await waitForAnyKey();
    log(`YES Key set to: ${userKeys.yes}`);
    playFeedback('success');
    
    await speak("Now, press the key you want to use for NO.");
    userKeys.no = await waitForAnyKey();
    log(`NO Key set to: ${userKeys.no}`);
    playFeedback('success');

    localStorage.setItem('sp_keys', JSON.stringify(userKeys));
    
    await speak("Keys saved.");
    startPracticeMode();
}

// 3. Practice Mode (The Exam)
async function startPracticeMode() {
    showScreen('practice');
    updateStatus("Practice Mode");
    
    await speak("We will now practice. Listen to my voice and signal accordingly.");
    
    // Practice Loop
    const tests = [
        { type: 'key', expected: 'yes', prompt: "Signal YES." },
        { type: 'key', expected: 'no', prompt: "Signal NO." },
        { type: 'key', expected: 'yes', prompt: "Signal YES again." },
        { type: 'voice', expected: 'any', prompt: "Now, say a number out loud, like 'Five' or 'Minus Two'." }
    ];

    for (let test of tests) {
        let passed = false;
        let attempts = 0;
        
        while (!passed && attempts < 2) {
            await speak(test.prompt);
            
            if (test.type === 'key') {
                updateStatus("Waiting for Key...");
                const code = await waitForAnyKey();
                
                if (code === userKeys[test.expected]) {
                    playFeedback('success');
                    log(`Correct (${test.expected.toUpperCase()})`);
                    passed = true;
                    await speak("Good.");
                } else {
                    playFeedback('error');
                    log("Incorrect Key");
                    await speak("That was the wrong key. Let's try again.");
                    attempts++;
                }
            } 
            else if (test.type === 'voice') {
                updateStatus("Listening...");
                // Mic Button handling for first interaction
                const micBtn = get('mic-activate-btn');
                if (attempts === 0) micBtn.classList.remove('hidden'); // Show only on first try if needed
                
                const result = await waitForVoice(micBtn);
                micBtn.classList.add('hidden');
                
                if (result) {
                    playFeedback('success');
                    log(`Heard: ${result}`);
                    await speak(`I heard you say ${result}.`);
                    passed = true;
                } else {
                    playFeedback('error');
                    await speak("I didn't hear anything. Please speak louder.");
                    attempts++;
                }
            }
        }

        if (!attempts < 2 && !passed) {
             await speak("Let's re-calibrate your keys.");
             return startCalibration();
        }
    }

    await speak("Practice complete. Starting main session now.");
    startMainSession();
}

// 4. Main Session
function startMainSession() {
    runStep('start');
}

async function runStep(stepId) {
    const step = SESSION_SCRIPT[stepId];
    if (!step) return;

    updateStatus("Session in Progress");
    indicators.visual.className = "pulse-circle speaking";
    await speak(step.text);
    indicators.visual.className = "pulse-circle";

    if (step.type === 'question') {
        const code = await waitForSpecificKey(); // Waits for Yes or No
        if (code === userKeys.yes) runStep(step.yes);
        else runStep(step.no);
    } else if (step.type === 'speech') {
        const result = await waitForVoice();
        // Here you would parse the number
        runStep(step.next);
    } else if (step.next) {
        setTimeout(() => runStep(step.next), 1000);
    }
}

// --- UTILS ---

function waitForAnyKey() {
    return new Promise(resolve => {
        const handler = (e) => {
            document.removeEventListener('keydown', handler);
            resolve(e.code);
        };
        document.addEventListener('keydown', handler);
    });
}

function waitForSpecificKey() {
    return new Promise(resolve => {
        const handler = (e) => {
            if (e.code === userKeys.yes || e.code === userKeys.no) {
                document.removeEventListener('keydown', handler);
                resolve(e.code);
            }
        };
        document.addEventListener('keydown', handler);
    });
}

function waitForVoice(btn) {
    return new Promise(resolve => {
        let started = false;
        
        recognition.onstart = () => { started = true; indicators.visual.className = "pulse-circle listening"; };
        
        recognition.onresult = (e) => {
            resolve(e.results[0][0].transcript);
        };
        
        recognition.onerror = () => resolve(null);
        recognition.onend = () => { if(!started) resolve(null); }; // Stopped without result

        if (btn) {
            btn.onclick = () => recognition.start();
        } else {
            try { recognition.start(); } catch(e) { resolve(null); }
        }
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

function playFeedback(type) {
    indicators.visual.className = type === 'success' ? "pulse-circle success" : "pulse-circle error";
    setTimeout(() => indicators.visual.className = "pulse-circle", 500);
}

function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[id].classList.remove('hidden');
}

function updateStatus(msg) { indicators.text.textContent = msg; }
function log(msg) { const p = document.createElement('p'); p.textContent = msg; indicators.log.appendChild(p); }
