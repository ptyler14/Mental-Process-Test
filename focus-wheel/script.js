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
    // Only rotate if we have more than 1 item.
    // Item 1 stays flat. Item 2 triggers rotation.
    if (statements.length > 1) {
        rotateWheel(-30);
    }

    // 2. RENDER SEGMENT
    // The segment is placed at a fixed angle on the wheel itself.
    // Item 0 = 0 deg. Item 1 = 30 deg.
    // Because we rotated the wheel -30 deg for Item 1, 
    // Item 1's physical position (30 deg) + Wheel Rotation (-30 deg) = 0 deg (Visual Horizontal).
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
    
    // Angle: 0 deg is 3 o'clock.
    // Each index increases by 30 degrees COUNTER-CLOCKWISE?
    // Actually, CSS rotation is clockwise.
    // So Index 1 is at +30 deg (4 o'clock).
    // We want to fill UPWARDS (2 o'clock, 1 o'clock).
    // So we should multiply by -30?
    
    // Let's stick to standard clock: 
    // If we rotate wheel -30 (Counter Clockwise), the slots move UP.
    // So we want the NEXT slot (at 3 o'clock) to be the one at +30 deg.
    // Yes.
    
    const segmentAngle = index * 30; 
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 55 : 85; // Start distance from center
    
    // Place it
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    
    // Counter-rotate center text
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
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";
    }, 1000);
}

function rotateWheelForReflection() {
    // Rotate FORWARD (+30) to see next item? 
    // Or backwards? Let's try forward.
    rotateWheel(30); 
    
    // Highlight Logic
    // We need to highlight the item that lands at 3 o'clock.
    // Current wheel rotation = some negative number (e.g. -330).
    // We added +30, so now -300.
    // Item at 300 deg (Index 10) should be visible?
    
    // Simplest approach: Just track the index.
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if(prevSeg) prevSeg.classList.remove('highlighted');
    }

    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
