/* Hero banner'ı: yana kayan büyük fotoğraflar. Oklar, noktalar, klavye ve kaydırma ile gezilir;
   6 sn'de bir kendiliğinden ilerler. Üzerine gelince, odaklanınca, sekme gizliyken ve ekran dışındayken
   durur. "Hareketi azalt" açıksa kendiliğinden ilerlemez. */
(function(){
  var hero=document.querySelector(".hero"); if(!hero) return;
  var track=hero.querySelector(".slides-track"), slides=[].slice.call(hero.querySelectorAll(".slide"));
  var dotsBox=hero.querySelector(".dots"), n=slides.length, i=0, timer=null, hold=false, seen=true;
  var still=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dots=slides.map(function(_,k){
    var d=document.createElement("button"); d.type="button"; d.className="dot";
    d.setAttribute("aria-label",(k+1)+". slayt"); d.addEventListener("click",function(){go(k);restart();});
    dotsBox.appendChild(d); return d;
  });
  function go(k){
    i=(k+n)%n;
    track.style.transform="translateX("+(-100*i)+"%)";
    slides.forEach(function(s,j){
      var on=j===i; s.classList.toggle("is-active",on);
      if(on){s.removeAttribute("aria-hidden");s.removeAttribute("inert");}else{s.setAttribute("aria-hidden","true");s.setAttribute("inert","");}
    });
    dots.forEach(function(d,j){d.setAttribute("aria-current",j===i?"true":"false");});
  }
  function tick(){if(!hold&&seen&&!document.hidden) go(i+1);}
  function restart(){if(still) return; clearInterval(timer); timer=setInterval(tick,6000);}
  hero.querySelector(".prev").addEventListener("click",function(){go(i-1);restart();});
  hero.querySelector(".next").addEventListener("click",function(){go(i+1);restart();});
  hero.addEventListener("mouseenter",function(){hold=true;});
  hero.addEventListener("mouseleave",function(){hold=false;});
  hero.addEventListener("focusin",function(){hold=true;});
  hero.addEventListener("focusout",function(){hold=false;});
  hero.addEventListener("keydown",function(e){
    if(e.key==="ArrowLeft"){go(i-1);restart();} else if(e.key==="ArrowRight"){go(i+1);restart();}
  });
  /* dokunmatik kaydırma */
  var x0=null;
  hero.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse") x0=e.clientX;});
  hero.addEventListener("pointerup",function(e){
    if(x0===null) return; var dx=e.clientX-x0; x0=null;
    if(Math.abs(dx)>50){go(i+(dx<0?1:-1));restart();}
  });
  if("IntersectionObserver" in window) new IntersectionObserver(function(es){seen=es[0].isIntersecting;}).observe(hero);
  go(0); restart();
})();

