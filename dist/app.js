(function() {
  'use strict';
  const M = window.BridgeModel;
  const rows = window.BRIDGE_DATA;
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const number = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1
  });
  const inventoryBoroughs = M.summarize(rows, 'borough_group', M.boroughs);
  const medianNumber = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2});
  let filters = M.emptyFilters();
  let selected = rows;
  let pinned = null;
  let plotted = [];
  let brush = null;
  let draggedAt = 0;

  function escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    } [c]));
  }

  function svg(tag, attrs, parent, content) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (content !== undefined) element.textContent = content;
    if (parent) parent.appendChild(element);
    return element;
  }

  function text(parent, x, y, value, attrs = {}) {
    return svg('text', {
      x,
      y,
      ...attrs
    }, parent, value);
  }

  function line(parent, x1, y1, x2, y2, attrs = {}) {
    return svg('line', {
      x1,
      y1,
      x2,
      y2,
      stroke: '#e1e5e3',
      'stroke-width': 1,
      ...attrs
    }, parent);
  }

  function percent(value) {
    return value === null ? '-' : value.toFixed(1) + '%';
  }

  function id(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function activate(element, action) {
    element.addEventListener('click', action);
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action(event);
      }
    });
  }

  function showTip(event, html) {
    const tip = $('tooltip');
    tip.innerHTML = html;
    tip.hidden = false;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.x + rect.width / 2;
    const y = event.clientY || rect.y;
    tip.style.left = Math.max(8, Math.min(x + 14, window.innerWidth - tip.offsetWidth - 10)) + 'px';
    tip.style.top = Math.max(8, Math.min(y + 16, window.innerHeight - tip.offsetHeight - 10)) + 'px';
  }

  function hideTip() {
    $('tooltip').hidden = true;
  }

  function tooltip(element, html) {
    element.addEventListener('pointermove', event => {
      if (!brush) showTip(event, html);
    });
    element.addEventListener('pointerleave', hideTip);
    element.addEventListener('focus', event => showTip(event, html));
    element.addEventListener('blur', hideTip);
  }

  function axis(parent, left, right, bottom, top) {
    [0, 25, 50, 75, 100].forEach(value => {
      const x = left + (right - left) * value / 100;
      line(parent, x, top, x, bottom, {
        stroke: value === 0 ? '#9caeaf' : '#e9edeb'
      });
      text(parent, x, bottom + 17, value, {
        'text-anchor': 'middle',
        'font-size': 12
      });
    });
    line(parent, left, bottom, right, bottom, {
      stroke: '#afbcbd'
    });
    text(parent, (left + right) / 2, bottom + 35, 'Share of comparison total (%)', {
      'text-anchor': 'middle',
      'font-size': 12
    });
  }
  // Preserve the condition comparison by excluding only its own selection.
  function conditionChart() {
    const chart = $('condition-chart');
    chart.replaceChildren();
    const population = M.viewRows(rows, filters, 'condition');
    const groups = M.summarize(population, 'condition', M.conditions);
    $('condition-context').textContent = `Comparison: ${number.format(population.length)} ${population.length === 1 ? 'structure' : 'structures'}, ${number.format(M.totalArea(population))} sq ft. Includes all conditions; other filters apply. ` + (filters.conditions.length ? 'Highlighted rows are selected; muted rows remain for comparison.' : 'All conditions included.');
    const left = 109,
      right = 538;
    const defs = svg('defs', {}, chart);
    M.conditions.forEach(name => {
      const hatchStroke = name === 'Very good' ? '#806b20' : M.colors[name];
      const pattern = svg('pattern', {
        id: 'hatch-' + id(name),
        width: 5,
        height: 5,
        patternUnits: 'userSpaceOnUse',
        patternTransform: 'rotate(45)'
      }, defs);
      svg('rect', {
        width: 5,
        height: 5,
        fill: 'white'
      }, pattern);
      line(pattern, 0, 0, 0, 5, {
        stroke: hatchStroke,
        'stroke-width': 2
      });
    });
    axis(chart, left, right, 245, 9);
    groups.forEach((group, index) => {
      const y = 18 + index * 43;
      const active = filters.conditions.includes(group.name);
      const muted = filters.conditions.length > 0 && !active;
      const label =
        `${group.name}: ${group.count} structures, ${percent(group.countShare)} of comparison count, ${percent(group.areaShare)} of comparison deck area. Toggle condition filter.`;
      const row = svg('g', {
        id: 'condition-' + id(group.name),
        class: active ? 'context-selected' : (muted ? 'context-muted' : ''),
        'data-count': group.count,
        'data-count-share': group.countShare,
        'data-area-share': group.areaShare,
        role: 'button',
        tabindex: 0,
        'aria-pressed': active,
        'aria-label': label
      }, chart);
      svg('rect', {
        x: 0,
        y: y - 6,
        width: 615,
        height: 39,
        rx: 3,
        fill: active ? '#dcefe7' : 'transparent',
        stroke: 'none'
      }, row);
      text(row, 99, y + 13, group.name, {
        'text-anchor': 'end',
        fill: active ? '#125b54' : '#3e535b',
        'font-weight': active ? '700' : '400'
      });
      const values = [group.countShare, group.areaShare];
      values.forEach((value, j) => {
        const width = (value || 0) / 100 * (right - left);
        svg('rect', {
          x: left,
          y: y + j * 13,
          width,
          height: 9,
          fill: j === 0 ? M.colors[group.name] : 'url(#hatch-' + id(group.name) + ')',
          stroke: group.name === 'Very good' ? '#806b20' : M.colors[group.name],
          'stroke-width': 1,
          'pointer-events': 'none'
        }, row);
        text(row, left + width + 6, y + 8 + j * 13, percent(value), {
          'font-size': 12
        });
      });
      const info =
        `<b>${escape(group.name)}</b><br>${number.format(group.count)} structures · ${percent(group.countShare)}<br>${number.format(group.area)} sq ft · ${percent(group.areaShare)}<br><span class="tip-muted">Of ${population.length} comparison records before condition selection. Click to toggle.</span>`;
      tooltip(row, info);
      activate(row, () => {
        filters.conditions = M.toggle(filters.conditions, group.name);
        render();
      });
    });
    line(chart, 4, 181, 610, 181, {
      stroke: '#b5c0c0',
      'stroke-dasharray': '3 3',
      'pointer-events': 'none'
    });
    chart.dataset.recordCount = population.length;
  }
  // These are contributions to the selected cohort, not within-borough rates.
  function boroughChart() {
    const chart = $('borough-chart');
    chart.replaceChildren();
    const population = M.viewRows(rows, filters, 'borough');
    const groups = M.summarize(population, 'borough_group', M.boroughs);
    $('borough-context').textContent = `Comparison: ${number.format(population.length)} ${population.length === 1 ? 'structure' : 'structures'}, ${number.format(M.totalArea(population))} sq ft, before borough selection. Other filters apply. Light marks below each row: full 813-record inventory. ` + (filters.boroughs.length ? 'Highlighted rows are selected; muted rows remain for comparison.' : 'All boroughs included.');
    const left = 118,
      right = 498;
    axis(chart, left, right, 245, 9);
    text(chart, 613, 10, 'count / area', {
      'text-anchor': 'end',
      'font-size': 11
    });
    groups.forEach((group, index) => {
      const y = 29 + index * 29;
      const active = filters.boroughs.includes(group.name);
      const muted = filters.boroughs.length > 0 && !active;
      const baseline = inventoryBoroughs[index];
      const row = svg('g', {
        id: 'borough-' + id(group.name),
        class: active ? 'context-selected' : (muted ? 'context-muted' : ''),
        'data-count': group.count,
        'data-count-share': group.countShare,
        'data-area-share': group.areaShare,
        role: 'button',
        tabindex: 0,
        'aria-pressed': active,
        'aria-label': `${group.name}: ${group.count} structures, ${percent(group.countShare)} of count, ${percent(group.areaShare)} of deck area. Toggle borough filter.`
      }, chart);
      svg('rect', {
        x: 0,
        y: y - 13,
        width: 618,
        height: 27,
        rx: 3,
        fill: active ? '#e8f1ed' : 'transparent'
      }, row);
      text(row, 108, y + 4, group.name, {
        'text-anchor': 'end',
        'font-weight': active ? '700' : '400',
        fill: active ? '#125b54' : '#3e535b'
      });
      const x = value => left + value / 100 * (right - left);
      // Two immutable references: count and area have different denominators.
      const reference = svg('g', {class: 'inventory-reference', 'aria-hidden': 'true'}, row);
      line(reference, x(baseline.countShare), y + 9, x(baseline.areaShare), y + 9,
        {stroke: '#879694', 'stroke-width': 1, 'stroke-dasharray': '2 2'});
      svg('circle', {cx: x(baseline.countShare), cy: y + 9, r: 3,
        fill: '#b3bfba', stroke: '#71817c', 'stroke-width': .7}, reference);
      svg('rect', {x: x(baseline.areaShare) - 2.5, y: y + 6.5, width: 5, height: 5,
        fill: '#fff', stroke: '#71817c', 'stroke-width': .9}, reference);
      if (group.countShare !== null) {
        line(row, x(group.countShare), y - 3, x(group.areaShare), y - 3,
          {stroke: '#91a6aa', 'stroke-width': 2});
        svg('circle', {cx: x(group.countShare), cy: y - 3, r: 4.8, fill: '#263e4a'}, row);
        svg('rect', {x: x(group.areaShare) - 3.5, y: y - 6.5, width: 7, height: 7,
          fill: 'white', stroke: '#263e4a', 'stroke-width': 1.2}, row);
      }
      text(row, 613, y + 4, `${percent(group.countShare)} / ${percent(group.areaShare)}`,
        {'text-anchor': 'end', 'font-size': 12});
      const delta = (current, full) => current === null ? 'No comparison records' :
        `${current - full >= 0 ? '+' : ''}${(current - full).toFixed(1)} percentage points`;
      tooltip(row,
        `<b>${escape(group.name)}</b><br>Comparison count: ${number.format(group.count)} · ${percent(group.countShare)}<br>Inventory count share: ${percent(baseline.countShare)} · ${delta(group.countShare, baseline.countShare)}<br>Comparison area: ${number.format(group.area)} sq ft · ${percent(group.areaShare)}<br>Inventory area share: ${percent(baseline.areaShare)} · ${delta(group.areaShare, baseline.areaShare)}<br><span class="tip-muted">Comparison excludes the borough selection. References always use all 813 records. Not a within-borough condition rate.</span>`);
      activate(row, () => {
        filters.boroughs = M.toggle(filters.boroughs, group.name);
        render();
      });
    });
    chart.dataset.recordCount = population.length;
  }
  // Stable offsets separate overlapping records without creating a new variable.
  function jitter(bin) {
    let hash = 2166136261;
    for (const char of bin) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return ((hash >>> 0) % 1001 / 1000 - .5) * 20;
  }
  // Circle and triangle have equal geometric area for a given span band.
  function drawMarker(parent, x, y, area, ped, attrs = {}) {
    const common = {
      fill: '#81958f',
      stroke: '#203744',
      'stroke-width': .55,
      ...attrs
    };
    if (ped) {
      const h = Math.sqrt(area * Math.sqrt(3)),
        w = h / Math.sqrt(3);
      return svg('path', {
        d: `M ${x} ${y-2*h/3} L ${x-w} ${y+h/3} L ${x+w} ${y+h/3} Z`,
        ...common
      }, parent);
    }
    return svg('circle', {
      cx: x,
      cy: y,
      r: Math.sqrt(area / Math.PI),
      ...common
    }, parent);
  }

  const codeNames = {PED: 'Pedestrian', A: 'Arterial', R: 'Ramp', O: 'Off-System',
    W: 'Waterway', M: 'Movable', E: 'East River', T: 'Tunnel'};

  function bridgeCodeLabel(code) {
    const components = code.match(/PED|[AROWMET]/g) || [];
    const names = components.map(part => codeNames[part]);
    return names.length ? `${code} · ${names.join(' / ')}` : code;
  }

  function ratingLabel(basis) {
    return basis === 'NBI-W' ? 'National Bridge Inventory Weighted (NBI-W)' :
      'Legacy exception · report-listed earlier rating scale';
  }

  function recordTip(row) {
    return `<b>${escape(row.feature_carried)}</b><br><span class="tip-muted">BIN ${escape(row.bin)} · ${escape(row.borough_group)}</span><br>${escape(row.condition)} · ${number.format(row.deck_area_sq_ft)} sq ft<br>${row.spans} spans<br>Bridge code: ${escape(bridgeCodeLabel(row.bridge_type))}<br><b>Inspection year: ${escape(row.inspection_date.slice(0, 4))}</b><br>Recorded date: ${escape(row.inspection_date)}<br>Rating basis: ${escape(ratingLabel(row.rating_basis))}<br><span class="tip-muted">Reported condition, not current safety. Click to select.</span>`;
  }

  function medianComparison() {
    const summary = M.comparisonMedians(selected);
    const host = $('median-rows');
    host.replaceChildren();
    const metric = value => value === null ? '—' : medianNumber.format(value);
    M.conditions.forEach(condition => {
      const tr = document.createElement('tr');
      tr.dataset.condition = condition;
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = condition;
      tr.append(th);
      for (const group of ['PED-coded', 'Other codes']) {
        const item = summary.find(d => d.condition === condition && d.group === group);
        for (const value of [item.count, item.medianArea, item.medianSpans]) {
          const td = document.createElement('td');
          td.textContent = metric(value);
          tr.append(td);
        }
      }
      host.append(tr);
    });
    $('median-context').textContent = `All active filters apply: ${number.format(selected.length)} ${selected.length === 1 ? 'record' : 'records'}. ` +
      (filters.bridgeType ? 'The bridge-group filter excludes the other group; clear it to compare both. ' : '') +
      'n = number of structures. A dash means no records, not zero. Small groups need caution; medians describe this selection, not a general rule.';
  }

  function structureChart() {
    const chart = $('structure-chart');
    chart.replaceChildren();
    const left = 108,
      right = 1245,
      top = 12,
      bottom = 257;
    const lanes = {
      'Very good': 35,
      Good: 81,
      Fair: 127,
      Poor: 173,
      Closed: 232
    };
    const backdrop = svg('rect', {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      fill: '#fff',
      'data-brush-target': 'true'
    }, chart);
    [100, 1000, 10000, 100000, 1000000].forEach((value, index) => {
      const x = left + index / 4 * (right - left);
      line(chart, x, top, x, bottom, {
        stroke: index === 0 ? '#a6b5b7' : '#e6eae8',
        'pointer-events': 'none'
      });
      text(chart, x, bottom + 19, ['100', '1,000', '10,000', '100,000', '1,000,000'][index], {
        'text-anchor': 'middle',
        'font-size': 12
      });
    });
    Object.entries(lanes).forEach(([name, y]) => {
      text(chart, 97, y + 4, name, {
        'text-anchor': 'end',
        'font-size': 12
      });
      line(chart, left, y, right, y, {
        stroke: '#f1f3f1',
        'pointer-events': 'none'
      });
    });
    line(chart, 4, 203, 1250, 203, {
      stroke: '#b5c0c0',
      'stroke-dasharray': '4 3',
      'pointer-events': 'none'
    });
    text(chart, 1250, 217, 'Closed: separate status', {
      'text-anchor': 'end',
      'font-size': 11
    });
    line(chart, left, bottom, right, bottom, {
      stroke: '#a6b5b7'
    });
    text(chart, (left + right) / 2, 298, 'Deck area in square feet · logarithmic scale (each step = ×10)', {
      'text-anchor': 'middle',
      'font-size': 11
    });
    plotted = [];
    [...selected].sort((a, b) => M.markerAreas[b.span_band] - M.markerAreas[a.span_band] || a.bin
      .localeCompare(b.bin)).forEach(row => {
      const x = left + (Math.log10(row.deck_area_sq_ft) - 2) / 4 * (right - left);
      const y = lanes[row.condition] + jitter(row.bin);
      plotted.push({
        x,
        y,
        row
      });
      const point = drawMarker(chart, x, y, M.markerAreas[row.span_band], row.pedestrian_code ===
        'PED-coded', {
          id: 'point-' + row.bin,
          class: 'structure-point',
          fill: M.colors[row.condition],
          'fill-opacity': .88,
          role: 'button',
          tabindex: 0,
          'aria-label': `${row.feature_carried}, BIN ${row.bin}, ${row.condition}, ${number.format(row.deck_area_sq_ft)} square feet, ${row.spans} spans. Select structure.`,
          'aria-pressed': Boolean(filters.bins?.includes(row.bin)),
          'data-bin': row.bin
        });
      tooltip(point, recordTip(row));
      activate(point, () => {
        if (Date.now() - draggedAt < 200) return;
        filters.bins = filters.bins?.length === 1 && filters.bins[0] === row.bin ? null : [row.bin];
        pinned = filters.bins ? row : null;
        render();
      });
    });
    chart.dataset.recordCount = selected.length;
    chart.dataset.markCount = plotted.length;
  }

  function detailPanel() {
    if (!pinned || !selected.some(r => r.bin === pinned.bin)) {
      $('record-details').innerHTML =
        '<p class="muted">No individual structure pinned. Hover over any point to inspect it, or use the search above to find a BIN or name.</p>';
      return;
    }
    const r = pinned;
    const details = [
      ['BIN', r.bin],
      ['Condition', r.condition],
      ['Deck area', number.format(r.deck_area_sq_ft) + ' sq ft'],
      ['Spans', r.spans + ' (band ' + r.span_band + ')'],
      ['Bridge code', bridgeCodeLabel(r.bridge_type)],
      ['Borough', r.borough_group + ' (code ' + r.boro + ')'],
      ['Crosses', r.feature_crossed],
      ['Inspection year / date', r.inspection_date.slice(0, 4) + ' / ' + r.inspection_date],
      ['Rating source / basis', r.rating_source + ' / ' + ratingLabel(r.rating_basis)]
    ];
    $('record-details').innerHTML =
      `<div class="record-name">${escape(r.feature_carried)}</div><dl class="detail-grid">${details.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}<div><dt>Source record</dt><dd><a target="_blank" rel="noopener" href="https://www.nyc.gov/html/dot/downloads/pdf/dot_bridgereport24.pdf#page=${r.source_pdf_page}">Report page ${r.source_printed_page} ↗</a></dd></div></dl>${r.rating_basis==='Legacy exception'?'<p class="detail-note">This structure uses a legacy rating. Its reported label is preserved; use the rating-basis filter to compare inventories with and without legacy cases.</p>':''}`;
  }

  function chips() {
    const host = $('active-filters');
    host.replaceChildren();
    const add = (label, clear) => {
      const b = document.createElement('button');
      b.className = 'filter-chip';
      b.textContent = label + ' ×';
      b.setAttribute('aria-label', 'Clear ' + label);
      b.addEventListener('click', () => {
        const index = [...host.querySelectorAll('button')].indexOf(b);
        clear();
        render();
        const remaining = host.querySelectorAll('button');
        (remaining[Math.min(index, remaining.length - 1)] || $('reset')).focus({preventScroll: true});
      });
      host.append(b);
    };
    filters.conditions.forEach(value => add('Condition: ' + value, () => {
      filters.conditions = M.toggle(filters.conditions, value);
    }));
    filters.boroughs.forEach(value => add('Borough: ' + value, () => {
      filters.boroughs = M.toggle(filters.boroughs, value);
    }));
    if (filters.bridgeType) add(filters.bridgeType, () => {
      filters.bridgeType = '';
    });
    if (filters.rating) add(filters.rating, () => {
      filters.rating = '';
    });
    if (filters.minArea) add('Area ≥ ' + number.format(filters.minArea), () => {
      filters.minArea = 0;
    });
    if (filters.search) add('Search: ' + filters.search, () => {
      filters.search = '';
    });
    if (filters.bins !== null) add('Structure selection: ' + filters.bins.length, () => {
      filters.bins = null;
      pinned = null;
    });
    if (!host.children.length) {
      const span = document.createElement('span');
      span.className = 'all-label';
      span.textContent = 'No filters applied · exploring the full inventory';
      host.append(span);
    }
  }
  // Totals, records and medians use all filters; summary charts retain their own facet context.
  function render() {
    const focusId = document.activeElement?.id;
    hideTip();
    selected = M.select(rows, filters);
    const area = M.totalArea(selected);
    $('record-count').textContent = number.format(selected.length);
    $('area-total').textContent = area >= 1e6 ? (area / 1e6).toFixed(2) + ' million' : number.format(area);
    $('area-exact').textContent = number.format(area) + ' sq ft';
    $('borough').value = filters.boroughs.length > 1 ? '__multiple__' : (filters.boroughs[0] || '');
    $('bridge-type').value = filters.bridgeType;
    $('rating').value = filters.rating;
    $('min-area').value = filters.minArea || '';
    $('search').value = filters.search;
    $('clear-points').hidden = filters.bins === null;
    $('empty-state').hidden = selected.length !== 0;
    chips();
    conditionChart();
    boroughChart();
    structureChart();
    medianComparison();
    detailPanel();
    const restore = focusId && $(focusId);
    if (restore && document.activeElement === document.body) restore.focus({
      preventScroll: true
    });
  }
  // Convert screen coordinates to SVG coordinates before testing the brush box.
  function coordinates(event) {
    const chart = $('structure-chart'),
      point = chart.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(chart.getScreenCTM().inverse());
  }

  function startBrush(event) {
    if (event.button !== 0 || event.target.closest('.structure-point')) return;
    const p = coordinates(event);
    if (p.x < 108 || p.x > 1245 || p.y < 12 || p.y > 257) return;
    const chart = $('structure-chart');
    brush = {
      x: p.x,
      y: p.y,
      element: svg('rect', {
        class: 'brush-box',
        x: p.x,
        y: p.y,
        width: 0,
        height: 0
      }, chart)
    };
    chart.setPointerCapture(event.pointerId);
    hideTip();
    event.preventDefault();
  }

  function moveBrush(event) {
    if (!brush) return;
    const p = coordinates(event);
    const x = Math.max(108, Math.min(1245, p.x)),
      y = Math.max(12, Math.min(257, p.y));
    brush.endX = x;
    brush.endY = y;
    Object.entries({
      x: Math.min(brush.x, x),
      y: Math.min(brush.y, y),
      width: Math.abs(x - brush.x),
      height: Math.abs(y - brush.y)
    }).forEach(([k, v]) => brush.element.setAttribute(k, v));
  }

  function endBrush(event) {
    if (!brush) return;
    const b = brush;
    brush = null;
    b.element.remove();
    if ($('structure-chart').hasPointerCapture(event.pointerId)) $('structure-chart').releasePointerCapture(
      event.pointerId);
    if (b.endX === undefined || Math.abs(b.endX - b.x) < 4 || Math.abs(b.endY - b.y) < 4) return;
    const minX = Math.min(b.x, b.endX),
      maxX = Math.max(b.x, b.endX),
      minY = Math.min(b.y, b.endY),
      maxY = Math.max(b.y, b.endY);
    filters.bins = plotted.filter(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY).map(p => p
      .row.bin);
    pinned = filters.bins.length === 1 ? rows.find(r => r.bin === filters.bins[0]) : null;
    draggedAt = Date.now();
    render();
  }
  // Export exact rows, not rounded labels from the charts.
  function downloadCsv() {
    const fields = ['bin', 'feature_carried', 'feature_crossed', 'borough_group', 'condition',
      'deck_area_sq_ft', 'spans', 'span_band', 'bridge_type', 'pedestrian_code', 'inspection_date',
      'rating_source', 'rating_basis', 'source_printed_page'
    ];
    const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const content = [fields.join(','), ...selected.map(row => fields.map(k => csvCell(row[k])).join(','))]
      .join('\r\n');
    const link = document.createElement('a'),
      url = URL.createObjectURL(new Blob(['\ufeff' + content], {
        type: 'text/csv;charset=utf-8'
      }));
    link.href = url;
    link.download = 'counting_crossings_selected.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  try {
    M.validate(rows);
    M.boroughs.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      $('borough').append(option);
    });
    M.bands.forEach(band => {
      const item = document.createElement('span'),
        icon = svg('svg', {
          viewBox: '0 0 20 18'
        });
      drawMarker(icon, 10, 9, M.markerAreas[band], false, {
        fill: '#9baba7'
      });
      item.append(icon, document.createTextNode(band));
      $('size-legend').append(item);
    });
    $('size-legend').prepend(document.createTextNode('Span bands: '));
    $('borough').addEventListener('change', event => {
      if (event.target.value !== '__multiple__') filters.boroughs = event.target.value ? [event.target.value] : [];
      render();
    });
    $('bridge-type').addEventListener('change', event => {
      filters.bridgeType = event.target.value;
      render();
    });
    $('rating').addEventListener('change', event => {
      filters.rating = event.target.value;
      render();
    });
    $('min-area').addEventListener('input', event => {
      filters.minArea = Math.max(0, event.target.valueAsNumber || 0);
      render();
    });
    $('search').addEventListener('input', event => {
      filters.search = event.target.value;
      render();
    });
    $('reset').addEventListener('click', () => {
      filters = M.emptyFilters();
      pinned = null;
      render();
    });
    $('clear-points').addEventListener('click', () => {
      filters.bins = null;
      pinned = null;
      render();
    });
    $('export-csv').addEventListener('click', downloadCsv);
    $('structure-chart').addEventListener('pointerdown', startBrush);
    $('structure-chart').addEventListener('pointermove', moveBrush);
    $('structure-chart').addEventListener('pointerup', endBrush);
    $('structure-chart').addEventListener('pointercancel', () => {
      if (brush) {
        brush.element.remove();
        brush = null;
      }
    });
    window.addEventListener('scroll', hideTip, {
      passive: true
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTip();
    });
    render();
  } catch (error) {
    $('record-count').textContent = 'Load error';
    $('empty-state').hidden = false;
    $('empty-state').textContent = 'The inventory could not be loaded: ' + error.message +
      ' Keep the data folder beside index.html, or use the standalone HTML copy.';
    console.error(error);
  }
})();
