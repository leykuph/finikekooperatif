/* Kooperatif API'si (ortak girişi, iletişim formu). Çerez için site ile API aynı alan adı altında olmalı. */
window.API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://localhost:8787"
  : /(^|\.)finikekooperatifi\.com$/.test(location.hostname) ? "https://api.finikekooperatifi.com"
  : "https://finike-api.leykuph.com";
/* Adres çubuğunda .html görünmesin: /sosyal.html -> /sosyal, /index.html -> / */
(function(){
  var p=location.pathname;
  if(/\.html$/.test(p)&&history.replaceState){
    history.replaceState(null,"",p.replace(/(^|\/)index\.html$/,"$1").replace(/\.html$/,"")+location.search+location.hash);
  }
})();
(function(){
  var y=document.getElementById("yil"); if(y) y.textContent=new Date().getFullYear();
})();
