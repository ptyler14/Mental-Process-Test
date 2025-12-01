// --- ELEMENTS ---
const taskInput = document.getElementById('new-task-input');
const btnMe = document.getElementById('add-my-task');
const btnUniverse = document.getElementById('add-universe-task');
const listMe = document.getElementById('me-list');
const listUniverse = document.getElementById('universe-list');
const countMe = document.getElementById('me-count');
const countUniverse = document.getElementById('universe-count');
const clearBtn = document.getElementById('clear-all-btn');

// --- STATE ---
let tasks = JSON.parse(localStorage.getItem('placemat_tasks')) || [];

// --- INIT ---
renderTasks();

// --- LISTENERS ---
btnMe.addEventListener('click', () => addTask('me'));
btnUniverse.addEventListener('click', () => addTask('universe'));

// Allow "Enter" key to default to "Me" (or maybe Universe? Let's stick to buttons for intention)
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        // Defaulting Enter to "Me" for speed, but user can click Universe
        addTask('me');
    }
});

clearBtn.addEventListener('click', () => {
    if(confirm("Clear the entire placemat?")) {
        tasks = [];
        saveAndRender();
    }
});

// --- FUNCTIONS ---

function addTask(owner) {
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

function removeTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('placemat_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    listMe.innerHTML = '';
    listUniverse.innerHTML = '';
    
    let countM = 0;
    let countU = 0;

    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
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

    countMe.textContent = countM;
    countUniverse.textContent = countU;
}
