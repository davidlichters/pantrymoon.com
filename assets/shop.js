(function(){
  var $=function(s,c){return (c||document).querySelector(s)};
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

  // Galerie
  var haupt=$('.galerie__haupt img'),knoepfe=$$('.daumen button'),x0=null;
  $$('.daumen button').forEach(function(b){
    b.addEventListener('click',function(){
      haupt.removeAttribute('srcset'); haupt.src=b.dataset.src; haupt.alt=b.dataset.alt||'';
      haupt.classList.toggle('fuellt',b.dataset.fit==='cover');
      $$('.daumen button').forEach(function(x){x.setAttribute('aria-current','false')});
      b.setAttribute('aria-current','true');
      var z=$('.zaehler');if(z){z.textContent=(knoepfe.indexOf(b)+1)+' / '+knoepfe.length}
    });
  });

  // Wischen am Handy: naechstes oder voriges Bild
  if(haupt&&knoepfe.length){
    haupt.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
    haupt.addEventListener('touchend',function(e){
      if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; x0=null;
      if(Math.abs(dx)<40) return;
      var i=knoepfe.findIndex(function(k){return k.getAttribute('aria-current')==='true'});
      var n=(i+(dx<0?1:-1)+knoepfe.length)%knoepfe.length; knoepfe[n].click();
    });
  }

  // Stufen
  function wahl(){
    var an=$('.stufe input:checked'); if(!an) return;
    $$('.stufe').forEach(function(s){s.classList.toggle('an',s.contains(an))});
    var preis=an.closest('.stufe').querySelector('.stufe__preis').firstChild.textContent.trim();
    var name=an.closest('.stufe').querySelector('.stufe__text strong').textContent.trim();
    $$('[data-preis]').forEach(function(e){e.textContent=preis});
    $$('[data-name]').forEach(function(e){e.textContent=name});
  }
  $$('.stufe input').forEach(function(i){i.addEventListener('change',wahl)});
  wahl();

  // Lieferspanne (Werktage sind Platzhalter, Inhaber legt sie fest)
  function plus(tage){
    var d=new Date(),n=0;
    while(n<tage){d.setDate(d.getDate()+1);var w=d.getDay();if(w!==0&&w!==6)n++;}
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }
  $$('[data-liefer]').forEach(function(e){
    var t=e.dataset.liefer.split('-');
    e.textContent='between '+plus(+t[0])+' and '+plus(+t[1]);
  });

  // Stimmen: nach 6 Stueck "Show more"
  $$('[data-mehr]').forEach(function(b){
    var liste=$('.stimmen'),rest=null,pos=0,PRO=10;
    function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
    function karte(r){
      var h='<blockquote class="zitat">';
      if(r.s){h+='<span class="sterne__reihe" aria-label="'+r.s+' out of 5 stars">'+'&#9733;'.repeat(r.s)+'<span class="leer">'+'&#9733;'.repeat(5-r.s)+'</span></span>'}
      if(r.t){h+='<strong class="zitat__titel">'+esc(r.t)+'</strong>'}
      h+='<div class="zitat__text">'+r.x.split('\n').filter(function(t){return t.trim()}).map(function(t){return '<p>'+esc(t)+'</p>'}).join('')+'</div>';
      if(r.f.length){h+='<div class="zitat__fotos">'+r.f.map(function(f){return '<a href="img/kunden/'+f+'" target="_blank" rel="noopener"><img src="img/kunden/k/'+f+'" alt="Customer photo" decoding="async" width="72" height="72"></a>'}).join('')+'</div>'}
      return h+'<cite>'+esc(r.n)+'</cite></blockquote>';
    }
    function zeigen(){
      var teil=rest.slice(pos,pos+PRO); pos+=teil.length;
      liste.insertAdjacentHTML('beforeend',teil.map(karte).join(''));
      kuerzen();
      if(pos>=rest.length){b.parentNode.style.display='none'}
    }
    function laden(fertig){
      if(rest){fertig();return}
      fetch('assets/bewertungen.json').then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(function(d){rest=d;fertig()})
      .catch(function(){var sc=document.createElement('script');sc.src='assets/bewertungen.js';sc.onload=function(){rest=window.BEW_REST||[];fertig()};document.body.appendChild(sc)});
    }
    b.addEventListener('click',function(){laden(zeigen)});
  });

  // Lange Bewertungen kuerzen, "Read more" klappt auf
  function kuerzen(){
    $$('.zitat__text:not([data-k])').forEach(function(t){
      t.setAttribute('data-k','1');
      if(t.scrollHeight>t.clientHeight+4){
        var k=document.createElement('button');k.type='button';k.className='zitat__mehr';k.textContent='Read more';
        k.addEventListener('click',function(){t.classList.add('offen');k.parentNode.removeChild(k)});
        t.parentNode.insertBefore(k,t.nextSibling);
      } else {t.classList.add('offen')}
    });
  }
  kuerzen();

  // David 07.11.2026: kein spaetes Nachladen beim Scrollen. Kritik 07.11. abends: in Seitenreihenfolge laden,
  // hoechstens 6 gleichzeitig (sonst teilen sich alle Bilder die Leitung und das naechste kommt zu spaet).
  // Die grossen Galeriebilder erst danach oder sobald jemand die Galerie anfasst. IntersectionObserver als Netz:
  // was sich auf 2500 px naehert, laedt sofort, egal wo die Schlange gerade steht.
  function eager(i){if(i.loading==='lazy'){i.loading='eager'}}
  function fertig(i){return i.complete&&i.naturalWidth>0}
  var vorgeladen={};
  function vorladen(src){if(!src||vorgeladen[src])return;vorgeladen[src]=1;var im=new Image();im.decoding='async';im.src=src}
  function galerieLaden(){knoepfe.forEach(function(b){vorladen(b.dataset.src)})}
  if(haupt){haupt.addEventListener('touchstart',function(){
    var i=knoepfe.findIndex(function(k){return k.getAttribute('aria-current')==='true'});
    [1,-1,2].forEach(function(d){var k=knoepfe[(i+d+knoepfe.length)%knoepfe.length];if(k)vorladen(k.dataset.src)});
  },{passive:true});}
  function allesLaden(){
    var alle=$$('img[loading="lazy"]'),SCHUB=6;
    // unsichtbare Bilder (Galerie-Daumen am Handy) ans Ende der Schlange
    var schlange=alle.filter(function(i){return i.offsetParent!==null}).concat(alle.filter(function(i){return i.offsetParent===null}));
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){eager(e.target);io.unobserve(e.target)}})},{rootMargin:'2500px 0px'});
      alle.forEach(function(i){io.observe(i)});
    }
    // Hoechstens SCHUB Bilder gleichzeitig unterwegs; jedes fertige Bild gibt den Platz an das naechste in Seitenreihenfolge
    var unterwegs=0,galerie=false;
    function weiter(){
      while(unterwegs<SCHUB&&schlange.length){
        var i=schlange.shift();
        if(fertig(i))continue;
        unterwegs++;
        (function(i){var f=function(){i.removeEventListener('load',f);i.removeEventListener('error',f);unterwegs--;weiter()};
          i.addEventListener('load',f);i.addEventListener('error',f);eager(i);
          if(fertig(i))f();})(i);
      }
      if(!schlange.length&&!unterwegs&&!galerie){galerie=true;galerieLaden()}
    }
    weiter();
  }
  // Start, sobald das erste Galeriebild da ist (nicht erst beim load-Ereignis der ganzen Seite)
  var gestartet=false;
  function los(){if(gestartet)return;gestartet=true;setTimeout(allesLaden,0)}
  if(document.readyState==='complete'||(haupt&&fertig(haupt))){los()}
  else{if(haupt){haupt.addEventListener('load',los);haupt.addEventListener('error',los)}addEventListener('load',los)}

  // Vorschau: kein Kauf
  $$('[data-kauf]').forEach(function(k){
    k.addEventListener('click',function(ev){
      ev.preventDefault();
      var h=$('.hinweis'); if(h){h.classList.add('zeigen');}
      if(k.closest('.klebe')){window.scrollTo({top:0,behavior:'smooth'});}
    });
  });

  // Sticky ab 15 % Scrolltiefe, aber nur wenn der Kaufknopf aus dem Bild ist
  var klebe=$('.klebe'), knopf=$('.produkt [data-kauf]');
  if(klebe&&knopf){
    var pruef=function(){
      var tief=window.scrollY/(document.documentElement.scrollHeight-innerHeight||1);
      var weg=knopf.getBoundingClientRect().bottom<0;
      klebe.classList.toggle('an',tief>0.15&&weg);
    };
    addEventListener('scroll',pruef,{passive:true}); pruef();
  }
})();
