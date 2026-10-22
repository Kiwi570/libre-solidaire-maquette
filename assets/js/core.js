/* Libre & Solidaire — socle commun : données, panier, curseur, défilement, transitions, livres 3D */
(function () {
  'use strict';
  var D = window.LS_DATA || { livres: [], territoires: [], maison: {} };
  var html = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGsap && window.SplitText) gsap.registerPlugin(SplitText);
  if (hasGsap && window.Flip) gsap.registerPlugin(Flip);
  if (hasGsap && window.CustomEase) { gsap.registerPlugin(CustomEase); CustomEase.create('sol', '0.2, 0.7, 0.1, 1'); }

  function lire(cle) { try { return window.localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, v) { try { window.localStorage.setItem(cle, v); } catch (e) {} }
  function lireS(cle) { try { return window.sessionStorage.getItem(cle); } catch (e) { return null; } }
  function ecrireS(cle, v) { try { window.sessionStorage.setItem(cle, v); } catch (e) {} }

  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var calmeChoisi = lire('ls-calme');
  var calme = calmeChoisi === '1' || (calmeChoisi === null && reduit);
  if (calme) html.classList.add('calme');
  var tactile = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;

  var parRef = {};
  D.livres.forEach(function (l) { parRef[l.ref] = l; });
  var terrParId = {};
  (D.territoires || []).forEach(function (t) { terrParId[t.id] = t; });

  var fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function prix(n) { return fmt.format(n); }
  function auteurs(l) { return l.auteurs && l.auteurs.length ? l.auteurs.join(', ') : ''; }
  function couv(l, taille) { return l.couv ? 'assets/img/couvertures/' + l.couv[taille || 'm'] : ''; }
  function srcset(l) { return l.couv ? couv(l, 's') + ' 260w, ' + couv(l, 'm') + ' ' + Math.min(640, l.couv.w) + 'w' : ''; }
  function lienLivre(l) { return 'livre.html?ref=' + encodeURIComponent(l.ref); }
  function territoire(id) { return terrParId[id]; }
  function couleurTerr(l) { var t = l.thematiques && l.thematiques[0] && terrParId[l.thematiques[0]]; return t ? t.hex : 'var(--os-3)'; }
  function aujourdHui() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function dateLocale(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dateTexte(iso, opts) { return dateLocale(iso).toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'long', year: 'numeric' }); }

  /* Livre 3D : couverture réelle, dos teinté par la couleur de la couverture, tranche de pages */
  function livre3d(l, o) {
    o = o || {};
    var ratio = l.couv ? (l.couv.h / l.couv.w) : 1.5;
    var ep = o.ep || Math.round(Math.max(10, Math.min(26, (l.pages ? l.pages / 14 : 16))));
    var cls = 'livre3d' + (l.couv && l.couv.packshot ? ' livre3d--packshot' : '') + (o.cls ? ' ' + o.cls : '');
    return '<div class="' + cls + '" style="--ratio:' + ratio.toFixed(3) + ';--ep:' + ep + 'px;--dos:' + (l.couv ? l.couv.dos : '#3a2f25') + '" data-ref="' + esc(l.ref) + '">' +
      '<div class="livre3d__corps">' +
      '<img class="livre3d__face" src="' + couv(l, o.taille || 'm') + '" alt="Couverture de ' + esc(l.titre) + '" ' + (o.eager ? '' : 'loading="lazy" ') + 'decoding="async" width="' + (l.couv ? l.couv.w : 400) + '" height="' + (l.couv ? l.couv.h : 600) + '">' +
      '<span class="livre3d__face-ombre"></span>' +
      '<span class="livre3d__arriere">' + (o.quatrieme || '') + '</span>' +
      '<span class="livre3d__dos"></span><span class="livre3d__pages"></span><span class="livre3d__haut"></span>' +
      '</div><span class="livre3d__ombre"></span></div>';
  }

  function badgeLabel(l) {
    return l.label && l.label !== 'Libre & Solidaire' ? '<span class="etiquette-label" data-label="' + esc(l.label) + '">' + esc(l.label) + '</span>' : '';
  }

  function carteHTML(l, i) {
    var t = l.thematiques && l.thematiques[0] && terrParId[l.thematiques[0]];
    var badges = (l.nouveau ? '<span class="badge">Nouveau</span>' : '') + (l.aParaitre ? '<span class="badge badge--paraitre">À paraître</span>' : '');
    return '<article class="carte" data-ref="' + esc(l.ref) + '">' +
      '<a class="carte__couv" href="' + lienLivre(l) + '" data-curseur="livre" aria-label="' + esc(l.titre) + '">' +
      '<img src="' + couv(l, 's') + '" srcset="' + srcset(l) + '" sizes="(max-width: 760px) 45vw, 240px" alt="Couverture de ' + esc(l.titre) + '" ' + (i < 10 ? '' : 'loading="lazy" ') + 'decoding="async" width="' + (l.couv ? l.couv.w : 400) + '" height="' + (l.couv ? l.couv.h : 600) + '">' +
      (badges ? '<span class="carte__badges">' + badges + '</span>' : '') + '</a>' +
      '<a class="carte__titre" href="' + lienLivre(l) + '">' + esc(l.titre) + '</a>' +
      (auteurs(l) ? '<p class="carte__auteur">' + esc(auteurs(l)) + '</p>' : '') +
      '<div class="carte__bas"><span class="prix">' + prix(l.prix) + '</span>' +
      '<button class="ajouter" type="button" data-ajouter="' + esc(l.ref) + '" aria-label="Ajouter ' + esc(l.titre) + ' au panier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Ajouter</button></div>' +
      (t ? '<span class="carte__territoire" style="--c:' + t.hex + '"><i></i>' + esc(t.court) + '</span>' : '<span class="carte__territoire" aria-hidden="true">&nbsp;</span>') +
      '</article>';
  }

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('est-visible');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('est-visible'); }, 2600);
  }

  /* ---------- Panier simulé ---------- */
  var panier = {};
  try { panier = JSON.parse(lire('ls-panier') || '{}') || {}; } catch (e) { panier = {}; }
  Object.keys(panier).forEach(function (r) { if (!parRef[r]) delete panier[r]; });
  function sauverPanier() { ecrire('ls-panier', JSON.stringify(panier)); rendrePanier(); }
  function nbArticles() { return Object.keys(panier).reduce(function (s, r) { return s + panier[r]; }, 0); }
  function ajouter(ref, qte, source) {
    if (!parRef[ref]) return;
    panier[ref] = Math.min(20, (panier[ref] || 0) + (qte || 1));
    sauverPanier();
    voler(source, ref);
    toast('« ' + parRef[ref].titre + ' » ajouté au panier');
    document.querySelectorAll('[data-ajouter="' + ref + '"]').forEach(function (b) { b.classList.add('est-ajoute'); });
  }
  function voler(source, ref) {
    var cible = document.querySelector('.panier-bouton');
    var zone = source && source.closest && source.closest('.carte, .carte-nouv, .vin__vedette, .fiche, article');
    var img = zone && (zone.querySelector('.livre3d__face') || zone.querySelector('.carte__couv img') || zone.querySelector('img'));
    if (!hasGsap || calme || !cible || !img) return;
    var r = img.getBoundingClientRect(), c = cible.getBoundingClientRect();
    if (!r.width) return;
    var clone = document.createElement('img');
    clone.src = img.currentSrc || img.src; clone.className = 'vol-couverture';
    clone.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    document.body.appendChild(clone);
    gsap.timeline({ onComplete: function () { clone.remove(); gsap.fromTo(cible, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }); } })
      .to(clone, { x: c.left + c.width / 2 - r.left - r.width / 2, duration: 0.85, ease: 'power2.inOut' }, 0)
      .to(clone, { y: c.top + c.height / 2 - r.top - r.height / 2, duration: 0.85, ease: 'back.in(1.4)' }, 0)
      .to(clone, { scale: 0.12, rotate: -18, opacity: 0.4, duration: 0.85, ease: 'power2.in' }, 0);
  }
  function rendrePanier() {
    var n = nbArticles();
    document.querySelectorAll('.panier-compte').forEach(function (e) { e.textContent = n; });
    var liste = document.querySelector('.tiroir__liste');
    if (!liste) return;
    var refs = Object.keys(panier);
    var sous = refs.reduce(function (s, r) { return s + parRef[r].prix * panier[r]; }, 0);
    var port = refs.length ? D.maison.livraison : 0;
    if (!refs.length) {
      liste.innerHTML = '<li class="tiroir__vide"><p>Votre panier est vide.</p><a class="bouton bouton--petit bouton--creux" href="catalogue.html">Parcourir le catalogue</a></li>';
    } else {
      liste.innerHTML = refs.map(function (r) {
        var l = parRef[r];
        return '<li class="tiroir__article"><img src="' + couv(l, 's') + '" alt=""><div><h3>' + esc(l.titre) + '</h3>' +
          '<div class="tiroir__qte"><button type="button" data-qte="-1" data-ref="' + r + '" aria-label="Retirer un exemplaire">−</button><span>' + panier[r] + '</span><button type="button" data-qte="1" data-ref="' + r + '" aria-label="Ajouter un exemplaire">+</button></div></div>' +
          '<span class="prix">' + prix(l.prix * panier[r]) + '</span></li>';
      }).join('');
    }
    var tot = document.querySelector('.tiroir__totaux');
    if (tot) tot.innerHTML = '<div><span>Sous-total</span><span class="prix">' + prix(sous) + '</span></div>' +
      '<div><span>Livraison</span><span class="prix">' + (refs.length ? prix(port) : '—') + '</span></div>' +
      '<div class="total"><span>Total TTC</span><span>' + prix(sous + port) + '</span></div>';
    var cmd = document.querySelector('[data-commander]');
    if (cmd) cmd.disabled = !refs.length;
  }
  function ouvrirTiroir() { document.body.classList.add('tiroir-ouvert'); var t = document.querySelector('.tiroir'); if (t) { t.setAttribute('aria-hidden', 'false'); t.inert = false; setTimeout(function () { var f = t.querySelector('button'); if (f) f.focus(); }, 300); } if (lenis) lenis.stop(); }
  function fermerTiroir() { document.body.classList.remove('tiroir-ouvert'); var t = document.querySelector('.tiroir'); if (t) { t.setAttribute('aria-hidden', 'true'); t.inert = true; } if (lenis) lenis.start(); }

  /* ---------- Défilement fluide ---------- */
  var lenis = null;
  function initDefilement() {
    if (calme || !window.Lenis) { if (window.ScrollTrigger) ScrollTrigger.refresh(); return; }
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var cible = document.querySelector(id); if (!cible) return;
        e.preventDefault(); lenis.scrollTo(cible, { offset: -10, duration: 1.4 });
      });
    });
  }

  /* ---------- En-tête ---------- */
  function initEntete() {
    var e = document.querySelector('.entete'); if (!e) return;
    var dernier = 0;
    function maj() {
      var y = window.scrollY || 0;
      e.classList.toggle('est-solide', y > 40);
      e.classList.toggle('est-cache', y > 400 && y > dernier && !document.body.classList.contains('tiroir-ouvert'));
      dernier = y;
    }
    window.addEventListener('scroll', maj, { passive: true }); maj();
    var mb = document.querySelector('.menu-bouton'), menu = document.querySelector('.menu-plein');
    if (mb && menu) {
      var fermer = menu.querySelector('.menu-plein__fermer');
      mb.addEventListener('click', function () {
        menu.hidden = false; mb.setAttribute('aria-expanded', 'true');
        if (hasGsap && !calme) gsap.fromTo(menu.querySelectorAll('nav a'), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' });
        if (fermer) fermer.focus();
      });
      function fermerMenu() { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); mb.focus(); }
      if (fermer) fermer.addEventListener('click', fermerMenu);
      menu.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', function () { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); }); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !menu.hidden) fermerMenu(); });
    }
    var cb = document.querySelector('.calme-bouton');
    if (cb) {
      cb.setAttribute('aria-pressed', calme ? 'true' : 'false');
      cb.addEventListener('click', function () { ecrire('ls-calme', calme ? '0' : '1'); ecrireS('ls-ouverture-vue', '1'); window.location.reload(); });
    }
    var esp = document.querySelector('.entete .marque__esperluette');
    var marque = document.querySelector('.entete .marque');
    if (esp && marque && hasGsap && !calme) {
      marque.addEventListener('mouseenter', function () { gsap.fromTo(esp, { rotate: 0 }, { rotate: 360, duration: 1.1, ease: 'sol' }); });
    }
  }

  /* ---------- Curseur-spore ---------- */
  function initCurseur() {
    if (tactile || calme || !hasGsap) return;
    var c = document.createElement('div'); c.className = 'curseur'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="curseur__anneau"><span class="curseur__texte">Ouvrir</span></span><span class="curseur__point"></span>';
    document.body.appendChild(c); html.classList.add('a-curseur');
    var point = c.querySelector('.curseur__point'), anneau = c.querySelector('.curseur__anneau'), texte = c.querySelector('.curseur__texte');
    var px = gsap.quickTo(point, 'x', { duration: 0.08 }), py = gsap.quickTo(point, 'y', { duration: 0.08 });
    var ax = gsap.quickTo(anneau, 'x', { duration: 0.45, ease: 'power3' }), ay = gsap.quickTo(anneau, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY); c.classList.remove('est-cache'); }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.add('est-cache'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-curseur], a, button, input, select, textarea, label');
      c.classList.remove('est-livre', 'est-lien');
      if (!t) return;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) { c.classList.add('est-cache'); return; }
      var k = t.getAttribute('data-curseur');
      if (k === 'livre' || k === 'glisser') { c.classList.add('est-livre'); texte.textContent = k === 'glisser' ? 'Tourner' : 'Ouvrir'; }
      else c.classList.add('est-lien');
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  function initMagnetiques(racine) {
    if (tactile || calme || !hasGsap) return;
    (racine || document).querySelectorAll('.magnetique').forEach(function (b) {
      var xTo = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.35)' }), yTo = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.35)' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.32); yTo((e.clientY - r.top - r.height / 2) * 0.42); });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Inclinaison 3D des livres au survol ---------- */
  function initInclinaison(racine) {
    if (tactile || calme || !hasGsap) return;
    (racine || document).querySelectorAll('[data-inclinable] .livre3d__corps').forEach(function (corps) {
      var zone = corps.closest('[data-inclinable]');
      var rx = gsap.quickTo(corps, 'rotationX', { duration: 0.8, ease: 'power3' }), ry = gsap.quickTo(corps, 'rotationY', { duration: 0.8, ease: 'power3' });
      zone.addEventListener('pointermove', function (e) { var r = zone.getBoundingClientRect(); var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5; ry(-24 + dx * 34); rx(4 - dy * 18); });
      zone.addEventListener('pointerleave', function () { ry(-24); rx(4); });
    });
  }

  /* ---------- Transition : la terre recouvre la page ---------- */
  var rideau, rideauPath, rideauClair;
  var PLAT_BAS = 'M0 100 Q50 100 100 100 L100 100 L0 100 Z';
  var BOMBE = 'M0 40 Q50 0 100 40 L100 100 L0 100 Z';
  var PLEIN = 'M0 -10 Q50 -10 100 -10 L100 100 L0 100 Z';
  var CREUX = 'M0 -10 Q50 -10 100 -10 L100 -10 L0 -10 Z';
  var BOMBE_HAUT = 'M0 -10 Q50 -10 100 -10 L100 60 Q50 100 0 60 Z';
  function initRideau() {
    rideau = document.createElement('div'); rideau.className = 'rideau'; rideau.setAttribute('aria-hidden', 'true');
    rideau.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path class="rideau__clair" d="' + PLAT_BAS + '"/><path class="rideau__sol" d="' + PLAT_BAS + '"/></svg>';
    document.body.appendChild(rideau);
    rideauClair = rideau.querySelector('.rideau__clair'); rideauPath = rideau.querySelector('.rideau__sol');
    if (!hasGsap || calme) return;
    if (lireS('ls-rideau') === '1') {
      ecrireS('ls-rideau', '0');
      rideau.style.visibility = 'visible';
      rideauPath.setAttribute('d', PLEIN); rideauClair.setAttribute('d', PLEIN);
      gsap.timeline({ onComplete: function () { rideau.style.visibility = 'hidden'; } })
        .to(rideauPath, { attr: { d: BOMBE_HAUT }, duration: 0.45, ease: 'power2.in' }, 0.05)
        .to(rideauPath, { attr: { d: CREUX }, duration: 0.45, ease: 'power2.out' })
        .to(rideauClair, { attr: { d: BOMBE_HAUT }, duration: 0.4, ease: 'power2.in' }, 0)
        .to(rideauClair, { attr: { d: CREUX }, duration: 0.4, ease: 'power2.out' }, 0.4);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      ecrireS('ls-rideau', '1');
      rideau.style.visibility = 'visible';
      gsap.timeline({ onComplete: function () { window.location.href = href; } })
        .to(rideauClair, { attr: { d: BOMBE }, duration: 0.35, ease: 'power2.in' }, 0)
        .to(rideauClair, { attr: { d: PLEIN }, duration: 0.35, ease: 'power2.out' })
        .to(rideauPath, { attr: { d: BOMBE }, duration: 0.38, ease: 'power2.in' }, 0.08)
        .to(rideauPath, { attr: { d: PLEIN }, duration: 0.38, ease: 'power2.out' });
    });
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) { rideau.style.visibility = 'hidden'; rideauPath.setAttribute('d', PLAT_BAS); rideauClair.setAttribute('d', PLAT_BAS); } });
  }

  /* ---------- Racines du pied de page qui poussent vers le curseur ---------- */
  function initPied() {
    var pied = document.querySelector('.pied'); if (!pied) return;
    var esp = pied.querySelector('.pied__marque em');
    var cv = pied.querySelector('canvas.pied__racines');
    if (!cv || !esp || calme || tactile) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, racines = [], actif = false, souris = null;
    function taille() { var r = pied.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    taille(); window.addEventListener('resize', taille);
    pied.addEventListener('pointermove', function (e) { var r = pied.getBoundingClientRect(); souris = { x: e.clientX - r.left, y: e.clientY - r.top }; if (!actif) { actif = true; requestAnimationFrame(boucle); } });
    pied.addEventListener('pointerleave', function () { souris = null; });
    function origine() { var r = esp.getBoundingClientRect(), p = pied.getBoundingClientRect(); return { x: r.left - p.left + r.width / 2, y: r.top - p.top + r.height * 0.55 }; }
    var dernierSpawn = 0;
    function boucle(t) {
      ctx.fillStyle = 'rgba(22,18,14,0.06)'; ctx.fillRect(0, 0, W, H);
      if (souris && t - dernierSpawn > 90 && racines.length < 40) {
        var o = origine(); dernierSpawn = t;
        racines.push({ x: o.x, y: o.y, a: Math.atan2(souris.y - o.y, souris.x - o.x) + (Math.random() - 0.5) * 0.8, vie: 70 + Math.random() * 60, l: 1.6 });
      }
      ctx.lineCap = 'round';
      for (var i = racines.length - 1; i >= 0; i--) {
        var r = racines[i];
        if (souris) { var cible = Math.atan2(souris.y - r.y, souris.x - r.x); r.a += Math.sin(cible - r.a) * 0.06; }
        r.a += (Math.random() - 0.5) * 0.45;
        var nx = r.x + Math.cos(r.a) * 3.2, ny = r.y + Math.sin(r.a) * 3.2;
        ctx.strokeStyle = 'rgba(227,169,92,' + (0.15 + r.vie / 400) + ')'; ctx.lineWidth = Math.max(0.4, r.l * r.vie / 130);
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(nx, ny); ctx.stroke();
        r.x = nx; r.y = ny; r.vie--;
        if (Math.random() < 0.02 && racines.length < 60) racines.push({ x: r.x, y: r.y, a: r.a + (Math.random() < 0.5 ? -0.7 : 0.7), vie: r.vie * 0.6, l: r.l * 0.7 });
        if (r.vie <= 0) racines.splice(i, 1);
      }
      if (souris || racines.length) requestAnimationFrame(boucle); else actif = false;
    }
  }

  /* ---------- Copier, formulaires simulés ---------- */
  function initCopier() {
    document.querySelectorAll('[data-copier]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copier');
        var ok = function () { b.textContent = 'Copié'; setTimeout(function () { b.textContent = 'Copier'; }, 1600); };
        try { navigator.clipboard.writeText(txt).then(ok, function () { selection(b); }); } catch (e) { selection(b); }
      });
    });
    function selection(b) { var cible = b.previousElementSibling; if (!cible) return; var r = document.createRange(); r.selectNodeContents(cible); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  }

  /* ---------- Panier : branchements ---------- */
  function initPanier() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-ajouter]');
      if (b) { e.preventDefault(); ajouter(b.getAttribute('data-ajouter'), +(b.getAttribute('data-qte') || 1), b); return; }
      var q = e.target.closest && e.target.closest('[data-qte][data-ref]');
      if (q) { var r = q.getAttribute('data-ref'); panier[r] = (panier[r] || 0) + (+q.getAttribute('data-qte')); if (panier[r] <= 0) delete panier[r]; sauverPanier(); return; }
      if (e.target.closest && e.target.closest('.panier-bouton')) { ouvrirTiroir(); return; }
      if (e.target.closest && (e.target.closest('.tiroir__fermer') || e.target.classList.contains('tiroir-fond'))) fermerTiroir();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('tiroir-ouvert')) fermerTiroir(); });
    var cmd = document.querySelector('[data-commander]');
    if (cmd) cmd.addEventListener('click', function () { var p = document.querySelector('.paiement'); if (p) p.classList.add('est-visible'); });
    rendrePanier();
  }

  /* ---------- Révélations génériques ---------- */
  function initRevelations() {
    if (!hasGsap || calme || !window.ScrollTrigger) return;
    gsap.utils.toArray('[data-reveler]').forEach(function (el) {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'sol', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    gsap.utils.toArray('[data-parallaxe]').forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallaxe')) || 12;
      gsap.fromTo(el, { yPercent: -f }, { yPercent: f, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.utils.toArray('[data-titre-split]').forEach(function (el) {
      if (!window.SplitText) return;
      var s = new SplitText(el, { type: 'words', wordsClass: 'mot' });
      gsap.from(s.words, { yPercent: 110, opacity: 0, rotate: 4, duration: 1.1, stagger: 0.05, ease: 'sol', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  }

  window.LS = {
    D: D, livre: function (r) { return parRef[r]; }, livres: D.livres, territoire: territoire, territoires: D.territoires,
    esc: esc, prix: prix, auteurs: auteurs, couv: couv, srcset: srcset, lienLivre: lienLivre, couleurTerr: couleurTerr,
    livre3d: livre3d, carteHTML: carteHTML, badgeLabel: badgeLabel, toast: toast, ajouter: ajouter,
    aujourdHui: aujourdHui, dateLocale: dateLocale, dateTexte: dateTexte,
    calme: calme, tactile: tactile, gsap: hasGsap, lire: lire, ecrire: ecrire, lireS: lireS, ecrireS: ecrireS,
    initMagnetiques: initMagnetiques, initInclinaison: initInclinaison,
    lenis: function () { return lenis; }
  };

  function demarrer() {
    initEntete(); initPanier(); initRideau(); initCopier(); initDefilement(); initCurseur(); initMagnetiques(); initInclinaison(); initPied();
    document.dispatchEvent(new CustomEvent('ls:pret'));
    initRevelations();
    if (window.ScrollTrigger) { window.addEventListener('load', function () { ScrollTrigger.refresh(); }); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
