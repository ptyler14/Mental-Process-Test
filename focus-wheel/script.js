// Focus Wheel — Updated logic
// No Supabase. Pastel rainbow, spokes, corrected reflection, CCW rotation, celebration spin

let centerText = '';
let statements = [];
let reflectIndex = -1; // which statement is highlighted in final wheel

// DOM refs
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
centerInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') startWheel(); });
statementInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') addStatement(); });

function startWheel(){
  const val = centerInput.value.trim();
  if(!val) return alert('Please enter a center desire.');
  centerText = val;
  wheelCenter.textContent = centerText;
  stepCenter.classList.add('hidden');
  stepWheel.classList.remove('hidden');
  statementInput.focus();
}

function addStatement(){
  const text = statementInput.value.trim();
  if(!text) return;
  if(statements.length >= 12) return; // safety
  statements.push(text);
  statementInput.value = '';
  countDisplay.textContent = statements.length;
  drawSegments();
  if(statements.length === 12){
    // celebration spin on the original wheel, then show final
    wheel.classList.add('spin-fast');
    setTimeout(()=>{
      wheel.classList.remove('spin-fast');
      completeWheel();
    }, 1800);
  }
}

function drawSegments(){
  segmentsContainer.innerHTML = '';
  const total = 12; // always 12 slots even if fewer filled
  const radius = window.innerWidth < 600 ? 110 : 170;

  for(let i=0;i<statements.length;i++){
    const angle = (360/12)*i; // 0,30,60...
    const el = document.createElement('div');
    el.className = 'segment';
    el.id = `segment-${i}`;
    el.textContent = statements[i];
    el.style.transform = `rotate(${angle}deg) translate(${radius}px)`;
    el.dataset.base = el.style.transform;
    segmentsContainer.appendChild(el);
  }
}

function completeWheel(){
  stepWheel.classList.add('hidden');
  stepComplete.classList.remove('hidden');

  // clone the wheel so layout remains stable — use the cloned copy for reflection/highlight
  const clone = wheel.cloneNode(true);
  clone.id = 'wheel-final';
  clone.classList.remove('spin-fast');
  clone.style.transform = 'rotate(0deg)';

  // ensure center text inside clone is correct and upright
  const cloneCenter = clone.querySelector('#wheel-center');
  if(cloneCenter) cloneCenter.style.transform = 'translate(-50%,-50%) rotate(0deg)';

  finalWheelContainer.innerHTML = '';
  finalWheelContainer.appendChild(clone);

  // reset reflect index so it begins before first
  reflectIndex = -1;
}

function reflectNext(){
  const total = statements.length;
  if(total === 0) return;

  const finalWheel = document.getElementById('wheel-final');
  if(!finalWheel) return;

  // unhighlight previous inside final wheel
  if(reflectIndex >= 0){
    const prev = finalWheel.querySelector(`#segment-${reflectIndex}`);
    if(prev){
      prev.classList.remove('highlight');
      prev.style.transform = prev.dataset.base || prev.style.transform;
    }
  }

  // advance index (we want 0 -> 1 -> 2 ...)
  reflectIndex = (reflectIndex + 1) % total;

  // compute counter-clockwise rotation so first statement added appears first
  const slice = 360/12;
  const targetRotation = -reflectIndex * slice; // negative for CCW

  finalWheel.style.transform = `rotate(${targetRotation}deg)`;

  // counter-rotate the center text so it stays horizontal
  const cloneCenter = finalWheel.querySelector('#wheel-center');
  if(cloneCenter){
    cloneCenter.style.transform = `translate(-50%,-50%) rotate(${ -targetRotation }deg)`;
  }

  // highlight selected element inside final wheel
  const selected = finalWheel.querySelector(`#segment-${reflectIndex}`);
  if(selected){
    // set to highlighted layout
    selected.classList.add('highlight');
    // ensure it's positioned so the highlight sits to the right; override transform
    selected.style.transform = `rotate(${reflectIndex * slice}deg) translate(${ (window.innerWidth<600?110:170) }px)`; // ensure anchor rotation
    // then the .highlight CSS will translate it outward
  }
}

// handle window resize to redraw with appropriate radius
window.addEventListener('resize', ()=>{
  if(statements.length>0) drawSegments();
});
