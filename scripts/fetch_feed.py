#!/usr/bin/env python3
"""Sosyal medya hesaplarından son gönderileri çekip feed.json yazar.

Yalnızca standart kütüphane kullanır. Anahtarlar ortam değişkenlerinden okunur
(GitHub Actions'ta repo secret olarak tanımlanır); tanımlı olmayan platform atlanır.

  IG_TOKEN        Instagram API (Instagram ile giriş) uzun ömürlü erişim jetonu.
  FB_PAGE_ID      Facebook sayfa kimliği.
  FB_PAGE_TOKEN   O sayfanın erişim jetonu.

Çalıştırma:  python3 scripts/fetch_feed.py  ->  feed.json
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

LIMIT = 12  # platform başına en fazla gönderi
OUT = Path(__file__).resolve().parent.parent / "feed.json"


def get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "finike-feed/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read()
    except urllib.error.HTTPError as e:  # Graph API hatanın nedenini gövdede döner
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode(errors='replace')[:500]}") from None


def short(text, n=280):
    text = " ".join((text or "").split())
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


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


def main():
    env = os.environ.get
    sources = [
        ("Instagram", instagram, [env("IG_TOKEN")]),
        ("Facebook", facebook, [env("FB_PAGE_ID"), env("FB_PAGE_TOKEN")]),
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
