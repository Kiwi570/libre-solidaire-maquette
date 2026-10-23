/* Fiche livre : le livre tourne au défilement et au glisser ; caractéristiques, extrait, livres du même sol */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.addEventListener('ls:pret', function () {
    var L = window.LS, g = window.gsap, anim = L.gsap && !L.calme;
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref') || (window.location.hash.match(/^#r(\w+)$/) || [])[1] || (L.D.accueil && L.D.accueil.ficheType);
    var l = L.livre(ref) || L.livre(L.D.accueil.ficheType);
    document.title = l.titre + ' · Libre & Solidaire';
    var t = l.thematiques && L.territoire(l.thematiques[0]);
    var AC = '<span class="a-completer">à compléter</span>';

    /* Fil d'Ariane */
    $('[data-fil]').innerHTML = '<a href="catalogue.html">Catalogue</a><span aria-hidden="true">/</span>' +
      (t ? '<a href="catalogue.html?t=' + t.id + '">' + L.esc(t.nom) + '</a><span aria-hidden="true">/</span>' : '') + '<span aria-current="page">Réf. ' + L.esc(l.ref) + '</span>';

    /* Livre 3D avec quatrième provisoire */
    // texte foncé sur un dos clair (93 dos sur 117 sont clairs), clair sur un dos foncé
    var dos = l.couv ? l.couv.dos : '#3a2f25';
    var hex = String(dos).replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    var lum = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
    var encre = lum > 150 ? ';color:#2b231b' : '';
    var quatrieme = '<span class="quatrieme" style="background:' + dos + encre + '"><strong>' + L.esc(l.titre) + '</strong>' +
      '<span>' + (l.resume ? L.esc(l.resume) : 'Texte de quatrième à fournir.') + '</span><small>Quatrième provisoire · ' + L.prix(l.prix) + '</small></span>';
    var scene = $('[data-scene]');
    scene.insertAdjacentHTML('afterbegin', L.livre3d(l, { eager: true, quatrieme: quatrieme, ep: l.pages ? null : 22 }));
    var livreEl = scene.querySelector('.livre3d'), corps = scene.querySelector('.livre3d__corps');
    livreEl.setAttribute('data-curseur', 'glisser');
    var angle = { y: -28, x: 6 };
    function appliquer() { corps.style.transform = 'rotateY(' + angle.y + 'deg) rotateX(' + angle.x + 'deg)'; }
    appliquer();
    if (!(l.couv && l.couv.packshot)) {
      var tirage = null;
      livreEl.addEventListener('pointerdown', function (e) { tirage = { x: e.clientX, y0: angle.y }; livreEl.setPointerCapture(e.pointerId); });
      livreEl.addEventListener('pointermove', function (e) { if (!tirage) return; angle.y = tirage.y0 + (e.clientX - tirage.x) * 0.6; appliquer(); });
      livreEl.addEventListener('pointerup', function () { tirage = null; });
      livreEl.addEventListener('pointercancel', function () { tirage = null; });
      livreEl.setAttribute('tabindex', '0'); livreEl.setAttribute('role', 'img'); livreEl.setAttribute('aria-label', 'Couverture de ' + l.titre + ', utilisez les flèches pour tourner le livre');
      livreEl.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { angle.y -= 20; appliquer(); } if (e.key === 'ArrowRight') { angle.y += 20; appliquer(); } });
      if (anim && window.ScrollTrigger) {
        g.from(livreEl, { yPercent: 30, opacity: 0, rotateX: -30, duration: 1.4, ease: 'expo.out', delay: 0.2 });
        ScrollTrigger.create({ trigger: '.fiche__grille', start: 'top top', end: 'bottom bottom', scrub: true,
          onUpdate: function (s) { if (tirage) return; angle.y = -28 - s.progress * 172; angle.x = 6 - Math.sin(s.progress * Math.PI) * 6; appliquer(); } });
      }
    }

    /* Informations */
    $('[data-label]').innerHTML = L.badgeLabel(l);
    var titreEl = $('[data-titre]');
    titreEl.textContent = l.titre;
    if (l.titre.length > 70) titreEl.setAttribute('data-long', '2'); else if (l.titre.length > 32) titreEl.setAttribute('data-long', '1');
    $('[data-auteur]').innerHTML = L.auteurs(l) ? L.esc(L.auteurs(l)) : 'Auteur ' + AC;
    var dispo = $('[data-dispo]');
    var aujourd = L.aujourdHui();
    if (l.aParaitre && l.dateDispo && L.dateLocale(l.dateDispo) < aujourd) { dispo.innerHTML = '<i></i>Paru le ' + L.dateTexte(l.dateDispo) + ' · disponibilité à confirmer'; }
    else if (l.aParaitre && l.dateDispo && +L.dateLocale(l.dateDispo) === +aujourd) { dispo.innerHTML = '<i></i>Paraît aujourd’hui'; }
    else if (l.aParaitre && l.nouveau) { dispo.classList.add('est-paraitre'); dispo.innerHTML = '<i></i>Nouveauté · disponibilité à confirmer'; }
    else if (l.aParaitre) { dispo.classList.add('est-paraitre'); dispo.innerHTML = '<i></i>' + (l.dateDispo ? 'À paraître le ' + L.dateTexte(l.dateDispo) : 'À paraître, date à préciser'); }
    else dispo.innerHTML = '<i></i>' + (l.stock || 'Disponibilité ' + AC) + (l.expedition ? ' · ' + L.esc(l.expedition) : '');
    $('[data-prix]').innerHTML = L.prix(l.prix);
    var qte = 1, out = $('[data-qte-out]'), btn = $('[data-ajouter-fiche]');
    btn.setAttribute('data-ajouter', l.ref);
    $$('[data-qte-pas]').forEach(function (b) { b.addEventListener('click', function () { qte = Math.max(1, Math.min(20, qte + (+b.getAttribute('data-qte-pas')))); out.textContent = qte; btn.setAttribute('data-qte', qte); }); });
    if (l.note && l.nbAvis) $('[data-avis]').innerHTML = '<span class="notes-etoiles">' + '★★★★★'.slice(0, Math.round(l.note)) + '</span> <span class="mono" style="color:var(--os-3)">' + String(l.note).replace('.', ',') + ' sur 5 · ' + l.nbAvis + ' avis client' + (l.nbAvis > 1 ? 's' : '') + ' sur le site actuel</span>';

    $('[data-resume]').innerHTML = l.resume
      ? '<p>' + L.esc(l.resume) + '</p><p class="mono" style="color:var(--os-3);font-size:11px">Résumé reformulé d’après la fiche actuelle, à remplacer par le texte de quatrième de couverture.</p>'
      : '<p>Présentation du livre ' + AC + '</p>';
    var bio = $('[data-bio]');
    if (l.bio) bio.innerHTML = '<h2>' + (l.auteurs && l.auteurs.length ? L.esc(l.auteurs.join(', ')) : 'L’auteur') + '</h2><div class="fiche__texte"><p>' + L.esc(l.bio) + '</p></div>';
    else bio.innerHTML = '<h2>L’auteur</h2><div class="fiche__texte"><p>Biographie ' + AC + '</p></div>';

    function val(v) { return v ? L.esc(v) : AC; }
    var car = [
      ['Référence', L.esc(l.ref)], ['Territoire', t ? L.esc(l.thematiques.map(function (id) { var x = L.territoire(id); return x ? x.nom : id; }).join(', ')) : AC],
      ['Label', L.esc(l.label || 'Libre & Solidaire')], ['ISBN', val(l.isbn)], ['Nombre de pages', val(l.pages)], ['Format', val(l.format)],
      ['Parution', l.dateParution ? L.esc(l.dateParution) : (l.dateDispo ? L.dateTexte(l.dateDispo) : AC)], ['Collection', val(l.collection)], ['Poids du colis', val(l.poids)]
    ];
    $('[data-carac]').innerHTML = car.map(function (c) { return '<dt>' + c[0] + '</dt><dd>' + c[1] + '</dd>'; }).join('');

    /* Extrait : pages qui tournent */
    var ex = $('[data-extrait]');
    function interieur(n, debut) {
      var lignes = ''; for (var i = 0; i < 11; i++) lignes += '<i style="width:' + (i === 10 ? 45 : 82 + ((i * 37 + n * 11) % 18)) + '%"></i>';
      return (debut ? '<strong style="font-weight:400;font-size:1.3em">' + L.esc(l.titre) + '</strong>' : '<span class="mono" style="font-size:.8em;color:rgba(43,35,27,.55)">Extrait à fournir</span>') +
        '<div class="extrait__lignes">' + lignes + '</div><span class="extrait__num">' + n + '</span>';
    }
    ex.innerHTML = '<div class="extrait__page">' + interieur(1, true) + '</div><div class="extrait__page">' + interieur(4) + '</div>' +
      '<div class="extrait__tourne"><div class="extrait__page">' + interieur(2) + '</div><div class="extrait__page extrait__verso">' + interieur(3) + '</div></div>';
    $('[data-tourner]').addEventListener('click', function () { ex.classList.toggle('est-tourne'); this.textContent = ex.classList.contains('est-tourne') ? 'Revenir' : 'Tourner la page'; });

    /* Du même sol */
    var memes = L.livres.filter(function (x) { return x !== l && x.thematiques && l.thematiques && l.thematiques.length && x.thematiques.indexOf(l.thematiques[0]) > -1; });
    var titreMeme = t ? 'Du même sol : <em>' + L.esc(t.nom) + '</em>' : '';
    if (!memes.length && l.auteurs) { memes = L.livres.filter(function (x) { return x !== l && x.auteurs && x.auteurs.some(function (a) { return l.auteurs.indexOf(a) > -1; }); }); if (memes.length) titreMeme = 'Du même <em>auteur</em>'; }
    if (!memes.length) { memes = L.livres.filter(function (x) { return x !== l && x.nouveau; }); titreMeme = 'Les autres <em>nouveautés</em>'; }
    memes = memes.slice(0, 10);
    $('[data-meme-sol]').innerHTML = memes.map(L.carteHTML).join('');
    var tm = $('[data-meme-titre]'); if (tm && titreMeme) tm.innerHTML = titreMeme;

    if (anim) {
      g.from('.fiche__infos > *', { y: 30, opacity: 0, duration: 1, stagger: 0.07, ease: 'sol', delay: 0.25 });
      g.from('.meme-sol .carte', { y: 40, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'sol', scrollTrigger: { trigger: '.meme-sol', start: 'top 80%', once: true } });
    }
    /* Lien de partage */
    var part = $('[data-partage]');
    if (part) part.addEventListener('click', function () {
      var url = window.location.href, fait = function () { part.textContent = 'Lien copié'; setTimeout(function () { part.textContent = 'Copier le lien de la fiche'; }, 1800); };
      try { navigator.clipboard.writeText(url).then(fait, function () { L.toast('Copiez l’adresse dans la barre du navigateur'); }); } catch (e) { L.toast('Copiez l’adresse dans la barre du navigateur'); }
    });

    /* Données structurées pour les moteurs de recherche */
    var ld = { '@context': 'https://schema.org', '@type': 'Book', name: l.titre, inLanguage: 'fr', publisher: { '@type': 'Organization', name: l.label || 'Libre & Solidaire' },
      image: new URL(L.couv(l, 'm'), window.location.href).href, offers: { '@type': 'Offer', price: l.prix.toFixed(2), priceCurrency: 'EUR', availability: l.aParaitre ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock' } };
    if (l.auteurs) ld.author = l.auteurs.filter(function (a) { return !/collectif/i.test(a); }).map(function (a) { return { '@type': 'Person', name: a.replace(/\s*\(.*\)$/, '') }; });
    if (l.resume) ld.description = l.resume;
    if (l.isbn) ld.isbn = l.isbn;
    var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', l.titre + (L.auteurs(l) ? ', ' + L.auteurs(l) : '') + ' · Éditions Libre & Solidaire');

    if (L.D.photosProvisoires) $$('[data-photo]').forEach(function (p) { p.insertAdjacentHTML('beforeend', '<span class="provisoire-tag">Visuel provisoire</span>'); });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
