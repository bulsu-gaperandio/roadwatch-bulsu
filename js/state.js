/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Centralized In-Memory State Manager (No localStorage, No permanent storage)
 * Synchronizes reporting, admin review, and public map during the frontend session.
 */

(function (window) {
  'use strict';

  // Private in-memory store
  let _reports = [];
  let _listeners = [];
  let _reportCounter = 100;

  function init() {
    if (window.SEED_REPORTS && Array.isArray(window.SEED_REPORTS)) {
      // Deep clone seed reports into active memory
      _reports = JSON.parse(JSON.stringify(window.SEED_REPORTS));
      _reportCounter = _reports.length + 1;
    } else {
      _reports = [];
    }
  }

  function notify() {
    const all = AppState.getAllReports();
    _listeners.forEach(fn => {
      try {
        fn(all);
      } catch (err) {
        console.error('State subscriber notification error:', err);
      }
    });
  }

  const AppState = {
    init: function () {
      init();
    },

    /**
     * Subscribe to state updates
     * @param {Function} callback (reports) => void
     * @returns {Function} unsubscribe function
     */
    subscribe: function (callback) {
      if (typeof callback === 'function') {
        _listeners.push(callback);
        // Immediate dispatch with current state
        callback(this.getAllReports());
      }
      return function unsubscribe() {
        _listeners = _listeners.filter(cb => cb !== callback);
      };
    },

    getAllReports: function () {
      return JSON.parse(JSON.stringify(_reports));
    },

    getReportById: function (id) {
      const found = _reports.find(r => r.id === id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    getApprovedReports: function () {
      return _reports.filter(r => r.status === 'Approved');
    },

    getPendingReports: function () {
      return _reports.filter(r => r.status === 'Pending Review');
    },

    getRejectedReports: function () {
      return _reports.filter(r => r.status === 'Rejected');
    },

    getResolvedReports: function () {
      return _reports.filter(r => r.status === 'Resolved');
    },

    getStatistics: function () {
      const total = _reports.length;
      const pending = _reports.filter(r => r.status === 'Pending Review').length;
      const approved = _reports.filter(r => r.status === 'Approved').length;
      const rejected = _reports.filter(r => r.status === 'Rejected').length;
      const resolved = _reports.filter(r => r.status === 'Resolved').length;

      return {
        total,
        pending,
        approved,
        rejected,
        resolved
      };
    },

    /**
     * Add a newly submitted citizen report to in-memory state
     */
    submitReport: function (reportData) {
      const padNum = String(_reportCounter++).padStart(3, '0');
      const newId = `REP-2026-${padNum}`;

      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 10) + ' ' + 
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newReport = {
        id: newId,
        roadName: reportData.roadName || 'Unspecified Road',
        barangay: reportData.barangay || 'Malolos City',
        city: reportData.city || 'Malolos City',
        description: reportData.description || 'Pothole road hazard reported by citizen.',
        latitude: parseFloat(reportData.latitude) || 14.8527,
        longitude: parseFloat(reportData.longitude) || 120.8160,
        photo: reportData.photo || 'assets/images/pothole-placeholder.svg',
        status: 'Pending Review',
        severity: reportData.severity || 'Medium',
        submittedAt: formattedDate,
        reporterName: reportData.reporterName || 'Citizen Reporter (Demo)',
        reviewNotes: ''
      };

      // Add to front of active list
      _reports.unshift(newReport);
      notify();
      return newReport;
    },

    /**
     * Administrator approves a report
     */
    approveReport: function (id, notes, severity) {
      const report = _reports.find(r => r.id === id);
      if (!report) return false;

      report.status = 'Approved';
      if (notes !== undefined && notes !== null) {
        report.reviewNotes = notes;
      }
      if (severity) {
        report.severity = severity;
      }
      notify();
      return true;
    },

    /**
     * Administrator rejects a report
     */
    rejectReport: function (id, notes) {
      const report = _reports.find(r => r.id === id);
      if (!report) return false;

      report.status = 'Rejected';
      if (notes) {
        report.reviewNotes = notes;
      }
      notify();
      return true;
    },

    /**
     * Mark approved pothole as repaired / resolved
     */
    resolveReport: function (id, notes) {
      const report = _reports.find(r => r.id === id);
      if (!report) return false;

      report.status = 'Resolved';
      if (notes) {
        report.reviewNotes = (report.reviewNotes ? report.reviewNotes + ' | ' : '') + notes;
      }
      notify();
      return true;
    },

    /**
     * Reset in-memory session back to initial demo seeds
     */
    resetSession: function () {
      init();
      notify();
    }
  };

  // Initialize on load
  AppState.init();
  window.AppState = AppState;

})(window);
