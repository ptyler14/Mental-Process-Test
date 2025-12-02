// --------------------------------------------------
// Focus Wheel Tool (No Supabase) — Clean, Stable Logic
// --------------------------------------------------

let centerText = "";
let statements = [];
let currentIndex = -1; // For reflection mode

// DOM references
const stepCenter = document.getElementById("step-center");
const stepWheel = document.getElementById("step-wheel");
const stepComplete = document.getElementById("step-complete");

const centerInput = document.getElementById("center-input");
const startBtn = document.getElementById("start-wheel-btn");

const wheel = document.getElementById("wheel");
const wheelCenter = document.getElementById("wheel-center");
const segmentsContainer = document.getElementById("segments");

const statementInput = document.getElementById("statement-input");
const addBtn = document.getElementById("add-btn");
const countDisplay = document.getElementById("count");

const finalWheelContainer = document.getElementById("final-wheel");
const reflectBtn = document.getElementById("reflect-btn");

//--------------------------------------------------
// EVENT LISTENERS
//--------------------------------------------------

startBtn.addEventListener("click", startWheel);
addBtn.addEventListener("click", addStatement);
reflectBtn.addEventListener("click", reflectNext);

centerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startWheel();
});

statementInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addStatement();
});

//--------------------------------------------------
// STEP 1 — START WHEEL
//--------------------------------------------------
function startWheel() {
    const text = centerInput.value.trim();
    if (!text) return alert("Please enter a center desire.");

    centerText = text;
    wheelCenter.textContent = centerText;

    stepCenter.classList.add("hidden");
    stepWheel.classList.remove("hidden");

    statementInput.focus();
}

//--------------------------------------------------
// STEP 2 — ADD STATEMENTS
//--------------------------------------------------
function addStatement() {
    const text = statementInput.value.trim();
    if (!text) return;

    statements.push(text);
    statementInput.value = "";

    countDisplay.textContent = statements.length;
    drawSegments();

    if (statements.length === 12) {
        setTimeout(completeWheel, 400);
    }
}

//--------------------------------------------------
// DRAW SEGMENTS AROUND WHEEL
//--------------------------------------------------
function drawSegments() {
    segmentsContainer.innerHTML = "";

    const total = statements.length;
    const radius = window.innerWidth < 600 ? 110 : 170;

    statements.forEach((text, i) => {
        const angle = (360 / 12) * i;

        const el = document.createElement("div");
        el.className = "segment";
        el.id = `segment-${i}`;
        el.textContent = text;

        // Position around circle
        el.style.transform = `rotate(${angle}deg) translate(${radius}px)`;
        el.dataset.base = el.style.transform;

        segmentsContainer.appendChild(el);
    });
}

//--------------------------------------------------
// STEP 3 — COMPLETION
//--------------------------------------------------
function completeWheel() {
    stepWheel.classList.add("hidden");
    stepComplete.classList.remove("hidden");

    // Clone final wheel so layout stays stable
    const clone = wheel.cloneNode(true);
    clone.id = "wheel-final";
    finalWheelContainer.innerHTML = "";
    finalWheelContainer.appendChild(clone);

    // Reset highlight position
    currentIndex = -1;
}

//--------------------------------------------------
// REFLECTION ROTATION
//--------------------------------------------------
function reflectNext() {
    const total = statements.length;
    if (total === 0) return;

    // Unhighlight previous
    if (currentIndex >= 0) {
        const oldEl = document.getElementById(`segment-${currentIndex}`);
        if (oldEl) {
            oldEl.classList.remove("highlight");
            oldEl.style.transform = oldEl.dataset.base;
        }
    }

    // Move index
    currentIndex = (currentIndex + 1) % total;

    // Rotate final wheel clone
    const finalWheel = document.getElementById("wheel-final");
    const targetRotation = currentIndex * (360 / 12);
    finalWheel.style.transform = `rotate(${targetRotation}deg)`;

    // Highlight selected
    const selected = document.getElementById(`segment-${currentIndex}`);
    if (selected) {
        selected.classList.add("highlight");
    }
}
