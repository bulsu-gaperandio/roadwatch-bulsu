/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Google Maps Integration & High-Fidelity Interactive Fallback Engine
 * Handles Public Road Map, Report Location Picker, and Admin Geolocation Inspection.
 */

(function (window) {
  'use strict';

  // BulSU Main Campus Default Coordinates (MacArthur Hwy, Guinhawa, Malolos City)
  const BULSU_COORDS = { lat: 14.8527, lng: 120.8160, zoom: 14 };

  // Track map engine state
  let _hasGoogleMaps = false;
  let _activePublicMap = null;
  let _publicTileLayer = null;
  let _publicMarkers = [];
  let _locationPickerMap = null;
  let _pickerTileLayer = null;
  let _locationPickerMarker = null;
  let _inspectionMap = null;
  let _inspectionTileLayer = null;
  let _inspectionMarker = null;

  // Check for API Key in URL query or window
  const urlParams = new URLSearchParams(window.location.search);
  let _configuredApiKey = urlParams.get('maps_key') || window.GOOGLE_MAPS_API_KEY || null;

  const MapService = {
    apiKey: _configuredApiKey,
    isGoogleMapsActive: function () {
      return _hasGoogleMaps;
    },

    setApiKey: function (key) {
      if (!key) return;
      _configuredApiKey = key.trim();
      window.GOOGLE_MAPS_API_KEY = _configuredApiKey;
      this.loadGoogleMapsScript(_configuredApiKey, () => {
        // Reinitialize active maps
        if (document.getElementById('public-google-map')) {
          this.initPublicMap('public-google-map');
        }
      });
    },

    /**
     * Attempts to dynamically load the Google Maps JavaScript API
     */
    loadGoogleMapsScript: function (key, callback) {
      if (window.google && window.google.maps) {
        _hasGoogleMaps = true;
        if (callback) callback();
        return;
      }

      if (!key) {
        _hasGoogleMaps = false;
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__googleMapsInitCallback`;
      script.async = true;
      script.defer = true;

      window.__googleMapsInitCallback = function () {
        _hasGoogleMaps = true;
        console.log('Google Maps JavaScript API loaded successfully.');
        if (callback) callback();
      };

      script.onerror = function () {
        console.warn('Failed to load Google Maps script with provided key. Activating fallback.');
        _hasGoogleMaps = false;
      };

      document.head.appendChild(script);
    },

    /**
     * Initializes the large Public Pothole Map
     */
    initPublicMap: function (containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (_hasGoogleMaps && window.google && window.google.maps) {
        this._initGooglePublicMap(container);
      } else {
        this._initFallbackPublicMap(container);
      }

      // Initial marker sync with in-memory state
      this.refreshPublicMarkers();

      // Subscribe to in-memory state changes so map updates in real time
      if (window.AppState) {
        window.AppState.subscribe(() => {
          this.refreshPublicMarkers();
        });
      }
    },

    /**
     * Google Maps Implementation for Public Map
     */
    _initGooglePublicMap: function (container) {
      const darkMapStyles = [
        { elementType: 'geometry', stylers: [{ color: '#090e24' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#050816' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#162248' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#00F2FE' }, { weight: 1.2 }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040714' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ];

      _activePublicMap = new window.google.maps.Map(container, {
        center: { lat: BULSU_COORDS.lat, lng: BULSU_COORDS.lng },
        zoom: BULSU_COORDS.zoom,
        styles: darkMapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false
      });
    },

    /**
     * High-Fidelity Leaflet / Carto Dark Matter Fallback Engine
     */
    _initFallbackPublicMap: function (container) {
      if (typeof window.L === 'undefined') {
        console.error('Leaflet library required for interactive map fallback.');
        return;
      }

      // If already initialized on this container, remove old instance
      if (_activePublicMap && _activePublicMap.remove) {
        _activePublicMap.remove();
      }

      _activePublicMap = window.L.map(container, {
        zoomControl: true,
        attributionControl: false
      }).setView([BULSU_COORDS.lat, BULSU_COORDS.lng], BULSU_COORDS.zoom);

      // CartoDB tiles matching the active theme mode (Positron for light, Dark Matter for dark)
      _publicTileLayer = window.L.tileLayer(this._getTileUrl(), {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(_activePublicMap);

      // Add a distinctive campus perimeter marker for BulSU
      const bulsuIcon = window.L.divIcon({
        className: 'bulsu-campus-marker',
        html: `
          <div style="background: rgba(139, 92, 246, 0.25); border: 1.5px solid #8B5CF6; border-radius: 20px; padding: 4px 8px; color: #E2E8F0; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);">
            🎓 BulSU Main Campus
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });
      window.L.marker([BULSU_COORDS.lat, BULSU_COORDS.lng], { icon: bulsuIcon }).addTo(_activePublicMap)
        .bindTooltip("Bulacan State University - Malolos Main Campus", { permanent: false, direction: 'top' });
    },

    /**
     * Refresh public map markers based strictly on approved reports in memory
     */
    refreshPublicMarkers: function (filterCriteria) {
      if (!_activePublicMap) return;

      const approvedReports = (window.AppState ? window.AppState.getApprovedReports() : [])
        .filter(report => {
          if (!filterCriteria) return true;
          // Search query filter
          if (filterCriteria.search) {
            const q = filterCriteria.search.toLowerCase();
            const matchRoad = report.roadName && report.roadName.toLowerCase().includes(q);
            const matchBrgy = report.barangay && report.barangay.toLowerCase().includes(q);
            if (!matchRoad && !matchBrgy) return false;
          }
          // Severity filter
          if (filterCriteria.severity && filterCriteria.severity !== 'all') {
            if (report.severity !== filterCriteria.severity) return false;
          }
          return true;
        });

      // Clear existing markers
      if (_hasGoogleMaps && window.google) {
        _publicMarkers.forEach(m => m.setMap(null));
        _publicMarkers = [];

        approvedReports.forEach(report => {
          const marker = new window.google.maps.Marker({
            position: { lat: report.latitude, lng: report.longitude },
            map: _activePublicMap,
            title: report.roadName,
            icon: {
              url: 'assets/icons/marker-approved.svg',
              scaledSize: new window.google.maps.Size(36, 46)
            }
          });

          const infoContent = MapService._buildInfoWindowHtml(report);
          const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });

          marker.addListener('click', () => {
            infoWindow.open(_activePublicMap, marker);
            MapService.showSideDrawer(report);
          });

          _publicMarkers.push(marker);
        });
      } else if (window.L && _activePublicMap.addLayer) {
        // Remove existing Leaflet markers
        _publicMarkers.forEach(m => _activePublicMap.removeLayer(m));
        _publicMarkers = [];

        approvedReports.forEach(report => {
          const markerIcon = window.L.divIcon({
            className: 'custom-pothole-pin-wrapper',
            html: `
              <div class="custom-pothole-pin" title="${report.roadName}">
                <div class="pin-halo"></div>
                <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                  <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#0B112C" stroke="#00F2FE" stroke-width="2.5"/>
                  <circle cx="17" cy="17" r="9" fill="${MapService._getSeverityColor(report.severity)}"/>
                  <path d="M17 11V18M17 21V22" stroke="#050816" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            `,
            iconSize: [34, 42],
            iconAnchor: [17, 42],
            popupAnchor: [0, -40]
          });

          const marker = window.L.marker([report.latitude, report.longitude], { icon: markerIcon })
            .addTo(_activePublicMap);

          const popupContent = MapService._buildInfoWindowHtml(report);
          marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 280 });

          marker.on('click', () => {
            MapService.showSideDrawer(report);
          });

          _publicMarkers.push(marker);
        });
      }

      // Update visible count in legend / toolbar
      const countEl = document.getElementById('map-visible-count');
      if (countEl) {
        countEl.textContent = approvedReports.length;
      }

      // Toggle empty state if no approved potholes match
      const emptyStateEl = document.getElementById('map-empty-state');
      if (emptyStateEl) {
        emptyStateEl.style.display = approvedReports.length === 0 ? 'block' : 'none';
      }
    },

    _getSeverityColor: function (severity) {
      switch (severity) {
        case 'Critical': return '#EF4444';
        case 'High': return '#F97316';
        case 'Medium': return '#F59E0B';
        case 'Low': return '#10B981';
        default: return '#00F2FE';
      }
    },

    /**
     * Builds the interactive Info Window content
     */
    _buildInfoWindowHtml: function (report) {
      return `
        <div class="map-info-card">
          <div class="map-info-photo-wrap">
            <img src="${report.photo}" alt="${report.roadName}" class="map-info-photo" onerror="this.src='assets/images/pothole-placeholder.svg'" />
            <div class="map-info-badge-overlay">
              <span class="badge badge-approved">✓ Verified Pothole</span>
            </div>
          </div>
          <div class="map-info-body">
            <h4 class="map-info-title">${report.roadName}</h4>
            <div class="map-info-locality">
              <span>📍</span> <span>Brgy. ${report.barangay}, ${report.city}</span>
            </div>
            <div class="map-info-meta">
              <span>📅 ${report.submittedAt}</span>
              <span class="severity-pill ${report.severity.toLowerCase()}">${report.severity} Priority</span>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Displays the slide-out side drawer with full pothole details
     */
    showSideDrawer: function (report) {
      const drawer = document.getElementById('map-side-drawer');
      if (!drawer) return;

      document.getElementById('drawer-photo').src = report.photo;
      document.getElementById('drawer-id').textContent = report.id;
      document.getElementById('drawer-road').textContent = report.roadName;
      document.getElementById('drawer-location').textContent = `Brgy. ${report.barangay}, ${report.city}`;
      document.getElementById('drawer-coords').textContent = `${report.latitude.toFixed(5)}° N, ${report.longitude.toFixed(5)}° E`;
      document.getElementById('drawer-desc').textContent = report.description || 'No description provided.';
      document.getElementById('drawer-date').textContent = report.submittedAt;
      document.getElementById('drawer-severity').textContent = report.severity;
      document.getElementById('drawer-notes').textContent = report.reviewNotes || 'Approved by Highway Maintenance Division.';

      drawer.classList.add('open');
    },

    closeSideDrawer: function () {
      const drawer = document.getElementById('map-side-drawer');
      if (drawer) drawer.classList.remove('open');
    },

    /**
     * Location Picker for Citizen Report Submission Form
     */
    initLocationPicker: function (containerId, onLocationSelected) {
      const container = document.getElementById(containerId);
      if (!container) return;

      let currentLat = BULSU_COORDS.lat;
      let currentLng = BULSU_COORDS.lng;

      if (_hasGoogleMaps && window.google) {
        _locationPickerMap = new window.google.maps.Map(container, {
          center: { lat: currentLat, lng: currentLng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false
        });

        _locationPickerMarker = new window.google.maps.Marker({
          position: { lat: currentLat, lng: currentLng },
          map: _locationPickerMap,
          draggable: true,
          title: "Drag to pothole location"
        });

        _locationPickerMap.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          _locationPickerMarker.setPosition(e.latLng);
          if (onLocationSelected) onLocationSelected(lat, lng);
        });

        _locationPickerMarker.addListener('dragend', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (onLocationSelected) onLocationSelected(lat, lng);
        });
      } else if (window.L) {
        if (_locationPickerMap && _locationPickerMap.remove) {
          _locationPickerMap.remove();
        }

        _locationPickerMap = window.L.map(container, {
          attributionControl: false
        }).setView([currentLat, currentLng], 15);

        _pickerTileLayer = window.L.tileLayer(this._getTileUrl(), {
          maxZoom: 19
        }).addTo(_locationPickerMap);

        const pickerIcon = window.L.divIcon({
          className: 'picker-pin',
          html: `
            <div style="filter: drop-shadow(0 0 10px #00F2FE);">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#0B112C" stroke="#00F2FE" stroke-width="2.5"/>
                <circle cx="17" cy="17" r="7" fill="#8B5CF6"/>
              </svg>
            </div>
          `,
          iconSize: [34, 42],
          iconAnchor: [17, 42]
        });

        _locationPickerMarker = window.L.marker([currentLat, currentLng], {
          draggable: true,
          icon: pickerIcon
        }).addTo(_locationPickerMap);

        _locationPickerMap.on('click', (e) => {
          const { lat, lng } = e.latlng;
          _locationPickerMarker.setLatLng([lat, lng]);
          if (onLocationSelected) onLocationSelected(lat, lng);
        });

        _locationPickerMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          if (onLocationSelected) onLocationSelected(lat, lng);
        });
      }

      // Inform parent of initial location
      if (onLocationSelected) onLocationSelected(currentLat, currentLng);
    },

    /**
     * Center map onto user's browser geolocation
     */
    locateUser: function (callback) {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser. Defaulting to BulSU Main Campus.");
        if (callback) callback(BULSU_COORDS.lat, BULSU_COORDS.lng);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (_locationPickerMap) {
            if (_hasGoogleMaps && window.google) {
              _locationPickerMap.setCenter({ lat, lng });
              _locationPickerMarker.setPosition({ lat, lng });
            } else if (_locationPickerMap.setView) {
              _locationPickerMap.setView([lat, lng], 16);
              _locationPickerMarker.setLatLng([lat, lng]);
            }
          }
          if (callback) callback(lat, lng);
        },
        (error) => {
          console.warn("Geolocation denied or error:", error.message);
          // Fallback seamlessly to BulSU Campus
          if (callback) callback(BULSU_COORDS.lat, BULSU_COORDS.lng);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    },

    /**
     * Mini inspection map in Admin Review Modal
     */
    initInspectionMap: function (containerId, lat, lng, roadName) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (_inspectionMap && _inspectionMap.remove) {
        _inspectionMap.remove();
      }

      if (_hasGoogleMaps && window.google) {
        _inspectionMap = new window.google.maps.Map(container, {
          center: { lat, lng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true
        });
        _inspectionMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: _inspectionMap,
          title: roadName
        });
      } else if (window.L) {
        _inspectionMap = window.L.map(container, {
          attributionControl: false,
          zoomControl: true
        }).setView([lat, lng], 16);

        _inspectionTileLayer = window.L.tileLayer(this._getTileUrl(), {
          maxZoom: 19
        }).addTo(_inspectionMap);

        const pinIcon = window.L.divIcon({
          className: 'inspect-pin',
          html: `
            <svg width="30" height="38" viewBox="0 0 34 42" fill="none">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#0B112C" stroke="#00F2FE" stroke-width="2.5"/>
              <circle cx="17" cy="17" r="7" fill="#F59E0B"/>
            </svg>
          `,
          iconSize: [30, 38],
          iconAnchor: [15, 38]
        });

        _inspectionMarker = window.L.marker([lat, lng], { icon: pinIcon }).addTo(_inspectionMap);
      }
    },

    /**
     * Reset public map center to BulSU Main Campus
     */
    resetCampusCenter: function () {
      if (!_activePublicMap) return;
      if (_hasGoogleMaps && window.google) {
        _activePublicMap.setCenter({ lat: BULSU_COORDS.lat, lng: BULSU_COORDS.lng });
        _activePublicMap.setZoom(BULSU_COORDS.zoom);
      } else if (_activePublicMap.setView) {
        _activePublicMap.setView([BULSU_COORDS.lat, BULSU_COORDS.lng], BULSU_COORDS.zoom);
      }
    },

    /**
     * Determines whether to serve Light (Positron) or Dark (Dark Matter) map tiles
     */
    _getTileUrl: function () {
      const mode = document.documentElement.getAttribute('data-theme-mode') || 'light';
      return mode === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    },

    /**
     * Seamlessly updates all active map tile layers and Google Maps styles on theme switch
     */
    updateMapTheme: function (theme) {
      const mode = (theme && theme.mode) || document.documentElement.getAttribute('data-theme-mode') || 'light';
      const tileUrl = mode === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      if (_publicTileLayer && _publicTileLayer.setUrl) {
        _publicTileLayer.setUrl(tileUrl);
      }
      if (_pickerTileLayer && _pickerTileLayer.setUrl) {
        _pickerTileLayer.setUrl(tileUrl);
      }
      if (_inspectionTileLayer && _inspectionTileLayer.setUrl) {
        _inspectionTileLayer.setUrl(tileUrl);
      }

      // If Google Maps is active, update map styles
      if (_hasGoogleMaps && window.google) {
        const lightMapStyles = [
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
        ];
        const darkMapStyles = [
          { elementType: 'geometry', stylers: [{ color: '#090e24' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#050816' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#E2E8F0' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#162248' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#00F2FE' }, { weight: 1.2 }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040714' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ];
        const activeStyles = mode === 'dark' ? darkMapStyles : lightMapStyles;
        if (_activePublicMap && _activePublicMap.setOptions) {
          _activePublicMap.setOptions({ styles: activeStyles });
        }
      }
    }
  };

  // Subscribe to ThemeManager if available
  if (window.ThemeManager && typeof window.ThemeManager.subscribe === 'function') {
    window.ThemeManager.subscribe(function (theme) {
      MapService.updateMapTheme(theme);
    });
  }

  window.MapService = MapService;

})(window);
