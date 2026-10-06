/* Kooperatif API'si (ortak girişi, iletişim formu). Çerez için site ile API aynı alan adı altında olmalı. */
window.API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8787"
  : /(^|\.)finikekooperatifi\.com$/.test(location.hostname) ? "https://api.finikekooperatifi.com"
  : "https://finike-api.leykuph.com";
/* Bülten gönderim adresi: bülten sistemi kurulunca yazın. Boşken bülten formu yalnızca doğrulama yapar. */
window.FORM_ENDPOINT = "";
/* Adres çubuğunda .html görünmesin: /sosyal.html -> /sosyal, /index.html -> / */
(function(){
  var p=location.pathname;
  if(/\.html$/.test(p)&&history.replaceState){
    history.replaceState(null,"",p.replace(/(^|\/)index\.html$/,"$1").replace(/\.html$/,"")+location.search+location.hash);
  }
})();
(function(){
  var y=document.getElementById("yil"); if(y) y.textContent=new Date().getFullYear();
  var f=document.getElementById("news-form"), m=document.getElementById("news-msg");
  if(!f) return;
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var v=document.getElementById("news-email").value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){ m.textContent="Geçerli bir e-posta adresi yazın (ör. ad@alanadi.com)."; return; }
    m.textContent = window.FORM_ENDPOINT ? "Teşekkürler, bültene eklendiniz." : "Adres geçerli. Bülten sistemi bağlandığında kaydınız alınacak.";
    f.reset();
  });
})();
