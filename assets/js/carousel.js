/**
 * Top Games Carousel - Full-Width Slideshow
 * Shows top 5 most played games from Supabase with real game data
 */

const TopGamesCarousel = (() => {
    let allGames = [];
    let topGames = [];
    let currentIndex = 0;
    let autoRotateTimer = null;
    let isDragging = false;
    let dragThreshold = 5;
    let hasMoved = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    function slugify(text) {
        if (!text) return '';
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    const FALLBACK_GAMES = [
        { name: 'Slope', url: 'https://ubg77.github.io/edit/slope/', img: 'https://cdn2.steamgriddb.com/grid/d0a4a5ad02b8e03d48b50c3bad9c8aae.png' },
        { name: '1v1.LOL', url: 'https://1v1.lol/', img: 'https://play-lh.googleusercontent.com/yx6u3HpMBM7wm_iq3ExWlBd5zEO7F4sOL8YWjl4KnxN2bQWDnNvM3Qp7X1N9o4x0LGI' },
        { name: 'Retro Bowl', url: 'https://retro-bowl.io/', img: 'https://play-lh.googleusercontent.com/e4Sfy0cOmHVGLwNcjGvb1LVXl6sL6JxPVGtm0F6H2Dms9WsP8bMz2fQ2B1q6EHGPhA' },
        { name: 'Cookie Clicker', url: 'https://orteil.dashnet.org/cookieclicker/', img: 'https://play-lh.googleusercontent.com/EjDFx2r6LJYl9_d4yq4xJZKQ0V7VV9Ew9WBJQ-YE6P6d8dB9_z3pWHFxVN8UPq_C' },
        { name: 'Moto X3M', url: 'https://poki.com/en/g/moto-x3m', img: 'https://img.poki.com/cdn-cgi/image/quality=78,width=600,height=600,fit=cover/94945631932de646e821eb88dc5f2c05.png' }
    ];

    async function init() {
        const container = document.getElementById('topGamesCarousel');
        if (!container) return;

        let store = localStorage.getItem("verdis_gameStore") ?? "gn-math";
        store = store.toLowerCase();

        try {
            const res = await fetch(`/assets/json/${store}.json`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            allGames = await res.json();
        } catch (e) {
            if (store !== 'gn-math') {
                try {
                    const res = await fetch(`/assets/json/gn-math.json`);
                    allGames = await res.json();
                } catch (e2) { allGames = FALLBACK_GAMES; }
            } else { allGames = FALLBACK_GAMES; }
        }

        if (!allGames || allGames.length === 0) allGames = FALLBACK_GAMES;

        // Get most played from Supabase
        let mostPlayedIds = [];
        try {
            if (typeof VerdisBackend !== 'undefined' && VerdisBackend.isConfigured()) {
                const stats = await VerdisBackend.getMostPlayed(7);
                if (stats && Array.isArray(stats)) {
                    mostPlayedIds = stats.map(s => s.id);
                }
            }
        } catch (e) { console.warn('Supabase stats fetch failed:', e); }

        // Build top games list
        topGames = [];
        if (mostPlayedIds.length > 0) {
            mostPlayedIds.forEach(id => {
                const game = allGames.find(g => {
                    const slug = slugify(g.name);
                    const urlPath = g.url.split('/').pop().replace('.html', '');
                    return slug === id || urlPath === id;
                });

                if (game && !topGames.find(t => t.name === game.name) && topGames.length < 5) {
                    topGames.push(game);
                }
            });
        }

        if (topGames.length < 5) {
            const shuffled = [...allGames].sort(() => 0.5 - Math.random());
            const remaining = shuffled
                .filter(g => !topGames.find(t => t.name === g.name))
                .slice(0, 5 - topGames.length);
            topGames.push(...remaining);
        }

        if (topGames.length === 0) {
            container.style.display = 'none';
            return;
        }

        renderCarousel(container);
        startAutoRotate();

        // Add loop handler
        const track = document.getElementById('topGamesTrack');
        track.addEventListener('transitionend', handleTransitionEnd);
    }

    function renderCarousel(container) {
        // Quick Access - Increase limit to 10
        let quickAccessHtml = '';
        if (typeof VerdiFavorites !== 'undefined') {
            const favorites = VerdiFavorites.getAllFavorites(10);
            if (favorites.length > 0) {
                quickAccessHtml = `<div class="carousel-quick-access">
                    <div class="carousel-qa-title"><i class="fas fa-star"></i> Quick Access</div>
                    <div class="carousel-qa-items">`;
                favorites.slice(0, 10).forEach(fav => {
                    quickAccessHtml += `
                        <div class="carousel-qa-item" onclick="event.stopPropagation(); launchQuickAccess('${fav.type}', '${fav.url}', '${fav.name.replace(/'/g, "\\'")}')" 
                             style="background-image: url('${fav.img}')">
                        </div>
`;
                });
                quickAccessHtml += `</div></div>`;
            }
        }

        let html = `
            <div class="top-games-title"><i class="fas fa-fire"></i> Top Games This Week</div>
            <div class="top-games-track" id="topGamesTrack">
        `;

        // Render main games
        topGames.forEach((game, index) => {
            html += createCardHtml(game, index);
        });

        // Loop: Add Clone of First Card at the end
        if (topGames.length > 0) {
            html += createCardHtml(topGames[0], topGames.length, true); // Clone
        }

        html += `</div>`;

        // Render Dots (only for real slides)
        html += `<div class="carousel-dots" id="carouselDots">`;
        topGames.forEach((_, index) => {
            html += `<button class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="TopGamesCarousel.goTo(${index})"></button>`;
        });
        html += `</div>`;

        html += quickAccessHtml;
        container.innerHTML = html;

        const track = document.getElementById('topGamesTrack');
        if (track) {
            track.addEventListener('mouseenter', stopAutoRotate);
            track.addEventListener('mouseleave', startAutoRotate);
            initDrag(track);
        }
    }

    function createCardHtml(game, index, isClone = false) {
        // If it's a clone, we call playGame with 0, or just handle it essentially as 0
        const playIndex = isClone ? 0 : index;
        return `
            <div class="top-game-card" data-index="${index}" onclick="TopGamesCarousel.playGame(${playIndex})">
                <div class="rank-badge">${playIndex + 1}</div>
                <div class="bg-img" style="background-image: url('${game.img}')"></div>
                <div class="card-overlay">
                    <div class="card-title">${game.name}</div>
                    <button class="play-btn" onclick="event.stopPropagation(); TopGamesCarousel.playGame(${playIndex})">
                        <i class="fas fa-play"></i> Play
                    </button>
                </div>
            </div>
        `;
    }

    function initDrag(track) {
        track.addEventListener('mousedown', dragStart);
        track.addEventListener('touchstart', dragStart);
        track.addEventListener('mousemove', dragMove);
        track.addEventListener('touchmove', dragMove);
        track.addEventListener('mouseup', dragEnd);
        track.addEventListener('touchend', dragEnd);
        track.addEventListener('mouseleave', dragEnd);

        // Prevent selection during drag
        track.style.userSelect = 'none';
        track.style.webkitUserSelect = 'none';
    }

    function dragStart(e) {
        isDragging = true;
        hasMoved = false;
        startX = getPositionX(e);
        stopAutoRotate();
        const track = document.getElementById('topGamesTrack');
        track.style.transition = 'none';

        // Get current transform value to handle dragging from any point
        // But for simplicity in this loop logic, we might just use currentIndex
    }

    function dragMove(e) {
        if (!isDragging) return;
        const currentX = getPositionX(e);
        const diff = currentX - startX;

        if (Math.abs(diff) > dragThreshold) hasMoved = true;

        const track = document.getElementById('topGamesTrack');
        const trackWidth = document.getElementById('topGamesCarousel').offsetWidth;
        currentTranslate = -currentIndex * trackWidth + diff;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        const track = document.getElementById('topGamesTrack');
        const trackWidth = document.getElementById('topGamesCarousel').offsetWidth;
        // Calculate move based on diff from startX
        // If dragged enough, change index.

        // Re-calculate currentTranslate from style or just use tracked variable?
        // We need the visually moved distance relative to current index
        // Simplest: use previous dragMove calculation logic

        // Check if we moved enough to change slide
        // We can just rely on the stored currentTranslate vs the currentIndex base

        // Let's reuse the simple threshold logic, but respecting the clone (index 5)
        const diff = currentTranslate - (-currentIndex * trackWidth);

        if (diff < -100) {
            // Dragged left -> Next
            goTo(currentIndex + 1);
        } else if (diff > 100) {
            // Dragged right -> Prev
            goTo(currentIndex - 1);
        } else {
            // Snap back
            goTo(currentIndex);
        }

        startAutoRotate();
    }

    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function goTo(index) {
        const track = document.getElementById('topGamesTrack');
        if (!track) return;

        const totalItems = topGames.length + 1; // +1 for clone

        // Bounds check with loop logic
        // If index < 0, we could loop to real last, but simple "smooth back to 1" usually means forward loop.
        // User asked: "reaches 5th ... smoothly moves back to 1"
        // This usually implies 0 -> 1 -> 2 -> 3 -> 4 -> 5(clone0) -> [snap] -> 0

        if (index < 0) {
            index = 0; // Stay at 0 or wrap? User didn't specify reverse wrap. Keep simple.
        }

        // If we go beyond clone, cap it
        if (index >= totalItems) {
            index = totalItems - 1;
        }

        currentIndex = index;
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        track.style.transform = `translateX(-${index * 100}%)`;

        // Update dots (logic: if we are at clone (length), it's basically 0)
        let visualIndex = index;
        if (index === topGames.length) visualIndex = 0;

        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === visualIndex);
        });
    }

    function handleTransitionEnd() {
        const track = document.getElementById('topGamesTrack');
        // If we are at the clone (last item)
        if (currentIndex === topGames.length) {
            // Snap instantly to real 0
            track.style.transition = 'none';
            currentIndex = 0;
            track.style.transform = `translateX(0)`;
            // Force reflow?
            void track.offsetWidth;
        }
    }

    function next() {
        if (topGames.length === 0) return;
        // Allows moving to topGames.length (the clone)
        goTo(currentIndex + 1);
    }

    function startAutoRotate() {
        stopAutoRotate();
        autoRotateTimer = setInterval(next, 4000);
    }

    function stopAutoRotate() {
        if (autoRotateTimer) {
            clearInterval(autoRotateTimer);
            autoRotateTimer = null;
        }
    }

    function playGame(index) {
        if (hasMoved) return;
        const game = topGames[index];
        if (!game) return;

        if (typeof VerdisBackend !== 'undefined' && VerdisBackend.isConfigured()) {
            VerdisBackend.trackPlay(slugify(game.name), game.name);
        }

        if (game.name === 'Roblox' && typeof handleRoblox === 'function') {
            handleRoblox();
            return;
        }

        if (typeof navTo === 'function') navTo(`play.html?launch=${game.url}`, game.name);
    }

    return { init, goTo, next, playGame };
})();

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load
    setTimeout(() => TopGamesCarousel.init(), 800);
});

// Global function to launch quick access items from carousel
function launchQuickAccess(type, url, name = "Favorite") {
    if (type === 'games') {
        if (typeof navTo === 'function') navTo(`play.html?launch=${url}`, name);
    } else if (type === 'apps') {
        if (typeof rSearch === 'function') rSearch(url);
    }
}
