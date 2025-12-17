/**
 * Screen Capture Protection Module
 * Implements subtle protection against screenshots and screen recording
 * Uses CSS-based techniques that don't interfere with normal viewing
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        enabled: true
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

    // Apply CSS-based protection using hardware acceleration
    function applyCSSProtection() {
        const style = document.createElement('style');
        style.id = 'screen-protection-css';
        style.textContent = `
            /* Force hardware acceleration which can interfere with some screen capture */
            html {
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
            }
            
            body {
                /* Use hardware compositing */
                transform: translate3d(0, 0, 0);
                -webkit-transform: translate3d(0, 0, 0);
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
            }
            
            /* Apply to main content areas */
            #contentFrame, .browser-container, iframe {
                /* Force GPU layer */
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
                will-change: transform;
            }
        `;
        document.head.appendChild(style);
    }

    // Create an extremely subtle overlay that's invisible but detected by capture tools
    function createSubtleOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'screen-protection-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 999999;
            background: linear-gradient(to bottom, 
                rgba(255, 255, 255, 0.001) 0%, 
                rgba(255, 255, 255, 0.001) 100%);
            mix-blend-mode: screen;
            opacity: 0.001;
        `;
        
        if (document.body) {
            document.body.appendChild(overlay);
        }
    }

    // Prevent context menu on media elements
    function setupContextMenuProtection() {
        document.addEventListener('contextmenu', (e) => {
            const target = e.target;
            if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.tagName === 'CANVAS') {
                e.preventDefault();
                return false;
            }
        });
    }

    // Protect iframes with GPU acceleration
    function protectIframes() {
        const protectFrame = (iframe) => {
            if (!iframe) return;
            
            try {
                iframe.style.transform = 'translateZ(0)';
                iframe.style.willChange = 'transform';
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

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // Initialize protection
    function initProtection() {
        console.log('Initializing subtle screen capture protection...');
        
        applyCSSProtection();
        createSubtleOverlay();
        setupContextMenuProtection();
        protectIframes();
        
        console.log('Screen capture protection active');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProtection);
    } else {
        initProtection();
    }

    // Export toggle function for settings
    window.toggleScreenProtection = function(enabled) {
        config.enabled = enabled;
        localStorage.setItem('verdis_screenProtection', enabled ? 'yes' : 'no');
        
        if (enabled) {
            location.reload();
        } else {
            // Remove protection elements
            document.getElementById('screen-protection-overlay')?.remove();
            document.getElementById('screen-protection-css')?.remove();
        }
    };

    // Export status check
    window.isScreenProtectionEnabled = function() {
        return config.enabled;
    };

})();
