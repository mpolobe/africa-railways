/**
 * Country Transit Map Widget
 * Auto-detects user country and renders appropriate rail network map
 * Integrates GeolocationService, RailwayDataService, TransitMapOptimizer, and TransitMapRenderer
 */

const CountryTransitMap = {
  // State
  currentCountry: null,
  currentNetwork: null,

  /**
   * Initialize the transit map widget
   * @param {string} containerId - DOM element ID to render into
   * @param {object} options - Configuration options
   */
  async init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    // Show loading state
    this._showLoading(container);

    try {
      // Detect user's country
      const location = await GeolocationService.detectCountry();
      this.currentCountry = location;

      // Check if we have rail data for this country
      let countryCode = location.countryCode;
      if (!RailwayDataService.hasRailData(countryCode)) {
        // Default to South Africa (Gautrain) for unsupported countries
        countryCode = 'ZA';
      }

      // Fetch network data
      const networkData = await RailwayDataService.getNetworkForCountry(countryCode);
      this.currentNetwork = networkData;

      // Clear loading and render
      container.innerHTML = '';
      
      // Add country selector
      this._addCountrySelector(container, countryCode);

      // Create map container
      const mapContainer = document.createElement('div');
      mapContainer.id = `${containerId}-map`;
      mapContainer.style.marginTop = '15px';
      container.appendChild(mapContainer);

      // Render the transit map
      await TransitMapRenderer.render(`${containerId}-map`, networkData, options);

      // Add station click handler
      const svg = mapContainer.querySelector('svg');
      if (svg) {
        svg.addEventListener('stationSelected', (e) => {
          this._onStationSelected(e.detail);
        });
      }

    } catch (error) {
      console.error('Failed to initialize transit map:', error);
      this._showError(container, error.message);
    }
  },

  /**
   * Show loading spinner
   */
  _showLoading(container) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        background: #16203a;
        border-radius: 12px;
        color: #fff;
        font-family: 'Inter', sans-serif;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,184,0,0.3);
          border-top-color: #FFB800;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="margin-top: 15px; color: #888;">Detecting your location...</p>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  },

  /**
   * Show error message
   */
  _showError(container, message) {
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        background: #16203a;
        border-radius: 12px;
        color: #fff;
        font-family: 'Inter', sans-serif;
        padding: 20px;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <p style="color: #ff6b6b; margin-bottom: 10px;">Failed to load transit map</p>
        <p style="color: #888; font-size: 14px;">${message}</p>
        <button onclick="CountryTransitMap.init('${container.id}')" style="
          margin-top: 15px;
          padding: 10px 20px;
          background: #FFB800;
          border: none;
          border-radius: 8px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  },

  /**
   * Add country selector dropdown
   */
  _addCountrySelector(container, currentCode) {
    const countries = RailwayDataService.getSupportedCountries();
    
    const selectorDiv = document.createElement('div');
    selectorDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
    `;

    selectorDiv.innerHTML = `
      <label style="color: #888; font-size: 14px;">
        <i class="fas fa-globe" style="margin-right: 8px;"></i>
        Select Country:
      </label>
      <select id="country-selector" style="
        padding: 8px 15px;
        background: #16203a;
        border: 1px solid #333;
        border-radius: 6px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        min-width: 200px;
      ">
        ${countries.map(c => `
          <option value="${c.code}" ${c.code === currentCode ? 'selected' : ''}>
            ${c.name}
          </option>
        `).join('')}
      </select>
      <span id="detected-location" style="color: #FFB800; font-size: 12px; margin-left: auto;">
        ${this.currentCountry ? `📍 Detected: ${this.currentCountry.countryName}` : ''}
      </span>
    `;

    container.appendChild(selectorDiv);

    // Add change handler
    const selector = selectorDiv.querySelector('#country-selector');
    selector.addEventListener('change', async (e) => {
      const newCode = e.target.value;
      await this._switchCountry(container.id, newCode);
    });
  },

  /**
   * Switch to a different country's rail network
   */
  async _switchCountry(containerId, countryCode) {
    const container = document.getElementById(containerId);
    const mapContainer = document.getElementById(`${containerId}-map`);
    
    if (!mapContainer) return;

    // Show loading in map area only
    mapContainer.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 500px;
        background: #0a0e1a;
        border-radius: 12px;
      ">
        <div style="
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255,184,0,0.3);
          border-top-color: #FFB800;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      </div>
    `;

    try {
      const networkData = await RailwayDataService.getNetworkForCountry(countryCode);
      this.currentNetwork = networkData;
      
      mapContainer.innerHTML = '';
      await TransitMapRenderer.render(`${containerId}-map`, networkData);

      // Re-add station click handler
      const svg = mapContainer.querySelector('svg');
      if (svg) {
        svg.addEventListener('stationSelected', (e) => {
          this._onStationSelected(e.detail);
        });
      }
    } catch (error) {
      console.error('Failed to switch country:', error);
      mapContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 500px;
          background: #16203a;
          border-radius: 12px;
          color: #ff6b6b;
        ">
          Failed to load network data
        </div>
      `;
    }
  },

  /**
   * Handle station selection
   */
  _onStationSelected(station) {
    console.log('Station selected:', station);
    
    // Dispatch global event for page-specific handling
    const event = new CustomEvent('transitMapStationSelected', {
      detail: {
        station,
        network: this.currentNetwork,
        country: this.currentCountry
      }
    });
    document.dispatchEvent(event);
  },

  /**
   * Manually set country (for testing or direct selection)
   */
  async setCountry(containerId, countryCode) {
    GeolocationService.setCountry(countryCode, '', 0, 0);
    await this._switchCountry(containerId, countryCode);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CountryTransitMap;
}
if (typeof window !== 'undefined') {
  window.CountryTransitMap = CountryTransitMap;
}
