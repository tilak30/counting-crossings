(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const last = new Map();
  const timers = new WeakMap();
  const duration = 340;

  // Remember the actual on-screen geometry, including interrupted transitions.
  function capture(svg) {
    return new Map([...svg.querySelectorAll('[data-motion]')].map(node =>
      [node.dataset.motion, node]));
  }

  function move(node, previous, attributes, animate) {
    if (!animate || reduced.matches || !previous) return;
    const starts = {};
    const ends = {};
    for (const [name, target] of Object.entries(attributes)) {
      const raw = previous.getAttribute(name);
      if (raw !== null && Number.isFinite(Number(raw)) && Math.abs(Number(raw) - target) > .01) {
        starts[name] = Number(raw);
        ends[name] = target;
      }
    }
    if (!Object.keys(starts).length) return;
    for (const [name, value] of Object.entries(starts)) node.setAttribute(name, value);
    const start = performance.now();
    function frame(now) {
      // A rapid filter change replaces these marks; do not animate stale nodes.
      if (!node.isConnected) return;
      const t = reduced.matches ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      for (const [name, target] of Object.entries(ends)) {
        node.setAttribute(name, starts[name] + (target - starts[name]) * eased);
      }
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function changed(svg, records, interactive) {
    // Record identity matters: equal-size selections can still change the data.
    const key = records.map(row => row.bin).join(',');
    const before = last.get(svg);
    last.set(svg, key);
    const didChange = interactive && before !== undefined && key !== before;
    if (interactive) {
      const panel = svg.closest('.chart-panel');
      const cue = panel.querySelector('.update-cue');
      clearTimeout(timers.get(panel));
      panel.classList.remove('chart-updated');
      cue.hidden = !didChange;
      if (!didChange) return false;
      void panel.offsetWidth; // Restart the cue on consecutive filter clicks.
      panel.classList.add('chart-updated');
      timers.set(panel, setTimeout(() => {
        panel.classList.remove('chart-updated');
        cue.hidden = true;
      }, reduced.matches ? 1800 : 1450));
    }
    return didChange;
  }

  function fadePoints(group, animate) {
    if (!animate || reduced.matches) return;
    group.animate([{opacity: .55}, {opacity: 1}], {duration, easing: 'ease-out'});
  }

  window.ChartMotion = {capture, move, changed, fadePoints};
})();
