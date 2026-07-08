document.querySelectorAll('.carousel').forEach(function(c){
  var track = c.querySelector('.carousel-track');
  if(!track) return;
  var slides = Array.prototype.slice.call(track.children);
  if(slides.length < 2) return;
  var w = function(){ return track.clientWidth; };
  var idx = function(){ return Math.round(track.scrollLeft / w()); };
  var to = function(i){ i = Math.max(0, Math.min(slides.length-1, i)); track.scrollTo({left: w()*i, behavior:'smooth'}); };

  var prev = document.createElement('button');
  prev.className = 'carousel-btn prev'; prev.type = 'button';
  prev.innerHTML = '‹'; prev.setAttribute('aria-label','Previous image');
  var next = document.createElement('button');
  next.className = 'carousel-btn next'; next.type = 'button';
  next.innerHTML = '›'; next.setAttribute('aria-label','Next image');
  prev.onclick = function(){ to(idx()-1); };
  next.onclick = function(){ to(idx()+1); };

  var dots = document.createElement('div');
  dots.className = 'carousel-dots';
  slides.forEach(function(s,i){
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label','Go to image '+(i+1));
    b.onclick = function(){ to(i); };
    dots.appendChild(b);
  });

  c.appendChild(prev); c.appendChild(next); c.appendChild(dots);
  var update = function(){
    var i = idx();
    Array.prototype.forEach.call(dots.children, function(d,j){ d.classList.toggle('active', j===i); });
    prev.disabled = i<=0; next.disabled = i>=slides.length-1;
  };
  var t;
  track.addEventListener('scroll', function(){ clearTimeout(t); t = setTimeout(update, 60); });
  window.addEventListener('resize', update);
  update();
});
