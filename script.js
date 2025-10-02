const swiper = new Swiper('#mainSwiper', {
  slidesPerView: 1,
  loop: false,
  speed: 300,
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  pagination: { el: '.swiper-pagination', clickable: true },
});

let selectedBox = null;
let dragging = false;
let offsetX = 0, offsetY = 0;

const addBtn = document.getElementById('addTextBtn');
const fontFamily = document.getElementById('fontFamily');
const fontSize = document.getElementById('fontSize');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontColor = document.getElementById('fontColor');

const defaultCaptions = [
  'Welcome to Slide 1',
  'This is Slide 2',
  'Final Slide 3'
];

function getActiveTextLayer() {
  const activeDomSlide = document.querySelector('#mainSwiper .swiper-slide.swiper-slide-active');
  if (activeDomSlide) {
    const layer = activeDomSlide.querySelector('.text-layer');
    if (layer) return layer;
  }
  const real = (typeof swiper.realIndex === 'number') ? swiper.realIndex : swiper.activeIndex;
  return document.querySelector(`#mainSwiper .swiper-slide[data-slide="${real}"] .text-layer`);
}

function deselect() {
  if (selectedBox) selectedBox.classList.remove('selected');
  selectedBox = null;
}

function selectBox(el) {
  if (selectedBox && selectedBox !== el) selectedBox.classList.remove('selected');
  selectedBox = el;
  selectedBox.classList.add('selected');
  const cs = getComputedStyle(selectedBox);
  fontFamily.value = cs.fontFamily || fontFamily.value;
  fontSize.value = parseInt(cs.fontSize, 10) || fontSize.value;
  fontSizeDisplay.textContent = (parseInt(cs.fontSize, 10) || fontSize.value) + 'px';
  fontColor.value = rgbToHex(cs.color) || fontColor.value;
}

function rgbToHex(rgb) {
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  const r = (+m[1]).toString(16).padStart(2,'0');
  const g = (+m[2]).toString(16).padStart(2,'0');
  const b = (+m[3]).toString(16).padStart(2,'0');
  return `#${r}${g}${b}`;
}

function clampBoxToLayer(box, layer, x, y) {
  const l = layer.getBoundingClientRect();
  const bw = box.offsetWidth;
  const bh = box.offsetHeight;
  const left = Math.max(0, Math.min(x, l.width - bw));
  const top  = Math.max(0, Math.min(y, l.height - bh));
  return { left, top };
}

function centerBoxInLayer(box, layer) {
  if (box.parentElement !== layer) layer.appendChild(box);
  box.style.left = '0px';
  box.style.top = '0px';
  const l = layer.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const x = (l.width - b.width) / 2;
  const y = (l.height - b.height) / 2;
  const pos = clampBoxToLayer(box, layer, x, y);
  box.style.left = `${pos.left}px`;
  box.style.top = `${pos.top}px`;
}

function makeTextBox(text) {
  const div = document.createElement('div');
  div.className = 'text-box';
  div.contentEditable = 'true';
  div.tabIndex = 0;
  div.textContent = text;
  return div;
}

function onPointerDown(e) {
  const box = e.currentTarget;
  selectBox(box);
  const layer = box.parentElement;
  const lRect = layer.getBoundingClientRect();
  const bRect = box.getBoundingClientRect();
  dragging = true;
  swiper.allowTouchMove = false;
  offsetX = e.clientX - bRect.left;
  offsetY = e.clientY - bRect.top;
  box.classList.add('dragging');
  if (box.setPointerCapture) box.setPointerCapture(e.pointerId);

  function onPointerMove(ev) {
    if (!dragging) return;
    const x = ev.clientX - lRect.left - offsetX;
    const y = ev.clientY - lRect.top - offsetY;
    const pos = clampBoxToLayer(box, layer, x, y);
    box.style.left = `${pos.left}px`;
    box.style.top = `${pos.top}px`;
  }

  function onPointerUp() {
    dragging = false;
    swiper.allowTouchMove = true;
    box.classList.remove('dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

function addDefaultBoxes() {
  const slides = Array.from(document.querySelectorAll('#mainSwiper .swiper-slide'));
  slides.forEach((slide, idx) => {
    const layer = slide.querySelector('.text-layer');
    if (!layer) return;
    if (layer.querySelector('.text-box')) return;
    const caption = defaultCaptions[idx] ?? `Slide ${idx + 1}`;
    const box = makeTextBox(caption);
    box.style.fontFamily = fontFamily.value;
    box.style.fontSize = `${parseInt(fontSize.value, 10)}px`;
    box.style.color = fontColor.value;
    box.addEventListener('pointerdown', onPointerDown);
    box.addEventListener('click', (e) => { e.stopPropagation(); selectBox(box); });
    box.addEventListener('focus', () => selectBox(box));
    layer.appendChild(box);
    centerBoxInLayer(box, layer);
  });
}

addBtn.addEventListener('click', () => {
  if (swiper.animating) {
    swiper.once('slideChangeTransitionEnd', () => addTextToActive());
  } else {
    addTextToActive();
  }
});

function addTextToActive() {
  const layer = getActiveTextLayer();
  if (!layer) return;
  const box = makeTextBox('New text');
  box.style.fontFamily = fontFamily.value;
  box.style.fontSize = `${parseInt(fontSize.value, 10)}px`;
  box.style.color = fontColor.value;
  box.addEventListener('pointerdown', onPointerDown);
  box.addEventListener('click', (e) => { e.stopPropagation(); selectBox(box); });
  box.addEventListener('focus', () => selectBox(box));
  layer.appendChild(box);
  centerBoxInLayer(box, layer);
  selectBox(box);
}

fontFamily.addEventListener('change', () => {
  if (selectedBox) selectedBox.style.fontFamily = fontFamily.value;
});

fontSize.addEventListener('input', () => {
  fontSizeDisplay.textContent = `${fontSize.value}px`;
  if (selectedBox) selectedBox.style.fontSize = `${parseInt(fontSize.value, 10)}px`;
});

fontColor.addEventListener('input', () => {
  if (selectedBox) selectedBox.style.color = fontColor.value;
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.text-box') || e.target.closest('.toolbar')) return;
  deselect();
});

window.addEventListener('resize', () => {
  const slides = Array.from(swiper.slides || []);
  slides.forEach(slide => {
    const layer = slide.querySelector('.text-layer');
    if (!layer) return;
    layer.querySelectorAll('.text-box').forEach(box => {
      const left = parseFloat(box.style.left || '0');
      const top  = parseFloat(box.style.top || '0');
      const pos = clampBoxToLayer(box, layer, left, top);
      box.style.left = `${pos.left}px`;
      box.style.top  = `${pos.top}px`;
    });
  });
});

swiper.on('slideChangeTransitionEnd', () => deselect());
requestAnimationFrame(addDefaultBoxes);
