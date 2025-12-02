// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let wheelRotation = 0; 
// Track which statement index is currently at the 3 o'clock position
// Start at -1 (none), first add becomes 0
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
    
    // 1. Add to array
    statements.push(text);
    const index = statements.length - 1;
    input.value = '';
    document.getElementById('statement-count').textContent = statements.length;

    // 2. Render the NEW segment
    // We place it based on its index. Index 0 is at 0 degrees (3 o'clock).
    // Index 1 is at 30 degrees.
    // Since we rotate the wheel -30 degrees for each new item, the *visual* result is
    // that the new item always appears at 3 o'clock.
    renderNewSegment(text, index);

    // 3. Rotate the WHOLE wheel backwards to clear the spot for the next one
    // Exception: Don't rotate for the *very first* item so it stays visible while we type the second.
    // Wait, no - if we don't rotate, the second item will overlap visually until we rotate.
    // Better UX: Add item at 3 o'clock. Then rotate immediately so 3 o'clock is open again.
    // Let's try immediate rotation.
    
    if (statements.length > 0) {
         rotateWheel(-30);
    }

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
    
    // Each item lives permanently at this angle on the wheel relative to the wheel's start
    // Item 0 is at 0 degrees. Item 1 is at 30 degrees.
    const segmentAngle = index * 30;
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Place it: Rotate to angle -> Push out to radius
    // Note: CSS transform-origin is left center, so it pivots from center
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;
    
    // Store base transform for later (restoring after highlight)
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(degrees) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    wheelRotation += degrees;
    
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
    
    // Counter-rotate the center text so it always stays upright!
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
        
        // Reset focus index. Since we rotated -30 * 12 = -360 deg, we are back at start.
        // The item at 3 o'clock is Item 0 (visually).
        // Wait, if we rotated -360, then Item 0 is at 0 deg relative to wheel.
        // Wheel is at 0 deg (effectively).
        // So Item 0 is at 3 o'clock.
        
        // We want the FIRST click of "Rotate" to highlight Item 0.
        currentFocusIndex = -1; 
    }, 1000);
}

function rotateWheelForReflection() {
    // 1. Clear old highlight
    if (currentHighlightIndex >= 0) {
        const oldSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (oldSeg) {
            oldSeg.classList.remove('highlighted');
            // Restore basic position
            oldSeg.style.transform = oldSeg.dataset.baseTransform;
        }
    }

    // 2. Advance Index
    currentHighlightIndex++;
    if (currentHighlightIndex >= statements.length) currentHighlightIndex = 0;

    // 3. Rotate wheel to bring this item to 3 o'clock (0 deg visual)
    // Item is at `index * 30`.
    // Wheel needs to be at `-index * 30`.
    // We animate to that specific rotation.
    
    wheelRotation = -(currentHighlightIndex * 30);
    rotateWheel(0); // Apply the absolute rotation calculation above

    // 4. Highlight New
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
