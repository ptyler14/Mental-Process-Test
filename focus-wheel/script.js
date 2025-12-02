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
        completeWheel();
    }
}

function renderStatementOnWheel(text, index) {
    const container = document.getElementById('segments-container');
    const el = document.createElement('div');
    el.className = 'segment-text';
    el.textContent = text;
    el.id = `segment-${index}`;
    
    // Angle Calculation:
    // -90 is 12 o'clock.
    // We want the first item (index 0) to be between 12 and 1.
    // That is -75 degrees. Each subsequent item adds 30 degrees.
    const startAngle = -75; 
    const angleDeg = startAngle + (index * 30);
    
    // Radius: Distance from center to start of text
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 50 : 80; // Start text 50-80px from center
    
    // Apply Transform:
    // 1. Rotate to the correct angle
    // 2. Move outward (translate X)
    // Note: We use transform-origin: left center in CSS, so it rotates like a clock hand
    let transform = `rotate(${angleDeg}deg) translateX(${radius}px)`;

    // FLIP LOGIC:
    // Text on the left side (90 to 270 degrees) will be upside down.
    // We need to flip it for readability.
    // Normalized angle (0-360) helps check position.
    const normAngle = (angleDeg + 360) % 360;
    
    if (normAngle > 90 && normAngle < 270) {
        // It's on the left. Flip it 180deg so it reads left-to-right
        // We also need to adjust the text alignment so it "grows" inward
        el.style.textAlign = 'right';
        // Add 180 rotation to the end of the transform chain
        transform += ` rotate(180deg)`;
    }

    el.style.transform = transform;
    
    // Store the base transform so we can restore it after highlighting
    el.dataset.baseTransform = transform;

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
    // Remove highlight from previous
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (prevSeg) {
            prevSeg.classList.remove('highlighted');
            // Restore original position
            prevSeg.style.transform = prevSeg.dataset.baseTransform;
        }
    } else {
         document.querySelector('.center-circle').style.boxShadow = "inset 0 0 20px rgba(230, 126, 34, 0.1)";
    }

    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    
    if (newSeg) {
        newSeg.classList.add('highlighted');
        // Note: The CSS handles the 'scale' and 'z-index' pop-out effect
        // We don't need to manually adjust transform here because CSS class adds properties
        // However, if we want to ensure it stays rotated correctly, we just let the class apply styles
    }
}
