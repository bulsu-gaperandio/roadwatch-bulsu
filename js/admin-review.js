/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Administrator Review Controller: Verification Queue, Photo Inspection & Workflow Actions
 */

(function (window) {
  'use strict';

  let _currentInspectedReportId = null;
  let _activeFilter = 'all';

  const AdminReviewController = {
    init: function () {
      this.bindQueueFilters();
      this.bindInspectionActions();
      this.bindSearchFilter();

      // Subscribe to in-memory state changes
      if (window.AppState) {
        window.AppState.subscribe(() => {
          this.renderDashboardStats();
          this.renderReviewQueue();
          this.renderApprovedPotholes();
          this.renderReportHistory();
        });
      }
    },

    renderDashboardStats: function () {
      if (!window.AppState) return;
      const stats = window.AppState.getStatistics();

      // Topbar chips
      const chipPending = document.getElementById('topbar-pending-count');
      const chipApproved = document.getElementById('topbar-approved-count');
      if (chipPending) chipPending.textContent = stats.pending;
      if (chipApproved) chipApproved.textContent = stats.approved;

      // Sidebar badges
      const navBadge = document.getElementById('nav-pending-badge');
      if (navBadge) navBadge.textContent = stats.pending;

      // Dashboard stat widgets
      const elTotal = document.getElementById('stat-total-reports');
      const elPending = document.getElementById('stat-pending-reviews');
      const elApproved = document.getElementById('stat-approved-potholes');
      const elRejected = document.getElementById('stat-rejected-reports');

      if (elTotal) elTotal.textContent = stats.total;
      if (elPending) elPending.textContent = stats.pending;
      if (elApproved) elApproved.textContent = stats.approved;
      if (elRejected) elRejected.textContent = stats.rejected;

      // Render Dashboard Recent Submissions Table
      this.renderRecentDashboardTable();
    },

    renderRecentDashboardTable: function () {
      const tbody = document.getElementById('admin-recent-tbody');
      if (!tbody || !window.AppState) return;

      const recentReports = window.AppState.getAllReports().slice(0, 5);
      if (recentReports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No reports recorded in current session.</td></tr>`;
        return;
      }

      tbody.innerHTML = recentReports.map(report => `
        <tr>
          <td><strong class="text-cyan">${report.id}</strong></td>
          <td>
            <img src="${report.photo}" alt="${report.roadName}" class="table-thumb" onerror="this.src='assets/images/pothole-placeholder.svg'" />
          </td>
          <td>
            <strong>${report.roadName}</strong>
            <div class="text-muted" style="font-size: 0.78rem;">Brgy. ${report.barangay}</div>
          </td>
          <td>
            <span class="severity-pill ${report.severity.toLowerCase()}">${report.severity}</span>
          </td>
          <td>
            ${this._getStatusBadgeHtml(report.status)}
          </td>
          <td>
            <button class="btn btn-outline-cyan btn-sm btn-inspect-report" data-id="${report.id}">
              Inspect
            </button>
          </td>
        </tr>
      `).join('');

      this._attachInspectButtonListeners(tbody);
    },

    renderReviewQueue: function () {
      const tbody = document.getElementById('admin-queue-tbody');
      if (!tbody || !window.AppState) return;

      const allReports = window.AppState.getAllReports();
      const filtered = allReports.filter(r => {
        if (_activeFilter === 'pending') return r.status === 'Pending Review';
        if (_activeFilter === 'approved') return r.status === 'Approved';
        if (_activeFilter === 'rejected') return r.status === 'Rejected';
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 3rem 1rem;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
              <h4 style="color: var(--color-starlight); margin-bottom: 0.25rem;">No Reports in this Queue</h4>
              <p class="text-muted">No road pothole reports currently match the "${_activeFilter}" filter.</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(report => `
        <tr>
          <td><strong class="text-cyan">${report.id}</strong></td>
          <td>
            <img src="${report.photo}" alt="${report.roadName}" class="table-thumb" onerror="this.src='assets/images/pothole-placeholder.svg'" />
          </td>
          <td>
            <div style="font-weight: 600; color: var(--color-starlight);">${report.roadName}</div>
            <div class="text-muted" style="font-size: 0.78rem;">Brgy. ${report.barangay}, ${report.city}</div>
          </td>
          <td>
            <span class="text-muted" style="font-size: 0.82rem;">${report.submittedAt}</span>
          </td>
          <td>
            <span class="severity-pill ${report.severity.toLowerCase()}">${report.severity}</span>
          </td>
          <td>
            ${this._getStatusBadgeHtml(report.status)}
          </td>
          <td>
            <button class="btn btn-primary btn-sm btn-inspect-report" data-id="${report.id}">
              🔍 Inspect Photo
            </button>
          </td>
        </tr>
      `).join('');

      this._attachInspectButtonListeners(tbody);
    },

    renderApprovedPotholes: function () {
      const tbody = document.getElementById('admin-approved-tbody');
      if (!tbody || !window.AppState) return;

      const approved = window.AppState.getApprovedReports();
      if (approved.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2.5rem 1rem;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛣️</div>
              <h4 style="color: var(--color-starlight); margin-bottom: 0.25rem;">No Approved Potholes Yet</h4>
              <p class="text-muted">No road pothole reports have been approved in the active session.</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = approved.map(report => `
        <tr>
          <td><strong class="text-cyan">${report.id}</strong></td>
          <td>
            <img src="${report.photo}" alt="${report.roadName}" class="table-thumb" onerror="this.src='assets/images/pothole-placeholder.svg'" />
          </td>
          <td>
            <div style="font-weight: 600; color: var(--color-starlight);">${report.roadName}</div>
            <div class="text-muted" style="font-size: 0.78rem;">Brgy. ${report.barangay}, ${report.city}</div>
          </td>
          <td>
            <span class="text-cyan" style="font-size: 0.82rem; font-family: monospace;">${report.latitude.toFixed(5)}°, ${report.longitude.toFixed(5)}°</span>
          </td>
          <td>
            <span class="severity-pill ${report.severity.toLowerCase()}">${report.severity}</span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-outline-cyan btn-sm btn-inspect-report" data-id="${report.id}">
                Inspect
              </button>
              <a href="#map" class="btn btn-secondary btn-sm" onclick="setTimeout(() => window.MapService.showSideDrawer(window.AppState.getReportById('${report.id}')), 150)">
                Map Pin
              </a>
            </div>
          </td>
        </tr>
      `).join('');

      this._attachInspectButtonListeners(tbody);
    },

    renderReportHistory: function () {
      const tbody = document.getElementById('admin-history-tbody');
      if (!tbody || !window.AppState) return;

      const allReports = window.AppState.getAllReports();
      if (allReports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">No report history available in current session.</td></tr>`;
        return;
      }

      tbody.innerHTML = allReports.map(report => `
        <tr>
          <td><strong class="text-cyan">${report.id}</strong></td>
          <td>
            <img src="${report.photo}" alt="${report.roadName}" class="table-thumb" onerror="this.src='assets/images/pothole-placeholder.svg'" />
          </td>
          <td>
            <div style="font-weight: 600; color: var(--color-starlight);">${report.roadName}</div>
            <div class="text-muted" style="font-size: 0.78rem;">Brgy. ${report.barangay}</div>
          </td>
          <td>
            <span class="text-muted" style="font-size: 0.82rem;">${report.submittedAt}</span>
          </td>
          <td>
            ${this._getStatusBadgeHtml(report.status)}
          </td>
          <td>
            <div class="text-muted" style="font-size: 0.8rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${report.reviewNotes || 'No notes'}">
              ${report.reviewNotes || '—'}
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-inspect-report" data-id="${report.id}">
              Details
            </button>
          </td>
        </tr>
      `).join('');

      this._attachInspectButtonListeners(tbody);
    },

    _getStatusBadgeHtml: function (status) {
      switch (status) {
        case 'Approved':
          return `<span class="badge badge-approved">✓ Approved</span>`;
        case 'Rejected':
          return `<span class="badge badge-rejected">✕ Rejected</span>`;
        case 'Resolved':
          return `<span class="badge badge-resolved">● Resolved</span>`;
        default:
          return `<span class="badge badge-pending">⏳ Pending Review</span>`;
      }
    },

    _attachInspectButtonListeners: function (container) {
      const inspectBtns = container.querySelectorAll('.btn-inspect-report');
      inspectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const reportId = e.currentTarget.getAttribute('data-id');
          this.openInspectionModal(reportId);
        });
      });
    },

    bindQueueFilters: function () {
      const filterBtns = document.querySelectorAll('.queue-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          filterBtns.forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          _activeFilter = e.currentTarget.getAttribute('data-filter');
          this.renderReviewQueue();
        });
      });
    },

    bindSearchFilter: function () {
      const searchInput = document.getElementById('queue-search-input');
      if (!searchInput) return;

      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#admin-queue-tbody tr');

        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      });
    },

    /**
     * Opens the detailed Inspection & Verification Modal
     */
    openInspectionModal: function (reportId) {
      if (!window.AppState) return;
      const report = window.AppState.getReportById(reportId);
      if (!report) return;

      _currentInspectedReportId = report.id;

      // Populate Modal Fields
      document.getElementById('inspect-modal-id').textContent = report.id;
      document.getElementById('inspect-modal-photo').src = report.photo;
      document.getElementById('inspect-modal-road').textContent = report.roadName;
      document.getElementById('inspect-modal-brgy').textContent = `Brgy. ${report.barangay}, ${report.city}`;
      document.getElementById('inspect-modal-coords').textContent = `${report.latitude.toFixed(5)}° N, ${report.longitude.toFixed(5)}° E`;
      document.getElementById('inspect-modal-date').textContent = report.submittedAt;
      document.getElementById('inspect-modal-reporter').textContent = report.reporterName || 'Citizen Reporter';
      document.getElementById('inspect-modal-desc').textContent = report.description || 'No description provided.';
      document.getElementById('inspect-modal-notes').value = report.reviewNotes || '';
      document.getElementById('inspect-modal-severity').value = report.severity || 'Medium';

      const statusBadgeContainer = document.getElementById('inspect-modal-status-badge');
      if (statusBadgeContainer) {
        statusBadgeContainer.innerHTML = this._getStatusBadgeHtml(report.status);
      }

      // Initialize mini inspection map
      if (window.MapService) {
        window.MapService.initInspectionMap('admin-inspection-map', report.latitude, report.longitude, report.roadName);
      }

      // Open Modal
      const modal = document.getElementById('admin-inspection-modal');
      if (modal) modal.classList.add('active');
    },

    closeInspectionModal: function () {
      const modal = document.getElementById('admin-inspection-modal');
      if (modal) modal.classList.remove('active');
      _currentInspectedReportId = null;
    },

    bindInspectionActions: function () {
      const btnClose = document.getElementById('btn-close-inspect-modal');
      const btnApprove = document.getElementById('btn-action-approve');
      const btnReject = document.getElementById('btn-action-reject');

      if (btnClose) {
        btnClose.addEventListener('click', () => this.closeInspectionModal());
      }

      if (btnApprove) {
        btnApprove.addEventListener('click', () => {
          if (!_currentInspectedReportId) return;

          const notes = document.getElementById('inspect-modal-notes').value.trim() || 'Verified pothole hazard by Administrator.';
          const severity = document.getElementById('inspect-modal-severity').value;

          if (confirm(`Approve report ${_currentInspectedReportId}? This will immediately publish its marker and photo to the Public Pothole Map.`)) {
            window.AppState.approveReport(_currentInspectedReportId, notes, severity);
            this.closeInspectionModal();
            if (window.showToast) {
              window.showToast(`Report ${_currentInspectedReportId} Approved! Published to Public Map.`, 'success');
            }
          }
        });
      }

      if (btnReject) {
        btnReject.addEventListener('click', () => {
          if (!_currentInspectedReportId) return;

          const reason = prompt('Enter rejection reason for this report:', 'Photograph does not show a confirmed road cavity or pothole defect.');
          if (reason !== null) {
            window.AppState.rejectReport(_currentInspectedReportId, reason);
            this.closeInspectionModal();
            if (window.showToast) {
              window.showToast(`Report ${_currentInspectedReportId} Rejected. Excluded from Public Map.`, 'warning');
            }
          }
        });
      }
    }
  };

  window.AdminReviewController = AdminReviewController;

})(window);
