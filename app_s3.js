// Prefetch is now handled by prefetch-utils.js
// Scene-specific initialization can be added here if needed

const canvas = document.querySelector(".canvas");
const textCanvas = document.querySelector(".text-canvas");
const cursorCanvas = document.querySelector(".cursor-canvas");
const loader = document.querySelector(".loader");
const progressText = document.getElementById("progress");
const loadingBar = document.querySelector('.loading-bar');
const circularBtn = document.getElementById('circularBtn');
const circularBtnContainer = document.querySelector('.circular-button-container');
const progressRing = document.querySelector('.progress-ring-circle');
const meditationProgressRing = document.querySelector('.meditation-progress-ring-circle');
const breathingContainer = document.querySelector('.breathing-container');
const breathingInstruction = document.querySelector('.breathing-instruction');

const linkButtonsContainer = document.querySelector('.link-buttons-container');
const shopNowBtn = document.getElementById('shopNowBtn');
const seavedaBtn = document.getElementById('seavedaBtn');

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
    ? `./Scene3_MO/${(index + 1).toString()}.webp`
    : `./Scene3_PC/${(index + 1).toString()}.webp`;

const images = [];
let ball = { frame: 0 };
let loadedImages = 0;

// Add state for frame holding
let isFrameHeld = false;
let heldFrame = 0;

// Add state for meditation completion
let isMeditationCompleted = false;

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
  img.onload = async () => {
    if (img.decode) {
      try {
        await img.decode();
      } catch (_) {}
    }
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

          if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
          }

          updateFrame();
        }
      });
    }, remainingTime);
  }
}

// Scroll animation with GSAP
function updateFrame() {
  const frameToShow = isFrameHeld ? heldFrame : ball.frame;
  const idx = Math.max(0, Math.min(images.length - 1, Math.round(frameToShow)));
  if (idx !== currentFrameIndex) {
    currentFrameIndex = idx;
    requestAnimationFrame(render);
  }
}

gsap.to(ball, {
  frame: frameCount - 1,
  snap: "frame",
  ease: "none",
  scrollTrigger: {
    scrub: 0.0,
    pin: "canvas",
    end: () => `+=${window.innerHeight * 2}`, // Reduced scroll length
  },
  onUpdate: updateFrame,
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
  

  // Show circular button in frames 55-120 only if meditation hasn't been completed
  if (ball.frame >= 55 && ball.frame <= 120 && !isFrameHeld && !isMeditationCompleted) {
    circularBtnContainer.style.display = 'block';
    setTimeout(() => {
      circularBtnContainer.style.opacity = '1';
    }, 50);
  } else {
    circularBtnContainer.style.opacity = '0';
    setTimeout(() => {
      if (ball.frame < 55 || ball.frame > 120 || isMeditationCompleted) {
        circularBtnContainer.style.display = 'none';
      }
    }, 300);
  }
  
  requestAnimationFrame(animate);
}

// Start the animation loop
animate();

let lastGoodImage = null;
let currentFrameIndex = -1;

// Draw the current frame with graceful fallback for missing frames
let lastGoodIdx = 0;


// Render current frame with graceful fallback for missing frames
function render() {
  const img = images[currentFrameIndex];

  context.canvas.width = images[0].width;
  context.canvas.height = images[0].height;
  context.clearRect(0, 0, canvas.width, canvas.height);

  try {
    if (img && img.complete && img.naturalWidth > 0) {
      context.drawImage(img, 0, 0);
      lastGoodImage = img;
    } else if (lastGoodImage) {
      context.drawImage(lastGoodImage, 0, 0);
    } else {
      context.fillStyle = '#171717';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  } catch (err) {
    console.error('drawImage failed', err);
    if (lastGoodImage) {
      try {
        context.drawImage(lastGoodImage, 0, 0);
      } catch (_) {
        context.fillStyle = '#171717';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  // Use held frame if button was completed
  const frameToShow = isFrameHeld ? heldFrame : ball.frame;
  // Use held frame if button was completed
  const frameToShow = isFrameHeld ? heldFrame : ball.frame;
  const idx = Math.max(0, Math.min(images.length - 1, Math.round(frameToShow)));
  const img = images[idx];

  if (img && img.complete && img.naturalWidth > 0) {
    context.drawImage(img, 0, 0);
    lastGoodImage = img;
   lastGoodIdx = idx;
  } else if (lastGoodImage) {
    context.drawImage(lastGoodImage, 0, 0);
  } else {
    context.fillStyle = '#171717';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Show first circular button in frames 55-120
  if (ball.frame >= 55 && ball.frame <= 120 && !isFrameHeld) {
    circularBtnContainer.style.display = 'block';
    setTimeout(() => {
      circularBtnContainer.style.opacity = '1';
    }, 50);
  } else {
    circularBtnContainer.style.opacity = '0';
    setTimeout(() => {
      if (ball.frame < 55 || ball.frame > 120) {
        circularBtnContainer.style.display = 'none';
      }
    }, 300);
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
      img.onload = async () => {
        if (img.decode) {
          try {
            await img.decode();
          } catch (_) {}
        }
        loadedImages++;
        let percent = Math.floor((loadedImages / frameCount) * 100);
        updateLoadingProgress(percent);

        if (loadedImages === frameCount) {
          updateFrame();
        }
      };
      images.push(img);
    }
  }
});

// Circular button press and hold logic
let pressTimer;
let isHolding = false;
const HOLD_DURATION = 2000; // 2 seconds

// Prevent default touch behavior for the button
circularBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });

circularBtn.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

function startHold(e) {
  // Prevent default behavior for both mouse and touch events
  if (e) {
    e.preventDefault();
  }
  
  isHolding = true;
  let startTime = Date.now();
  
  // Add a subtle scale effect when starting to hold
  gsap.to(circularBtn, {
    scale: 0.98,
    duration: 0.2,
    ease: "power2.out"
  });
  
  // Clear any existing timer
  if (pressTimer) {
    clearInterval(pressTimer);
  }
  
  // Reset progress ring to empty state
  gsap.set(progressRing, {
    strokeDashoffset: CIRCUMFERENCE
  });
  
  pressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    
    // Update progress ring - fill up from empty
    gsap.to(progressRing, {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress),
      duration: 0.1,
      ease: "power1.out"
    });
    
    if (progress >= 1) {
      clearInterval(pressTimer);
      // Button action completed - start breathing exercise
      startBreathingExercise();
    }
  }, 16);
}

