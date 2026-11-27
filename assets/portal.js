(function () {
  // ---- Sprache ----
  var btns = document.querySelectorAll('.langs button');
  var verfuegbar = Array.prototype.map.call(btns, function (b) { return b.dataset.lang; });
  function setzeSprache(l) {
    document.querySelectorAll('[lang]').forEach(function (el) {
      if (el === document.documentElement) return;
      if (verfuegbar.indexOf(el.getAttribute('lang')) < 0) return;
      el.hidden = el.getAttribute('lang') !== l;
    });
    btns.forEach(function (b) { b.classList.toggle('an', b.dataset.lang === l); });
    var sel = document.querySelector('.lang-select'); if (sel) sel.value = l;
    document.documentElement.lang = l;
    try { localStorage.setItem('bnb_lang', l); } catch (e) {}
    window.__bnbLang = l;
    if (window.__bnbKarte) window.__bnbKarte();
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { setzeSprache(b.dataset.lang); }); });
  var auswahl = document.querySelector('.lang-select');
  if (auswahl) auswahl.addEventListener('change', function () { setzeSprache(auswahl.value); });
  if (verfuegbar.length) {
    var start = null;
    try { start = localStorage.getItem('bnb_lang'); } catch (e) {}
    if (verfuegbar.indexOf(start) < 0) {
      var nav = (navigator.language || '').slice(0, 2);
      start = verfuegbar.indexOf(nav) >= 0 ? nav : verfuegbar[0];
    }
    setzeSprache(start);
  }

  // ---- Diashow ----
  var slides = document.querySelectorAll('.slide');
  if (slides.length > 1) {
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove('an');
      i = (i + 1) % slides.length;
      slides[i].classList.add('an');
    }, 6000);
  }

  // ---- Karte (erst nach Klick, wegen Datenschutz) ----
  var knopf = document.getElementById('mapLaden');
  var datenEl = document.getElementById('mapDaten');
  if (!knopf || !datenEl) return;
  var daten = JSON.parse(datenEl.textContent);
  knopf.addEventListener('click', function () {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'assets/leaflet/leaflet.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'assets/leaflet/leaflet.js';
    js.onload = zeigeKarte;
    document.body.appendChild(js);
  });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function zeigeKarte() {
    var box = document.getElementById('map');
    box.innerHTML = '';
    var map = L.map(box, { scrollWheelZoom: false }).setView(daten.c, daten.z);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var marker = [];
    function zeichne() {
      marker.forEach(function (m) { map.removeLayer(m); });
      marker = [];
      var l = window.__bnbLang || Object.keys((daten.p[0] || {}).t || {de: 1})[0];
      daten.p.forEach(function (p) {
        var t = (p.t && (p.t[l] || p.t.de || p.t.en)) || '';
        var html = '<div class="pfeil' + (p.link ? ' link' : '') + '"><div class="schild">' + esc(p.n) +
          '</div><div class="spitze"></div></div>';
        var icon = L.divIcon({ className: 'pfeil-icon', html: html, iconSize: [0, 0], iconAnchor: [0, 0] });
        var m = L.marker([p.lat, p.lon], { icon: icon }).addTo(map);
        var pop = '<strong>' + esc(p.n) + '</strong>' + (t ? '<br>' + esc(t) : '') +
          (p.link ? '<br><a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.link.replace(/^https?:\/\//, '')) + ' →</a>' : '');
        m.bindPopup(pop, { offset: [0, -34] });
        marker.push(m);
      });
    }
    zeichne();
    entzerre();
    if (daten.p.length > 1) map.fitBounds(L.latLngBounds(daten.p.map(function (p) { return [p.lat, p.lon]; })), { padding: [50, 50], maxZoom: daten.z + 2 });
    // Überlappende Schilder ausblenden (nur Pfeil bleibt, Name per Antippen)
    function entzerre() {
      var belegt = [];
      marker.forEach(function (m, i) {
        var el = m.getElement(); if (!el) return;
        var pt = map.latLngToContainerPoint(m.getLatLng());
        var b = daten.p[i].n.length * 7 + 20;
        var box = [pt.x - b / 2, pt.y - 48, pt.x + b / 2, pt.y - 14];
        var frei = belegt.every(function (o) { return box[2] < o[0] || box[0] > o[2] || box[3] < o[1] || box[1] > o[3]; });
        el.classList.toggle('klein', !frei);
        if (frei) belegt.push(box);
      });
    }
    map.on('zoomend moveend', entzerre);
    var altZeichne = zeichne;
    zeichne = function () { altZeichne(); entzerre(); };
    window.__bnbKarte = zeichne;
  }
})();
(function () {
  var f = document.getElementById('vform'); if (!f) return;
  document.querySelectorAll('[data-paket]').forEach(function (a) {
    a.addEventListener('click', function () { f.paket.value = a.dataset.paket; });
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var opts = Array.prototype.map.call(document.querySelectorAll('.zopt input:checked'), function (c) { return c.dataset.t.replace(/^\S+\s/, ''); });
    var t = 'Hallo,\n\nich interessiere mich für ' + f.dataset.marke + ' (' + f.paket.options[f.paket.selectedIndex].text + ').\n' +
      'Anzahl Unterkünfte: ' + f.anz.value + '\n' + (opts.length ? 'Zusatzoptionen: ' + opts.join(', ') + '\n' : '') +
      (f.msg.value.trim() ? '\n' + f.msg.value.trim() + '\n' : '') + '\n' + f.name.value + '\n' + f.mail.value + (f.tel.value ? '\n' + f.tel.value : '');
    location.href = 'mailto:' + f.dataset.mail + '?subject=' + encodeURIComponent('Vermieter-Anfrage ' + f.dataset.marke + ' – ' + f.name.value) + '&body=' + encodeURIComponent(t);
    f.querySelector('.ok').hidden = false;
  });
})();

