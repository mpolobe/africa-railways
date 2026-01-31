/**
 * Transit Map Optimizer - Converts geographic rail data to metro-style diagrams
 * Uses octilinear (45°/90°) layout for clean, readable transit maps
 */

const TransitMapOptimizer = {
  /**
   * Process raw rail network data into optimized metro-style layout
   */
  process(networkData) {
    if (!networkData || !networkData.lines) {
      return { nodes: [], edges: [], lines: [] };
    }

    const nodes = [];
    const edges = [];
    const processedLines = [];

    networkData.lines.forEach(line => {
      const lineNodes = [];
      const lineEdges = [];

      line.stations.forEach((station, index) => {
        // Create node with optimized position
        const node = {
          id: station.id,
          name: station.name,
          originalLat: station.lat,
          originalLng: station.lng,
          x: 0, // Will be calculated
          y: 0, // Will be calculated
          lineIds: [line.id],
          isInterchange: false
        };

        // Check if this station already exists (interchange)
        const existingNode = nodes.find(n => n.id === station.id);
        if (existingNode) {
          existingNode.lineIds.push(line.id);
          existingNode.isInterchange = true;
          lineNodes.push(existingNode);
        } else {
          nodes.push(node);
          lineNodes.push(node);
        }

        // Create edge to previous station
        if (index > 0) {
          const prevStation = line.stations[index - 1];
          lineEdges.push({
            id: `${prevStation.id}-${station.id}`,
            source: prevStation.id,
            target: station.id,
            lineId: line.id,
            color: line.color
          });
        }
      });

      edges.push(...lineEdges);
      processedLines.push({
        id: line.id,
        name: line.name,
        color: line.color,
        nodes: lineNodes,
        edges: lineEdges
      });
    });

    // Calculate optimized positions
    this._calculateOptimizedPositions(nodes, edges);

    return {
      nodes,
      edges,
      lines: processedLines,
      networkName: networkData.name
    };
  },

  /**
   * Calculate optimized x,y positions for metro-style layout
   * Uses a simplified octilinear approach
   */
  _calculateOptimizedPositions(nodes, edges) {
    if (nodes.length === 0) return;

    // Find bounding box of original coordinates
    const lats = nodes.map(n => n.originalLat);
    const lngs = nodes.map(n => n.originalLng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Normalize to 0-1 range, then scale to canvas
    const width = 800;
    const height = 500;
    const padding = 60;

    nodes.forEach(node => {
      // Initial position based on geographic coordinates
      let x = ((node.originalLng - minLng) / (maxLng - minLng || 1)) * (width - 2 * padding) + padding;
      let y = ((maxLat - node.originalLat) / (maxLat - minLat || 1)) * (height - 2 * padding) + padding;

      // Snap to grid for cleaner appearance
      const gridSize = 40;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;

      node.x = x;
      node.y = y;
    });

    // Apply octilinear edge optimization
    this._optimizeEdgeAngles(nodes, edges);
  },

  /**
   * Adjust node positions to create cleaner 45°/90° angles
   */
  _optimizeEdgeAngles(nodes, edges) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      edges.forEach(edge => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Snap to nearest 45° angle
        const snappedAngle = Math.round(angle / 45) * 45;
        const radians = snappedAngle * (Math.PI / 180);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only adjust target if it's not an interchange
        if (!target.isInterchange) {
          target.x = source.x + Math.cos(radians) * distance;
          target.y = source.y + Math.sin(radians) * distance;
        }
      });
    }
  },

  /**
   * Get SVG path data for a line
   */
  getLinePath(lineData, nodeMap) {
    if (!lineData.nodes || lineData.nodes.length < 2) return '';

    const points = lineData.nodes.map(n => {
      const node = nodeMap.get(n.id) || n;
      return `${node.x},${node.y}`;
    });

    return `M ${points.join(' L ')}`;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransitMapOptimizer;
}
if (typeof window !== 'undefined') {
  window.TransitMapOptimizer = TransitMapOptimizer;
}
