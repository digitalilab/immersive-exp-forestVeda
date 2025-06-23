// app.js — complete fixed Scene-1 script with iOS Safari blackout fixes

// Prefetch is now handled by prefetch-utils.js
// Scene-specific initialization can be added here if needed

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- CONSTANTS --------------------------------------------------------------
const FRAME_COUNT = 200;

// --- ELEMENT SELECTORS ------------------------------------------------------
const canvas               = document.querySelector('.canvas');
const textCanvas           = document.querySelector('.text-canvas');
const cursorCanvas         = document.querySelector('.cursor-canvas');
const loader               = document.querySelector('.loader');
const progressText         = document.getElementById('progress');
const loadingBar           = document.querySelector('.loading-bar');
const linkButtonsContainer = document.querySelector('.link-buttons-container');
const exploreForestVedaBtn = document.getElementById('exploreForestVedaBtn');

// --- NAVIGATION -------------------------------------------------------------
const navigateTo = (url) => {
  gsap.to(
    [canvas, textCanvas, cursorCanvas, linkButtonsContainer],
    {
      opacity: 0,
      duration: 0.5,
      onComplete() { window.location.href = url; }
    }
  );
};
exploreForestVedaBtn.addEventListener('click', () => navigateTo('index_s2.html'));

// --- CANVAS SIZING & DPR ----------------------------------------------------
function setCanvasSize(c) {
  const dpr = window.devicePixelRatio || 1;
  c.width  = window.innerWidth  * dpr;
  c.height = window.innerHeight * dpr;
  const ctx = c.getContext('2d');
  if (ctx.resetTransform) ctx.resetTransform();
  ctx.scale(dpr, dpr);
}
[canvas, textCanvas, cursorCanvas].forEach(setCanvasSize);

// --- DEVICE DETECTION & RESIZE ----------------------------------------------
let isMobile = window.innerWidth <= 768;
window.addEventListener('resize', () => {
  const prev = isMobile;
  isMobile = window.innerWidth <= 768;
  [canvas, textCanvas, cursorCanvas].forEach(setCanvasSize);
  if (prev !== isMobile) reloadFrames();
});

// --- PARTICLE SYSTEM --------------------------------------------------------
class Particle {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.size   = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 1.5;
    this.speedY = (Math.random() - 0.5) * 1.5;
    this.life   = 1;
  }
  update() {
    this.x    += this.speedX;
    this.y    += this.speedY;
    this.life -= 0.015;
  }
  draw(ctx) {
    ctx.fillStyle = `rgba(144,238,144,${this.life})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
let particles = [];
const MAX_PARTICLES = 80;
function createParticles(x, y) {
  for (let i = 0; i < 3 && particles.length < MAX_PARTICLES; i++) {
    particles.push(new Particle(x, y));
  }
}
function updateParticles(ctx) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    if (p.life <= 0) particles.splice(i, 1);
    else p.draw(ctx);
  }
}

// --- POINTER TRACKING -------------------------------------------------------
let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
function trackPointer(x, y) {
  mouseX = (x - window.innerWidth / 2) * 0.02;
  mouseY = (y - window.innerHeight / 2) * 0.02;
  createParticles(x, y);
}
document.addEventListener('mousemove', e => trackPointer(e.clientX, e.clientY));
document.addEventListener('touchstart', handleTouch, { passive: false });
document.addEventListener('touchmove',  handleTouch, { passive: false });
function handleTouch(e) {
  if (e.cancelable) e.preventDefault();
  const t = e.touches[0];
  trackPointer(t.clientX, t.clientY);
}

// --- IMAGE PRELOADING -------------------------------------------------------
let images = [];
function currentFrame(i) {
  return isMobile
    ? `./Scene1_MO/${i + 1}.webp`
    : `./Scene1_PC/${i + 1}.webp`;
}
function preload() {
  let loaded = 0;
  images = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      const pct = Math.floor((loaded / FRAME_COUNT) * 100);
      progressText.textContent = `${pct}%`;
      loadingBar.style.setProperty('--progress', `${pct}%`);
      if (loaded === FRAME_COUNT) finishLoading();
    };
    img.src = currentFrame(i);
    images.push(img);
  }
}
function finishLoading() {
  gsap.to(loader, {
    opacity: 0,
    duration: 0.5,
    onComplete() {
      loader.style.display = 'none';
      ScrollTrigger.refresh();
      gsap.fromTo(
        [canvas, textCanvas, cursorCanvas],
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }
  });
  render(); // initial draw
}
function reloadFrames() {
  preload();
}

// --- SCROLL-DRIVEN ANIMATION ------------------------------------------------
const ball = { frame: 0 };
gsap.to(ball, {
  frame: FRAME_COUNT - 1,
  snap: 'frame',
  ease: 'none',
  scrollTrigger: {
    scrub: 0,
    pin: canvas,
    end: () => `+=${window.innerHeight * 2}`
  },
  onUpdate: render
});

// --- RENDER FUNCTION --------------------------------------------------------
function render() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[ball.frame];
  if (img && img.complete) ctx.drawImage(img, 0, 0);

  if (ball.frame >= 160) {
    linkButtonsContainer.style.display = 'flex';
    linkButtonsContainer.style.opacity = '1';
  } else {
    linkButtonsContainer.style.opacity = '0';
    setTimeout(() => {
      if (ball.frame < 160) linkButtonsContainer.style.display = 'none';
    }, 500);
  }
}

// --- CURSOR & PARALLAX LOOP -------------------------------------------------
function animate() {
  const cctx = cursorCanvas.getContext('2d');
  cctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  updateParticles(cctx);

  currentX += (mouseX - currentX) * 0.03;
  currentY += (mouseY - currentY) * 0.03;
  textCanvas.style.transform = `translate(${currentX}px, ${currentY}px)`;

  requestAnimationFrame(animate);
}

// --- INITIALIZATION ---------------------------------------------------------
preload();
animate();