function endHold(e) {
  // Prevent default behavior for both mouse and touch events
  if (e) {
    e.preventDefault();
  }
  
  if (isHolding) {
    clearInterval(pressTimer);
    isHolding = false;
    
    // Reset button scale
    gsap.to(circularBtn, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    });
    
    // Only reset progress ring if the hold wasn't completed
    if (!pressTimer) {
      // Reset progress ring to empty state with animation
      gsap.to(progressRing, {
        strokeDashoffset: CIRCUMFERENCE,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }
}

// Mouse events
circularBtn.addEventListener('mousedown', startHold);
circularBtn.addEventListener('mouseup', endHold);
circularBtn.addEventListener('mouseleave', endHold);

// Touch events with improved handling
circularBtn.addEventListener('touchstart', (e) => {
  startHold(e);
}, { passive: false });

circularBtn.addEventListener('touchend', (e) => {
  endHold(e);
}, { passive: false });

circularBtn.addEventListener('touchcancel', (e) => {
  endHold(e);
}, { passive: false });

// Prevent scrolling while holding the button
circularBtn.addEventListener('touchmove', (e) => {
  if (isHolding) {
  e.preventDefault();
  }
}, { passive: false });

function startBreathingExercise() {
  // Freeze the current frame
  isFrameHeld = true;
  heldFrame = ball.frame;
  
  // Disable scrolling during breathing exercise
  const scrollTriggerInstance = ScrollTrigger.getAll()[0];
  if (scrollTriggerInstance) {
    scrollTriggerInstance.disable();
  }
  
  // Hide inhale button with smooth transition
  gsap.to(circularBtn, {
    opacity: 0,
    scale: 0.8,
    duration: 0.8,
    ease: "power2.inOut",
    onComplete: () => {
      circularBtn.style.display = 'none';
      // Show breathing container with smooth transition
      breathingContainer.style.display = 'flex';
      gsap.fromTo(breathingContainer, 
        { 
          opacity: 0,
          scale: 0.95,
          backdropFilter: 'blur(0px)',
          backgroundColor: 'rgba(0, 0, 0, 0)'
        },
        { 
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }
      );
      startBreathingCycle();
    }
  });
}

function startBreathingCycle() {
  let cycleStartTime = Date.now();
  let lastState = null;
  const breathingCircle = document.querySelector('.breathing-circle');
  
  // Initialize rings with staggered animation
  gsap.set('.ring', {
    scale: 1,
    opacity: 0.4,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  });

  // Reset meditation progress ring and start smooth animation
  gsap.set(meditationProgressRing, {
    strokeDashoffset: CIRCUMFERENCE
  });

  // Create a smooth animation for the entire duration
  gsap.to(meditationProgressRing, {
    strokeDashoffset: 0,
    duration: BREATHING_DURATION / 1000, // Convert to seconds
    ease: "none", // Linear animation for consistent progress
    onUpdate: function() {
      const elapsed = (Date.now() - cycleStartTime) % CYCLE_DURATION;
      let newState;
      
      if (elapsed < 4000) {
        newState = 'inhale';
      } else if (elapsed < 8000) {
        newState = 'hold';
      } else {
        newState = 'exhale';
      }

      if (newState !== lastState) {
        lastState = newState;
        updateBreathingState(newState);
      }
    }
  });
  
  function updateBreathingState(newState) {
    // Update breathing instruction and visual effects
    gsap.to(breathingInstruction, {
      opacity: 0,
      y: -15,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        breathingInstruction.textContent = newState.toUpperCase();
        gsap.to(breathingInstruction, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
        });
      }
    });

    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    // Update breathing circle and rings
    gsap.to(breathingCircle, {
      duration: 0.5,
      ease: "power2.inOut",
      backgroundColor: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)',
      boxShadow: isSmallMobile ? 
          '0 0 50px rgba(255, 255, 255, 0.1), inset 0 0 25px rgba(255, 255, 255, 0.1)' :
          isMobile ? 
          '0 0 60px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.1)' :
          '0 0 80px rgba(255, 255, 255, 0.1), inset 0 0 40px rgba(255, 255, 255, 0.1)'
    });

    gsap.to('.ring', {
      duration: 0.5,
      ease: "power2.inOut",
      opacity: newState === 'exhale' ? 0 : 
              (newState === 'inhale' ? 0.3 : 0.25),
      borderColor: newState === 'exhale' ? 'rgba(255, 255, 255, 0.05)' :
                  (newState === 'inhale' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.12)'),
      stagger: 0.1
    });
  }

  // Initial state update
  updateBreathingState('inhale');

  // Set timer for 36 seconds
  breathingTimer = setTimeout(() => {
    stopBreathingExercise();
    gsap.to(window, {
      scrollTo: { y: 0, autoKill: false },
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => {
        window.scrollBy(0, 1);
      }
    });
  }, BREATHING_DURATION);
}

