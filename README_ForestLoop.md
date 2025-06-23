# ForestLoop Video Requirements

## Overview
The Forest Experience now uses a ForestLoop video for loading screens in Scene 2 and Scene 3, replacing the traditional loading spinner.

## Video Files Required

Place the following video files in the root directory:

1. **ForestLoop.mp4** - Primary video format (MP4)
2. **ForestLoop.webm** - WebM format for better browser compatibility

## Video Specifications

- **Duration**: 3-5 seconds (looping)
- **Format**: MP4 and WebM
- **Resolution**: 1920x1080 (Full HD) or higher
- **Aspect Ratio**: 16:9
- **Content**: Forest/nature loop animation
- **File Size**: Optimize for web (under 5MB each)

## Implementation Details

### HTML Structure
```html
<video id="forestLoop" class="forest-loop-video" autoplay muted loop playsinline>
  <source src="./ForestLoop.mp4" type="video/mp4">
  <source src="./ForestLoop.webm" type="video/webm">
  <!-- Fallback loading screen -->
</video>
```

### CSS Styling
- Video covers full screen with `object-fit: cover`
- Fallback loading elements are hidden by default
- Fallback elements show only if video fails to load

### JavaScript Behavior
- Video plays automatically when page loads
- Minimum 3-second display time
- Smooth fade-out transition to main content
- Fallback to traditional loading screen if video fails

## Fallback System

If the ForestLoop video fails to load:
1. Traditional loading spinner appears
2. Progress bar shows loading progress
3. Normal loading behavior resumes

## Browser Compatibility

- **Modern Browsers**: Video plays automatically
- **Older Browsers**: Falls back to loading screen
- **Mobile Devices**: Video plays with `playsinline` attribute

## Performance Notes

- Videos are prefetched for optimal loading
- Video files should be optimized for web delivery
- Consider using CDN for better performance 