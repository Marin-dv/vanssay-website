/* Site chrome behaviour (see assets/chrome.css): the nav is transparent at the
   top of the page and frosts once the page scrolls, as on the home page. */
(function () {
  var nav = document.getElementById("vn-nav");
  if (!nav) return;
  var set = function () { nav.classList.toggle("scrolled", window.scrollY > 40); };
  set();
  window.addEventListener("scroll", set, { passive: true });
})();