function stopBreathingExercise() {
  if (breathingTimer) {
    clearTimeout(breathingTimer);
    breathingTimer = null;
  }

  // Kill any ongoing GSAP animations but keep the final position
  gsap.killTweensOf(meditationProgressRing);
  
  // Ensure the progress ring stays at 100% (strokeDashoffset = 0)
  gsap.set(meditationProgressRing, {
    strokeDashoffset: 0
  });

  // Set meditation as completed
  isMeditationCompleted = true;

  // Smoothly hide breathing container with enhanced transition
  gsap.to(breathingContainer, {
    opacity: 0,
    scale: 0.95,
    duration: 0.8,
    ease: "power2.in",
    backdropFilter: 'blur(0px)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    onComplete: () => {
      breathingContainer.style.display = 'none';
      
      // Move user to frame 130 after breathing exercise
      ball.frame = 130;
      
      // Unfreeze the frame and re-enable scrolling
      isFrameHeld = false;
      
      // Re-enable ScrollTrigger
      const scrollTriggerInstance = ScrollTrigger.getAll()[0];
      if (scrollTriggerInstance) {
        scrollTriggerInstance.enable();
        // Update ScrollTrigger to match frame 130
        scrollTriggerInstance.progress(130 / (frameCount - 1));
      }
      
      // Render the current frame
      updateFrame();
    }
  });
}

// Add cleanup for breathing exercise
window.addEventListener('beforeunload', () => {
  stopBreathingExercise();
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

shopNowBtn.addEventListener('click', () => navigateTo('https://lk.spaceylon.com/pages/forest-veda'));
seavedaBtn.addEventListener('click', () => navigateTo('../SEA/index.html'));
