const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../stores/gn-math');
const uvPrefix = '/uv/service/';

// XOR decode function (reverse of xorEncode in mass_proxy.js)
function xorDecode(encodedStr) {
    if (!encodedStr) return encodedStr;
    try {
        const decoded = decodeURIComponent(encodedStr);
        return decoded.split('').map((char, ind) =>
            ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char
        ).join('');
    } catch (e) {
        return null;
    }
}

// Known CDN sources for popular games - mapping game identifiers to CDN URLs
const KNOWN_CDN_SOURCES = {
    // Geometry Dash Lite (game 27)
    'geometry-dash': 'https://cdn.jsdelivr.net/gh/ArsUnblocked/assets@main/geometrydashlite/',
    'geometrydashlite': 'https://cdn.jsdelivr.net/gh/ArsUnblocked/assets@main/geometrydashlite/',

    // Death Run 3D (game 211)
    'death-run': 'https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/projects/death-run/',
    'death_run': 'https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/projects/death-run/',

    // Snow Battle (game 207)
    'snowbattle': 'https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/projects/snowbattle/',

    // Bendy (game 215)
    'bendy': 'https://cdn.jsdelivr.net/gh/3kh0/3kh0-lite@main/projects/bendy/',

    // Rerun / Return (game 260)
    'rerun': 'https://cdn.jsdelivr.net/gh/gn-math/assets@main/260/',

    // Slope (game 198)  
    'slope': 'https://cdn.jsdelivr.net/gh/gn-math/assets@main/198/',

    // Various other games
    'ultrakill': 'https://cdn.jsdelivr.net/gh/gn-math/assets@main/196/',
    'happywheels': 'https://cdn.jsdelivr.net/gh/ArsUnblocked/assets@main/happywheels/',
};

// Search for CDN by game name/identifier
function findCDNForGame(baseUrl, decodedUrl, filename) {
    // If the decoded URL is already a CDN URL, use it directly!
    if (decodedUrl) {
        if (decodedUrl.includes('cdn.jsdelivr.net') ||
            decodedUrl.includes('rawcdn.githack.com') ||
            decodedUrl.includes('raw.githubusercontent.com')) {
            // Ensure it's a proper URL
            if (!decodedUrl.startsWith('https://')) {
                decodedUrl = 'https://' + decodedUrl;
            }
            return decodedUrl.endsWith('/') ? decodedUrl : decodedUrl + '/';
        }
    }

    // Fallback to known sources
    const lowerUrl = (baseUrl || '').toLowerCase();
    const lowerFile = filename.toLowerCase();

    for (const [key, cdn] of Object.entries(KNOWN_CDN_SOURCES)) {
        if (lowerUrl.includes(key) || lowerFile.includes(key)) {
            return cdn;
        }
    }
    return null;
}

// Parse base href from HTML
function extractBaseHref(content) {
    const baseRegex = /<base\s+href=["']([^"']+)["']\s*\/?>/i;
    const match = content.match(baseRegex);
    return match ? match[1] : null;
}

// Find all relative script/link sources that need fixing
function findRelativeSources(content) {
    const patterns = [
        // Script sources
        /<script[^>]+src=["'](?!https?:\/\/|\/\/|data:)([^"']+)["'][^>]*>/gi,
        // Link hrefs (CSS)
        /<link[^>]+href=["'](?!https?:\/\/|\/\/|data:)([^"']+\.css[^"']*)["'][^>]*>/gi,
        // Image sources
        /<img[^>]+src=["'](?!https?:\/\/|\/\/|data:)([^"']+)["'][^>]*>/gi,
    ];

    const sources = [];
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            sources.push({
                full: match[0],
                path: match[1],
                type: pattern.source.includes('script') ? 'script' :
                    pattern.source.includes('link') ? 'css' : 'img'
            });
        }
    }
    return sources;
}

// Check if a game file has broken assets (uses base href + relative paths)
function analyzeGameFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    const baseHref = extractBaseHref(content);
    if (!baseHref) return null;

    // Only process files that use the UV proxy base href
    if (!baseHref.startsWith(uvPrefix)) return null;

    // Decode the base URL
    const encodedUrl = baseHref.replace(uvPrefix, '');
    const decodedUrl = xorDecode(encodedUrl);

    // Find relative sources
    const relativeSources = findRelativeSources(content);

    // Filter for Build/ or other likely broken paths
    const brokenPaths = relativeSources.filter(s =>
        s.path.startsWith('Build/') ||
        s.path.includes('/Build/') ||
        s.path.startsWith('TemplateData') ||
        s.path.startsWith('js/') ||
        s.path.startsWith('themes/')
    );

    if (brokenPaths.length === 0) return null;

    return {
        file: filename,
        filePath,
        baseHref,
        decodedUrl,
        brokenPaths: brokenPaths.map(p => p.path),
        content
    };
}

