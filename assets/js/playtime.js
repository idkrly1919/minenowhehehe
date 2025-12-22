/**
 * Verdis Playtime Tracker
 * Tracks total time spent on the website and activity breakdown
 */

window.VerdisPlaytime = (() => {
    const STORAGE_KEY = 'verdis_playtime';
    const SAVE_INTERVAL = 10000; // Save every 10 seconds

    let sessionStart = Date.now();
    let currentActivity = 'idle';
    let currentSubActivity = null;
    let activityStart = Date.now();
    let saveTimer = null;

    // Default data structure
    const defaultData = () => ({
        totalMs: 0,
        sessions: 0,
        firstVisit: new Date().toISOString().split('T')[0],
        breakdown: {
            games: 0,
            apps: 0,
            movies: 0,
            browsing: 0,
            idle: 0
        },
        details: {
            games: {},
            apps: {},
            movies: {},
            browsing: {}
        }
    });

    // Load data from localStorage
    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                // Ensure all breakdown categories exist
                if (!data.breakdown) data.breakdown = defaultData().breakdown;
                if (!data.details) data.details = defaultData().details;

                ['games', 'apps', 'movies', 'browsing', 'idle'].forEach(cat => {
                    if (typeof data.breakdown[cat] !== 'number') data.breakdown[cat] = 0;
                    if (cat !== 'idle' && !data.details[cat]) data.details[cat] = {};
                });
                return data;
            }
        } catch (e) {
            console.error('Error loading playtime data:', e);
        }
        return defaultData();
    }

    // Save data to localStorage
    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving playtime data:', e);
        }
    }

    // Update time for current activity
    function updateActivityTime() {
        const now = Date.now();
        const elapsed = now - activityStart;

        // Don't track idle/home time at all
        if (currentActivity === 'idle') {
            activityStart = now;
            return;
        }

        const data = loadData();
        data.breakdown[currentActivity] = (data.breakdown[currentActivity] || 0) + elapsed;

        // Track sub-activity if present
        if (currentSubActivity) {
            if (!data.details[currentActivity]) data.details[currentActivity] = {};
            data.details[currentActivity][currentSubActivity] = (data.details[currentActivity][currentSubActivity] || 0) + elapsed;
        }

        data.totalMs += elapsed;
        saveData(data);

        activityStart = now;
    }

    // Format milliseconds to human-readable string
    function formatTime(ms, short = false) {
        if (ms < 0) ms = 0;

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (short) {
            // Short format for navbar button
            if (days > 0) return `${days}d ${hours % 24}h`;
            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m`;
            return `${seconds}s`;
        } else {
            // Long format for modal
            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours % 24}h ${minutes % 60}m`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60}m`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    }

    // Format date nicely
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Initialize tracking
    function init() {
        // Increment session count
        const data = loadData();
        data.sessions = (data.sessions || 0) + 1;
        saveData(data);

        // Start periodic saving
        saveTimer = setInterval(() => {
            updateActivityTime();
            updateDisplay();
        }, SAVE_INTERVAL);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            updateActivityTime();
        });

        // Save when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateActivityTime();
            }
        });

        // Initial display update
        setTimeout(updateDisplay, 100);
    }

    // Track activity change
    function trackActivity(activity, subActivity = null) {
        if (!['games', 'apps', 'movies', 'browsing', 'idle'].includes(activity)) {
            activity = 'idle';
        }

        if (activity !== currentActivity || subActivity !== currentSubActivity) {
            updateActivityTime();
            currentActivity = activity;
            currentSubActivity = subActivity;
            activityStart = Date.now();
        }
    }

    // Get total playtime
    function getTotal() {
        updateActivityTime();
        const data = loadData();
        return data.totalMs;
    }

    // Get breakdown
    function getBreakdown() {
        updateActivityTime();
        const data = loadData();
        return data.breakdown;
    }

    // Get all stats
    function getStats() {
        updateActivityTime();
        return loadData();
    }

    // Update navbar display
    function updateDisplay() {
        const btn = document.getElementById('playtime-btn');
        if (btn) {
            const total = getTotal();
            const timeText = btn.querySelector('.playtime-text');
            if (timeText) {
                timeText.textContent = formatTime(total, true);
            }
        }
    }

    // Toggle modal
    function toggleModal() {
        const modal = document.querySelector('.playtime-modal');
        if (!modal) return;

        const isHidden = modal.classList.contains('settings-hidden');
        const isOpening = modal.classList.contains('genie-opening');

        if (isHidden && !isOpening) {
            // Calculate button position for genie effect
            const playtimeBtn = document.getElementById('playtime-btn');
            if (playtimeBtn) {
                const btnRect = playtimeBtn.getBoundingClientRect();
                const centerX = btnRect.left + btnRect.width / 2;
                const offsetX = centerX - window.innerWidth / 2;
                modal.style.setProperty('--genie-offset-x', `${offsetX}px`);
            }

            // Show modal with genie animation
            renderModal();
            modal.classList.remove('settings-hidden');
            modal.classList.add('genie-opening');

            // After animation, switch to settings-shown
            setTimeout(() => {
                modal.classList.remove('genie-opening');
                modal.classList.add('settings-shown');
            }, 500);
        } else if (modal.classList.contains('settings-shown')) {
            // Hide modal with genie animation
            modal.classList.add('genie-closing');
            modal.classList.remove('settings-shown');
            setTimeout(() => {
                modal.classList.remove('genie-closing');
                modal.classList.add('settings-hidden');
            }, 450);
        }
    }

    // Render modal content
    function renderModal() {
        const container = document.getElementById('playtime-breakdown');
        if (!container) return;

        const stats = getStats();
        const breakdown = stats.breakdown;
        const details = stats.details || {};
        const total = stats.totalMs;

        // Activity icons and labels (no idle - we don't track home time)
        const activities = [
            { key: 'games', icon: '🎮', label: 'Games' },
            { key: 'browsing', icon: '🌐', label: 'Browsing' },
            { key: 'apps', icon: '📱', label: 'Apps' },
            { key: 'movies', icon: '🎬', label: 'Movies' }
        ];

        // Sort by time spent (descending)
        activities.sort((a, b) => (breakdown[b.key] || 0) - (breakdown[a.key] || 0));

        let html = `
            <div class="playtime-total">
                <span class="playtime-total-label">Active Playtime</span>
                <span class="playtime-total-value">${formatTime(total)}</span>
            </div>
            <div class="playtime-meta">
                <span><i class="far fa-calendar"></i> First visit: ${formatDate(stats.firstVisit)}</span>
                <span><i class="far fa-repeat"></i> ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}</span>
            </div>
            <div class="playtime-divider"></div>
            <h4>Activity Breakdown <small style="opacity: 0.5; font-weight: normal; font-size: 0.7em;">(Click for details)</small></h4>
            <div class="playtime-activities">
        `;

        activities.forEach(act => {
            const time = breakdown[act.key] || 0;
            const percent = total > 0 ? Math.round((time / total) * 100) : 0;
            const subItems = details[act.key] || {};
            const hasDetails = Object.keys(subItems).length > 0;

            html += `
                <div class="playtime-activity ${hasDetails ? 'has-details' : 'no-details'}" onclick="VerdisPlaytime.toggleDetails('${act.key}')">
                    <div class="playtime-activity-header">
                        <span class="playtime-activity-icon">${act.icon}</span>
                        <span class="playtime-activity-label">${act.label}</span>
                        <span class="playtime-activity-time">${formatTime(time, true)}</span>
                    </div>
                    <div class="playtime-progress">
                        <div class="playtime-progress-bar" style="width: ${percent}%"></div>
                    </div>
                    <div id="playtime-details-${act.key}" class="playtime-details-list" style="display: none;">
            `;

            if (hasDetails) {
                // Sort sub-items by time
                const sortedSubItems = Object.entries(subItems).sort((a, b) => b[1] - a[1]);
                sortedSubItems.forEach(([name, subTime]) => {
                    html += `
                        <div class="playtime-sub-item clickable" onclick="event.stopPropagation(); VerdisPlaytime.launchGameByName('${name.replace(/'/g, "\\'")}')">
                            <span class="playtime-sub-label">${name}</span>
                            <span class="playtime-sub-time">${formatTime(subTime, true)}</span>
                        </div>
                    `;
                });
            } else {
                html += `
                    <div class="playtime-sub-item" style="justify-content: center; opacity: 0.5; font-style: italic;">
                        No history required
                    </div>
                `;
            }

            html += `
                </div>
            </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Launch game by name
    async function launchGameByName(name) {
        if (!name) return;

        // 1. Try to find in DOM first (if games are loaded)
        // The load function creates h2 with class 'app-title-h2'
        const titles = Array.from(document.querySelectorAll('.app-title-h2'));
        const titleEl = titles.find(t => t.textContent.trim() === name);

        if (titleEl) {
            // Find parent clickable container
            // structure: div.games-container > div (onclick) > ... > div.app-title-cont > h2
            let parent = titleEl.closest('[onclick]');
            if (parent) {
                parent.click();
                return;
            }
        }

        // 2. Fallback: Fetch from store
        try {
            const store = (localStorage.getItem("verdis_gameStore") || "gn-math").toLowerCase();
            const res = await fetch(`/assets/json/${store}.json`);
            if (!res.ok) throw new Error("Failed to load store");

            const games = await res.json();
            const game = games.find(g => g.name === name);

            if (game) {
                if (typeof navTo === 'function') {
                    navTo(`play.html?launch=${game.url}`, game.name);
                } else {
                    window.location.href = `/pages/play.html?launch=${game.url}`;
                }
            } else {
                console.warn(`Game "${name}" not found in store ${store}`);
                // Optional: check all stores? Too expensive maybe.
            }
        } catch (e) {
            console.error("Error launching game by name:", e);
        }
    }

    function toggleDetails(key) {
        const detailsEl = document.getElementById(`playtime-details-${key}`);
        if (!detailsEl) return;

        const isCollapsed = detailsEl.style.display === 'none';
        detailsEl.style.display = isCollapsed ? 'block' : 'none';

        // Add a class for rotation animation of icon if needed
        detailsEl.parentElement.classList.toggle('expanded', isCollapsed);
    }

    // Public API
    return {
        init,
        trackActivity,
        getTotal,
        getBreakdown,
        getStats,
        formatTime,
        updateDisplay,
        toggleModal,
        toggleDetails,
        launchGameByName
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VerdisPlaytime.init());
} else {
    VerdisPlaytime.init();
}
