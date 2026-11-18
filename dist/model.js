(function(root) {
  'use strict';
  const conditions = ['Poor', 'Fair', 'Good', 'Very good', 'Closed'];
  const boroughs = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island', 'Cross-borough',
  'Unknown'];
  const bands = ['1', '2-4', '5-9', '10-49', '50+'];
  const colors = {
    Poor: '#083370',
    Fair: '#5e626e',
    Good: '#999277',
    'Very good': '#e5cf52',
    Closed: '#b5bec6'
  };
  const markerAreas = {
    '1': 20,
    '2-4': 38,
    '5-9': 62,
    '10-49': 95,
    '50+': 140
  };

  function emptyFilters() {
    return {
      conditions: [],
      boroughs: [],
      bridgeType: '',
      rating: '',
      minArea: 0,
      search: '',
      bins: null
    };
  }

  function select(rows, filters) {
    const query = filters.search.trim().toLowerCase();
    const bins = filters.bins === null ? null : new Set(filters.bins);
    return rows.filter(row =>
      (!filters.conditions.length || filters.conditions.includes(row.condition)) &&
      (!filters.boroughs.length || filters.boroughs.includes(row.borough_group)) &&
      (!filters.bridgeType || filters.bridgeType === row.pedestrian_code) &&
      (!filters.rating || filters.rating === row.rating_basis) &&
      row.deck_area_sq_ft >= filters.minArea &&
      (!query || [row.bin, row.feature_carried, row.feature_crossed].join(' ').toLowerCase().includes(
        query)) &&
      (bins === null || bins.has(row.bin))
    );
  }

  function totalArea(rows) {
    return rows.reduce((sum, row) => sum + row.deck_area_sq_ft, 0);
  }

  // A chart keeps its own categories available while other filters narrow its context.
  function viewRows(rows, filters, view) {
    if (view === 'condition') return select(rows, {...filters, conditions: []});
    if (view === 'borough') return select(rows, {...filters, boroughs: []});
    return select(rows, filters);
  }

  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function comparisonMedians(rows) {
    return conditions.flatMap(condition => ['PED-coded', 'Other codes'].map(group => {
      const subset = rows.filter(row => row.condition === condition && row.pedestrian_code === group);
      return {
        condition,
        group,
        count: subset.length,
        medianArea: median(subset.map(row => row.deck_area_sq_ft)),
        medianSpans: median(subset.map(row => row.spans))
      };
    }));
  }

  function summarize(rows, field, order) {
    const area = totalArea(rows);
    return order.map(name => {
      const subset = rows.filter(row => row[field] === name);
      const groupArea = totalArea(subset);
      return {
        name,
        count: subset.length,
        area: groupArea,
        countShare: rows.length ? subset.length / rows.length * 100 : null,
        areaShare: area ? groupArea / area * 100 : null
      };
    });
  }

  function toggle(values, value) {
    return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
  }

  function validate(rows) {
    if (!Array.isArray(rows) || rows.length !== 813) throw new Error(
      'Expected the full 813-record inventory.');
    if (new Set(rows.map(r => r.bin)).size !== rows.length) throw new Error(
      'Duplicate structure identifiers.');
    for (const row of rows) {
      if (!conditions.includes(row.condition) || !boroughs.includes(row.borough_group) || !bands.includes(
          row.span_band)) throw new Error('Unknown category in inventory.');
      if (!(row.deck_area_sq_ft > 0) || !Number.isInteger(row.spans) || row.spans < 1) throw new Error(
        'Invalid area or span count.');
      if (!['PED-coded', 'Other codes'].includes(row.pedestrian_code)) throw new Error(
        'Unknown bridge group.');
      if (!['NBI-W', 'Legacy exception'].includes(row.rating_basis) || !/^\d{4}-\d{2}-\d{2}$/.test(row
          .inspection_date)) throw new Error('Invalid inspection metadata.');
    }
    return true;
  }
  const model = {
    conditions,
    boroughs,
    bands,
    colors,
    markerAreas,
    emptyFilters,
    select,
    viewRows,
    comparisonMedians,
    totalArea,
    summarize,
    toggle,
    validate
  };
  root.BridgeModel = model;
  if (typeof module !== 'undefined') module.exports = model;
})(typeof window !== 'undefined' ? window : globalThis);
