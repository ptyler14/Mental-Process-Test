// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SCENARIOS ---
const scenarios = [
    "The telephone just rang.",
    "You are walking into a meeting room.",
    "You are getting into your car to drive.",
    "You are about to cook dinner.",
    "You are opening your email inbox.",
    "You are lying down to go to sleep.",
    "You are walking into your home after work.",
    "You are about to have a difficult conversation."
];

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkUser();
    attachEventListeners();
});

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "../index.html";
    }
}

function attachEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Practice Mode
    const newScenarioBtn = document.getElementById('new-scenario-btn');
    if (newScenarioBtn) newScenarioBtn.addEventListener('click', showRandomScenario);

    const submitIntentionBtn = document.getElementById('submit-intention-btn');
    if (submitIntentionBtn) submitIntentionBtn.addEventListener('click', handleIntentionSubmit);

    // Save Note
    const saveNoteBtn = document.getElementById('save-note-btn');
    if (saveNoteBtn) saveNoteBtn.addEventListener('click', () => {
        alert("Insight saved! (This is a placeholder action)");
        document.getElementById('post-session-note').value = '';
    });
}

function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // Activate selected
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function showRandomScenario() {
    const display = document.getElementById('scenario-display');
    const text = document.getElementById('scenario-text');
    const inputArea = document.getElementById('intention-input-area');
    const feedback = document.getElementById('feedback-msg');

    // Reset UI
    feedback.classList.add('hidden');
    inputArea.classList.remove('hidden');
    document.getElementById('intention-input').value = '';

    // Pick Random
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    text.textContent = randomScenario;
    display.classList.remove('hidden');
}

function handleIntentionSubmit() {
    const input = document.getElementById('intention-input');
    if (!input.value.trim()) return;

    document.getElementById('intention-input-area').classList.add('hidden');
    document.getElementById('feedback-msg').classList.remove('hidden');
}
