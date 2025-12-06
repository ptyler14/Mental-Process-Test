// --- CONFIGURATION ---
// For prototyping, we use Text-to-Speech. 
// Later, you can replace 'text' with 'audioFile: "path/to/file.mp3"'
const SESSION_SCRIPT = {
    start: {
        text: "Welcome. Take a deep breath and close your eyes. We are beginning the induction.",
        next: "check_ready"
    },
    check_ready: {
        type: "question",
        text: "Are you ready to allow your mind to go as deep as needed? Press Space for Yes.",
        yes: "induction_deepener",
        no: "start" // Loop back if not ready
    },
    induction_deepener: {
        text: "Relaxing your eyelids... Going deeper... 10... 9... 8... deeper and deeper.",
        next: "establish_communication"
    },
    establish_communication: {
        type: "question",
        text: "Superconscious, are you present? Signal Yes.",
        yes: "suds_check",
        no: "induction_deepener" // Needs more deepening
    },
    suds_check: {
        type: "speech",
        text: "On a scale of minus ten to plus ten, how does this issue feel right now? Speak the number.",
        next: "process_suds"
    },
    // ... (You can add the Foundation/Clearing steps here later) ...
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

// Recognition Setup
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

// --- DOM ELEMENTS ---
const startScreen = document.getElementById('start-screen');
const sessionScreen = document.getElementById('session-screen');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const visualIndicator = document.getElementById('visual-indicator');
const logArea = document.getElementById('feedback-log');

// --- INIT ---
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
    runStep(currentStep);
});

// --- SESSION ENGINE ---

async function runStep(stepId) {
    const stepData = SESSION_SCRIPT[stepId];
    if (!stepData) return endSession();

    currentStep = stepId;
    updateStatus("Speaking...");
    visualIndicator.className = "pulse-circle speaking";

    // 1. Speak the Prompt (or Play Audio)
    await speak(stepData.text);
    
    visualIndicator.className = "pulse-circle";

    // 2. Handle Step Type
    if (stepData.type === "question") {
        updateStatus("Waiting for Signal...");
        waitForKey(stepData);
    } 
    else if (stepData.type === "speech") {
        updateStatus("Listening...");
        visualIndicator.className = "pulse-circle listening";
        waitForVoice(stepData);
    } 
    else {
        // Standard step, just move on
        if (stepData.next) {
            setTimeout(() => runStep(stepData.next), 1000); // Small pause
        } else {
            endSession();
        }
    }
}

// --- INPUT HANDLERS ---

function waitForKey(stepData) {
    const handler = (e) => {
        document.removeEventListener('keydown', handler); // Clean up
        
        if (e.code === 'Space') {
            log("Response: YES (Space)");
            playFeedbackSound('yes');
            runStep(stepData.yes);
        } else {
            log("Response: NO (Key press)");
            playFeedbackSound('no');
            runStep(stepData.no);
        }
    };
    document.addEventListener('keydown', handler);
}

function waitForVoice(stepData) {
    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        log(`Heard: "${transcript}"`);
        
        const score = parseSuds(transcript);
        
        if (score !== null) {
            log(`Recorded SUDs: ${score}`);
            speak(`I heard ${score}. Moving on.`);
            // In a real app, save score to DB here
            setTimeout(() => runStep("finish"), 2000); // Jump to finish for this demo
        } else {
            speak("I didn't quite catch that number. Please try again.");
            setTimeout(() => waitForVoice(stepData), 3000);
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Error", event.error);
        speak("I couldn't hear you. Please say the number again.");
        setTimeout(() => waitForVoice(stepData), 3000);
    };
}

// --- HELPERS ---

function parseSuds(text) {
    // Logic to extract number and sign
    const isNegative = text.includes('minus') || text.includes('negative');
    const numbers = text.match(/\d+/); // Find digits
    
    if (!numbers) {
        // Handle text numbers ("seven")
        const words = {
            "zero":0, "one":1, "two":2, "three":3, "four":4, 
            "five":5, "six":6, "seven":7, "eight":8, "nine":9, "ten":10
        };
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
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for hypnosis
        utterance.onend = resolve;
        synth.speak(utterance);
    });
}

function playFeedbackSound(type) {
    // Placeholder for a soft chime
    // new Audio('chime.mp3').play();
}

function updateStatus(msg) {
    statusText.textContent = msg;
}

function log(msg) {
    const p = document.createElement('p');
    p.textContent = msg;
    logArea.appendChild(p);
}

function endSession() {
    updateStatus("Session Complete");
    visualIndicator.className = "pulse-circle";
    setTimeout(() => {
        window.location.href = "../index.html";
    }, 3000);
}
