/* Le réseau mycélien : chaque livre est un nœud, relié au cœur de son territoire par un filament vivant. */
(function () {
  'use strict';
  function Reseau(cadre, livres, opts) {
    this.cadre = cadre; this.opts = opts || {};
    this.cv = cadre.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.bulle = cadre.querySelector('.reseau__infobulle');
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.calme = window.LS && LS.calme;
    this.images = {}; this.noeuds = []; this.hubs = []; this.survol = null; this.selection = null;
    this.croissance = this.calme ? 1 : 0; this.visible = false; this.souris = { x: -1, y: -1 }; this.decal = { x: 0, y: 0 };
    this.taille(); this.definir(livres, true); this.legende(); this.ecouter();
    var self = this;
    new IntersectionObserver(function (e) {
      self.visible = e[0].isIntersecting;
      if (self.visible) { if (!self.demarre) { self.demarre = performance.now(); } self.lancer(); }
    }, { threshold: 0.15 }).observe(cadre);
    window.addEventListener('resize', function () { self.taille(); self.placer(false); self.dessiner(performance.now()); });
  }

  Reseau.prototype.taille = function () {
    var r = this.cadre.getBoundingClientRect();
    this.W = r.width; this.H = r.height;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.petit = this.W < 700;
  };

  Reseau.prototype.definir = function (livres, premiere) {
    var self = this;
    var anciens = {};
    this.noeuds.forEach(function (n) { anciens[n.l.ref] = n; });
    this.livres = livres;
    this.noeuds = livres.map(function (l) {
      var a = anciens[l.ref];
      if (!self.images[l.ref] && l.couv) { var im = new Image(); im.decoding = 'async'; im.src = LS.couv(l, 's'); self.images[l.ref] = im; }
      return { l: l, x: a ? a.x : self.W / 2, y: a ? a.y : self.H / 2, tx: 0, ty: 0, t: a ? a.t : 0, phase: Math.random() * Math.PI * 2 };
    });
    this.placer(premiere);
    if (!premiere) { this.croissance = Math.min(this.croissance, 1); this.lancer(); }
  };

  Reseau.prototype.placer = function (immediat) {
    var W = this.W, H = this.H, petit = this.petit;
    var terr = LS.territoires;
    var pos = petit
      ? [[0.3, 0.22], [0.72, 0.36], [0.28, 0.6], [0.74, 0.74], [0.3, 0.88]]
      : [[0.25, 0.3], [0.53, 0.6], [0.78, 0.28], [0.82, 0.76], [0.2, 0.8]];
    var ordre = ['societe', 'environnement', 'vin', 'autonomia', 'aclasser'];
    var self = this;
    var groupes = {};
    this.noeuds.forEach(function (n) { var t = (n.l.thematiques && n.l.thematiques[0]) || 'aclasser'; (groupes[t] = groupes[t] || []).push(n); });
    this.hubs = ordre.map(function (id, i) {
      var t = terr.filter(function (x) { return x.id === id; })[0];
      return { id: id, nom: t ? t.court : 'À classer', couleur: t ? t.hex : '#8f8574', x: pos[i][0] * W, y: pos[i][1] * H, n: (groupes[id] || []).length };
    }).filter(function (h) { return h.n > 0; });
    var hubParId = {}; this.hubs.forEach(function (h) { hubParId[h.id] = h; });
    var taille = petit ? 15 : 24;
    Object.keys(groupes).forEach(function (id) {
      var h = hubParId[id] || self.hubs[0];
      var g = groupes[id];
      var k = Math.min(petit ? 11 : 17, Math.sqrt((W * H) / (self.noeuds.length + 4)) * (petit ? 0.42 : 0.5));
      g.forEach(function (n, i) {
        var a = i * 2.39996 + (id.length * 0.7), r = (taille * 1.8) + k * Math.sqrt(i + 1) * 1.15;
        n.tx = h.x + Math.cos(a) * r * 1.12; n.ty = h.y + Math.sin(a) * r * 0.86;
        n.tx = Math.max(16, Math.min(W - 16, n.tx)); n.ty = Math.max(16, Math.min(H - 40, n.ty));
        n.hub = h; n.ordre = i; n.taille = taille;
        n.hub2 = n.l.thematiques && n.l.thematiques[1] ? hubParId[n.l.thematiques[1]] : null;
        if (immediat) { n.x = n.tx; n.y = n.ty; }
      });
    });
  };

  Reseau.prototype.legende = function () {
    var leg = this.cadre.querySelector('.reseau__legende'); if (!leg) return;
    leg.innerHTML = this.hubs.map(function (h) { return '<span style="--c:' + h.couleur + '"><i></i>' + LS.esc(h.nom) + ' · ' + h.n + '</span>'; }).join('');
  };

  Reseau.prototype.ecouter = function () {
    var self = this;
    function point(e) { var r = self.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    this.cv.addEventListener('pointermove', function (e) {
      var p = point(e); self.souris = p; self.survol = self.trouver(p);
      self.cv.style.cursor = self.survol ? 'pointer' : 'default';
      self.cv.setAttribute('data-curseur', self.survol ? 'livre' : '');
      self.infobulle(); self.lancer();
    });
    this.cv.addEventListener('pointerleave', function () { self.survol = null; self.souris = { x: -1, y: -1 }; self.infobulle(); self.lancer(); });
    this.cv.addEventListener('click', function (e) {
      var n = self.trouver(point(e));
      if (!n) { self.selection = null; return; }
      if (e.pointerType === 'touch' || LS.tactile) {
        if (self.selection !== n) { self.selection = n; self.survol = n; self.infobulle(); self.lancer(); return; }
      }
      var a = document.createElement('a'); a.href = LS.lienLivre(n.l); document.body.appendChild(a); a.click(); a.remove();
    });
  };

  Reseau.prototype.trouver = function (p) {
    var meilleur = null, dmin = Infinity;
    for (var i = 0; i < this.noeuds.length; i++) {
      var n = this.noeuds[i], dx = n.x - p.x, dy = n.y - p.y, d = dx * dx + dy * dy;
      if (d < dmin) { dmin = d; meilleur = n; }
    }
    var lim = (this.petit ? 22 : 26); return dmin < lim * lim ? meilleur : null;
  };

  Reseau.prototype.infobulle = function () {
    var b = this.bulle; if (!b) return;
    var n = this.survol;
    if (!n) { b.classList.remove('est-visible'); return; }
    b.innerHTML = '<strong>' + LS.esc(n.l.titre) + '</strong><span>' + (LS.auteurs(n.l) ? LS.esc(LS.auteurs(n.l)) + ' · ' : '') + LS.prix(n.l.prix) + '</span>';
    var x = n.x + 26, y = n.y - 20;
    if (x + 290 > this.W) x = n.x - 26 - Math.min(280, b.offsetWidth || 240);
    b.style.left = Math.max(8, x) + 'px'; b.style.top = Math.max(8, Math.min(this.H - 90, y)) + 'px';
    b.classList.add('est-visible');
  };

  Reseau.prototype.lancer = function () {
    if (this.boucle || !this.visible) return;
    var self = this;
    this.boucle = true;
    requestAnimationFrame(function f(t) {
      var actif = self.dessiner(t);
      if (self.visible && (actif || !self.calme)) requestAnimationFrame(f); else self.boucle = false;
    });
  };

  Reseau.prototype.dessiner = function (t) {
    var ctx = this.ctx, W = this.W, H = this.H, self = this, actif = false;
    if (!this.calme && this.demarre) this.croissance = Math.min(1, (t - this.demarre) / 2600);
    var g = this.calme ? 1 : 1 - Math.pow(1 - this.croissance, 3);
    if (this.croissance < 1) actif = true;
    if (this.souris.x >= 0 && !this.calme) { this.decal.x += ((this.souris.x / W - 0.5) * -14 - this.decal.x) * 0.06; this.decal.y += ((this.souris.y / H - 0.5) * -10 - this.decal.y) * 0.06; }
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.translate(this.decal.x, this.decal.y);
    var temps = t * 0.001;
    this.noeuds.forEach(function (n) {
      var dx = n.tx - n.x, dy = n.ty - n.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.3) { n.x += dx * 0.09; n.y += dy * 0.09; actif = true; }
    });
    // filaments
    ctx.lineCap = 'round';
    this.noeuds.forEach(function (n, i) {
      var h = n.hub; if (!h) return;
      var prog = Math.max(0, Math.min(1, g * 1.6 - (n.ordre / 60)));
      if (prog <= 0) return;
      var mx = (h.x + n.x) / 2 + Math.sin(i * 1.7 + temps * 0.4) * 18, my = (h.y + n.y) / 2 + Math.cos(i * 2.3 + temps * 0.3) * 18;
      var ex = h.x + (n.x - h.x) * prog, ey = h.y + (n.y - h.y) * prog;
      var lit = self.survol && (self.survol === n || self.survol.hub === h);
      ctx.strokeStyle = hexa(h.couleur, lit ? 0.55 : 0.16);
      ctx.lineWidth = lit ? 1.2 : 0.8;
      ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.quadraticCurveTo(h.x + (mx - h.x) * prog, h.y + (my - h.y) * prog, ex, ey); ctx.stroke();
      if (n.hub2 && prog >= 1) {
        ctx.strokeStyle = hexa(n.hub2.couleur, 0.1); ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.quadraticCurveTo((n.x + n.hub2.x) / 2 + 30, (n.y + n.hub2.y) / 2 - 30, n.hub2.x, n.hub2.y); ctx.stroke(); ctx.setLineDash([]);
      }
      if (!self.calme && prog >= 1) {
        var p = (temps * 0.18 + n.phase / 6.283) % 1, q = 1 - p;
        var px = q * q * h.x + 2 * q * p * mx + p * p * n.x, py = q * q * h.y + 2 * q * p * my + p * p * n.y;
        ctx.fillStyle = hexa('#e3a95c', 0.5 * Math.sin(p * Math.PI));
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 6.283); ctx.fill();
      }
    });
    // cœurs des territoires
    this.hubs.forEach(function (h) {
      var r = 6 + Math.sin(temps * 2 + h.x) * 1.5;
      var grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 60);
      grad.addColorStop(0, hexa(h.couleur, 0.35)); grad.addColorStop(1, hexa(h.couleur, 0));
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(h.x, h.y, 60, 0, 6.283); ctx.fill();
      ctx.fillStyle = h.couleur; ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, 6.283); ctx.fill();
    });
    // livres
    var dessus = null;
    this.noeuds.forEach(function (n) {
      var prog = Math.max(0, Math.min(1, g * 1.6 - (n.ordre / 60) - 0.25)); if (prog <= 0) return;
      if (n === self.survol) { dessus = n; return; }
      self.couverture(n, n.taille * prog, self.survol ? 0.45 : 0.92);
    });
    if (dessus) { dessus.t += (1 - dessus.t) * 0.2; this.couverture(dessus, dessus.taille + (this.petit ? 26 : 44) * dessus.t, 1, true); actif = true; }
    this.noeuds.forEach(function (n) { if (n !== self.survol && n.t > 0.01) { n.t *= 0.8; actif = true; } });
    // libellés des cœurs
    ctx.textAlign = 'center';
    this.hubs.forEach(function (h) {
      ctx.font = (self.petit ? '400 15px ' : '400 21px ') + '"Fraunces", Georgia, serif';
      ctx.shadowColor = 'rgba(22,18,14,0.95)'; ctx.shadowBlur = 14;
      ctx.fillStyle = 'rgba(237,230,214,' + (0.95 * g) + ')';
      ctx.fillText(h.nom, h.x, h.y - (self.petit ? 16 : 24));
      ctx.fillText(h.nom, h.x, h.y - (self.petit ? 16 : 24));
      ctx.font = '400 10.5px "IBM Plex Mono", monospace'; ctx.fillStyle = hexa(h.couleur, 0.95 * g);
      ctx.fillText(h.n + (h.n > 1 ? ' TITRES' : ' TITRE'), h.x, h.y + (self.petit ? 24 : 30));
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    });
    ctx.restore();
    return actif;
  };

  Reseau.prototype.couverture = function (n, taille, alpha, ombre) {
    var ctx = this.ctx, im = this.images[n.l.ref];
    var ratio = n.l.couv ? n.l.couv.h / n.l.couv.w : 1.5;
    var w = taille, h = taille * ratio;
    ctx.globalAlpha = alpha;
    if (ombre) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; }
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, n.x - w / 2, n.y - h / 2, w, h);
    else { ctx.fillStyle = n.l.couv ? n.l.couv.dos : '#3a2f25'; ctx.fillRect(n.x - w / 2, n.y - h / 2, w, h); }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.globalAlpha = 1;
  };

  function hexa(hex, a) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }

  window.LSReseau = Reseau;
})();
