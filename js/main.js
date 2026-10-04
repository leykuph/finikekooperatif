/* Form gönderim adresi: canlıya alırken sunucu uç noktanızı yazın. Boşken formlar yalnızca doğrulama yapar. */
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
