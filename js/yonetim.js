/* Yönetim paneli: Ortaklar (/yonetim), Parseller (/yonetim-parseller) ve Mesajlar (/yonetim-mesajlar). Yalnızca yönetici hesapları. */
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
  function allTrees(parcels){ return P.treeTotals([].concat.apply([], parcels.map(function(p){ return p.trees; }))); }
  function treesShort(t){ return t.count ? P.num(t.count) + " ağaç · ~" + P.num(t.tons, 2) + " ton" : "-"; }
  function tonsCell(t){ return String(Math.round(t * 100) / 100).replace(".", ","); }
  function treesCell(list){ return list.map(function(t){ return t.count + " " + t.species + " (" + t.ageYears + " yaş, " + tonsCell(t.tons) + " ton)"; }).join("; "); }

  // Excel Türkçe ayarlarda ";" ayırıcı ve UTF-8 BOM ile doğrudan açar.
  function downloadCsv(name, rows){
    var q = function(v){ v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var csv = "﻿" + rows.map(function(r){ return r.map(q).join(";"); }).join("\r\n");
    var a = el("a", {href: URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"})), download: name + "-" + new Date().toISOString().slice(0, 10) + ".csv"});
    document.body.appendChild(a); a.click(); a.remove();
  }
  function areaCell(m2){ return m2 == null ? "" : String(Math.round(m2 * 100) / 100).replace(".", ","); }

  function validTc(tc){
    if (!/^[1-9]\d{10}$/.test(tc)) return false;
    var d = tc.split("").map(Number), odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7];
    return ((odd * 7 - even) % 10 + 10) % 10 === d[9] && d.slice(0, 10).reduce(function(a, b){ return a + b; }, 0) % 10 === d[10];
  }
  function mobile(v){ var d = v.replace(/^(90|0)/, ""); return /^5\d{9}$/.test(d) ? d : null; }
  // Yalnızca rakam; en fazla 11 hane (yapıştırılan metindeki boşluk ve işaretler atılır)
  function digitsOnly(inp, onChange){
    inp.addEventListener("input", function(){
      var v = inp.value.replace(/\D/g, "").slice(0, 11);
      if (v !== inp.value) inp.value = v;
      if (onChange) onChange(v);
    });
  }
  // Ortağa gidecek mesaj: metin, kopyala, WhatsApp ve SMS bağlantıları
  function share(ids, message, tel){
    var phone = "90" + mobile(tel);
    document.getElementById(ids.text).textContent = message;
    document.getElementById(ids.wa).href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
    document.getElementById(ids.sms).href = "sms:+" + phone + "?body=" + encodeURIComponent(message);
  }
  function copyButton(btnId, textId){
    document.getElementById(btnId).addEventListener("click", function(){
      var b = this, label = b.textContent, t = document.getElementById(textId).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ b.textContent = "Kopyalandı"; }, function(){ b.textContent = "Kopyalanamadı, metni seçin"; });
      setTimeout(function(){ b.textContent = label; }, 2000);
    });
  }

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
      load(d.member);
      unreadBadge();
    }).catch(function(){ loading.textContent = window.uyeNetErr; });
  }

  // Menüdeki "Mesajlar" bağlantısında okunmamış mesaj sayısı
  function unreadBadge(){
    api("GET", "/admin/messages/unread").then(function(d){
      document.querySelectorAll(".mesaj-link").forEach(function(a){
        var b = a.querySelector(".sayac");
        if (!d.count) { if (b) b.remove(); return; }
        if (!b) { b = el("span", {"class": "sayac"}); a.appendChild(b); }
        b.textContent = d.count; b.setAttribute("aria-label", d.count + " okunmamış");
      });
    }).catch(function(){});
  }

  /* ---------- Ortaklar ---------- */
  var membersRoot = document.getElementById("ortaklar-sayfa");
  if (membersRoot) {
    var members = [], me = null, current = null, search = document.getElementById("ara"), filter = document.getElementById("durum-filtre");
    var tbody = document.getElementById("ortak-satirlar"), empty = document.getElementById("bos");

    var load = function(self){
      if (self) me = self;
      return api("GET", "/admin/members").then(function(d){
        if (!d.members) { loading.textContent = d.error || window.uyeNetErr; return; }
        members = d.members; loading.hidden = true; membersRoot.hidden = false; render();
        if (current) current = members.filter(function(m){ return m.memberNo === current.memberNo; })[0] || null;
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
          el("td", {"class": "num", text: treesShort(allTrees(m.parcels))}),
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
    var actMsg = document.getElementById("islem-mesaj"), resetForm2 = document.getElementById("sifirla-form"), resetResult = document.getElementById("sifirla-sonuc");
    var toggleBtn = document.getElementById("aktiflik-btn"), sTc = document.getElementById("s-tc"), sTel = document.getElementById("s-tel");
    digitsOnly(sTc); digitsOnly(sTel);
    copyButton("s-kopyala", "s-metin");
    memberDlg.addEventListener("close", function(){ current = null; });

    function openMember(m){
      current = m; fillMember(m);
      actMsg.hidden = true; resetForm2.hidden = true; resetForm2.reset(); resetResult.hidden = true;
      document.getElementById("islemler").hidden = false;
      memberDlg.showModal();
    }
    function fillMember(m){
      document.getElementById("ortak-baslik").textContent = m.fullName;
      var dl = document.getElementById("ortak-bilgi"); dl.textContent = "";
      [["Kullanıcı adı", m.memberNo], ["Durum", pill(m.status)], ["Yönetici", m.isAdmin ? "Evet" : "Hayır"],
       ["Kayıt tarihi", date(m.createdAt)], ["Kaydeden", m.createdBy || "Komut satırı"], ["Son giriş", date(m.lastLoginAt, true)]]
        .concat(m.initialPasswordExpiresAt ? [["İlk şifre son gün", date(m.initialPasswordExpiresAt)]] : [])
        .forEach(function(r){ dl.appendChild(el("div", {}, [el("dt", {text: r[0]}), typeof r[1] === "string" ? el("dd", {text: r[1]}) : el("dd", {}, [r[1]])])); });
      var box = document.getElementById("ortak-parseller"); box.textContent = "";
      if (!m.parcels.length) box.appendChild(el("p", {"class": "muted small", text: "Henüz parsel bildirmedi."}));
      else {
        var tt = allTrees(m.parcels);
        box.appendChild(el("p", {"class": "muted small", text: m.parcels.length + " parsel · toplam " + dekar(totalArea(m.parcels)) + (tt.count ? " · " + treesShort(tt) : "")}));
        var ul = el("ul", {"class": "parsel-mini"});
        m.parcels.forEach(function(p){
          var trees = p.trees.length ? el("ul", {"class": "agac-mini"}, p.trees.map(function(t){ return el("li", {text: P.treeText(t)}); })) : null;
          ul.appendChild(el("li", {}, [el("span", {text: label(p) + " · " + (p.nitelik || "-") + " · " + (p.mevkii || "-") + " · " + dekar(p.areaM2)}), trees]));
        });
        box.appendChild(ul);
      }
      var closed = m.status === "kapali";
      toggleBtn.textContent = closed ? "Hesabı aç" : "Hesabı kapat";
      toggleBtn.classList.toggle("danger", !closed);
      toggleBtn.hidden = !closed && me && m.memberNo === me.memberNo;   // kendi hesabını kapatamaz
    }

    document.getElementById("sifirla-ac").addEventListener("click", function(){
      actMsg.hidden = true; resetResult.hidden = true; resetForm2.hidden = false; document.getElementById("islemler").hidden = true; sTc.focus();
    });
    document.getElementById("sifirla-vazgec").addEventListener("click", function(){
      resetForm2.hidden = true; resetForm2.reset(); document.getElementById("islemler").hidden = false;
    });
    resetForm2.addEventListener("submit", function(e){
      e.preventDefault();
      var m = current, btn = document.getElementById("sifirla-btn");
      if (!validTc(sTc.value)) { show(actMsg, "TC kimlik numarası geçersiz. 11 haneyi kontrol edin.", "bad"); sTc.focus(); return; }
      if (!mobile(sTel.value)) { show(actMsg, "Cep telefonu 05xx xxx xx xx biçiminde olmalı.", "bad"); sTel.focus(); return; }
      btn.disabled = true; btn.textContent = "Sıfırlanıyor…";
      api("POST", "/admin/members/" + encodeURIComponent(m.memberNo) + "/reset", {tc: sTc.value, phone: sTel.value}).then(function(d){
        btn.disabled = false; btn.textContent = "Şifreyi sıfırla";
        if (!d.ok) { show(actMsg, d.error || window.uyeNetErr, "bad"); return; }
        share({text: "s-metin", wa: "s-whatsapp", sms: "s-sms"}, d.message, sTel.value);
        resetForm2.reset(); resetForm2.hidden = true; resetResult.hidden = false; document.getElementById("islemler").hidden = false;
        show(actMsg, "Şifre sıfırlandı. Aşağıdaki mesajı ortağa gönderin; mesajda gizli bilgi yoktur.", "ok");
        load().then(function(){ if (current) fillMember(current); });
      }).catch(function(){ btn.disabled = false; btn.textContent = "Şifreyi sıfırla"; show(actMsg, window.uyeNetErr, "bad"); });
    });

    toggleBtn.addEventListener("click", function(){
      var m = current, activate = m.status === "kapali";
      if (!confirm(activate ? m.fullName + " hesabı yeniden açılsın mı?"
        : m.fullName + " hesabı kapatılsın mı? Ortak giriş yapamaz, açık oturumları sonlanır. Kayıtları ve parselleri silinmez.")) return;
      toggleBtn.disabled = true;
      api("POST", "/admin/members/" + encodeURIComponent(m.memberNo) + "/active", {active: activate}).then(function(d){
        toggleBtn.disabled = false;
        if (!d.ok) { show(actMsg, d.error || window.uyeNetErr, "bad"); return; }
        resetResult.hidden = true;
        show(actMsg, activate ? "Hesap yeniden açıldı." : "Hesap kapatıldı.", "ok");
        load().then(function(){ if (current) fillMember(current); });
      }).catch(function(){ toggleBtn.disabled = false; show(actMsg, window.uyeNetErr, "bad"); });
    });

    document.getElementById("csv-btn").addEventListener("click", function(){
      var rows = [["Ad Soyad", "Kullanıcı adı", "Durum", "Yönetici", "Parsel sayısı", "Toplam alan (m²)", "Ağaç sayısı", "Tahmini tonaj (ton)", "Kayıt tarihi", "Son giriş"]];
      members.forEach(function(m){
        var tt = allTrees(m.parcels);
        rows.push([m.fullName, m.memberNo, STATUS[m.status], m.isAdmin ? "evet" : "", m.parcels.length,
          areaCell(totalArea(m.parcels)), tt.count, tonsCell(tt.tons), date(m.createdAt), m.lastLoginAt ? date(m.lastLoginAt, true) : ""]);
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

    digitsOnly(tcIn, function(v){ counter.textContent = v.length + " / 11"; });
    digitsOnly(telIn);

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
        document.getElementById("kayit-tamam").textContent = d.member.fullName + " kaydedildi. Kullanıcı adı: " + d.member.memberNo +
          (d.usernameTaken ? " (“" + d.usernameTaken + "” kullanımda olduğu için)" : "");
        share({text: "kayit-metin", wa: "whatsapp-link", sms: "sms-link"}, d.message, tel);
        kf.reset(); kf.hidden = true; result.hidden = false; result.focus();
        load();
      }).catch(function(){ kbtn.disabled = false; kbtn.textContent = "Ortağı kaydet"; show(kmsg, window.uyeNetErr, "bad"); });
    });
    copyButton("kopyala-btn", "kayit-metin");
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
      // Ağaçlar ortak başına girildiği için hisseli parsellerde her ortağın beyanı ayrı sayılır.
      var tt = allTrees(all.map(function(x){ return x.p; }));
      var box = document.getElementById("ozet");
      [["Ortak", memberList.length], ["Parsel bildiren", withParcels], ["Parsel", keys.length], ["Toplam alan", dekar(total)],
       ["Ağaç", P.num(tt.count)], ["Tahmini tonaj", "~" + P.num(tt.tons, 1) + " ton"]].forEach(function(k){
        box.appendChild(el("div", {"class": "kpi"}, [el("span", {"class": "kpi-value", text: String(k[1])}), el("span", {"class": "kpi-label", text: k[0]})]));
      });
    }

    function visible(){
      var q = fold(search2.value.trim()), mh = mahalleSel.value;
      return all.filter(function(x){
        if (mh && x.p.mahalle !== mh) return false;
        if (!q) return true;
        return [x.m.fullName, x.m.memberNo, x.p.mevkii, x.p.nitelik, x.p.ada + "/" + x.p.parsel].concat(x.p.trees.map(function(t){ return t.species; })).some(function(s){ return fold(s).indexOf(q) >= 0; });
      });
    }

    function render(fit){
      var rows = visible();
      layer.clearLayers(); tbody2.textContent = ""; selected = null;
      rows.forEach(function(x){
        var shape = P.drawParcel(map, layer, x.p, x.m.fullName + " · " + label(x.p) + " · " + dekar(x.p.areaM2));
        var go = el("button", {"class": "satir-ac", type: "button", text: x.m.fullName});
        var tr = el("tr", {"class": "tiklanir"}, [
          el("td", {}, [go]),
          el("td", {text: x.p.mahalle}),
          el("td", {}, [el("span", {text: x.p.ada + "/" + x.p.parsel}), x.p.shared ? el("span", {"class": "etiket", title: "Bu parseli birden fazla ortak bildirdi (hisseli olabilir).", text: "birden fazla ortakta"}) : null]),
          el("td", {text: x.p.nitelik || "-"}), el("td", {text: x.p.mevkii || "-"}),
          el("td", {"class": "num", text: dekar(x.p.areaM2)}),
          el("td", {"class": "num", title: x.p.trees.map(P.treeText).join("\n"), text: treesShort(P.treeTotals(x.p.trees))})
        ]);
        var focus = function(){
          if (!shape) return;
          tbody2.querySelectorAll("tr.secili").forEach(function(r){ r.classList.remove("secili"); });
          tr.classList.add("secili");
          if (selected) selected.setStyle(P.STYLE);
          selected = shape; shape.setStyle(P.SELECTED); shape.bringToFront();
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
      var rows = [["Ortak", "Kullanıcı adı", "Mahalle", "Ada", "Parsel", "Nitelik", "Mevkii", "Alan (m²)", "Pafta", "Birden fazla ortakta", "Ağaç sayısı", "Tahmini tonaj (ton)", "Ağaçlar"]];
      visible().forEach(function(x){
        var tt = P.treeTotals(x.p.trees);
        rows.push([x.m.fullName, x.m.memberNo, x.p.mahalle, x.p.ada, x.p.parsel, x.p.nitelik, x.p.mevkii, areaCell(x.p.areaM2), x.p.pafta, x.p.shared ? "evet" : "",
          tt.count, tonsCell(tt.tons), treesCell(x.p.trees)]);
      });
      downloadCsv("ortak-parselleri", rows);
    });
  }

  /* ---------- Mesajlar ---------- */
  var messagesRoot = document.getElementById("mesajlar-sayfa");
  if (messagesRoot) {
    var messages = [], search3 = document.getElementById("ara"), readSel = document.getElementById("okunma-filtre"), topicSel = document.getElementById("konu-filtre");
    var list = document.getElementById("mesaj-liste"), empty3 = document.getElementById("bos"), me3 = null;

    guard(function(self){
      me3 = self;
      api("GET", "/admin/messages").then(function(d){
        if (!d.messages) { loading.textContent = d.error || window.uyeNetErr; return; }
        messages = d.messages; loading.hidden = true; messagesRoot.hidden = false;
        var topics = {};
        messages.forEach(function(m){ topics[m.topic] = 1; });
        Object.keys(topics).sort(function(a, b){ return a.localeCompare(b, "tr"); })
          .forEach(function(t){ topicSel.appendChild(el("option", {value: t, text: t})); });
        render3();
      }).catch(function(){ loading.textContent = window.uyeNetErr; });
    });

    function visible3(){
      var q = fold(search3.value.trim()), rd = readSel.value, tp = topicSel.value;
      return messages.filter(function(m){
        if (rd === "yeni" && m.readAt) return false;
        if (tp && m.topic !== tp) return false;
        return !q || [m.name, m.email, m.phone, m.message].some(function(s){ return fold(s).indexOf(q) >= 0; });
      });
    }

    function render3(){
      var unread = messages.filter(function(m){ return !m.readAt; }).length;
      document.getElementById("mesaj-ozet").textContent = messages.length
        ? messages.length + " mesaj" + (unread ? " · " + unread + " okunmamış" : " · hepsi okundu")
        : "İletişim formundan henüz mesaj gelmedi.";
      var rows = visible3();
      list.textContent = "";
      rows.forEach(function(m){ list.appendChild(card(m)); });
      empty3.hidden = rows.length > 0 || !messages.length;
      unreadBadge();
    }
    search3.addEventListener("input", render3);
    [readSel, topicSel].forEach(function(i){ i.addEventListener("change", render3); });

    function card(m){
      var reply = el("a", {"class": "btn btn-primary btn-sm", text: "E-postayla yanıtla",
        href: "mailto:" + m.email + "?subject=" + encodeURIComponent("Re: " + m.topic + " · Finike Kooperatifi")});
      var toggle = el("button", {"class": "btn btn-ghost btn-sm", type: "button", text: m.readAt ? "Okunmadı yap" : "Okundu işaretle"});
      var del = el("button", {"class": "btn btn-ghost btn-sm danger", type: "button", text: "Sil"});
      reply.addEventListener("click", function(){ if (!m.readAt) setRead(m, true); });
      toggle.addEventListener("click", function(){ setRead(m, !m.readAt); });
      del.addEventListener("click", function(){
        if (!confirm(m.name + " adlı kişinin mesajı kalıcı olarak silinsin mi?")) return;
        api("DELETE", "/admin/messages/" + m.id).then(function(d){
          if (!d.ok) { alert(d.error || window.uyeNetErr); return; }
          messages = messages.filter(function(x){ return x !== m; }); render3();
        }).catch(function(){ alert(window.uyeNetErr); });
      });
      var contact = [el("a", {href: "mailto:" + m.email, text: m.email})];
      if (m.phone) contact.push(el("a", {href: "tel:" + m.phone.replace(/[^\d+]/g, ""), text: m.phone}));
      return el("article", {"class": "card mesaj-kart" + (m.readAt ? "" : " yeni")}, [
        el("div", {"class": "mesaj-ust"}, [
          el("div", {"class": "stack", style: "gap:2px"}, [
            el("strong", {text: m.name}),
            el("span", {"class": "mesaj-iletisim small"}, contact)
          ]),
          el("div", {"class": "mesaj-meta"}, [
            m.readAt ? null : el("span", {"class": "durum durum-ilk-giris", text: "Yeni"}),
            el("span", {"class": "etiket", text: m.topic}),
            el("time", {"class": "muted small", datetime: m.createdAt, text: date(m.createdAt, true)})
          ])
        ]),
        el("p", {"class": "mesaj-metin", text: m.message}),
        m.readAt ? el("p", {"class": "muted small", text: "Okuyan: " + (m.readBy || "-") + " · " + date(m.readAt, true)}) : null,
        el("div", {"class": "btn-row"}, [reply, toggle, del])
      ]);
    }

    function setRead(m, read){
      api("POST", "/admin/messages/" + m.id + "/read", {read: read}).then(function(d){
        if (!d.ok) { alert(d.error || window.uyeNetErr); return; }
        m.readAt = read ? new Date().toISOString() : null; m.readBy = read && me3 ? me3.fullName : null; render3();
      }).catch(function(){ alert(window.uyeNetErr); });
    }

    document.getElementById("csv-btn").addEventListener("click", function(){
      var rows = [["Tarih", "Ad Soyad", "E-posta", "Telefon", "Konu", "Mesaj", "Okundu"]];
      visible3().forEach(function(m){ rows.push([date(m.createdAt, true), m.name, m.email, m.phone || "", m.topic, m.message, m.readAt ? date(m.readAt, true) : ""]); });
      downloadCsv("mesajlar", rows);
    });
  }
})();
