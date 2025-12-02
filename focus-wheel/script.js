// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let wheelRotation = 0; 
let currentFocusIndex = -1; 

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

    // Rotate -30 BEFORE adding (for 2nd item onwards)
    if (statements.length > 1) {
        // We subtract 30 to move the previous item UP (counter-clockwise)
        wheelRotation -= 30;
        rotateWheel(wheelRotation);
    }

    renderNewSegment(text, statements.length - 1);

    if (statements.length >= 12) {
        completeWheel();
    }
}

function renderNewSegment(text, index) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    // Wrap text in span for the line-height fix in CSS
    el.innerHTML = `<span>${text}</span>`;
    el.id = `segment-${index}`;
    
    // Angle:
    // Index 0 = 0 deg (relative to wheel).
    // Index 1 = 30 deg (relative to wheel).
    // Since wheel is rotated -30, Index 1 appears at 0 deg visual.
    const segmentAngle = index * 30;
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(targetRotation) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheel.style.transform = `rotate(${targetRotation}deg)`;
    centerText.style.transform = `rotate(${-targetRotation}deg)`; 
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
        
        // Prepare for reflection
        currentFocusIndex = -1; 
    }, 1000);
}

function rotateWheelForReflection() {
    // 1. Clear old highlight
    if (currentFocusIndex >= 0) {
        const oldSeg = document.getElementById(`segment-${currentFocusIndex}`);
        if (oldSeg) {
            oldSeg.classList.remove('highlighted');
            oldSeg.style.transform = oldSeg.dataset.baseTransform;
        }
    }

    // 2. Advance Index
    currentFocusIndex++;
    if (currentFocusIndex >= statements.length) currentFocusIndex = 0;

    // 3. SNAP Rotation
    // We want the current item (index * 30 deg) to be at 0 deg visual.
    // So Wheel Rotation must be -(index * 30).
    // This guarantees perfect horizontal alignment every time.
    wheelRotation = -(currentFocusIndex * 30);
    rotateWheel(wheelRotation);

    // 4. Highlight
    const newSeg = document.getElementById(`segment-${currentFocusIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
