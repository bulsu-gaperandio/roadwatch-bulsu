/**
 * Automated Verification Script: Multi-Theme System & Brand Sheet Fidelity
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = __dirname;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('ROADWATCH BULSU: MULTI-THEME SYSTEM VERIFICATION');
console.log('====================================================\n');

// 1. Check variables.css for exact brand colors & 6 themes
console.log('[1] Checking css/variables.css...');
const variablesCss = fs.readFileSync(path.join(WORKSPACE, 'css', 'variables.css'), 'utf-8');

const brandColors = [
  '#6D28D9', // Cosmic Purple
  '#A78BFA', // Luminous Lavender
  '#075985', // Deep Nebula Blue
  '#00F2FE', // Electric Cyan
  '#EBF3FC', // Starlight Ice
  '#E0F2FE', // Sky Mist
  '#F3EEFF', // Lavender Mist
  '#FFFFFF', // White
  '#050B16', // Deep Space Black
  '#0A1432', // Royal Indigo
  '#13224E', // Luminous Indigo
  '#0E1726'  // Night Surface
];

brandColors.forEach(color => {
  assert(variablesCss.includes(color), `Contains official brand color: ${color}`);
});

const themeIds = [
  'brand-daylight',
  'corporate-aurora',
  'nebula-sky',
  'cosmic-studio',
  'deep-space',
  'nebula-midnight'
];

themeIds.forEach(id => {
  assert(variablesCss.includes(`data-theme="${id}"`), `Scoped rules exist for theme: ${id}`);
});

// Check status badges mapping in variables.css
assert(variablesCss.includes('--status-submitted-bg: #334155'), 'Light mode status submitted bg (#334155)');
assert(variablesCss.includes('--status-submitted-text: #F8FAFC'), 'Light mode status submitted text (#F8FAFC)');
assert(variablesCss.includes('--status-under-review-bg: #78350F'), 'Light mode status under review bg (#78350F)');
assert(variablesCss.includes('--status-under-review-text: #FEF3C7'), 'Light mode status under review text (#FEF3C7)');
assert(variablesCss.includes('--status-in-progress-bg: #075985'), 'Light mode status in progress bg (#075985)');
assert(variablesCss.includes('--status-in-progress-text: #F0F9FF'), 'Light mode status in progress text (#F0F9FF)');
assert(variablesCss.includes('--status-resolved-bg: #064E3B'), 'Light mode status resolved bg (#064E3B)');
assert(variablesCss.includes('--status-resolved-text: #ECFDF5'), 'Light mode status resolved text (#ECFDF5)');

assert(variablesCss.includes('--status-submitted-bg: #E2E8F0'), 'Dark mode status submitted bg (#E2E8F0)');
assert(variablesCss.includes('--status-submitted-text: #050B16'), 'Dark mode status submitted text (#050B16)');
assert(variablesCss.includes('--status-under-review-bg: #FEF3C7'), 'Dark mode status under review bg (#FEF3C7)');
assert(variablesCss.includes('--status-under-review-text: #78350F'), 'Dark mode status under review text (#78350F)');
assert(variablesCss.includes('--status-in-progress-bg: #E0F2FE'), 'Dark mode status in progress bg (#E0F2FE)');
assert(variablesCss.includes('--status-in-progress-text: #075985'), 'Dark mode status in progress text (#075985)');
assert(variablesCss.includes('--status-resolved-bg: #D1FAE5'), 'Dark mode status resolved bg (#D1FAE5)');
assert(variablesCss.includes('--status-resolved-text: #064E3B'), 'Dark mode status resolved text (#064E3B)');

// 2. Check js/themes.js execution and ThemeManager in simulated DOM
console.log('\n[2] Checking js/themes.js & ThemeManager runtime...');
const storageMock = {};
global.localStorage = {
  getItem: (key) => storageMock[key] || null,
  setItem: (key, val) => { storageMock[key] = String(val); },
  removeItem: (key) => { delete storageMock[key]; }
};

const domAttributes = {};
global.document = {
  documentElement: {
    setAttribute: (attr, val) => { domAttributes[attr] = val; },
    getAttribute: (attr) => domAttributes[attr] || null
  },
  getElementById: (id) => {
    return {
      id: id,
      innerHTML: '',
      querySelectorAll: () => [],
      querySelector: () => null
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};
global.window = global;

const themesJsCode = fs.readFileSync(path.join(WORKSPACE, 'js', 'themes.js'), 'utf-8');
eval(themesJsCode);

assert(typeof window.ThemeManager !== 'undefined', 'window.ThemeManager is registered');
assert(Array.isArray(window.ThemeManager.THEMES), 'ThemeManager.THEMES is an array');
assert(window.ThemeManager.THEMES.length === 6, 'Exactly 6 themes are defined');

const themes = window.ThemeManager.THEMES;
assert(themes[0].id === 'brand-daylight', 'Theme 1 is brand-daylight');
assert(themes[0].isDefault === true, 'Theme 1 isDefault is true');
assert(themes[0].mode === 'light', 'Theme 1 mode is light');

assert(themes[1].id === 'corporate-aurora', 'Theme 2 is corporate-aurora');
assert(themes[1].mode === 'dark', 'Theme 2 mode is dark');

assert(themes[2].id === 'nebula-sky', 'Theme 3 is nebula-sky');
assert(themes[2].mode === 'light', 'Theme 3 mode is light');

assert(themes[3].id === 'cosmic-studio', 'Theme 4 is cosmic-studio');
assert(themes[3].mode === 'light', 'Theme 4 mode is light');

assert(themes[4].id === 'deep-space', 'Theme 5 is deep-space');
assert(themes[4].mode === 'dark', 'Theme 5 mode is dark');

assert(themes[5].id === 'nebula-midnight', 'Theme 6 is nebula-midnight');
assert(themes[5].mode === 'dark', 'Theme 6 mode is dark');

// Check swatches count and names
themes.forEach(t => {
  assert(t.swatches && t.swatches.length === 5, `${t.name} has exactly 5 swatches`);
  assert(t.swatchNames && t.swatchNames.length === 5, `${t.name} has 5 swatch names`);
  assert(Boolean(t.icon), `${t.name} has an icon: ${t.icon}`);
  assert(Boolean(t.description), `${t.name} has a description`);
});

// Test switching theme and reactive persistence
let subscriberNotified = false;
let subscriberTheme = null;
window.ThemeManager.subscribe((t) => {
  subscriberNotified = true;
  subscriberTheme = t;
});

window.ThemeManager.setTheme('corporate-aurora', true);
assert(domAttributes['data-theme'] === 'corporate-aurora', 'Setting corporate-aurora sets data-theme');
assert(domAttributes['data-theme-mode'] === 'dark', 'Setting corporate-aurora sets data-theme-mode to dark');
assert(storageMock['roadwatch_theme'] === 'corporate-aurora', 'Theme persists in localStorage[roadwatch_theme]');
assert(subscriberNotified && subscriberTheme.id === 'corporate-aurora', 'Subscriber notified of theme switch');

// Switch to light theme
window.ThemeManager.setTheme('nebula-sky', true);
assert(domAttributes['data-theme'] === 'nebula-sky', 'Setting nebula-sky sets data-theme');
assert(domAttributes['data-theme-mode'] === 'light', 'Setting nebula-sky sets data-theme-mode to light');
assert(storageMock['roadwatch_theme'] === 'nebula-sky', 'Theme persists in localStorage[roadwatch_theme]');

// Reset to default
window.ThemeManager.setTheme('brand-daylight', true);
assert(domAttributes['data-theme'] === 'brand-daylight', 'Reset to brand-daylight sets data-theme');
assert(domAttributes['data-theme-mode'] === 'light', 'Reset to brand-daylight sets data-theme-mode to light');

// Test card rendering template
let containerMock = { innerHTML: '', querySelectorAll: () => [] };
global.document.getElementById = (id) => containerMock;
window.ThemeManager.renderThemeSelectionCards('test-container');
assert(containerMock.innerHTML.includes('theme-card'), 'Rendered HTML contains theme-card elements');
assert(containerMock.innerHTML.includes('theme-card-icon-wrap'), 'Rendered HTML contains icon container');
assert(containerMock.innerHTML.includes('theme-card-active-badge'), 'Rendered HTML contains ACTIVE badge for selected theme');
assert(containerMock.innerHTML.includes('theme-swatch'), 'Rendered HTML contains theme-swatch items');
assert(containerMock.innerHTML.includes('theme-card-indicator'), 'Rendered HTML contains circular radio selection indicator');

// 3. Check index.html integration
console.log('\n[3] Checking index.html markup & entry points...');
const indexHtml = fs.readFileSync(path.join(WORKSPACE, 'index.html'), 'utf-8');

assert(indexHtml.includes('localStorage.getItem(\'roadwatch_theme\')'), 'Zero-flicker script in head reads roadwatch_theme');
assert(indexHtml.includes('css/themes.css'), 'Linked css/themes.css in head');
assert(indexHtml.includes('js/themes.js'), 'Linked js/themes.js script bundle');
assert(indexHtml.includes('id="view-themes"'), 'Contains View 10 (#view-themes) section');
assert(indexHtml.includes('id="theme-selection-list"'), 'Contains #theme-selection-list container');
assert(indexHtml.includes('id="btn-topbar-themes"'), 'Contains quick topbar button #btn-topbar-themes');
assert(indexHtml.includes('id="theme-config-modal"'), 'Contains Theme Selection modal #theme-config-modal');
assert(indexHtml.includes('id="theme-modal-selection-list"'), 'Contains modal theme list container');
assert(indexHtml.includes('href="#themes"'), 'Contains navigation links pointing to #themes');

// 4. Check google-map.js theme reactivity
console.log('\n[4] Checking js/google-map.js map tile reactivity...');
const mapJsCode = fs.readFileSync(path.join(WORKSPACE, 'js', 'google-map.js'), 'utf-8');

assert(mapJsCode.includes('_publicTileLayer'), 'google-map.js tracks _publicTileLayer');
assert(mapJsCode.includes('_getTileUrl'), 'google-map.js implements _getTileUrl()');
assert(mapJsCode.includes('updateMapTheme'), 'google-map.js implements updateMapTheme()');
assert(mapJsCode.includes('light_all'), 'google-map.js supports CartoDB light_all tiles for light mode');
assert(mapJsCode.includes('dark_all'), 'google-map.js supports CartoDB dark_all tiles for dark mode');
assert(mapJsCode.includes('ThemeManager.subscribe'), 'google-map.js subscribes to ThemeManager');

// 5. Check pages/theme-settings.html
console.log('\n[5] Checking pages/theme-settings.html...');
const themeSettingsHtml = fs.readFileSync(path.join(WORKSPACE, 'pages', 'theme-settings.html'), 'utf-8');
assert(themeSettingsHtml.includes('../index.html#themes'), 'theme-settings.html routes to ../index.html#themes');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🌟 ALL THEME SYSTEM TESTS PASSED PERFECTLY!\n');
}
