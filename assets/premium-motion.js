/* Premium motion layer (WDG). Load in <head> WITHOUT defer (tiny): it only marks the page and waits for the DOM. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('pm-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Hero lines. If the heading uses <br>, each <br>-separated part is a line (keeps <em> etc.).
  // Otherwise words are grouped by where the browser actually wraps them, and re-split on resize.
  function splitLines(h) {
    var tmp = d.createElement('div'); tmp.innerHTML = h.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    var label = tmp.textContent.replace(/\s+/g, ' ').trim();
    h.setAttribute('aria-label', label);
    if (h.querySelector('br') || h.children.length) {
      // keep inline markup (<em>, coloured <span>s): <br> marks the lines, otherwise the heading rises as one block
      var parts = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = parts.map(function (p, i) { return '<span class="pm-line" aria-hidden="true"><span style="--pm-i:' + i + '">' + p.trim() + '</span></span>'; }).join('');
      h.classList.add('pm-ready'); return;
    }
    var width = 0, first = true;
    function run(force) {
      if (!force && h.offsetWidth === width) return; width = h.offsetWidth;
      h.innerHTML = label.split(' ').map(function (w) { return '<span class="pm-w">' + esc(w) + ' </span>'; }).join('');
      var lines = [], top = null;
      Array.prototype.forEach.call(h.querySelectorAll('.pm-w'), function (s) { if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop; } lines[lines.length - 1].push(esc(s.textContent)); });
      h.innerHTML = lines.map(function (l, i) { return '<span class="pm-line" aria-hidden="true"><span style="--pm-i:' + i + (first ? '' : ';animation:none') + '">' + l.join('').trim() + '</span></span>'; }).join('');
      first = false; h.classList.add('pm-ready');
    }
    run(true);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { run(true); });
    if (window.ResizeObserver) new ResizeObserver(function () { run(false); }).observe(h);
  }

  // Count-up: <span data-pm-count="140" data-pm-prefix="£" data-pm-suffix="+">140</span>
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-pm-count')), pre = el.getAttribute('data-pm-prefix') || '', suf = el.getAttribute('data-pm-suffix') || '';
    var nf = new Intl.NumberFormat('en-GB'), done = pre + nf.format(to) + suf;
    el.setAttribute('aria-label', done);
    if (reduce) { el.textContent = done; return; }
    var t0 = performance.now(), dur = 1200;
    (function f(t) { var p = Math.min((t - t0) / dur, 1); el.textContent = pre + nf.format(Math.round(to * (1 - Math.pow(1 - p, 3)))) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
  }

  function init() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-pm-lines]'), splitLines);

    // Press feedback on buttons and button-like links; adds a short `scale` transition without losing the site's own transitions.
    Array.prototype.forEach.call(d.querySelectorAll('button, .btn, [role="button"], input[type="submit"], [data-pm-press]'), function (el) {
      el.classList.add('pm-press');
      var cs = getComputedStyle(el), tp = cs.transitionProperty;
      if (tp === 'all') return;
      var props = (tp && tp !== 'none') ? tp.split(',') : [], durs = cs.transitionDuration.split(','), fns = cs.transitionTimingFunction.split(/,(?![^(]*\))/), dels = cs.transitionDelay.split(',');
      var list = props.map(function (p, i) { return p.trim() + ' ' + durs[i % durs.length].trim() + ' ' + fns[i % fns.length].trim() + ' ' + dels[i % dels.length].trim(); });
      if (props.join(',').indexOf('scale') === -1) list.push('scale 160ms cubic-bezier(0.23,1,0.32,1)');
      el.style.transition = list.join(', ');
    });

    // Stagger siblings that the site reveals with its own class (data-pm-stagger="rv" on <body>)
    var cls = d.body.getAttribute('data-pm-stagger');
    if (cls && !reduce) {
      Array.prototype.forEach.call(d.querySelectorAll('.' + cls), function (el) {
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains(cls); });
        var i = sibs.indexOf(el); if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
      });
    }

    var reveal = d.querySelectorAll('[data-pm-reveal], [data-pm-count]');
    if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(reveal, function (el) { el.classList.add('pm-in'); if (el.hasAttribute('data-pm-count')) countUp(el); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('pm-in'); if (e.target.hasAttribute('data-pm-count')) countUp(e.target); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
    Array.prototype.forEach.call(reveal, function (el) { io.observe(el); });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
