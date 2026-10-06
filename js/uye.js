/* Ortak girişi ve ortak paneli. Oturum çerezi API alan adında, HttpOnly olarak tutulur. */
(function(){
  /* Çerez için site ile API aynı alan adı altında olmalı: finikekooperatifi.com -> api.finikekooperatifi.com */
  var host = location.hostname;
  var API = /^(localhost|127\.0\.0\.1)$/.test(host) ? "http://localhost:8787"
    : /(^|\.)finikekooperatifi\.com$/.test(host) ? "https://api.finikekooperatifi.com"
    : "https://finike-api.leykuph.com";
  var NET_ERR = "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";

  function api(method, path, body){
    return fetch(API + path, {
      method: method, credentials: "include",
      headers: body ? {"Content-Type": "application/json"} : {},
      body: body ? JSON.stringify(body) : undefined
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(data){ data.status = r.status; return data; });
    });
  }
  window.uyeApi = api;
  window.uyeNetErr = NET_ERR;
  function show(el, text, cls){ el.className = "notice" + (cls ? " " + cls : ""); el.textContent = text; el.hidden = false; el.focus(); }
  function busy(btn, on, label){ btn.disabled = on; btn.textContent = label; }

  document.querySelectorAll(".pw-toggle").forEach(function(b){
    b.addEventListener("click", function(){
      var input = document.getElementById(b.getAttribute("aria-controls")), on = input.type === "password";
      input.type = on ? "text" : "password"; b.textContent = on ? "Gizle" : "Göster"; b.setAttribute("aria-pressed", on);
    });
  });

  /* ---------- Giriş sayfası ---------- */
  var login = document.getElementById("giris-form");
  if (login) {
    var err = document.getElementById("giris-hata"), btn = document.getElementById("giris-btn");
    api("GET", "/auth/me").then(function(d){ if (d.member) location.replace("/ortak"); }).catch(function(){});
    login.addEventListener("submit", function(e){
      e.preventDefault();
      var no = login.elements.memberNo.value.trim(), pw = login.elements.password.value;
      if (!no || !pw) { show(err, "Kullanıcı adınızı ve şifrenizi yazın.", "bad"); return; }
      err.hidden = true; busy(btn, true, "Giriş yapılıyor…");
      api("POST", "/auth/login", {memberNo: no, password: pw}).then(function(d){
        if (d.member) { location.href = d.member.mustChangePassword ? "/ortak#sifre" : "/ortak"; return; }
        show(err, d.error || NET_ERR, "bad"); busy(btn, false, "Giriş yap");
      }).catch(function(){ show(err, NET_ERR, "bad"); busy(btn, false, "Giriş yap"); });
    });
  }

  /* ---------- Ortak paneli ---------- */
  var panel = document.getElementById("panel");
  if (panel) {
    var loading = document.getElementById("yukleniyor");
    api("GET", "/auth/me").then(function(d){
      if (!d.member) { location.replace("/giris"); return; }
      document.getElementById("ad-soyad").textContent = d.member.fullName;
      document.getElementById("ortak-no-goster").textContent = d.member.memberNo;
      document.getElementById("sifre-uyari").hidden = !d.member.mustChangePassword;
      document.getElementById("yonetim-link").hidden = !d.member.isAdmin;
      loading.hidden = true; panel.hidden = false;
      if (d.member.mustChangePassword) document.getElementById("mevcut-sifre").focus();
      else openParcels();
    }).catch(function(){ loading.textContent = NET_ERR; });

    document.getElementById("cikis-btn").addEventListener("click", function(){
      api("POST", "/auth/logout", {}).finally(function(){ location.href = "/giris"; });
    });

    // Parseller yalnızca kalıcı şifreyle açılır (js/parsel.js)
    var openParcels = function(){
      var sec = document.getElementById("parsellerim");
      if (!sec.hidden) return;
      sec.hidden = false; document.dispatchEvent(new Event("parseller:ac"));
    };

    var form = document.getElementById("sifre-form"), msg = document.getElementById("sifre-mesaj"), sbtn = document.getElementById("sifre-btn");
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var cur = document.getElementById("mevcut-sifre").value, n1 = document.getElementById("yeni-sifre").value, n2 = document.getElementById("yeni-sifre-2").value;
      if (!cur) { show(msg, "Mevcut şifrenizi yazın.", "bad"); return; }
      if (n1.length < 8) { show(msg, "Yeni şifre en az 8 karakter olmalı.", "bad"); return; }
      if (n1 !== n2) { show(msg, "Yeni şifreler birbiriyle aynı değil.", "bad"); return; }
      busy(sbtn, true, "Kaydediliyor…");
      api("POST", "/auth/password", {currentPassword: cur, newPassword: n1}).then(function(d){
        busy(sbtn, false, "Şifreyi kaydet");
        if (d.status === 401) { location.replace("/giris"); return; }
        if (!d.ok) { show(msg, d.error || NET_ERR, "bad"); return; }
        form.reset(); document.getElementById("sifre-uyari").hidden = true; openParcels();
        show(msg, "Şifreniz değişti. Başka cihazlarda açık kalan oturumlar kapatıldı.", "ok");
      }).catch(function(){ busy(sbtn, false, "Şifreyi kaydet"); show(msg, NET_ERR, "bad"); });
    });
  }
})();
