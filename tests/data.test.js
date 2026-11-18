const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../dist/model.js');
const rows = JSON.parse(fs.readFileSync(path.join(__dirname,'../dist/data/bridges_2024.json'),'utf8'));
const close = (a,b) => assert.ok(Math.abs(a-b)<0.00001, `${a} differs from ${b}`);

test('the full inventory has 813 unique, valid structures', () => {
  assert.equal(M.validate(rows),true);
  assert.equal(M.select(rows,M.emptyFilters()).length,813);
  close(M.totalArea(rows),15754558.3);
  assert.equal(rows.filter(r=>r.rating_basis==='Legacy exception').length,11);
  assert.equal(rows.filter(r=>r.pedestrian_code==='PED-coded').length,133);
});
test('condition totals match the independent report summary', () => {
  const groups=M.summarize(rows,'condition',M.conditions);
  assert.deepEqual(groups.map(g=>g.count),[8,518,223,54,10]);
  close(groups.reduce((sum,g)=>sum+g.countShare,0),100);
  close(groups.reduce((sum,g)=>sum+g.areaShare,0),100);
  close(groups[0].area,585626);
});
test('fully selected records retain the expected count and area totals', () => {
  const filters={...M.emptyFilters(),conditions:['Fair','Poor']};
  const subset=M.select(rows,filters);
  assert.equal(subset.length,526);
  close(M.totalArea(subset),11313772.3);
  const boroughs=M.summarize(subset,'borough_group',M.boroughs);
  assert.equal(boroughs.find(g=>g.name==='Manhattan').count,138);
  close(boroughs.find(g=>g.name==='Cross-borough').area,3632982);
  close(boroughs.reduce((sum,g)=>sum+g.areaShare,0),100);
  assert.equal(M.select(rows,{...filters,boroughs:['Manhattan']}).length,138);
});

test('facet views retain their own categories without ignoring other selections', () => {
  const filters = {...M.emptyFilters(), conditions: ['Fair', 'Poor'], boroughs: ['Manhattan']};
  assert.equal(M.select(rows, filters).length, 138);
  assert.equal(M.viewRows(rows, filters, 'condition').length, 189);
  const boroughRows = M.viewRows(rows, filters, 'borough');
  assert.equal(boroughRows.length, 526);
  const manhattan = M.summarize(boroughRows, 'borough_group', M.boroughs)
    .find(group => group.name === 'Manhattan');
  close(manhattan.countShare, 138 / 526 * 100);
  assert.notEqual(manhattan.countShare, 100);
  assert.deepEqual(M.viewRows(rows, filters, 'structure'), M.select(rows, filters));

  const narrowed = {...filters, bridgeType: 'PED-coded', rating: 'NBI-W', minArea: 1000,
    search: 'park'};
  for (const view of ['condition', 'borough']) {
    const context = M.viewRows(rows, narrowed, view);
    assert.ok(context.length > 0);
    assert.ok(context.every(row => row.pedestrian_code === 'PED-coded' && row.rating_basis === 'NBI-W'
      && row.deck_area_sq_ft >= 1000
      && [row.bin, row.feature_carried, row.feature_crossed].join(' ').toLowerCase().includes('park')));
    assert.ok(context.every(row => view === 'condition' ? row.borough_group === 'Manhattan'
      : ['Fair', 'Poor'].includes(row.condition)));
  }
});

test('facet contexts honor explicit point selections, including an empty brush', () => {
  const filters = {...M.emptyFilters(), conditions: ['Good'], boroughs: ['Bronx'], bins: ['2271190']};
  // The selected record is Poor/Manhattan. Ignoring only one facet must not bypass the other.
  assert.equal(M.viewRows(rows, filters, 'condition').length, 0);
  assert.equal(M.viewRows(rows, filters, 'borough').length, 0);
  assert.equal(M.viewRows(rows, {...filters, boroughs: ['Manhattan']}, 'condition').length, 1);
  assert.equal(M.viewRows(rows, {...filters, conditions: ['Poor']}, 'borough').length, 1);
  for (const view of ['condition', 'borough', 'structure']) {
    assert.deepEqual(M.viewRows(rows, {...M.emptyFilters(), bins: []}, view), []);
  }
});

test('full-inventory references remain independent of a filtered borough comparison', () => {
  const baseline = M.summarize(rows, 'borough_group', M.boroughs);
  const original = JSON.stringify(baseline);
  const manhattan = baseline.find(group => group.name === 'Manhattan');
  close(manhattan.countShare, 189 / 813 * 100);
  close(manhattan.areaShare, 25.580282374530295);
  const filters = {...M.emptyFilters(), conditions: ['Fair', 'Poor'], boroughs: ['Manhattan']};
  const current = M.summarize(M.viewRows(rows, filters, 'borough'), 'borough_group', M.boroughs);
  close(current.find(group => group.name === 'Manhattan').countShare, 138 / 526 * 100);
  assert.equal(JSON.stringify(baseline), original);
  assert.deepEqual(M.summarize(rows, 'borough_group', M.boroughs), baseline);
});

