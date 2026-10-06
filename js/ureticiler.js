/* Üreticilerimiz: ortak parselleri herkese açık haritada, isimsiz. Veri: GET /public/map */
(function(){
  var P = window.Parsel, loading = document.getElementById("yukleniyor"), root = document.getElementById("uretici-sayfa");
  var ERR = "Harita şu anda yüklenemedi. Biraz sonra tekrar deneyin.";

  function tip(p){
    return [p.nitelik || "Bahçe", p.mahalle].filter(Boolean).join(" · ");
  }

  fetch(window.API_BASE + "/public/map").then(function(r){ return r.json(); }).then(function(d){
    if (!d.parcels) { loading.textContent = ERR; return; }
    loading.hidden = true; root.hidden = false;

    var map = P.makeMap("harita"), layer = L.featureGroup().addTo(map);
    d.parcels.forEach(function(p){ P.drawParcel(map, layer, p, tip(p)); });
    if (layer.getLayers().length) map.fitBounds(layer.getBounds(), {maxZoom: 15, padding: [24, 24]});
  }).catch(function(){ loading.textContent = ERR; });
})();
