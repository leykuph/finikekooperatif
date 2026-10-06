/* Parsellerim (ortak paneli) ve ortakların parselleri (yönetim). Harita: Leaflet + Esri uydu görüntüsü. */
(function(){
  var api = window.uyeApi;
  var FINIKE = [36.33, 30.2];

  function el(tag, attrs, children){
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k){ if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); });
    (children || []).forEach(function(c){ if (c) n.appendChild(c); });
    return n;
  }
  function dekar(m2){ return m2 == null ? "-" : (m2 / 1000).toLocaleString("tr-TR", {maximumFractionDigits: 1}) + " dekar"; }
  function m2(v){ return v == null ? "-" : v.toLocaleString("tr-TR", {maximumFractionDigits: 2}) + " m²"; }
  function label(p){ return p.mahalle + " " + p.ada + "/" + p.parsel; }
  function show(box, text, cls){ box.className = "notice" + (cls ? " " + cls : ""); box.textContent = text; box.hidden = false; }

  function makeMap(id){
    var map = L.map(id, {scrollWheelZoom: false}).setView(FINIKE, 11);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "Uydu: Esri, Maxar, Earthstar Geographics · Parsel: TKGM"
    }).addTo(map);
    return map;
  }
  var STYLE = {color: "#FFB067", weight: 2, fillColor: "#E0661A", fillOpacity: .25};
  var PREVIEW = {color: "#FFFFFF", weight: 2, dashArray: "6 4", fillColor: "#FFFFFF", fillOpacity: .15};

  function details(p){
    var dl = el("dl", {"class": "parsel-dl"});
    [["Parsel", label(p)], ["Nitelik", p.nitelik || "-"], ["Mevkii", p.mevkii || "-"], ["Alan", m2(p.areaM2) + " (" + dekar(p.areaM2) + ")"], ["Pafta", p.pafta || "-"]]
      .forEach(function(r){ dl.appendChild(el("div", {}, [el("dt", {text: r[0]}), el("dd", {text: r[1]})])); });
    return dl;
  }

  /* ---------- Ortak paneli ---------- */
  if (document.getElementById("parsellerim")) {
    document.addEventListener("parseller:ac", function(){
      var map = makeMap("harita"), layer = L.featureGroup().addTo(map), preview = null, found = null, parcels = [];
      var form = document.getElementById("parsel-form"), msg = document.getElementById("parsel-mesaj");
      var sel = document.getElementById("mahalle"), btn = document.getElementById("sorgula-btn"), addBtn = document.getElementById("ekle-btn");
      var box = document.getElementById("onizleme"), list = document.getElementById("parsel-liste"), sum = document.getElementById("parsel-ozet");

      api("GET", "/tkgm/mahalleler").then(function(d){
        if (!d.mahalleler) { sel.firstChild.textContent = "Mahalleler yüklenemedi"; show(msg, d.error || window.uyeNetErr, "bad"); return; }
        sel.firstChild.textContent = "Seçin";
        d.mahalleler.forEach(function(m){ sel.appendChild(el("option", {value: m.id, text: m.name})); });
      }).catch(function(){ show(msg, window.uyeNetErr, "bad"); });

      function render(){
        layer.clearLayers(); list.textContent = "";
        var total = parcels.reduce(function(a, p){ return a + (p.areaM2 || 0); }, 0);
        sum.textContent = parcels.length ? parcels.length + " parsel · toplam " + dekar(total) : "Henüz parsel eklemediniz. Sağdaki formdan ilk parselinizi ekleyin.";
        parcels.forEach(function(p){
          var shape = p.geometry ? L.geoJSON(p.geometry, {style: STYLE}).bindTooltip(label(p)).addTo(layer) : null;
          var go = el("button", {"class": "btn btn-ghost btn-sm", type: "button", text: "Haritada göster"});
          var del = el("button", {"class": "btn btn-ghost btn-sm danger", type: "button", text: "Kaldır"});
          go.disabled = !shape;
          go.addEventListener("click", function(){ map.fitBounds(shape.getBounds(), {maxZoom: 18}); document.getElementById("harita").scrollIntoView({behavior: "smooth", block: "center"}); });
          del.addEventListener("click", function(){
            if (!confirm(label(p) + " listenizden kaldırılsın mı?")) return;
            api("DELETE", "/parcels/" + p.id).then(function(d){
              if (!d.ok) { alert(d.error || window.uyeNetErr); return; }
              parcels = parcels.filter(function(x){ return x.id !== p.id; }); render();
            }).catch(function(){ alert(window.uyeNetErr); });
          });
          list.appendChild(el("article", {"class": "card parsel-card"}, [details(p), el("div", {"class": "btn-row"}, [go, del])]));
        });
        if (layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 17, padding: [20, 20]});
      }
      api("GET", "/parcels").then(function(d){ parcels = d.parcels || []; render(); if (!d.parcels) show(msg, d.error || window.uyeNetErr, "bad"); })
        .catch(function(){ show(msg, window.uyeNetErr, "bad"); });

      function clearPreview(){ if (preview) { map.removeLayer(preview); preview = null; } found = null; box.hidden = true; }
      ["mahalle", "ada", "parsel"].forEach(function(id){ document.getElementById(id).addEventListener("input", function(){ clearPreview(); msg.hidden = true; }); });

      form.addEventListener("submit", function(e){
        e.preventDefault(); clearPreview();
        var q = {mahalleId: sel.value, ada: document.getElementById("ada").value.trim(), parsel: document.getElementById("parsel").value.trim()};
        if (!q.mahalleId) { show(msg, "Mahalle ya da köy seçin.", "bad"); return; }
        if (!/^\d+$/.test(q.ada) || !/^\d+$/.test(q.parsel)) { show(msg, "Ada ve parsel numarasını rakamla yazın.", "bad"); return; }
        msg.hidden = true; btn.disabled = true; btn.textContent = "Sorgulanıyor…";
        api("GET", "/tkgm/parsel?mahalle=" + q.mahalleId + "&ada=" + q.ada + "&parsel=" + q.parsel).then(function(d){
          btn.disabled = false; btn.textContent = "Sorgula";
          if (!d.parcel) { show(msg, d.error || window.uyeNetErr, "bad"); return; }
          found = q;
          var info = document.getElementById("onizleme-bilgi"); info.replaceWith(Object.assign(details(d.parcel), {id: "onizleme-bilgi"}));
          box.hidden = false;
          if (d.parcel.geometry) { preview = L.geoJSON(d.parcel.geometry, {style: PREVIEW}).addTo(map); map.fitBounds(preview.getBounds(), {maxZoom: 18}); }
        }).catch(function(){ btn.disabled = false; btn.textContent = "Sorgula"; show(msg, window.uyeNetErr, "bad"); });
      });

      addBtn.addEventListener("click", function(){
        if (!found) return;
        addBtn.disabled = true; addBtn.textContent = "Ekleniyor…";
        api("POST", "/parcels", found).then(function(d){
          addBtn.disabled = false; addBtn.textContent = "Parsellerime ekle";
          if (!d.parcel) { show(msg, d.error || window.uyeNetErr, "bad"); return; }
          parcels.push(d.parcel); clearPreview(); render();
          document.getElementById("ada").value = ""; document.getElementById("parsel").value = "";
          show(msg, label(d.parcel) + " listenize eklendi.", "ok");
        }).catch(function(){ addBtn.disabled = false; addBtn.textContent = "Parsellerime ekle"; show(msg, window.uyeNetErr, "bad"); });
      });
    });
  }

  /* ---------- Yönetim ---------- */
  var adminRoot = document.getElementById("yonetim");
  if (adminRoot) {
    var loading = document.getElementById("yukleniyor"), data = [];
    api("GET", "/admin/parcels").then(function(d){
      if (d.status === 401) { location.replace("/giris"); return; }
      if (d.status === 403) { location.replace("/ortak"); return; }
      if (!d.members) { loading.textContent = d.error || window.uyeNetErr; return; }
      data = d.members; loading.hidden = true; adminRoot.hidden = false; renderAdmin();
    }).catch(function(){ loading.textContent = window.uyeNetErr; });

    function renderAdmin(){
      var all = [], withParcels = 0;
      data.forEach(function(m){ if (m.parcels.length) withParcels++; m.parcels.forEach(function(p){ all.push({m: m, p: p}); }); });
      // Birden fazla ortağın bildirdiği (hisseli) parsel toplamda bir kez sayılır.
      var unique = {};
      all.forEach(function(x){ unique[x.p.mahalleId + "/" + x.p.ada + "/" + x.p.parsel] = x.p.areaM2 || 0; });
      var keys = Object.keys(unique), total = keys.reduce(function(a, k){ return a + unique[k]; }, 0);
      var kpis = document.getElementById("ozet");
      [["Ortak", data.length], ["Parsel bildiren", withParcels], ["Parsel", keys.length], ["Toplam alan", dekar(total)]].forEach(function(k){
        kpis.appendChild(el("div", {"class": "kpi"}, [el("span", {"class": "kpi-value", text: String(k[1])}), el("span", {"class": "kpi-label", text: k[0]})]));
      });

      var map = makeMap("harita"), layer = L.featureGroup().addTo(map);
      all.forEach(function(x){
        if (!x.p.geometry) return;
        L.geoJSON(x.p.geometry, {style: STYLE}).bindTooltip(x.m.fullName + " · " + label(x.p) + " · " + dekar(x.p.areaM2)).addTo(layer);
      });
      if (layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 16, padding: [20, 20]});

      var tbody = document.getElementById("ortak-satirlar");
      data.forEach(function(m){
        var sum = m.parcels.reduce(function(a, p){ return a + (p.areaM2 || 0); }, 0);
        var name = el("td", {}, [el("span", {text: m.fullName}), m.active ? null : el("span", {"class": "etiket", text: "kapalı"})]);
        tbody.appendChild(el("tr", {}, [name, el("td", {text: m.memberNo}), el("td", {"class": "num", text: String(m.parcels.length)}), el("td", {"class": "num", text: m.parcels.length ? dekar(sum) : "-"})]));
        if (!m.parcels.length) return;
        var ul = el("ul", {"class": "parsel-mini"});
        m.parcels.forEach(function(p){
          ul.appendChild(el("li", {}, [
            el("span", {text: label(p) + " · " + (p.nitelik || "-") + " · " + (p.mevkii || "-") + " · " + dekar(p.areaM2)}),
            p.shared ? el("span", {"class": "etiket", title: "Bu parseli birden fazla ortak bildirdi (hisseli olabilir).", text: "birden fazla ortakta"}) : null
          ]));
        });
        tbody.appendChild(el("tr", {"class": "alt"}, [el("td", {colspan: "4"}, [ul])]));
      });
    }

    document.getElementById("csv-btn").addEventListener("click", function(){
      var q = function(v){ v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var rows = [["Ortak", "Kullanıcı adı", "Mahalle", "Ada", "Parsel", "Nitelik", "Mevkii", "Alan (m²)", "Pafta", "Birden fazla ortakta"]];
      data.forEach(function(m){ m.parcels.forEach(function(p){
        rows.push([m.fullName, m.memberNo, p.mahalle, p.ada, p.parsel, p.nitelik, p.mevkii, p.areaM2 == null ? "" : String(p.areaM2).replace(".", ","), p.pafta, p.shared ? "evet" : ""]);
      }); });
      var csv = "﻿" + rows.map(function(r){ return r.map(q).join(";"); }).join("\r\n");
      var a = el("a", {href: URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"})), download: "ortak-parselleri-" + new Date().toISOString().slice(0, 10) + ".csv"});
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
})();
