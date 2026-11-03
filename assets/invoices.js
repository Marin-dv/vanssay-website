/**
 * The Invoices section, shared by every Vanssay client space.
 *
 * One invoice series covers all the plugins (it is issued by the Accounts
 * service, the reviews backend), so the section is identical everywhere and
 * only the product filter changes. assets/account.js calls:
 *
 *   VanssayInvoices.mount({ apiBase, tokenKey, product, mountId, emptyText })
 *
 * Omit `product` on the overview (accounts.html) to list every invoice the
 * account holds, across plugins.
 *
 * The mount point ships hidden. It stays hidden when the account has no invoice
 * yet (the normal case for a free user) unless `emptyText` is given, which the
 * overview passes because its sidebar links straight here. Styles live in
 * assets/account.css.
 */
(function () {
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /** Product label, so a mixed list on the overview says what each line paid for. */
  var PRODUCT_LABEL = {
    reviews: "Reviews",
    instagram: "Instagram Feed",
    geoblock: "Bouncer",
    router: "Router",
    maintenance: "Maintenance Mode",
  };

  function head(count) {
    return '<div class="sec-head"><h2>Invoices</h2>' +
      (count ? '<span class="eyebrow">' + count + (count === 1 ? " invoice" : " invoices") + "</span>" : "") +
      "</div>";
  }

  function mount(opts) {
    var host = document.getElementById(opts.mountId);
    if (!host) return;
    var token = null;
    try { token = localStorage.getItem(opts.tokenKey); } catch (e) {}
    if (!token) return;
    var product = opts.product || null;

    var showEmpty = function () {
      if (!opts.emptyText) return;
      host.innerHTML = head(0) + '<p class="sec-sub" style="margin-top:0">' + esc(opts.emptyText) + "</p>";
      host.style.display = "";
    };

    var qs = product ? "?product=" + encodeURIComponent(product) : "";
    fetch(opts.apiBase + "/billing/invoices" + qs, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then(function (data) {
        var invoices = data.invoices || [];
        if (!invoices.length) return showEmpty();

        // A held invoice is a real, numbered one whose document is waiting on
        // something legal (our intracom VAT number). Show it rather than hide
        // it, so the purchase is visibly on file and the customer knows who to
        // ask. Normally none are held.
        var held = invoices.some(function (i) { return !i.available; });
        var support = data.supportEmail || "support@vanssay.net";

        var rows = invoices
          .map(function (inv) {
            var d = new Date(inv.supplyDate).toLocaleDateString("en-GB", {
              year: "numeric", month: "short", day: "numeric",
            });
            var amt = (inv.amountCents / 100).toFixed(2) + " " + String(inv.currency || "").toUpperCase();
            var what = product ? "" : PRODUCT_LABEL[inv.product] || inv.product;
            var href =
              "invoice.html?n=" + encodeURIComponent(inv.number) +
              "&k=" + encodeURIComponent(opts.tokenKey);
            var action = inv.available
              ? '<a class="btn btn-line btn-sm" href="' + href + '" target="_blank" rel="noopener">View / download</a>'
              : '<span class="r-meta">Held: email <a href="mailto:' + esc(support) +
                "?subject=Invoice%20" + encodeURIComponent(inv.number) +
                '" style="color:var(--accent)">' + esc(support) + "</a></span>";
            return (
              '<div class="r"><div><span class="r-title">' + esc(inv.number) + "</span>" +
              '<span class="r-sub">' + esc(d) + (what ? " · " + esc(what) : "") + "</span></div>" +
              '<div class="r-end"><span class="r-meta">' + esc(amt) + "</span>" + action + "</div></div>"
            );
          })
          .join("");

        host.innerHTML =
          head(invoices.length) +
          '<p class="sec-sub">' +
          (held
            ? "Every payment has an invoice here. One of them is waiting on a legal detail on our side."
            : "Every payment has an invoice here. Open one to read it or save it as a PDF.") +
          '</p><div class="rows">' + rows + "</div>";
        host.style.display = "";
      })
      .catch(function () {
        // No section rather than a broken one, except on the overview, where the
        // sidebar promised one.
        showEmpty();
      });
  }

  window.VanssayInvoices = { mount: mount };
})();
