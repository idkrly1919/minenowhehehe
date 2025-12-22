/**
 * ============================================
 * VERDIS WALKTHROUGH TUTORIAL
 * High-budget animated first-time user guide
 * ============================================
 */

const VerdisWalkthrough = (() => {
    // ═══════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════

    const STORAGE_KEY = 'verdis_walkthroughComplete';
    const ANIMATION_DURATION = 800; // ms - wait time for panels to fully open

    // ═══════════════════════════════════════════
    // STEP DEFINITIONS
    // ═══════════════════════════════════════════

    const steps = [
        {
            id: 'welcome',
            type: 'welcome',
            title: 'Welcome to Verdis!',
            description: 'Let\'s take a quick tour of all the amazing features.',
            icon: 'fas fa-rocket'
        },
        {
            id: 'cave-cloak',
            target: '.fa-mountain',
            title: 'Cave Cloak',
            description: 'Click this mountain icon to open Verdis in a hidden about:blank tab. Your browsing stays invisible to history and extensions!',
            icon: 'fas fa-mountain',
            position: 'bottom',
            zoom: 1.3
        },
        {
            id: 'playtime-tracker',
            target: '#playtime-btn',
            title: 'Playtime Tracker',
            description: 'Track how much time you spend gaming. Click the clock icon to see your detailed breakdown!',
            icon: 'far fa-clock',
            position: 'bottom',
            zoom: 1.2
        },
        {
            id: 'playtime-modal',
            target: '.playtime-modal',
            title: 'Your Playtime Stats',
            description: 'Here you can see exactly how much time you\'ve spent on each game. Great for keeping track!',
            icon: 'fas fa-chart-pie',
            position: 'bottom-left-corner',
            zoom: 1.0,
            beforeAction: () => {
                // Open playtime modal
                if (typeof VerdisPlaytime !== 'undefined') {
                    VerdisPlaytime.toggleModal();
                }
            },
            afterAction: () => {
                // Close playtime modal
                if (typeof VerdisPlaytime !== 'undefined') {
                    VerdisPlaytime.toggleModal();
                }
            }
        },
        {
            id: 'games-button',
            target: '[data-page="games"]',
            title: 'Games Library',
            description: 'Access hundreds of unblocked games! Click to explore the collection.',
            icon: 'ri-gamepad-line',
            position: 'bottom',
            zoom: 1.3,
            action: () => {
                if (typeof toggleGames === 'function') {
                    toggleGames();
                }
                // Wait for panel animation, then force load games if empty
                setTimeout(() => {
                    const gamesContainer = document.querySelector('.games-container');
                    if (gamesContainer && gamesContainer.children.length <= 1) { // Only has <br> tag
                        const store = localStorage.getItem("verdis_gameStore") || "gn-math";
                        if (typeof load === 'function') {
                            console.log('[Walkthrough] Force loading games:', store);
                            load(store.toLowerCase(), "games", "Games", "navTo", "play.html?launch=");
                            // Trigger lazy loading of images
                            setTimeout(() => {
                                if (typeof observe === 'function') observe();
                            }, 100);
                        }
                    }
                }, 700); // After genie animation completes
            }
        },
        {
            id: 'games-panel',
            target: '.games-wrapper',
            title: 'Browse Games',
            description: 'Search through our massive game library. Each game has info and favorite options!',
            icon: 'fas fa-gamepad',
            position: 'bottom-left-corner',
            zoom: 1.0,
            waitForElement: true
        },
        {
            id: 'game-info',
            target: '.games-container .app:first-child .info-btn',
            title: 'Game Details',
            description: 'Click the info button to see game details, reviews, and stats from other players.',
            icon: 'fas fa-info-circle',
            position: 'left',
            zoom: 1.4
        },
        {
            id: 'game-details-modal',
            target: '.game-details-modal .modal-content',
            title: 'Game Info & Reviews',
            description: 'Read reviews from other players, check stats, and launch the game right from here!',
            icon: 'fas fa-star',
            position: 'left',
            zoom: 1.0,
            beforeAction: () => {
                // Click the info button to open the modal
                const infoBtn = document.querySelector('.games-container .app:first-child .info-btn');
                if (infoBtn) {
                    infoBtn.click();
                }
            },
            waitForElement: true,
            afterAction: () => {
                // Close game details modal
                setTimeout(() => {
                    if (typeof closeGameDetails === 'function') {
                        closeGameDetails();
                    }
                }, 100);
            }
        },
        {
            id: 'game-favorite',
            target: '.games-container .app:first-child .favorite-btn',
            title: 'Add to Favorites',
            description: 'Click the heart to add games to your Quick Access for easy launching later!',
            icon: 'fas fa-heart',
            position: 'left',
            zoom: 1.4,
            // Click the button but prevent actual favorite action
            action: () => {
                const favBtn = document.querySelector('.games-container .app:first-child .favorite-btn');
                if (favBtn) {
                    // Add visual click effect without triggering actual favorite
                    favBtn.classList.add('walkthrough-demo-click');
                    const icon = favBtn.querySelector('i');
                    if (icon) {
                        // Temporarily show filled heart
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        favBtn.classList.add('active');

                        // Revert after animation
                        setTimeout(() => {
                            icon.classList.remove('fas');
                            icon.classList.add('far');
                            favBtn.classList.remove('active');
                            favBtn.classList.remove('walkthrough-demo-click');
                        }, 1200);
                    }
                }
            },
            afterAction: () => {
                // Close games panel
                if (typeof toggleGames === 'function') {
                    const gamesHolder = document.querySelector('.games-wrapper');
                    if (gamesHolder && gamesHolder.classList.contains('settings-shown')) {
                        toggleGames();
                    }
                }
            }
        },
        {
            id: 'apps-button',
            target: '[data-page="apps"]',
            title: 'Apps Library',
            description: 'Access popular web apps like Discord, Spotify, YouTube, and more - all unblocked!',
            icon: 'ri-apps-line',
            position: 'bottom',
            zoom: 1.3,
            action: () => {
                if (typeof toggleApps === 'function') {
                    toggleApps();
                }
                // Wait for panel animation, then force load apps if empty
                setTimeout(() => {
                    const appsContainer = document.querySelector('.apps-container');
                    if (appsContainer && appsContainer.children.length <= 1) { // Only has <br> tag
                        if (typeof load === 'function') {
                            console.log('[Walkthrough] Force loading apps');
                            load("apps", "apps", "Apps", "rSearch", "");
                            // Trigger lazy loading of images
                            setTimeout(() => {
                                if (typeof observe === 'function') observe();
                            }, 100);
                        }
                    }
                }, 700); // After genie animation completes
            }
        },
        {
            id: 'apps-panel',
            target: '.apps-wrapper',
            title: 'Browse Apps',
            description: 'Find all your favorite apps here. They run through our proxy so they\'re unblocked!',
            icon: 'fas fa-th-large',
            position: 'bottom-left-corner',
            zoom: 1.0,
            waitForElement: true,
            afterAction: () => {
                if (typeof toggleApps === 'function') {
                    const appsHolder = document.querySelector('.apps-wrapper');
                    if (appsHolder && appsHolder.classList.contains('settings-shown')) {
                        toggleApps();
                    }
                }
            }
        },
        {
            id: 'movies-button',
            target: '[data-page="movies"]',
            title: 'Movies & TV',
            description: 'Stream movies and TV shows for free. Huge library with all the latest releases!',
            icon: 'ri-video-line',
            position: 'bottom',
            zoom: 1.3
        },
        {
            id: 'vms-button',
            target: '[data-page="vms"]',
            title: 'Virtual Machines',
            description: 'Run Windows or Linux right in your browser! Perfect for accessing blocked software.',
            icon: 'ri-computer-line',
            position: 'bottom',
            zoom: 1.3
        },
        {
            id: 'ai-button',
            target: '[data-page="ai"]',
            title: 'AI Assistant',
            description: 'Chat with an AI assistant for help with homework, coding, or just for fun!',
            icon: 'ri-robot-2-line',
            position: 'bottom',
            zoom: 1.3
        },
        {
            id: 'settings-button',
            target: '[data-page="dc"]',
            title: 'Settings',
            description: 'Customize themes, proxy settings, cloaking options, and more!',
            icon: 'ri-settings-3-line',
            position: 'bottom',
            zoom: 1.3
        },
        {
            id: 'search-bar',
            target: '.searchathome',
            title: 'Search Anything',
            description: 'Search the web through our proxy. Everything is unblocked and private!',
            icon: 'fas fa-search',
            position: 'top',
            zoom: 1.2
        },
        {
            id: 'top-games',
            target: '#topGamesCarousel',
            title: 'Top Games This Week',
            description: 'Check out what games are trending! These are the most played games this week.',
            icon: 'fas fa-fire',
            position: 'top',
            zoom: 1.1
        },
        {
            id: 'fake-page-demo',
            target: '.overlay-diagnostics',
            title: 'Panic Button Demo',
            description: 'If you click off the website, this fake error page will show! Click "Network Diagnostics" to dismiss it. For the tutorial, just click Next!',
            icon: 'fas fa-shield-halved',
            position: 'bottom',
            zoom: 1.3,
            action: () => {
                // Show fake page first
                if (typeof showClassroomOverlay === 'function') {
                    showClassroomOverlay();
                }
                // Then LOWER its z-index so walkthrough stays on top
                const fakeOverlay = document.getElementById('classroom-overlay');
                if (fakeOverlay) {
                    fakeOverlay.style.zIndex = '99999'; // Below walkthrough (100000)
                }
            },
            afterAction: () => {
                // Dismiss fake page when Next is clicked
                const fakeOverlay = document.getElementById('classroom-overlay');
                if (fakeOverlay) {
                    fakeOverlay.style.display = 'none';
                    if (window.VerdisCursor && typeof window.VerdisCursor.enable === 'function') {
                        window.VerdisCursor.enable();
                    }
                }
            },
            waitForElement: true
        },
        {
            id: 'complete',
            type: 'complete',
            title: 'You\'re All Set!',
            description: 'You now know all the essentials. Enjoy Verdis! 🎮',
            icon: 'fas fa-check-circle'
        }
    ];

    // ═══════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════

    let currentStep = 0;
    let overlay = null;
    let spotlight = null;
    let dialog = null;
    let isActive = false;

    // ═══════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════

    function init() {
        // Check if walkthrough was already completed
        if (localStorage.getItem(STORAGE_KEY) === 'true') {
            console.log('Verdis: Walkthrough already completed');
            return;
        }

        // Wait for page to fully load
        if (document.readyState === 'complete') {
            setTimeout(showWelcome, 1500);
        } else {
            window.addEventListener('load', () => {
                setTimeout(showWelcome, 1500);
            });
        }
    }

    // ═══════════════════════════════════════════
    // WELCOME SCREEN
    // ═══════════════════════════════════════════

    function showWelcome() {
        const welcomeScreen = document.createElement('div');
        welcomeScreen.className = 'walkthrough-welcome';
        welcomeScreen.innerHTML = `
            <div class="walkthrough-welcome-logo">verdis</div>
            <div class="walkthrough-welcome-subtitle">Let's show you around!</div>
            <button class="walkthrough-welcome-btn">
                <i class="fas fa-play"></i>&nbsp;&nbsp;Start Tour
            </button>
            <button class="walkthrough-welcome-skip">Skip Tutorial</button>
        `;

        document.body.appendChild(welcomeScreen);

        // Event listeners
        welcomeScreen.querySelector('.walkthrough-welcome-btn').addEventListener('click', () => {
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                welcomeScreen.remove();
                startWalkthrough();
            }, 400);
        });

        welcomeScreen.querySelector('.walkthrough-welcome-skip').addEventListener('click', () => {
            welcomeScreen.style.opacity = '0';
            welcomeScreen.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                welcomeScreen.remove();
                completeWalkthrough(true);
            }, 400);
        });
    }

    // ═══════════════════════════════════════════
    // WALKTHROUGH CORE
    // ═══════════════════════════════════════════

    function startWalkthrough() {
        isActive = true;
        currentStep = 1; // Skip welcome step

        createOverlay();
        showStep(currentStep);

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboard);
    }

    function createOverlay() {
        // Create backdrop/overlay
        overlay = document.createElement('div');
        overlay.id = 'walkthroughOverlay';
        overlay.className = 'walkthrough-overlay';
        overlay.innerHTML = `<div class="walkthrough-spotlight"></div>`;
        document.body.appendChild(overlay);

        // Create dialog separately to ensure it can be above everything
        dialog = document.createElement('div');
        dialog.className = 'walkthrough-dialog';
        dialog.innerHTML = `
            <div class="walkthrough-step-counter"></div>
            <div class="walkthrough-step-indicator"></div>
            <div class="walkthrough-icon"></div>
            <h3 class="walkthrough-title"></h3>
            <p class="walkthrough-description"></p>
            <div class="walkthrough-actions">
                <button class="walkthrough-skip-btn">Skip</button>
                <button class="walkthrough-next-btn">Next</button>
            </div>
        `;
        document.body.appendChild(dialog);

        spotlight = overlay.querySelector('.walkthrough-spotlight');

        // Button listeners attached to the separate dialog
        dialog.querySelector('.walkthrough-next-btn').addEventListener('click', nextStep);
        dialog.querySelector('.walkthrough-skip-btn').addEventListener('click', () => completeWalkthrough(true));

        // No need to query dialog from overlay anymore
    }

    function showStep(stepIndex) {
        const step = steps[stepIndex];
        if (!step) {
            completeWalkthrough();
            return;
        }

        // Handle special step types
        if (step.type === 'complete') {
            showCompletionScreen();
            return;
        }

        // Execute beforeAction if exists
        if (step.beforeAction) {
            step.beforeAction();
        }

        // Execute action if exists
        if (step.action) {
            step.action();
        }

        // Wait for element if needed
        const showStepUI = () => {
            const target = step.target ? document.querySelector(step.target) : null;

            if (step.target && !target) {
                console.warn(`Walkthrough: Target not found - ${step.target}`);
                // Skip to next step if target not found
                setTimeout(() => nextStep(), 100);
                return;
            }

            // Update spotlight
            if (target) {
                updateSpotlight(target, step.zoom || 1.0);
            } else {
                // Hide spotlight for non-targeted steps
                spotlight.style.opacity = '0';
            }

            // Update dialog content
            updateDialog(step, target);

            // Simulate hover effect if needed
            if (step.simulateHover && target) {
                target.classList.add('walkthrough-hover');
                setTimeout(() => target.classList.remove('walkthrough-hover'), 1500);
            }
        };

        if (step.waitForElement) {
            // Wait longer for panels to fully open and content to load
            const waitAndRetry = (retries = 5) => {
                setTimeout(() => {
                    const target = step.target ? document.querySelector(step.target) : null;
                    if (!target && retries > 0) {
                        // Retry if element not found
                        waitAndRetry(retries - 1);
                    } else {
                        showStepUI();
                    }
                }, ANIMATION_DURATION);
            };
            waitAndRetry();
        } else {
            showStepUI();
        }
    }

    function updateSpotlight(target, zoom) {
        const rect = target.getBoundingClientRect();
        const padding = 12;

        spotlight.style.opacity = '1';
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;

        // If target has genie animation, update again after animation completes
        if (target.classList.contains('genie-opening')) {
            setTimeout(() => {
                const updatedRect = target.getBoundingClientRect();
                spotlight.style.left = `${updatedRect.left - padding}px`;
                spotlight.style.top = `${updatedRect.top - padding}px`;
                spotlight.style.width = `${updatedRect.width + padding * 2}px`;
                spotlight.style.height = `${updatedRect.height + padding * 2}px`;
            }, 550); // Wait for genie animation to finish
        }

        // Apply zoom effect to body
        if (zoom > 1) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            document.body.style.setProperty('--focus-x', `${centerX}px`);
            document.body.style.setProperty('--focus-y', `${centerY}px`);
            document.body.style.setProperty('--zoom-level', zoom);
            document.body.classList.add('walkthrough-zooming');
        } else {
            document.body.classList.remove('walkthrough-zooming');
        }
    }

    function updateDialog(step, target) {
        const stepCounter = dialog.querySelector('.walkthrough-step-counter');
        const stepIndicator = dialog.querySelector('.walkthrough-step-indicator');
        const iconEl = dialog.querySelector('.walkthrough-icon');
        const titleEl = dialog.querySelector('.walkthrough-title');
        const descEl = dialog.querySelector('.walkthrough-description');
        const nextBtn = dialog.querySelector('.walkthrough-next-btn');

        // Step counter
        const totalSteps = steps.filter(s => s.type !== 'welcome' && s.type !== 'complete').length;
        const currentStepNum = steps.slice(0, currentStep + 1).filter(s => s.type !== 'welcome' && s.type !== 'complete').length;
        stepCounter.textContent = `${currentStepNum} / ${totalSteps}`;

        // Step indicator dots
        stepIndicator.innerHTML = '';
        for (let i = 1; i < steps.length - 1; i++) {
            const dot = document.createElement('div');
            dot.className = 'walkthrough-step-dot';
            if (i < currentStep) dot.classList.add('completed');
            if (i === currentStep) dot.classList.add('active');
            stepIndicator.appendChild(dot);
        }

        // Content
        iconEl.innerHTML = `<i class="${step.icon}"></i>`;
        titleEl.textContent = step.title;
        descEl.textContent = step.description;

        // Button text
        if (currentStep >= steps.length - 2) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp;&nbsp;Finish';
        } else {
            nextBtn.innerHTML = 'Next&nbsp;&nbsp;<i class="fas fa-arrow-right"></i>';
        }

        // Position dialog
        positionDialog(target, step.position || 'bottom');

        // Animate dialog
        dialog.classList.remove('exiting');
        dialog.style.animation = 'none';
        dialog.offsetHeight; // Trigger reflow
        dialog.style.animation = 'dialogEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
    }

    function positionDialog(target, position) {
        const dialogRect = dialog.getBoundingClientRect();
        const padding = 20;
        let left, top;

        if (!target) {
            // Center dialog
            left = (window.innerWidth - dialogRect.width) / 2;
            top = (window.innerHeight - dialogRect.height) / 2;
        } else {
            const targetRect = target.getBoundingClientRect();

            switch (position) {
                case 'top':
                    left = targetRect.left + (targetRect.width - dialogRect.width) / 2;
                    top = targetRect.top - dialogRect.height - padding - 30;
                    break;
                case 'bottom':
                    left = targetRect.left + (targetRect.width - dialogRect.width) / 2;
                    top = targetRect.bottom + padding + 30;
                    break;
                case 'left':
                    left = targetRect.left - dialogRect.width - padding - 30;
                    top = targetRect.top + (targetRect.height - dialogRect.height) / 2;
                    break;
                case 'right':
                    left = targetRect.right + padding + 30;
                    top = targetRect.top + (targetRect.height - dialogRect.height) / 2;
                    break;
                case 'bottom-left-corner':
                    // Position at bottom-left corner of screen, outside the target
                    left = padding + 20;
                    top = window.innerHeight - dialogRect.height - padding - 20;
                    break;
                case 'bottom-right-corner':
                    // Position at bottom-right corner of screen
                    left = window.innerWidth - dialogRect.width - padding - 20;
                    top = window.innerHeight - dialogRect.height - padding - 20;
                    break;
                case 'top-left-corner':
                    left = padding + 20;
                    top = padding + 80; // Below nav
                    break;
                case 'top-right-corner':
                    left = window.innerWidth - dialogRect.width - padding - 20;
                    top = padding + 80;
                    break;
                default:
                    left = targetRect.left + (targetRect.width - dialogRect.width) / 2;
                    top = targetRect.bottom + padding + 30;
            }
        }

        // Keep dialog within viewport
        left = Math.max(padding, Math.min(left, window.innerWidth - dialogRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - dialogRect.height - padding));

        dialog.style.left = `${left}px`;
        dialog.style.top = `${top}px`;
    }

    function nextStep() {
        const currentStepData = steps[currentStep];

        // Execute afterAction if exists
        if (currentStepData && currentStepData.afterAction) {
            currentStepData.afterAction();
        }

        // Animate out current dialog
        dialog.classList.add('exiting');

        setTimeout(() => {
            currentStep++;

            if (currentStep >= steps.length) {
                completeWalkthrough();
            } else {
                showStep(currentStep);
            }
        }, 300);
    }

    function handleKeyboard(e) {
        if (!isActive) return;

        if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            nextStep();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            completeWalkthrough(true);
        }
    }

    // ═══════════════════════════════════════════
    // COMPLETION
    // ═══════════════════════════════════════════

    function showCompletionScreen() {
        // Update dialog for completion
        const step = steps[steps.length - 1];

        spotlight.style.opacity = '0';
        document.body.classList.remove('walkthrough-zooming');

        dialog.querySelector('.walkthrough-step-counter').style.display = 'none';
        dialog.querySelector('.walkthrough-step-indicator').innerHTML = '';
        dialog.querySelector('.walkthrough-icon').innerHTML = `<i class="${step.icon}" style="color: #4ade80;"></i>`;
        dialog.querySelector('.walkthrough-title').textContent = step.title;
        dialog.querySelector('.walkthrough-description').textContent = step.description;
        dialog.querySelector('.walkthrough-skip-btn').style.display = 'none';
        dialog.querySelector('.walkthrough-next-btn').innerHTML = '<i class="fas fa-check"></i>&nbsp;&nbsp;Let\'s Go!';
        dialog.querySelector('.walkthrough-next-btn').onclick = () => completeWalkthrough();

        // Position center
        positionDialog(null, 'center');

        // Animate dialog
        dialog.style.animation = 'none';
        dialog.offsetHeight;
        dialog.style.animation = 'dialogEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        // Confetti celebration!
        showCelebration();
    }

    function showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'walkthrough-celebration';
        document.body.appendChild(celebration);

        const colors = ['#78a9ff', '#a78bfa', '#4ade80', '#facc15', '#f472b6'];

        for (let i = 0; i < 75; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'walkthrough-confetti';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            confetti.style.setProperty('--confetti-drift', (Math.random() - 0.5) * 2); // Random drift -1 to 1
            celebration.appendChild(confetti);
        }

        setTimeout(() => celebration.remove(), 4000);
    }

    function completeWalkthrough(skipped = false) {
        isActive = false;

        // Mark as complete
        localStorage.setItem(STORAGE_KEY, 'true');

        // Remove event listener
        document.removeEventListener('keydown', handleKeyboard);

        // Clean up any open panels
        cleanupPanels();

        // Remove zoom
        document.body.classList.remove('walkthrough-zooming');
        document.body.style.removeProperty('--focus-x');
        document.body.style.removeProperty('--focus-y');
        document.body.style.removeProperty('--zoom-level');

        // Fade out overlay
        // Fade out overlay and dialog
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
        }
        if (dialog) {
            dialog.style.opacity = '0';
            dialog.style.transition = 'opacity 0.5s ease';
        }

        setTimeout(() => {
            if (overlay) overlay.remove();
            if (dialog) dialog.remove();
        }, 500);

        // Show completion toast
        if (!skipped && typeof showToast === 'function') {
            setTimeout(() => {
                showToast('success', 'Tutorial complete! Enjoy Verdis! 🎮', 'fas fa-check-circle');
            }, 600);
        } else if (skipped && typeof showToast === 'function') {
            setTimeout(() => {
                showToast('info', 'Tutorial skipped. You can explore on your own!', 'fas fa-info-circle');
            }, 300);
        }

        console.log('Verdis: Walkthrough completed');
    }

    function cleanupPanels() {
        // Close any open modals/panels that were opened during the tour
        const gamesWrapper = document.querySelector('.games-wrapper');
        const appsWrapper = document.querySelector('.apps-wrapper');
        const settingsContainer = document.querySelector('.settings-container');
        const gameDetailsModal = document.querySelector('.game-details-modal');
        const playtimeModal = document.querySelector('.playtime-modal');
        const blurOverlay = document.querySelector('.blurOverlay');

        if (gamesWrapper && gamesWrapper.classList.contains('settings-shown')) {
            if (typeof toggleGames === 'function') toggleGames();
        }
        if (appsWrapper && appsWrapper.classList.contains('settings-shown')) {
            if (typeof toggleApps === 'function') toggleApps();
        }
        if (settingsContainer && settingsContainer.classList.contains('settings-shown')) {
            if (typeof toggleSettings === 'function') toggleSettings();
        }
        if (gameDetailsModal && !gameDetailsModal.classList.contains('settings-hidden')) {
            if (typeof closeGameDetails === 'function') closeGameDetails();
        }
        if (playtimeModal && !playtimeModal.classList.contains('settings-hidden')) {
            if (typeof VerdisPlaytime !== 'undefined') VerdisPlaytime.toggleModal();
        }
        if (blurOverlay) {
            blurOverlay.remove();
        }

        document.body.classList.remove('content-open');
    }

    // ═══════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════

    return {
        init,
        start: startWalkthrough,
        skip: () => completeWalkthrough(true),
        reset: () => {
            localStorage.removeItem(STORAGE_KEY);
            console.log('Verdis: Walkthrough reset. Reload page to see it again.');
        },
        isComplete: () => localStorage.getItem(STORAGE_KEY) === 'true'
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    VerdisWalkthrough.init();
});
