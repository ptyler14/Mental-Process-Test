// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE ---
let tasks = JSON.parse(localStorage.getItem('placemat_tasks')) || [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    await checkUser();
    renderTasks();
    attachEventListeners();
});

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Redirect to Home if not logged in
        window.location.href = "../index.html"; 
    }
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    const taskInput = document.getElementById('new-task-input');
    const btnMe = document.getElementById('add-my-task');
    const btnUniverse = document.getElementById('add-universe-task');
    const clearBtn = document.getElementById('clear-all-btn');

    if (btnMe) btnMe.addEventListener('click', () => addTask('me'));
    if (btnUniverse) btnUniverse.addEventListener('click', () => addTask('universe'));

    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Default to "Me" on Enter, user can click buttons otherwise
                addTask('me'); 
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm("Clear the entire placemat?")) {
                tasks = [];
                saveAndRender();
            }
        });
    }
}

// --- LOGIC ---

function addTask(owner) {
    const taskInput = document.getElementById('new-task-input');
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        owner: owner, // 'me' or 'universe'
        completed: false
    };

    tasks.push(newTask);
    saveAndRender();
    
    taskInput.value = '';
    taskInput.focus();
}

// Make removeTask global so onclick works
window.removeTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
};

function saveAndRender() {
    localStorage.setItem('placemat_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const listMe = document.getElementById('me-list');
    const listUniverse = document.getElementById('universe-list');
    const countMe = document.getElementById('me-count');
    const countUniverse = document.getElementById('universe-count');

    if (!listMe || !listUniverse) return;

    listMe.innerHTML = '';
    listUniverse.innerHTML = '';
    
    let countM = 0;
    let countU = 0;

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
        // Add a slight fade animation for new items
        div.style.animation = 'popIn 0.3s ease-out';
        
        div.innerHTML = `
            <span>${task.text}</span>
            <button class="delete-btn" onclick="removeTask(${task.id})">&times;</button>
        `;

        if (task.owner === 'me') {
            listMe.appendChild(div);
            countM++;
        } else {
            listUniverse.appendChild(div);
            countU++;
        }
    });

    if (countMe) countMe.textContent = countM;
    if (countUniverse) countUniverse.textContent = countU;
}
