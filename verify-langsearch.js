#!/usr/bin/env node
/**
 * Simple verification script for LangSearch integration
 * Run with: node verify-langsearch.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying LangSearch Integration...\n');

let allPassed = true;

// Test 1: Check if search.html exists
console.log('✓ Checking if search.html exists...');
if (fs.existsSync(path.join(__dirname, 'search.html'))) {
    console.log('  ✅ search.html found\n');
} else {
    console.log('  ❌ search.html NOT found\n');
    allPassed = false;
}

// Test 2: Check if API key is present in search.html
console.log('✓ Checking if API key is configured...');
const searchHtml = fs.readFileSync(path.join(__dirname, 'search.html'), 'utf8');
if (searchHtml.includes('sk-0f90e3aff838488aa561c7846db184e2')) {
    console.log('  ✅ API key found in search.html\n');
} else {
    console.log('  ❌ API key NOT found in search.html\n');
    allPassed = false;
}

// Test 3: Check if LangSearch API endpoint is correct
console.log('✓ Checking API endpoint...');
if (searchHtml.includes('https://api.langsearch.com/v1/web-search')) {
    console.log('  ✅ API endpoint correctly configured\n');
} else {
    console.log('  ❌ API endpoint NOT found or incorrect\n');
    allPassed = false;
}

// Test 4: Check if LangSearch is added to dropdown options
console.log('✓ Checking dropdown.js for LangSearch option...');
const dropdownJs = fs.readFileSync(path.join(__dirname, 'assets/js/dropdown.js'), 'utf8');
if (dropdownJs.includes('"LangSearch"')) {
    console.log('  ✅ LangSearch added to dropdown options\n');
} else {
    console.log('  ❌ LangSearch NOT in dropdown options\n');
    allPassed = false;
}

// Test 5: Check if browserfunctions.js handles LangSearch
console.log('✓ Checking browserfunctions.js for LangSearch handling...');
const browserFunctionsJs = fs.readFileSync(path.join(__dirname, 'assets/js/browserfunctions.js'), 'utf8');
if (browserFunctionsJs.includes('LANGSEARCH') && browserFunctionsJs.includes('/search.html')) {
    console.log('  ✅ LangSearch properly handled in navigation\n');
} else {
    console.log('  ❌ LangSearch handling NOT properly configured\n');
    allPassed = false;
}

// Test 6: Check for Vanta fog dependencies
console.log('✓ Checking Vanta fog dependencies...');
if (searchHtml.includes('vanta.fog.min.js') && searchHtml.includes('three.min.js')) {
    console.log('  ✅ Vanta fog dependencies included\n');
} else {
    console.log('  ❌ Vanta fog dependencies MISSING\n');
    allPassed = false;
}

// Test 7: Check if documentation files exist
console.log('✓ Checking documentation files...');
let docCount = 0;
if (fs.existsSync(path.join(__dirname, 'LANGSEARCH.md'))) {
    console.log('  ✅ LANGSEARCH.md found');
    docCount++;
}
if (fs.existsSync(path.join(__dirname, 'USAGE.md'))) {
    console.log('  ✅ USAGE.md found');
    docCount++;
}
if (docCount === 2) {
    console.log('  ✅ All documentation files present\n');
} else {
    console.log('  ⚠️  Some documentation files missing\n');
}

// Test 8: Check CSS files
console.log('✓ Checking CSS files...');
if (fs.existsSync(path.join(__dirname, 'assets/css/langsearch.css'))) {
    console.log('  ✅ langsearch.css found\n');
} else {
    console.log('  ❌ langsearch.css NOT found\n');
    allPassed = false;
}

// Summary
console.log('═'.repeat(50));
if (allPassed) {
    console.log('✅ All critical checks passed!');
    console.log('\n🎉 LangSearch is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Open the app in a browser');
    console.log('2. Go to Settings > Proxy > Search Engine');
    console.log('3. Select "LangSearch"');
    console.log('4. Try searching from the homepage');
    process.exit(0);
} else {
    console.log('❌ Some checks failed. Please review the errors above.');
    process.exit(1);
}
