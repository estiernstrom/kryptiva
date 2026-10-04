/* Kryptiva.se: phone menu, fold-out services, scroll reveal, hero network and glow, and the encryption demo. The page works without this file. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia ? window.matchMedia('(max-width: 52rem)') : null;
  root.classList.add('js-ui');

  /* Phone menu */
  var navBtn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (navBtn && nav) {
    var setNav = function (open) {
      nav.classList.toggle('open', open);
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    navBtn.hidden = false;
    navBtn.addEventListener('click', function () { setNav(navBtn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { setNav(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navBtn.getAttribute('aria-expanded') === 'true') { setNav(false); navBtn.focus(); }
    });
  }

  /* Fold-out service groups: buttons on phones, plain headings on wide screens */
  var toggles = document.querySelectorAll('.group-toggle');
  if (toggles.length && phone) {
    var sync = function () {
      Array.prototype.forEach.call(toggles, function (b) {
        var list = document.getElementById(b.getAttribute('aria-controls'));
        if (phone.matches) {
          var open = b.getAttribute('data-open') === '1';
          b.removeAttribute('tabindex');
          b.setAttribute('aria-expanded', open ? 'true' : 'false');
          list.hidden = !open;
        } else {
          b.setAttribute('tabindex', '-1');
          b.removeAttribute('aria-expanded');
          list.hidden = false;
        }
      });
    };
    Array.prototype.forEach.call(toggles, function (b) {
      b.addEventListener('click', function () {
        if (!phone.matches) { return; }
        b.setAttribute('data-open', b.getAttribute('data-open') === '1' ? '0' : '1');
        sync();
      });
    });
    if (phone.addEventListener) { phone.addEventListener('change', sync); } else if (phone.addListener) { phone.addListener(sync); }
    sync();
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var items = document.querySelectorAll('.section h2, .page-title, .section .lead, .svc li, .steps li, .person, .term, .cipher, .proxy');
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

    Array.prototype.forEach.call(document.querySelectorAll('.hero, .contact'), function (host) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        host.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        host.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }


  /* Network of points joined by lines, behind the hero and the contact section. Drawn once; it drifts briefly on load and while the pointer moves over it, never endlessly. */
  Array.prototype.forEach.call(document.querySelectorAll('.net'), function (canvas) {
    var hero = canvas.parentNode;
    if (!hero || !canvas.getContext) { return; }
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
  });

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
    if (input.value === '') { out.textContent = ''; return Promise.resolve(); }
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
