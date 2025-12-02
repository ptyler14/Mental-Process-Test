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
    
    // Rotate Button (for reflection phase)
    document.getElementById('rotate-btn').addEventListener('click', rotateWheel);
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
    
    // Angle Calculation
    // 12 segments = 30 degrees each.
    // Index 0 starts at "1 o'clock". 
    // In CSS, 0deg is 3 o'clock. 12 o'clock is -90deg.
    // So 1 o'clock is -60deg.
    const startAngle = -60; 
    const angleDeg = startAngle + (index * 30);
    
    // Radius: Distance from center to start of text
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    // Apply Transform
    // 1. Rotate to the correct angle (points the element in the right direction)
    // 2. Translate outwards (moves it along that line)
    // 3. Rotate text to be readable (optional flip for left side)
    
    let rotation = angleDeg;
    let textRotation = 0;
    
    // Normalize angle to 0-360
    let normalizedAngle = (angleDeg + 360) % 360;
    
    // Logic: Text on the left side (90 to 270 degrees) is upside down. Flip it.
    if (normalizedAngle > 90 && normalizedAngle < 270) {
        textRotation = 180;
        el.style.textAlign = 'right'; // Anchor text to the outer edge so it grows inward
        // We need to push it out further because the anchor point flips
        // This is a visual adjustment based on text length usually, but fixed radius helps.
    } else {
        el.style.textAlign = 'left';
    }

    // Combine transforms
    // The order matters: Rotate (direction) -> Translate (distance) -> Rotate (readability flip)
    el.style.transform = `rotate(${angleDeg}deg) translate(${radius}px) rotate(${textRotation}deg)`;
    
    // Critical for radiating text:
    el.style.transformOrigin = "left center"; 
    el.style.position = "absolute";
    el.style.top = "50%";
    el.style.left = "50%";
    el.style.width = "140px"; // Limit width so it doesn't overflow
    
    // Save base transform for later use (resetting highlight)
    el.dataset.baseTransform = el.style.transform;

    container.appendChild(el);
}

// --- COMPLETION ---

function completeWheel() {
    setTimeout(() => {
        const wheel = document.querySelector('.wheel');
        document.getElementById('wheel-complete-container').appendChild(wheel);
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');
        
        // Add spinning animation class
        wheel.classList.add('spinning');
        
        document.querySelector('.center-circle').style.boxShadow = "0 0 25px #e67e22";
    }, 1000);
}

function rotateWheel() {
    // Reset previous highlight
    if (currentHighlightIndex >= 0) {
        const prevSeg = document.getElementById(`segment-${currentHighlightIndex}`);
        if (prevSeg) {
            prevSeg.classList.remove('highlighted');
            // Restore original position/rotation
            prevSeg.style.transform = prevSeg.dataset.baseTransform;
        }
    } else {
         document.querySelector('.center-circle').style.boxShadow = "inset 0 0 20px rgba(230, 126, 34, 0.1)";
    }

    currentHighlightIndex = (currentHighlightIndex + 1) % 12;
    const newSeg = document.getElementById(`segment-${currentHighlightIndex}`);
    
    if (newSeg) {
        newSeg.classList.add('highlighted');
        // When highlighted, we can scale it up slightly in place
        // The CSS handles the appearance, but we ensure it keeps its rotation
        // Note: CSS 'transform' property overrides inline style, so we might need to re-apply rotation in CSS or JS
        // Let's trust the CSS class to add scale/z-index, but keep the inline rotation.
    }
}
