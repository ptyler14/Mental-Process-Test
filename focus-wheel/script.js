/* FULL UPDATED SCRIPT.JS */

let centerText = '';
let statements = [];
let currentRotation = 0;
let reflectIndex = -1;
const slice = 360 / 12;

const stepCenter = document.getElementById('step-center');
const stepWheel = document.getElementById('step-wheel');
const stepComplete = document.getElementById('step-complete');

const centerInput = document.getElementById('center-input');
const startBtn = document.getElementById('start-wheel-btn');

const wheel = document.getElementById('wheel');
const segmentsContainer = document.getElementById('segments'); // rotate this, not wheelCenter
const wheelCenter = document.getElementById('wheel-center');

const statementInput = document.getElementById('statement-input');
const addBtn = document.getElementById('add-btn');
const countDisplay = document.getElementById('count');

const finalWheelContainer = document.getElementById('final-wheel');
const reflectBtn = document.getElementById('reflect-btn');

startBtn.addEventListener('click', startWheel);
addBtn.addEventListener('click', addStatement);
reflectBtn.addEventListener('click', reflectNext);
centerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') startWheel(); });
statementInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addStatement(); });

function startWheel() {
    const v = centerInput.value.trim();
    if (!v) return alert('Please enter a center desire.');
    centerText = v;
    wheelCenter.textContent = centerText;
    stepCenter.classList.add('hidden');
    stepWheel.classList.remove('hidden');
    statementInput.focus();
}

function addStatement() {
    const text = statementInput.value.trim();
    if (!text) return;
    if (statements.length >= 12) return;

    const index = statements.length;
    statementInput.value = '';

    statements.push(text);

    if (index > 0) {
        // Rotate the wheel segments
        currentRotation += -slice;
        segmentsContainer.style.transform = `rotate(${currentRotation}deg)`;
    }

    placeAtThree(text, index);

    countDisplay.textContent = statements.length;

    if (statements.length === 12) {
        wheel.classList.add('spin-fast');
        setTimeout(() => {
            wheel.classList.remove('spin-fast');
            completeWheel();
        }, 1800);
    }
}

function placeAtThree(text, index) {
    const radius = window.innerWidth < 600 ? 110 : 170;
    const textOffset = 28;
    const el = document.createElement('div');
    el.className = 'segment';
    el.id = `segment-${index}`;
    const span = document.createElement('span');
    span.textContent = text;
    el.appendChild(span);

    // Position at top of wheel (0°), rotation applied by container
    el.style.transform = `rotate(0deg) translate(${radius}px) translateY(-${textOffset}px)`;
    el.dataset.base = el.style.transform;

    segmentsContainer.appendChild(el);
}

function completeWheel() {
    stepWheel.classList.add('hidden');
    stepComplete.classList.remove('hidden');
    const clone = wheel.cloneNode(true);
    clone.id = 'wheel-final';
    const finalSegments = clone.querySelector('#segments');
    if (finalSegments) finalSegments.style.transform = `rotate(${currentRotation}deg)`;
    const cloneCenter = clone.querySelector('#wheel-center');
    if (cloneCenter) cloneCenter.style.transform = `translate(-50%, -50%)`; // fixed center
    finalWheelContainer.innerHTML = '';
    finalWheelContainer.appendChild(clone);
    reflectIndex = -1;
}

function reflectNext() {
    const total = statements.length;
    if (!total) return;
    const finalWheel = document.getElementById('wheel-final');
    if (!finalWheel) return;
    if (reflectIndex >= 0) {
        const prev = finalWheel.querySelector(`#segment-${reflectIndex}`);
        if (prev) prev.classList.remove('active');
    }
    reflectIndex = (reflectIndex + 1) % total;
    const targetRotation = -reflectIndex * slice;
    const finalSegments = finalWheel.querySelector('#segments');
    if (finalSegments) finalSegments.style.transform = `rotate(${targetRotation}deg)`;
    const cloneCenter = finalWheel.querySelector('#wheel-center');
    if (cloneCenter) cloneCenter.style.transform = `translate(-50%, -50%)`;
    setTimeout(() => {
        const sel = finalWheel.querySelector(`#segment-${reflectIndex}`);
        if (sel) sel.classList.add('active');
    }, 620);
}

// Adjust positions on resize
window.addEventListener('resize', () => {
    const radius = window.innerWidth < 600 ? 110 : 170;
    const segs = document.querySelectorAll('.segment');
    segs.forEach(s => {
        const id = s.id;
        if (!id) return;
        const idx = parseInt(id.split('-')[1], 10);
        if (isNaN(idx)) return;
        const textOffset = 28;
        s.style.transform = `rotate(0deg) translate(${radius}px) translateY(-${textOffset}px)`;
        s.dataset.base = s.style.transform;
    });
});
