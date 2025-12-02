// --- SUPABASE CONFIG ---
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
    
    // Fix #1: Enable Enter key for Start Wheel
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
    
    // Auto-focus next input
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
        completeWheel();
    }
}

function renderStatementOnWheel(text, index) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    el.textContent = text;
    el.id = `segment-${index}`;
    
    // Fix #2: Text Rotation Logic
    // We want 12 segments. 360 / 12 = 30 degrees per segment.
    // Position 0 starts at "1 o'clock". 
    // 12 o'clock is -90deg in CSS (0 is usually 3 o'clock).
    // So we start at -60deg for 1 o'clock.
    
    const startAngle = -60; 
    const angleDeg = startAngle + (index * 30);
    
    // Radius: Distance from center to start of text
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 100; 
    
    // CSS Magic:
    // 1. Rotate the element to point in the right direction
    // 2. Translate it outwards from the center
    // 3. (Optional) Flip text on the left side so it's readable
    
    let rotation = angleDeg;
    
    // Check if text is on the left side (90 to 270 degrees roughly)
    // Normalize angle to 0-360 for easier checking
    let normalizedAngle = (angleDeg + 360) % 360;
    
    // If text is on the left, we might want to flip it so it's not upside down?
    // The user asked for "radiating out", so upside down might be intended for the bottom half.
    // Let's stick to pure radiation first.
    
    el.style.transform = `rotate(${angleDeg}deg) translate(${radius}px)`;
    
    // Special tweak: If you want the text ON the line, we translate Y slightly.
    // If you want it BETWEEN lines, we keep as is.
    // Assuming "on the spoke" means centered on the angle.
    
    // Crucial CSS update: Text origin must be left-center for this transform to work
    el.style.transformOrigin = "left center";
    el.style.position = "absolute";
    el.style.top = "50%";
    el.style.left = "50%";
    el.style.width = "150px"; // Limit width
    el.style.textAlign = "left"; 

    container.appendChild(el);
}

// --- STEP 3 LOGIC ---

function completeWheel() {
    setTimeout(() => {
        const wheel = document.querySelector('.wheel');
        document.getElementById('wheel-complete-container').appendChild(wheel);
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";
    }, 1000);
}

function rotateWheel() {
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (prevSeg) prevSeg.classList.remove('highlighted');
    } else {
         document.querySelector('.center-circle').style.boxShadow = "inset 0 0 20px rgba(230, 126, 34, 0.1)";
    }
    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) newSeg.classList.add('highlighted');
}
