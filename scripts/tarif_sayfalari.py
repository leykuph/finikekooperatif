#!/usr/bin/env python3
"""Tarif sayfalarını üretir: tarif/<slug>.html, tarifler.html'deki kartlar ve sitemap.xml.

Kullanım: python3 scripts/tarif_sayfalari.py
İçerik scripts/tarifler_veri.py'de. Üst menü ve alt bilgi tarifler.html'den alınır, böylece siteyle aynı kalır.
"""
import json, os, re, sys
from datetime import date
from html import escape

sys.path.insert(0, os.path.dirname(__file__))
from tarifler_veri import TARIFLER

KOK = os.path.join(os.path.dirname(__file__), "..")
SITE = "https://finikekooperatifi.com"
KURUM = "S.S. Finike Tarımsal Kalkınma Kooperatifi"
BUGUN = date.today().isoformat()
EN_AZ_KELIME = 600
BAS, SON = "<!-- TARIFLER:BAS -->", "<!-- TARIFLER:SON -->"
KATEGORI = {"tatli": "Tatlı", "tuzlu": "Tuzlu", "icecek": "İçecek", "kabuk": "Kabukla", "narenciye": "Diğer narenciye"}

def oku(yol):
    with open(os.path.join(KOK, yol), encoding="utf-8") as f: return f.read()

def yaz(yol, metin):
    tam = os.path.join(KOK, yol); os.makedirs(os.path.dirname(tam), exist_ok=True)
    with open(tam, "w", encoding="utf-8") as f: f.write(metin)

def ld(veri):
    return '<script type="application/ld+json">' + json.dumps(veri, ensure_ascii=False).replace("</", "<\\/") + "</script>"

def etiketler(t):
    return "".join('<span class="tag%s">%s</span>' % (" tag-leaf" if e in t.get("leaf", []) else "", escape(e)) for e in t["etiket"])

def kart(t, baslik="h2", yeni_sekme=False):
    hedef = ' target="_blank"' if yeni_sekme else ""
    return f'''<article class="card recipe" data-cat="{t["kat"]}">
        <div class="ph {t["ph"]}" role="img" aria-label="{escape(t["ad"])}"></div>
        <div class="recipe-body">
          <div class="part">{etiketler(t)}</div>
          <{baslik}>{escape(t["ad"])}</{baslik}>
          <p class="recipe-facts"><span>{t["sure"]}</span><span>{t["zorluk"]}</span><span>{t["porsiyon"]}</span></p>
          <p class="muted">{escape(t["ozet"])}</p>
          <a class="recipe-open" href="/tarif/{t["slug"]}"{hedef}>Tarifi oku</a>
        </div>
      </article>'''

