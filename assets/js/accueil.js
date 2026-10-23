/* Accueil : ouverture, héros, ligne éditoriale, nouveautés, à paraître, territoires, réseau, vigne, auteurs, manuscrits, lettre */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.addEventListener('ls:pret', function () {
    var L = window.LS, g = window.gsap, anim = L.gsap && !L.calme && window.ScrollTrigger;
    var bureau = window.matchMedia('(min-width: 861px)').matches;
    var livres = L.livres;

    /* ---------- Héros : trois nouveautés en 3D ---------- */
    var hl = $('[data-heros-livres]');
    var choix = (L.D.accueil && L.D.accueil.heros || []).map(L.livre).filter(Boolean);
    if (hl) {
      hl.insertAdjacentHTML('afterbegin', choix.map(function (l, i) {
        return '<a href="' + L.lienLivre(l) + '" data-curseur="livre" data-inclinable aria-label="' + L.esc(l.titre) + '">' + L.livre3d(l, { eager: true, taille: 'm' }) + '</a>';
      }).join(''));
      L.initInclinaison(hl);
    }

    /* ---------- Ouverture orchestrée (moins de 3 secondes) ---------- */
    var ouv = $('.ouverture');
    function entreeHeros(delai) {
      if (!anim) return;
      var titre = $('.heros__titre');
      var mots = decouperMots(titre);
      var tl = g.timeline({ delay: delai || 0 });
      tl.from(mots, { yPercent: 110, opacity: 0, rotate: 3, duration: 1.2, stagger: 0.045, ease: 'sol' }, 0)
        .from('.heros .surtitre, .heros__sous, .heros__actions', { y: 26, opacity: 0, duration: 1, stagger: 0.1, ease: 'sol' }, 0.25)
        .from('.heros__livres .livre3d', { yPercent: 70, opacity: 0, rotateX: -35, duration: 1.4, stagger: 0.12, ease: 'expo.out' }, 0.1)
        .from('.heros__legende', { opacity: 0, duration: 0.8 }, 0.9);
    }
    if (ouv && anim) {
      ouv.style.animation = 'none';
      L.ecrireS('ls-ouverture-vue', '1');
      var cv = ouv.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
      var fils = [], cx = innerWidth / 2, cy = innerHeight / 2;
      for (var i = 0; i < 46; i++) fils.push({ x: cx, y: cy, a: i / 46 * Math.PI * 2 + Math.random() * 0.3, v: 2 + Math.random() * 2.6, l: 1.4 });
      var fin = false;
      (function pousse() {
        if (fin) return;
        ctx.lineCap = 'round';
        fils.forEach(function (f) {
          f.a += (Math.random() - 0.5) * 0.4;
          var nx = f.x + Math.cos(f.a) * f.v, ny = f.y + Math.sin(f.a) * f.v;
          ctx.strokeStyle = 'rgba(227,169,92,0.55)'; ctx.lineWidth = f.l;
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(nx, ny); ctx.stroke();
          f.x = nx; f.y = ny; f.l = Math.max(0.3, f.l * 0.995);
          if (Math.random() < 0.012 && fils.length < 160) fils.push({ x: f.x, y: f.y, a: f.a + (Math.random() < 0.5 ? -0.8 : 0.8), v: f.v * 0.8, l: f.l * 0.7 });
        });
        requestAnimationFrame(pousse);
      })();
      var lettres = decouperLettres(ouv.querySelector('.ouverture__mot'));
      var tl = g.timeline({ onComplete: function () { fin = true; ouv.remove(); } });
      tl.from(lettres, { yPercent: 60, opacity: 0, filter: 'blur(8px)', duration: 0.7, stagger: 0.025, ease: 'power3.out' }, 0.12)
        .from('.ouverture__compteur', { opacity: 0, duration: 0.5 }, 0.3)
        .to('.ouverture__mot', { scale: 0.92, opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.25)
        .to(ouv, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'expo.inOut' }, 1.45);
      entreeHeros(1.6);
      var passerTout = function (e) { if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { tl.progress(1); document.removeEventListener('keydown', passerTout); } };
      document.addEventListener('keydown', passerTout);
      var passer = ouv.querySelector('.ouverture__passer');
      if (passer) passer.addEventListener('click', function () { tl.progress(1); });
    } else {
      if (ouv) ouv.remove();
      entreeHeros(0.1);
    }

    if (anim) {
      g.utils.toArray('.heros__livres a').forEach(function (a, i) {
        g.to(a, { yPercent: -18 - i * 10, ease: 'none', scrollTrigger: { trigger: '.heros', start: 'top top', end: 'bottom top', scrub: true } });
      });
      g.to('.heros__grille > div:first-child', { yPercent: 12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.heros', start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* ---------- Ligne éditoriale : les mots s'allument, les racines soulignent ---------- */
    var phrase = $('[data-ligne]');
    if (phrase) {
      var motsPhrase = decouperMots(phrase);
      $$('.cle', phrase).forEach(function (c, i) {
        c.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1 6 C 18 2, 30 9, 48 5 S 80 2, 99 6"/></svg>');
      });
      if (anim) {
        g.to(motsPhrase, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: phrase, start: 'top 78%', end: 'bottom 45%', scrub: true } });
        $$('.cle path', phrase).forEach(function (p) {
          var len = p.getTotalLength ? p.getTotalLength() : 100;
          g.set(p, { strokeDasharray: len, strokeDashoffset: len });
          g.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: p.closest('.cle'), start: 'top 70%', end: 'top 50%', scrub: true } });
        });
      } else motsPhrase.forEach(function (m) { m.style.opacity = 1; });
    }
    var nbCat = $('[data-nb="catalogue"]'), nbPar = $('[data-nb="paraitre"]');
    if (nbCat) nbCat.setAttribute('data-compteur', livres.filter(function (l) { return l.surAccueil; }).length);
    if (nbPar) nbPar.setAttribute('data-compteur', livres.filter(function (l) { return l.aParaitre; }).length);
    $$('[data-compteur]').forEach(function (el) {
      var cible = +el.getAttribute('data-compteur');
      el.textContent = cible;
      if (anim) { var o = { v: 0 }; g.to(o, { v: cible, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: function () { el.textContent = Math.round(o.v); } }); }
    });

    /* ---------- Nouveautés : galerie horizontale épinglée ---------- */
    var piste = $('[data-piste]');
    var nouv = livres.filter(function (l) { return l.nouveau; });
    if (piste) {
      piste.innerHTML = nouv.map(function (l) {
        return '<article class="carte-nouv"><a class="carte-nouv__livre" href="' + L.lienLivre(l) + '" data-curseur="livre" data-inclinable tabindex="-1" aria-hidden="true">' + L.livre3d(l, { eager: nouv.indexOf(l) < 4 }) + '</a>' +
          '<div class="carte-nouv__info">' + L.badgeLabel(l) + '<a class="carte-nouv__titre" href="' + L.lienLivre(l) + '">' + L.esc(l.titre) + '</a>' +
          (L.auteurs(l) ? '<span class="carte-nouv__auteur">' + L.esc(L.auteurs(l)) + '</span>' : '') +
          '<div class="carte-nouv__bas"><span class="prix">' + L.prix(l.prix) + '</span><button class="ajouter" type="button" data-ajouter="' + l.ref + '" aria-label="Ajouter ' + L.esc(l.titre) + ' au panier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Ajouter</button></div></div></article>';
      }).join('');
      L.initInclinaison(piste);
      var cp = $('[data-compteur-piste]'), barre = $('[data-barre-piste]');
      var tot = String(nouv.length).padStart(2, '0');
      if (cp) cp.textContent = '01 / ' + tot;
      if (anim && bureau) {
        /* section collante (pas d'épinglage) : aucun décalage de mise en page pendant le défilement */
        var section = $('.nouveautes');
        var dist = function () { return Math.max(0, piste.scrollWidth - window.innerWidth); };
        var hauteur = function () { section.style.height = (dist() + window.innerHeight) + 'px'; };
        hauteur(); ScrollTrigger.addEventListener('refreshInit', hauteur);
        var livresPiste = $$('.carte-nouv__livre', piste);
        var penche = livresPiste.map(function (el) { return g.quickTo(el, 'skewX', { duration: 0.6, ease: 'power3' }); });
        var tween = g.to(piste, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: function (s) {
              if (barre) barre.style.transform = 'scaleX(' + s.progress + ')';
              if (cp) cp.textContent = String(Math.min(nouv.length, 1 + Math.floor(s.progress * nouv.length))).padStart(2, '0') + ' / ' + tot;
              var v = g.utils.clamp(-7, 7, s.getVelocity() / -260);
              penche.forEach(function (q) { q(v); });
            }
          }
        });
        ScrollTrigger.addEventListener('scrollEnd', function () { penche.forEach(function (q) { q(0); }); });
        $$('.carte-nouv', piste).forEach(function (c, i) {
          if (i < 3) return;
          g.from(c.querySelector('.livre3d'), { yPercent: 40, rotateZ: 6, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left 95%', end: 'left 60%', scrub: true } });
        });
        g.from($$('.carte-nouv .livre3d', piste).slice(0, 3), { yPercent: 60, opacity: 0, rotateX: -30, duration: 1.3, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.nouveautes', start: 'top 70%', once: true } });
      }
    }

    /* ---------- À paraître : frise, tampons, compte à rebours ---------- */
    var frise = $('[data-frise]');
    var auj = L.aujourdHui();
    var aParaitre = livres.filter(function (l) { return l.aParaitre && !l.nouveau; });
    aParaitre.sort(function (a, b) { if (!a.dateDispo) return 1; if (!b.dateDispo) return -1; return a.dateDispo < b.dateDispo ? -1 : 1; });
    var prochain = aParaitre.filter(function (l) { return l.dateDispo && L.dateLocale(l.dateDispo) > auj; })[0];
    if (frise) {
      frise.insertAdjacentHTML('beforeend', aParaitre.map(function (l) {
        var etat = 'bientot', tampon = '<span class="tampon tampon--bientot">Date à préciser</span>', dateTxt = 'Date à préciser';
        if (l.dateDispo) {
          var d = L.dateLocale(l.dateDispo);
          dateTxt = L.dateTexte(l.dateDispo, { day: 'numeric', month: 'short', year: 'numeric' });
          if (d < auj) { etat = 'passe'; tampon = '<span class="tampon tampon--paru">Paru</span>'; }
          else if (+d === +auj) { etat = 'jour'; tampon = '<span class="tampon tampon--jour">Paraît aujourd’hui</span>'; }
          else { tampon = '<span class="tampon tampon--bientot">Dans ' + jours(d, auj) + ' j</span>'; }
        }
        return '<li class="est-' + etat + (l === prochain ? ' est-prochain' : '') + '"><span class="frise__point"></span><span class="frise__date">' + dateTxt + '</span>' +
          '<a class="frise__livre" href="' + L.lienLivre(l) + '" data-curseur="livre"><img src="' + L.couv(l, 's') + '" alt="" loading="lazy"><span><span class="frise__titre">' + L.esc(l.titre) + '</span>' +
          '<span class="frise__meta">' + (L.auteurs(l) ? L.esc(L.auteurs(l)) + ' · ' : '') + L.prix(l.prix) + (l.aVerifier ? ' · <span class="a-completer">à vérifier</span>' : '') + '</span></span></a>' + tampon + '</li>';
      }).join(''));
      if (anim) {
        g.to('.frise__trait', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: frise, start: 'top 75%', end: 'bottom 60%', scrub: true } });
        $$('.frise li', frise).forEach(function (li) {
          g.from(li, { x: 30, opacity: 0, duration: 0.9, ease: 'sol', scrollTrigger: { trigger: li, start: 'top 88%', once: true } });
          var t = li.querySelector('.tampon--paru, .tampon--jour');
          if (t) g.from(t, { scale: 2.4, opacity: 0, rotate: -24, duration: 0.5, ease: 'back.out(2.5)', scrollTrigger: { trigger: li, start: 'top 80%', once: true } });
        });
      }
    }
    var dc = $('[data-decompte]');
    if (dc) {
      if (prochain) {
        var n = jours(L.dateLocale(prochain.dateDispo), auj);
        dc.innerHTML = '<span class="mono">Prochaine parution</span><span class="decompte__nombre" data-nb>' + n + '</span><span class="decompte__texte">jours avant <em>' + L.esc(prochain.titre) + '</em>, attendu le ' + L.dateTexte(prochain.dateDispo) + '.</span>';
        if (anim) { var o2 = { v: 0 }; var nb = dc.querySelector('[data-nb]'); g.to(o2, { v: n, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: dc, start: 'top 85%', once: true }, onUpdate: function () { nb.textContent = Math.round(o2.v); } }); }
      } else dc.innerHTML = '<span class="decompte__texte">Les prochaines dates seront annoncées ici.</span>';
    }

    /* ---------- Territoires : carottage ---------- */
    var zone = $('[data-strates]'), tube = $('[data-carotte]');
    if (zone) {
      zone.innerHTML = L.territoires.map(function (t) {
        var ls = livres.filter(function (l) { return l.thematiques && l.thematiques.indexOf(t.id) > -1; });
        var couvs = ls.filter(function (l) { return l.couv && !l.couv.packshot; }).slice(0, 3);
        return '<article class="strate" id="territoire-' + t.id + '" style="--c:' + t.hex + '">' +
          '<div class="photo photo--teinte" data-photo><img src="assets/img/photos/' + t.photo + '" alt="' + L.esc(t.alt) + '" loading="lazy"></div>' +
          '<div><span class="strate__couleur"><i></i>Strate ' + t.ordre + ' sur 4</span><h3 class="strate__nom">' + L.esc(t.nom) + '</h3>' +
          '<p class="strate__nombre">' + ls.length + ' titres au catalogue</p><p class="strate__texte">' + L.esc(t.texte) + '</p>' +
          '<div class="strate__couvs">' + couvs.map(function (l) { return '<a href="' + L.lienLivre(l) + '" data-curseur="livre" aria-label="' + L.esc(l.titre) + '"><img src="' + L.couv(l, 's') + '" alt="Couverture de ' + L.esc(l.titre) + '" loading="lazy"></a>'; }).join('') + '</div>' +
          '<a class="bouton bouton--creux bouton--petit strate__lien" href="catalogue.html?t=' + t.id + '">Les ' + ls.length + ' titres <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div></article>';
      }).join('');
      if (tube) {
        tube.innerHTML = L.territoires.map(function (t, i) { return '<span class="carotte__strate" style="top:' + (i * 25) + '%;background-color:' + t.hex + ';background-image:url(assets/img/photos/texture-terre.webp);opacity:.5"></span>'; }).join('') + '<span class="carotte__curseur"></span>';
      }
      if (anim) {
        var segs = tube ? $$('.carotte__strate', tube) : [];
        if (tube) g.to('.carotte__curseur', { top: '100%', ease: 'none', scrollTrigger: { trigger: zone, start: 'top 60%', end: 'bottom 60%', scrub: true } });
        $$('.strate', zone).forEach(function (s, i) {
          var ph = s.querySelector('.photo'), img = s.querySelector('.photo img');
          g.fromTo(ph, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: s, start: 'top 75%', once: true } });
          g.from(s.querySelectorAll('.strate__couleur, .strate__nom, .strate__nombre, .strate__texte, .strate__lien'), { y: 28, opacity: 0, duration: 1, stagger: 0.08, ease: 'sol', delay: 0.25, scrollTrigger: { trigger: s, start: 'top 70%', once: true } });
          g.fromTo(img, { scale: 1.25, yPercent: -6 }, { scale: 1.05, yPercent: 6, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
          g.from(s.querySelectorAll('.strate__couvs a'), { y: 60, opacity: 0, rotate: 6, stagger: 0.08, duration: 1, ease: 'sol', scrollTrigger: { trigger: s, start: 'top 60%', once: true } });
          if (segs[i]) ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onToggle: function (st) { g.to(segs[i], { opacity: st.isActive ? 1 : 0.5, duration: 0.4 }); } });
        });
      }
    }

    /* ---------- Réseau mycélien ---------- */
    var cadre = $('[data-reseau]');
    if (cadre && window.LSReseau) new window.LSReseau(cadre, livres);

    /* ---------- Vigne et vin : véraison ---------- */
    var vinLivres = livres.filter(function (l) { return l.thematiques && l.thematiques.indexOf('vin') > -1; });
    var ved = L.livre(L.D.accueil && L.D.accueil.vedetteVin);
    var vv = $('[data-vin-vedette]');
    if (vv && ved) {
      vv.innerHTML = '<a href="' + L.lienLivre(ved) + '" data-curseur="livre"><img src="' + L.couv(ved, 'm') + '" alt="Couverture de ' + L.esc(ved.titre) + '" loading="lazy"></a>' +
        '<div><span class="mono" style="color:var(--ocre-clair)">Ouvrage de référence</span><h3 style="font-size:var(--t-xl);margin-top:8px">' + L.esc(ved.titre) + '</h3>' +
        (L.auteurs(ved) ? '<p style="color:var(--os-2);margin-top:6px">' + L.esc(L.auteurs(ved)) + '</p>' : '') +
        (ved.poids ? '<p class="mono" style="color:var(--os-3);margin-top:10px">Poids du colis : ' + L.esc(ved.poids) + '</p>' : '') +
        '<div class="carte-nouv__bas" style="margin-top:16px"><span class="prix" style="font-size:var(--t-lg)">' + L.prix(ved.prix) + '</span><button class="ajouter" type="button" data-ajouter="' + ved.ref + '">Ajouter</button></div></div>';
    }
    var ve = $('[data-vin-etagere]');
    if (ve) ve.innerHTML = vinLivres.filter(function (l) { return l !== ved; }).slice(0, 10).map(function (l) { return '<a href="' + L.lienLivre(l) + '" data-curseur="livre" title="' + L.esc(l.titre) + '"><img src="' + L.couv(l, 's') + '" alt="Couverture de ' + L.esc(l.titre) + '" loading="lazy"></a>'; }).join('');
    var vinIntro = $('[data-vin-nb]'); if (vinIntro) vinIntro.textContent = vinLivres.length;
    if (anim) {
      var sc = $('[data-vin]');
      g.fromTo(sc, { '--teinte': '#55663f' }, { '--teinte': '#5e2436', ease: 'none', scrollTrigger: { trigger: sc, start: 'top 70%', end: 'bottom 40%', scrub: true } });
      g.fromTo('.vin__photo img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: sc, start: 'top bottom', end: 'bottom top', scrub: true } });
      $$('.vin__vrilles path').forEach(function (p, i) {
        var len = p.getTotalLength(); g.set(p, { strokeDasharray: len, strokeDashoffset: len });
        g.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: sc, start: 'top ' + (80 - i * 6) + '%', end: 'center 40%', scrub: true } });
      });
      g.from('.vin__etagere a', { y: 80, opacity: 0, stagger: 0.06, duration: 1.1, ease: 'sol', scrollTrigger: { trigger: '.vin__etagere', start: 'top 80%', once: true } });
    }

    /* ---------- Auteurs : la couverture suit le curseur ---------- */
    var la = $('[data-auteurs]');
    if (la) {
      var vus = {}, lignes = [];
      var ordre = livres.filter(function (l) { return l.nouveau; }).concat(livres.filter(function (l) { return !l.nouveau; }));
      ordre.forEach(function (l) { (l.auteurs || []).forEach(function (a) { if (/collectif/i.test(a)) return; if (!vus[a] && lignes.length < 14) { vus[a] = 1; lignes.push({ a: a, l: l }); } }); });
      la.innerHTML = lignes.map(function (x) {
        return '<li><a href="' + L.lienLivre(x.l) + '" data-couv="' + L.couv(x.l, 's') + '"><span class="auteurs__nom">' + L.esc(x.a) + '</span><span class="auteurs__livre">' + L.esc(x.l.titre) + '</span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>';
      }).join('');
      var nbAut = $('[data-nb-auteurs]');
      if (nbAut) { var tous = {}; livres.forEach(function (l) { (l.auteurs || []).forEach(function (a) { if (!/collectif/i.test(a)) tous[a.replace(/ \((coord|dir)\.\)$/, '')] = 1; }); }); nbAut.textContent = Object.keys(tous).length; }
      var fl = $('.auteurs__flottant');
      if (fl && anim && !L.tactile) {
        var fimg = fl.querySelector('img');
        var fx = g.quickTo(fl, 'x', { duration: 0.6, ease: 'power3' }), fy = g.quickTo(fl, 'y', { duration: 0.6, ease: 'power3' });
        la.addEventListener('pointermove', function (e) { fx(e.clientX + 120); fy(e.clientY); });
        $$('a', la).forEach(function (a) {
          a.addEventListener('pointerenter', function (e) {
            if (e.pointerType === 'touch') return;
            fimg.src = a.getAttribute('data-couv');
            if (g.getProperty(fl, 'opacity') < 0.05) g.set(fl, { x: e.clientX + 120, y: e.clientY });
            fx(e.clientX + 120); fy(e.clientY);
            g.to(fl, { opacity: 1, scale: 1, rotate: -4, duration: 0.4, ease: 'back.out(1.6)' });
          });
        });
        la.addEventListener('pointerleave', function () { g.to(fl, { opacity: 0, scale: 0.8, duration: 0.3 }); });
        g.from($$('li', la), { y: 30, opacity: 0, stagger: 0.05, duration: 0.9, ease: 'sol', scrollTrigger: { trigger: la, start: 'top 80%', once: true } });
      }
    }

    /* ---------- Manuscrits : l'enveloppe ---------- */
    var env = $('[data-enveloppe]');
    if (env && anim) {
      var tlEnv = g.timeline({ scrollTrigger: { trigger: '.enveloppe-scene', start: 'top 75%', end: 'center 45%', scrub: 0.6 } });
      tlEnv.from(env.querySelectorAll('.enveloppe__feuille i'), { scaleX: 0, transformOrigin: 'left center', stagger: 0.05, duration: 0.25, ease: 'none' }, 0)
        .fromTo(env.querySelector('.enveloppe__feuille'), { yPercent: -95 }, { yPercent: 0, ease: 'power1.inOut' }, 0.15)
        .fromTo(env.querySelector('.enveloppe__rabat'), { rotateX: 180 }, { rotateX: 0, ease: 'power2.inOut' }, 0.7);
    }
    formulaire('[data-form-manuscrit]', function (f, ok) {
      ok('Envoi simulé : rien n’a été transmis. Pour soumettre un texte aujourd’hui, écrivez à libre.solidaire@gmail.com ou au 37 rue Clisson, 75013 Paris.');
      if (anim && env) g.timeline().to(env, { y: -30, rotate: -4, duration: 0.4, ease: 'power2.out' }).to(env, { y: '-140%', x: '60%', rotate: 12, opacity: 0, duration: 0.9, ease: 'power3.in' }).set(env, { y: 0, x: 0, rotate: 0 }).to(env, { opacity: 1, duration: 0.6 });
    });

    /* ---------- Lettre : l'enveloppe devient graine ---------- */
    formulaire('[data-form-lettre]', function (f, ok) {
      ok('Inscription simulée : aucune adresse n’a été enregistrée.');
      var gr = $('.lettre__graine');
      if (anim && gr) g.timeline().fromTo(gr, { opacity: 0, y: -80, scale: 0.4 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'bounce.out' }).to(gr, { y: 140, scale: 0.6, opacity: 0, duration: 1, ease: 'power2.in', delay: 0.4 });
    });

    /* ---------- Horizons : la ligne de sol se dessine ---------- */
    $$('.horizon').forEach(function (hz) {
      var p = hz.querySelector('path'); if (!p || !anim) return;
      var len = p.getTotalLength(); g.set(p, { strokeDasharray: len, strokeDashoffset: len });
      g.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: hz, start: 'top 95%', end: 'top 45%', scrub: true } });
      g.from(hz.querySelectorAll('circle'), { scale: 0, transformOrigin: 'center', stagger: 0.04, duration: 0.6, ease: 'back.out(3)', scrollTrigger: { trigger: hz, start: 'top 75%', once: true } });
    });

    /* ---------- Champ fichier ---------- */
    var fic = $('#m-fichier'), ficNom = $('[data-fichier-nom]');
    if (fic && ficNom) fic.addEventListener('change', function () { ficNom.textContent = fic.files && fic.files[0] ? fic.files[0].name : 'Aucun fichier choisi'; });

    /* ---------- Photos provisoires ---------- */
    if (L.D.photosProvisoires) $$('[data-photo]').forEach(function (p) { if (!p.querySelector('.provisoire-tag')) p.insertAdjacentHTML('beforeend', '<span class="provisoire-tag">Visuel provisoire</span>'); });

    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  function jours(d, auj) { return Math.round((d - auj) / 86400000); }

  function formulaire(sel, surSucces) {
    var f = document.querySelector(sel); if (!f) return;
    var retour = f.querySelector('.retour-simule');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var manque = Array.prototype.filter.call(f.querySelectorAll('[required]'), function (c) { return !c.value.trim() || (c.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.value)); });
      f.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
      if (manque.length) {
        manque.forEach(function (c) { c.setAttribute('aria-invalid', 'true'); });
        retour.textContent = 'Complétez ' + (manque.length > 1 ? 'les champs signalés' : 'le champ « ' + (f.querySelector('label[for="' + manque[0].id + '"]') || {}).textContent + ' »') + ' pour continuer.';
        retour.classList.add('est-visible'); manque[0].focus(); return;
      }
      surSucces(f, function (msg) { retour.textContent = msg; retour.classList.add('est-visible'); f.reset(); });
    });
  }

  function decouperMots(el) {
    var mots = [];
    (function parcourir(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'mot'; s.textContent = p; frag.appendChild(s); mots.push(s);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'svg') {
          if (c.classList.contains('cle')) { c.classList.add('mot'); mots.push(c); } else parcourir(c);
        }
      });
    })(el);
    return mots;
  }
  function decouperLettres(el) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (c) {
      var txt = c.textContent, frag = document.createDocumentFragment();
      var cible = c.nodeType === 1 ? c.cloneNode(false) : null;
      txt.split('').forEach(function (ch) {
        if (ch === ' ') { (cible || frag).appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span'); s.style.display = 'inline-block'; s.textContent = ch; (cible || frag).appendChild(s); out.push(s);
      });
      if (cible) frag.appendChild(cible);
      el.replaceChild(frag, c);
    });
    return out;
  }
})();
