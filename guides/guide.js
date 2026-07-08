// Scroll-spy: highlight the "On this page" TOC link for the section in view.
(function(){
  var links = [].slice.call(document.querySelectorAll('.rail nav a[href^="#"]'));
  var sections = [];
  links.forEach(function(a){
    var id = a.getAttribute('href').slice(1);
    var el = id && document.getElementById(id);
    if (el) sections.push({ id: id, el: el, link: a });
  });
  if (!sections.length) return;
  var cur = null;
  function update(){
    var off = 110, active = sections[0].id;
    for (var i = 0; i < sections.length; i++){
      if (sections[i].el.getBoundingClientRect().top - off <= 0) active = sections[i].id;
    }
    if (active !== cur){
      cur = active;
      sections.forEach(function(s){ s.link.classList.toggle('active', s.id === active); });
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){ update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
