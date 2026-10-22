/* Catalogue : recherche, territoires, disponibilité, prix, tri ; vue grille ou réseau */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.addEventListener('ls:pret', function () {
    var L = window.LS, g = window.gsap, anim = L.gsap && !L.calme;
    var livres = L.livres.slice();
    var params = new URLSearchParams(window.location.search);
    var hashT = (window.location.hash.match(/^#t-(\w+)$/) || [])[1];
    var prixMaxCat = Math.ceil(Math.max.apply(null, livres.map(function (l) { return l.prix; })));
    var etat = {
      q: params.get('q') || '', terr: params.get('t') || hashT || 'tous', dispo: params.get('dispo') || 'tous',
      prixMax: prixMaxCat, tri: L.lire('ls-tri') || 'titre', vue: L.lire('ls-vue') || 'grille'
    };
    if (etat.terr !== 'tous' && !L.territoire(etat.terr)) etat.terr = 'tous';

    /* Titre qui germe lettre par lettre */
    var titre = $('.cat-heros__titre');
    if (titre && anim) {
      var txt = titre.textContent; titre.textContent = '';
      txt.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'lettre-g'; s.textContent = c === ' ' ? ' ' : c; titre.appendChild(s); });
      titre.setAttribute('aria-label', txt);
      g.from($$('.lettre-g', titre), { yPercent: 100, scaleY: 0.2, opacity: 0, duration: 1.1, stagger: 0.04, ease: 'expo.out', delay: 0.15 });
      g.from('.cat-heros__sous, .cat-heros .surtitre', { y: 20, opacity: 0, duration: 1, stagger: 0.1, delay: 0.4, ease: 'sol' });
      g.fromTo('.cat-heros__fond img', { scale: 1.15 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
    }
    var nbTot = $('[data-nb-total]'); if (nbTot) nbTot.textContent = livres.length;

    /* Puces des territoires */
    var puces = $('[data-puces]');
    function compte(id) { return id === 'tous' ? livres.length : livres.filter(function (l) { return l.thematiques && l.thematiques.indexOf(id) > -1; }).length; }
    puces.innerHTML = '<button class="puce" type="button" data-terr="tous">Tous <b>' + livres.length + '</b></button>' +
      L.territoires.map(function (t) { return '<button class="puce" type="button" data-terr="' + t.id + '" style="--c:' + t.hex + '"><i></i>' + L.esc(t.court) + ' <b>' + compte(t.id) + '</b></button>'; }).join('');

    /* Grille : toutes les cartes, filtrées ensuite */
    var grille = $('[data-grille]');
    grille.innerHTML = livres.map(L.carteHTML).join('');
    var cartes = {}; $$('.carte', grille).forEach(function (c) { cartes[c.getAttribute('data-ref')] = c; });

    var champQ = $('#recherche'), selDispo = $('#dispo'), selTri = $('#tri'), rngPrix = $('#prix-max'), outPrix = $('[data-prix-max]');
    rngPrix.max = prixMaxCat; rngPrix.value = prixMaxCat; outPrix.textContent = prixMaxCat + ' €';
    selDispo.value = etat.dispo; selTri.value = etat.tri; champQ.value = etat.q;

    var reseau = null;
    function normal(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function filtrer() {
      var q = normal(etat.q.trim());
      var res = livres.filter(function (l) {
        if (etat.terr !== 'tous' && !(l.thematiques && l.thematiques.indexOf(etat.terr) > -1)) return false;
        if (etat.dispo === 'stock' && (l.aParaitre || !l.stock)) return false;
        if (etat.dispo === 'paraitre' && !l.aParaitre) return false;
        if (etat.dispo === 'nouveautes' && !l.nouveau) return false;
        if (l.prix > etat.prixMax) return false;
        if (q && normal(l.titre + ' ' + (l.auteurs || []).join(' ') + ' ' + (l.resume || '')).indexOf(q) === -1) return false;
        return true;
      });
      var tri = {
        titre: function (a, b) { return a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base', ignorePunctuation: true }); },
        prixc: function (a, b) { return a.prix - b.prix; },
        prixd: function (a, b) { return b.prix - a.prix; },
        auteur: function (a, b) { var x = nom(a), y = nom(b); if (!x) return 1; if (!y) return -1; return x.localeCompare(y, 'fr', { sensitivity: 'base' }) || a.titre.localeCompare(b.titre, 'fr'); },
        nouv: function (a, b) { return (b.nouveau - a.nouveau) || (b.aParaitre - a.aParaitre) || a.titre.localeCompare(b.titre, 'fr'); }
      }[etat.tri];
      return res.sort(tri);
    }
    function nom(l) {
      var a = l.auteurs && l.auteurs[0]; if (!a || /collectif/i.test(a)) return '';
      var mots = a.replace(/\s*\(.*\)\s*$/, '').trim().split(/\s+/); return mots[mots.length - 1];
    }
    function memoriserURL() {
      try {
        var p = new URLSearchParams();
        if (etat.terr !== 'tous') p.set('t', etat.terr);
        if (etat.q.trim()) p.set('q', etat.q.trim());
        if (etat.dispo !== 'tous') p.set('dispo', etat.dispo);
        var qs = p.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
      } catch (e) {}
    }
    function rendre(premier) {
      memoriserURL();
      var res = filtrer();
      $$('.puce', puces).forEach(function (p) { p.setAttribute('aria-pressed', p.getAttribute('data-terr') === etat.terr ? 'true' : 'false'); });
      var info = $('[data-info]');
      var t = L.territoire(etat.terr);
      info.innerHTML = '<span>' + res.length + (res.length > 1 ? ' titres' : ' titre') + (t ? ' · ' + L.esc(t.nom) : '') + '</span><span>Prix TTC · livraison 5,00 €</span>';
      var vide = $('[data-vide]'); vide.hidden = res.length > 0;
      if (etat.vue === 'reseau') {
        grille.hidden = true; $('[data-cat-reseau]').hidden = false;
        if (!reseau) reseau = new window.LSReseau($('[data-cat-reseau] [data-reseau]'), res); else reseau.definir(res, false);
        return;
      }
      grille.hidden = false; $('[data-cat-reseau]').hidden = true;
      var etatFlip = (!premier && anim && window.Flip) ? Flip.getState($$('.carte', grille)) : null;
      var garder = {}; res.forEach(function (l) { garder[l.ref] = 1; });
      Object.keys(cartes).forEach(function (r) { cartes[r].hidden = !garder[r]; });
      res.forEach(function (l) { grille.appendChild(cartes[l.ref]); });
      if (etatFlip) {
        Flip.from(etatFlip, { duration: 0.7, ease: 'power3.inOut', stagger: 0.008, absolute: true, nested: true,
          onEnter: function (el) { return g.fromTo(el, { opacity: 0, scale: 0.85, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'sol' }); },
          onLeave: function (el) { return g.to(el, { opacity: 0, scale: 0.85, duration: 0.35 }); } });
      } else if (premier && anim) {
        g.from($$('.carte:not([hidden])', grille).slice(0, 12), { y: 50, opacity: 0, duration: 1, stagger: 0.05, ease: 'sol', delay: 0.5 });
        if (window.ScrollTrigger) ScrollTrigger.batch($$('.carte:not([hidden])', grille).slice(12), { start: 'top 96%', once: true, onEnter: function (els) { g.from(els, { y: 36, opacity: 0, duration: 0.9, stagger: 0.05, ease: 'sol' }); } });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    puces.addEventListener('click', function (e) { var b = e.target.closest('[data-terr]'); if (!b) return; etat.terr = b.getAttribute('data-terr'); rendre(); });
    var minuterie;
    champQ.addEventListener('input', function () { clearTimeout(minuterie); minuterie = setTimeout(function () { etat.q = champQ.value; rendre(); }, 180); });
    selDispo.addEventListener('change', function () { etat.dispo = selDispo.value; rendre(); });
    selTri.addEventListener('change', function () { etat.tri = selTri.value; L.ecrire('ls-tri', etat.tri); rendre(); });
    rngPrix.addEventListener('input', function () { etat.prixMax = +rngPrix.value; outPrix.textContent = rngPrix.value + ' €'; clearTimeout(minuterie); minuterie = setTimeout(rendre, 120); });
    $$('[data-vue]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-vue') === etat.vue ? 'true' : 'false');
      b.addEventListener('click', function () {
        etat.vue = b.getAttribute('data-vue'); L.ecrire('ls-vue', etat.vue);
        $$('[data-vue]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        rendre();
      });
    });
    $('[data-reinit]').addEventListener('click', function () {
      etat = { q: '', terr: 'tous', dispo: 'tous', prixMax: prixMaxCat, tri: etat.tri, vue: etat.vue };
      champQ.value = ''; selDispo.value = 'tous'; rngPrix.value = prixMaxCat; outPrix.textContent = prixMaxCat + ' €'; rendre();
    });
    rendre(true);
  });
})();
