# Ortak Girişi: Kurulum ve İşletim

Ortak girişi iki parçadan oluşur. Hepsi `finike` namespace'inde çalışır:

| Parça | Ne yapar |
| --- | --- |
| `postgres` | Ortak hesaplarını ve oturumları tutar (PostgreSQL 17, kalıcı disk) |
| `finike-api` | Giriş, çıkış, oturum ve şifre değiştirme (`api/` klasörü) |

Site (`finike.leykuph.com`) GitHub Pages'te kalır. `giris` ve `ortak` sayfaları API'ye tarayıcıdan bağlanır.

## İlk Kurulum

```sh
kubectl apply -f deploy/k8s/finike.yaml

# Veritabanı şifresi (bir kez; kaybolursa veritabanına erişim için gerekir)
kubectl -n finike create secret generic finike-db --from-literal=password="$(openssl rand -base64 32)"
```

API, Bevel'de `30878` NodePort'undan yayın yapar. Bevel'de zaten çalışan Cloudflare tüneline şu rota eklenir
(Zero Trust → Networks → Tunnels → Published application routes):

- Hostname: `finike-api.leykuph.com`
- Service: `http://localhost:30878`

Tek seviyeli alt alan adı bilerek seçildi: Cloudflare'in ücretsiz sertifikası `*.leykuph.com`'u kapsar,
`api.finike.leykuph.com` gibi iki seviyeli adları kapsamaz. Adres değişirse `js/uye.js` içindeki `API` değerini güncelleyin.

## Ortak Hesapları

Ortaklar kendileri kayıt olmaz; hesabı kooperatif açar ve geçici şifreyi ortağa iletir. Ortak ilk girişte kendi şifresini belirler.

```sh
API="kubectl -n finike exec deploy/finike-api -- node src/cli.js"

$API ekle "Ahmet" "Yılmaz"    # yeni hesap: yilmazah (doluysa yilmazahm, yilmazahme...) + geçici şifre
$API sifirla yilmazah          # şifresini unutan ortağa yeni geçici şifre
$API pasif yilmazah            # hesabı kapat (ortaklıktan ayrılma vb.)
$API aktif yilmazah            # yeniden aç
$API liste                    # bütün hesaplar
```

## Güncelleme

`api/` klasöründe yapılan her değişiklik `main`'e gönderildiğinde GitHub Actions yeni imajı
`ghcr.io/leykuph/finike-api:latest` olarak yayımlar. Sunucuda yeni imajı almak için:

```sh
kubectl -n finike rollout restart deploy/finike-api
```

## Yedek

```sh
kubectl -n finike exec statefulset/postgres -- pg_dump -U finike finike > finike-$(date +%F).sql
```

## Yerel Geliştirme

```sh
cd api && docker compose up --build        # API: http://localhost:8787
docker compose exec api node src/cli.js ekle "Deneme" "Ortak"
```

Siteyi `http://localhost:8000` adresinden açın. `js/uye.js`, localhost'ta otomatik olarak yerel API'yi kullanır.

## Kooperatifin Sunucusuna Taşıma

1. Yeni sunucuda aynı `finike.yaml` dosyasını uygulayın ve `finike-db` secret'ını oluşturun.
2. Bevel'den yedek alıp yeni sunucuya yükleyin: `psql -U finike finike < yedek.sql`
3. `finike-api.leykuph.com` rotasını yeni sunucudaki bir tünele taşıyın.
