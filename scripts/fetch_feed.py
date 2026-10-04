#!/usr/bin/env python3
"""Sosyal medya hesaplarından son gönderileri çekip feed.json yazar.

Yalnızca standart kütüphane kullanır. Anahtarlar ortam değişkenlerinden okunur
(GitHub Actions'ta repo secret olarak tanımlanır); tanımlı olmayan platform atlanır.

  YT_CHANNEL_ID   YouTube kanal kimliği (UC...). Anahtar gerekmez, RSS kullanılır.
  IG_TOKEN        Instagram API (Instagram ile giriş) uzun ömürlü erişim jetonu.
  FB_PAGE_ID      Facebook sayfa kimliği.
  FB_PAGE_TOKEN   O sayfanın erişim jetonu.
  X_USERNAME      X kullanıcı adı. Anahtar gerekmez, zaman tüneli bileşeninin verisi kullanılır.

Çalıştırma:  python3 scripts/fetch_feed.py  ->  feed.json
"""
import json
import re
from datetime import datetime
import os
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

LIMIT = 12  # platform başına en fazla gönderi
OUT = Path(__file__).resolve().parent.parent / "feed.json"


def get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "finike-feed/1.0", **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


def short(text, n=280):
    text = " ".join((text or "").split())
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def youtube(channel_id):
    ns = {"a": "http://www.w3.org/2005/Atom", "m": "http://search.yahoo.com/mrss/", "yt": "http://www.youtube.com/xml/schemas/2015"}
    root = ET.fromstring(get(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"))
    posts = []
    for e in root.findall("a:entry", ns)[:LIMIT]:
        vid = e.findtext("yt:videoId", "", ns)
        desc = e.findtext("m:group/m:description", "", ns)
        title = e.findtext("a:title", "", ns)
        stats = e.find("m:group/m:community/m:statistics", ns)
        views = stats.get("views") if stats is not None else ""
        posts.append({
            "platform": "youtube",
            "tarih": e.findtext("a:published", "", ns)[:10],
            "metin": short(title + (" — " + desc if desc else "")),
            "gorsel": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
            "etkilesim": f"{int(views):,} izlenme".replace(",", ".") if views else "",
            "link": f"https://www.youtube.com/watch?v={vid}",
        })
    return posts


def instagram(token):
    q = urllib.parse.urlencode({
        "fields": "caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        "limit": LIMIT, "access_token": token,
    })
    data = json.loads(get(f"https://graph.instagram.com/me/media?{q}"))["data"]
    posts = []
    for m in data:
        img = m.get("thumbnail_url") if m.get("media_type") == "VIDEO" else m.get("media_url")
        likes = m.get("like_count")
        posts.append({
            "platform": "instagram",
            "tarih": m["timestamp"][:10],
            "metin": short(m.get("caption", "")),
            "gorsel": img or "",
            "etkilesim": f"{likes} beğeni" if likes is not None else "",
            "link": m["permalink"],
        })
    return posts


def facebook(page_id, token):
    q = urllib.parse.urlencode({
        "fields": "message,created_time,permalink_url,full_picture",
        "limit": LIMIT, "access_token": token,
    })
    data = json.loads(get(f"https://graph.facebook.com/v21.0/{page_id}/posts?{q}"))["data"]
    return [{
        "platform": "facebook",
        "tarih": p["created_time"][:10],
        "metin": short(p.get("message", "")),
        "gorsel": p.get("full_picture", ""),
        "etkilesim": "",
        "link": p["permalink_url"],
    } for p in data if p.get("message") or p.get("full_picture")]


def x(screen_name):
    # X'in API'si ücretli; zaman tüneli bileşeninin beslendiği açık sunucu kullanılır.
    # X bazı hesaplar için boş liste döner; o durumda X gönderisi gösterilmez.
    html = get(f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{screen_name}",
               {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"}).decode()
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        raise ValueError("beklenmeyen yanıt")
    entries = json.loads(m.group(1))["props"]["pageProps"]["timeline"]["entries"]
    posts = []
    for e in entries:
        t = (e.get("content") or {}).get("tweet")
        if not t or "retweeted_status" in t or t.get("user", {}).get("screen_name", "").lower() != screen_name.lower():
            continue
        media = (t.get("extended_entities") or t.get("entities") or {}).get("media") or []
        text = t.get("full_text") or t.get("text") or ""
        for u in media:  # gönderi metnindeki görsel kısa linkini at
            text = text.replace(u.get("url", ""), "")
        posts.append({
            "platform": "x",
            "tarih": datetime.strptime(t["created_at"], "%a %b %d %H:%M:%S %z %Y").strftime("%Y-%m-%d"),
            "metin": short(text),
            "gorsel": media[0].get("media_url_https", "") if media else "",
            "etkilesim": f"{t.get('favorite_count', 0)} beğeni",
            "link": f"https://x.com/{screen_name}/status/{t['id_str']}",
        })
    return posts[:LIMIT]


def main():
    env = os.environ.get
    sources = [
        ("YouTube", youtube, [env("YT_CHANNEL_ID", "UCykCc9rSjvJvCy4jgshWmAg")]),
        ("Instagram", instagram, [env("IG_TOKEN")]),
        ("Facebook", facebook, [env("FB_PAGE_ID"), env("FB_PAGE_TOKEN")]),
        ("X", x, [env("X_USERNAME", "leykuph")]),
    ]
    old = {}
    if OUT.exists():
        for p in json.loads(OUT.read_text()):
            old.setdefault(p["platform"], []).append(p)

    posts, failed = [], False
    for name, fn, args in sources:
        key = fn.__name__
        if not all(args):
            print(f"{name}: atlandı (anahtar yok)")
            continue
        try:
            got = fn(*args)
            print(f"{name}: {len(got)} gönderi")
            posts += got
        except Exception as e:  # bir platform düşerse eski gönderileri koru
            print(f"{name}: HATA {e}", file=sys.stderr)
            posts += old.get(key, [])
            failed = True

    posts.sort(key=lambda p: p["tarih"], reverse=True)
    OUT.write_text(json.dumps(posts, ensure_ascii=False, indent=1) + "\n")
    print(f"feed.json: {len(posts)} gönderi")
    return 1 if failed and not posts else 0


if __name__ == "__main__":
    sys.exit(main())
