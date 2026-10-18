/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Report Submission Form Controller: Image Upload, Location Picking & Validation
 */

(function (window) {
  'use strict';

  let _selectedPhotoData = null;
  let _selectedLat = 14.8527;
  let _selectedLng = 120.8160;

  const ReportFormController = {
    init: function () {
      this.bindImageUpload();
      this.bindLocationPicker();
      this.bindFormSubmit();
      this.bindSampleLocationShortcuts();
    },

    bindImageUpload: function () {
      const dropzone = document.getElementById('photo-dropzone');
      const fileInput = document.getElementById('report-photo-input');
      const previewContainer = document.getElementById('photo-preview-container');
      const previewImg = document.getElementById('photo-preview-img');
      const removeBtn = document.getElementById('btn-remove-photo');
      const replaceBtn = document.getElementById('btn-replace-photo');

      if (!dropzone || !fileInput) return;

      dropzone.addEventListener('click', () => fileInput.click());

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
        }
      });

      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          _selectedPhotoData = null;
          fileInput.value = '';
          previewContainer.style.display = 'none';
          dropzone.style.display = 'block';
        });
      }

      if (replaceBtn) {
        replaceBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });
      }

      function handleFile(file) {
        // Validate MIME type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
          alert('Invalid file format. Please upload a JPEG, PNG, or WebP photograph.');
          return;
        }

        // Validate size (max 8MB)
        if (file.size > 8 * 1024 * 1024) {
          alert('Image file is too large. Maximum supported size is 8MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
          _selectedPhotoData = evt.target.result;
          previewImg.src = _selectedPhotoData;
          dropzone.style.display = 'none';
          previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    },

    bindLocationPicker: function () {
      const latDisplay = document.getElementById('display-lat');
      const lngDisplay = document.getElementById('display-lng');
      const inputLat = document.getElementById('report-lat');
      const inputLng = document.getElementById('report-lng');
      const btnGeo = document.getElementById('btn-use-geolocation');

      if (window.MapService) {
        window.MapService.initLocationPicker('report-location-picker-map', (lat, lng) => {
          _selectedLat = lat;
          _selectedLng = lng;
          if (latDisplay) latDisplay.textContent = lat.toFixed(5);
          if (lngDisplay) lngDisplay.textContent = lng.toFixed(5);
          if (inputLat) inputLat.value = lat.toFixed(6);
          if (inputLng) inputLng.value = lng.toFixed(6);
        });
      }

      if (btnGeo) {
        btnGeo.addEventListener('click', () => {
          btnGeo.disabled = true;
          btnGeo.textContent = 'Acquiring GPS...';

          window.MapService.locateUser((lat, lng) => {
            _selectedLat = lat;
            _selectedLng = lng;
            if (latDisplay) latDisplay.textContent = lat.toFixed(5);
            if (lngDisplay) lngDisplay.textContent = lng.toFixed(5);
            if (inputLat) inputLat.value = lat.toFixed(6);
            if (inputLng) inputLng.value = lng.toFixed(6);

            btnGeo.disabled = false;
            btnGeo.innerHTML = '<span>📍</span> Current GPS';
            if (window.showToast) {
              window.showToast('Location coordinates updated from browser GPS.', 'success');
            }
          });
        });
      }
    },

    bindSampleLocationShortcuts: function () {
      const selectSample = document.getElementById('sample-location-preset');
      if (!selectSample) return;

      const presets = {
        bulsu: { road: "MacArthur Highway (Km 44 Southbound)", brgy: "Guinhawa", lat: 14.8527, lng: 120.8160 },
        barasoain: { road: "Paseo del Congreso Street", brgy: "San Gabriel", lat: 14.8465, lng: 120.8122 },
        capitol: { road: "Bulacan Provincial Capitol Boulevard", brgy: "Guinhawa", lat: 14.8582, lng: 120.8145 },
        tikay: { road: "Tikay Junction Highway", brgy: "Tikay", lat: 14.8488, lng: 120.8423 },
        tabang: { road: "Tabang Flyover Access Road", brgy: "Tabang", lat: 14.8398, lng: 120.8712 }
      };

      selectSample.addEventListener('change', (e) => {
        const val = e.target.value;
        if (presets[val]) {
          const p = presets[val];
          document.getElementById('report-road-name').value = p.road;
          document.getElementById('report-barangay').value = p.brgy;
          _selectedLat = p.lat;
          _selectedLng = p.lng;
          document.getElementById('report-lat').value = p.lat;
          document.getElementById('report-lng').value = p.lng;
          document.getElementById('display-lat').textContent = p.lat.toFixed(5);
          document.getElementById('display-lng').textContent = p.lng.toFixed(5);

          // Update location picker map
          if (window.MapService) {
            window.MapService.initLocationPicker('report-location-picker-map', () => {});
          }
        }
      });
    },

    bindFormSubmit: function () {
      const form = document.getElementById('report-pothole-form');
      if (!form) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const roadName = document.getElementById('report-road-name').value.trim();
        const barangay = document.getElementById('report-barangay').value.trim();
        const description = document.getElementById('report-description').value.trim();
        const severity = document.getElementById('report-severity').value;
        const reporterName = document.getElementById('report-reporter-name').value.trim() || 'Citizen Reporter (Demo)';

        // Frontend validation
        if (!_selectedPhotoData) {
          alert('Please upload or select a photograph of the road damage.');
          document.getElementById('photo-dropzone').scrollIntoView({ behavior: 'smooth' });
          return;
        }

        if (!roadName) {
          alert('Please specify the road or street name.');
          document.getElementById('report-road-name').focus();
          return;
        }

        if (!barangay) {
          alert('Please specify the barangay or locality.');
          document.getElementById('report-barangay').focus();
          return;
        }

        // Submit to In-Memory state
        const newReport = window.AppState.submitReport({
          roadName,
          barangay,
          city: 'Malolos City',
          description,
          latitude: _selectedLat,
          longitude: _selectedLng,
          photo: _selectedPhotoData,
          severity,
          reporterName
        });

        // Show Confirmation Dialog
        const modal = document.getElementById('submission-success-modal');
        if (modal) {
          document.getElementById('submitted-report-id').textContent = newReport.id;
          document.getElementById('submitted-report-road').textContent = newReport.roadName;
          document.getElementById('submitted-report-brgy').textContent = `Brgy. ${newReport.barangay}, Malolos City`;
          modal.classList.add('active');
        }

        // Reset form
        form.reset();
        _selectedPhotoData = null;
        document.getElementById('photo-preview-container').style.display = 'none';
        document.getElementById('photo-dropzone').style.display = 'block';

        if (window.showToast) {
          window.showToast(`Report ${newReport.id} submitted for administrator review!`, 'success');
        }
      });
    }
  };

  window.ReportFormController = ReportFormController;

})(window);
