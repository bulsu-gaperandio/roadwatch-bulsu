/**
 * Full End-to-End System Test: RoadWatch BulSU
 * Tests Role Separation, In-Memory Workflow, Map Synchronization, and the 6-Theme System
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = __dirname;
let passed = 0;
let failed = 0;

function assert(condition, desc) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${desc}`);
    failed++;
  }
}

console.log('========================================================');
console.log('ROADWATCH BULSU: COMPLETE SYSTEM INTEGRATION AUDIT');
console.log('========================================================\n');

// 1. Files & Structure Verification
console.log('[Phase 1] Validating Core Files...');
const requiredFiles = [
  'index.html',
  'README.md',
  'css/variables.css',
  'css/themes.css',
  'css/style.css',
  'css/layout.css',
  'css/map.css',
  'css/responsive.css',
  'js/dummy-data.js',
  'js/state.js',
  'js/reports.js',
  'js/themes.js',
  'js/google-map.js',
  'js/report-form.js',
  'js/admin-review.js',
  'js/main.js',
  'pages/admin-login.html',
  'pages/admin-dashboard.html',
  'pages/admin-reviews.html',
  'pages/pothole-map.html',
  'pages/report-pothole.html',
  'pages/my-reports.html',
  'pages/theme-settings.html'
];

requiredFiles.forEach(relPath => {
  const fullPath = path.join(WORKSPACE, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
});

// 2. State & Report Operations Simulation
console.log('\n[Phase 2] Simulating In-Memory State & Citizen/Admin Workflows...');

// Setup browser globals mock
const storageMock = {};
global.localStorage = {
  getItem: (k) => storageMock[k] || null,
  setItem: (k, v) => { storageMock[k] = String(v); },
  removeItem: (k) => { delete storageMock[k]; }
};
const sessionMock = {};
global.sessionStorage = {
  getItem: (k) => sessionMock[k] || null,
  setItem: (k, v) => { sessionMock[k] = String(v); },
  removeItem: (k) => { delete sessionMock[k]; }
};

const domAttrs = {};
global.document = {
  documentElement: {
    setAttribute: (a, v) => { domAttrs[a] = v; },
    getAttribute: (a) => domAttrs[a] || null
  },
  getElementById: (id) => ({
    id,
    innerHTML: '',
    value: '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};
global.window = global;
global.window.location = { search: '', hash: '' };

// Load state modules
eval(fs.readFileSync(path.join(WORKSPACE, 'js', 'dummy-data.js'), 'utf-8'));
eval(fs.readFileSync(path.join(WORKSPACE, 'js', 'state.js'), 'utf-8'));
eval(fs.readFileSync(path.join(WORKSPACE, 'js', 'reports.js'), 'utf-8'));

assert(typeof window.AppState !== 'undefined', 'AppState is initialized');
const initialReports = window.AppState.getAllReports();
assert(initialReports.length >= 5, `Initial seed reports loaded: ${initialReports.length}`);

const initialApproved = window.AppState.getApprovedReports();
const initialPending = window.AppState.getPendingReports();
assert(initialApproved.length === 2, `Initial approved reports: ${initialApproved.length}`);
assert(initialPending.length === 2, `Initial pending reports: ${initialPending.length}`);

// Citizen adds new report
const newRep = window.AppState.submitReport({
  roadName: 'MacArthur Hwy near Gate 1',
  barangay: 'Guinhawa',
  city: 'Malolos',
  latitude: 14.8530,
  longitude: 120.8165,
  severity: 'High',
  description: 'Deep road cavity causing vehicular swerving.',
  photo: 'assets/images/sample-pothole-1.jpg',
  reporterName: 'Juan Dela Cruz'
});

assert(newRep.status === 'Pending Review', 'New citizen report has status "Pending Review"');
assert(window.AppState.getPendingReports().length === 3, 'Pending reports count incremented to 3');
assert(window.AppState.getApprovedReports().length === 2, 'Approved public reports remain unchanged at 2');

// Administrator reviews and approves the report
const approvedSuccess = window.AppState.approveReport(newRep.id, 'Verified genuine hazard by DPWH BulSU inspection.', 'High');
assert(approvedSuccess === true, 'Report approved successfully');
const updatedRep = window.AppState.getReportById(newRep.id);
assert(updatedRep.status === 'Approved', 'Report status changed to "Approved"');
assert(window.AppState.getApprovedReports().length === 3, 'Approved public reports now 3');
assert(window.AppState.getPendingReports().length === 2, 'Pending review queue decremented to 2');

// 3. Multi-Theme Switching Test
console.log('\n[Phase 3] Testing Multi-Theme System Switching & Tile Sync...');
eval(fs.readFileSync(path.join(WORKSPACE, 'js', 'themes.js'), 'utf-8'));
eval(fs.readFileSync(path.join(WORKSPACE, 'js', 'google-map.js'), 'utf-8'));

assert(typeof window.ThemeManager !== 'undefined', 'ThemeManager is loaded');
assert(typeof window.MapService !== 'undefined', 'MapService is loaded');

// Test switching through each of the 6 themes
const allThemes = window.ThemeManager.THEMES;
allThemes.forEach(theme => {
  window.ThemeManager.setTheme(theme.id, true);
  assert(domAttrs['data-theme'] === theme.id, `Theme switched to: ${theme.name}`);
  assert(domAttrs['data-theme-mode'] === theme.mode, `Theme mode correctly set to: ${theme.mode}`);
  assert(storageMock['roadwatch_theme'] === theme.id, `localStorage updated to: ${theme.id}`);

  // Test map tile URL for this theme
  const tileUrl = window.MapService._getTileUrl();
  if (theme.mode === 'light') {
    assert(tileUrl.includes('light_all'), `${theme.name} (light) serves CartoDB light_all tiles`);
  } else {
    assert(tileUrl.includes('dark_all'), `${theme.name} (dark) serves CartoDB dark_all tiles`);
  }
});

// Final check: reset to default brand-daylight
window.ThemeManager.setTheme('brand-daylight', true);
assert(domAttrs['data-theme'] === 'brand-daylight', 'Final reset to Brand Sheet Daylight');
assert(domAttrs['data-theme-mode'] === 'light', 'Mode is light');

console.log('\n========================================================');
console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('========================================================');

if (failed > 0) process.exit(1);
