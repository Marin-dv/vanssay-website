/**
 * The Vanssay client space. One script renders every account page:
 *
 *   accounts.html             overview of every plugin  <body data-product="">
 *   account.html              Reviews                   <body data-product="reviews">
 *   geoblock-account.html     Bouncer                   <body data-product="geoblock">
 *   router-account.html       Router                    <body data-product="router">
 *   instagram-account.html    Instagram Feed            <body data-product="instagram">
 *   maintenance-account.html  Maintenance Mode          <body data-product="maintenance">
 *
 * Identity and billing live on the Accounts service (the reviews backend), so
 * every page signs in against the same API and shares ONE token key. The pages
 * used to keep a key per plugin, which meant "Manage" on the overview landed on
 * a sign-in form; the old keys are migrated once and cleared on sign-out.
 *
 * URLs the plugins and emails rely on still work: #token=<jwt> signs in,
 * #reset=<token> opens the new-password form.
 */
(function () {
  "use strict";

  // ── storage (can throw in private windows) ─────────────────────────────────
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  const API = store.get("vanssay.apiBase") || "https://api.vanssay.net";
  const IG_API = store.get("instagram.igApiBase") || API + "/instagram";
  const TKEY = "vanssay.token";
  const LEGACY_KEYS = ["geoblock.token", "router.token", "maintenance.token", "instagram.token"];
  const SUPPORT = "support@vanssay.net";

  // ── plugins ────────────────────────────────────────────────────────────────
  // Prices and features mirror each plugin's own pricing section on the site,
  // and `choice` is the plan id the backend's /billing/create-checkout expects.
  // Keep them in sync when a price changes.
  const PRODUCTS = {
    reviews: {
      name: "Reviews", page: "account", site: "reviews", color: "#2b50ff", soft: "#e7ecff",
      tagline: "Google & Trustpilot reviews",
      setup: "Pick businesses and layouts in the Reviews plugin in Framer.",
      upgradeVia: "checkout", canSwitchInterval: true,
      tiers: [
        { key: "free", name: "Free", feats: ["300 widget views / month", "5 Google + 3 Trustpilot reviews", "8 layouts, incl. all 5 badges", "“Powered by Vanssay” stays"] },
        { key: "starter", name: "Starter", price: { month: "$5.99", year: "$59.90" }, choice: { month: "starter", year: "starterYearly" }, views: "5,000",
          feats: ["5,000 views / month", "All 25 layouts, 57 card designs", "15 Google + 15 Trustpilot reviews", "Watermark removed"] },
        { key: "pro", name: "Pro", price: { month: "$9", year: "$90" }, choice: { month: "pro", year: "proYearly" }, views: "50,000",
          feats: ["50,000 views / month", "Up to 5 businesses", "20 Google + 20 Trustpilot reviews", "Every future layout"] },
        { key: "ultra", name: "Agency", price: { month: "$29", year: "$290" }, choice: { month: "ultra", year: "ultraYearly" },
          feats: ["Unlimited views", "Up to 30 businesses", "Priority support", "Early access to new layouts"] },
      ],
      lifetime: { price: "$129", from: ["free", "starter"],
        desc: "100,000 views a month, 2 businesses, every layout and card design. The one trade: reviews refresh weekly instead of on every page load." },
      fine: "Yearly plans include 2 months free. Plan changes and cancellation happen in Stripe’s billing portal, in two clicks.",
    },
    geoblock: {
      name: "Bouncer", page: "geoblock-account", site: "geoblock", color: "#16a34a", soft: "#e3f6ea",
      tagline: "Block countries & VPNs",
      setup: "Set blocked countries, VPN detection and the block screen in the Bouncer plugin in Framer.",
      upgradeVia: "checkout",
      tiers: [
        { key: "free", name: "Free", feats: ["Blacklist up to 3 countries", "Whole-site block", "Custom loading screen"] },
        { key: "pro", name: "Pro", price: { month: "$6" }, choice: { month: "pro" },
          feats: ["Unlimited countries + whitelist", "VPN / proxy detection", "Custom block screen, redirect & hide", "Per-page blocking"] },
        { key: "ultra", name: "Ultra", price: { month: "$14" }, choice: { month: "ultra" },
          feats: ["Everything in Pro", "Conditional rules", "Scheduled blocks", "Analytics: blocked by country"] },
      ],
      fine: "One subscription covers every Framer project you own. Cancel any time, in two clicks.",
    },
    router: {
      name: "Router", page: "router-account", site: "router", color: "#7c3aed", soft: "#efe9fd",
      tagline: "Redirect visitors by country",
      setup: "Set redirect rules and the suggestion banner in the Router plugin in Framer.",
      upgradeVia: "checkout",
      tiers: [
        { key: "free", name: "Free", feats: ["Redirect by country", "Whitelist + global fallback", "Internal paths, visitor memory", "Test console"] },
        { key: "pro", name: "Pro", price: { month: "$9" }, choice: { month: "pro" },
          feats: ["Unlimited grouped rules", "External URLs + blacklist", "Region, city, language, VPN", "Suggestion banner + i18n", "Analytics breakdown"] },
        { key: "ultra", name: "Agency", price: { month: "$29" }, choice: { month: "ultra" },
          feats: ["Everything in Pro", "Per-device rules", "Scheduling", "Webhooks (Slack / backend)", "CSV log export"] },
      ],
      fine: "One subscription covers every Framer project you own. Cancel any time, in two clicks.",
    },
    instagram: {
      name: "Instagram Feed", short: "Instagram", page: "instagram-account", site: "instagram", color: "#e0457b", soft: "#fdecf3",
      tagline: "Your Instagram feed, on your site",
      setup: "Connect feeds in the Instagram Feed plugin in Framer, or at instagram.vanssay.net for any other website.",
      // Starter ↔ Pro is a change to the live subscription, which the portal does.
      upgradeVia: "portal", trialDays: 7, lifetimePortal: true,
      authExtra: ", the web app at instagram.vanssay.net,",
      tiers: [
        { key: "free", name: "Free", feats: ["1 feed, up to 6 posts", "Manual refresh, once a day", "On .framer.website & .webflow.io"] },
        { key: "starter", name: "Starter", price: { month: "$7.99" }, choice: { month: "starter" },
          feats: ["1 feed, up to 18 posts", "Daily auto-sync, 3 manual/day", "10,000 feed views / month", "On your own domain"] },
        { key: "pro", name: "Pro", price: { month: "$17.99" }, choice: { month: "pro" },
          feats: ["10 feeds, up to 18 posts", "Daily auto-sync, 10 manual/day", "50,000 feed views / month", "Priority support"] },
      ],
      lifetime: { price: "$149", from: ["free", "expired"],
        desc: "2 feeds forever, up to 12 posts each, weekly auto-sync and 50,000 feed views a month. No subscription, ever." },
      fine: "Monthly plans start with a 7-day free trial. Cancel during it and you’re never charged.",
    },
    maintenance: {
      name: "Maintenance Mode", short: "Maintenance", page: "maintenance-account", site: "maintenance", color: "#0891b2", soft: "#e0f4f9",
      tagline: "A maintenance page, one toggle",
      setup: "Turn maintenance on and edit the page in the Maintenance Mode plugin in Framer.",
      upgradeVia: "checkout", yearSave: "save 17%",
      tiers: [
        { key: "free", name: "Free", feats: ["Maintenance on / off", "1 whitelisted IP", "Countdown timer", "Redirect visitors"] },
        { key: "pro", name: "Pro", price: { month: "$3", year: "$30" }, choice: { month: "pro", year: "proYearly" },
          feats: ["Unlimited whitelisted IPs", "Full page editor", "Auto on/off schedule", "Analytics", "Remove Vanssay branding"] },
      ],
      lifetime: { price: "$59", from: ["free"], desc: "Everything in Pro, paid once: all future updates, on every project you own." },
      fine: "One plan covers every Framer project you own. Cancel any time, in two clicks.",
    },
  };
  const KEYS = ["reviews", "geoblock", "router", "instagram", "maintenance"];

  // ── helpers ────────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => Number(n || 0).toLocaleString("en-US");
  const day = (d, withYear) => new Date(d).toLocaleDateString("en-GB", withYear === false ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  async function api(path, opts) {
    opts = opts || {};
    const headers = opts.body ? { "Content-Type": "application/json" } : {};
    const t = store.get(TKEY);
    if (t) headers.Authorization = "Bearer " + t;
    const res = await fetch((opts.base || API) + path, {
      method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Something went wrong. Try again in a moment.");
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const glyph = (color, size) =>
    `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 40 40" aria-hidden="true"><path d="M6,4H15L27,36H18Z" fill="${color}" fill-opacity=".5"/><path d="M34,4H25L13,36H22Z" fill="${color}"/></svg>`;
  const tint = (p) => `--g:${p.color};--g-soft:${p.soft}`;
  const ICON = {
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    out: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/></svg>',
  };

  // ── page context ───────────────────────────────────────────────────────────
  const KEY = document.body.dataset.product || "";
  const P = PRODUCTS[KEY] || null;
  const app = $("app");
  if (P) {
    document.body.style.setProperty("--pa", P.color);
    document.body.style.setProperty("--pa-soft", P.soft);
  }

  // Arriving from a plugin: #token=<jwt>[&…]
  let mode = "login";
  let resetToken = "";
  if (location.hash.startsWith("#token=")) {
    store.set(TKEY, decodeURIComponent(location.hash.slice(7).split("&")[0]));
    history.replaceState(null, "", location.pathname);
  } else if (location.hash.startsWith("#reset=")) {
    mode = "reset";
    resetToken = location.hash.slice(7);
  }
  // One-time move from the per-plugin keys. This page's own key wins, since it
  // is the session the person last used here.
  if (!store.get(TKEY)) {
    const own = KEY && store.get(KEY + ".token");
    const any = own || LEGACY_KEYS.map(store.get).find(Boolean);
    if (any) store.set(TKEY, any);
  }
  LEGACY_KEYS.forEach(store.del);

  // ── chrome ─────────────────────────────────────────────────────────────────
  // The nav and footer are the site's shared chrome, static in each page (see
  // tools/chrome.mjs). This script only adds "Sign out" to the nav when signed in.
  function setSignedIn(on) {
    const cta = document.querySelector(".vn-cta");
    if (!cta) return;
    const btn = cta.querySelector('[data-act="signout"]');
    if (on && !btn) cta.insertAdjacentHTML("afterbegin", '<button class="vn-ghost" data-act="signout">Sign out</button>');
    if (!on && btn) btn.remove();
  }

  // ── auth ───────────────────────────────────────────────────────────────────
  const AUTH = {
    login: { h: 'Welcome <span class="acc">back.</span>', t: "Sign in", s: "Use the email and password from the plugin.", b: "Sign in",
      alt: 'New to Vanssay? <button type="button" class="link" data-mode="register">Create an account</button>' },
    register: { h: 'Create your <span class="acc">account.</span>', t: "Create account", s: "Free, and no card needed.", b: "Create account",
      alt: 'Already have an account? <button type="button" class="link" data-mode="login">Sign in</button>' },
    forgot: { h: 'Reset your <span class="acc">password.</span>', t: "Get a reset link", s: "We’ll email you a link. It lasts 1 hour.", b: "Send reset link",
      alt: '<button type="button" class="link" data-mode="login">Back to sign in</button>' },
    reset: { h: 'Choose a new <span class="acc">password.</span>', t: "New password", s: "At least 8 characters.", b: "Set new password",
      alt: '<button type="button" class="link" data-mode="login">Back to sign in</button>' },
  };

  function renderAuth(m, note) {
    mode = m;
    const c = AUTH[m];
    const lead = P
      ? `Same account as the ${esc(P.name)} plugin in Framer${P.authExtra || ""} and every other Vanssay plugin.`
      : "One account for every Vanssay plugin: the same email and password you use inside Framer.";
    const plugs = KEYS.map((k) => {
      const p = PRODUCTS[k];
      return `<li><span class="glyph glyph-sm" style="${tint(p)}">${glyph(p.color, 14)}</span>${esc(p.name)}<span class="tl">${esc(p.tagline)}</span></li>`;
    }).join("");
    setSignedIn(false);
    app.innerHTML = `<main class="a-wrap auth">
      <div>
        <span class="eyebrow"><b>${P ? esc(P.name) + " · " : ""}Vanssay account</b></span>
        <h1 style="margin-top:18px">${c.h}</h1>
        <p class="lead">${lead}</p>
        <ul class="auth-plugs">${plugs}</ul>
      </div>
      <div class="auth-card">
        <h2>${c.t}</h2><p class="sub">${c.s}</p>
        <form id="au-form" novalidate>
          ${m === "reset" ? "" : `<label for="au-email">Email</label><input class="input" id="au-email" type="email" autocomplete="email" placeholder="you@company.com" required />`}
          ${m === "forgot" ? "" : `<div class="lbl-row"><label for="au-pass">Password</label><button type="button" id="au-show">Show</button></div>
            <input class="input" id="au-pass" type="password" autocomplete="${m === "login" ? "current-password" : "new-password"}" placeholder="${m === "login" ? "Your password" : "At least 8 characters"}" required />`}
          ${m === "login" ? '<div class="forgot"><button type="button" class="link" data-mode="forgot">Forgot password?</button></div>' : ""}
          <div id="au-msg" class="msg"></div>
          <button class="btn btn-dark" id="au-btn" type="submit">${c.b}</button>
        </form>
        <p class="auth-alt">${c.alt}</p>
      </div>
    </main>`;
    if (note) say("au-msg", note, "ok");
    const first = $("au-email") || $("au-pass");
    if (first && window.matchMedia("(min-width: 900px)").matches) first.focus();
    $("au-form").onsubmit = (e) => { e.preventDefault(); submitAuth(); };
    const show = $("au-show");
    if (show) show.onclick = () => {
      const p = $("au-pass");
      p.type = p.type === "password" ? "text" : "password";
      show.textContent = p.type === "password" ? "Show" : "Hide";
    };
  }

  async function submitAuth() {
    const btn = $("au-btn");
    const email = $("au-email") ? $("au-email").value.trim() : "";
    const password = $("au-pass") ? $("au-pass").value : "";
    say("au-msg", "");
    btn.disabled = true;
    try {
      if (mode === "forgot") {
        await api("/auth/forgot-password", { method: "POST", body: { email } });
        say("au-msg", `If an account exists for that email, a reset link from no-reply@vanssay.net is on its way. Check your inbox, and spam.`, "ok");
        return;
      }
      if (mode === "reset") {
        await api("/auth/reset-password", { method: "POST", body: { token: resetToken, password } });
        history.replaceState(null, "", location.pathname);
        renderAuth("login", "Password updated. Sign in with your new password.");
        return;
      }
      const r = await api(mode === "register" ? "/auth/register" : "/auth/login", { method: "POST", body: { email, password } });
      store.set(TKEY, r.token);
      load();
    } catch (e) {
      say("au-msg", e.message, "err");
    } finally {
      if ($("au-btn")) $("au-btn").disabled = false;
    }
  }

  function say(id, text, kind) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = text ? `<div class="alert alert-${kind || "err"}">${esc(text)}</div>` : "";
  }

  // ── signed-in skeleton (while the session is checked) ──────────────────────
  function renderSkeleton() {
    const line = (w, h, mt) => `<span class="sk" style="width:${w};height:${h || 14}px;margin-top:${mt || 0}px"></span>`;
    setSignedIn(false);
    app.innerHTML = `<main class="a-wrap acct" aria-busy="true">
      <aside class="side">${line("70%", 12)}${line("90%", 14, 8)}${[1, 2, 3, 4, 5, 6].map(() => line("100%", 30, 10)).join("")}</aside>
      <div>
        <div class="p-head">${line("180px", 12)}${line("min(420px,80%)", 54, 18)}${line("min(560px,90%)", 16, 20)}</div>
        <div class="sec">${line("140px", 22)}${line("100%", 78, 16)}</div>
        <div class="sec"><div class="tiers" style="--n:3">${[1, 2, 3].map(() => line("100%", 240)).join("")}</div></div>
      </div>
    </main>`;
  }

  // ── plan state per plugin ──────────────────────────────────────────────────
  // kind: free | sub | life | trial | off (a lapsed paid plan; Instagram only)
  function stateFor(key, ent, me, ig) {
    const p = PRODUCTS[key];
    const s = { key, tier: "free", kind: "free", interval: null, periodEnd: null, status: null, trialEndsAt: null, ent: null };
    const plan = ent ? ent.plan : "free";
    if (key === "reviews") {
      const sub = me.subscription || {};
      s.tier = ent && ent.lifetime ? "lifetime" : sub.plan || plan;
      s.interval = sub.interval || null;
      s.periodEnd = sub.currentPeriodEnd || null;
      s.status = sub.status || null;
    } else if (key === "instagram" && ig) {
      s.ent = ig.entitlements || null;
      if (ig.plan === "expired") s.tier = "expired";
      else if (ig.trial) { s.tier = (s.ent && s.ent.plan) || "starter"; s.kind = "trial"; s.trialEndsAt = ig.trialEndsAt || null; }
      else s.tier = ig.plan || "free";
    } else if (ent && ent.lifetime) {
      s.tier = "lifetime";
    } else if (key === "maintenance") {
      s.tier = plan === "pro" || plan === "ultra" ? "pro" : "free";
    } else if (key === "instagram") {
      s.tier = plan === "ultra" ? "pro" : plan;
    } else {
      s.tier = plan;
    }
    if (s.kind !== "trial") {
      s.kind = s.tier === "free" ? "free" : s.tier === "lifetime" ? "life" : s.tier === "expired" ? "off" : "sub";
    }
    const t = p.tiers.find((x) => x.key === s.tier);
    s.label = s.kind === "trial" ? "Free trial" : s.kind === "off" ? "Plan ended" : s.kind === "life" ? "Lifetime" : t ? t.name : cap(s.tier);
    s.badge = { free: "b-free", sub: "b-paid", life: "b-life", trial: "b-trial", off: "b-off" }[s.kind];
    s.failing = s.status === "past_due" || s.status === "unpaid";
    if (s.trialEndsAt) s.daysLeft = Math.max(0, Math.floor((new Date(s.trialEndsAt) - Date.now()) / 86400000));
    return s;
  }

  // ── load ───────────────────────────────────────────────────────────────────
  let ctx = null;

  async function load() {
    if (mode === "reset") return renderAuth("reset");
    if (!store.get(TKEY)) return renderAuth(mode === "reset" ? "reset" : "login");
    renderSkeleton();
    let me;
    try {
      me = await api("/auth/me");
    } catch (e) {
      store.del(TKEY);
      return renderAuth("login");
    }
    const wantUsage = KEY === "reviews" || !KEY;
    const [ents, ig, usage] = await Promise.all([
      Promise.allSettled(KEYS.map((k) => api("/billing/entitlements?product=" + k))),
      api("/auth/me", { base: IG_API }).catch(() => null),
      wantUsage ? api("/track/usage").catch(() => null) : Promise.resolve(null),
    ]);
    const states = {};
    KEYS.forEach((k, i) => {
      const r = ents[i];
      states[k] = stateFor(k, r.status === "fulfilled" ? r.value : null, me, ig);
    });
    ctx = { me, email: me.user.email, states, usage, cycle: null };
    const cur = P && states[KEY];
    ctx.cycle = cur && cur.interval === "year" ? "year" : "month";
    renderApp();
  }

  // ── signed-in page ─────────────────────────────────────────────────────────
  function renderApp() {
    setSignedIn(true);
    app.innerHTML = `<main class="a-wrap acct">${sidebar()}<div>${P ? productMain() : hubMain()}</div></main>`;
    if (window.VanssayInvoices) {
      window.VanssayInvoices.mount({
        apiBase: API, tokenKey: TKEY, product: KEY || undefined, mountId: "invoices",
        // The overview's sidebar links here, so it never just vanishes.
        emptyText: KEY ? null : "No invoices yet. Each payment adds one here, for every plugin.",
      });
    }
    const id = location.hash.slice(1).replace(/[^\w-]/g, "");
    const target = id && document.getElementById(id);
    if (target) target.scrollIntoView();
  }

  function sidebar() {
    const plugs = KEYS.map((k) => {
      const p = PRODUCTS[k], s = ctx.states[k];
      return `<a class="side-link${k === KEY ? " on" : ""}" href="${p.page}" style="${tint(p)}"${k === KEY ? ' aria-current="page"' : ""}>
        <span class="glyph glyph-sm">${glyph(p.color, 14)}</span><span class="grow">${esc(p.short || p.name)}</span>
        <span class="side-plan${s.kind === "free" ? "" : " paid"}">${esc(s.kind === "trial" ? "Trial" : s.label)}</span></a>`;
    }).join("");
    return `<aside class="side" aria-label="Account">
      <div class="side-who"><span class="eyebrow">Signed in as</span><b title="${esc(ctx.email)}">${esc(ctx.email)}</b></div>
      <a class="side-link${KEY ? "" : " on"}" href="accounts"${KEY ? "" : ' aria-current="page"'}><span class="side-ico">${ICON.grid}</span><span class="grow">Overview</span></a>
      <span class="side-label eyebrow">Plugins</span>${plugs}
      <span class="side-label eyebrow">Account</span>
      <a class="side-link" href="accounts#invoices"><span class="side-ico">${ICON.doc}</span><span class="grow">Invoices</span></a>
      <a class="side-link" href="accounts#profile"><span class="side-ico">${ICON.user}</span><span class="grow">Profile &amp; password</span></a>
    </aside>`;
  }

  // ── notices: the few things worth interrupting someone for ──────────────────
  function noticesFor(key) {
    const p = PRODUCTS[key], s = ctx.states[key], out = [];
    if (s.failing) {
      out.push({ cls: "bad", t: "Your last payment didn’t go through",
        p: `Update your card in the billing portal to keep ${s.label}.`, act: { label: "Update card", attrs: `data-act="portal" data-key="${key}"` } });
    }
    if (key === "reviews" && ctx.usage && (s.tier === "free" || s.tier === "starter") && ctx.usage.limit > 0) {
      const u = ctx.usage, next = p.tiers.find((t) => t.key === (s.tier === "free" ? "starter" : "pro"));
      const pct = Math.round((u.views / u.limit) * 100);
      if (u.views > u.limit) {
        out.push({ cls: "warn", t: `Your widget is past this month’s ${num(u.limit)} views`,
          p: `It’s still live, showing 3 reviews instead of your full set until ${resetDay()}. ${next.name} covers ${next.views} views a month for ${next.price.month}/mo.`,
          act: { label: `Upgrade to ${next.name}`, attrs: `data-act="checkout" data-key="reviews" data-choice="${next.choice.month}"` } });
      } else if (pct >= 80) {
        out.push({ cls: "", t: `You’ve used ${pct}% of this month’s views`,
          p: `Past ${num(u.limit)}, your widget shows 3 reviews until ${resetDay()}. ${next.name} covers ${next.views} views a month for ${next.price.month}/mo.`,
          act: { label: `Upgrade to ${next.name}`, attrs: `data-act="checkout" data-key="reviews" data-choice="${next.choice.month}"` } });
      }
    }
    if (s.kind === "trial" && s.daysLeft != null) {
      out.push({ cls: s.daysLeft <= 3 ? "warn" : "", t: `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} left on your free trial`,
        p: `It ends on ${day(s.trialEndsAt)}. After that your feed only shows on .framer.website and .webflow.io addresses, so pick a plan to keep it on your own domain.`,
        act: { label: "See plans", attrs: `href="#plans"`, link: true } });
    }
    if (s.kind === "off") {
      out.push({ cls: "bad", t: "Your plan has ended, so your feed is hidden",
        p: "Pick a plan below to bring it back.", act: { label: "See plans", attrs: `href="#plans"`, link: true } });
    }
    return out;
  }

  function noticeHtml(n, onHub, key) {
    let btn;
    if (onHub) btn = `<a class="btn btn-line btn-sm" href="${PRODUCTS[key].page}">Open ${esc(PRODUCTS[key].name)} →</a>`;
    else if (n.act.link) btn = `<a class="btn btn-pa btn-sm" ${n.act.attrs}>${esc(n.act.label)}</a>`;
    else btn = `<button class="btn btn-pa btn-sm" ${n.act.attrs}>${esc(n.act.label)}</button>`;
    return `<div class="notice ${n.cls}"${onHub ? ` style="--pa:${PRODUCTS[key].color}"` : ""}><div><div class="t">${esc(n.t)}</div><p>${esc(n.p)}</p></div>${btn}</div>`;
  }

  function resetDay() {
    const d = new Date();
    return day(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1), false);
  }

  // ── overview ───────────────────────────────────────────────────────────────
  function hubMain() {
    const order = { trial: 0, sub: 0, life: 0, off: 1, free: 2 };
    const keys = KEYS.slice().sort((a, b) => order[ctx.states[a].kind] - order[ctx.states[b].kind]);
    const paid = KEYS.filter((k) => ctx.states[k].kind !== "free").length;
    const notices = KEYS.flatMap((k) => noticesFor(k).map((n) => noticeHtml(n, true, k))).join("");
    const rows = keys.map((k) => {
      const p = PRODUCTS[k], s = ctx.states[k];
      return `<a class="r${s.kind === "free" ? " free" : ""}" href="${p.page}" style="${tint(p)}">
        <div class="r-main"><span class="glyph">${glyph(p.color, 18)}</span><div><span class="r-title">${esc(p.name)}</span><span class="r-sub">${esc(p.tagline)}</span></div></div>
        <div class="r-end"><span class="r-meta">${esc(hubDetail(k, s))}</span><span class="badge ${s.badge}">${esc(s.label)}</span><span class="go">Open →</span></div>
      </a>`;
    }).join("");
    return `<header class="p-head">
        <span class="eyebrow"><b>Vanssay account</b></span>
        <h1>Your <span class="acc">plugins.</span></h1>
        <p class="lead">One account for every Vanssay plugin, the same sign-in you use inside Framer. Open a plugin to see its plan, usage and invoices.</p>
      </header>
      <div id="a-msg" class="msg"></div>
      ${notices}
      <section class="sec">
        <div class="sec-head"><h2>Plugins</h2><span class="eyebrow">${paid} paid · ${KEYS.length - paid} free</span></div>
        <div class="rows">${rows}</div>
      </section>
      <section class="sec" id="invoices" style="display:none"></section>
      <section class="sec" id="profile">
        <div class="sec-head"><h2>Profile &amp; password</h2></div>
        <div class="rows">
          <div class="r"><div><span class="r-title">Email</span><span class="r-sub">${esc(ctx.email)}</span></div>
            <div class="r-end"><a class="btn btn-line btn-sm" href="mailto:${SUPPORT}?subject=${encodeURIComponent("Change my account email")}">Ask to change it</a></div></div>
          <div class="r"><div><span class="r-title">Password</span><span class="r-sub">We email you a link to set a new one. It lasts 1 hour.</span></div>
            <div class="r-end"><button class="btn btn-line btn-sm" data-act="reset-pass">Send reset link</button></div></div>
          <div class="r"><div><span class="r-title">Sign out</span><span class="r-sub">Signs this browser out of every Vanssay account page.</span></div>
            <div class="r-end"><button class="btn btn-line btn-sm" data-act="signout">Sign out</button></div></div>
        </div>
        <div id="p-msg" class="msg"></div>
      </section>`;
  }

  function hubDetail(k, s) {
    if (s.failing) return "Payment failed";
    if (k === "reviews" && ctx.usage) {
      const u = ctx.usage;
      return u.limit > 0 ? `${num(u.views)} / ${num(u.limit)} views` : `${num(u.views)} views this month`;
    }
    if (s.kind === "trial" && s.daysLeft != null) return `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} left`;
    if (s.kind === "sub" && s.periodEnd) return "Renews " + day(s.periodEnd, false);
    return "";
  }

  // ── one plugin ─────────────────────────────────────────────────────────────
  function productMain() {
    const s = ctx.states[KEY];
    const lead = {
      free: `You’re on the free plan. ${P.setup}`,
      sub: `You’re on <b>${esc(s.label)}</b>. ${P.setup}`,
      life: `You own <b>Lifetime</b>, paid once. ${P.setup}`,
      trial: `You’re trying <b>${esc(tierName(s.tier))}</b> for free. ${P.setup}`,
      off: `Your paid plan has ended. ${P.setup}`,
    }[s.kind];
    const links = [
      KEY === "reviews" ? `<a class="btn btn-dark btn-sm" href="reviews-live">See your live reviews →</a>` : "",
      `<a class="btn btn-line btn-sm" href="${P.site}">About ${esc(P.name)}</a>`,
      `<a class="btn btn-line btn-sm" href="contact">Get help</a>`,
    ].join("");
    return `<header class="p-head">
        <span class="eyebrow"><span class="glyph glyph-sm" style="${tint(P)}">${glyph(P.color, 14)}</span><b>${esc(P.name)}</b>· ${esc(P.tagline)}</span>
        <h1>${esc(P.name)}</h1>
        <p class="lead">${lead}</p>
        <div class="p-links">${links}</div>
      </header>
      <div id="a-msg" class="msg"></div>
      ${noticesFor(KEY).map((n) => noticeHtml(n, false)).join("")}
      <section class="sec">
        <div class="sec-head"><h2>Your plan</h2></div>
        ${nowBar(s)}
      </section>
      ${KEY === "reviews" ? usageSection(s) : ""}
      ${plansSection(s)}
      ${KEY === "instagram" ? extraFeedSection(s) : ""}
      <section class="sec" id="invoices" style="display:none"></section>`;
  }

  const tierName = (key) => (P.tiers.find((t) => t.key === key) || { name: cap(key) }).name;

  function nowBar(s) {
    let status, acts = "";
    if (s.kind === "free") {
      status = KEY === "instagram" ? "Free forever on .framer.website and .webflow.io addresses." : "Free forever. No card on file.";
    } else if (s.kind === "life") {
      status = "Paid once, yours for good." + (KEY === "reviews" ? " Reviews refresh weekly." : "");
      if (P.lifetimePortal) acts = `<button class="btn btn-line btn-sm" data-act="portal" data-key="${KEY}">Receipts</button>`;
    } else if (s.kind === "trial") {
      status = s.daysLeft != null ? `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} left, ends ${day(s.trialEndsAt)}. No card on file, nothing to cancel.` : "No card on file, nothing to cancel.";
    } else if (s.kind === "off") {
      status = "Your feed is hidden until you pick a plan.";
    } else {
      if (s.failing) status = "Payment failed. Update your card to keep this plan.";
      else if (s.interval && s.periodEnd) status = `Billed ${s.interval === "year" ? "yearly" : "monthly"} · renews ${day(s.periodEnd)}`;
      else if (s.periodEnd) status = "Renews " + day(s.periodEnd);
      else status = "Active subscription, billed through Stripe.";
      if (P.canSwitchInterval && s.interval === "month") acts += `<button class="btn btn-line btn-sm" data-act="interval" data-to="year">Switch to yearly · 2 months free</button>`;
      if (P.canSwitchInterval && s.interval === "year") acts += `<button class="btn btn-line btn-sm" data-act="interval" data-to="month">Switch to monthly</button>`;
      acts += `<button class="btn btn-dark btn-sm" data-act="portal" data-key="${KEY}">Manage billing</button>`;
    }
    return `<div class="now">
      <div class="now-l"><span class="glyph" style="${tint(P)}">${glyph(P.color, 18)}</span>
        <div><div class="now-name">${esc(s.label)}${s.kind === "trial" ? ` <span class="badge b-trial">${esc(tierName(s.tier))}</span>` : ""}</div><div class="now-status">${esc(status)}</div></div></div>
      ${acts ? `<div class="now-r">${acts}</div>` : ""}
    </div>`;
  }

  function usageSection(s) {
    const u = ctx.usage;
    if (!u) {
      return `<section class="sec"><div class="sec-head"><h2>This month</h2></div><div class="usage"><p class="usage-foot">Usage is unavailable right now. Your widget is not affected.</p></div></section>`;
    }
    const lim = u.limit;
    const pct = lim > 0 ? Math.round((u.views / lim) * 100) : 0;
    const collapses = s.tier === "free" || s.tier === "starter";
    const foot = lim <= 0 ? "No view limit on your plan."
      : collapses ? `Past ${num(lim)} views your widget shows 3 reviews until the month resets. It never goes blank.`
      : `${s.label} never trims your widget. Past the limit you get an email, not fewer reviews.`;
    return `<section class="sec">
      <div class="sec-head"><h2>This month</h2><span class="eyebrow">Resets ${resetDay()}</span></div>
      <div class="usage">
        <div class="usage-top"><div class="usage-n">${num(u.views)}<small>widget views</small></div>
          <span class="usage-meta">${lim > 0 ? `${pct}% of ${num(lim)}` : "Unlimited"}</span></div>
        ${lim > 0 ? `<div class="bar${pct >= 80 ? " warn" : ""}"><span style="width:${Math.min(100, pct)}%"></span></div>` : ""}
        <div class="usage-foot"><span>${esc(foot)}</span></div>
      </div>
    </section>`;
  }

  function plansSection(s) {
    const ranks = P.tiers.map((t) => t.key);
    const rc = s.kind === "off" ? 0 : ranks.indexOf(s.tier);
    const hasYear = P.tiers.some((t) => t.price && t.price.year) && s.kind !== "life";
    const yr = hasYear && ctx.cycle === "year";
    // Recommend the next step up, never the most expensive plan by default.
    let rec = null;
    if (s.kind === "trial") rec = s.tier;
    else if (s.kind !== "life" && rc >= 0 && rc + 1 < ranks.length) rec = ranks[rc + 1];
    else if (s.kind === "off") rec = ranks[1];

    const cards = P.tiers.map((t, i) => {
      const isCur = s.kind !== "trial" && s.kind !== "off" && t.key === s.tier;
      const isRec = !isCur && t.key === rec;
      const price = !t.price ? "$0" : yr && t.price.year ? t.price.year : t.price.month;
      const per = !t.price ? "forever" : yr && t.price.year ? "/yr" : "/mo";
      const note = yr && t.price && t.price.year ? (P.yearSave || "2 months free") : "";
      const choice = t.choice ? (yr && t.choice.year ? t.choice.year : t.choice.month) : null;
      let btn = "";
      if (isCur) btn = `<button class="btn" disabled>Current plan</button>`;
      else if (s.kind === "life") btn = "";
      else if (s.kind === "trial" || s.kind === "off" || s.kind === "free") {
        if (choice) {
          const label = P.trialDays && s.kind !== "trial" ? `Start ${P.trialDays}-day trial` : s.kind === "trial" && t.key === s.tier ? `Keep ${t.name}` : `Choose ${t.name}`;
          btn = `<button class="btn ${isRec ? "btn-pa" : "btn-line"}" data-act="checkout" data-key="${KEY}" data-choice="${choice}">${esc(label)}</button>`;
        } else if (s.kind === "trial") {
          btn = `<button class="btn" disabled>After your trial</button>`;
        }
      } else if (i > rc) {
        btn = P.upgradeVia === "checkout" && choice
          ? `<button class="btn ${isRec ? "btn-pa" : "btn-line"}" data-act="checkout" data-key="${KEY}" data-choice="${choice}">Upgrade to ${esc(t.name)}</button>`
          : `<button class="btn ${isRec ? "btn-pa" : "btn-line"}" data-act="portal" data-key="${KEY}">Switch to ${esc(t.name)}</button>`;
      } else {
        btn = `<button class="btn btn-line" data-act="portal" data-key="${KEY}">${t.key === "free" ? "Downgrade" : "Switch to " + esc(t.name)}</button>`;
      }
      const tag = isCur ? "Your plan" : isRec ? (s.kind === "trial" ? "On trial" : "Recommended") : "";
      return `<div class="tier${isCur ? " cur" : ""}${isRec ? " rec" : ""}">
        ${tag ? `<span class="tier-tag">${tag}</span>` : ""}
        <div class="tier-name">${esc(t.name)}</div>
        <div class="tier-price">${price} <small>${per}</small></div>
        <div class="tier-note">${esc(note)}</div>
        <ul>${t.feats.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        ${btn}
      </div>`;
    }).join("");

    let once = "";
    const L = P.lifetime;
    if (L && (s.kind === "life" || s.kind === "trial" || L.from.includes(s.tier))) {
      const own = s.kind === "life";
      once = `<div class="once${own ? " cur" : ""}">
        <div><div class="tier-name">Lifetime <span class="tier-tag" style="position:static">${own ? "Your plan" : "One payment"}</span></div><p>${esc(L.desc)}</p></div>
        <div class="once-r"><div class="tier-price">${L.price} <small>once</small></div>
          ${own ? "" : `<button class="btn btn-dark" data-act="checkout" data-key="${KEY}" data-choice="lifetime">Pay once</button>`}</div>
      </div>`;
    }

    const toggle = hasYear ? `<div class="cycle" role="group" aria-label="Billing period">
        <button type="button" data-act="cycle" data-cycle="month" class="${yr ? "" : "on"}" aria-pressed="${!yr}">Monthly</button>
        <button type="button" data-act="cycle" data-cycle="year" class="${yr ? "on" : ""}" aria-pressed="${yr}">Yearly <span class="save">· ${esc(P.yearSave || "2 months free")}</span></button>
      </div>` : "";
    const title = s.kind === "free" || s.kind === "off" ? "Upgrade" : s.kind === "life" ? "Other plans" : "Change plan";
    return `<section class="sec" id="plans">
      <div class="sec-head"><h2>${title}</h2>${toggle}</div>
      <div class="tiers" style="--n:${P.tiers.length}">${cards}</div>
      ${once}
      <p class="fine">${esc(P.fine)}</p>
    </section>`;
  }

  function extraFeedSection(s) {
    const can = s.tier === "pro" || s.tier === "lifetime";
    if (s.kind === "trial" || s.kind === "off") return "";
    const copy = can ? "Stays on your account for good, on top of the feeds your plan includes. Buy as many as you need."
      : s.tier === "starter" ? "Extra feeds are for Pro and Lifetime. Starter covers one feed; Pro covers ten."
      : "Extra feeds are for Pro and Lifetime.";
    return `<section class="sec">
      <div class="sec-head"><h2>Extra feeds</h2></div>
      <div class="once"><div><div class="tier-name">Add a feed</div><p>${esc(copy)}</p></div>
        <div class="once-r"><div class="tier-price">$29 <small>once</small></div>
          <button class="btn ${can ? "btn-dark" : "btn-line"}" ${can ? `data-act="checkout" data-key="instagram" data-choice="extraFeed"` : "disabled"}>Add a feed</button></div></div>
    </section>`;
  }

  // ── actions (one delegated handler for the whole page) ──────────────────────
  async function busy(btn, msgId, fn) {
    if (btn.disabled) return;
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Opening…";
    say(msgId, "");
    try {
      await fn();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = label;
      say(msgId, e.message, "err");
      const box = $(msgId);
      if (box) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function signOut() {
    store.del(TKEY);
    LEGACY_KEYS.forEach(store.del);
    history.replaceState(null, "", location.pathname);
    ctx = null;
    renderAuth("login");
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]");
    if (m) { e.preventDefault(); renderAuth(m.dataset.mode); return; }
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "A") return;
    const act = b.dataset.act;
    if (act === "signout") return signOut();
    if (act === "cycle") { ctx.cycle = b.dataset.cycle; return rerenderPlans(); }
    if (act === "checkout") {
      return busy(b, "a-msg", async () => {
        const r = await api("/billing/create-checkout", { method: "POST", body: { product: b.dataset.key, plan: b.dataset.choice } });
        location.href = r.checkoutUrl;
      });
    }
    if (act === "portal") {
      return busy(b, "a-msg", async () => {
        const r = await api("/billing/portal", { method: "POST", body: { product: b.dataset.key } });
        location.href = r.portalUrl;
      });
    }
    if (act === "interval") {
      return busy(b, "a-msg", async () => {
        await api("/billing/change-interval", { method: "POST", body: { interval: b.dataset.to, product: KEY } });
        location.reload();
      });
    }
    if (act === "reset-pass") return sendReset(b);
  });

  // Only the plans section changes with the billing period; leave the rest.
  function rerenderPlans() {
    const old = $("plans");
    if (!old) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = plansSection(ctx.states[KEY]);
    old.replaceWith(tmp.firstElementChild);
  }

  async function sendReset(btn) {
    if (btn.disabled) return;
    say("p-msg", "");
    btn.disabled = true;
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: ctx.email } });
      say("p-msg", `A reset link from no-reply@vanssay.net is on its way to ${ctx.email}. It lasts 1 hour.`, "ok");
      // 60 s cooldown so the button can't be spammed.
      let left = 60;
      btn.textContent = `Sent · ${left}s`;
      const t = setInterval(() => {
        left -= 1;
        if (!btn.isConnected) return clearInterval(t);
        if (left <= 0) { clearInterval(t); btn.disabled = false; btn.textContent = "Send reset link"; }
        else btn.textContent = `Sent · ${left}s`;
      }, 1000);
    } catch (e) {
      btn.disabled = false;
      say("p-msg", e.message, "err");
    }
  }

  load();
})();
