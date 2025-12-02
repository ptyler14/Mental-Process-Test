// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let wheelRotation = 0; // Tracks how much the whole wheel has spun
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
    
    // 1. Add to array
    statements.push(text);
    input.value = '';
    document.getElementById('statement-count').textContent = statements.length;

    // 2. Render the NEW segment
    // Logic: Each new segment is placed at a position 30 degrees FURTHER than the last one
    // relative to the wheel's origin. So index 0 is at 0deg, index 1 is at 30deg, etc.
    renderNewSegment(text, statements.length - 1);

    // 3. Rotate the WHOLE wheel backwards so the new segment stays at 3 o'clock (visual entry point)
    // Actually, to keep the entry point static (3 o'clock), we need to rotate the wheel -30deg 
    // BEFORE adding the next one? No, we want the NEW one to appear at 3 o'clock.
    
    // Let's refine:
    // We want Segment 1 to appear at 3 o'clock. 
    // Then we rotate -30deg. 
    // Segment 1 is now at 2 o'clock. 3 o'clock is empty.
    // We add Segment 2 at 3 o'clock.
    // Perfect.
    
    // So, when adding Statement #1 (Index 0):
    // - Place text at rotation 0deg (relative to wheel).
    // - Wheel rotation is currently 0deg.
    // - Rotate wheel to -30deg AFTER adding.
    
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
    
    // The segment's permanent home on the wheel is at (Index * 30) degrees.
    // e.g., Item 0 is at 0deg. Item 1 is at 30deg.
    const segmentAngle = index * 30;
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Place it: Rotate to angle -> Push out to radius
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); // Text inside the center circle

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    
    // Counter-rotate the center text so it always stays upright!
    // (Otherwise the desire text spins upside down)
    centerText.style.transform = `rotate(${-wheelRotation}deg)`; 
    centerText.style.display = 'block'; // Ensure block for transform
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
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";
        
        // After spin, reset rotation class but keep position? 
        // Actually, let's just let it spin and land.
    }, 1000);
}

function rotateWheelForReflection() {
    // This rotates FORWARD to show items 1 by 1
    rotateWheel(30); 
    
    // Highlight logic
    // We are rotating +30deg, which brings the PREVIOUS item into view?
    // Let's highlight the item currently at 3 o'clock (0 degrees visual).
    // If wheel is at -30, Item 1 (30deg) is at 0 visual.
    
    // Reset previous highlight
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
