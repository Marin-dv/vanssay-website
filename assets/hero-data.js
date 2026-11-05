/*
 * Real content only.
 * - Google: reviews of "le typographe", Rue Américaine 67, Ixelles (Brussels),
 *   read from its public Google Maps listing on 2026-11-05 (4.6, 64 reviews).
 *   Dates are relative to that day. Avatars are the reviewers' Google photos.
 * - Instagram: @letypographe_be, posts already used on vanssay.net/instagram
 *   ("Posts shown with permission of @letypographe_be").
 * - Stats: https://api.vanssay.net/stats/social-proof (Reviews plugin prod DB), live only.
 */
window.LAB = (function () {
  var place = { name: 'Le Typographe', city: 'Brussels', rating: 4.6, count: 64 };
  var profile = { handle: 'letypographe_be', posts: '1.1K', followers: '12.1K', avatar: 'assets/ig-demo/avatar.webp' };
  var reviews = [
    { n: 'Isabel Gatuslao', r: 5, d: 'a year ago', img: 'https://lh3.googleusercontent.com/a-/ALV-UjUqzOWJ-11FWmLPDN59yHo8DuzAVd9stCjdqvtW_BLHFTDy5xIb=s120-c',
      t: 'I just adore this store. As a type designer, I love all the type boxes integrated to the store’s interior and exterior. I got a lovely selection of Belgian paper products. I could waste an entire day here the next time I visit Belgium.' },
    { n: 'catalina cipri', r: 5, d: '3 years ago', img: 'https://lh3.googleusercontent.com/a/ACg8ocIQq6m9_cvIvy4V5OinT7E7oJAXxm9Cdl3G4rVje5bdpLcJAg=s120-c',
      t: 'Everything starting from outside the door is curated perfectly. Most beautiful stationery and objects. Beautiful for gifting or for anyone wanting best quality or heirloom writing accessories.' },
    { n: 'Laurenz Schraepen', r: 5, d: 'a year ago', img: 'https://lh3.googleusercontent.com/a-/ALV-UjWD2bihYL6r5Eqinz75nRnXUusMjlAO62lnPXOUb_WQqyUxQrqH=s120-c',
      t: 'This store is absolutely amazing. I wanted to buy so many things! If you love specialty literature items, I doubt you will find a better store. Just be aware, no cash only card payments accepted.' },
    { n: 'Gretel Patch', r: 5, d: '6 years ago', img: 'https://lh3.googleusercontent.com/a-/ALV-UjX3qucqZjyfvfxskOHOX2BYhpffdxU0NCZgX3QpxpYSPD-oxejzWA=s120-c',
      t: 'Wish I could buy everything in this gorgeous store! Minimalist design and high quality.' },
    { n: 'Marie Goffin', r: 5, d: '5 months ago', img: 'https://lh3.googleusercontent.com/a-/ALV-UjXJghMLRNYxLYWG_xt8w1kwAN-6206pDTLPLVXj-YaQX8FIgOeN=s120-c',
      t: 'Je recommande cette adresse à tous les amoureux de papier. Très belle boutique.' },
    { n: 'Lindie Botes', r: 4, d: '2 weeks ago', img: 'https://lh3.googleusercontent.com/a-/ALV-UjVu2GhIswtc7u9pRkPS8mbLZ5__hCzOsr4KJrvc0TcI8e40o-YQ=s120-c',
      t: 'Small, pretty and quite expensive. But worth a visit for stationery lovers.' },
    { n: 'Hai An Mai', r: 5, d: '2 months ago', img: 'https://lh3.googleusercontent.com/a/ACg8ocLGKpgL2_5rtRXpdVpEMdnMwoJ-LJkXd5i0_52mTG4vvqlxs3Q=s120-c',
      t: 'Great vibes. Cute stationaries' }
  ];
  var posts = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return 'assets/ig-demo/post-' + i + '.webp'; });

  var G = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  var IG = '<svg class="ig-logo" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="igg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#igg)"/><rect x="6" y="6" width="12" height="12" rx="3.8" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="16.6" cy="7.4" r="1" fill="#fff"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stars(n, fill) {
    var out = '<span class="stars" aria-label="' + n + ' out of 5 stars">';
    for (var i = 1; i <= 5; i++) {
      var w = Math.max(0, Math.min(1, (fill == null ? n : fill) - (i - 1))) * 100;
      out += '<i class="st"><span class="st-bg">' + STAR + '</span><span class="st-fg" style="width:' + w + '%">' + STAR + '</span></i>';
    }
    return out + '</span>';
  }
  function initials(n) { return n.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase(); }
  function avatar(r, cls) {
    return '<span class="av ' + (cls || '') + '" data-i="' + esc(initials(r.n)) + '"><img src="' + r.img + '" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()"></span>';
  }
  function reviewCard(r, opts) {
    opts = opts || {};
    return '<article class="rc' + (opts.cls ? ' ' + opts.cls : '') + '">' +
      '<header>' + avatar(r) + '<div class="rc-who"><b>' + esc(r.n) + '</b><span>' + esc(r.d) + '</span></div>' + G + '</header>' +
      stars(r.r) +
      '<p>' + esc(r.t) + '</p>' +
      '</article>';
  }
  function badge(cls) {
    return '<div class="gb ' + (cls || '') + '">' + G +
      '<div><div class="gb-top"><b>' + place.rating.toFixed(1) + '</b>' + stars(5, place.rating) + '</div>' +
      '<span>' + place.count + ' Google reviews</span></div></div>';
  }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  function fillStats() {
    var apply = function (p) {
      document.querySelectorAll('[data-stat]').forEach(function (el) {
        var v = p[el.getAttribute('data-stat')];
        if (typeof v === 'number') el.textContent = fmt(v);
      });
    };
    // No numbers is better than made-up numbers: the pill stays hidden until the API answers.
    fetch('https://api.vanssay.net/stats/social-proof').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (p) { if (p && typeof p.liveSites === 'number') { apply(p); document.querySelectorAll('[data-stat-wrap]').forEach(function (el) { el.hidden = false; }); } }).catch(function () {});
  }
  document.addEventListener('DOMContentLoaded', fillStats);

  return { place: place, profile: profile, reviews: reviews, posts: posts, G: G, IG: IG, stars: stars, avatar: avatar, reviewCard: reviewCard, badge: badge, esc: esc };
})();
