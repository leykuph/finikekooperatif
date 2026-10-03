var FEED_URL = ""; // ör. "/feed.json"
/* Örnek gönderiler. Alanlar: platform, tarih (YYYY-AA-GG), metin, gorsel (ph-* sınıfı), etkilesim, link */
var POSTS = [
  {platform:"instagram",tarih:"2026-12-02",metin:"Sezonun ilk hasadı başladı. Bu sabah ortak üreticilerimizin bahçelerinden ilk kasalar paketleme tesisine ulaştı.",gorsel:"ph-grove",etkilesim:"",link:"#"},
  {platform:"youtube",tarih:"2026-11-28",metin:"Bir Finike portakalı bahçeden sofraya nasıl gelir? Hasat, ayıklama ve paketleme 6 dakikada.",gorsel:"ph-hills",etkilesim:"",link:"#"},
  {platform:"facebook",tarih:"2026-11-20",metin:"Ağaç sahiplenme dönemi açıldı. Bahçe Ortağı paketiyle 5 ağacın hasadı sizin.",gorsel:"ph-gift",etkilesim:"",link:"#"},
  {platform:"x",tarih:"2026-11-15",metin:"Hatırlatma: Gerçek Finike portakalının kasasında coğrafi işaret amblemi bulunur. Etiketi olmayan 'Finike' satışlarını bize bildirin.",gorsel:"",etkilesim:"",link:"#"},
  {platform:"instagram",tarih:"2026-11-10",metin:"Kooperatif mutfağında bu hafta: portakal kabuğu reçeli. Tarifi sitemizin Tarifler sayfasında.",gorsel:"ph-jar",etkilesim:"",link:"#"},
  {platform:"instagram",tarih:"2026-11-02",metin:"İnce kabuk, çekirdeksiz dilim. Kesit fotoğrafı her şeyi anlatıyor.",gorsel:"ph-peel",etkilesim:"",link:"#"}
];
(function(){
  var names={instagram:["IG","pf-ig","Instagram"],youtube:["YT","pf-yt","YouTube"],x:["X","pf-x","X"],facebook:["FB","pf-fb","Facebook"]};
  var feed=document.getElementById("feed"), current="hepsi", data=POSTS;
  var df=new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",year:"numeric"});
  function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML;}
  function render(){
    var list=data.filter(function(p){return current==="hepsi"||p.platform===current;})
      .sort(function(a,b){return b.tarih.localeCompare(a.tarih);});
    if(!list.length){feed.innerHTML='<p class="muted">Bu platformda henüz gönderi yok.</p>';return;}
    feed.innerHTML=list.map(function(p){
      var n=names[p.platform]||["?","",p.platform];
      var img=p.gorsel?'<div class="ph '+p.gorsel+'" style="aspect-ratio:'+(p.platform==="youtube"?"16/9":"1")+'" role="img" aria-label="Gönderi görseli"><span class="ph-label">Gönderi görseli</span></div>':"";
      return '<article class="card post">'+img+'<div class="post-body"><div class="post-top"><span class="pf '+n[1]+'" aria-hidden="true">'+n[0]+'</span><strong>'+n[2]+'</strong><time datetime="'+p.tarih+'">'+df.format(new Date(p.tarih))+'</time></div><p>'+esc(p.metin)+'</p><div class="post-stats"><span>'+esc(p.etkilesim)+'</span><a href="'+esc(p.link)+'" target="_blank" rel="noopener">Gönderiyi aç</a></div></div></article>';
    }).join("");
  }
  document.querySelectorAll(".chip").forEach(function(ch){ch.addEventListener("click",function(){
    document.querySelectorAll(".chip").forEach(function(x){x.setAttribute("aria-pressed","false");});
    ch.setAttribute("aria-pressed","true"); current=ch.dataset.p; render();
  });});
  render();
  if(FEED_URL){
    fetch(FEED_URL).then(function(r){return r.json();}).then(function(j){
      if(Array.isArray(j)&&j.length){data=j;document.getElementById("feed-mode").textContent="Canlı akış";render();}
    }).catch(function(){});
  }
})();
