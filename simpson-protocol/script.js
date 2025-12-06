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
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// Improved Recognition Settings
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

// User Preferences (Loaded from storage or defaults)
let userKeys = JSON.parse(localStorage.getItem('sp_keys')) || { yes: 'Space', no: null }; // Default Yes is Space, No is any other
let isCalibrated = localStorage.getItem('sp_calibrated') === 'true';

// --- DOM ELEMENTS ---
const startScreen = document.getElementById('start-screen');
const sessionScreen = document.getElementById('session-screen');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const visualIndicator = document.getElementById('visual-indicator');
const logArea = document.getElementById('feedback-log');

// --- INIT ---
startBtn.addEventListener('click', startFlow);

function startFlow() {
    startScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
    
    if (!isCalibrated) {
        startCalibration();
    } else {
        runStep("start");
    }
}

// --- CALIBRATION ---

async function startCalibration() {
    updateStatus("Calibrating Keys...");
    visualIndicator.className = "pulse-circle";
    
    // Step 1: YES Key
    await speak("Please lie down comfortably. Place your hand on the keyboard. Tap the key you want to use for YES.");
    const yesKey = await waitForAnyKey();
    userKeys.yes = yesKey;
    log(`YES Key set to: ${yesKey}`);
    playFeedbackSound('yes');
    
    // Step 2: NO Key
    await speak("Good. Now, tap the key you want to use for NO.");
    const noKey = await waitForAnyKey();
    userKeys.no = noKey;
    log(`NO Key set to: ${noKey}`);
    playFeedbackSound('no');
    
    // Step 3: Voice Test
    await speak("Great. Now let's test your voice. Please say the number 'Five' out loud.");
    visualIndicator.className = "pulse-circle listening";
    const heardText = await waitForSpecificVoice("five");
    
    if (heardText) {
        await speak("I heard you say Five. Calibration complete.");
        isCalibrated = true;
        localStorage.setItem('sp_keys', JSON.stringify(userKeys));
        localStorage.setItem('sp_calibrated', 'true');
        
        setTimeout(() => runStep("start"), 1000);
    } else {
        await speak("I had trouble hearing you. Please ensure your microphone is allowed. Let's try the session anyway.");
        runStep("start");
    }
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

function waitForSpecificVoice(targetWord) {
    return new Promise(resolve => {
        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            log(`Calibration Heard: "${transcript}"`);
            if (transcript.includes(targetWord) || transcript.includes("5")) {
                resolve(true);
            } else {
                resolve(false); // Heard something else
            }
        };
        
        recognition.onerror = (e) => {
            console.error("Mic Error", e);
            resolve(false);
        };
        
        recognition.onend = () => {
            // If silence
             // resolve(false) handled by logic above usually
        };
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
        waitForVoiceResponse(stepData);
    } 
    else {
        if (stepData.next) {
            setTimeout(() => runStep(stepData.next), 1000);
        } else {
            endSession();
        }
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
        } else if (e.code === userKeys.no) {
            log("Response: NO");
            playFeedbackSound('no');
            runStep(stepData.no);
        } else {
            // If they pressed a random key that wasn't Yes or No
            // For now, treat as NO or ignore? Let's treat as NO for safety.
            log("Response: OTHER (Treated as NO)");
            playFeedbackSound('no');
            runStep(stepData.no);
        }
    };
    document.addEventListener('keydown', handler);
}

function waitForVoiceResponse(stepData) {
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        log(`Heard: "${transcript}"`);
        
        const score = parseSuds(transcript);
        
        if (score !== null) {
            log(`Recorded SUDs: ${score}`);
            speak(`I heard ${score}. Moving on.`);
            setTimeout(() => runStep("finish"), 2000); 
        } else {
            speak("I didn't catch that number. Please try again.");
            setTimeout(() => waitForVoiceResponse(stepData), 2000);
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Error", event.error);
        speak("I couldn't hear you. Please try again.");
        setTimeout(() => waitForVoiceResponse(stepData), 2000);
    };
}

// --- HELPERS --- (Same as before)

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
        // Stop any previous speech
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; 
        utterance.onend = resolve;
        synth.speak(utterance);
    });
}

function playFeedbackSound(type) {
    // Simple beep for now using AudioContext or just log
    // Ideally use an MP3 here later
    console.log(`Playing ${type} sound`);
}

function updateStatus(msg) { statusText.textContent = msg; }
function log(msg) { const p = document.createElement('p'); p.textContent = msg; logArea.appendChild(p); }
function endSession() {
    updateStatus("Session Complete");
    visualIndicator.className = "pulse-circle";
    setTimeout(() => { window.location.href = "../index.html"; }, 3000);
}
