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
test('combined selections use the selected denominator in every group', () => {
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
