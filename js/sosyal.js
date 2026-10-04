/* Gönderiler feed.json'dan gelir. Dosyayı scripts/fetch_feed.py üretir; GitHub Actions 30 dakikada bir çalıştırır.
   Alanlar: platform, tarih (YYYY-AA-GG), metin, gorsel (resim adresi), etkilesim, link */
var FEED_URL = "feed.json";
(function(){
  var names={instagram:["ig","pf-ig","Instagram"],youtube:["yt","pf-yt","YouTube"],x:["x","pf-x","X"],facebook:["fb","pf-fb","Facebook"]};
  var feed=document.getElementById("feed"), current="hepsi", data=null;
  var df=new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",year:"numeric"});
  function esc(s){var d=document.createElement("div");d.textContent=s||"";return d.innerHTML;}
  function render(){
    if(!data){feed.innerHTML='<p class="muted">Gönderiler yükleniyor…</p>';return;}
    var list=data.filter(function(p){return current==="hepsi"||p.platform===current;})
      .sort(function(a,b){return b.tarih.localeCompare(a.tarih);});
    if(!list.length){feed.innerHTML='<p class="muted">'+(current==="hepsi"?"Henüz gönderi yok. Yukarıdaki hesaplardan bizi takip edin.":"Bu platformda henüz gönderi yok.")+'</p>';return;}
    feed.innerHTML=list.map(function(p){
      var n=names[p.platform]||["?","",p.platform];
      var img=p.gorsel?'<img class="post-img" src="'+esc(p.gorsel)+'" alt="" loading="lazy" referrerpolicy="no-referrer" style="aspect-ratio:'+(p.platform==="youtube"?"16/9":"1")+'" onerror="this.remove()">':"";
      return '<article class="card post">'+img+'<div class="post-body"><div class="post-top"><span class="pf '+n[1]+'" aria-hidden="true"><svg width="24" height="24" fill="#fff"><use href="#i-'+n[0]+'"/></svg></span><strong>'+n[2]+'</strong><time datetime="'+esc(p.tarih)+'">'+df.format(new Date(p.tarih))+'</time></div><p>'+esc(p.metin)+'</p><div class="post-stats"><span>'+esc(p.etkilesim)+'</span><a href="'+esc(p.link)+'" target="_blank" rel="noopener">Gönderiyi aç</a></div></div></article>';
    }).join("");
  }
  document.querySelectorAll(".chip").forEach(function(ch){ch.addEventListener("click",function(){
    document.querySelectorAll(".chip").forEach(function(x){x.setAttribute("aria-pressed","false");});
    ch.setAttribute("aria-pressed","true"); current=ch.dataset.p; render();
  });});
  render();
  fetch(FEED_URL,{cache:"no-cache"}).then(function(r){return r.json();})
    .then(function(j){data=Array.isArray(j)?j:[];render();})
    .catch(function(){data=[];render();});

})();