// ---- Fußball am Spieltag (HSV, St. Pauli, FC Bayern): nur an Tagen mit Spiel, live während des Spiels ----
(function () {
  var box = document.getElementById('fbBox'); if (!box || !window.fetch) return;
  // beide Sprachen ausgeben; die Sprachumschaltung der Seite blendet die passende ein
  function zw(d, e) { var l = document.documentElement.lang || 'de'; return '<span lang="de"' + (l.indexOf('de') ? ' hidden' : '') + '>' + d + '</span><span lang="en"' + (l.indexOf('de') ? '' : ' hidden') + '>' + e + '</span>'; }
  var de = true;
  var T = { titel: zw('Fußball heute', 'Football today'), heute: zw('Heute', 'Today'), live: 'LIVE', ende: zw('Endstand', 'Full time'), quelle: zw('Daten: OpenLigaDB', 'Data: OpenLigaDB') };
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function heute(t) { var d = new Date(t), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }
  function zeit(t) { return new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  function laden() {
    fetch('https://places-proxy.friesh.workers.dev/fussball?v=' + encodeURIComponent(box.dataset.v)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      var zeilen = [], seen = {}, laeuft = false, offen = false;
      Object.keys(d).forEach(function (id) {
        var x = d[id] || {};
        (x.live || []).forEach(function (m) { var k = m.h + m.a + m.t; if (seen[k]) return; seen[k] = 1; laeuft = true;
          zeilen.push('<li class="live"><b>● ' + T.live + '</b> ' + esc(m.h) + ' <b>' + m.s[0] + ':' + m.s[1] + '</b> ' + esc(m.a) + '</li>'); });
        (x.naechste || []).forEach(function (m) { var k = m.h + m.a + m.t; if (seen[k] || !heute(m.t)) return; seen[k] = 1; offen = true;
          zeilen.push('<li>' + T.heute + ' ' + zeit(m.t) + ' · ' + esc(m.h) + ' – ' + esc(m.a) + ' <small>' + esc(m.liga || '') + '</small></li>'); });
        (x.letzte || []).forEach(function (m) { var k = m.h + m.a + m.t; if (seen[k] || !heute(m.t)) return; seen[k] = 1;
          zeilen.push('<li>' + T.ende + ': ' + esc(m.h) + ' <b>' + m.s[0] + ':' + m.s[1] + '</b> ' + esc(m.a) + '</li>'); });
      });
      if (!zeilen.length) { box.hidden = true; return; }
      box.innerHTML = '<strong>⚽ ' + T.titel + '</strong><ul>' + zeilen.join('') + '</ul><small class="q">' + T.quelle + '</small>';
      box.hidden = false;
      if (laeuft || offen) setTimeout(laden, 120000);
    }).catch(function () { });
  }
  laden();
})();
