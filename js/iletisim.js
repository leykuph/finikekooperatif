(function(){
  var form=document.getElementById("form"), summary=document.getElementById("form-summary"), ok=document.getElementById("form-ok");
  var msg=document.getElementById("mesaj"), cnt=document.getElementById("mesaj-count");
  msg.addEventListener("input",function(){cnt.textContent=msg.value.length+" / 1500";});
  var rules={
    ad:function(v){return v.trim().split(/\s+/).length>=2;},
    eposta:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());},
    telefon:function(v){var d=v.replace(/\D/g,"");return d===""||d.length===10||d.length===11||(d.length===12&&d.indexOf("90")===0);},
    konu:function(v){return v!=="";},
    mesaj:function(v){return v.trim().length>=20;},
    kvkk:function(v,el){return el.checked;}
  };
  function check(name){
    var el=form.elements[name], wrap=form.querySelector('[data-field="'+name+'"]');
    var good=rules[name](el.value,el);
    wrap.classList.toggle("has-error",!good); el.setAttribute("aria-invalid",good?"false":"true");
    return good;
  }
  Object.keys(rules).forEach(function(n){
    var el=form.elements[n];
    el.addEventListener("blur",function(){ if(el.value||n==="kvkk") check(n); });
    el.addEventListener("input",function(){ if(el.closest(".field").classList.contains("has-error")) check(n); });
    el.addEventListener("change",function(){ if(el.closest(".field").classList.contains("has-error")) check(n); });
  });
  form.addEventListener("submit",function(e){
    e.preventDefault(); ok.hidden=true;
    var bad=Object.keys(rules).filter(function(n){return !check(n);});
    if(bad.length){
      summary.hidden=false;
      summary.textContent=bad.length+" alanı düzeltmeniz gerekiyor. İşaretli alanlara bakın.";
      form.elements[bad[0]].focus(); return;
    }
    summary.hidden=true;
    var btn=document.getElementById("send"); btn.disabled=true; btn.textContent="Gönderiliyor…";
    var done=function(text,cls){ok.className="notice "+cls;ok.textContent=text;ok.hidden=false;btn.disabled=false;btn.textContent="Mesajı gönder";};
    fetch(window.API_BASE+"/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))})
      .then(function(r){ return r.json().catch(function(){return {};}).then(function(d){
        if(!r.ok){ done((d.error||"Mesaj gönderilemedi.")+" Dilerseniz info@finikekooperatifi.com adresine e-posta ile yazın.","bad"); return; }
        form.reset(); cnt.textContent="0 / 1500"; done("Mesajınız ulaştı. İki iş günü içinde dönüş yapacağız.","ok");
      }); })
      .catch(function(){ done("Mesaj gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin ya da info@finikekooperatifi.com adresine e-posta ile yazın.","bad"); });
  });
  document.querySelectorAll(".copy").forEach(function(b){b.addEventListener("click",function(){
    var el=document.getElementById(b.dataset.copy), t=el.textContent;
    var sel=function(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="Seçildi";};
    if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){b.textContent="Kopyalandı";},sel);}else sel();
    setTimeout(function(){b.textContent="Kopyala";},1800);
  });});
})();
