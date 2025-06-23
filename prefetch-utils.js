/**
 * Advanced Prefetch Utility for Forest Experience
 * Optimizes loading across all scenes with priority-based prefetching
 */

class PrefetchManager {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.userInteracted = false;
    this.prefetchedResources = new Set();
    this.init();
  }

  init() {
    this.setupCriticalPrefetching();
    this.setupUserInteractionPrefetching();
    this.setupPerformanceMonitoring();
  }

  setupCriticalPrefetching() {
    const currentScene = this.getCurrentScene();
    const nextScene = this.getNextScene(currentScene);
    
    if (nextScene) {
      this.prefetchCriticalResources(nextScene);
      this.prefetchInitialFrames(nextScene);
    }
  }

  getCurrentScene() {
    const path = window.location.pathname;
    if (path.includes('index_s3.html')) return 'scene2';
    if (path.includes('index_s2.html')) return 'scene3';
    return 'scene1';
  }

  getNextScene(currentScene) {
    const sceneMap = {
      'scene1': 'scene2',
      'scene2': 'scene3',
      'scene3': null
    };
    return sceneMap[currentScene];
  }

  prefetchCriticalResources(nextScene) {
    const criticalResources = this.getCriticalResources(nextScene);
    
    criticalResources.forEach(resource => {
      this.createPrefetchLink(resource, 'high');
    });
  }

  getCriticalResources(nextScene) {
    const resources = {
      'scene2': [
        'index_s3.html',
        'style_s3.css',
        'app_s3.js',
        'Seaweda Flower.svg',
        'ForestLoop.mp4',
        'Load_Pc_F.mp4',
        'Load_Mo_F.webm'
      ],
      'scene3': [
        'index_s2.html',
        'style_s2.css',
        'app_s2.js',
        'Seaweda Flower.svg',
        'ForestLoop.mp4',
        'Load_Pc_F.mp4',
        'Load_Mo_F.webm'
      ]
    };
    return resources[nextScene] || [];
  }

  prefetchInitialFrames(nextScene) {
    const frameCount = 10;
    const frames = [];
    
    if (this.isMobile) {
      const folder = nextScene === 'scene2' ? 'Scene2_MO' : 'Scene3_MO';
      for (let i = 1; i <= frameCount; i++) {
        frames.push(`./${folder}/${i}.webp`);
      }
    } else {
      const pcFolder = nextScene === 'scene2' ? 'Scene2_PC' : 'Scene3_PC';
      for (let i = 1; i <= frameCount; i++) {
        frames.push(`./${pcFolder}/${i}.webp`);
      }
    }
    
    frames.forEach(frame => {
      this.createPrefetchLink(frame, 'medium');
    });
  }

  setupUserInteractionPrefetching() {
    const events = ['mousedown', 'touchstart', 'keydown'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.handleUserInteraction();
      }, { once: true });
    });
  }

  handleUserInteraction() {
    if (this.userInteracted) return;
    
    this.userInteracted = true;
    const currentScene = this.getCurrentScene();
    const nextScene = this.getNextScene(currentScene);
    
    if (nextScene) {
      this.prefetchAdditionalFrames(nextScene);
    }
    
    console.log('Additional resources prefetched after user interaction');
  }

  prefetchAdditionalFrames(nextScene) {
    const startFrame = 11;
    const endFrame = 30;
    const frames = [];
    
    if (this.isMobile) {
      const folder = nextScene === 'scene2' ? 'Scene2_MO' : 'Scene3_MO';
      for (let i = startFrame; i <= endFrame; i++) {
        frames.push(`./${folder}/${i}.webp`);
      }
    } else {
      const pcFolder = nextScene === 'scene2' ? 'Scene2_PC' : 'Scene3_PC';
      for (let i = startFrame; i <= endFrame; i++) {
        frames.push(`./${pcFolder}/${i}.webp`);
      }
    }
    
    frames.forEach(frame => {
      this.createPrefetchLink(frame, 'low');
    });
  }

  createPrefetchLink(href, importance = 'auto') {
    if (this.prefetchedResources.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.setAttribute('importance', importance);
    
    // Add error handling
    link.onerror = () => {
      console.warn(`Failed to prefetch: ${href}`);
    };
    
    link.onload = () => {
      console.log(`Successfully prefetched: ${href}`);
    };
    
    document.head.appendChild(link);
    this.prefetchedResources.add(href);
  }

  setupPerformanceMonitoring() {
    // Monitor prefetch performance
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('.webp') || entry.name.includes('.html')) {
            console.log(`Resource loaded: ${entry.name} in ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Public method to manually prefetch specific resources
  prefetchResource(href, importance = 'auto') {
    this.createPrefetchLink(href, importance);
  }

  // Public method to get prefetch status
  getPrefetchStatus() {
    return {
      isMobile: this.isMobile,
      userInteracted: this.userInteracted,
      prefetchedCount: this.prefetchedResources.size,
      currentScene: this.getCurrentScene()
    };
  }
}

// Auto-initialize when script loads
const prefetchManager = new PrefetchManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrefetchManager;
} else {
  window.PrefetchManager = PrefetchManager;
  window.prefetchManager = prefetchManager;
} 