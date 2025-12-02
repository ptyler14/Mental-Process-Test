// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
// Tasks have 3 owners: 'unsorted', 'me', 'universe'
let tasks = JSON.parse(localStorage.getItem('placemat_tasks')) || [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkUser();
    renderTasks();
    attachEventListeners();
});

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "../index.html"; 
    }
}

function attachEventListeners() {
    const taskInput = document.getElementById('new-task-input');
    const addBtn = document.getElementById('add-to-dump-btn');
    const clearBtn = document.getElementById('clear-all-btn');

    // Click "Add" -> Goes to Unsorted
    if (addBtn) addBtn.addEventListener('click', () => addTask());

    // Press Enter -> Goes to Unsorted
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm("Clear everything?")) {
                tasks = [];
                saveAndRender();
            }
        });
    }
}

// --- LOGIC ---

function addTask() {
    const taskInput = document.getElementById('new-task-input');
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        owner: 'unsorted', // Defaults to Brain Dump list
        completed: false
    };

    tasks.push(newTask);
    saveAndRender();
    
    taskInput.value = '';
    taskInput.focus();
}

// Move task to a new owner ('me', 'universe', or back to 'unsorted')
window.sortTask = (id, newOwner) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.owner = newOwner;
        saveAndRender();
    }
};

window.removeTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
};

function saveAndRender() {
    localStorage.setItem('placemat_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const dumpList = document.getElementById('brain-dump-list');
    const dumpSection = document.getElementById('brain-dump-section');
    const dumpCount = document.getElementById('dump-count');
    
    const listMe = document.getElementById('me-list');
    const listUniverse = document.getElementById('universe-list');
    const countMe = document.getElementById('me-count');
    const countUniverse = document.getElementById('universe-count');

    // Clear lists
    dumpList.innerHTML = '';
    listMe.innerHTML = '';
    listUniverse.innerHTML = '';
    
    let counts = { unsorted: 0, me: 0, universe: 0 };

    tasks.forEach(task => {
        counts[task.owner]++;

        const div = document.createElement('div');
        
        if (task.owner === 'unsorted') {
            // Unsorted Item (Has Me/Universe buttons)
            div.className = 'unsorted-item';
            div.innerHTML = `
                <span>${task.text}</span>
                <div class="sort-buttons">
                    <button class="sort-btn sort-me" onclick="sortTask(${task.id}, 'me')">Me</button>
                    <button class="sort-btn sort-universe" onclick="sortTask(${task.id}, 'universe')">Universe</button>
                    <button class="delete-btn" onclick="removeTask(${task.id})" style="font-size:1rem">&times;</button>
                </div>
            `;
            dumpList.appendChild(div);
        } else {
            // Sorted Item (Has "Move" button to swap columns)
            div.className = 'task-item';
            const moveBtnText = task.owner === 'me' ? '➔ Universe' : '➔ Me';
            const moveBtnAction = task.owner === 'me' ? 'universe' : 'me';
            
            div.innerHTML = `
                <span>${task.text}</span>
                <div style="display:flex; align-items:center;">
                    <button class="text-btn small-btn" style="margin:0; margin-right:10px; font-size:0.7rem;" onclick="sortTask(${task.id}, '${moveBtnAction}')">${moveBtnText}</button>
                    <button class="delete-btn" onclick="removeTask(${task.id})">&times;</button>
                </div>
            `;
            
            if (task.owner === 'me') listMe.appendChild(div);
            else listUniverse.appendChild(div);
        }
    });

    // Update Counts
    dumpCount.textContent = counts.unsorted;
    countMe.textContent = counts.me;
    countUniverse.textContent = counts.universe;

    // Show Brain Dump section if it has items
    if (counts.unsorted > 0) {
        dumpSection.classList.remove('hidden');
    } else {
        dumpSection.classList.add('hidden');
    }
}