// Fix a game file by converting relative paths to absolute CDN URLs
function fixGameFile(gameInfo, cdnBase, dryRun = false) {
    let content = gameInfo.content;
    let changes = 0;

    for (const brokenPath of gameInfo.brokenPaths) {
        // Build the absolute URL
        const absoluteUrl = cdnBase.endsWith('/')
            ? cdnBase + brokenPath
            : cdnBase + '/' + brokenPath;

        // Replace in script src
        const scriptPattern = new RegExp(
            `(<script[^>]+src=["'])${escapeRegex(brokenPath)}(["'][^>]*>)`, 'gi'
        );
        const newScriptContent = content.replace(scriptPattern, `$1${absoluteUrl}$2`);

        if (newScriptContent !== content) {
            content = newScriptContent;
            changes++;
        }

        // Replace in link href
        const linkPattern = new RegExp(
            `(<link[^>]+href=["'])${escapeRegex(brokenPath)}(["'][^>]*>)`, 'gi'
        );
        const newLinkContent = content.replace(linkPattern, `$1${absoluteUrl}$2`);

        if (newLinkContent !== content) {
            content = newLinkContent;
            changes++;
        }

        // Replace in img src
        const imgPattern = new RegExp(
            `(<img[^>]+src=["'])${escapeRegex(brokenPath)}(["'][^>]*>)`, 'gi'
        );
        const newImgContent = content.replace(imgPattern, `$1${absoluteUrl}$2`);

        if (newImgContent !== content) {
            content = newImgContent;
            changes++;
        }

        // Also fix UnityLoader.instantiate calls
        const unityPattern = new RegExp(
            `(UnityLoader\\.instantiate\\([^,]+,\\s*["'])${escapeRegex(brokenPath)}(["'])`, 'gi'
        );
        const newUnityContent = content.replace(unityPattern, `$1${absoluteUrl}$2`);

        if (newUnityContent !== content) {
            content = newUnityContent;
            changes++;
        }
    }

    if (changes > 0 && !dryRun) {
        fs.writeFileSync(gameInfo.filePath, content, 'utf8');
    }

    return { changes, content };
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verbose = args.includes('--verbose');

    console.log('='.repeat(60));
    console.log('Game Asset Fix Script');
    console.log('='.repeat(60));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}`);
    console.log();

    if (!fs.existsSync(targetDir)) {
        console.error('Target directory not found:', targetDir);
        process.exit(1);
    }

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.html'));
    console.log(`Scanning ${files.length} game files...`);
    console.log();

    const brokenGames = [];
    const fixedGames = [];
    const unfixableGames = [];

    for (const file of files) {
        const filePath = path.join(targetDir, file);
        const analysis = analyzeGameFile(filePath);

        if (analysis) {
            brokenGames.push(analysis);

            // Try to find a CDN source
            const cdn = findCDNForGame(analysis.baseHref, analysis.decodedUrl, file);

            if (cdn) {
                const result = fixGameFile(analysis, cdn, dryRun);
                if (result.changes > 0) {
                    fixedGames.push({
                        ...analysis,
                        cdn,
                        changes: result.changes
                    });
                }
            } else {
                unfixableGames.push(analysis);
            }
        }
    }

    // Report
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log();

    console.log(`Total games with broken assets: ${brokenGames.length}`);
    console.log(`Games fixed: ${fixedGames.length}`);
    console.log(`Games needing manual CDN lookup: ${unfixableGames.length}`);
    console.log();

    if (fixedGames.length > 0) {
        console.log('FIXED GAMES:');
        console.log('-'.repeat(40));
        for (const game of fixedGames) {
            console.log(`  ${game.file}: ${game.changes} changes`);
            if (verbose) {
                console.log(`    CDN: ${game.cdn}`);
                console.log(`    Paths: ${game.brokenPaths.join(', ')}`);
            }
        }
        console.log();
    }

    if (unfixableGames.length > 0) {
        console.log('GAMES NEEDING MANUAL CDN LOOKUP:');
        console.log('-'.repeat(40));
        for (const game of unfixableGames) {
            console.log(`  ${game.file}`);
            console.log(`    Original URL: ${game.decodedUrl || 'Could not decode'}`);
            console.log(`    Broken paths: ${game.brokenPaths.slice(0, 3).join(', ')}${game.brokenPaths.length > 3 ? '...' : ''}`);
        }
        console.log();
        console.log('To fix these games, add their CDN sources to KNOWN_CDN_SOURCES in this script.');
    }
}

main();
