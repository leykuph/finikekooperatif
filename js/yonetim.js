/* Yönetim paneli: Ortaklar (/yonetim) ve Parseller (/yonetim-parseller). Yalnızca yönetici hesapları. */
(function(){
  var api = window.uyeApi, P = window.Parsel, el = P.el, dekar = P.dekar, label = P.label, show = P.show;
  var loading = document.getElementById("yukleniyor");

  var STATUS = {
    "aktif": "Aktif", "ilk-giris": "İlk giriş bekliyor", "kilitli": "Kilitli",
    "suresi-doldu": "İlk şifre süresi doldu", "kapali": "Kapalı"
  };
  function date(v, withTime){
    if (!v) return "-";
    var o = {day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Istanbul"};
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return new Date(v).toLocaleString("tr-TR", o);
  }
  function fold(s){ return String(s || "").toLocaleLowerCase("tr-TR"); }
  function pill(status){ return el("span", {"class": "durum durum-" + status, text: STATUS[status] || status}); }
  function totalArea(parcels){ return parcels.reduce(function(a, p){ return a + (p.areaM2 || 0); }, 0); }

  // Excel Türkçe ayarlarda ";" ayırıcı ve UTF-8 BOM ile doğrudan açar.
  function downloadCsv(name, rows){
    var q = function(v){ v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var csv = "﻿" + rows.map(function(r){ return r.map(q).join(";"); }).join("\r\n");
    var a = el("a", {href: URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"})), download: name + "-" + new Date().toISOString().slice(0, 10) + ".csv"});
    document.body.appendChild(a); a.click(); a.remove();
  }
  function areaCell(m2){ return m2 == null ? "" : String(Math.round(m2 * 100) / 100).replace(".", ","); }

  function dialog(id){
    var d = document.getElementById(id);
    d.querySelectorAll("[data-kapat]").forEach(function(b){ b.addEventListener("click", function(){ d.close(); }); });
    d.addEventListener("click", function(e){ if (e.target === d) d.close(); });   // arka plana tıklayınca kapanır
    return d;
  }

  document.querySelectorAll(".cikis-link").forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      api("POST", "/auth/logout", {}).finally(function(){ location.href = "/giris"; });
    });
  });

  // Erişim: oturum yoksa girişe, yönetici değilse ya da şifre henüz belirlenmediyse ortak paneline.
  function guard(load){
    api("GET", "/auth/me").then(function(d){
      if (!d.member) { location.replace("/giris"); return; }
      if (!d.member.isAdmin || d.member.mustChangePassword) { location.replace("/ortak"); return; }
      load();
    }).catch(function(){ loading.textContent = window.uyeNetErr; });
  }

  /* ---------- Ortaklar ---------- */
  var membersRoot = document.getElementById("ortaklar-sayfa");
  if (membersRoot) {
    var members = [], search = document.getElementById("ara"), filter = document.getElementById("durum-filtre");
    var tbody = document.getElementById("ortak-satirlar"), empty = document.getElementById("bos");

    var load = function(){
      return api("GET", "/admin/members").then(function(d){
        if (!d.members) { loading.textContent = d.error || window.uyeNetErr; return; }
        members = d.members; loading.hidden = true; membersRoot.hidden = false; render();
      }).catch(function(){ loading.textContent = window.uyeNetErr; });
    };
    guard(load);

    function render(){
      var counts = {};
      members.forEach(function(m){ counts[m.status] = (counts[m.status] || 0) + 1; });
      document.getElementById("ozet-satir").textContent = members.length + " ortak" +
        Object.keys(STATUS).filter(function(k){ return counts[k]; }).map(function(k){ return " · " + counts[k] + " " + STATUS[k].toLocaleLowerCase("tr-TR"); }).join("");

      var q = fold(search.value.trim()), st = filter.value;
      var rows = members.filter(function(m){
        return (!st || m.status === st) && (!q || fold(m.fullName).indexOf(q) >= 0 || m.memberNo.indexOf(q) >= 0);
      });
      tbody.textContent = "";
      rows.forEach(function(m){
        var open = el("button", {"class": "satir-ac", type: "button", text: m.fullName});
        open.addEventListener("click", function(){ openMember(m); });
        var tr = el("tr", {"class": "tiklanir"}, [
          el("td", {}, [open, m.isAdmin ? el("span", {"class": "etiket", text: "yönetici"}) : null]),
          el("td", {text: m.memberNo}), el("td", {}, [pill(m.status)]),
          el("td", {"class": "num", text: String(m.parcels.length)}),
          el("td", {"class": "num", text: m.parcels.length ? dekar(totalArea(m.parcels)) : "-"}),
          el("td", {text: date(m.lastLoginAt, true)})
        ]);
        tr.addEventListener("click", function(e){ if (e.target !== open) openMember(m); });
        tbody.appendChild(tr);
      });
      empty.hidden = rows.length > 0;
    }
    search.addEventListener("input", render);
    filter.addEventListener("change", render);

    var memberDlg = dialog("ortak-pencere");
    function openMember(m){
      document.getElementById("ortak-baslik").textContent = m.fullName;
      var dl = document.getElementById("ortak-bilgi"); dl.textContent = "";
      [["Kullanıcı adı", m.memberNo], ["Durum", pill(m.status)], ["Yönetici", m.isAdmin ? "Evet" : "Hayır"],
       ["Kayıt tarihi", date(m.createdAt)], ["Kaydeden", m.createdBy || "Komut satırı"], ["Son giriş", date(m.lastLoginAt, true)]]
        .concat(m.initialPasswordExpiresAt ? [["İlk şifre son gün", date(m.initialPasswordExpiresAt)]] : [])
        .forEach(function(r){ dl.appendChild(el("div", {}, [el("dt", {text: r[0]}), typeof r[1] === "string" ? el("dd", {text: r[1]}) : el("dd", {}, [r[1]])])); });
      var box = document.getElementById("ortak-parseller"); box.textContent = "";
      if (!m.parcels.length) box.appendChild(el("p", {"class": "muted small", text: "Henüz parsel bildirmedi."}));
      else {
        box.appendChild(el("p", {"class": "muted small", text: m.parcels.length + " parsel · toplam " + dekar(totalArea(m.parcels))}));
        var ul = el("ul", {"class": "parsel-mini"});
        m.parcels.forEach(function(p){ ul.appendChild(el("li", {text: label(p) + " · " + (p.nitelik || "-") + " · " + (p.mevkii || "-") + " · " + dekar(p.areaM2)})); });
        box.appendChild(ul);
      }
      memberDlg.showModal();
    }

    document.getElementById("csv-btn").addEventListener("click", function(){
      var rows = [["Ad Soyad", "Kullanıcı adı", "Durum", "Yönetici", "Parsel sayısı", "Toplam alan (m²)", "Kayıt tarihi", "Son giriş"]];
      members.forEach(function(m){
        rows.push([m.fullName, m.memberNo, STATUS[m.status], m.isAdmin ? "evet" : "", m.parcels.length,
          areaCell(totalArea(m.parcels)), date(m.createdAt), m.lastLoginAt ? date(m.lastLoginAt, true) : ""]);
      });
      downloadCsv("ortaklar", rows);
    });

    /* Yeni ortak kaydı (açılır pencere) */
    var regDlg = dialog("kayit-pencere"), kf = document.getElementById("kayit-form"), kmsg = document.getElementById("kayit-mesaj");
    var kbtn = document.getElementById("kayit-btn"), result = document.getElementById("kayit-sonuc");
    var tcIn = document.getElementById("k-tc"), telIn = document.getElementById("k-tel"), counter = document.getElementById("k-tc-sayac");
    function resetForm(){ kf.reset(); counter.textContent = "0 / 11"; kmsg.hidden = true; kf.hidden = false; result.hidden = true; }
    document.getElementById("yeni-btn").addEventListener("click", function(){ resetForm(); regDlg.showModal(); document.getElementById("k-ad").focus(); });
    document.getElementById("yeni-kayit-btn").addEventListener("click", function(){ resetForm(); document.getElementById("k-ad").focus(); });

    function validTc(tc){
      if (!/^[1-9]\d{10}$/.test(tc)) return false;
      var d = tc.split("").map(Number), odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7];
      return ((odd * 7 - even) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce(function(a, b){ return a + b; }, 0) % 10 === d[10];
    }
    function mobile(v){ var d = v.replace(/^(90|0)/, ""); return /^5\d{9}$/.test(d) ? d : null; }
    // Yalnızca rakam; en fazla 11 hane (yapıştırılan metindeki boşluk ve işaretler atılır)
    [tcIn, telIn].forEach(function(inp){
      inp.addEventListener("input", function(){
        var v = inp.value.replace(/\D/g, "").slice(0, 11);
        if (v !== inp.value) inp.value = v;
        if (inp === tcIn) counter.textContent = v.length + " / 11";
      });
    });

    kf.addEventListener("submit", function(e){
      e.preventDefault();
      var first = document.getElementById("k-ad").value.trim(), last = document.getElementById("k-soyad").value.trim();
      var tc = tcIn.value, tel = telIn.value;
      if (!first || !last) { show(kmsg, "Ad ve soyadı yazın.", "bad"); return; }
      if (!validTc(tc)) { show(kmsg, "TC kimlik numarası geçersiz. 11 haneyi kontrol edin.", "bad"); tcIn.focus(); return; }
      if (!mobile(tel)) { show(kmsg, "Cep telefonu 05xx xxx xx xx biçiminde olmalı.", "bad"); telIn.focus(); return; }
      kmsg.hidden = true; kbtn.disabled = true; kbtn.textContent = "Kaydediliyor…";
      api("POST", "/admin/members", {firstName: first, lastName: last, tc: tc, phone: tel}).then(function(d){
        kbtn.disabled = false; kbtn.textContent = "Ortağı kaydet";
        if (!d.member) { show(kmsg, d.error || window.uyeNetErr, "bad"); return; }
        var phone = "90" + mobile(tel);
        document.getElementById("kayit-tamam").textContent = d.member.fullName + " kaydedildi. Kullanıcı adı: " + d.member.memberNo +
          (d.usernameTaken ? " (“" + d.usernameTaken + "” kullanımda olduğu için)" : "");
        document.getElementById("kayit-metin").textContent = d.message;
        document.getElementById("whatsapp-link").href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(d.message);
        document.getElementById("sms-link").href = "sms:+" + phone + "?body=" + encodeURIComponent(d.message);
        kf.reset(); kf.hidden = true; result.hidden = false; result.focus();
        load();
      }).catch(function(){ kbtn.disabled = false; kbtn.textContent = "Ortağı kaydet"; show(kmsg, window.uyeNetErr, "bad"); });
    });
    document.getElementById("kopyala-btn").addEventListener("click", function(){
      var b = this, t = document.getElementById("kayit-metin").textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ b.textContent = "Kopyalandı"; }, function(){ b.textContent = "Kopyalanamadı, metni seçin"; });
      setTimeout(function(){ b.textContent = "Mesajı kopyala"; }, 2000);
    });
  }

  /* ---------- Parseller ---------- */
  var parcelsRoot = document.getElementById("parseller-sayfa");
  if (parcelsRoot) {
    var all = [], map, layer, selected = null;
    var search2 = document.getElementById("ara"), mahalleSel = document.getElementById("mahalle-filtre");
    var tbody2 = document.getElementById("parsel-satirlar"), empty2 = document.getElementById("bos");

    guard(function(){
      api("GET", "/admin/parcels").then(function(d){
        if (!d.members) { loading.textContent = d.error || window.uyeNetErr; return; }
        d.members.forEach(function(m){ m.parcels.forEach(function(p){ all.push({m: m, p: p}); }); });
        loading.hidden = true; parcelsRoot.hidden = false;
        map = P.makeMap("harita"); layer = L.featureGroup().addTo(map);
        var names = {};
        all.forEach(function(x){ names[x.p.mahalle] = 1; });
        Object.keys(names).sort(function(a, b){ return a.localeCompare(b, "tr"); })
          .forEach(function(n){ mahalleSel.appendChild(el("option", {value: n, text: n})); });
        kpis(d.members); render(true);
      }).catch(function(){ loading.textContent = window.uyeNetErr; });
    });

    function kpis(memberList){
      // Birden fazla ortağın bildirdiği (hisseli) parsel toplamda bir kez sayılır.
      var unique = {};
      all.forEach(function(x){ unique[x.p.mahalleId + "/" + x.p.ada + "/" + x.p.parsel] = x.p.areaM2 || 0; });
      var keys = Object.keys(unique), total = keys.reduce(function(a, k){ return a + unique[k]; }, 0);
      var withParcels = memberList.filter(function(m){ return m.parcels.length; }).length;
      var box = document.getElementById("ozet");
      [["Ortak", memberList.length], ["Parsel bildiren", withParcels], ["Parsel", keys.length], ["Toplam alan", dekar(total)]].forEach(function(k){
        box.appendChild(el("div", {"class": "kpi"}, [el("span", {"class": "kpi-value", text: String(k[1])}), el("span", {"class": "kpi-label", text: k[0]})]));
      });
    }

    function visible(){
      var q = fold(search2.value.trim()), mh = mahalleSel.value;
      return all.filter(function(x){
        if (mh && x.p.mahalle !== mh) return false;
        if (!q) return true;
        return [x.m.fullName, x.m.memberNo, x.p.mevkii, x.p.nitelik, x.p.ada + "/" + x.p.parsel].some(function(s){ return fold(s).indexOf(q) >= 0; });
      });
    }

    function render(fit){
      var rows = visible();
      layer.clearLayers(); tbody2.textContent = ""; selected = null;
      rows.forEach(function(x){
        var shape = x.p.geometry ? L.geoJSON(x.p.geometry, {style: P.STYLE})
          .bindTooltip(x.m.fullName + " · " + label(x.p) + " · " + dekar(x.p.areaM2)).addTo(layer) : null;
        var go = el("button", {"class": "satir-ac", type: "button", text: x.m.fullName});
        var tr = el("tr", {"class": "tiklanir"}, [
          el("td", {}, [go]),
          el("td", {text: x.p.mahalle}),
          el("td", {}, [el("span", {text: x.p.ada + "/" + x.p.parsel}), x.p.shared ? el("span", {"class": "etiket", title: "Bu parseli birden fazla ortak bildirdi (hisseli olabilir).", text: "birden fazla ortakta"}) : null]),
          el("td", {text: x.p.nitelik || "-"}), el("td", {text: x.p.mevkii || "-"}),
          el("td", {"class": "num", text: dekar(x.p.areaM2)})
        ]);
        var focus = function(){
          if (!shape) return;
          tbody2.querySelectorAll("tr.secili").forEach(function(r){ r.classList.remove("secili"); });
          tr.classList.add("secili");
          if (selected) selected.setStyle(P.STYLE);
          selected = shape; shape.setStyle({color: "#FFFFFF", weight: 4, fillOpacity: .4}); shape.bringToFront();
          map.fitBounds(shape.getBounds(), {maxZoom: 18}); shape.openTooltip();
          document.getElementById("harita").scrollIntoView({behavior: "smooth", block: "center"});
        };
        go.addEventListener("click", focus);
        tr.addEventListener("click", function(e){ if (e.target !== go) focus(); });
        tbody2.appendChild(tr);
      });
      empty2.hidden = rows.length > 0;
      var total = rows.reduce(function(a, x){ return a + (x.p.areaM2 || 0); }, 0);
      document.getElementById("filtre-ozet").textContent = rows.length === all.length ? "" : rows.length + " parsel gösteriliyor · " + dekar(total);
      if ((fit || rows.length !== all.length) && layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 16, padding: [20, 20]});
    }
    search2.addEventListener("input", function(){ render(false); });
    mahalleSel.addEventListener("change", function(){ render(true); });

    document.getElementById("csv-btn").addEventListener("click", function(){
      var rows = [["Ortak", "Kullanıcı adı", "Mahalle", "Ada", "Parsel", "Nitelik", "Mevkii", "Alan (m²)", "Pafta", "Birden fazla ortakta"]];
      visible().forEach(function(x){
        rows.push([x.m.fullName, x.m.memberNo, x.p.mahalle, x.p.ada, x.p.parsel, x.p.nitelik, x.p.mevkii, areaCell(x.p.areaM2), x.p.pafta, x.p.shared ? "evet" : ""]);
      });
      downloadCsv("ortak-parselleri", rows);
    });
  }
})();
