/* Ana sayfa hareketleri. İçerik varsayılan olarak görünür; hareket yalnızca JS çalışırsa ve
   ziyaretçi "hareketi azalt" demediyse eklenir. */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root=document.documentElement; root.classList.add("motion");
  var vh=innerHeight;
  addEventListener("resize",function(){vh=innerHeight;},{passive:true});

  /* Hero baskıları: kaydırmada derinliğe göre kayar, imleçle salınır */
  var hero=document.querySelector(".hero"), prints=[].slice.call(document.querySelectorAll(".hero-prints .print"));
  var px=0, py=0, tx=0, ty=0, heroOn=true;
  var fine=matchMedia("(hover: hover) and (pointer: fine)").matches;
  if(fine) hero.addEventListener("pointermove",function(e){
    var r=hero.getBoundingClientRect();
    tx=(e.clientX-r.left)/r.width-.5; ty=(e.clientY-r.top)/r.height-.5;
  });
  hero.addEventListener("pointerleave",function(){tx=0;ty=0;});

  /* Hikâye ve ova fotoğrafları görünüme girerken yerine oturur */
  var settles=[].slice.call(document.querySelectorAll(".geo .ph,.story .ph"));

  var queued=false;
  function kick(){if(!queued){queued=true;requestAnimationFrame(frame);}}
  function frame(){
    queued=false;
    var y=scrollY;
    if(heroOn){
      px+=(tx-px)*.08; py+=(ty-py)*.08;
      prints.forEach(function(p){
        var d=+p.dataset.depth;
        p.style.setProperty("--mx",(px*d*36).toFixed(2)+"px");
        p.style.setProperty("--my",(py*d*28-y*d*.35).toFixed(2)+"px");
      });
    }
    settles.forEach(function(el){
      var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
      var t=Math.min(1,Math.max(0,(vh-r.top)/(vh*.8)));           /* 0: alttan giriyor, 1: yerinde */
      var geo=!!el.closest(".geo");
      el.style.rotate=((1-t)*(geo?-7:6)+(geo?-1.5:-2)).toFixed(2)+"deg";
      el.style.translate="0 "+((1-t)*40).toFixed(1)+"px";
    });
    if(heroOn&&(Math.abs(tx-px)>.001||Math.abs(ty-py)>.001)) kick(); /* imleç salınımı oturana kadar */
  }
  addEventListener("scroll",kick,{passive:true});
  hero.addEventListener("pointermove",kick);
  hero.addEventListener("pointerleave",kick);
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){heroOn=es[0].isIntersecting;}).observe(hero);
  }
  kick();

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
