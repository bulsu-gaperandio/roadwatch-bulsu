/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Reports Utility Module: Helper routines for report formatting and queries
 */

(function (window) {
  'use strict';

  window.ReportsService = {
    getAll: function () {
      return window.AppState ? window.AppState.getAllReports() : [];
    },
    getApproved: function () {
      return window.AppState ? window.AppState.getApprovedReports() : [];
    },
    getPending: function () {
      return window.AppState ? window.AppState.getPendingReports() : [];
    },
    getRejected: function () {
      return window.AppState ? window.AppState.getRejectedReports() : [];
    },
    getById: function (id) {
      return window.AppState ? window.AppState.getReportById(id) : null;
    }
  };

})(window);
