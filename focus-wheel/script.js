// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let wheelRotation = 0; 
let currentHighlightIndex = -1;

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
    document.getElementById('start-wheel-btn').addEventListener('click', startWheel);
    document.getElementById('add-statement-btn').addEventListener('click', addStatement);
    
    document.getElementById('center-input').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') startWheel();
    });

    document.getElementById('statement-input').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') addStatement();
    });
    document.getElementById('rotate-btn').addEventListener('click', rotateWheelForReflection);
}

// --- LOGIC ---

function startWheel() {
    const input = document.getElementById('center-input');
    if (!input.value.trim()) return alert("Please enter your desire.");
    
    centerDesire = input.value;
    document.getElementById('center-text-display').textContent = centerDesire;
    
    document.getElementById('step-center').classList.add('hidden');
    document.getElementById('step-wheel').classList.remove('hidden');
    
    setTimeout(() => document.getElementById('statement-input').focus(), 100);
}

function addStatement() {
    const input = document.getElementById('statement-input');
    const text = input.value.trim();
    if (!text) return;
    
    statements.push(text);
    input.value = '';
    document.getElementById('statement-count').textContent = statements.length;

    // 1. Rotation
    if (statements.length > 1) {
        rotateWheel(-30);
    }

    // 2. Render
    renderNewSegment(text, statements.length - 1);

    if (statements.length >= 12) {
        completeWheel();
    }
}

function renderNewSegment(text, index) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    el.textContent = text;
    el.id = `segment-${index}`;
    
    const segmentAngle = index * 30; 
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 55 : 85; 
    
    // Offset Calculation:
    // We want the text to be above the line.
    // "Above" means rotating slightly LESS than the spoke angle (counter-clockwise shift)
    // OR translating Y upwards.
    // Let's translate Y upwards by 15px to lift it off the line.
    
    // TRANSFORM LOGIC:
    // 1. Rotate to spoke angle.
    // 2. Translate X (outward).
    // 3. Translate Y (lift up off the line).
    
    let transform = `rotate(${segmentAngle}deg) translate(${radius}px, -15px)`;

    // Left Side Flip Logic (90 to 270 degrees)
    const normAngle = (segmentAngle + 360) % 360;
    if (normAngle > 90 && normAngle < 270) {
        // If flipped, "up" becomes "down". 
        // So we need to translate Y *down* (positive) to move it above the line visually.
        // Also, text alignment needs to flip.
        
        el.style.textAlign = 'right';
        el.style.transformOrigin = 'right center'; 
        // Push out further because anchor flipped
        const adjustRadius = radius + (isMobile ? 60 : 100); 
        
        // Flip Transform: Rotate + Translate + Flip (rotate 180)
        // Note: Translate Y becomes +15px because the whole coordinate system flips.
        transform = `rotate(${segmentAngle}deg) translate(${adjustRadius}px, 15px) rotate(180deg)`; 
    } else {
        el.style.textAlign = 'left';
        el.style.transformOrigin = 'left center';
    }

    el.style.transform = transform;
    el.dataset.baseTransform = transform;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    centerText.style.transform = `rotate(${-wheelRotation}deg)`; 
    centerText.style.display = 'block'; 
}

// --- COMPLETION ---

function completeWheel() {
    setTimeout(() => {
        const wheel = document.querySelector('.wheel');
        document.getElementById('wheel-complete-container').appendChild(wheel);
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');
        
        wheel.classList.add('spinning');
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #2980b9";
        currentHighlightIndex = -1; 
    }, 1000);
}

function rotateWheelForReflection() {
    rotateWheel(30); 
    
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if(prevSeg) {
            prevSeg.classList.remove('highlighted');
            prevSeg.style.transform = prevSeg.dataset.baseTransform;
        }
    }

    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
