/* Üreticilerimiz: ortak parselleri herkese açık haritada, isimsiz. Veri: GET /public/map */
(function(){
  var P = window.Parsel, el = P.el, loading = document.getElementById("yukleniyor"), root = document.getElementById("uretici-sayfa");
  var ERR = "Harita şu anda yüklenemedi. Biraz sonra tekrar deneyin.";

  function tip(p){
    return [p.nitelik || "Bahçe", P.dekar(p.areaM2), p.trees ? P.num(p.trees) + " ağaç" : null, p.mahalle]
      .filter(Boolean).join(" · ");
  }

  fetch(window.API_BASE + "/public/map").then(function(r){ return r.json(); }).then(function(d){
    if (!d.totals) { loading.textContent = ERR; return; }
    loading.hidden = true; root.hidden = false;

    var t = d.totals, box = document.getElementById("ozet");
    var tiles = [[P.num(t.members), "Ortak"], [P.dekar(t.areaM2), P.num(t.mahalleler) + " köy ve mahallede bahçe"]]
      .concat(t.trees ? [[P.num(t.trees), "Ağaç"], ["~" + P.num(t.tons, 1) + " ton", "Yıllık tahmini rekolte"]] : []);
    box.className = "kpis kpis-" + tiles.length;
    tiles.forEach(function(k){
        box.appendChild(el("div", {"class": "kpi"}, [el("span", {"class": "kpi-value", text: k[0]}), el("span", {"class": "kpi-label", text: k[1]})]));
      });

    var map = P.makeMap("harita"), layer = L.featureGroup().addTo(map);
    d.parcels.forEach(function(p){ P.drawParcel(map, layer, p, tip(p)); });
    if (layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 15, padding: [24, 24]});
  }).catch(function(){ loading.textContent = ERR; });
})();