test('comparison medians use exact records for every condition and both groups', () => {
  const actual = M.comparisonMedians(rows);
  const expected = [
    ['Poor', 'PED-coded', 2, 264158.5, 204], ['Poor', 'Other codes', 6, 9008.5, 3.5],
    ['Fair', 'PED-coded', 103, 1500, 3], ['Fair', 'Other codes', 415, 6517, 2],
    ['Good', 'PED-coded', 20, 1418.5, 2.5], ['Good', 'Other codes', 203, 6235, 1],
    ['Very good', 'PED-coded', 5, 4076, 4], ['Very good', 'Other codes', 49, 7000, 2],
    ['Closed', 'PED-coded', 3, 2100, 1], ['Closed', 'Other codes', 7, 9706, 10]
  ];
  assert.deepEqual(actual.map(row => [row.condition, row.group, row.count, row.medianArea, row.medianSpans]), expected);
  assert.equal(actual.reduce((count, group) => count + group.count, 0), 813);
});

test('filtered median summaries distinguish absent, single, and even-sized groups', () => {
  const fairPed = M.select(rows, {...M.emptyFilters(), conditions: ['Fair'], bridgeType: 'PED-coded'});
  const filtered = M.comparisonMedians(fairPed);
  assert.deepEqual(filtered.find(row => row.condition === 'Fair' && row.group === 'PED-coded'),
    {condition: 'Fair', group: 'PED-coded', count: 103, medianArea: 1500, medianSpans: 3});
  assert.ok(filtered.filter(row => row.group === 'Other codes')
    .every(row => row.count === 0 && row.medianArea === null && row.medianSpans === null));
  const single = M.comparisonMedians(M.select(rows, {...M.emptyFilters(), search: '2271190'}));
  assert.deepEqual(single.find(row => row.condition === 'Poor' && row.group === 'PED-coded'),
    {condition: 'Poor', group: 'PED-coded', count: 1, medianArea: 526320, medianSpans: 403});
  assert.ok(M.comparisonMedians([]).every(row => row.count === 0
    && row.medianArea === null && row.medianSpans === null));
  const fixture = [9, 1, 7, 3].map((area, index) => ({condition: 'Good', pedestrian_code: 'Other codes',
    deck_area_sq_ft: area, spans: [10, 1, 4, 2][index]}));
  assert.deepEqual(M.comparisonMedians(fixture).find(row => row.condition === 'Good' && row.group === 'Other codes'),
    {condition: 'Good', group: 'Other codes', count: 4, medianArea: 5, medianSpans: 3});
});

test('view contexts and median calculations do not mutate filters or records', () => {
  const filters = Object.freeze({...M.emptyFilters(), conditions: Object.freeze(['Fair', 'Poor']),
    boroughs: Object.freeze(['Manhattan']), bins: Object.freeze(['2271190'])});
  const sample = Object.freeze(rows.map(row => Object.freeze({...row})));
  const beforeRows = JSON.stringify(sample);
  const beforeFilters = JSON.stringify(filters);
  M.viewRows(sample, filters, 'condition');
  M.viewRows(sample, filters, 'borough');
  M.viewRows(sample, filters, 'structure');
  M.comparisonMedians(sample);
  assert.equal(JSON.stringify(sample), beforeRows);
  assert.equal(JSON.stringify(filters), beforeFilters);
});
test('bridge type and rating basis intersect without silently discarding exceptions', () => {
  assert.equal(M.select(rows,{...M.emptyFilters(),rating:'NBI-W'}).length,802);
  const ped=M.select(rows,{...M.emptyFilters(),bridgeType:'PED-coded',rating:'Legacy exception'});
  assert.equal(ped.length,11);
  assert.ok(ped.every(r=>r.bridge_type.includes('PED')));
});
test('unknown borough and alphanumeric BINs remain selectable', () => {
  const unknown=M.select(rows,{...M.emptyFilters(),boroughs:['Unknown']});
  assert.equal(unknown.length,1);assert.equal(unknown[0].bin,'2269600');
  const alpha=rows.find(r=>/[^0-9]/.test(r.bin));
  assert.ok(alpha);
  assert.equal(M.select(rows,{...M.emptyFilters(),bins:[alpha.bin]})[0].bin,alpha.bin);
});
test('empty selections have no invalid percentages', () => {
  const empty=M.select(rows,{...M.emptyFilters(),conditions:['Poor'],boroughs:['Bronx']});
  assert.equal(empty.length,0);
  assert.ok(M.summarize(empty,'condition',M.conditions).every(g=>g.countShare===null&&g.areaShare===null));
  assert.equal(M.select(rows,{...M.emptyFilters(),bins:[]}).length,0);
});
test('search, area filtering, and clearing are reversible', () => {
  const single=M.select(rows,{...M.emptyFilters(),search:'2271190'});
  assert.equal(single.length,1);assert.equal(single[0].spans,403);
  const large=M.select(rows,{...M.emptyFilters(),minArea:100000});
  assert.ok(large.length>0&&large.length<813);
  assert.ok(large.every(r=>r.deck_area_sq_ft>=100000));
  assert.deepEqual(M.toggle(M.toggle([],'Fair'),'Fair'),[]);
  assert.equal(M.select(rows,M.emptyFilters()).length,813);
});
