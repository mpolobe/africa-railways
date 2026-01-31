/**
 * Journey Map Ticket Component
 * Renders a simplified journey map for digital ticket receipts
 * Similar to Gautrain-style QR-coded card visualization
 */

const JourneyMapTicket = {
  /**
   * Generate a journey map SVG for a ticket
   * @param {object} journey - Journey details
   * @param {string} journey.origin - Origin station ID
   * @param {string} journey.destination - Destination station ID
   * @param {string} journey.lineName - Line name
   * @param {string} journey.lineColor - Line color
   * @param {array} journey.stops - Array of stops along the route
   * @param {object} options - Rendering options
   */
  render(containerId, journey, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    const cfg = {
      width: options.width || 380,
      height: options.height || 220,
      padding: 25,
      lineColor: journey.lineColor || '#FFB800',
      backgroundColor: options.backgroundColor || '#0a0e1a',
      textColor: options.textColor || '#ffffff',
      ...options
    };

    const svg = this._createTicketSVG(journey, cfg);
    container.innerHTML = '';
    container.appendChild(svg);

    return svg;
  },

  /**
   * Create the ticket SVG
   */
  _createTicketSVG(journey, cfg) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', cfg.width);
    svg.setAttribute('height', cfg.height);
    svg.setAttribute('viewBox', `0 0 ${cfg.width} ${cfg.height}`);
    svg.style.borderRadius = '12px';
    svg.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

    // Background with gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="ticket-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#16203a"/>
        <stop offset="100%" stop-color="#0a0e1a"/>
      </linearGradient>
      <filter id="ticket-glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', cfg.width);
    bg.setAttribute('height', cfg.height);
    bg.setAttribute('fill', 'url(#ticket-bg)');
    bg.setAttribute('rx', '12');
    svg.appendChild(bg);

    // Border accent
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', '2');
    border.setAttribute('y', '2');
    border.setAttribute('width', cfg.width - 4);
    border.setAttribute('height', cfg.height - 4);
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', cfg.lineColor);
    border.setAttribute('stroke-width', '2');
    border.setAttribute('stroke-opacity', '0.3');
    border.setAttribute('rx', '10');
    svg.appendChild(border);

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', cfg.padding);
    title.setAttribute('y', 25);
    title.setAttribute('fill', cfg.lineColor);
    title.setAttribute('font-family', "'Inter', sans-serif");
    title.setAttribute('font-size', '12');
    title.setAttribute('font-weight', 'bold');
    title.textContent = journey.lineName || 'JOURNEY MAP';
    svg.appendChild(title);

    // Draw the journey line
    const stops = journey.stops || [];
    const lineY = cfg.height / 2;
    const startX = cfg.padding + 20;
    const endX = cfg.width - cfg.padding - 20;
    const stepX = stops.length > 1 ? (endX - startX) / (stops.length - 1) : 0;

    // Main line (shadow)
    const lineShadow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineShadow.setAttribute('x1', startX);
    lineShadow.setAttribute('y1', lineY);
    lineShadow.setAttribute('x2', endX);
    lineShadow.setAttribute('y2', lineY);
    lineShadow.setAttribute('stroke', cfg.lineColor);
    lineShadow.setAttribute('stroke-width', '8');
    lineShadow.setAttribute('stroke-opacity', '0.3');
    lineShadow.setAttribute('stroke-linecap', 'round');
    svg.appendChild(lineShadow);

    // Main line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', lineY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', lineY);
    line.setAttribute('stroke', cfg.lineColor);
    line.setAttribute('stroke-width', '4');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);

    // Draw stops
    stops.forEach((stop, index) => {
      const x = startX + (index * stepX);
      const isTerminal = index === 0 || index === stops.length - 1;
      const isOrigin = stop.id === journey.origin || index === 0;
      const isDestination = stop.id === journey.destination || index === stops.length - 1;

      // Stop circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', lineY);
      circle.setAttribute('r', isTerminal ? 8 : 5);
      circle.setAttribute('fill', '#ffffff');
      
      if (isTerminal) {
        circle.setAttribute('stroke', cfg.lineColor);
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('filter', 'url(#ticket-glow)');
      }
      svg.appendChild(circle);

      // Stop label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', cfg.textColor);
      label.setAttribute('font-family', "'Inter', sans-serif");

      if (isTerminal) {
        label.setAttribute('y', lineY + 30);
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', 'bold');
      } else {
        label.setAttribute('y', lineY - 15);
        label.setAttribute('font-size', '9');
        label.setAttribute('fill-opacity', '0.7');
      }

      // Truncate long names
      const displayName = stop.name.length > 12 ? stop.name.substring(0, 10) + '...' : stop.name;
      label.textContent = displayName;
      svg.appendChild(label);

      // Origin/Destination markers
      if (isOrigin) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        marker.setAttribute('x', x);
        marker.setAttribute('y', lineY - 25);
        marker.setAttribute('text-anchor', 'middle');
        marker.setAttribute('fill', '#10b981');
        marker.setAttribute('font-size', '10');
        marker.setAttribute('font-weight', 'bold');
        marker.textContent = 'FROM';
        svg.appendChild(marker);
      }

      if (isDestination) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        marker.setAttribute('x', x);
        marker.setAttribute('y', lineY - 25);
        marker.setAttribute('text-anchor', 'middle');
        marker.setAttribute('fill', '#ef4444');
        marker.setAttribute('font-size', '10');
        marker.setAttribute('font-weight', 'bold');
        marker.textContent = 'TO';
        svg.appendChild(marker);
      }
    });

    // Journey info at bottom right (moved from left to make room for QR)
    const infoY = cfg.height - 15;
    
    // Stops count
    const stopsInfo = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    stopsInfo.setAttribute('x', cfg.width - cfg.padding);
    stopsInfo.setAttribute('y', infoY);
    stopsInfo.setAttribute('text-anchor', 'end');
    stopsInfo.setAttribute('fill', cfg.textColor);
    stopsInfo.setAttribute('fill-opacity', '0.6');
    stopsInfo.setAttribute('font-family', "'Inter', sans-serif");
    stopsInfo.setAttribute('font-size', '10');
    stopsInfo.textContent = `${stops.length} stops`;
    svg.appendChild(stopsInfo);

    // QR code placeholder area - positioned bottom left to avoid overlapping destination
    const qrSize = 35;
    const qrX = cfg.padding;
    const qrY = cfg.height - qrSize - 8;

    const qrBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    qrBg.setAttribute('x', qrX);
    qrBg.setAttribute('y', qrY);
    qrBg.setAttribute('width', qrSize);
    qrBg.setAttribute('height', qrSize);
    qrBg.setAttribute('fill', '#ffffff');
    qrBg.setAttribute('rx', '4');
    svg.appendChild(qrBg);

    // Simple QR pattern (placeholder)
    this._drawQRPattern(svg, qrX + 3, qrY + 3, qrSize - 6);

    return svg;
  },

  /**
   * Draw a simple QR-like pattern (placeholder)
   */
  _drawQRPattern(svg, x, y, size) {
    const cellSize = size / 7;
    const pattern = [
      [1,1,1,0,1,1,1],
      [1,0,1,0,1,0,1],
      [1,1,1,0,1,1,1],
      [0,0,0,0,0,0,0],
      [1,1,1,0,1,0,1],
      [1,0,1,0,0,1,0],
      [1,1,1,0,1,0,1]
    ];

    pattern.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell) {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x + j * cellSize);
          rect.setAttribute('y', y + i * cellSize);
          rect.setAttribute('width', cellSize);
          rect.setAttribute('height', cellSize);
          rect.setAttribute('fill', '#000000');
          svg.appendChild(rect);
        }
      });
    });
  },

  /**
   * Generate journey map from booking data
   * Integrates with Africa Railways Booking API
   */
  async generateFromBooking(containerId, bookingData) {
    // Extract journey details from booking
    const journey = {
      origin: bookingData.fromStation,
      destination: bookingData.toStation,
      lineName: bookingData.routeName || bookingData.operator || 'Rail Journey',
      lineColor: this._getLineColor(bookingData.operator),
      stops: await this._getRouteStops(bookingData)
    };

    return this.render(containerId, journey);
  },

  /**
   * Get line color based on operator
   */
  _getLineColor(operator) {
    const colors = {
      'TAZARA': '#1E90FF',
      'Zambia Railways': '#006B3F',
      'Kenya Railways': '#006600',
      'Gautrain': '#00A651',
      'Egypt Metro': '#E3000B',
      'Morocco HSR': '#C8102E',
      'Nigeria Rail': '#008751',
      'default': '#FFB800'
    };
    return colors[operator] || colors.default;
  },

  /**
   * Get route stops from booking data or railway service
   */
  async _getRouteStops(bookingData) {
    // If stops are provided in booking data, use them
    if (bookingData.stops && bookingData.stops.length > 0) {
      return bookingData.stops;
    }

    // Try to get from RailwayDataService
    try {
      const countryCode = bookingData.countryCode || 'ZA';
      const network = await RailwayDataService.getNetworkForCountry(countryCode);
      
      // Find the line containing origin and destination
      for (const line of network.lines) {
        const originIdx = line.stations.findIndex(s => 
          s.id === bookingData.fromStation || s.name === bookingData.fromStation
        );
        const destIdx = line.stations.findIndex(s => 
          s.id === bookingData.toStation || s.name === bookingData.toStation
        );

        if (originIdx !== -1 && destIdx !== -1) {
          const start = Math.min(originIdx, destIdx);
          const end = Math.max(originIdx, destIdx);
          return line.stations.slice(start, end + 1);
        }
      }
    } catch (e) {
      console.warn('Could not fetch route stops:', e);
    }

    // Fallback: create simple origin-destination stops
    return [
      { id: bookingData.fromStation, name: bookingData.fromStation },
      { id: bookingData.toStation, name: bookingData.toStation }
    ];
  },

  /**
   * Create a printable ticket with journey map
   */
  createPrintableTicket(ticketData) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Train Ticket - ${ticketData.ticketId}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .ticket {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .ticket-header {
            background: linear-gradient(135deg, #16203a, #0a0e1a);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .ticket-header h1 {
            margin: 0;
            font-size: 18px;
            color: #FFB800;
          }
          .ticket-body {
            padding: 20px;
          }
          .journey-map-container {
            margin: 15px 0;
          }
          .ticket-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px dashed #ddd;
          }
          .detail-item label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
          }
          .detail-item p {
            margin: 5px 0 0;
            font-weight: bold;
          }
          .ticket-footer {
            background: #f9f9f9;
            padding: 15px 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { background: white; }
            .ticket { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <h1>🚂 AFRICA RAILWAYS</h1>
            <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">E-Ticket</p>
          </div>
          <div class="ticket-body">
            <div class="journey-map-container" id="journey-map"></div>
            <div class="ticket-details">
              <div class="detail-item">
                <label>Ticket ID</label>
                <p>${ticketData.ticketId}</p>
              </div>
              <div class="detail-item">
                <label>Date</label>
                <p>${ticketData.date}</p>
              </div>
              <div class="detail-item">
                <label>Class</label>
                <p>${ticketData.class || 'Standard'}</p>
              </div>
              <div class="detail-item">
                <label>Passengers</label>
                <p>${ticketData.passengers || 1}</p>
              </div>
            </div>
          </div>
          <div class="ticket-footer">
            Blockchain Verified • ${ticketData.txHash ? ticketData.txHash.substring(0, 20) + '...' : 'Pending'}
          </div>
        </div>
        <script src="/js/railway-data-service.js"></script>
        <script src="/js/journey-map-ticket.js"></script>
        <script>
          JourneyMapTicket.render('journey-map', ${JSON.stringify(ticketData.journey)});
        </script>
      </body>
      </html>
    `;
    return html;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JourneyMapTicket;
}
if (typeof window !== 'undefined') {
  window.JourneyMapTicket = JourneyMapTicket;
}
