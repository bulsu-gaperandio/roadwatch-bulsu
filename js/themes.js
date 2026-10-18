/**
 * Bulacan State University - CICT | IT 305 Advanced Web Development
 * Centralized Multi-Theme Registry & Reactive Theme Manager
 * 
 * Strict Brand Sheet Palette:
 * Primary: Cosmic Purple (#6D28D9), Luminous Lavender (#A78BFA)
 * Secondary: Deep Nebula Blue (#075985), Electric Cyan (#00F2FE)
 * Neutrals: Starlight Ice (#EBF3FC), Sky Mist (#E0F2FE), Lavender Mist (#F3EEFF),
 *           White (#FFFFFF), Deep Space Black (#050B16), Royal Indigo (#0A1432),
 *           Luminous Indigo (#13224E), Night Surface (#0E1726)
 */

(function (window) {
  'use strict';

  const THEMES = [
    {
      id: 'brand-daylight',
      name: 'Brand Sheet Daylight',
      mode: 'light',
      isDefault: true,
      description: 'Starlight Ice backgrounds with crisp white cards, Cosmic Purple, and Nebula Blue.',
      icon: '☀️',
      iconBg: '#EBF3FC',
      iconBorder: '#6D28D9',
      primary: '#6D28D9',
      secondary: '#075985',
      background: '#EBF3FC',
      surface: '#FFFFFF',
      surfaceAlt: '#F3EEFF',
      textPrimary: '#050B16',
      textSecondary: '#475569',
      accent: '#6D28D9',
      swatches: ['#EBF3FC', '#FFFFFF', '#6D28D9', '#075985', '#050B16'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    },
    {
      id: 'corporate-aurora',
      name: 'Space Corporate Aurora',
      mode: 'dark',
      isDefault: false,
      description: 'Royal Indigo surfaces with Electric Cyan and Cosmic Purple accents.',
      icon: '🌌',
      iconBg: '#13224E',
      iconBorder: '#00F2FE',
      primary: '#A78BFA',
      secondary: '#00F2FE',
      background: '#0A1432',
      surface: '#13224E',
      surfaceAlt: '#0E1726',
      textPrimary: '#EBF3FC',
      textSecondary: '#94A3B8',
      accent: '#00F2FE',
      swatches: ['#0A1432', '#13224E', '#A78BFA', '#00F2FE', '#EBF3FC'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    },
    {
      id: 'nebula-sky',
      name: 'Nebula Sky Light',
      mode: 'light',
      isDefault: false,
      description: 'Refreshing Nebula Blue with a clean daylight appearance.',
      icon: '🌤️',
      iconBg: '#E0F2FE',
      iconBorder: '#075985',
      primary: '#075985',
      secondary: '#6D28D9',
      background: '#E0F2FE',
      surface: '#FFFFFF',
      surfaceAlt: '#EBF3FC',
      textPrimary: '#050B16',
      textSecondary: '#475569',
      accent: '#075985',
      swatches: ['#E0F2FE', '#FFFFFF', '#075985', '#6D28D9', '#050B16'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    },
    {
      id: 'cosmic-studio',
      name: 'Cosmic Purple Studio',
      mode: 'light',
      isDefault: false,
      description: 'Soft Lavender Mist backgrounds with Cosmic Purple and Deep Space text.',
      icon: '🎨',
      iconBg: '#F3EEFF',
      iconBorder: '#6D28D9',
      primary: '#6D28D9',
      secondary: '#075985',
      background: '#F3EEFF',
      surface: '#FFFFFF',
      surfaceAlt: '#EBF3FC',
      textPrimary: '#050B16',
      textSecondary: '#475569',
      accent: '#6D28D9',
      swatches: ['#F3EEFF', '#FFFFFF', '#6D28D9', '#075985', '#050B16'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    },
    {
      id: 'deep-space',
      name: 'Deep Space Night',
      mode: 'dark',
      isDefault: false,
      description: 'Deep Space Black with high-contrast Electric Cyan and Luminous Lavender.',
      icon: '🌙',
      iconBg: '#0E1726',
      iconBorder: '#00F2FE',
      primary: '#A78BFA',
      secondary: '#00F2FE',
      background: '#050B16',
      surface: '#0E1726',
      surfaceAlt: '#13224E',
      textPrimary: '#EBF3FC',
      textSecondary: '#94A3B8',
      accent: '#00F2FE',
      swatches: ['#050B16', '#0E1726', '#A78BFA', '#00F2FE', '#EBF3FC'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    },
    {
      id: 'nebula-midnight',
      name: 'Nebula Midnight',
      mode: 'dark',
      isDefault: false,
      description: 'Royal Indigo backgrounds with Electric Cyan and Luminous Lavender accents.',
      icon: '🌠',
      iconBg: '#0A1432',
      iconBorder: '#A78BFA',
      primary: '#00F2FE',
      secondary: '#A78BFA',
      background: '#0A1432',
      surface: '#0E1726',
      surfaceAlt: '#13224E',
      textPrimary: '#EBF3FC',
      textSecondary: '#94A3B8',
      accent: '#00F2FE',
      swatches: ['#0A1432', '#0E1726', '#00F2FE', '#A78BFA', '#EBF3FC'],
      swatchNames: ['Background', 'Surface', 'Primary', 'Secondary', 'Text']
    }
  ];

  const STORAGE_KEY = 'roadwatch_theme';
  const DEFAULT_THEME_ID = 'brand-daylight';

  let _activeThemeId = DEFAULT_THEME_ID;
  let _listeners = [];

  const ThemeManager = {
    THEMES: THEMES,

    init: function () {
      let saved = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch (err) {
        console.warn('localStorage not accessible, using default theme');
      }

      const validTheme = THEMES.find(t => t.id === saved);
      _activeThemeId = validTheme ? validTheme.id : DEFAULT_THEME_ID;

      this.applyTheme(_activeThemeId, false);
      this.renderAllThemePickers();
    },

    getActiveThemeId: function () {
      return _activeThemeId;
    },

    getActiveTheme: function () {
      return THEMES.find(t => t.id === _activeThemeId) || THEMES[0];
    },

    getThemeById: function (id) {
      return THEMES.find(t => t.id === id) || null;
    },

    setTheme: function (themeId, persist = true) {
      const theme = this.getThemeById(themeId);
      if (!theme) return false;

      _activeThemeId = theme.id;
      this.applyTheme(theme.id, persist);
      this.updateSelectionCardsUI();

      // Notify subscribers (e.g. map manager to swap tiles)
      _listeners.forEach(fn => {
        try {
          fn(theme);
        } catch (err) {
          console.error('Theme listener error:', err);
        }
      });

      return true;
    },

    applyTheme: function (themeId, persist = true) {
      const theme = this.getThemeById(themeId);
      if (!theme) return;

      document.documentElement.setAttribute('data-theme', theme.id);
      document.documentElement.setAttribute('data-theme-mode', theme.mode);

      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, theme.id);
        } catch (err) {
          console.warn('Could not persist theme to localStorage:', err);
        }
      }
    },

    subscribe: function (listener) {
      if (typeof listener === 'function') {
        _listeners.push(listener);
        listener(this.getActiveTheme());
      }
      return () => {
        _listeners = _listeners.filter(l => l !== listener);
      };
    },

    /**
     * Render the Theme Selection cards list matching reference screenshots
     */
    renderThemeSelectionCards: function (containerId = 'theme-selection-list') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const activeId = this.getActiveThemeId();

      container.innerHTML = THEMES.map((theme, index) => {
        const isSelected = theme.id === activeId;
        const selectedClass = isSelected ? 'selected' : '';

        // Generate 5 swatches with labels
        const swatchesHtml = theme.swatches.map((color, i) => `
          <div class="theme-swatch-item" title="${theme.swatchNames[i]}: ${color}">
            <div class="theme-swatch" style="background-color: ${color};">
              <span class="sr-only">${theme.swatchNames[i]}</span>
            </div>
            <span class="theme-swatch-name">${theme.swatchNames[i]}</span>
          </div>
        `).join('');

        return `
          <div class="theme-card ${selectedClass}" 
               data-theme-id="${theme.id}"
               role="radio"
               aria-checked="${isSelected}"
               tabindex="0"
               style="--card-accent: ${theme.accent};">
            
            <!-- Top Header: Icon, Titles & Radio Indicator -->
            <div class="theme-card-header">
              <div class="theme-card-icon-wrap" style="background: ${theme.iconBg}; border-color: ${theme.iconBorder}55;">
                <span class="theme-card-icon" aria-hidden="true">${theme.icon}</span>
              </div>

              <div class="theme-card-title-group">
                <div class="theme-card-title-row">
                  <span class="theme-card-name">${theme.name}</span>
                  ${isSelected ? `<span class="theme-card-active-badge">ACTIVE</span>` : ''}
                </div>
                <span class="theme-card-mode-pill ${theme.mode}">
                  ${theme.mode === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </span>
              </div>

              <!-- Circular Radio Selection Indicator -->
              <div class="theme-card-indicator" aria-hidden="true">
                <div class="indicator-circle ${isSelected ? 'active' : ''}">
                  ${isSelected ? `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="theme-card-desc">${theme.description}</p>

            <!-- Color Palette Section -->
            <div class="theme-palette-section">
              <div class="theme-palette-label">Palette Preview</div>
              <div class="theme-swatches-row" aria-label="Theme color palette">
                ${swatchesHtml}
              </div>
            </div>

          </div>
        `;
      }).join('');

      this.bindCardEventListeners(container);
    },

    bindCardEventListeners: function (container) {
      const cards = container.querySelectorAll('.theme-card');
      cards.forEach(card => {
        const themeId = card.getAttribute('data-theme-id');

        card.addEventListener('click', () => {
          this.setTheme(themeId, true);
          if (window.showToast) {
            const theme = this.getThemeById(themeId);
            window.showToast(`Theme switched to "${theme.name}".`, 'info');
          }
        });

        // Keyboard accessibility
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.setTheme(themeId, true);
            if (window.showToast) {
              const theme = this.getThemeById(themeId);
              window.showToast(`Theme switched to "${theme.name}".`, 'info');
            }
          }
        });
      });
    },

    updateSelectionCardsUI: function () {
      const activeId = this.getActiveThemeId();
      const allContainers = document.querySelectorAll('.theme-selection-container');
      
      allContainers.forEach(container => {
        const cards = container.querySelectorAll('.theme-card');
        cards.forEach(card => {
          const cardThemeId = card.getAttribute('data-theme-id');
          const isSelected = cardThemeId === activeId;
          const theme = this.getThemeById(cardThemeId);

          if (isSelected) {
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');

            // Ensure active badge is present
            const titleRow = card.querySelector('.theme-card-title-row');
            if (titleRow && !titleRow.querySelector('.theme-card-active-badge')) {
              const badge = document.createElement('span');
              badge.className = 'theme-card-active-badge';
              badge.textContent = 'ACTIVE';
              titleRow.appendChild(badge);
            }

            // Update indicator circle
            const indicatorCircle = card.querySelector('.indicator-circle');
            if (indicatorCircle) {
              indicatorCircle.classList.add('active');
              indicatorCircle.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              `;
            }
          } else {
            card.classList.remove('selected');
            card.setAttribute('aria-checked', 'false');

            // Remove active badge
            const badge = card.querySelector('.theme-card-active-badge');
            if (badge) badge.remove();

            // Clear indicator circle
            const indicatorCircle = card.querySelector('.indicator-circle');
            if (indicatorCircle) {
              indicatorCircle.classList.remove('active');
              indicatorCircle.innerHTML = '';
            }
          }
        });
      });
    },

    renderAllThemePickers: function () {
      this.renderThemeSelectionCards('theme-selection-list');
      this.renderThemeSelectionCards('theme-modal-selection-list');
    }
  };

  // Immediate registration
  window.ThemeManager = ThemeManager;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
  } else {
    ThemeManager.init();
  }

})(window);
