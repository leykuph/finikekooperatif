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
  function num(v, frac){ return v.toLocaleString("tr-TR", {maximumFractionDigits: frac || 0}); }
  function treeTotals(list){
    return list.reduce(function(a, t){ return {count: a.count + t.count, tons: a.tons + t.tons}; }, {count: 0, tons: 0});
  }
  function treeText(t){ return num(t.count) + " " + t.species + " · " + t.ageYears + " yaş · ~" + num(t.tons, 2) + " ton"; }
  function show(box, text, cls){ box.className = "notice" + (cls ? " " + cls : ""); box.textContent = text; box.hidden = false; }

  function makeMap(id){
    var map = L.map(id, {scrollWheelZoom: false}).setView(FINIKE, 11);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "Uydu: Esri, Maxar, Earthstar Geographics · Parsel: TKGM"
    }).addTo(map);
    // Yakınken parselin kendisi görünür; iğneler küçük parselleri örtmesin diye gizlenir.
    function pins(){ map.getContainer().classList.toggle("yakin", map.getZoom() >= 17); }
    map.on("zoomend", pins); pins();
    return map;
  }
  // Uydu görüntüsünde seçilsin diye parlak sarı çizgi + altında koyu hale.
  var STYLE = {color: "#FFD23F", weight: 3, opacity: 1, fillColor: "#FFD23F", fillOpacity: .3};
  var SELECTED = {color: "#FFFFFF", weight: 4, fillColor: "#FFFFFF", fillOpacity: .4};
  var HALO = {color: "#000000", weight: 7, opacity: .5, fill: false};

  // Parseli çizer; uzaktan da görünsün diye ortasına iğne koyar (numaralı ya da nokta).
  // İğneye tıklayınca parsele yakınlaşır. Geometri yoksa null döner.
  function drawParcel(map, layer, p, tip, num){
    if (!p.geometry) return null;
    L.geoJSON(p.geometry, {style: HALO, interactive: false}).addTo(layer);
    var shape = L.geoJSON(p.geometry, {style: STYLE}).bindTooltip(tip).addTo(layer);
    var icon = L.divIcon({className: "parsel-pin" + (num ? "" : " nokta"), html: num ? "<span>" + num + "</span>" : "",
      iconSize: num ? [28, 28] : [14, 14]});
    var pin = L.marker(shape.getBounds().getCenter(), {icon: icon, title: tip, riseOnHover: true}).addTo(layer);
    pin.on("click", function(){ map.fitBounds(shape.getBounds(), {maxZoom: 18}); });
    return shape;
  }
  var PREVIEW = {color: "#FFFFFF", weight: 3, dashArray: "8 6", fillColor: "#FFFFFF", fillOpacity: .2};

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
        var trees = treeTotals([].concat.apply([], parcels.map(function(p){ return p.trees; })));
        sum.textContent = parcels.length ? parcels.length + " parsel · toplam " + dekar(total) +
          (trees.count ? " · " + num(trees.count) + " ağaç · tahmini ~" + num(trees.tons, 2) + " ton" : "")
          : "Henüz parsel eklemediniz. Sağdaki formdan ilk parselinizi ekleyin.";
        parcels.forEach(function(p){
          var no = parcels.indexOf(p) + 1, shape = drawParcel(map, layer, p, no + ". " + label(p), no);
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
          var badge = el("span", {"class": "parsel-no", "aria-hidden": "true", text: String(no)});
          list.appendChild(el("article", {"class": "card parsel-card"}, [badge, details(p), treeSection(p), el("div", {"class": "btn-row"}, [go, del])]));
        });
        if (layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 17, padding: [20, 20]});
      }
      // Parseldeki ağaç grupları: liste + "Ağaç ekle" ile açılan küçük form
      function treeSection(p){
        var ul = el("ul", {"class": "agac-liste"});
        p.trees.forEach(function(t){
          var x = el("button", {"class": "agac-sil", type: "button", "aria-label": treeText(t) + " kaydını sil", text: "×"});
          x.addEventListener("click", function(){
            if (!confirm(treeText(t) + " kaydı silinsin mi?")) return;
            api("DELETE", "/trees/" + t.id).then(function(d){
              if (!d.ok) { alert(d.error || window.uyeNetErr); return; }
              p.trees = p.trees.filter(function(y){ return y.id !== t.id; }); render();
            }).catch(function(){ alert(window.uyeNetErr); });
          });
          ul.appendChild(el("li", {}, [el("span", {text: treeText(t)}), x]));
        });
        var tot = treeTotals(p.trees);
        var head = el("div", {"class": "agac-head"}, [
          el("h4", {text: "Ağaçlar"}),
          el("span", {"class": "muted small", text: p.trees.length ? num(tot.count) + " ağaç · ~" + num(tot.tons, 2) + " ton" : "Henüz ağaç eklenmedi"})
        ]);

        var uid = "agac-" + p.id;
        function field(key, text, attrs){
          var input = el("input", Object.assign({"class": "input", id: uid + "-" + key, required: ""}, attrs));
          return el("div", {"class": "field"}, [el("label", {"for": input.id, text: text}), input]);
        }
        var msg = el("div", {"class": "notice", role: "status", hidden: ""});
        var save = el("button", {"class": "btn btn-primary btn-sm", type: "submit", text: "Kaydet"});
        var cancel = el("button", {"class": "btn btn-ghost btn-sm", type: "button", text: "Vazgeç"});
        var form = el("form", {"class": "agac-form", novalidate: "", hidden: ""}, [
          field("cins", "Ağaç cinsi", {list: "agac-cinsleri", maxlength: "40", autocomplete: "off", placeholder: "ör. Washington portakal"}),
          el("div", {"class": "row-2"}, [
            field("sayi", "Ağaç sayısı", {inputmode: "numeric", maxlength: "6"}),
            field("yas", "Ağaç yaşı (yıl)", {inputmode: "numeric", maxlength: "3"})
          ]),
          field("ton", "Tahmini tonaj (ton/yıl)", {inputmode: "decimal", maxlength: "8", placeholder: "ör. 2,5"}),
          msg,
          el("div", {"class": "btn-row"}, [save, cancel])
        ]);
        var open = el("button", {"class": "agac-ekle", type: "button", text: "+ Ağaç ekle (cins, sayı, yaş, tonaj)"});
        function toggle(on){ form.hidden = !on; open.hidden = on; msg.hidden = true; if (on) form.querySelector("input").focus(); else form.reset(); }
        open.addEventListener("click", function(){ toggle(true); });
        cancel.addEventListener("click", function(){ toggle(false); });

        form.addEventListener("submit", function(e){
          e.preventDefault();
          function v(k){ return document.getElementById(uid + "-" + k).value.trim(); }
          var body = {species: v("cins"), count: v("sayi"), ageYears: v("yas"), tons: v("ton").replace(",", ".")};
          if (!body.species) { show(msg, "Ağaç cinsini yazın.", "bad"); return; }
          if (!/^\d+$/.test(body.count) || Number(body.count) < 1) { show(msg, "Ağaç sayısını rakamla yazın.", "bad"); return; }
          if (!/^\d+$/.test(body.ageYears)) { show(msg, "Ağaç yaşını yıl olarak rakamla yazın.", "bad"); return; }
          if (!/^\d+(\.\d+)?$/.test(body.tons)) { show(msg, "Tahmini tonajı ton olarak yazın (ör. 2,5).", "bad"); return; }
          body.count = Number(body.count); body.ageYears = Number(body.ageYears); body.tons = Number(body.tons);
          save.disabled = true; save.textContent = "Kaydediliyor…";
          api("POST", "/parcels/" + p.id + "/trees", body).then(function(d){
            save.disabled = false; save.textContent = "Kaydet";
            if (!d.tree) { show(msg, d.error || window.uyeNetErr, "bad"); return; }
            p.trees.push(d.tree); render();
          }).catch(function(){ save.disabled = false; save.textContent = "Kaydet"; show(msg, window.uyeNetErr, "bad"); });
        });

        return el("section", {"class": "agaclar"}, [head, p.trees.length ? ul : null, open, form]);
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
          if (d.parcel.geometry) { preview = L.featureGroup([L.geoJSON(d.parcel.geometry, {style: HALO, interactive: false}), L.geoJSON(d.parcel.geometry, {style: PREVIEW})]).addTo(map); map.fitBounds(preview.getBounds(), {maxZoom: 18}); }
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
  window.Parsel = {el: el, dekar: dekar, m2: m2, label: label, makeMap: makeMap, STYLE: STYLE, SELECTED: SELECTED, drawParcel: drawParcel, details: details, show: show,
    num: num, treeTotals: treeTotals, treeText: treeText};
})();
