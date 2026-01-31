/**
 * Transit Map Renderer - Renders metro-style SVG transit maps using D3.js
 * Generates Gautrain-style graphics that adapt to any country's rail network
 */

const TransitMapRenderer = {
  // Default configuration
  config: {
    width: 950,
    height: 500,
    padding: 80,
    paddingLeft: 120,
    paddingRight: 160,
    paddingTop: 80,
    paddingBottom: 80,
    stationRadius: 8,
    interchangeRadius: 12,
    lineWidth: 6,
    fontSize: 11,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#0a0e1a',
    textColor: '#ffffff',
    gridColor: 'rgba(255,255,255,0.05)'
  },

  /**
   * Initialize and render transit map in a container
   * @param {string} containerId - DOM element ID to render into
   * @param {object} networkData - Rail network data from RailwayDataService
   * @param {object} options - Optional configuration overrides
   */
  async render(containerId, networkData, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    // Merge options with defaults
    const cfg = { ...this.config, ...options };

    // Process network data through optimizer
    const optimizedData = TransitMapOptimizer.process(networkData);

    // Create SVG
    const svg = this._createSVG(container, cfg, optimizedData);

    // Add interactive features
    this._addInteractivity(svg, optimizedData, cfg);

    return svg;
  },

  /**
   * Create the SVG element and render all components
   */
  _createSVG(container, cfg, data) {
    // Clear existing content
    container.innerHTML = '';

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', cfg.height);
    svg.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);
    svg.setAttribute('class', 'transit-map-svg');
    svg.style.backgroundColor = cfg.backgroundColor;
    svg.style.borderRadius = '12px';

    // Add definitions (gradients, filters)
    this._addDefs(svg, data, cfg);

    // Add background grid
    this._addGrid(svg, cfg);

    // Add title
    this._addTitle(svg, data.networkName, cfg);

    // Render lines
    data.lines.forEach(line => {
      this._renderLine(svg, line, data.nodes, cfg);
    });

    // Render stations (on top of lines)
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
    data.nodes.forEach(node => {
      this._renderStation(svg, node, cfg);
    });

    // Add legend
    this._addLegend(svg, data.lines, cfg);

    container.appendChild(svg);
    return svg;
  },

  /**
   * Add SVG definitions (gradients, filters, markers)
   */
  _addDefs(svg, data, cfg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Glow filter for stations
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'glow');
    filter.innerHTML = `
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;
    defs.appendChild(filter);

    // Line gradients
    data.lines.forEach(line => {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', `gradient-${line.id}`);
      gradient.innerHTML = `
        <stop offset="0%" stop-color="${line.color}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${this._lightenColor(line.color, 20)}" stop-opacity="1"/>
      `;
      defs.appendChild(gradient);
    });

    svg.appendChild(defs);
  },

  /**
   * Add subtle background grid
   */
  _addGrid(svg, cfg) {
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid');

    const gridSize = 40;
    for (let x = 0; x <= cfg.width; x += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', cfg.height);
      line.setAttribute('stroke', cfg.gridColor);
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }
    for (let y = 0; y <= cfg.height; y += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', cfg.width);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', cfg.gridColor);
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }

    svg.appendChild(gridGroup);
  },

  /**
   * Add network title
   */
  _addTitle(svg, title, cfg) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cfg.padding);
    text.setAttribute('y', 30);
    text.setAttribute('fill', cfg.textColor);
    text.setAttribute('font-family', cfg.fontFamily);
    text.setAttribute('font-size', '18');
    text.setAttribute('font-weight', 'bold');
    text.textContent = title || 'Rail Network';
    svg.appendChild(text);
  },

  /**
   * Render a single line with its path
   */
  _renderLine(svg, line, nodes, cfg) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lineGroup.setAttribute('class', `line line-${line.id}`);

    // Build path
    const pathData = TransitMapOptimizer.getLinePath(line, nodeMap);
    if (!pathData) return;

    // Shadow/glow effect
    const shadowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shadowPath.setAttribute('d', pathData);
    shadowPath.setAttribute('stroke', line.color);
    shadowPath.setAttribute('stroke-width', cfg.lineWidth + 4);
    shadowPath.setAttribute('stroke-opacity', '0.3');
    shadowPath.setAttribute('fill', 'none');
    shadowPath.setAttribute('stroke-linecap', 'round');
    shadowPath.setAttribute('stroke-linejoin', 'round');
    lineGroup.appendChild(shadowPath);

    // Main line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', line.color);
    path.setAttribute('stroke-width', cfg.lineWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('class', 'line-path');
    lineGroup.appendChild(path);

    svg.appendChild(lineGroup);
  },

  /**
   * Render a station node
   */
  _renderStation(svg, node, cfg) {
    const stationGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    stationGroup.setAttribute('class', `station station-${node.id}`);
    stationGroup.setAttribute('data-station-id', node.id);
    stationGroup.setAttribute('data-station-name', node.name);

    const radius = node.isInterchange ? cfg.interchangeRadius : cfg.stationRadius;

    // Outer ring (white)
    const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerCircle.setAttribute('cx', node.x);
    outerCircle.setAttribute('cy', node.y);
    outerCircle.setAttribute('r', radius);
    outerCircle.setAttribute('fill', '#ffffff');
    outerCircle.setAttribute('stroke', node.isInterchange ? '#333' : 'none');
    outerCircle.setAttribute('stroke-width', node.isInterchange ? '2' : '0');
    stationGroup.appendChild(outerCircle);

    // Inner circle for interchanges
    if (node.isInterchange) {
      const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerCircle.setAttribute('cx', node.x);
      innerCircle.setAttribute('cy', node.y);
      innerCircle.setAttribute('r', radius - 4);
      innerCircle.setAttribute('fill', cfg.backgroundColor);
      stationGroup.appendChild(innerCircle);
    }

    // Station label - position based on location to avoid cutoff
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    
    // Determine label position: flip to left side if near right edge
    const isNearRightEdge = node.x > cfg.width - 150;
    const isNearLeftEdge = node.x < 120;
    
    if (isNearRightEdge) {
      // Place label to the left of the station
      label.setAttribute('x', node.x - radius - 5);
      label.setAttribute('text-anchor', 'end');
    } else if (isNearLeftEdge) {
      // Place label to the right but ensure it's visible
      label.setAttribute('x', node.x + radius + 5);
      label.setAttribute('text-anchor', 'start');
    } else {
      // Default: label to the right
      label.setAttribute('x', node.x + radius + 5);
      label.setAttribute('text-anchor', 'start');
    }
    
    label.setAttribute('y', node.y + 4);
    label.setAttribute('fill', cfg.textColor);
    label.setAttribute('font-family', cfg.fontFamily);
    label.setAttribute('font-size', cfg.fontSize);
    label.setAttribute('class', 'station-label');
    label.textContent = node.name;
    stationGroup.appendChild(label);

    svg.appendChild(stationGroup);
  },

  /**
   * Add legend showing line names and colors
   */
  _addLegend(svg, lines, cfg) {
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('class', 'legend');
    legendGroup.setAttribute('transform', `translate(${cfg.width - 200}, ${cfg.height - 30 - lines.length * 25})`);

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', -10);
    bg.setAttribute('y', -10);
    bg.setAttribute('width', 190);
    bg.setAttribute('height', lines.length * 25 + 20);
    bg.setAttribute('fill', 'rgba(0,0,0,0.5)');
    bg.setAttribute('rx', 8);
    legendGroup.appendChild(bg);

    lines.forEach((line, index) => {
      const y = index * 25;

      // Color swatch
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', 0);
      rect.setAttribute('y', y);
      rect.setAttribute('width', 30);
      rect.setAttribute('height', 6);
      rect.setAttribute('fill', line.color);
      rect.setAttribute('rx', 3);
      legendGroup.appendChild(rect);

      // Line name
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 40);
      text.setAttribute('y', y + 6);
      text.setAttribute('fill', cfg.textColor);
      text.setAttribute('font-family', cfg.fontFamily);
      text.setAttribute('font-size', '10');
      text.textContent = line.name;
      legendGroup.appendChild(text);
    });

    svg.appendChild(legendGroup);
  },

  /**
   * Add hover and click interactivity
   */
  _addInteractivity(svg, data, cfg) {
    const stations = svg.querySelectorAll('.station');

    stations.forEach(station => {
      station.style.cursor = 'pointer';

      station.addEventListener('mouseenter', (e) => {
        const circle = station.querySelector('circle');
        if (circle) {
          circle.setAttribute('filter', 'url(#glow)');
        }
        const label = station.querySelector('.station-label');
        if (label) {
          label.setAttribute('font-weight', 'bold');
        }
      });

      station.addEventListener('mouseleave', (e) => {
        const circle = station.querySelector('circle');
        if (circle) {
          circle.removeAttribute('filter');
        }
        const label = station.querySelector('.station-label');
        if (label) {
          label.setAttribute('font-weight', 'normal');
        }
      });

      station.addEventListener('click', (e) => {
        const stationId = station.getAttribute('data-station-id');
        const stationName = station.getAttribute('data-station-name');
        
        // Dispatch custom event for external handling
        const event = new CustomEvent('stationSelected', {
          detail: { id: stationId, name: stationName }
        });
        svg.dispatchEvent(event);
      });
    });
  },

  /**
   * Utility: Lighten a hex color
   */
  _lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransitMapRenderer;
}
if (typeof window !== 'undefined') {
  window.TransitMapRenderer = TransitMapRenderer;
}
