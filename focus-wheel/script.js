// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";
let currentRotation = 0; // Track total rotation of the wheel

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
    document.getElementById('rotate-btn').addEventListener('click', spinForReflection);
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
    
    renderNewSegment(text, statements.length - 1);
    document.getElementById('statement-count').textContent = statements.length;

    // Rotate the wheel to make room for the next one
    rotateWheelForNext();

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
    
    // PLACEHOLDER: Always place at 3 o'clock (Right side)
    // Then we rotate the text element itself to match the current wheel rotation
    // so it stays upright relative to the spoke it's attached to.
    
    // Wait, actually: We want the text to be "attached" to the wheel.
    // So we add it at 3 o'clock, but with a rotation equal to the CURRENT wheel rotation offset.
    // That way, when the wheel spins, this text spins with it.
    
    // Angle for 3 o'clock relative to the start (12 o'clock is -90).
    // We want the first item at 1 o'clock (-60 deg).
    // But you want to write at 3 o'clock (0 deg visually) and spin the wheel back.
    
    // SIMPLIFIED APPROACH:
    // We just place the text at the correct absolute angle for its index.
    // Then we rotate the PARENT container (.wheel).
    
    const startAngle = -60; // 1 o'clock
    const angleDeg = startAngle + (index * 30);
    
    const isMobile = window.innerWidth < 600;
    const radius = isMobile ? 60 : 90; 
    
    el.style.transform = `rotate(${angleDeg}deg) translate(${radius}px) rotate(90deg)`;
    el.style.textAlign = 'left';
    el.style.transformOrigin = 'left center';

    container.appendChild(el);
}

function rotateWheelForNext() {
    const wheel = document.querySelector('.wheel');
    // Spin counter-clockwise by 30 deg
    currentRotation -= 30;
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    // We need to counter-rotate the center text so it stays upright!
    const centerText = document.querySelector('.center-circle p');
    centerText.style.transform = `rotate(${-currentRotation}deg)`;
}

// --- COMPLETION ---

function completeWheel() {
    setTimeout(() => {
        // Reset rotation to 0 for the final view? Or keep it?
        // Let's spin it back to 0 for the 'Victory' spin.
        const wheel = document.querySelector('.wheel');
        const centerText = document.querySelector('.center-circle p');
        
        // 1. Move to final container
        document.getElementById('wheel-complete-container').appendChild(wheel);
        
        // 2. Switch views
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');
        
        // 3. Victory Spin
        wheel.style.transition = "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)";
        wheel.style.transform = "rotate(1080deg)"; // 3 full spins
        
        // Counter-rotate center text so it stays readable during spin (optional, might be dizzying!)
        // centerText.style.transition = "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)";
        // centerText.style.transform = "rotate(-1080deg)";

    }, 1000);
}

function spinForReflection() {
    const wheel = document.querySelector('.wheel');
    // Spin 30 degrees (1 segment)
    currentRotation += 30; 
    wheel.style.transition = "transform 0.5s ease";
    wheel.style.transform = `rotate(${currentRotation}deg)`;
    
    // Keep center text upright
    const centerText = document.querySelector('.center-circle p');
    centerText.style.transition = "transform 0.5s ease";
    centerText.style.transform = `rotate(${-currentRotation}deg)`;
}
