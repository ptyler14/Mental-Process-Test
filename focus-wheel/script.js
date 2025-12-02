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
    
    // Math to position text along spokes
    // Index 0 is at 1 o'clock position (~30 degrees)
    const angleDeg = (index * 30) - 60; // -60 offset to align 0 with 1 o'clock
    
    // Radius depends on screen size
    const isMobile = window.innerWidth < 600;
    // Offset from center to start of text
    const radiusOffset = isMobile ? 55 : 85; 
    
    // 1. Rotate to the spoke's angle
    // 2. Translate outwards along that angle
    // 3. Rotate 90deg to align text with the spoke
    el.style.transform = `rotate(${angleDeg}deg) translate(${radiusOffset}px) rotate(90deg)`;
    
    // Adjust text alignment based on position for readability
    if (index >= 3 && index <= 8) {
         el.style.textAlign = 'right';
         // Flip text on left side so it's not upside down
         el.style.transform += ' rotate(180deg)';
    } else {
         el.style.textAlign = 'left';
    }

    container.appendChild(el);
}

// --- STEP 3 LOGIC ---

function completeWheel() {
    setTimeout(() => {
        // 1. Move the completed wheel to the final container
        const wheel = document.querySelector('.wheel');
        document.getElementById('wheel-complete-container').appendChild(wheel);

        // 2. Switch views
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');

        // 3. Highlight center initially
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";

        // Optional: Save to Supabase here
    }, 1000);
}

function rotateWheel() {
    // Remove highlight from previous
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (prevSeg) prevSeg.classList.remove('highlighted');
    } else {
         // Remove center initial highlight
         document.querySelector('.center-circle').style.boxShadow = "inset 0 0 20px rgba(230, 126, 34, 0.1)";
    }

    // Increment index (loop back to 0 after 11)
    currentHighlightIndex = (currentHighlightIndex + 1) % 12;

    // Add highlight to new
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    if (newSeg) newSeg.classList.add('highlighted');
}
