// Prefetch is now handled by prefetch-utils.js
// Scene-specific initialization can be added here if needed

const canvas = document.querySelector(".canvas");
const textCanvas = document.querySelector(".text-canvas");
const cursorCanvas = document.querySelector(".cursor-canvas");
const loader = document.querySelector(".loader");
const progressText = document.getElementById("progress");
const loadingBar = document.querySelector('.loading-bar');
const breathingContainer = document.querySelector('.breathing-container');
const breathingInstruction = document.querySelector('.breathing-instruction');
const meditationBtn = document.getElementById('meditationBtn');
const meditationProgressRing = document.querySelector('.meditation-progress-ring-circle');
const linkButtonsContainer = document.querySelector('.link-buttons-container');
const nextSceneBtn = document.getElementById('nextSceneBtn');
const restartBtn = document.getElementById('restartBtn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const context = canvas.getContext("2d");

// Set up text canvas
textCanvas.width = window.innerWidth;
textCanvas.height = window.innerHeight;
const textContext = textCanvas.getContext("2d");

// Set up cursor canvas
cursorCanvas.width = window.innerWidth;
cursorCanvas.height = window.innerHeight;
const cursorContext = cursorCanvas.getContext("2d");

// Particle system for cursor
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 1.5 + 0.5;
    this.speedX = Math.random() * 1.5 - 0.75;
    this.speedY = Math.random() * 1.5 - 0.75;
    this.life = 1;
    this.color = `rgba(144, 238, 144, ${this.life})`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.015;
    this.color = `rgba(144, 238, 144, ${this.life})`;
  }

  draw() {
    cursorContext.fillStyle = this.color;
    cursorContext.beginPath();
    cursorContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    cursorContext.fill();
  }
}

let particles = [];
const maxParticles = 80;

function createParticles(x, y) {
  for (let i = 0; i < 3; i++) {
    if (particles.length < maxParticles) {
      particles.push(new Particle(x, y));
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Mouse position tracking
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

// Add mouse move event listener
document.addEventListener('mousemove', (e) => {
  // Calculate mouse position relative to center of screen
  mouseX = (e.clientX - window.innerWidth / 2) * 0.02;
  mouseY = (e.clientY - window.innerHeight / 2) * 0.02;
  
  // Create particles at cursor position
  createParticles(e.clientX, e.clientY);
});

// Add touch event listeners for mobile
document.addEventListener('touchstart', handleTouch);
document.addEventListener('touchmove', handleTouch);

function handleTouch(e) {
  e.preventDefault(); // Prevent default touch behavior
  
  // Get touch position
  const touch = e.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;
  
  // Calculate position relative to center of screen
  mouseX = (touchX - window.innerWidth / 2) * 0.02;
  mouseY = (touchY - window.innerHeight / 2) * 0.02;
  
  // Create particles at touch position
  createParticles(touchX, touchY);
}

// Detect mobile device
const isMobile = window.innerWidth <= 768; // Updated to standard mobile breakpoint

// Set frame count
const frameCount = 200; // Same frame count for both mobile and desktop

// Choose image folder based on device
const currentFrame = (index) =>
  isMobile
    ? `./Scene2_MO/${(index + 1).toString()}.webp`
    : `./Scene2_PC/${(index + 1).toString()}.webp`;

const images = [];
let ball = { frame: 0 };
let loadedImages = 0;

// Add state for frame holding
let isFrameHeld = false;
let heldFrame = 0;

let breathingState = 'inhale'; // 'inhale', 'hold', 'exhale'
let breathingInterval;
let breathingTimer;
const BREATHING_DURATION = 36000; // 36 seconds total (3 sets of 12 seconds each)
const CYCLE_DURATION = 12000; // 12 seconds total (4s inhale + 4s hold + 4s exhale)
const CIRCUMFERENCE = 534.07; // 2 * PI * 85 (radius)

// Update the loading progress display
function updateLoadingProgress(percent) {
  progressText.textContent = `${percent}%`;
  loadingBar.style.setProperty('--progress', `${percent}%`);
}

// ForestLoop video loading logic
const forestLoopVideo = document.getElementById('forestLoop');
let videoStarted = false;
let minimumVideoTime = 3000; // 3 seconds minimum video display
let videoStartTime = 0;

// Set video source based on device type
if (forestLoopVideo) {
  const videoSource = document.createElement('source');
  if (isMobile) {
    videoSource.src = './Load_Mo_F.webm';
    videoSource.type = 'video/webm';
  } else {
    videoSource.src = './Load_Pc_F.mp4';
    videoSource.type = 'video/mp4';
  }
  forestLoopVideo.appendChild(videoSource);
  
  // Load the video
  forestLoopVideo.load();
}

// Handle video loading
if (forestLoopVideo) {
  forestLoopVideo.addEventListener('loadeddata', () => {
    console.log('ForestLoop video loaded successfully');
    videoStarted = true;
    videoStartTime = Date.now();
  });
}

// Preload all frames
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  img.onerror = () => {
    console.warn(`Failed to load frame ${i + 1}`);
    loadedImages++;
    checkLoadingComplete();
  };
  img.onload = () => {
    loadedImages++;
    checkLoadingComplete();
  };
  images.push(img);
}

// Check if loading is complete and hide loader
function checkLoadingComplete() {
  if (loadedImages === frameCount) {
    const elapsedTime = Date.now() - videoStartTime;
    const remainingTime = Math.max(0, minimumVideoTime - elapsedTime);
    
    setTimeout(() => {
      // Fade out loader with video
      gsap.to(loader, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          loader.style.display = "none";
          // Show floating UI after loader is hidden
          const floatingUI = document.querySelector('.floating-ui-bar');
          if (floatingUI) {
            floatingUI.classList.add('show');
          }
          
          // Smooth entry animation for scene elements
          gsap.fromTo([canvas, textCanvas, cursorCanvas], {
            opacity: 0
          }, {
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
          });
          
          render();
        }
      });
    }, remainingTime);
  }
}