def sayfa(t, ust, alt, hepsi):
    url = f'{SITE}/tarif/{t["slug"]}'
    gorsel = f'{SITE}/images/{t["gorsel"]}'
    baslik = f'{t["ad"]} Tarifi · Finike Kooperatifi'
    tarif_ld = {
        "@context": "https://schema.org", "@type": "Recipe", "name": t["ad"], "description": t["aciklama"],
        "image": [gorsel], "author": {"@type": "Organization", "name": KURUM, "url": SITE + "/"},
        "datePublished": "2026-10-12", "prepTime": t["hazirlik"], "cookTime": t["pisirme"], "totalTime": t["toplam"],
        "recipeYield": t["verim"], "recipeCategory": t["tur"], "recipeCuisine": "Türk",
        "keywords": f'{t["ad"].lower()}, Finike Portakalı, portakallı tarifler',
        "recipeIngredient": t["malzemeler"],
        "recipeInstructions": [{"@type": "HowToStep", "position": i + 1, "text": a} for i, a in enumerate(t["adimlar"])],
    }
    iz_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Ana sayfa", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Tarifler", "item": SITE + "/tarifler"},
        {"@type": "ListItem", "position": 3, "name": t["ad"], "item": url}]}
    p = lambda xs: "\n".join(f"      <p>{escape(x)}</p>" for x in xs)
    li = lambda xs: "".join(f"<li>{escape(x)}</li>" for x in xs)
    sss = "\n".join(f"      <h3>{escape(s)}</h3>\n      <p>{escape(c)}</p>" for s, c in t["sss"])
    ilgili = "\n      ".join(kart(hepsi[s], "h3") for s in t["ilgili"])
    kat = ", ".join(KATEGORI[k] for k in t["kat"].split())
    govde = f'''<main id="icerik">

<article class="tarif">
<header class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Konum"><a href="/">Ana sayfa</a><span aria-hidden="true">›</span><a href="/tarifler">Tarifler</a><span aria-hidden="true">›</span><span aria-current="page">{escape(t["ad"])}</span></nav>
    <div class="part">{etiketler(t)}</div>
    <h1>{escape(t["ad"])}</h1>
    <p class="lede">{escape(t["ozet"])}</p>
    <dl class="facts">
      <div><dt>Süre</dt><dd>{t["sure"]}</dd></div>
      <div><dt>Zorluk</dt><dd>{t["zorluk"]}</dd></div>
      <div><dt>Miktar</dt><dd>{t["porsiyon"]}</dd></div>
      <div><dt>Kategori</dt><dd>{kat}</dd></div>
    </dl>
  </div>
</header>

<div class="wrap tarif-icerik">
  <div class="ph {t["ph"]} tarif-gorsel" role="img" aria-label="{escape(t["ad"])}"></div>
  <div class="tarif-metin">
    <section>
{p(t["giris"])}
    </section>
    <section class="tarif-liste">
      <h2>Malzemeler</h2>
      <ul>{li(t["malzemeler"])}</ul>
    </section>
    <section class="tarif-liste">
      <h2>Yapılışı</h2>
      <ol>{li(t["adimlar"])}</ol>
    </section>
    <section>
      <h2>Püf Noktaları</h2>
{p(t["puf"])}
    </section>
    <section>
      <h2>Neden Finike Portakalı?</h2>
      <p>{escape(t["neden"])}</p>
    </section>
    <section>
      <h2>Servis ve Saklama</h2>
      <p>{escape(t["servis"])}</p>
    </section>
    <section>
      <h2>Sıkça Sorulan Sorular</h2>
{sss}
    </section>
  </div>
</div>
</article>

<section class="section" aria-labelledby="diger-baslik">
  <div class="wrap">
    <h2 id="diger-baslik">Diğer Portakallı Tarifler</h2>
    <div class="grid grid-3 diger">
      {ilgili}
    </div>
    <p style="margin-top:32px"><a class="btn" href="/tarifler">Bütün tarifler</a></p>
  </div>
</section>

</main>'''
    bas = f'''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="/icon.png" type="image/png" sizes="160x160">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>{escape(baslik)}</title>
<meta name="description" content="{escape(t["aciklama"])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{KURUM}">
<meta property="og:locale" content="tr_TR">
<meta property="og:title" content="{escape(t["ad"])} Tarifi">
<meta property="og:description" content="{escape(t["aciklama"])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{gorsel}">
<meta name="twitter:card" content="summary_large_image">
{ld(tarif_ld)}
{ld(iz_ld)}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Indie+Flower&family=Quicksand:wght@400..700&family=Merienda:wght@400..800&display=swap">
<link rel="stylesheet" href="/css/main.css?v=24">
<link rel="stylesheet" href="/css/tarifler.css?v=3">
<link rel="stylesheet" href="/css/tarif.css?v=1">
<script src="/js/main.js?v=4" defer></script>
</head>
'''
    html = bas + ust + govde + alt
    metin = re.sub(r"<[^>]+>", " ", govde.split('aria-labelledby="diger-baslik"')[0])
    kelime = len(re.findall(r"\w+", metin))
    return html, kelime

def main():
    liste = oku("tarifler.html")
    ust = liste[liste.index("<body>"):liste.index('<main id="icerik">')]
    alt = liste[liste.index("</main>") + len("</main>"):]
    hepsi = {t["slug"]: t for t in TARIFLER}
    eksik = []
    for t in TARIFLER:
        html, kelime = sayfa(t, ust, alt, hepsi)
        yaz(f'tarif/{t["slug"]}.html', html)
        print(f'{kelime:5d} kelime  /tarif/{t["slug"]}')
        if kelime < EN_AZ_KELIME: eksik.append(t["slug"])

    kartlar = "\n      ".join(kart(t, yeni_sekme=True) for t in TARIFLER)
    i, j = liste.index(BAS) + len(BAS), liste.index(SON)
    yaz("tarifler.html", liste[:i] + "\n      " + kartlar + "\n      " + liste[j:])

    sabit = [("", "1.0"), ("ureticilerimiz", "0.7"), ("tarifler", "0.8"), ("sosyal", "0.6"), ("iletisim", "0.7"),
             ("lisans", "0.6"), ("kvkk", "0.4"), ("cerez", "0.3")]
    satir = [f"  <url><loc>{SITE}/{y}</loc><lastmod>{BUGUN}</lastmod><priority>{o}</priority></url>" for y, o in sabit]
    satir += [f'  <url><loc>{SITE}/tarif/{t["slug"]}</loc><lastmod>{BUGUN}</lastmod><priority>0.7</priority></url>' for t in TARIFLER]
    yaz("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(satir) + "\n</urlset>\n")

    if eksik: sys.exit(f"{EN_AZ_KELIME} kelimenin altında: {', '.join(eksik)}")

if __name__ == "__main__":
    main()
