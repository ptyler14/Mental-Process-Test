// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let statements = [];
let centerDesire = "";

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
    document.getElementById('reset-btn').addEventListener('click', () => location.reload());
}

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
    
    // Math to position in a circle (12 positions)
    // Start at 12 o'clock (-90 degrees)
    const angleDeg = (index * 30) - 90; 
    const angleRad = angleDeg * (Math.PI / 180);
    
    // Radius depends on screen size (rough estimate)
    const radius = window.innerWidth > 600 ? 180 : 110; 
    
    const x = Math.cos(angleRad) * radius;
    const y = Math.sin(angleRad) * radius;
    
    el.style.transform = `translate(${x}px, ${y}px)`;
    
    container.appendChild(el);
}

function completeWheel() {
    setTimeout(() => {
        document.getElementById('step-wheel').classList.add('hidden');
        document.getElementById('step-complete').classList.remove('hidden');
        // Here you could save to Supabase 'history' or 'entries' if you wanted
    }, 1500);
}
