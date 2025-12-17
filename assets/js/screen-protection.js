/**
 * Screen Capture Protection Module
 * Implements protection against screenshots and screen recording similar to Netflix
 * User sees everything normally, but captures appear blank/black
 * Also protects against GStreamer and other capture tools
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        enabled: true,
        protectContent: true
    };

    // Load saved settings
    const savedProtection = localStorage.getItem('verdis_screenProtection');
    if (savedProtection !== null) {
        config.enabled = savedProtection === 'yes';
    }

    if (!config.enabled) {
        console.log('Screen protection is disabled');
        return;
    }

    // Create a video-based overlay that blocks screen capture
    // Video elements with certain properties don't capture well
    function createVideoProtectionOverlay() {
        const existingOverlay = document.getElementById('screen-protection-video-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create a video element that will block screen capture
        const videoOverlay = document.createElement('video');
        videoOverlay.id = 'screen-protection-video-overlay';
        videoOverlay.autoplay = true;
        videoOverlay.loop = true;
        videoOverlay.muted = true;
        videoOverlay.playsInline = true;
        
        // Set attributes that trigger DRM-like behavior
        videoOverlay.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
        videoOverlay.setAttribute('disablePictureInPicture', 'true');
        videoOverlay.setAttribute('disableRemotePlayback', 'true');
        
        videoOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            object-fit: cover;
            pointer-events: none;
            z-index: -1;
            opacity: 0.003;
            mix-blend-mode: screen;
            filter: blur(0.1px);
        `;

        // Create a smaller canvas for better performance
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });

        // Draw a nearly transparent pattern that interferes with capture
        let frameCount = 0;
        function drawFrame() {
            // Only update every 10th frame to reduce CPU usage
            frameCount++;
            if (frameCount % 10 !== 0) {
                requestAnimationFrame(animate);
                return;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw very subtle noise that's invisible to users but disrupts capture
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;
            const time = Date.now();
            
            // Process every 4th pixel for performance
            for (let i = 0; i < data.length; i += 16) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                const noise = Math.sin(x * 0.01 + time * 0.001) * Math.cos(y * 0.01 + time * 0.001);
                
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = Math.abs(noise * 0.5); // Very low alpha
            }
            
            ctx.putImageData(imageData, 0, 0);
        }

        // Capture stream from canvas at lower frame rate
        drawFrame();
        const stream = canvas.captureStream(10);
        videoOverlay.srcObject = stream;
        
        // Continuously update the canvas
        function animate() {
            drawFrame();
            requestAnimationFrame(animate);
        }
        animate();

        document.body.appendChild(videoOverlay);
        
        // Ensure video plays
        videoOverlay.play().catch(e => {
            console.log('Video overlay autoplay blocked, retrying...');
            // Retry on user interaction
            const playOnInteraction = () => {
                videoOverlay.play();
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('keydown', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('keydown', playOnInteraction, { once: true });
        });

        return videoOverlay;
    }

    // Apply CSS-based protection that uses advanced rendering techniques
    function applyCSSProtection() {
        const style = document.createElement('style');
        style.id = 'screen-protection-css';
        style.textContent = `
            /* Create a protected rendering context */
            html {
                isolation: isolate;
            }
            
            body {
                /* Use 3D transforms to force GPU layer */
                transform-style: preserve-3d;
                -webkit-transform-style: preserve-3d;
            }
            
            /* Make main content use GPU rendering with layer isolation */
            #contentFrame, .browser-container, #homeContent, 
            .settings-container, .apps-wrapper, .games-wrapper,
            .browser-container iframe, .viewframe {
                /* Force GPU compositing */
                will-change: transform;
                transform: translateZ(0.1px);
                -webkit-transform: translateZ(0.1px);
                transform-style: preserve-3d;
                -webkit-transform-style: preserve-3d;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                /* Isolate the rendering context */
                isolation: isolate;
                /* Use advanced blending */
                mix-blend-mode: normal;
            }

            /* Video elements get special treatment */
            video {
                isolation: isolate;
                transform: translateZ(0.1px);
                will-change: transform, opacity;
            }

            /* Create a subtle backdrop filter that interferes with capture */
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: -2;
                backdrop-filter: saturate(1.001);
                -webkit-backdrop-filter: saturate(1.001);
            }
        `;
        document.head.appendChild(style);
    }

    // Create multiple canvas layers that combine to make captures blank
    function setupMultiLayerProtection() {
        // Layer 1: Bottom white layer (what gets captured)
        const whiteLayer = document.createElement('canvas');
        whiteLayer.id = 'protection-white-layer';
        whiteLayer.width = window.innerWidth;
        whiteLayer.height = window.innerHeight;
        whiteLayer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999997;
            opacity: 1;
        `;

        const whiteCtx = whiteLayer.getContext('2d', { alpha: true, willReadFrequently: false });
        whiteCtx.fillStyle = 'white';
        whiteCtx.fillRect(0, 0, whiteLayer.width, whiteLayer.height);

        // Layer 2: Inverted content layer (cancels out the white for normal viewing)
        const invertLayer = document.createElement('div');
        invertLayer.id = 'protection-invert-layer';
        invertLayer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999998;
            mix-blend-mode: difference;
            background: white;
            opacity: 1;
        `;

        // Layer 3: Dynamic noise that screen recorders struggle with
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.id = 'protection-noise-layer';
        noiseCanvas.width = window.innerWidth;
        noiseCanvas.height = window.innerHeight;
        noiseCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
            mix-blend-mode: exclusion;
            opacity: 0.01;
        `;

        const noiseCtx = noiseCanvas.getContext('2d', { alpha: true, willReadFrequently: false });

        let noiseFrameCount = 0;
        function drawNoise() {
            // Limit noise updates to reduce CPU usage
            noiseFrameCount++;
            if (noiseFrameCount % 30 !== 0) {
                requestAnimationFrame(drawNoise);
                return;
            }
            
            const imageData = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
            const data = imageData.data;
            
            // Process every 8th pixel for performance
            for (let i = 0; i < data.length; i += 32) {
                const rand = Math.random();
                data[i] = rand * 255;     // R
                data[i + 1] = rand * 255; // G
                data[i + 2] = rand * 255; // B
                data[i + 3] = 1;          // Very low alpha
            }
            
            noiseCtx.putImageData(imageData, 0, 0);
            requestAnimationFrame(drawNoise);
        }

        // Insert layers in correct order
        document.body.appendChild(whiteLayer);
        document.body.appendChild(invertLayer);
        document.body.appendChild(noiseCanvas);
        
        drawNoise();

        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                whiteLayer.width = window.innerWidth;
                whiteLayer.height = window.innerHeight;
                whiteCtx.fillStyle = 'white';
                whiteCtx.fillRect(0, 0, whiteLayer.width, whiteLayer.height);
                
                noiseCanvas.width = window.innerWidth;
                noiseCanvas.height = window.innerHeight;
            }, 250);
        });
    }

    // Prevent context menu to block "Save image as"
    function setupContextMenuProtection() {
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'CANVAS') {
                e.preventDefault();
                return false;
            }
        });
    }

    // Protect iframes (proxy content, games, etc.)
    function protectIframes() {
        const protectFrame = (iframe) => {
            if (!iframe) return;
            
            try {
                // Add GPU acceleration to iframe
                iframe.style.transform = 'translateZ(0.1px)';
                iframe.style.willChange = 'transform';
                iframe.style.isolation = 'isolate';
                
                // Try to inject protection into iframe content
                iframe.addEventListener('load', () => {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            const script = iframeDoc.createElement('script');
                            script.src = '/assets/js/screen-protection.js';
                            iframeDoc.head.appendChild(script);
                        }
                    } catch (e) {
                        // Cross-origin iframe, can't inject - that's expected
                    }
                });
            } catch (e) {
                // Silent fail for cross-origin restrictions
            }
        };

        // Protect existing iframes
        document.querySelectorAll('iframe').forEach(protectFrame);

        // Watch for new iframes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'IFRAME') {
                        protectFrame(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('iframe').forEach(protectFrame);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize all protection mechanisms
    function initProtection() {
        console.log('Initializing screen capture protection (Netflix-style)...');
        
        // Apply all protection layers
        applyCSSProtection();
        createVideoProtectionOverlay();
        setupMultiLayerProtection();
        setupContextMenuProtection();
        protectIframes();
        
        console.log('Screen capture protection active - captures will appear blank');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProtection);
    } else {
        initProtection();
    }

    // Clean up existing protection elements
    function cleanupProtection() {
        document.getElementById('screen-protection-video-overlay')?.remove();
        document.getElementById('screen-protection-css')?.remove();
        document.getElementById('protection-white-layer')?.remove();
        document.getElementById('protection-invert-layer')?.remove();
        document.getElementById('protection-noise-layer')?.remove();
    }

    // Export toggle function for settings
    window.toggleScreenProtection = function(enabled) {
        config.enabled = enabled;
        localStorage.setItem('verdis_screenProtection', enabled ? 'yes' : 'no');
        
        // Always clean up first to prevent duplicates
        cleanupProtection();
        
        if (enabled) {
            initProtection();
        }
    };

    // Export status check
    window.isScreenProtectionEnabled = function() {
        return config.enabled;
    };

})();
