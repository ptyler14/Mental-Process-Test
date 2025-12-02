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

    // 1. Render the NEW segment at the current open position
    // The open position is always visually at 3 o'clock (0 degrees).
    // But since the wheel might have rotated, we need to place the text relative to the wheel's rotation.
    // Actually, simpler: Place text at index * 30 degrees.
    // Then rotate wheel -30 degrees.
    // Example:
    // Add #1 (Index 0): Place at 0deg. Wheel at 0deg. Visible at 0deg (3 o'clock).
    // Rotate Wheel -> -30deg. Item #1 is now visually at -30deg (2 o'clock).
    // Add #2 (Index 1): Place at 30deg. Wheel is at -30deg. Visual position = 30 + (-30) = 0deg (3 o'clock).
    // Perfect.
    
    renderNewSegment(text, statements.length - 1);

    // 2. Rotate the WHOLE wheel backwards to clear the spot for the next one
    rotateWheel(-30);

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
    
    const segmentAngle = index * 30; // 0, 30, 60...
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 55 : 85; 
    
    // Place it on the wheel at its permanent angle
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;
    
    // Store base transform for later
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    
    // Counter-rotate center text so it stays readable
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
        
        // Reset highlight index so first 'rotate' click highlights item 0
        currentHighlightIndex = -1; 
        
        // After spin (3s), maybe auto-highlight first item?
        // Let's wait for user to click Rotate.
    }, 1000);
}

function rotateWheelForReflection() {
    // We want to highlight the item currently at 3 o'clock.
    // And then rotate the wheel to bring the NEXT item to 3 o'clock.
    // So we rotate +30 degrees (Counter-Clockwise visual, bringing items down).
    
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

    // 3. Rotate wheel to bring this item to 3 o'clock (0 deg visual)
    // Item is at `index * 30`.
    // Wheel needs to be at `-index * 30`.
    wheelRotation = -(currentHighlightIndex * 30);
    rotateWheel(0); // Apply new absolute rotation

    // 4. Highlight
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
