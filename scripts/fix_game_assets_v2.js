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

// Extract base href from HTML and decode original URL
function extractBaseInfo(content) {
    const baseRegex = /<base\s+href=["']([^"']+)["']\s*\/?>/i;
    const match = content.match(baseRegex);
    if (!match) return null;

    const baseHref = match[1];
    if (!baseHref.startsWith(uvPrefix)) return null;

    const encodedUrl = baseHref.replace(uvPrefix, '');
    const decodedUrl = xorDecode(encodedUrl);

    return { baseHref, decodedUrl };
}

// Extract CDN base from existing absolute URLs in the file
function extractCDNFromExistingUrls(content) {
    // Look for existing CDN URLs in script/link/img tags
    const patterns = [
        /https:\/\/rawcdn\.githack\.com\/[^"'\s]+\//g,
        /https:\/\/cdn\.jsdelivr\.net\/gh\/[^"'\s]+\//g,
        /https:\/\/raw\.githubusercontent\.com\/[^"'\s]+\//g,
    ];

    for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
            // Get the most common CDN base (likely the correct one)
            const cdnBases = {};
            for (const url of matches) {
                // Extract base path (before Build/, image/, js/, etc.)
                let base = url;
                const cutoffs = ['/Build/', '/image/', '/js/', '/css/', '/themes/', '/TemplateData/', '/assets/'];
                for (const cut of cutoffs) {
                    const idx = base.indexOf(cut);
                    if (idx !== -1) {
                        base = base.substring(0, idx + 1);
                        break;
                    }
                }
                cdnBases[base] = (cdnBases[base] || 0) + 1;
            }
            // Return most common base
            const sorted = Object.entries(cdnBases).sort((a, b) => b[1] - a[1]);
            if (sorted.length > 0) {
                return sorted[0][0];
            }
        }
    }
    return null;
}

// Find all relative paths that need fixing
function findRelativePaths(content) {
    const relativePaths = [];

    // Patterns for different resource types with relative paths
    const patterns = [
        // Script src (not starting with http, //, data:, or /)
        { regex: /<script[^>]+src=["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+)["'][^>]*>/gi, type: 'script' },
        // Link href for CSS
        { regex: /<link[^>]+href=["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+\.css[^"']*)["'][^>]*>/gi, type: 'css' },
        // Img src
        { regex: /<img[^>]+src=["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+)["'][^>]*>/gi, type: 'img' },
        // UnityLoader.instantiate with relative Build path
        { regex: /UnityLoader\.instantiate\([^,]+,\s*["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+)["']/gi, type: 'unity' },
        // audio/video src
        { regex: /<(?:audio|video)[^>]+src=["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+)["'][^>]*>/gi, type: 'media' },
        // source src
        { regex: /<source[^>]+src=["'](?!https?:\/\/|\/\/|data:|\/(?!\/))([^"']+)["'][^>]*>/gi, type: 'source' },
    ];

    for (const { regex, type } of patterns) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const relPath = match[1];
            // Skip paths that look like inline scripts or data URIs
            if (relPath && !relPath.startsWith('#') && !relPath.startsWith('javascript:')) {
                relativePaths.push({
                    full: match[0],
                    path: relPath,
                    type
                });
            }
        }
    }

    return relativePaths;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fix all relative paths in content using the CDN base
function fixRelativePaths(content, cdnBase, relativePaths) {
    let fixedContent = content;
    let changes = 0;

    for (const { path: relPath, type } of relativePaths) {
        const absoluteUrl = cdnBase.endsWith('/')
            ? cdnBase + relPath
            : cdnBase + '/' + relPath;

        const escapedPath = escapeRegex(relPath);

        let pattern;
        let replacement;

        switch (type) {
            case 'script':
                pattern = new RegExp(`(<script[^>]+src=["'])${escapedPath}(["'][^>]*>)`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
            case 'css':
                pattern = new RegExp(`(<link[^>]+href=["'])${escapedPath}(["'][^>]*>)`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
            case 'img':
                pattern = new RegExp(`(<img[^>]+src=["'])${escapedPath}(["'][^>]*>)`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
            case 'unity':
                pattern = new RegExp(`(UnityLoader\\.instantiate\\([^,]+,\\s*["'])${escapedPath}(["'])`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
            case 'media':
                pattern = new RegExp(`(<(?:audio|video)[^>]+src=["'])${escapedPath}(["'][^>]*>)`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
            case 'source':
                pattern = new RegExp(`(<source[^>]+src=["'])${escapedPath}(["'][^>]*>)`, 'gi');
                replacement = `$1${absoluteUrl}$2`;
                break;
        }

        if (pattern) {
            const newContent = fixedContent.replace(pattern, replacement);
            if (newContent !== fixedContent) {
                fixedContent = newContent;
                changes++;
            }
        }
    }

    return { content: fixedContent, changes };
}

// Process a single game file
function processGameFile(filePath, dryRun = false, verbose = false) {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file uses UV proxy base href
    const baseInfo = extractBaseInfo(content);
    if (!baseInfo) {
        // No UV proxy base - file might already be fixed or doesn't need fixing
        return { status: 'skipped', reason: 'no-uv-base', filename };
    }

    // Find relative paths that need fixing
    const relativePaths = findRelativePaths(content);
    if (relativePaths.length === 0) {
        return { status: 'skipped', reason: 'no-relative-paths', filename };
    }

    // Try to extract CDN base from existing absolute URLs
    let cdnBase = extractCDNFromExistingUrls(content);

    if (!cdnBase) {
        // Try to construct CDN from decoded URL
        if (baseInfo.decodedUrl) {
            // If decoded URL is already a CDN, use it
            if (baseInfo.decodedUrl.includes('cdn.jsdelivr.net') ||
                baseInfo.decodedUrl.includes('rawcdn.githack.com') ||
                baseInfo.decodedUrl.includes('raw.githubusercontent.com')) {
                cdnBase = baseInfo.decodedUrl;
                if (!cdnBase.startsWith('https://')) {
                    cdnBase = 'https://' + cdnBase;
                }
                if (!cdnBase.endsWith('/')) {
                    cdnBase += '/';
                }
            }
        }
    }

    if (!cdnBase) {
        return {
            status: 'unfixable',
            reason: 'no-cdn-found',
            filename,
            relativePaths: relativePaths.map(p => p.path),
            decodedUrl: baseInfo.decodedUrl
        };
    }

    // Fix the relative paths
    const result = fixRelativePaths(content, cdnBase, relativePaths);

    if (result.changes > 0) {
        if (!dryRun) {
            fs.writeFileSync(filePath, result.content, 'utf8');
        }
        return {
            status: 'fixed',
            filename,
            changes: result.changes,
            cdnBase,
            paths: relativePaths.map(p => p.path)
        };
    }

    return { status: 'unchanged', filename };
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const verbose = args.includes('--verbose');

    console.log('='.repeat(70));
    console.log('COMPREHENSIVE GAME ASSET FIX SCRIPT');
    console.log('='.repeat(70));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}`);
    console.log();

    if (!fs.existsSync(targetDir)) {
        console.error('Target directory not found:', targetDir);
        process.exit(1);
    }

    const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.html'));
    console.log(`Processing ${files.length} game files...`);
    console.log();

    const results = {
        fixed: [],
        unfixable: [],
        skipped: [],
        unchanged: []
    };

    for (const file of files) {
        const filePath = path.join(targetDir, file);
        const result = processGameFile(filePath, dryRun, verbose);

        switch (result.status) {
            case 'fixed':
                results.fixed.push(result);
                if (verbose) {
                    console.log(`✓ FIXED: ${result.filename} (${result.changes} changes)`);
                }
                break;
            case 'unfixable':
                results.unfixable.push(result);
                break;
            case 'skipped':
                results.skipped.push(result);
                break;
            case 'unchanged':
                results.unchanged.push(result);
                break;
        }
    }

    // Summary Report
    console.log('='.repeat(70));
    console.log('RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log();
    console.log(`Total files processed: ${files.length}`);
    console.log(`  ✓ Fixed: ${results.fixed.length}`);
    console.log(`  ⚠ Unfixable (need manual CDN): ${results.unfixable.length}`);
    console.log(`  - Skipped (no issues): ${results.skipped.length}`);
    console.log(`  - Unchanged: ${results.unchanged.length}`);
    console.log();

    if (results.fixed.length > 0) {
        console.log('-'.repeat(70));
        console.log('FIXED GAMES:');
        console.log('-'.repeat(70));
        for (const game of results.fixed) {
            console.log(`  ${game.filename}: ${game.changes} path(s) fixed`);
            if (verbose) {
                console.log(`    CDN: ${game.cdnBase}`);
                console.log(`    Paths: ${game.paths.slice(0, 5).join(', ')}${game.paths.length > 5 ? '...' : ''}`);
            }
        }
        console.log();
    }

    if (results.unfixable.length > 0) {
        console.log('-'.repeat(70));
        console.log('UNFIXABLE GAMES (need manual CDN lookup):');
        console.log('-'.repeat(70));
        for (const game of results.unfixable) {
            console.log(`  ${game.filename}`);
            if (verbose) {
                console.log(`    Decoded URL: ${game.decodedUrl || 'Could not decode'}`);
                console.log(`    Relative paths: ${game.relativePaths.slice(0, 3).join(', ')}${game.relativePaths.length > 3 ? '...' : ''}`);
            }
        }
        console.log();
    }

    if (dryRun) {
        console.log('='.repeat(70));
        console.log('This was a DRY RUN. Run without --dry-run to apply changes.');
        console.log('='.repeat(70));
    }
}

main();