/* Ana sayfa hareketleri. İçerik varsayılan olarak görünür; hareket yalnızca JS çalışırsa ve
   ziyaretçi "hareketi azalt" demediyse eklenir. */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root=document.documentElement; root.classList.add("motion");
  var vh=innerHeight;
  addEventListener("resize",function(){vh=innerHeight;},{passive:true});

  /* Hikâye ve ova fotoğrafları görünüme girerken yerine oturur */
  var settles=[].slice.call(document.querySelectorAll(".geo .ph,.story .ph")), queued=false;
  function frame(){
    queued=false;
    settles.forEach(function(el){
      var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      var t=Math.min(1,Math.max(0,(vh-r.top)/(vh*.8)));           /* 0: alttan giriyor, 1: yerinde */
      var geo=!!el.closest(".geo");
      el.style.rotate=((1-t)*(geo?-7:6)+(geo?-1.5:-2)).toFixed(2)+"deg";
      el.style.translate="0 "+((1-t)*40).toFixed(1)+"px";
    });
  }
  addEventListener("scroll",function(){if(!queued){queued=true;requestAnimationFrame(frame);}},{passive:true});
  frame();

  /* Banner derinliği: fotoğraf yazıdan yavaş kayar, yazı hafifçe solar. Süzülen dilimler kendi
     derinliklerinde kayar. */
  var heroEl=document.querySelector(".hero"), copies=[].slice.call(document.querySelectorAll(".slide-copy"));
  var fls=[].slice.call(document.querySelectorAll(".fl")), fark=document.getElementById("fark"), dq=false;
  function depth(){
    dq=false;
    var y=scrollY;
    if(heroEl&&y<heroEl.offsetHeight){
      heroEl.style.setProperty("--hero-py",(y*.35).toFixed(1)+"px");
      var o=Math.max(0,1-y/(heroEl.offsetHeight*.75)).toFixed(3);
      copies.forEach(function(c){c.style.opacity=o;});
    }
    if(fark&&fls.length){
      var r=fark.getBoundingClientRect();
      if(r.bottom>0&&r.top<vh) fls.forEach(function(f){f.style.setProperty("--fy",(-(r.top-vh/2)*(+f.dataset.depth)).toFixed(1)+"px");});
    }
  }
  addEventListener("scroll",function(){if(!dq){dq=true;requestAnimationFrame(depth);}},{passive:true});
  depth();

  /* Kaydırınca belirme: başlıklar, metinler, rakamlar, özellikler, zaman çizelgesi, SSS. Listeler sırayla. */
  if("IntersectionObserver" in window){
    var groups=[[".stat",.08],[".trait",.07],[".timeline li",.1],[".faq details",.07],[".checklist li",.07]];
    var singles=".section-head, .geo .stack, .story .stack, .reviews";
    [].forEach.call(document.querySelectorAll(singles),function(el){el.classList.add("reveal");});
    groups.forEach(function(g){[].forEach.call(document.querySelectorAll(g[0]),function(el,k){
      el.classList.add("reveal"); el.style.setProperty("--d",Math.min(k*g[1],.5).toFixed(2)+"s");
    });});
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add("in");ro.unobserve(e.target);}
    });},{threshold:.12,rootMargin:"0px 0px -6% 0px"});
    [].forEach.call(document.querySelectorAll(".reveal"),function(el){ro.observe(el);});
  }

  /* Kayan şerit ekran dışındayken durur */
  var ribbon=document.querySelector(".ribbon");
  if(ribbon&&"IntersectionObserver" in window){
    new IntersectionObserver(function(es){ribbon.classList.toggle("paused",!es[0].isIntersecting);}).observe(ribbon);
  }

  /* Yorum kartları: sonsuz kayan karosel. Kartlar HTML'de bir kez yazılır; döngü için kopyaları
     burada eklenir (ekran okuyucudan gizli, tıklanamaz). Üzerine gelince veya odaklanınca durur. */
  var rv=document.querySelector(".reviews");
  if(rv&&rv.children.length){
    var cards=[].slice.call(rv.children), track=document.createElement("div");
    track.className="reviews-track";
    cards.forEach(function(c){track.appendChild(c);});
    rv.appendChild(track); rv.classList.add("is-marquee");
    var setW=track.scrollWidth, reps=Math.max(1,Math.ceil(rv.clientWidth/setW));
    for(var i=1;i<reps*2;i++) cards.forEach(function(c){
      var k=c.cloneNode(true); k.setAttribute("aria-hidden","true"); k.setAttribute("inert",""); track.appendChild(k);
    });
    track.style.setProperty("--dur",(setW*reps/28).toFixed(0)+"s"); /* ~28px/sn */
    if("IntersectionObserver" in window) new IntersectionObserver(function(es){rv.classList.toggle("paused",!es[0].isIntersecting);}).observe(rv);
  }

  /* Özellik tikleri liste görünüme girince sırayla çizilir */
  var traits=document.querySelector(".traits");
  if(traits&&"IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){traits.classList.add("in");io.disconnect();}},{threshold:.25});
    io.observe(traits);
  } else if(traits) traits.classList.add("in");

  /* Rakamlar görünüme girince sayarak gelir */
  [].forEach.call(document.querySelectorAll(".stat-value"),function(el){
    var node=el.firstChild; if(!node||node.nodeType!==3) return;
    var raw=node.textContent.trim(), m=raw.match(/^[\d.,]+$/); if(!m||/^\d{4}$/.test(raw)) return;
    var dec=(raw.split(",")[1]||"").length, target=parseFloat(raw.replace(/\./g,"").replace(",","."));
    var nf=new Intl.NumberFormat("tr-TR",{minimumFractionDigits:dec,maximumFractionDigits:dec});
    if(el.getBoundingClientRect().top>vh) node.textContent=nf.format(0);
    var o=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting) return; o.disconnect();
      var t0=performance.now(), dur=1400;
      (function tick(now){
        var k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,4);
        node.textContent=k<1?nf.format(target*e):raw;
        if(k<1) requestAnimationFrame(tick);
      })(t0);
    },{threshold:.6});
    o.observe(el);
  });
})();
