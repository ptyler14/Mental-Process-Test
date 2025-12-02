// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let currentWheelRotation = 0; 
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
    // We use index to determine the slot.
    // Index 0 = 0 deg. Index 1 = -30 deg (Counter-clockwise filling).
    // Wait, CSS rotation is clockwise. 
    // Slot 0 = 0 deg. Slot 1 = 330 deg (-30). Slot 2 = 300 deg (-60).
    // This fills the wheel "upwards" (counter-clockwise).
    
    const slotIndex = statements.length - 1;
    
    // Calculate angle for this slot: -30 * index
    const slotAngle = slotIndex * -30;
    
    renderNewSegment(text, slotIndex, slotAngle);

    // 3. Rotate the WHOLE wheel to bring the NEXT slot to 3 o'clock.
    // If we just filled Slot 0 (0 deg), we want Slot 1 (-30 deg) to be at 3 o'clock.
    // To move -30 to 0, we must rotate +30.
    // So we add +30 to current rotation.
    
    rotateWheel(30);

    if (statements.length >= 12) {
        completeWheel();
    }
}

function renderNewSegment(text, index, angle) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    el.textContent = text;
    el.id = `segment-${index}`;
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Place it at its permanent home on the wheel
    el.style.transform = `rotate(${angle}deg) translate(${radius}px)`;
    
    // Store for later restoration
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

function rotateWheel(degreesToAdd) {
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 

    currentWheelRotation += degreesToAdd;
    
    wheel.style.transform = `rotate(${currentWheelRotation}deg)`;
    
    // Counter-rotate center text
    centerText.style.transform = `rotate(${-currentWheelRotation}deg)`; 
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
        
        // Reset logic for reflection
        currentHighlightIndex = -1; 
    }, 1000);
}

function rotateWheelForReflection() {
    // 1. Un-highlight previous
    if (currentHighlightIndex >= 0) {
        const oldSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (oldSeg) {
            oldSeg.classList.remove('highlighted');
            oldSeg.style.transform = oldSeg.dataset.baseTransform;
        }
    }

    // 2. Advance Index (0 -> 1 -> 2...)
    currentHighlightIndex++;
    if (currentHighlightIndex >= statements.length) currentHighlightIndex = 0;

    // 3. Rotate Wheel
    // We want Item N to be at 3 o'clock (0 deg visual).
    // Item N is at angle: N * -30.
    // To bring (N * -30) to 0, we must rotate wheel by +(N * 30).
    
    // Calculate target absolute rotation
    const targetRotation = currentHighlightIndex * 30;
    
    // Update state to match
    currentWheelRotation = targetRotation;
    
    // Apply rotation
    const wheel = document.querySelector('.wheel');
    const centerText = document.querySelector('.center-circle p'); 
    wheel.style.transform = `rotate(${currentWheelRotation}deg)`;
    centerText.style.transform = `rotate(${-currentWheelRotation}deg)`;

    // 4. Highlight
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) {
        newSeg.classList.add('highlighted');
    }
}
