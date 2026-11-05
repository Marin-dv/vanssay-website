#!/usr/bin/env node
/**
 * Writes the shared site chrome (nav + footer) into every page.
 *
 *   node tools/chrome.mjs
 *
 * Each page carries the chrome between marker comments:
 *
 *   <!-- vn:nav -->  …  <!-- /vn:nav -->
 *   <!-- vn:foot --> …  <!-- /vn:foot -->
 *
 * and this script rewrites what sits between them, so a change to the nav or
 * footer is one edit here plus one run. Styles: assets/chrome.css. Pages
 * without markers are left alone (admin, invoice, the Social Feed pages for
 * the Webflow listing, the personal page).
 *
 * A page opts out of the spacer under the fixed nav with
 * <!-- vn:nav nospacer --> (the home page, whose hero pads for it).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const YEAR = new Date().getFullYear();

const MARK = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><path d="M6,4H15L27,36H18Z" fill="#16151b"/><path d="M34,4H25L13,36H22Z" fill="#2b50ff"/></svg>`;

const NAV = (spacer) => `
<div class="vn-shell" role="banner">
  <div class="vn-nav" id="vn-nav">
    <a class="vn-brand" href="/">${MARK(24)}Vanssay</a>
    <div class="vn-links" role="navigation" aria-label="Main">
      <div class="vn-has-menu">
        <a class="vn-link" href="/#plugins">Plugins</a>
        <div class="vn-menu">
          <div class="vn-mm-group"><span>Reviews &amp; social proof</span><a class="vn-mm-item" href="/reviews/">Reviews</a><a class="vn-mm-item" href="/instagram">Instagram Feed</a></div>
          <div class="vn-mm-group"><span>Access &amp; traffic control</span><a class="vn-mm-item" href="/geoblock">Bouncer</a><a class="vn-mm-item" href="/router">Router</a></div>
          <div class="vn-mm-group"><span>Site status</span><a class="vn-mm-item" href="/maintenance">Maintenance Mode <em class="vn-soon">soon</em></a></div>
          <div class="vn-mm-group vn-mm-wide"><span>Missing one?</span><a class="vn-mm-item" href="/suggest">Suggest a plugin &rarr;</a></div>
        </div>
      </div>
      <a class="vn-link" href="/guides/">Guides</a>
      <a class="vn-link" href="/contact">Contact</a>
    </div>
    <div class="vn-cta"><a href="/accounts" class="vn-btn">Your account →</a></div>
  </div>
</div>${spacer ? '\n<div class="vn-spacer" aria-hidden="true"></div>' : ""}
`;

const FOOT = `
<div class="vn-foot" role="contentinfo">
  <div class="vn-wrap vn-foot-grid">
    <div class="vn-foot-brand">
      <a class="vn-brand" href="/">${MARK(20)}Vanssay</a>
      <p>Focused plugins for Framer sites. Made in Nantes, France.</p>
    </div>
    <div class="vn-foot-col"><span>Plugins</span><a href="/reviews/">Reviews</a><a href="/instagram">Instagram Feed</a><a href="/geoblock">Bouncer</a><a href="/router">Router</a></div>
    <div class="vn-foot-col"><span>Resources</span><a href="/guides/">Guides</a><a href="/suggest">Suggest a plugin</a><a href="/accounts">Your account</a><a href="/contact">Contact</a></div>
    <div class="vn-foot-col"><span>Company</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@vanssay.net">support@vanssay.net</a></div>
  </div>
  <div class="vn-wrap vn-foot-bottom"><span>© ${YEAR} Vanssay</span></div>
</div>
`;

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name.startsWith(".") || name === "node_modules") return [];
    if (statSync(p).isDirectory()) return pages(p);
    return name.endsWith(".html") ? [p] : [];
  });
}

let changed = 0;
for (const file of pages(ROOT)) {
  const src = readFileSync(file, "utf8");
  const out = src
    .replace(/(<!-- vn:nav( nospacer)? -->)[\s\S]*?(<!-- \/vn:nav -->)/, (_, open, nospacer, close) => open + NAV(!nospacer) + close)
    .replace(/(<!-- vn:foot -->)[\s\S]*?(<!-- \/vn:foot -->)/, (_, open, close) => open + FOOT + close);
  if (out !== src) {
    writeFileSync(file, out);
    changed++;
    console.log("updated", relative(ROOT, file));
  }
}
console.log(changed ? `${changed} page(s) updated` : "every page is up to date");
