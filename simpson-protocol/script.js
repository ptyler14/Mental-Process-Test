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
        text: "On a scale of minus ten to plus ten, how does this issue feel right now? Click the mic button and speak the number.",
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

// Settings
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let userKeys = JSON.parse(localStorage.getItem('sp_keys')) || { yes: 'Space', no: null }; 
let isCalibrated = localStorage.getItem('sp_calibrated') === 'true';

// --- DOM ---
const startScreen = document.getElementById('start-screen');
const sessionScreen = document.getElementById('session-screen');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const visualIndicator = document.getElementById('visual-indicator');
const logArea = document.getElementById('feedback-log');

// Add Mic Button dynamically if not in HTML
let micBtn = document.getElementById('mic-btn');
if (!micBtn) {
    micBtn = document.createElement('button');
    micBtn.id = 'mic-btn';
    micBtn.textContent = '🎤 Tap to Speak';
    micBtn.className = 'primary-btn hidden';
    micBtn.style.marginTop = "20px";
    sessionScreen.appendChild(micBtn);
}

// --- INIT ---
startBtn.addEventListener('click', startFlow);

function startFlow() {
    startScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
    
    // Always re-calibrate voice to ensure permissions
    startCalibration(); 
}

// --- CALIBRATION ---
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
    
    await speak("Now, click the button below and say 'Five'.");
    micBtn.classList.remove('hidden'); // Show button
    
    const heardText = await waitForSpecificVoice("five");
    micBtn.classList.add('hidden'); // Hide button
    
    if (heardText) {
        await speak("Heard Five. Starting session.");
        localStorage.setItem('sp_keys', JSON.stringify(userKeys));
        localStorage.setItem('sp_calibrated', 'true');
        setTimeout(() => runStep("start"), 1000);
    } else {
        await speak("I couldn't hear you. Check microphone settings.");
        // Retry calibration
        setTimeout(() => startCalibration(), 2000);
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
        // Wait for CLICK to start recognition
        const clickHandler = () => {
            micBtn.textContent = "Listening...";
            recognition.start();
        };
        
        micBtn.onclick = clickHandler;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            log(`Heard: "${transcript}"`);
            micBtn.textContent = "🎤 Tap to Speak";
            if (transcript.includes(targetWord) || transcript.includes("5")) {
                resolve(true);
            } else {
                resolve(false); 
            }
        };
        
        recognition.onerror = (e) => {
            console.error("Mic Error", e);
            micBtn.textContent = "Error. Try Again.";
            resolve(false);
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
        updateStatus("Waiting for Voice...");
        micBtn.classList.remove('hidden'); // Show button
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
        } else {
            log("Response: NO");
            playFeedbackSound('no');
            runStep(stepData.no);
        }
    };
    document.addEventListener('keydown', handler);
}

function waitForVoiceResponse(stepData) {
    // Wait for click
    micBtn.onclick = () => {
        micBtn.textContent = "Listening...";
        visualIndicator.className = "pulse-circle listening";
        recognition.start();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        log(`Heard: "${transcript}"`);
        micBtn.textContent = "🎤 Tap to Speak";
        micBtn.classList.add('hidden'); // Hide after success
        visualIndicator.className = "pulse-circle";
        
        const score = parseSuds(transcript);
        
        if (score !== null) {
            log(`Recorded SUDs: ${score}`);
            speak(`I heard ${score}. Moving on.`);
            setTimeout(() => runStep("finish"), 2000); 
        } else {
            speak("I didn't catch that number. Tap and try again.");
            micBtn.classList.remove('hidden'); // Show again for retry
        }
    };
    
    recognition.onerror = () => {
        speak("Error. Tap to try again.");
        micBtn.textContent = "🎤 Tap to Speak";
    };
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
    // Beep logic here
}

function updateStatus(msg) { statusText.textContent = msg; }
function log(msg) { const p = document.createElement('p'); p.textContent = msg; logArea.appendChild(p); }
function endSession() {
    updateStatus("Session Complete");
    visualIndicator.className = "pulse-circle";
    setTimeout(() => { window.location.href = "../index.html"; }, 3000);
}
