/*
 * The live widget renderer for vanssay.net/reviews.
 *
 * Everything on that page that looks like the product IS the product: this is a
 * vanilla port of the widget's React tree (plugin/src/lib/widgetCode.ts) — same
 * class names, same DOM order — painted by assets/reviews-widget.css, which is
 * the plugin's own WIDGET_CSS + PRESET_CSS copied verbatim. Nothing is mocked,
 * so the page cannot drift into showing a layout or a card style that the
 * plugin does not actually ship.
 *
 * Regenerating the two generated files after a plugin change:
 *   cd Multiplaform_Reviews_for_Framer/plugin
 *   # an entry that re-exports WIDGET_CSS, PRESET_CSS, CARD_PRESETS,
 *   # PRESET_FAMILIES, LAYOUTS, LAYOUT_GROUPS and DEMO_REVIEWS as JSON,
 *   # bundled with node_modules/.bin/esbuild --bundle --platform=node
 *   #   → assets/reviews-widget.css   (widgetCss + presetCss)
 *   #   → assets/reviews-data.js      (the metadata + sample reviews)
 *
 * This file is hand-written and is the only part that needs thought when the
 * widget gains a layout: add its branch to renderBody().
 */
(function () {
  "use strict";

  var D = window.VR_DATA;
  var API = "https://api.vanssay.net";

  /* ══ constants lifted from the widget ═════════════════════════════════ */
  var PASTELS = ["#fde68a", "#bfdbfe", "#c7d2fe", "#fbcfe8", "#bbf7d0", "#fed7aa"];
  var STAR_PATH = "M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01z";
  var TP_STAR_D =
    "M48,64.7L62.6,61l6.1,18.8L48,64.7z M81.6,40.4H55.9L48,16.2l-7.9,24.2H14.4l20.8,15l-7.9,24.2l20.8-15l12.8-9.2L81.6,40.4L81.6,40.4L81.6,40.4L81.6,40.4z";
  var TP_EMPTY = "#DCDCE6";
  var TP_COLORS = [TP_EMPTY, "#FF3722", "#FF8622", "#FFCE00", "#73CF11", "#00B67A"];
  var POINTER_PRESETS = ["tilt", "sheen", "pearl", "spotlight"];
  var REVEAL_PRESETS = ["reveal", "unfold", "unblur"];
  var BADGE_LAYOUTS = ["badge", "avatars", "trustpilot", "gbadge", "ratingcard"];
  var SELF_STYLED = ["split", "compact", "ribbon", "gallery", "orbit", "breakdown", "flow"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function reduced() {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function hashHue(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return PASTELS[h % PASTELS.length];
  }
  function initials(name) {
    var p = String(name).trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function shortName(name) {
    var p = String(name).trim().split(/\s+/).filter(Boolean);
    return p.length < 2 ? name || "Anonymous" : p[0] + " " + p[p.length - 1][0].toUpperCase() + ".";
  }
  function relativeDate(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    if (isNaN(ms)) return "";
    var d = Math.floor(ms / 86400000);
    if (d <= 0) return "today";
    if (d === 1) return "yesterday";
    if (d < 7) return d + " days ago";
    if (d < 30) { var w = Math.floor(d / 7); return w + (w > 1 ? " weeks ago" : " week ago"); }
    if (d < 365) { var m = Math.floor(d / 30); return m + (m > 1 ? " months ago" : " month ago"); }
    var y = Math.floor(d / 365);
    return y + (y > 1 ? " years ago" : " year ago");
  }
  function fmtCount(n) {
    try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); }
  }

  /* ══ marks & stars ════════════════════════════════════════════════════ */
  var GOOGLE_MARK =
    '<svg width="16" height="16" viewBox="0 0 48 48" aria-label="Google">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  var TP_MARK = '<svg width="16" height="16" viewBox="0 0 24 24" aria-label="Trustpilot"><path fill="#00B67A" d="' + STAR_PATH + '"/></svg>';
  function mark(p) { return p === "trustpilot" ? TP_MARK : GOOGLE_MARK; }

  function starSvg(size, color) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden style="display:block"><path fill="' + color + '" d="' + STAR_PATH + '"/></svg>';
  }
  function tpUnit(box, fill, fraction) {
    var f = fraction == null ? 1 : fraction, inner;
    if (f >= 1) inner = '<rect width="96" height="96" fill="' + fill + '"/>';
    else if (f <= 0) inner = '<rect width="96" height="96" fill="' + TP_EMPTY + '"/>';
    else inner = '<rect width="96" height="96" fill="' + TP_EMPTY + '"/><rect width="' + 96 * f + '" height="96" fill="' + fill + '"/>';
    return '<svg width="' + box + '" height="' + box + '" viewBox="0 0 96 96" aria-hidden style="display:block">' + inner + '<path fill="#fff" d="' + TP_STAR_D + '"/></svg>';
  }
  function tpStars(rating, size) {
    var box = size + 4;
    var n = Math.max(0, Math.min(5, Math.round(rating)));
    var fill = TP_COLORS[n] || "#00B67A";
    var out = '<span style="display:inline-flex;gap:' + Math.round(box * 0.083) + "px;height:" + box + 'px">';
    for (var i = 0; i < 5; i++) out += tpUnit(box, fill, i < n ? 1 : 0);
    return out + "</span>";
  }
  function stars(rating, size, platform, cfg) {
    size = size || 14;
    if (cfg && cfg.tpStars && platform === "trustpilot") return tpStars(rating, size);
    var pct = Math.max(0, Math.min(100, (rating / 5) * 100));
    var row = function (c) {
      var s = "";
      for (var i = 0; i < 5; i++) s += starSvg(size, c);
      return '<span style="display:flex">' + s + "</span>";
    };
    return (
      '<span class="vr-stars" style="height:' + size + 'px" aria-label="' + rating.toFixed(1) + ' out of 5">' +
      row("var(--vr-star-empty)") +
      '<span class="vr-stars-fill" style="width:' + pct + '%">' + row("var(--vr-star)") + "</span></span>"
    );
  }
  function avatar(r) {
    if (r.photo) {
      return '<span class="vr-avatar" data-fb="' + esc(initials(r.n)) + '" data-bg="' + hashHue(r.n) + '"><img src="' + esc(r.photo) + '" alt="" loading="lazy"></span>';
    }
    return '<span class="vr-avatar" style="background:' + hashHue(r.n) + '">' + esc(initials(r.n)) + "</span>";
  }

  /* ══ the card ═════════════════════════════════════════════════════════ */
  function sourceMark(r, cfg) {
    if (cfg.sourceDisplay === "combined" || cfg.sourceDisplay === "none") return "";
    if (cfg.sourceDisplay === "text")
      return '<span class="vr-source-text">· ' + (r.p === "trustpilot" ? "Trustpilot" : "Google") + " review</span>";
    return '<span class="vr-badge">' + mark(r.p) + "</span>";
  }
  function cardText(r, preset) {
    if (!r.t || !r.t.trim()) return "";
    if (preset === "unblur") {
      return '<p class="vr-body">' + r.t.split(/\s+/).map(function (w, i) {
        return '<span class="vr-w" style="--i:' + i + '">' + esc(w) + "</span> ";
      }).join("") + "</p>";
    }
    return '<p class="vr-body">' + esc(r.t) + "</p>";
  }
  function card(r, cfg) {
    return (
      '<article class="vr-card vrp-' + cfg.preset + '">' +
      '<div class="vr-id">' + avatar(r) + '<span class="vr-name">' + esc(shortName(r.n)) + "</span></div>" +
      '<span class="vr-src">' + sourceMark(r, cfg) + "</span>" +
      '<div class="vr-mid">' + cardText(r, cfg.preset) + "</div>" +
      '<div class="vr-bl">' + stars(r.r, 14, r.p, cfg) + "</div>" +
      '<div class="vr-br"><span class="vr-date">' + relativeDate(r.d) + "</span></div>" +
      (cfg.stamp ? '<span class="vr-stamp">Powered by <b>Vanssay</b></span>' : "") +
      "</article>"
    );
  }
  function cards(reviews, cfg) {
    return reviews.map(function (r) { return card(r, cfg); }).join("");
  }

  /* ══ header + badge layouts ═══════════════════════════════════════════ */
  function header(a, cfg) {
    var platforms = a.platforms && a.platforms.length ? a.platforms : ["google"];
    var src;
    if (cfg.sourceDisplay === "none") src = "";
    else if (cfg.sourceDisplay === "combined")
      src = '<span class="vr-combined-source">' + platforms.map(mark).join("") +
        platforms.map(function (p) { return p === "trustpilot" ? "Trustpilot" : "Google"; }).join(" & ") + " reviews</span>";
    else
      src = '<span class="vr-chips">' + platforms.map(function (p) {
        return '<span class="vr-chip">' + mark(p) + (p === "trustpilot" ? "Trustpilot" : "Google") + "</span>";
      }).join("") + "</span>";
    return (
      '<div class="vr-header"><span class="vr-rating">' + a.rating.toFixed(1) + "</span>" +
      stars(a.rating, 20, null, cfg) +
      '<span class="vr-count">Based on ' + fmtCount(a.count) + " reviews</span>" + src + "</div>"
    );
  }
  function tpTier(r) {
    if (r >= 4.5) return { word: "Excellent", color: "#00B67A" };
    if (r >= 4.0) return { word: "Great", color: "#73CF11" };
    if (r >= 3.0) return { word: "Average", color: "#FFCE00" };
    if (r >= 2.0) return { word: "Poor", color: "#FF8622" };
    return { word: "Bad", color: "#FF3722" };
  }
  function trustpilotBadge(a) {
    var t = tpTier(a.rating), box = 34, full = Math.floor(a.rating), frac = a.rating - full;
    var sq = '<span style="display:flex;gap:3px">';
    for (var i = 0; i < 5; i++) sq += tpUnit(box, t.color, i < full ? 1 : i === full ? frac : 0);
    sq += "</span>";
    return (
      '<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;padding:6px 0">' +
      '<span style="font-size:22px;font-weight:700;color:#191919">' + t.word + "</span>" + sq +
      '<span style="display:inline-flex;align-items:center;gap:8px">' +
      '<span style="font-size:15px;color:#191919;text-decoration:underline">' + fmtCount(a.count) + " reviews on</span>" +
      '<span style="display:inline-flex;align-items:center;gap:5px">' + starSvg(19, "#00b67a") +
      '<span style="font-size:19px;font-weight:700;color:#191919;letter-spacing:-.02em">Trustpilot</span></span></span></div>'
    );
  }
  function trustedBy(a, reviews, cfg) {
    var shown = reviews.slice(0, 5);
    return (
      '<div class="vr-trustedby">' +
      (shown.length
        ? '<span class="vr-tb-avatars">' + shown.map(function (r, i) {
            return '<span class="vr-tb-av" style="z-index:' + (shown.length - i) + '">' + avatar(r) + "</span>";
          }).join("") + "</span>"
        : "") +
      '<span class="vr-tb-info"><span class="vr-tb-top">' + stars(a.rating, 15, null, cfg) +
      '<span class="vr-tb-rating">' + a.rating.toFixed(1) + "/5</span></span>" +
      '<span class="vr-tb-count">Trusted by ' + fmtCount(a.count) + "+ customers</span></span></div>"
    );
  }
  function googleBadge(a, cfg) {
    return (
      '<div class="vr-gb"><span class="vr-gb-n">' + a.rating.toFixed(1) + "</span>" +
      '<span class="vr-gb-mid">' + stars(a.rating, 16, null, cfg) +
      '<span class="vr-gb-c">Based on ' + fmtCount(a.count) + " reviews</span></span>" +
      '<span class="vr-gb-mark">' + GOOGLE_MARK + "Google</span></div>"
    );
  }
  function ratingCard(a, cfg) {
    return (
      '<div class="vr-rc"><span class="vr-rc-n">' + a.rating.toFixed(1) + "</span>" + stars(a.rating, 16, null, cfg) +
      '<span class="vr-rc-c">' + fmtCount(a.count) + " reviews</span>" +
      '<span class="vr-rc-src">' + (a.platforms || ["google"]).map(mark).join("") + "</span></div>"
    );
  }

  /* ══ dedicated designs ════════════════════════════════════════════════ */
  function breakdown(reviews, a, cfg) {
    var total = reviews.length || 1;
    var rows = [5, 4, 3, 2, 1].map(function (s) {
      return { s: s, pc: Math.round((reviews.filter(function (r) { return Math.round(r.r) === s; }).length / total) * 100) };
    });
    return (
      '<div class="vr-break"><div class="vr-break-head"><span class="vr-break-n">' + a.rating.toFixed(1) + "</span>" +
      stars(a.rating, 16, null, cfg) + '<span class="vr-break-c">' + fmtCount(a.count) + " reviews</span></div>" +
      '<div class="vr-break-bars">' + rows.map(function (r) {
        return '<div class="vr-break-row"><span>' + r.s + ' star</span><span class="vr-break-track"><span class="vr-break-fill" style="width:' + r.pc + '%"></span></span><span class="vr-break-pc">' + r.pc + "%</span></div>";
      }).join("") + "</div></div>"
    );
  }
  function splitLayout(reviews, cfg) {
    return '<div class="vr-split">' + reviews.map(function (r) {
      return '<div class="vr-split-row"><div class="vr-split-who"><span class="vr-split-id">' + avatar(r) +
        '<span class="vr-name">' + esc(shortName(r.n)) + "</span></span>" + stars(r.r, 14, r.p, cfg) +
        '<span class="vr-date">' + relativeDate(r.d) + '</span></div><p class="vr-split-b">' + esc(r.t || "—") + "</p></div>";
    }).join("") + "</div>";
  }
  function compactLayout(reviews, cfg) {
    return '<div class="vr-compact">' + reviews.map(function (r) {
      return '<div class="vr-crow">' + avatar(r) + '<span class="vr-cwho"><span class="vr-name">' + esc(shortName(r.n)) +
        '</span><span class="vr-cq">' + esc(r.t || "—") + '</span></span><span class="vr-cmeta">' +
        stars(r.r, 12, r.p, cfg) + '<span class="vr-date">' + relativeDate(r.d) + "</span></span></div>";
    }).join("") + "</div>";
  }
  function flowLayout(reviews, cfg) {
    var half = Math.max(1, Math.ceil(reviews.length / 2));
    var rows = [reviews.slice(0, half), reviews.slice(half).length ? reviews.slice(half) : reviews.slice(0, half)];
    var fill = function (row) {
      var out = [], times = Math.max(2, Math.ceil(8 / Math.max(row.length, 1)));
      for (var i = 0; i < times; i++) out.push.apply(out, row);
      return out;
    };
    return '<div class="vr-flow">' + rows.map(function (row, ri) {
      return '<div class="vr-flow-row' + (ri === 1 ? " r2" : "") + '">' + fill(row).map(function (r) {
        return '<span class="vr-flow-item"><span class="vr-flow-t">' + esc(r.t || "—") + '</span><span class="vr-flow-w">' +
          avatar(r) + stars(r.r, 12, r.p, cfg) + "</span></span>";
      }).join("") + "</div>";
    }).join("") + "</div>";
  }
  function wallLayout(reviews, cfg) {
    var groups = [[], [], []];
    reviews.forEach(function (r, i) { groups[i % 3].push(r); });
    return '<div class="vr-wall">' + groups.filter(function (g) { return g.length; }).map(function (g) {
      return '<div class="vr-wall-col">' + cards(g.concat(g), cfg) + "</div>";
    }).join("") + "</div>";
  }
  function highlightLayout(reviews, cfg) {
    if (!reviews.length) return "";
    return '<div class="vr-hl"><div class="vr-hl-big">' + card(reviews[0], cfg) + "</div>" +
      '<div class="vr-hl-side">' + cards(reviews.slice(1, 4), cfg) + "</div></div>";
  }
  function tickerLayout(reviews, cfg) {
    return '<div class="vr-ticker"><div class="vr-ticker-row">' + cards(reviews.concat(reviews), cfg) + "</div></div>";
  }

  /* ── the three rotators: spotlight, ribbon, gallery, orbit ───────────── */
  function spotlightLayout(reviews, cfg) {
    return '<div class="vr-spot" data-rot="spot" data-ms="5000"><div class="vr-spot-slot"></div>' +
      (reviews.length > 1
        ? '<div class="vr-dots">' + reviews.map(function (_, i) {
            return '<button class="vr-dot' + (i === 0 ? " vr-on" : "") + '" data-i="' + i + '" aria-label="Review ' + (i + 1) + '"></button>';
          }).join("") + "</div>"
        : "") + "</div>";
  }
  function spotlightSlide(r, cfg) {
    var text = r.t.length > 260 ? r.t.slice(0, 260).replace(/\s+$/, "") + "…" : r.t;
    return '<div class="vr-fade">' + avatar(r) + '<p class="vr-spot-text">' + esc(text) + "</p>" +
      '<div class="vr-spot-name">' + stars(r.r, 16, r.p, cfg) + "<span>" + esc(shortName(r.n)) + "</span>" + mark(r.p) + "</div></div>";
  }
  function ribbonLayout(reviews, a, cfg) {
    return '<div class="vr-ribbon" data-rot="ribbon" data-ms="4600"><span class="vr-ribbon-score">' +
      '<span class="vr-ribbon-n">' + a.rating.toFixed(1) + "</span>" + stars(a.rating, 13, null, cfg) +
      '<span class="vr-ribbon-c">' + fmtCount(a.count) + " reviews</span></span>" +
      '<span class="vr-ribbon-slot"></span></div>';
  }
  function ribbonSlide(r, cfg) {
    return '<span class="vr-ribbon-q vr-fade"><span class="vr-ribbon-t">' + esc(r.t || "—") + "</span>" +
      '<span class="vr-ribbon-w">' + avatar(r) + esc(shortName(r.n)) + '<span class="vr-badge">' + mark(r.p) + "</span></span></span>";
  }
  function galleryLayout(reviews, cfg) {
    return '<div class="vr-gal" data-rot="gal" data-ms="6000"><div class="vr-gal-slot"></div>' +
      '<div class="vr-gal-faces">' + reviews.slice(0, 9).map(function (x, i) {
        return '<button class="vr-gal-face' + (i === 0 ? " on" : "") + '" data-i="' + i + '" aria-label="' + esc(x.n) + '">' + avatar(x) + "</button>";
      }).join("") + "</div></div>";
  }
  function gallerySlide(r, cfg) {
    return '<div class="vr-fade"><p class="vr-gal-q">' + esc(r.t || "—") + "</p>" +
      '<span class="vr-gal-who"><span class="vr-name">' + esc(shortName(r.n)) + "</span>" + stars(r.r, 14, r.p, cfg) + "</span></div>";
  }
  function orbitLayout(reviews, a, cfg) {
    var faces = reviews.slice(0, 10);
    return '<div class="vr-orbit" data-rot="orbit" data-ms="5200"><div class="vr-orbit-ring"></div>' +
      faces.map(function (x, i) {
        var angle = (360 / faces.length) * i - 90;
        return '<button class="vr-orbit-face' + (i === 0 ? " on" : "") + '" data-i="' + i + '" aria-label="' + esc(x.n) +
          '" style="transform:rotate(' + angle + "deg) translateY(calc(var(--vr-orbit-r) * -1)) rotate(" + -angle + 'deg)">' + avatar(x) + "</button>";
      }).join("") +
      '<div class="vr-orbit-mid"><span class="vr-orbit-n">' + a.rating.toFixed(1) + "</span>" +
      stars(a.rating, 15, null, cfg) + '<div class="vr-orbit-slot"></div></div></div>';
  }
  function orbitSlide(r) {
    return '<div class="vr-fade"><p class="vr-orbit-q">' + esc(r.t || "—") + '</p><span class="vr-orbit-who">' + esc(shortName(r.n)) + "</span></div>";
  }

  /* ══ the whole widget ═════════════════════════════════════════════════ */
  function renderBody(layout, reviews, a, cfg) {
    if (BADGE_LAYOUTS.indexOf(layout) > -1) return "";
    if (!reviews.length) return '<div class="vr-empty">No reviews yet for this place.</div>';
    switch (layout) {
      case "grid": return '<div class="vr-grid">' + cards(reviews, cfg) + "</div>";
      case "list": return '<div class="vr-list">' + cards(reviews, cfg) + "</div>";
      case "masonry": return '<div class="vr-masonry">' + cards(reviews, cfg) + "</div>";
      case "pinboard": return '<div class="vr-pin">' + cards(reviews, cfg) + "</div>";
      case "duo": return '<div class="vr-duo2">' + cards(reviews, cfg) + "</div>";
      case "feature": return '<div class="vr-feature">' + cards(reviews, cfg) + "</div>";
      case "band": return '<div class="vr-band">' + cards(reviews.slice(0, 4), cfg) + "</div>";
      case "spotlightgrid":
        return '<div class="vr-spotgrid"><div class="vr-spotgrid-hero">' + card(reviews[0], cfg) + "</div>" +
          '<div class="vr-spotgrid-rest">' + cards(reviews.slice(1, 5), cfg) + "</div></div>";
      case "highlight": return highlightLayout(reviews, cfg);
      case "ticker": return tickerLayout(reviews, cfg);
      case "wall": return wallLayout(reviews, cfg);
      case "spotlight": return spotlightLayout(reviews, cfg);
      case "split": return splitLayout(reviews, cfg);
      case "compact": return compactLayout(reviews, cfg);
      case "flow": return flowLayout(reviews, cfg);
      case "breakdown": return breakdown(reviews, a, cfg);
      case "ribbon": return ribbonLayout(reviews, a, cfg);
      case "gallery": return galleryLayout(reviews, cfg);
      case "orbit": return orbitLayout(reviews, a, cfg);
      default:
        return '<div><div class="vr-track">' + cards(reviews, cfg) + "</div></div>";
    }
  }

  /**
   * Paints one widget into `host`. `cfg` mirrors the props the real component
   * takes: layout, preset, theme colours, watermark, source display.
   */
  function render(host, cfg) {
    var reviews = cfg.reviews || D.reviews;
    var a = cfg.aggregate || aggregateOf(reviews);
    var layout = cfg.layout || "grid";
    // Same clamp table as the widget: mosaics show more, readers show more,
    // everything else four lines.
    var clamp = layout === "masonry" || layout === "pinboard" || layout === "wall" ? 12
      : layout === "list" || layout === "split" ? 6 : 4;
    var root = document.createElement("div");
    root.className = "vr-root vrp-" + cfg.preset;
    root.style.cssText = [
      "--vr-font:" + (cfg.font || "inherit"),
      "--vr-text-primary:" + cfg.text,
      "--vr-head-text:" + cfg.text,
      "--vr-accent:" + cfg.accent,
      "--vr-card-bg:" + cfg.cardBg,
      "--vr-radius:" + (cfg.radius == null ? 12 : cfg.radius) + "px",
      "--vr-clamp:" + clamp,
      "--vr-card-min:" + (cfg.cardMin || 300) + "px",
      "--vr-card-pad:" + (cfg.cardPad || 20) + "px",
    ].join(";");

    var inner;
    if (layout === "gbadge") inner = googleBadge(a, cfg);
    else if (layout === "ratingcard") inner = ratingCard(a, cfg);
    else if (layout === "trustpilot") inner = trustpilotBadge(a);
    else if (layout === "avatars") inner = trustedBy(a, reviews, cfg);
    else inner = (cfg.showHeader !== false || layout === "badge" ? header(a, cfg) : "") + renderBody(layout, reviews, a, cfg);

    if (cfg.watermark && BADGE_LAYOUTS.indexOf(layout) > -1)
      inner += '<span class="vr-powered">Powered by <b>Vanssay</b></span>';

    root.innerHTML = inner;
    // A repaint replaces the DOM the previous rotators were writing into, so
    // their intervals have to die with it — otherwise switching layouts a few
    // times leaves a pile of timers ticking against detached nodes.
    stopHost(host);
    host.innerHTML = "";
    host.appendChild(root);
    wireAvatars(root);
    wireRotators(host, root, reviews, cfg);
    wirePointer(root, cfg.preset);
    wireReveal(root, cfg.preset);
    wireTicker(root);
    return root;
  }

  function aggregateOf(reviews) {
    var sum = reviews.reduce(function (s, r) { return s + r.r; }, 0);
    return {
      rating: reviews.length ? sum / reviews.length : 0,
      count: reviews.length,
      platforms: reviews.reduce(function (acc, r) { if (acc.indexOf(r.p) < 0) acc.push(r.p); return acc; }, []),
    };
  }

  /* ══ behaviour ════════════════════════════════════════════════════════ */
  // A Google avatar URL expires; fall back to the coloured initials, exactly
  // like the widget's onError does.
  function wireAvatars(root) {
    root.querySelectorAll(".vr-avatar[data-fb] img").forEach(function (img) {
      img.addEventListener("error", function () {
        var span = img.parentNode;
        span.textContent = span.getAttribute("data-fb");
        span.style.background = span.getAttribute("data-bg");
      });
    });
  }

  var hosts = [];
  function stopHost(host) {
    (host.__vrTimers || []).forEach(clearInterval);
    host.__vrTimers = [];
    if (hosts.indexOf(host) < 0) hosts.push(host);
  }
  function clearTimers() { hosts.forEach(stopHost); }

  function wireRotators(host, root, reviews, cfg) {
    root.querySelectorAll("[data-rot]").forEach(function (el) {
      var kind = el.getAttribute("data-rot");
      var ms = Number(el.getAttribute("data-ms")) || 5000;
      var slot = el.querySelector("." + (kind === "spot" ? "vr-spot" : kind === "gal" ? "vr-gal" : kind === "orbit" ? "vr-orbit" : "vr-ribbon") + "-slot");
      var faces = el.querySelectorAll(".vr-gal-face,.vr-orbit-face,.vr-dot");
      var i = 0, paused = false, resume = null;
      function paint() {
        var r = reviews[i % reviews.length];
        if (!r) return;
        slot.innerHTML =
          kind === "spot" ? spotlightSlide(r, cfg)
          : kind === "gal" ? gallerySlide(r, cfg)
          : kind === "orbit" ? orbitSlide(r)
          : ribbonSlide(r, cfg);
        wireAvatars(slot);
        faces.forEach(function (f, fi) {
          f.classList.toggle(f.classList.contains("vr-dot") ? "vr-on" : "on", fi === i % reviews.length);
        });
      }
      function hold(n) {
        if (typeof n === "number") { i = n; paint(); }
        paused = true;
        clearTimeout(resume);
        resume = setTimeout(function () { paused = false; }, 15000);
      }
      faces.forEach(function (f) {
        f.addEventListener("click", function () { hold(Number(f.getAttribute("data-i"))); });
      });
      if (kind === "ribbon") el.addEventListener("click", function () { hold(); });
      paint();
      if (reviews.length > 1 && !reduced()) {
        host.__vrTimers.push(setInterval(function () {
          if (paused) return;
          i = (i + 1) % reviews.length;
          paint();
        }, ms));
      }
    });
  }

  // tilt / sheen / pearl / spotlight track the cursor — same maths as the widget.
  function wirePointer(root, preset) {
    if (POINTER_PRESETS.indexOf(preset) < 0 || reduced()) return;
    root.querySelectorAll(".vr-card").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        if (preset === "spotlight") {
          el.style.setProperty("--vr-mx", e.clientX - rect.left + "px");
          el.style.setProperty("--vr-my", e.clientY - rect.top + "px");
          return;
        }
        var deg = preset === "sheen" || preset === "pearl" ? 6 : 14;
        el.style.setProperty("--vr-ry", (x * deg).toFixed(2) + "deg");
        el.style.setProperty("--vr-rx", (-y * deg).toFixed(2) + "deg");
        el.style.setProperty("--vr-mx", (x * 100 + 50).toFixed(1) + "%");
        el.style.setProperty("--vr-my", (y * 100 + 50).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () {
        el.style.removeProperty("--vr-ry");
        el.style.removeProperty("--vr-rx");
      });
    });
  }

  // reveal / unfold / unblur wait for the card to be in view.
  function wireReveal(root, preset) {
    var els = root.querySelectorAll(".vr-card");
    if (REVEAL_PRESETS.indexOf(preset) < 0 || reduced() || typeof IntersectionObserver === "undefined") {
      els.forEach(function (el) { el.classList.add("vr-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("vr-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  // The ticker scrolls by scrollLeft, not by a CSS marquee — same as the widget,
  // so it pauses on hover and loops seamlessly in both directions.
  function wireTicker(root) {
    var el = root.querySelector(".vr-ticker");
    if (!el) return;
    var paused = false, last = performance.now();
    el.addEventListener("mouseenter", function () { paused = true; });
    el.addEventListener("mouseleave", function () { paused = false; });
    var still = reduced();
    (function tick(now) {
      if (!el.isConnected) return;
      var dt = Math.min(100, now - last);
      last = now;
      var half = el.scrollWidth / 2;
      if (half > 0) {
        if (!paused && !still) el.scrollLeft += (half / 40000) * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }

  /* ══ public ═══════════════════════════════════════════════════════════ */
  window.VR = {
    render: render,
    card: card,
    aggregateOf: aggregateOf,
    clearTimers: clearTimers,
    fmtCount: fmtCount,
    mark: mark,
    stars: stars,
    esc: esc,
    reduced: reduced,
    BADGE_LAYOUTS: BADGE_LAYOUTS,
    SELF_STYLED: SELF_STYLED,
    API: API,
  };
})();
