// TKGM Parsel Sorgu'nun kullandığı MEGSİS arka ucu. Resmî, belgelenmiş bir servis değildir;
// adres veya biçim değişirse yalnızca bu dosya güncellenir.
const BASE = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api";
const FINIKE_ILCE_ID = 187;
const DAY = 24 * 60 * 60 * 1000;

export class TkgmError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const cache = new Map();
async function cached(key, ttl, load) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await load();
  if (cache.size > 2000) cache.clear();
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}

async function get(path) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  } catch {
    throw new TkgmError(502, "Tapu ve Kadastro sistemine şu an ulaşılamıyor. Biraz sonra tekrar deneyin.");
  }
  if (res.status === 404) throw new TkgmError(404, "Bu ada ve parsel bulunamadı. Numaraları kontrol edin.");
  if (!res.ok) throw new TkgmError(502, "Tapu ve Kadastro sistemi şu an yanıt vermiyor. Biraz sonra tekrar deneyin.");
  return res.json();
}

export function mahalleler() {
  return cached("mahalleler", DAY, async () => {
    const data = await get(`/idariYapi/mahalleListe/${FINIKE_ILCE_ID}`);
    return data.features
      .map((f) => ({ id: f.properties.id, name: f.properties.text }))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  });
}

// "17.126,49" -> 17126.49
function parseArea(s) {
  const n = Number(String(s ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function parsel(mahalleId, ada, parsel) {
  const list = await mahalleler();
  if (!list.some((m) => m.id === mahalleId)) throw new TkgmError(400, "Finike'ye ait bir mahalle seçin.");
  return cached(`p:${mahalleId}/${ada}/${parsel}`, DAY, async () => {
    const d = await get(`/parsel/${mahalleId}/${ada}/${parsel}`);
    const p = d.properties || {};
    if (p.ilceId !== FINIKE_ILCE_ID) throw new TkgmError(400, "Parsel Finike sınırları içinde değil.");
    return {
      mahalleId: p.mahalleId, mahalle: p.mahalleAd, ada: p.adaNo, parsel: p.parselNo,
      nitelik: p.nitelik || null, areaM2: parseArea(p.alan), mevkii: p.mevkii || null, pafta: p.pafta || null,
      geometry: d.geometry || null,
    };
  });
}