// Scroll animation with GSAP
gsap.to(ball, {
  frame: frameCount - 1,
  snap: "frame",
  ease: "none",
  scrollTrigger: {
    scrub: 0.0,
    pin: "canvas",
    end: () => `+=${window.innerHeight * 2}`, // Reduced scroll length
  },
  onUpdate: () => {
    render();
  },
});

// Animation loop for smooth parallax and cursor
function animate() {
  // Clear cursor canvas
  cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  
  // Update and draw particles
  updateParticles();
  
  // Smooth interpolation for mouse movement with slower speed
  currentX += (mouseX - currentX) * 0.03;
  currentY += (mouseY - currentY) * 0.03;
  
  // Apply the transform to the text canvas
  textCanvas.style.transform = `translate(${currentX}px, ${currentY}px)`;
  
  requestAnimationFrame(animate);
}

// Start the animation loop
animate();

let lastGoodImage = null;

// Render current frame with graceful fallback for missing frames
function render() {
  context.canvas.width = images[0].width;
  context.canvas.height = images[0].height;
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Use held frame if button was completed
  const frameToShow = isFrameHeld ? heldFrame : ball.frame;
  const idx = Math.max(0, Math.min(images.length - 1, Math.round(frameToShow)));
  const img = images[idx];

  if (img && img.complete && img.naturalWidth > 0) {
    context.drawImage(img, 0, 0);
    lastGoodImage = img;
  } else if (lastGoodImage) {
    context.drawImage(lastGoodImage, 0, 0);
  } else {
    context.fillStyle = '#171717';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Show link buttons in frames 180-200
  if (ball.frame >= 180) {
    linkButtonsContainer.style.display = 'flex';
    linkButtonsContainer.style.opacity = '1';
  } else {
    linkButtonsContainer.style.opacity = '0';
    setTimeout(() => {
      if (ball.frame < 180) {
        linkButtonsContainer.style.display = 'none';
      }
    }, 500);
  }
}

// Add resize handler to update mobile detection
window.addEventListener('resize', () => {
  const wasMobile = isMobile;
  isMobile = window.innerWidth <= 768;
  
  // If mobile state changed, reload the appropriate frames
  if (wasMobile !== isMobile) {
    // Clear existing images
    images.length = 0;
    loadedImages = 0;
    
    // Reload frames with same frame count but different folder
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      img.onload = () => {
        loadedImages++;
        let percent = Math.floor((loadedImages / frameCount) * 100);
        updateLoadingProgress(percent);
        
        if (loadedImages === frameCount) {
          render();
        }
      };
      images.push(img);
    }
  }
});

const navigateTo = (url) => {
  gsap.to([canvas, textCanvas, cursorCanvas, linkButtonsContainer], {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      window.location.href = url;
    }
  });
};

nextSceneBtn.addEventListener('click', () => {
  window.open('https://lk.spaceylon.com/pages/forest-veda', '_blank');
});
restartBtn.addEventListener('click', () => navigateTo('index_s3.html'));
