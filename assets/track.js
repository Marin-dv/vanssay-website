/*
 * vanssay.net page-view beacon.
 *
 * One request per page load to our own API — no cookie, no third party, no
 * fingerprint. The server keeps daily counters only (see backend routes/site.ts),
 * which is why there is no consent banner to go with this.
 *
 * The owner is not traffic. Three ways out, in order of how they happen:
 *   1. `vanssay.notrack` in localStorage — set automatically the moment you log
 *      into /admin.html, so your own browsing stops counting from then on.
 *   2. ?notrack=1 on any page — same flag, for a browser that never opens admin
 *      (phone, second profile). ?notrack=0 clears it.
 *   3. SITE_EXCLUDE_IPS on the server — the catch-all when storage is cleared.
 */
(function () {
  var API = "https://api.vanssay.net";
  var KEY = "vanssay.notrack";

  var store = null;
  try {
    store = window.localStorage;
  } catch (e) {
    /* storage blocked (private window, embedded) — count the view, skip the flag */
  }

  // ?notrack=1 / ?notrack=0 — set or clear the opt-out, then behave accordingly.
  try {
    var flag = new URLSearchParams(location.search).get("notrack");
    if (flag === "1" && store) store.setItem(KEY, "1");
    if (flag === "0" && store) store.removeItem(KEY);
  } catch (e) {
    /* no URLSearchParams / no storage — fall through */
  }

  try {
    if (store && store.getItem(KEY) === "1") return; // that's me
  } catch (e) {
    /* unreadable storage — count it */
  }

  // Local previews are not the live site.
  if (location.protocol === "file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  var url =
    API +
    "/site/view?p=" +
    encodeURIComponent(location.pathname) +
    "&r=" +
    encodeURIComponent(document.referrer || "");

  // sendBeacon survives the page being closed mid-request and never delays
  // navigation; the fetch is for the browsers (and blockers) that refuse it.
  var sent = false;
  try {
    sent = !!(navigator.sendBeacon && navigator.sendBeacon(url));
  } catch (e) {
    sent = false;
  }
  if (!sent) {
    try {
      fetch(url, { method: "POST", mode: "no-cors", keepalive: true });
    } catch (e) {
      /* nothing left to try — a missed view is not worth an error */
    }
  }
})();
