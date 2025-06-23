/* app.js — final, fixed Scene-1 script
   ▸ Handles Retina scaling, resize, touch-blackout fix, particle cursor, GSAP ScrollTrigger
   ▸ Works for both desktop and mobile (switches folder Scene1_PC / Scene1_MO)
-------------------------------------------------------------------------- */

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// ───────────────────────────────── CONSTANTS ───────────────────────────────
const FRAME_COUNT = 200;          // total image frames
const MOBILE_BREAK = 768;         // px

// ───────────────────────────────── ELEMENTS ────────────────────────────────
const canvas               = document.querySelector('.canvas');
const textCanvas           = document.querySelector('.text-canvas');
const cursorCanvas         = document.querySelector('.cursor-canvas');
const loader               = document.querySelector('.loader');
const progressText         = document.getElementById('progress');
const loadingBar           = document.querySelector('.loading-bar');
const linkButtonsContainer = document.querySelector('.link-buttons-container');
const exploreBtn           = document.getElementById('exploreForestVedaBtn');

// ─────────────────────────────── NAVIGATION ────────────────────────────────
exploreBtn.addEventListener('click', () => {
  gsap.to([canvas, textCanvas, cursorCanvas, linkButtonsContainer], {
    opacity: 0,
    duration: 0.5,
    onComplete() { window.location.href = 'index_s2.html'; }
  });
});

// ──────────────────────── CANVAS SIZE & RETINA DPR ─────────────────────────
function setCanvasSize(c) {
  const dpr = window.devicePixelRatio || 1;
  c.width  = window.innerWidth  * dpr;
  c.height = window.innerHeight * dpr;
  const ctx = c.getContext('2d');
  ctx.resetTransform?.();
  ctx.scale(dpr, dpr);
}
[canvas, textCanvas, cursorCanvas].forEach(setCanvasSize);

// ────────────────────────── MOBILE / DESKTOP FLAG ──────────────────────────
let isMobile = window.innerWidth <= MOBILE_BREAK;

// Resize → rescale canvases + reload frames if breakpoint flips
window.addEventListener('resize', () => {
  const prevMobile = isMobile;
  isMobile = window.innerWidth <= MOBILE_BREAK;
  [canvas, textCanvas, cursorCanvas].forEach(setCanvasSize);
  if (prevMobile !== isMobile) reloadFrames();   // swap to other folder
});

// ───────────────────────────── PARTICLE CURSOR ─────────────────────────────
class Particle {
  constructor(x, y) {
    this.x      = x;           this.y      = y;
    this.size   = Math.random() * 1.5 + 0.5;
    this.speedX = (Math.random() - 0.5) * 1.5;
    this.speedY = (Math.random() - 0.5) * 1.5;
    this.life   = 1;
  }
  update() { this.x += this.speedX; this.y += this.speedY; this.life -= 0.015; }
  draw(ctx) {
    ctx.fillStyle = `rgba(144,238,144,${this.life})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
  }
}
let particles = [];
const MAX_PARTICLES = 80;

function spawnParticles(x, y) {
  for (let i = 0; i < 3 && particles.length < MAX_PARTICLES; i++)
    particles.push(new Particle(x, y));
}
function renderParticles(ctx) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].life <= 0 ? particles.splice(i, 1) : particles[i].draw(ctx);
  }
}

// ───────────────────────────── MOUSE / TOUCH ───────────────────────────────
let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

function pointerMove(x, y) {
  mouseX = (x - window.innerWidth  / 2) * 0.02;
  mouseY = (y - window.innerHeight / 2) * 0.02;
  spawnParticles(x, y);
}
document.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
document.addEventListener('touchstart', touchHandler, { passive:false });
document.addEventListener('touchmove',  touchHandler, { passive:false });
function touchHandler(e) {
  if (e.cancelable) e.preventDefault();
  const t = e.touches[0];
  pointerMove(t.clientX, t.clientY);
}

// ───────────────────────────── IMAGE FRAMES ────────────────────────────────
let images = [];

const framePath = i =>
  (isMobile ? './Scene1_MO/' : './Scene1_PC/') + (i+1) + '.webp';

function preloadFrames() {
  images = [];
  let loaded = 0;

  const updateProgress = () => {
    const pct = Math.floor((loaded / FRAME_COUNT) * 100);
    progressText.textContent = `${pct}%`;
    loadingBar.style.setProperty('--progress', `${pct}%`);
    if (loaded === FRAME_COUNT) finishLoading();
  };

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = img.onerror = () => { loaded++; updateProgress(); };
    img.src = framePath(i);
    images.push(img);
  }
}

function finishLoading() {
  gsap.to(loader, {
    opacity: 0, duration: 0.5,
    onComplete() {
      loader.remove();
      ScrollTrigger.refresh();
      gsap.fromTo([canvas, textCanvas, cursorCanvas],
        {opacity:0}, {opacity:1, duration:0.8, ease:'power2.out'});
    }
  });
  renderFrame();   // first draw
}

function reloadFrames() { preloadFrames(); }

// ───────────────────────── GSAP SCROLL ANIMATION ───────────────────────────
const ball = { frame: 0 };
gsap.to(ball, {
  frame: FRAME_COUNT - 1, snap:'frame', ease:'none',
  scrollTrigger: { scrub:0, pin:canvas, end: () => `+=${window.innerHeight*2}` },
  onUpdate: renderFrame
});

// ───────────────────────────── RENDER LOOP ─────────────────────────────────
function renderFrame() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[ball.frame];
  img && img.complete && ctx.drawImage(img, 0, 0);

  // reveal CTA in last 40 frames
  if (ball.frame >= 160) {
    linkButtonsContainer.style.display = 'flex';
    linkButtonsContainer.style.opacity = '1';
  } else {
    linkButtonsContainer.style.opacity = '0';
    setTimeout(() => { if (ball.frame < 160) linkButtonsContainer.style.display='none'; }, 500);
  }
}

// Parallax + particle loop
function animate() {
  const cctx = cursorCanvas.getContext('2d');
  cctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  renderParticles(cctx);

  curX += (mouseX - curX) * 0.03;
  curY += (mouseY - curY) * 0.03;
  textCanvas.style.transform = `translate(${curX}px, ${curY}px)`;

  requestAnimationFrame(animate);
}

// ───────────────────────────── STARTUP ─────────────────────────────────────
preloadFrames();
animate();