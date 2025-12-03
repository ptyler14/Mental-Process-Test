// Focus Wheel — placement + CCW rotation + correct reflection highlight

let centerText = '';
let statements = [];
let currentRotation = 0; // degrees applied to wheel (CSS rotate)
let reflectIndex = -1;

const slice = 360 / 12;

const stepCenter = document.getElementById('step-center');
const stepWheel = document.getElementById('step-wheel');
const stepComplete = document.getElementById('step-complete');

const centerInput = document.getElementById('center-input');
const startBtn = document.getElementById('start-wheel-btn');

const wheel = document.getElementById('wheel');
const segmentsContainer = document.getElementById('segments');
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
  const index = statements.length; // 0-based
  statements.push(text);
  statementInput.value = '';
  countDisplay.textContent = statements.length;
  // create element at its absolute slot (angle = slice * index)
  const radius = window.innerWidth < 600 ? 110 : 170;
  const angle = slice * index;
  const el = document.createElement('div');
  el.className = 'segment';
  el.id = `segment-${index}`;
  // inner span used for highlight styling (so we don't need to override transform)
  const span = document.createElement('span');
  span.textContent = text;
  el.appendChild(span);
  el.style.transform = `rotate(${angle}deg) translate(${radius}px)`;
  el.dataset.base = el.style.transform;
  segmentsContainer.appendChild(el);

  // AFTER adding, rotate the wheel CCW by one slice (negative rotation)
  currentRotation += -slice;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  // keep center upright (counter-rotate)
  wheelCenter.style.transform = `translate(-50%,-50%) rotate(${-currentRotation}deg)`;

  // Celebrate when we hit 12
  if (statements.length === 12) {
    wheel.classList.add('spin-fast');
    setTimeout(() => {
      wheel.classList.remove('spin-fast');
      completeWheel();
    }, 1800);
  }
}

function completeWheel() {
  stepWheel.classList.add('hidden');
  stepComplete.classList.remove('hidden');

  // clone current wheel to final area; ensure clone uses same transforms
  const clone = wheel.cloneNode(true);
  clone.id = 'wheel-final';
  clone.classList.remove('spin-fast');
  clone.style.transform = `rotate(${currentRotation}deg)`; // maintain last rotation state visually
  // ensure center in clone is upright
  const cloneCenter = clone.querySelector('#wheel-center');
  if (cloneCenter) cloneCenter.style.transform = `translate(-50%,-50%) rotate(${ -currentRotation }deg)`;
  finalWheelContainer.innerHTML = '';
  finalWheelContainer.appendChild(clone);

  // Reset reflect index so first click brings index 0 into 3:00 visually
  reflectIndex = -1;
}

function reflectNext() {
  const total = statements.length;
  if (!total) return;
  const finalWheel = document.getElementById('wheel-final');
  if (!finalWheel) return;

  // remove active from previous (inside final wheel)
  if (reflectIndex >= 0) {
    const prev = finalWheel.querySelector(`#segment-${reflectIndex}`);
    if (prev) {
      prev.classList.remove('active');
    }
  }

  // advance index (0 -> 1 -> 2 ...)
  reflectIndex = (reflectIndex + 1) % total;

  // compute target rotation so that selected item is at 3:00:
  // item at angle = slice * reflectIndex; to bring it to 0deg, rotate wheel by -angle
  const targetRotation = -reflectIndex * slice;
  finalWheel.style.transform = `rotate(${targetRotation}deg)`;

  // counter-rotate clone center to remain horizontal
  const cloneCenter = finalWheel.querySelector('#wheel-center');
  if (cloneCenter) {
    cloneCenter.style.transform = `translate(-50%,-50%) rotate(${ -targetRotation }deg)`;
  }

  // after rotation transition completes, mark active
  // allow same duration as CSS transition (~600ms); use setTimeout to add class after rotation
  setTimeout(() => {
    const sel = finalWheel.querySelector(`#segment-${reflectIndex}`);
    if (sel) {
      sel.classList.add('active');
      // keep its transform intact (it will be at 3:00 visually because the wheel rotated)
    }
  }, 620); // slightly longer than CSS transition for smoothness
}

// redraw on resize with same placement logic (keeps currentRotation unchanged)
window.addEventListener('resize', () => {
  // update radius transforms for each segment
  const radius = window.innerWidth < 600 ? 110 : 170;
  const segs = document.querySelectorAll('.segment');
  segs.forEach(s => {
    const id = s.id;
    if (!id) return;
    const idx = parseInt(id.split('-')[1], 10);
    if (isNaN(idx)) return;
    s.style.transform = `rotate(${slice * idx}deg) translate(${radius}px)`;
    s.dataset.base = s.style.transform;
  });
});
