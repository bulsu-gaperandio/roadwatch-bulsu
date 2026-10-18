/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Main Application Orchestrator: Strict Citizen/Admin Separation, Route Guard & Session Auth
 */

(function (window) {
  'use strict';

  // ==========================================================================
  // AUTHENTICATION SERVICE (Session-only demo authentication)
  // ==========================================================================
  const AuthService = {
    SESSION_KEY: 'roadwatch_admin_auth',
    USER_KEY: 'roadwatch_admin_user',

    isAuthenticated: function () {
      return sessionStorage.getItem(this.SESSION_KEY) === 'true';
    },

    signIn: function (username, password) {
      // Demo-only administrator credential verification
      // Credentials clearly documented for evaluator demonstration: admin / bulsu2026
      const u = (username || '').trim().toLowerCase();
      const p = (password || '').trim();

      if (u === 'admin' && p === 'bulsu2026') {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
        sessionStorage.setItem(this.USER_KEY, 'Highway Administrator');
        return { success: true };
      }

      return {
        success: false,
        message: 'Invalid administrator credentials. Demo access: admin / bulsu2026'
      };
    },

    signOut: function () {
      sessionStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }
  };

  window.AuthService = AuthService;

  // ==========================================================================
  // GLOBAL TOAST NOTIFICATIONS
  // ==========================================================================
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <div style="flex: 1; font-size: 0.88rem; line-height: 1.35;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  };

  // ==========================================================================
  // CORE APPLICATION CONTROLLER
  // ==========================================================================
  let _activeViewId = 'view-home';

  const App = {
    init: function () {
      this.bindNavigation();
      this.bindLoginForm();
      this.bindSignOut();
      this.bindMobileDrawer();
      this.bindGoogleMapsConfigModal();
      this.bindThemeModal();
      this.bindResetSession();

      // Initialize sub-controllers
      if (window.ReportFormController) window.ReportFormController.init();
      if (window.AdminReviewController) window.AdminReviewController.init();

      // Subscribe My Reports view to in-memory state
      if (window.AppState) {
        window.AppState.subscribe(() => {
          this.renderMyReports();
        });
      }

      // Check initial auth state and route
      this.syncNavigationState();
      this.handleRouteFromHash();
      window.addEventListener('hashchange', () => this.handleRouteFromHash());
    },

    /**
     * Synchronize sidebar and topbar elements based on active authentication state
     */
    syncNavigationState: function () {
      const isAuth = AuthService.isAuthenticated();
      const citizenNav = document.getElementById('nav-section-citizen');
      const adminNav = document.getElementById('nav-section-admin');
      const topbarStats = document.getElementById('topbar-admin-stats');
      const topbarSignOut = document.getElementById('topbar-admin-signout');
      const topbarCitizenCta = document.getElementById('topbar-citizen-cta');

      if (isAuth) {
        // Administrator is signed in
        if (citizenNav) citizenNav.style.display = 'none';
        if (adminNav) adminNav.style.display = 'flex';
        if (topbarStats) topbarStats.style.display = 'flex';
        if (topbarSignOut) topbarSignOut.style.display = 'inline-flex';
        if (topbarCitizenCta) topbarCitizenCta.style.display = 'none';
      } else {
        // Public citizen mode (strictly unauthenticated)
        if (citizenNav) citizenNav.style.display = 'flex';
        if (adminNav) adminNav.style.display = 'none';
        if (topbarStats) topbarStats.style.display = 'none';
        if (topbarSignOut) topbarSignOut.style.display = 'none';
        if (topbarCitizenCta) topbarCitizenCta.style.display = 'inline-flex';
      }
    },

    /**
     * Route guard: validates authorization before opening view
     */
    handleRouteFromHash: function () {
      const hash = window.location.hash.replace('#', '') || 'home';

      // Define protected administrator routes
      const protectedAdminRoutes = [
        'admin-dashboard',
        'admin-reviews',
        'admin-approved',
        'admin-history'
      ];

      const routeViewMap = {
        'home': 'view-home',
        'report': 'view-report',
        'map': 'view-map',
        'my-reports': 'view-my-reports',
        'themes': 'view-themes',
        'admin-login': 'view-admin-login',
        'admin-dashboard': 'view-admin-dashboard',
        'admin-reviews': 'view-admin-reviews',
        'admin-approved': 'view-admin-approved',
        'admin-history': 'view-admin-history'
      };

      // 1. Guard protected admin routes
      if (protectedAdminRoutes.includes(hash)) {
        if (!AuthService.isAuthenticated()) {
          window.showToast('Administrator authentication required to access this portal.', 'warning');
          window.location.hash = 'admin-login';
          return;
        }
      }

      // 2. Prevent already signed-in admin from seeing login page
      if (hash === 'admin-login' && AuthService.isAuthenticated()) {
        window.location.hash = 'admin-dashboard';
        return;
      }

      // 3. Resolve target view
      const viewId = routeViewMap[hash] || 'view-home';

      // Ensure sidebar/topbar reflects the role appropriate for the route & auth
      this.syncNavigationState();

      // Render view
      this.navigateToView(viewId);
    },

    /**
     * Switch view without page reload to preserve in-memory state
     */
    navigateToView: function (viewId) {
      const views = document.querySelectorAll('.view-section');
      const targetView = document.getElementById(viewId);
      if (!targetView) return;

      views.forEach(v => v.classList.remove('active'));
      targetView.classList.add('active');
      _activeViewId = viewId;

      // Update sidebar nav active link
      const navLinks = document.querySelectorAll('.nav-item');
      navLinks.forEach(link => {
        const linkView = link.getAttribute('data-view');
        if (linkView === viewId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Update Topbar Title & Breadcrumb
      this.updateTopbarTitles(viewId);

      // Close mobile drawer if open
      this.closeMobileDrawer();

      // Trigger map resize/refresh if switching to map or report view
      if (viewId === 'view-map') {
        setTimeout(() => {
          if (!window.MapService._activePublicMap) {
            window.MapService.initPublicMap('public-google-map');
          } else {
            window.MapService.refreshPublicMarkers();
          }
        }, 80);
      } else if (viewId === 'view-report') {
        setTimeout(() => {
          if (window.MapService) {
            window.MapService.initLocationPicker('report-location-picker-map', (lat, lng) => {
              const latDisplay = document.getElementById('display-lat');
              const lngDisplay = document.getElementById('display-lng');
              if (latDisplay) latDisplay.textContent = lat.toFixed(5);
              if (lngDisplay) lngDisplay.textContent = lng.toFixed(5);
            });
          }
        }, 80);
      }

      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateTopbarTitles: function (viewId) {
      const titleEl = document.getElementById('topbar-page-title');
      const subtitleEl = document.getElementById('topbar-page-subtitle');
      if (!titleEl || !subtitleEl) return;

      const titles = {
        'view-home': { 
          title: 'RoadWatch BulSU • Citizen Portal', 
          sub: 'Bulacan Pothole Reporting & Road Hazard Monitoring' 
        },
        'view-report': { 
          title: 'Report a Road Hazard', 
          sub: 'Upload road photograph & select GPS coordinates' 
        },
        'view-map': { 
          title: 'Confirmed Public Pothole Map', 
          sub: 'Real-time interactive markers of administrator-approved potholes' 
        },
        'view-my-reports': { 
          title: 'Citizen Report History', 
          sub: 'Track review and verification statuses of your submitted reports' 
        },
        'view-themes': {
          title: 'Official Brand Multi-Theme System',
          sub: 'Select from 6 bespoke visual themes with exact brand palette swatches'
        },
        'view-admin-login': { 
          title: 'Administrator Sign In', 
          sub: 'Staff authentication gateway for highway evaluators' 
        },
        'view-admin-dashboard': { 
          title: 'Administrator Control Center', 
          sub: 'Highway hazard review statistics and oversight' 
        },
        'view-admin-reviews': { 
          title: 'Report Verification Queue', 
          sub: 'Inspect photographs, verify damage, and approve or reject reports' 
        },
        'view-admin-approved': {
          title: 'Confirmed Approved Potholes',
          sub: 'Active road hazards currently published on the public map'
        },
        'view-admin-history': {
          title: 'Administrative Decision Archive',
          sub: 'Full audit history of approved, rejected, and resolved road hazards'
        }
      };

      const meta = titles[viewId] || { title: 'RoadWatch BulSU', sub: 'Bulacan Pothole Monitoring' };
      titleEl.textContent = meta.title;
      subtitleEl.textContent = meta.sub;
    },

    bindNavigation: function () {
      // Sidebar and In-Page Links with data-view
      const navLinks = document.querySelectorAll('[data-view]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const viewId = link.getAttribute('data-view');
          const hashMap = {
            'view-home': 'home',
            'view-report': 'report',
            'view-map': 'map',
            'view-my-reports': 'my-reports',
            'view-themes': 'themes',
            'view-admin-login': 'admin-login',
            'view-admin-dashboard': 'admin-dashboard',
            'view-admin-reviews': 'admin-reviews',
            'view-admin-approved': 'admin-approved',
            'view-admin-history': 'admin-history'
          };
          if (hashMap[viewId]) {
            window.location.hash = hashMap[viewId];
          } else {
            this.navigateToView(viewId);
          }
        });
      });

      // Public Map Search & Filters
      const mapSearchInput = document.getElementById('map-search-input');
      const mapSeveritySelect = document.getElementById('map-severity-filter');
      const btnResetCenter = document.getElementById('btn-reset-map-center');
      const btnCloseDrawer = document.getElementById('btn-close-side-drawer');

      if (mapSearchInput) {
        mapSearchInput.addEventListener('input', () => {
          this.triggerMapFilter();
        });
      }

      if (mapSeveritySelect) {
        mapSeveritySelect.addEventListener('change', () => {
          this.triggerMapFilter();
        });
      }

      if (btnResetCenter) {
        btnResetCenter.addEventListener('click', () => {
          if (window.MapService) window.MapService.resetCampusCenter();
        });
      }

      if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener('click', () => {
          if (window.MapService) window.MapService.closeSideDrawer();
        });
      }
    },

    triggerMapFilter: function () {
      const search = document.getElementById('map-search-input')?.value.trim() || '';
      const severity = document.getElementById('map-severity-filter')?.value || 'all';
      if (window.MapService) {
        window.MapService.refreshPublicMarkers({ search, severity });
      }
    },

    bindLoginForm: function () {
      const form = document.getElementById('admin-login-form');
      const errorEl = document.getElementById('admin-login-error');
      const btnToggle = document.getElementById('btn-toggle-password');
      const passwordInput = document.getElementById('admin-password-input');

      if (btnToggle && passwordInput) {
        btnToggle.addEventListener('click', () => {
          const isPassword = passwordInput.type === 'password';
          passwordInput.type = isPassword ? 'text' : 'password';
          btnToggle.innerHTML = isPassword ? '👁️‍🗨️' : '👁️';
          btnToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (errorEl) errorEl.style.display = 'none';

          const username = document.getElementById('admin-username-input')?.value || '';
          const password = passwordInput?.value || '';

          const result = AuthService.signIn(username, password);
          if (result.success) {
            this.syncNavigationState();
            window.showToast('Authentication successful. Welcome, Highway Administrator.', 'success');
            form.reset();
            window.location.hash = 'admin-dashboard';
          } else {
            if (errorEl) {
              errorEl.textContent = result.message;
              errorEl.style.display = 'block';
            }
            if (passwordInput) passwordInput.focus();
          }
        });
      }
    },

    bindSignOut: function () {
      const signoutBtns = document.querySelectorAll('.btn-admin-signout');
      signoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to sign out of the Administrator Portal?')) {
            AuthService.signOut();
            this.syncNavigationState();
            window.showToast('Signed out of administrator portal.', 'info');
            window.location.hash = 'home';
          }
        });
      });
    },

    bindMobileDrawer: function () {
      const toggle = document.getElementById('mobile-drawer-toggle');
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');

      if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
          sidebar.classList.toggle('mobile-open');
          if (backdrop) backdrop.classList.toggle('active');
        });
      }

      if (backdrop) {
        backdrop.addEventListener('click', () => {
          this.closeMobileDrawer();
        });
      }
    },

    closeMobileDrawer: function () {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('active');
    },

    /**
     * Renders Citizen "My Reports" table from in-memory state
     */
    renderMyReports: function () {
      const tbody = document.getElementById('my-reports-tbody');
      if (!tbody || !window.AppState) return;

      const reports = window.AppState.getAllReports();
      if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2.5rem;">No reports submitted yet in this session.</td></tr>`;
        return;
      }

      tbody.innerHTML = reports.map(r => `
        <tr>
          <td><strong class="text-cyan">${r.id}</strong></td>
          <td>
            <img src="${r.photo}" alt="${r.roadName}" class="table-thumb" onerror="this.src='assets/images/pothole-placeholder.svg'" />
          </td>
          <td>
            <div style="font-weight: 600; color: var(--color-starlight);">${r.roadName}</div>
            <div class="text-muted" style="font-size: 0.78rem;">Brgy. ${r.barangay}, ${r.city}</div>
          </td>
          <td>
            <span class="text-muted" style="font-size: 0.82rem;">${r.submittedAt}</span>
          </td>
          <td>
            ${window.AdminReviewController ? window.AdminReviewController._getStatusBadgeHtml(r.status) : r.status}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-view-my-report" data-id="${r.id}">
              View Details
            </button>
          </td>
        </tr>
      `).join('');

      // Attach view detail handlers
      const detailBtns = tbody.querySelectorAll('.btn-view-my-report');
      detailBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const report = window.AppState.getReportById(id);
          if (report) {
            alert(`Citizen Report Record: [${report.id}]\nRoad: ${report.roadName}\nBarangay: ${report.barangay}\nCoordinates: ${report.latitude.toFixed(5)}° N, ${report.longitude.toFixed(5)}° E\nStatus: ${report.status}\nReview Note: ${report.reviewNotes || 'Your report is currently awaiting highway evaluator inspection.'}`);
          }
        });
      });
    },

    bindGoogleMapsConfigModal: function () {
      const btnOpen = document.querySelectorAll('.btn-open-maps-modal');
      const modal = document.getElementById('maps-config-modal');
      const btnClose = document.getElementById('btn-close-maps-modal');
      const btnApply = document.getElementById('btn-apply-maps-key');
      const inputKey = document.getElementById('input-google-maps-key');

      btnOpen.forEach(b => {
        b.addEventListener('click', () => {
          if (modal) modal.classList.add('active');
        });
      });

      if (btnClose && modal) {
        btnClose.addEventListener('click', () => modal.classList.remove('active'));
      }

      if (btnApply && inputKey && modal) {
        btnApply.addEventListener('click', () => {
          const key = inputKey.value.trim();
          if (!key) {
            alert('Please enter a valid Google Maps API Key or close this dialog to continue using the interactive dark fallback.');
            return;
          }
          if (window.MapService) {
            window.MapService.setApiKey(key);
            window.showToast('Google Maps API Key applied. Initializing Maps JavaScript API...', 'info');
          }
          modal.classList.remove('active');
        });
      }
    },

    bindThemeModal: function () {
      const btnTopbarThemes = document.getElementById('btn-topbar-themes');
      const modal = document.getElementById('theme-config-modal');
      const btnClose = document.getElementById('btn-close-theme-modal');

      if (btnTopbarThemes && modal) {
        btnTopbarThemes.addEventListener('click', () => {
          modal.classList.add('active');
          if (window.ThemeManager) {
            window.ThemeManager.renderThemeSelectionCards('theme-modal-selection-list');
          }
        });
      }

      if (btnClose && modal) {
        btnClose.addEventListener('click', () => modal.classList.remove('active'));
      }

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('active');
        });
      }
    },

    bindResetSession: function () {
      const resetBtn = document.getElementById('btn-reset-demo-session');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Reset in-memory demo data to initial seed reports? Any reports submitted during this active session will be reset.')) {
            window.AppState.resetSession();
            window.showToast('In-memory state reset to seed reports.', 'info');
          }
        });
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

  window.App = App;

})(window);
