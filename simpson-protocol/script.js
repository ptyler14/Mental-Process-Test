// --- CONFIGURATION ---
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
        type: "speech",
        text: "On a scale of minus ten to plus ten, how does this issue feel right now? Speak the number.",
        next: "process_suds"
    },
    finish: {
        text: "Thank you. Integrating changes. Wide awake, fully refreshed.",
        next: null
    }
};

// --- STATE ---
let currentStep = "start";
let sessionActive = false;
let listenMode = 'idle'; // 'idle', 'suds', 'calibration'

// SPEECH SYNTHESIS
const synth = window.speechSynthesis;

// SPEECH RECOGNITION
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false; // We will manually restart it to keep it "continuous"
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let userKeys = JSON.parse(localStorage.getItem('sp_keys')) || { yes: 'Space', no: null }; 
let isCalibrated = localStorage.getItem('sp_calibrated') === 'true';

// --- DOM ELEMENTS ---
const startScreen = document.getElementById('start-screen');
const sessionScreen = document.getElementById('session-screen');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const visualIndicator = document.getElementById('visual-indicator');
const logArea = document.getElementById('feedback-log');

// --- MIC KEEP-ALIVE LOGIC ---
recognition.onend = () => {
    if (sessionActive) {
        // If session is running, restart mic immediately
        // (This creates the "Always On" effect)
        try {
            recognition.start();
        } catch(e) {
            // Ignore 'already started' errors
        }
    }
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    
    // Only process text if we are actively waiting for voice
    if (listenMode === 'suds') {
        handleSudsInput(transcript);
    } else if (listenMode === 'calibration') {
        handleCalibrationInput(transcript);
    }
    // If 'idle', we simply ignore what was said (e.g. background noise)
};

// --- INIT ---
startBtn.addEventListener('click', startFlow);

function startFlow() {
    startScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
    sessionActive = true;
    
    // START MIC ONCE HERE
    try {
        recognition.start();
    } catch(e) { console.log("Mic start error:", e); }

    if (!isCalibrated) {
        startCalibration();
    } else {
        runStep("start");
    }
}

// --- CALIBRATION ---
// We use a Promise resolver to pause script until input received
let voiceResolver = null; 

async function startCalibration() {
    updateStatus("Calibrating Keys...");
    visualIndicator.className = "pulse-circle";
    
    await speak("Please lie down. Tap the key for YES.");
    const yesKey = await waitForAnyKey();
    userKeys.yes = yesKey;
    log(`YES: ${yesKey}`);
    playFeedbackSound('yes');
    
    await speak("Now, tap the key for NO.");
    const noKey = await waitForAnyKey();
    userKeys.no = noKey;
    log(`NO: ${noKey}`);
    playFeedbackSound('no');
    
    await speak("Now, say the number 'Five' out loud.");
    visualIndicator.className = "pulse-circle listening";
    listenMode = 'calibration'; // Enable voice processing
    
    const heardText = await waitForVoicePromise();
    
    listenMode = 'idle'; // Disable voice processing
    visualIndicator.className = "pulse-circle";

    if (heardText) {
        await speak("Heard Five. Starting session.");
        localStorage.setItem('sp_keys', JSON.stringify(userKeys));
        localStorage.setItem('sp_calibrated', 'true');
        setTimeout(() => runStep("start"), 1000);
    } else {
        await speak("I couldn't hear you. We will proceed with keys only.");
        runStep("start");
    }
}

function handleCalibrationInput(text) {
    log(`Calibration Heard: "${text}"`);
    if (text.includes("five") || text.includes("5")) {
        if (voiceResolver) voiceResolver(true);
    }
}

function waitForVoicePromise() {
    return new Promise(resolve => {
        voiceResolver = resolve;
        // Timeout after 8 seconds if nothing heard
        setTimeout(() => {
            if (voiceResolver) resolve(false);
        }, 8000);
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

// --- SESSION ENGINE ---

async function runStep(stepId) {
    const stepData = SESSION_SCRIPT[stepId];
    if (!stepData) return endSession();

    currentStep = stepId;
    updateStatus("Speaking...");
    visualIndicator.className = "pulse-circle speaking";

    await speak(stepData.text);
    
    visualIndicator.className = "pulse-circle";

    if (stepData.type === "question") {
        updateStatus("Waiting for Signal...");
        waitForKeyResponse(stepData);
    } 
    else if (stepData.type === "speech") {
        updateStatus("Listening...");
        visualIndicator.className = "pulse-circle listening";
        listenMode = 'suds'; // Enable voice processing
        // We don't need to 'start' the mic, it's already running
        // We just wait for the onresult handler to trigger handleSudsInput
    } 
    else {
        if (stepData.next) {
            setTimeout(() => runStep(stepData.next), 1000);
        } else {
            endSession();
        }
    }
}

function handleSudsInput(transcript) {
    log(`Heard: "${transcript}"`);
    const score = parseSuds(transcript);
    
    if (score !== null) {
        listenMode = 'idle'; // Stop listening
        visualIndicator.className = "pulse-circle";
        log(`Recorded SUDs: ${score}`);
        speak(`I heard ${score}. Moving on.`);
        
        // Find next step from current step data
        const stepData = SESSION_SCRIPT[currentStep];
        if (stepData && stepData.next) {
            setTimeout(() => runStep(stepData.next), 2000);
        }
    } else {
        // If we heard something but couldn't parse a number, we ignore it 
        // and keep listening (or you could prompt "Say again")
    }
}

// --- INPUT HANDLERS ---

function waitForKeyResponse(stepData) {
    const handler = (e) => {
        document.removeEventListener('keydown', handler);
        if (e.code === userKeys.yes) {
            log("Response: YES");
            playFeedbackSound('yes');
            runStep(stepData.yes);
        } else {
            log("Response: NO");
            playFeedbackSound('no');
            runStep(stepData.no);
        }
    };
    document.addEventListener('keydown', handler);
}

// --- HELPERS ---

function parseSuds(text) {
    const isNegative = text.includes('minus') || text.includes('negative');
    const numbers = text.match(/\d+/);
    if (!numbers) {
        const words = { "zero":0, "one":1, "two":2, "three":3, "four":4, "five":5, "six":6, "seven":7, "eight":8, "nine":9, "ten":10 };
        for (const [word, num] of Object.entries(words)) {
            if (text.includes(word)) return isNegative ? -num : num;
        }
        return null;
    }
    const num = parseInt(numbers[0]);
    return isNegative ? -num : num;
}

function speak(text) {
    return new Promise((resolve) => {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; 
        utterance.onend = resolve;
        synth.speak(utterance);
    });
}

function playFeedbackSound(type) {
    // Beep logic
}

function updateStatus(msg) { statusText.textContent = msg; }
function log(msg) { const p = document.createElement('p'); p.textContent = msg; logArea.appendChild(p); }
function endSession() {
    sessionActive = false; // Stop the mic loop
    recognition.stop();
    updateStatus("Session Complete");
    visualIndicator.className = "pulse-circle";
    setTimeout(() => { window.location.href = "../index.html"; }, 3000);
}
