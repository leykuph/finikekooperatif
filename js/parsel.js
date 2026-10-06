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

  // Yönetim sayfaları (js/yonetim.js) aynı yardımcıları kullanır.
  window.Parsel = {el: el, dekar: dekar, m2: m2, label: label, makeMap: makeMap, STYLE: STYLE, details: details, show: show};
})();
