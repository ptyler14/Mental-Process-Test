// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
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
    document.getElementById('rotate-btn').addEventListener('click', rotateWheel);
}

// --- STEP 1 & 2 LOGIC ---

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
    
    renderStatementOnWheel(text, statements.length - 1);
    document.getElementById('statement-count').textContent = statements.length;

    if (statements.length >= 12) {
        startVictorySpin();
    }
}

function renderStatementOnWheel(text, index) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    el.textContent = text;
    el.id = `segment-${index}`;
    
    // Angle Calculation: -75 is first segment (between 12 and 1 o'clock)
    const angleDeg = -75 + (index * 30);
    
    // Radius settings
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 55 : 85; 
    
    // The trick for left side text:
    // 1. Base transform is always: Rotate to angle -> Move out -> Rotate 90 to align with spoke
    // 2. If on left side, we FLIP the text (rotate 180) AND adjust alignment so it grows 'inward' towards the rim
    //    instead of 'outward' from the center, which keeps it inside the circle.
    
    let transform = `rotate(${angleDeg}deg) translate(${radius}px) rotate(90deg)`;
    
    const normAngle = (angleDeg + 360) % 360;
    
    if (normAngle > 90 && normAngle < 270) {
        // Left Side Fix
        el.style.textAlign = 'right'; 
        el.style.transformOrigin = 'right center'; // Pivot from the right side (outer edge)
        // Move it out a bit further so the 'right' edge hits the radius point
        const adjustRadius = radius + (isMobile ? 60 : 100); 
        transform = `rotate(${angleDeg}deg) translate(${adjustRadius}px) rotate(270deg)`; 
    } else {
        // Right Side (Standard)
        el.style.textAlign = 'left';
        el.style.transformOrigin = 'left center';
    }

    el.style.transform = transform;
    el.dataset.baseTransform = transform; // Store for later

    container.appendChild(el);
}

// --- STEP 3 LOGIC ---

function startVictorySpin() {
    const wheel = document.querySelector('.wheel');
    
    // 1. Disable inputs
    document.querySelector('.input-area').classList.add('hidden');
    
    // 2. Add Spin Class
    wheel.classList.add('spinning');
    
    // 3. Wait for spin to finish (3s), then show completion screen
    setTimeout(() => {
        wheel.classList.remove('spinning');
        completeWheel();
    }, 3000);
}

function completeWheel() {
    const wheel = document.querySelector('.wheel');
    document.getElementById('wheel-complete-container').appendChild(wheel);
    document.getElementById('step-wheel').classList.add('hidden');
    document.getElementById('step-complete').classList.remove('hidden');
    document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";
}

function rotateWheel() {
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (prevSeg) {
            prevSeg.classList.remove('highlighted');
            prevSeg.style.transform = prevSeg.dataset.baseTransform;
        }
    } else {
         document.querySelector('.center-circle').style.boxShadow = "inset 0 0 20px rgba(230, 126, 34, 0.1)";
    }

    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    
    if (newSeg) {
        newSeg.classList.add('highlighted');
        // When highlighted, we remove the rotation to make it readable flat
        // Or we can keep it rotated but scale it up. 
        // Let's scale it up but keep rotation for visual consistency with the wheel.
        // The CSS handles the scale.
    }
}
