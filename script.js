/* Kryptiva.se: scroll reveal, hero network and glow, and the encryption demo. The page works without this file. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce && 'IntersectionObserver' in window) {
    var items = document.querySelectorAll('.section h2, .section .lead, .svc li, .steps li, .person, .contact-list, .cipher');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
      el.classList.add('reveal');
      io.observe(el);
    });
    root.classList.add('js');

    var hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        hero.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }
  }


  /* Hero network: points joined by lines. Drawn once; it drifts briefly on load and while the pointer moves over the hero, never endlessly. */
  (function () {
    var canvas = document.querySelector('.net');
    var hero = document.querySelector('.hero');
    if (!canvas || !hero || !canvas.getContext) { return; }
    var ctx = canvas.getContext('2d');
    var pts = [], w = 0, h = 0, until = 0, raf = 0;
    function size() {
      var r = hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(22, Math.min(110, Math.round(w * h / 9000)));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 1.6 });
      }
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 165) {
            ctx.strokeStyle = 'rgba(224, 69, 143, ' + (0.28 * (1 - d / 165)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(240, 127, 180, 0.75)';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }
    }
    function step(now) {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) { p.vx = -p.vx; }
        if (p.y < 0 || p.y > h) { p.vy = -p.vy; }
      }
      draw();
      raf = now < until ? window.requestAnimationFrame(step) : 0;
    }
    function move(ms) {
      if (reduce) { return; }
      until = window.performance.now() + ms;
      if (!raf) { raf = window.requestAnimationFrame(step); }
    }
    size();
    move(3500);
    hero.addEventListener('pointermove', function () { move(2000); });
    var t;
    window.addEventListener('resize', function () { window.clearTimeout(t); t = window.setTimeout(size, 150); });
  })();

  var box = document.querySelector('[data-cipher]');
  if (!box || !window.crypto || !window.crypto.subtle || !window.TextEncoder) { return; }
  var input = box.querySelector('input');
  var out = box.querySelector('output');
  var btn = box.querySelector('button');
  var key = null;
  var seq = 0;
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function b64(buf) {
    var bytes = new Uint8Array(buf), s = '';
    for (var i = 0; i < bytes.length; i++) { s += String.fromCharCode(bytes[i]); }
    return window.btoa(s);
  }
  function newKey() {
    return window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']).then(function (k) { key = k; });
  }
  function settle(text, mine) {
    var start = null;
    function frame(now) {
      if (mine !== seq) { return; }
      if (start === null) { start = now; }
      var p = Math.min(1, (now - start) / 700);
      var n = Math.floor(text.length * p), s = text.slice(0, n);
      for (var i = n; i < text.length; i++) { s += ALPHA.charAt(Math.floor(Math.random() * 64)); }
      out.textContent = s;
      if (p < 1) { window.requestAnimationFrame(frame); }
    }
    window.requestAnimationFrame(frame);
  }
  function encrypt(animate) {
    var mine = ++seq;
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    return window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(input.value)).then(function (ct) {
      if (mine !== seq) { return; }
      var text = b64(ct);
      if (animate && !reduce) { settle(text, mine); } else { out.textContent = text; }
    });
  }

  input.readOnly = false;
  btn.hidden = false;
  input.addEventListener('input', function () { encrypt(false); });
  btn.addEventListener('click', function () { newKey().then(function () { encrypt(true); }); });
  newKey().then(function () { encrypt(true); });
})();
