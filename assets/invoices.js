/**
 * The Invoices card, shared by every Vanssay client space.
 *
 * One invoice series covers all the plugins (it is issued by the Accounts
 * service, the reviews backend), so the card is identical everywhere and only
 * the product filter changes. Each page calls:
 *
 *   VanssayInvoices.mount({ apiBase, tokenKey, product, mountId })
 *
 * Omit `product` on the hub (accounts.html) to list every invoice the account
 * holds, across plugins.
 *
 * The card renders its own markup, so a page only needs an empty <div> to hang
 * it on. It hides itself when the account has no invoice yet, which is the
 * normal case for a free user.
 */
(function () {
  var CSS = [
    ".inv-row{display:flex;align-items:center;justify-content:space-between;gap:12px;",
    "padding:11px 0;border-top:1px solid var(--border)}",
    ".inv-row:first-child{border-top:0}",
    ".inv-num{font-weight:600;font-size:13.5px}",
    ".inv-meta{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}",
    ".inv-btn{padding:7px 12px;font-size:12.5px;width:auto;margin-top:0;",
    "text-decoration:none;white-space:nowrap}",
    ".inv-wait{color:var(--muted);font-size:12.5px;text-align:right}",
    "@media (max-width:520px){.inv-row{flex-direction:column;align-items:flex-start}}",
  ].join("");

  function injectCss() {
    if (document.getElementById("vanssay-inv-css")) return;
    var s = document.createElement("style");
    s.id = "vanssay-inv-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /** Product label, so a mixed list on the hub says what each line paid for. */
  var PRODUCT_LABEL = {
    reviews: "Google & Trustpilot Reviews",
    instagram: "Instagram Feed",
    geoblock: "Bouncer",
    router: "Router",
    maintenance: "Maintenance Mode",
  };

  function mount(opts) {
    var apiBase = opts.apiBase;
    var tokenKey = opts.tokenKey;
    var product = opts.product || null;
    var host = document.getElementById(opts.mountId);
    if (!host) return;

    injectCss();

    var token = localStorage.getItem(tokenKey);
    if (!token) return;

    var qs = product ? "?product=" + encodeURIComponent(product) : "";
    fetch(apiBase + "/billing/invoices" + qs, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("unavailable");
        return res.json();
      })
      .then(function (data) {
        var invoices = data.invoices || [];
        if (!invoices.length) return;

        // A held invoice is a real, numbered one whose document is waiting on
        // something legal (our intracom VAT number). Show it rather than hide
        // it, so the purchase is visibly on file and the customer knows who to
        // ask. Normally none are held.
        var held = invoices.some(function (i) { return !i.available; });
        var support = data.supportEmail || "support@vanssay.net";

        var rows = invoices
          .map(function (inv) {
            var d = new Date(inv.supplyDate).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
            });
            var amt = (inv.amountCents / 100).toFixed(2) + " " + inv.currency;
            var what = product ? "" : " · " + (PRODUCT_LABEL[inv.product] || inv.product);
            var href =
              "invoice.html?n=" + encodeURIComponent(inv.number) +
              "&k=" + encodeURIComponent(tokenKey);
            var action = inv.available
              ? '<a class="btn btn-line inv-btn" href="' + href + '" target="_blank" rel="noopener">View / download</a>'
              : '<span class="inv-wait">Contact <a href="mailto:' + esc(support) +
                "?subject=Invoice%20" + encodeURIComponent(inv.number) +
                '" style="color:var(--accent)">' + esc(support) + "</a></span>";
            return (
              '<div class="inv-row"><div><span class="inv-num">' + esc(inv.number) +
              '</span><span class="inv-meta">' + esc(d) + " · " + esc(amt) + esc(what) +
              "</span></div>" + action + "</div>"
            );
          })
          .join("");

        host.innerHTML =
          '<div class="card"><h3>Invoices</h3><p class="muted">' +
          (held
            ? "Every payment you make has an invoice here. One of them is waiting on a legal detail on our side."
            : "Every payment you make has an invoice here. Open it to read it, or download it as a PDF.") +
          "</p>" + rows + "</div>";
        // The mount point ships hidden so an account with no invoice never
        // leaves a stray gap in the column.
        host.style.display = "";
      })
      .catch(function () {
        // No card at all rather than a broken one: an invoice list is never the
        // reason someone came to this page.
      });
  }

  window.VanssayInvoices = { mount: mount };
})();
