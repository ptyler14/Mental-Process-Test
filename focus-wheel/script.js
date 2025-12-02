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
let currentFocusIndex = 0; 

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
    // IMPORTANT: We add it at a fixed rotation relative to the wheel's current state.
    // If wheel is at -30deg, we add text at +30deg so it appears at 0deg visually.
    // Actually, simpler: We add text at `index * 30` degrees.
    // Since the wheel rotates `-30` for each item, `index * 30` + `wheel * -30` = 0 (3 o'clock).
    
    renderNewSegment(text, index);

    // 3. Rotate the WHOLE wheel backwards AFTER adding
    // This moves the item we just added UP to 2 o'clock, clearing 3 o'clock for the next one.
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
    
    // Each item lives permanently at this angle on the wheel
    const segmentAngle = index * 30;
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Place it: Rotate to angle -> Push out to radius
    // Note: CSS transform-origin is left center, so it pivots from center
    el.style.transform = `rotate(${segmentAngle}deg) translate(${radius}px)`;

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
        
        // Set focus index to start (so first rotate brings item 0 to view)
        // If we rotated -30 * 12 times = -360. We are back at start.
        // Item 0 is at 0deg.
        currentFocusIndex = -1; // Ready for first click
    }, 1000);
}

function rotateWheelForReflection() {
    // 1. Clear old highlight
    if (currentFocusIndex >= 0) {
        const oldSeg = document.getElementById(`segment-${currentFocusIndex}`);
        if (oldSeg) {
            oldSeg.classList.remove('highlighted');
            // Restore rotation position
            const isMobile = window.innerWidth < 600;
            const radius = isMobile ? 60 : 90; 
            oldSeg.style.transform = `rotate(${currentFocusIndex * 30}deg) translate(${radius}px)`;
        }
    }

    // 2. Advance Index
    currentFocusIndex++;
    if (currentFocusIndex >= statements.length) currentFocusIndex = 0; // Loop

    // 3. Rotate Wheel to bring this item to 3 o'clock
    // Item is at `index * 30`. We want it at 0.
    // Wheel rotation needs to be `-index * 30`.
    // Since we might have spun a lot, we calculate relative target.
    
    const targetRotation = -(currentFocusIndex * 30);
    
    // Reset wheelRotation to match target (jump or smooth? CSS transition handles smooth)
    // To avoid "unwinding" (spinning 360 backwards), we handle modular math, 
    // but simplest is just to keep subtracting 30.
    
    // Let's use the simple "rotate forward one step" logic
    // We are currently at -360 (end of add). 
    // We want to see Item 0 (at 0deg). Rotation should be 0 (or -360).
    // Rotate to see Item 1 (at 30deg). Rotation should be -30.
    // Wait, Item 0 is at 0deg. To see it at 3 o'clock (0deg visual), rotation is 0.
    // Item 1 is at 30deg. To see it at 3 o'clock, we rotate wheel -30.
    
    // Since we ended "Add Mode" by rotating -30 * 12 = -360, we are at 0 effectively.
    // Clicking "Rotate" should show Item 0 first? Or Item 1?
    // Let's show the NEXT item.
    
    // Force specific rotation calculation
    wheelRotation = -(currentFocusIndex * 30);
    rotateWheel(0); // Just apply the value we set above

    // 4. Highlight New
    const newSeg = document.getElementById(`segment-${currentFocusIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
