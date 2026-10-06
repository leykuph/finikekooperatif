# Ortak Girişi: Kurulum ve İşletim

Ortak girişi iki parçadan oluşur. Hepsi `finike` namespace'inde çalışır:

| Parça | Ne yapar |
| --- | --- |
| `postgres` | Ortak hesaplarını ve oturumları tutar (PostgreSQL 17, kalıcı disk) |
| `finike-api` | Giriş, çıkış, oturum ve şifre değiştirme (`api/` klasörü) |

Site (`finikekooperatifi.com`) GitHub Pages'te kalır. `giris` ve `ortak` sayfaları API'ye tarayıcıdan bağlanır.

## İlk Kurulum

```sh
kubectl apply -f deploy/k8s/finike.yaml

# Veritabanı şifresi (bir kez; kaybolursa veritabanına erişim için gerekir)
kubectl -n finike create secret generic finike-db --from-literal=password="$(openssl rand -base64 32)"
```

API `api.finikekooperatifi.com` adresinden yayındadır. `finikekooperatifi.com` ayrı bir Cloudflare hesabında olduğu
için tüneli kümenin içinde çalışır (`deploy/k8s/cloudflared.yaml`):

```sh
kubectl apply -f deploy/k8s/cloudflared.yaml
kubectl -n finike create secret generic cloudflared --from-literal=token='<TÜNEL JETONU>'
```

Tünelin rotası (Cloudflare → Zero Trust → Networks → Tunnels → Published application routes):
`api.finikekooperatifi.com` → `http://finike-api.finike.svc.cluster.local:80`

Site ile API aynı alan adı altında olmalıdır; oturum çerezi ancak böyle gönderilir. Eski `finike-api.leykuph.com` rotası
(Bevel'deki tünel, NodePort 30878) yalnızca geçiş dönemi içindir.

## Ortak Hesapları

Ortak kaydı, şifre sıfırlama ve hesap kapatma/açma yönetim panelinden (`/yonetim`) yapılır. Aşağıdaki komutlar
aynı işlemlerin sunucudan yapılabilen karşılıklarıdır (yönetici yetkisi vermek yalnızca komutla).

Ortaklar kendileri kayıt olmaz; hesabı kooperatif açar. İlk giriş şifresi ortağın TC kimlik numarası + cep telefonunun
son 4 hanesidir; komut bunları sorar ama kaydetmez, yalnızca şifrenin özeti saklanır. Ortağa yalnızca kullanıcı adını
bildirmek yeterlidir; komutun yazdırdığı mesajda gizli bilgi yoktur.

İlk şifre tahmin edilebilir bilgilerden oluştuğu için 30 gün geçerlidir ve 10 hatalı denemede hesap kilitlenir;
iki durumda da `sifirla` ile yenilenir. Ortak ilk girişte kendi şifresini belirler, sonrasında bu kurallar kalkar.

```sh
API="kubectl -n finike exec -it deploy/finike-api -- node src/cli.js"   # -it: TC ve telefonu sorabilmesi için

$API ekle "Ahmet" "Yılmaz"    # yeni hesap: yilmazah (doluysa yilmazahm, yilmazahme...); TC ve telefonu sorar
$API sifirla yilmazah          # şifresini unutan/kilitlenen ortak için ilk giriş şifresine döndür
$API pasif yilmazah            # hesabı kapat (ortaklıktan ayrılma vb.)
$API aktif yilmazah            # yeniden aç
$API yonetici yilmazah evet    # yönetim sayfasına (/yonetim) erişim; "hayir" ile geri alınır
$API liste                    # bütün hesaplar
```

## Parseller

Ortaklar panelde mahalle, ada ve parsel numarasıyla parsellerini ekler. Bilgiler (nitelik, alan, mevkii, pafta, sınırlar)
TKGM Parsel Sorgu'nun kullandığı MEGSİS servisinden alınır ve veritabanında saklanır. Bu servis resmî ve belgelenmiş
değildir; değişirse yalnızca `api/src/tkgm.js` güncellenir. Kayıtlı parseller servis çalışmasa da görünmeye devam eder.
Ortak başına saatte en fazla 60 sorgu yapılabilir.

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
3. Tünel jetonunu yeni sunucudaki `cloudflared` secret'ına yazın ve Bevel'deki `cloudflared`'ı durdurun.
