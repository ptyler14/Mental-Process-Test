// DOM Elements
const desireInput = document.getElementById('desireInput');
const statementInput = document.getElementById('statementInput');
const addStatementBtn = document.getElementById('addStatementBtn');
const clearBtn = document.getElementById('clearBtn');
const startFocusBtn = document.getElementById('startFocusBtn');
const statementsList = document.getElementById('statementsList');
const timerSection = document.getElementById('timerSection');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const nextStatementBtn = document.getElementById('nextStatementBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');
const completionMessage = document.getElementById('completionMessage');
const newWheelBtn = document.getElementById('newWheelBtn');
const currentPosition = document.getElementById('currentPosition');
const currentStatementText = document.getElementById('currentStatementText');
const completedDesire = document.getElementById('completedDesire');
const centerDesire = document.getElementById('centerDesire');
const wheelOuter = document.getElementById('wheelOuter');

// Step indicators
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

// State variables
let statements = [];
let currentStatementIndex = 0;
let timerInterval = null;
let timeLeft = 17;
let isTimerRunning = false;

// Initialize wheel lines
function initializeWheel() {
    wheelOuter.innerHTML = '';
    // Create 12 lines for the wheel
    for (let i = 0; i < 12; i++) {
        const line = document.createElement('div');
        line.className = 'wheel-line';
        line.style.transform = `rotate(${i * 30}deg)`;
        wheelOuter.appendChild(line);
        
        // Create position indicators
        const position = document.createElement('div');
        position.className = 'statement-position';
        
        // Calculate position around the circle
        const angle = i * 30 * (Math.PI / 180);
        const radius = 180; // Half of wheel width
        const x = radius * Math.sin(angle);
        const y = -radius * Math.cos(angle);
        
        position.style.transform = `translate(${x}px, ${y}px)`;
        position.textContent = i + 1;
        position.id = `pos${i + 1}`;
        wheelOuter.appendChild(position);
    }
}

// Call initialization
initializeWheel();

// Update the wheel visualization
function updateWheel() {
    // Reset all positions
    for (let i = 1; i <= 12; i++) {
        const posElement = document.getElementById(`pos${i}`);
        if (posElement) {
            posElement.style.backgroundColor = '';
            posElement.style.color = '#4a6fa5';
            posElement.style.borderRadius = '';
            posElement.style.padding = '';
        }
    }
    
    // Highlight filled positions
    statements.forEach((stmt, index) => {
        const posElement = document.getElementById(`pos${index + 1}`);
        if (posElement) {
            posElement.style.backgroundColor = '#4a6fa5';
            posElement.style.color = 'white';
            posElement.style.borderRadius = '50%';
            posElement.style.padding = '5px';
            posElement.style.width = '30px';
            posElement.style.height = '30px';
            posElement.style.display = 'flex';
            posElement.style.alignItems = 'center';
            posElement.style.justifyContent = 'center';
        }
    });
    
    // Update current position indicator
    currentPosition.textContent = statements.length + 1;
}

// Update step indicators
function updateSteps() {
    // Step 1 is always active
    step1.classList.add('active');
    
    // Step 2: Active if desire is set
    if (desireInput.value.trim()) {
        step2.classList.add('active');
        step2.classList.add('completed');
    } else {
        step2.classList.remove('active');
        step2.classList.remove('completed');
    }
    
    // Step 3: Active if all statements are added
    if (statements.length === 12) {
        step3.classList.add('active');
        step3.classList.add('completed');
        startFocusBtn.disabled = false;
    } else {
        step3.classList.remove('active');
        step3.classList.remove('completed');
        startFocusBtn.disabled = true;
    }
    
    // Step 4: Active when timer is complete
    // Handled separately
}

// Update center desire text
desireInput.addEventListener('input', function() {
    const text = this.value.trim();
    centerDesire.textContent = text || 'Your desire goes here';
    updateSteps();
});

// Add statement to the wheel
addStatementBtn.addEventListener('click', function() {
    const statement = statementInput.value.trim();
    const desire = desireInput.value.trim();
    
    if (!desire) {
        alert('Please enter your central desire first.');
        desireInput.focus();
        return;
    }
    
    if (!statement) {
        alert('Please enter a belief statement.');
        statementInput.focus();
        return;
    }
    
    if (statements.length >= 12) {
        alert('You can only add 12 statements to the Focus Wheel.');
        return;
    }
    
    // Add statement to array
    statements.push(statement);
    
    // Add statement to the list
    const statementItem = document.createElement('div');
    statementItem.className = 'statement-item';
    statementItem.id = `statement-${statements.length}`;
    statementItem.innerHTML = `
        <span class="number">${statements.length}</span>
        <span class="statement-text">${statement}</span>
    `;
    statementsList.appendChild(statementItem);
    
    // Clear the input
    statementInput.value = '';
    
    // Update wheel and UI
    updateWheel();
    updateSteps();
    
    // Scroll to new statement
    statementItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // If we have 12 statements, show start focus button
    if (statements.length === 12) {
        startFocusBtn.disabled = false;
        alert('Great! You have added all 12 statements. Now click "Start Focus Timer" to begin the 17-second focusing process.');
    }
    
    // Update statement input label
    currentPosition.textContent = statements.length + 1;
    
    // Focus back on statement input
    statementInput.focus();
});

