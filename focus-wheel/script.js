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

    // 1. ROTATION LOGIC
    // If this is the 2nd item or later (index 1+), rotate the wheel FIRST
    // so the previous item moves out of the way (to 2 o'clock).
    if (statements.length > 1) {
        rotateWheel(-30);
    }

    // 2. RENDER SEGMENT
    // We place the new segment at a rotation that COUNTERACTS the wheel's current rotation.
    // Why? Because we want it to appear visually at 3 o'clock (0 deg).
    // If wheel is at -30deg, we must place text at +30deg so (30 + -30) = 0.
    // Index 0: Wheel 0. Text 0. -> Visual 0.
    // Index 1: Wheel -30. Text 30. -> Visual 0.
    // Index 2: Wheel -60. Text 60. -> Visual 0.
    // Formula: Text Angle = Index * 30.
    
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
    
    // The text's permanent angle on the wheel
    const segmentAngle = index * 30; 
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Place it on the wheel
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;
    
    // Store for later
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    
    // Counter-rotate center text so it stays upright
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
        
        // Victory Spin
        wheel.classList.add('spinning');
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #2980b9";
        
        // Reset for reflection: We want to start highlighting the FIRST item (index 0).
        // We ended at rotation -330 (for item 11).
        // Item 0 is at 0 deg.
        // To see Item 0 at 3 o'clock, wheel must be at 0 (or -360).
        // Let's reset wheel to 0 for simplicity? No, that might jump.
        // Let's just rely on the rotate logic to find it.
        
        currentHighlightIndex = -1; 
    }, 1000);
}

function rotateWheelForReflection() {
    // 1. Clear old highlight
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if(prevSeg) {
            prevSeg.classList.remove('highlighted');
            prevSeg.style.transform = prevSeg.dataset.baseTransform;
        }
    }

    // 2. Advance Index
    currentHighlightIndex++;
    if (currentHighlightIndex >= statements.length) currentHighlightIndex = 0;

    // 3. Rotate wheel to bring THIS item to 3 o'clock (0 deg visual)
    // Item is at `index * 30`.
    // Wheel needs to be at `-index * 30`.
    
    wheelRotation = -(currentHighlightIndex * 30);
    rotateWheel(0); // Apply the absolute rotation

    // 4. Highlight
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