// Also allow Enter key to add statement (but Shift+Enter for new line)
statementInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addStatementBtn.click();
    }
});

// Start the focus timer process
startFocusBtn.addEventListener('click', function() {
    if (statements.length !== 12) {
        alert('Please add all 12 statements before starting the focus timer.');
        return;
    }
    
    // Show timer section
    timerSection.style.display = 'block';
    
    // Start with first statement
    currentStatementIndex = 0;
    startFocusOnStatement(currentStatementIndex);
    
    // Update steps
    step3.classList.add('active');
    step3.classList.add('completed');
    step4.classList.remove('active');
    step4.classList.remove('completed');
    
    // Scroll to timer
    timerSection.scrollIntoView({ behavior: 'smooth' });
});

// Start focusing on a specific statement
function startFocusOnStatement(index) {
    // Reset timer
    timeLeft = 17;
    timerDisplay.textContent = timeLeft;
    currentStatementText.textContent = statements[index];
    
    // Highlight current statement in list
    document.querySelectorAll('.statement-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`statement-${index + 1}`).classList.add('active');
    
    // Update wheel highlight
    updateWheel();
    const posElement = document.getElementById(`pos${index + 1}`);
    if (posElement) {
        posElement.style.backgroundColor = '#6d5dfc';
    }
    
    // Reset timer button states
    startTimerBtn.disabled = false;
    startTimerBtn.innerHTML = '<i class="fas fa-play"></i> Start Timer';
    nextStatementBtn.disabled = true;
}

// Start the 17-second timer
function startTimer() {
    if (isTimerRunning) return;
    
    isTimerRunning = true;
    startTimerBtn.disabled = true;
    startTimerBtn.innerHTML = '<i class="fas fa-pause"></i> Timing...';
    nextStatementBtn.disabled = true;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            
            // Play a gentle sound (optional)
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            audio.volume = 0.3;
            audio.play().catch(e => console.log("Audio play failed:", e));
            
            // Enable next button
            nextStatementBtn.disabled = false;
            startTimerBtn.innerHTML = '<i class="fas fa-check"></i> Complete!';
            
            // Show completion for this statement
            document.getElementById(`statement-${currentStatementIndex + 1}`).innerHTML += ' <i class="fas fa-check" style="color: #4CAF50;"></i>';
            
            // If this was the last statement, show completion message
            if (currentStatementIndex === 11) {
                setTimeout(showCompletion, 1000);
            }
        }
    }, 1000);
}

// Show completion message
function showCompletion() {
    // Hide timer section
    timerSection.style.display = 'none';
    
    // Show completion message
    completedDesire.textContent = desireInput.value.trim();
    completionMessage.classList.add('show');
    
    // Update steps
    step4.classList.add('active');
    step4.classList.add('completed');
    
    // Scroll to completion message
    completionMessage.scrollIntoView({ behavior: 'smooth' });
}

// Move to next statement
function nextStatement() {
    if (currentStatementIndex < 11) {
        currentStatementIndex++;
        startFocusOnStatement(currentStatementIndex);
    } else {
        showCompletion();
    }
}

// Reset timer for current statement
function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    startFocusOnStatement(currentStatementIndex);
}

// Event listeners for timer controls
startTimerBtn.addEventListener('click', startTimer);
nextStatementBtn.addEventListener('click', nextStatement);
resetTimerBtn.addEventListener('click', resetTimer);

// Clear all button
clearBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the entire Focus Wheel? This cannot be undone.')) {
        statements = [];
        statementsList.innerHTML = '';
        desireInput.value = '';
        statementInput.value = '';
        centerDesire.textContent = 'Your desire goes here';
        timerSection.style.display = 'none';
        completionMessage.classList.remove('show');
        currentStatementIndex = 0;
        clearInterval(timerInterval);
        isTimerRunning = false;
        updateWheel();
        updateSteps();
        startFocusBtn.disabled = true;
        currentPosition.textContent = '1';
        
        // Reset steps
        step2.classList.remove('active');
        step2.classList.remove('completed');
        step3.classList.remove('active');
        step3.classList.remove('completed');
        step4.classList.remove('active');
        step4.classList.remove('completed');
    }
});

// New wheel button
newWheelBtn.addEventListener('click', function() {
    statements = [];
    statementsList.innerHTML = '';
    statementInput.value = '';
    timerSection.style.display = 'none';
    completionMessage.classList.remove('show');
    currentStatementIndex = 0;
    clearInterval(timerInterval);
    isTimerRunning = false;
    updateWheel();
    updateSteps();
    startFocusBtn.disabled = true;
    currentPosition.textContent = '1';
    
    // Keep the desire but allow editing
    desireInput.focus();
    
    // Reset steps
    step2.classList.add('active');
    step2.classList.add('completed');
    step3.classList.remove('active');
    step3.classList.remove('completed');
    step4.classList.remove('active');
    step4.classList.remove('completed');
});

// Initialize steps
updateSteps();

// Add some example statements on first load (for demo purposes)
window.addEventListener('load', function() {
    // Check if this is the first visit to this page
    if (!localStorage.getItem('focusWheelVisited')) {
        // Set example desire
        desireInput.value = "I want to feel my personal power";
        centerDesire.textContent = desireInput.value;
        
        // Update localStorage so we don't show examples again
        localStorage.setItem('focusWheelVisited', 'true');
        
        // Update steps
        updateSteps();
    }
});
