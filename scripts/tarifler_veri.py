# Tarif içerikleri. Sayfaları üretmek için: python3 scripts/tarif_sayfalari.py
# Her tarif /tarif/<slug> adresinde ayrı bir sayfa olur; tarifler.html'deki kartlar da buradan üretilir.

TARIFLER = [
{
  "slug": "taze-sikma-portakal-suyu",
  "ad": "Taze Sıkma Portakal Suyu",
  "kat": "icecek", "etiket": ["Su"], "ph": "ph-juice", "gorsel": "meyvesuyu.jpg",
  "sure": "5 dk", "zorluk": "Kolay", "porsiyon": "2 bardak",
  "hazirlik": "PT5M", "pisirme": "PT0M", "toplam": "PT5M", "verim": "2 bardak", "tur": "İçecek",
  "ozet": "Bekletmeden içilen portakal suyu en iyisidir. Finike Portakalı’nın düşük asidi sayesinde şeker eklemeye gerek kalmaz.",
  "aciklama": "Finike Portakalı ile evde taze sıkma portakal suyu nasıl yapılır? Daha çok su almanın, acılaşmayı önlemenin ve vitaminini korumanın püf noktaları.",
  "giris": [
    "Taze sıkma portakal suyu, mutfakta hazırlanabilecek en basit ama en çok emek isteyen içeceklerden biridir. Basittir, çünkü iki malzemeyle beş dakikada hazırlanır. Emek ister, çünkü lezzeti neredeyse tamamen portakalın kendisine bağlıdır: Kabuğu kalın, suyu az ya da asidi yüksek bir meyveden ne kadar özenle sıkarsanız sıkın, bardağa koyduğunuz su sizi tatmin etmez.",
    "Finike Portakalı bu yüzden portakal suyu için biçilmiş kaftandır. İnce kabuğu sayesinde ağırlığının büyük kısmı sudur, çekirdeksiz dilimleri sıkma işini kolaylaştırır ve dengeli asidi sayesinde şeker eklemeden içilir. Aşağıdaki tarif, bir bardak portakal suyunu en iyi hâliyle sofraya getirmenin adımlarını anlatıyor."
  ],
  "malzemeler": ["4-5 adet orta boy Finike Portakalı (2 bardak için)", "İsteğe göre birkaç buz küpü", "İsteğe göre birkaç taze nane yaprağı"],
  "adimlar": [
    "Portakalları sıkmadan en az bir saat önce buzdolabından çıkarın. Oda sıcaklığındaki portakal, soğuk portakala göre belirgin biçimde daha fazla su verir.",
    "Portakalları ılık suyun altında yıkayın ve kurulayın. Kabuk sıkma sırasında meyveye değeceği için bu adımı atlamayın.",
    "Her portakalı avucunuzun içiyle tezgâhın üzerinde bastırarak birkaç kez ileri geri yuvarlayın. Bu hareket meyvenin içindeki su keseciklerini gevşetir.",
    "Portakalları sapın olduğu uçtan değil, enine ortadan ikiye kesin. Enine kesim, dilimlerin tamamını sıkacağa açar.",
    "Yarımları narenciye sıkacağında, kabuğun beyaz kısmını ezmeden, orta kuvvetle sıkın. Kabuğu sonuna kadar zorlamak suya acılık veren yağları da çıkarır.",
    "Suyu posasıyla birlikte bardaklara paylaştırın. İsterseniz buz ve nane ekleyin, ancak beklemeden, en geç 15 dakika içinde için."
  ],
  "puf": [
    "Portakal suyunun en büyük düşmanı zamandır. Sıkıldıktan sonra hava ve ışıkla temas eden su hem aromasını hem de C vitamininin bir kısmını kaybetmeye başlar. Bu yüzden sabah kahvaltısı için gece sıkıp buzdolabında bekletmek yerine, sofraya oturmadan hemen önce sıkmak en doğrusudur.",
    "Kabuğu sonuna kadar sıkmamak da önemlidir. Beyaz kısım ve kabuk yağı suya karıştığında, birkaç dakika içinde hafif bir acılık belirir. Elektrikli sıkacak kullanıyorsanız portakalı fazla bastırmayın; elle sıkıyorsanız kabuğu ters çevirip zorlamayın.",
    "Posayı süzmeyin. Posa, suyun dokusunu zenginleştirir ve meyvenin lifinin bir kısmını bardağa taşır. Çocuklar posayı sevmiyorsa iri bir süzgeç kullanmak, ince tel süzgeçten daha iyi bir orta yoldur.",
    "Hasat dönemine dikkat edin. Finike’de Washington Navel çeşidi kasım ayından itibaren, Valencia ise kışın sonundan nisana kadar toplanır. Navel tatlı ve aromatik, Valencia ise daha sulu ve bekletmeye daha dayanıklıdır; ikisini karıştırarak sıkmak dengeli bir tat verir."
  ],
  "neden": "Portakal suyunda kalite, meyvenin ağırlığının ne kadarının su olduğuyla başlar. Finike Portakalı’nın ince kabuğu, aynı ağırlıktaki kalın kabuklu bir portakala göre bardağa daha fazla su koyar. Çekirdeksiz yapısı sıkma sırasında çekirdeklerin ezilip suya acılık vermesini engeller. Coğrafi işaret tescilinde de vurgulanan dengeli asit, suyun şeker eklemeden içilebilmesini sağlar. Kooperatif ortaklarımızın bahçesinden aracısız gelen portakal, dalından koptuktan kısa süre sonra mutfağınıza ulaştığı için suyu da daha tazedir.",
  "servis": "Taze sıkma portakal suyu en iyi kahvaltıda, sade ya da birkaç buzla içilir. Yanına simit, peynir ve zeytinli klasik bir Türk kahvaltısı çok yakışır. Arta kalan suyu cam bir şişede, ağzı kapalı olarak buzdolabında en fazla bir gün saklayabilirsiniz; ancak tadı ilk saattekiyle aynı olmaz. Fazla portakal suyunu buz kalıplarında dondurup daha sonra soslarda veya smoothie’lerde kullanmak israfı önler.",
  "sss": [
    ("Bir bardak portakal suyu için kaç portakal gerekir?", "Orta boy Finike Portakalı ile bir su bardağı (yaklaşık 200 ml) için genellikle 2-3 portakal yeterlidir. Portakalların oda sıcaklığında olması ve sıkmadan önce yuvarlanması verimi artırır."),
    ("Portakal suyu neden acılaşır?", "Acılık genellikle kabuğun beyaz kısmının ve kabuk yağının suya karışmasından ya da sıkılan suyun uzun süre bekletilmesinden kaynaklanır. Kabuğu fazla zorlamadan sıkıp suyu hemen içmek acılaşmayı önler."),
    ("Kalan kabuklar ne yapılır?", "Sıktığınız portakalların kabuklarını atmayın. Şekerlenmiş portakal kabuğu, portakal kabuğu reçeli ya da kurutulup kış çayında kullanılabilirler.")
  ],
  "ilgili": ["sekerlenmis-portakal-kabugu", "portakalli-ev-limonatasi", "portakal-kabuklu-tarcinli-kis-cayi"]
},
{
  "slug": "portakal-kabugu-receli",
  "ad": "Portakal Kabuğu Reçeli (Sarma)",
  "kat": "tatli kabuk", "etiket": ["Kabuk"], "ph": "ph-jar", "gorsel": "recel.jpg",
  "sure": "1 gün + 1,5 sa", "zorluk": "Orta", "porsiyon": "2 kavanoz",
  "hazirlik": "PT24H", "pisirme": "PT1H30M", "toplam": "PT25H30M", "verim": "2 kavanoz", "tur": "Tatlı",
  "ozet": "Kabukları rulo yapıp ipe dizerek pişirilen klasik Akdeniz reçeli. İnce kabuk sayesinde acılığı kolay alınır.",
  "aciklama": "Portakal kabuğu reçeli (sarma reçel) tarifi: Finike Portakalı kabuklarını rulo yapıp ipe dizerek acılığı alınmış, parlak ve yumuşak reçel yapmanın adımları.",
  "giris": [
    "Portakal kabuğu reçeli, Akdeniz ve Ege mutfağının en eski ev reçellerinden biridir. Kabukların rulo yapılıp iğne ile ipe dizildiği için “sarma reçel” ya da “dizme reçel” adıyla da bilinir. Kavanozda kıvrık kıvrık duran turuncu rulolar hem göze hoş görünür hem de kahvaltı sofrasının en çok konuşulan tadı olur.",
    "Bu reçelin sırrı sabırdır. Kabuklar bir gün boyunca suda bekletilerek acılıkları alınır, ardından şerbette yavaşça pişirilir. Finike Portakalı’nın ince kabuğu bu süreci kolaylaştırır: Kalın kabuklu portakallara göre acılık daha çabuk çıkar ve rulolar şerbeti daha eşit emer. Sonuç, dişe hafifçe direnen, parlak ve mis kokulu bir reçeldir."
  ],
  "malzemeler": ["6 adet Finike Portakalı’nın kabuğu", "3 su bardağı toz şeker", "2,5 su bardağı su", "Yarım limonun suyu", "Kalın bir dikiş iğnesi ve pamuklu iplik"],
  "adimlar": [
    "Portakalları ılık suda fırçayla yıkayın. Kabuğun en dış yüzeyini rendenin ince tarafıyla çok hafifçe sıyırın; bu işlem acı veren yağların bir kısmını alır ve kabuğun şerbeti daha iyi emmesini sağlar.",
    "Portakalları tepeden aşağı bıçakla 8 eşit dilime çizin ve kabukları meyveden ayırarak soyun. Meyvenin içini suyunu sıkmak veya salata için ayırın.",
    "Her kabuk dilimini turuncu yüzü dışarıda kalacak şekilde sıkıca rulo yapın ve iğne yardımıyla ipe dizin. Rulolar birbirine değecek kadar sık dizilmelidir ki açılmasınlar.",
    "İpe dizilmiş kabukları geniş bir kaba alın ve üzerini geçecek kadar soğuk su ekleyin. Bir gün boyunca suyunu 3-4 kez değiştirerek bekletin.",
    "Ertesi gün kabukları kaynar suya atın ve 10 dakika haşlayın. Süzüp soğuk sudan geçirin. Kabuktan bir parça tadın; hâlâ belirgin bir acılık varsa haşlamayı bir kez daha tekrarlayın.",
    "Geniş bir tencerede şeker ve suyu karıştırarak kaynatın. Şeker eridikten sonra ipteki kabukları ekleyin ve kısık ateşte, kapağı aralık olarak yaklaşık 1 saat pişirin.",
    "Şerbet koyulaşıp kabuklar yarı saydam hâle gelince limon suyunu ekleyin ve 5 dakika daha pişirin.",
    "Ocaktan aldıktan sonra rulolar ılınınca ipi dikkatlice çekip çıkarın. Kabukları sıcak, temiz kavanozlara yerleştirin, üzerine şerbeti dökün ve kapaklarını kapatın."
  ],
  "puf": [
    "Acılığı almak bu reçelin en kritik adımıdır. Suyu değiştirmeyi ihmal ederseniz reçel sonradan acı kalır ve şeker bunu gizleyemez. Bekletme suyu her değiştirdiğinizde biraz daha berrak çıkar; son sularda renk neredeyse kaybolmuşsa kabuklar hazırdır.",
    "Ruloları sıkı sarmak, pişerken açılmalarını engeller. İpi düğümlemeden önce iki ucunu birkaç santim uzun bırakın; böylece pişirme bittiğinde ipi kolayca çekebilirsiniz.",
    "Şerbeti fazla koyulaştırmayın. Reçel soğudukça koyulaşır. Kaşığa aldığınız şerbet damla damla değil de yavaş bir iplik gibi akıyorsa kıvamı yerindedir. Limon suyu hem şekerlenmeyi önler hem de rengi parlak tutar.",
    "Kavanozları önceden kaynar suda ya da 120 °C fırında 10 dakika tutarak sterilize edin. Reçeli sıcakken kavanozlayıp kapakları sıkıca kapatırsanız kapaklar soğurken vakum yapar ve reçel uzun süre bozulmadan kalır."
  ],
  "neden": "Kabuk reçelinin kalitesini kabuğun kendisi belirler. Finike Portakalı’nın kabuğu ince ve beyaz kısmı azdır; bu da hem acılığın daha kısa sürede alınmasını hem de reçelin yumuşak, lifsiz bir dokuda olmasını sağlar. Kooperatifimizin bahçelerinden gelen portakallar dalında olgunlaştığı için kabuk aroması da yoğundur. Sıkıp suyunu içtiğiniz portakalların kabuklarını bu tarifle değerlendirdiğinizde, meyvenin hiçbir kısmını atmamış olursunuz.",
  "servis": "Portakal kabuğu reçeli kahvaltıda tereyağlı ekmekle, kaymakla ya da beyaz peynirle çok yakışır. Bir rulo reçel ve bir kaşık şerbet, sade yoğurt veya dondurmanın üzerinde de hızlı bir tatlıya dönüşür. Ağzı kapalı, sterilize kavanozda serin ve karanlık bir dolapta bir yıla kadar saklanabilir. Kavanozu açtıktan sonra buzdolabında tutun ve temiz kaşık kullanın.",
  "sss": [
    ("Portakal kabuğu reçeli neden acı olur?", "Kabuklar yeterince uzun bekletilmediğinde veya suyu sık değiştirilmediğinde acılık reçele geçer. Bir gün bekletme ve ardından haşlama, acılığın büyük kısmını alır."),
    ("İp olmadan yapılabilir mi?", "Evet. Kabukları ince şeritler hâlinde keserek de aynı tarifi uygulayabilirsiniz. Ancak rulolar daha düzgün görünür ve pişerken şekillerini korur."),
    ("Reçel şekerlenirse ne yapmalı?", "Kavanozu ılık su banyosuna koyup reçeli yavaşça ısıtın. Bir sonraki sefer şerbete eklenen limon suyunu biraz artırmak şekerlenmeyi önler.")
  ],
  "ilgili": ["sekerlenmis-portakal-kabugu", "portakalli-irmik-tatlisi", "taze-sikma-portakal-suyu"]
},
{
  "slug": "portakalli-irmik-tatlisi",
  "ad": "Portakallı İrmik Tatlısı",
  "kat": "tatli", "etiket": ["Su", "Kabuk rendesi"], "ph": "ph-dish", "gorsel": "kesit.jpg",
  "sure": "40 dk + 3 sa", "zorluk": "Kolay", "porsiyon": "6 kişilik",
  "hazirlik": "PT10M", "pisirme": "PT30M", "toplam": "PT3H40M", "verim": "6 kişilik", "tur": "Tatlı",
  "ozet": "Sütlü irmiğin üstüne dökülen parlak portakal jölesi. Soğuk servis edilir, sofrada en çok tarif istenen tatlıdır.",
  "aciklama": "Portakallı irmik tatlısı tarifi: sütlü irmik tabanı ve taze Finike Portakalı suyuyla yapılan parlak portakal sosu ile hafif, soğuk servis edilen tatlı.",
  "giris": [
    "Portakallı irmik tatlısı, son yılların ev sofralarında en çok tarifi sorulan tatlılarından biridir. Altında yumuşak, sütlü bir irmik tabanı, üstünde ise taze portakal suyuyla pişirilmiş parlak, turuncu bir jöle vardır. Kesildiğinde iki katın birbirinden net ayrıldığı görüntüsü kadar, ağır şerbetli tatlılara göre çok daha hafif olmasıyla da sevilir.",
    "Bu tatlının bütün lezzeti portakal sosundan gelir. Hazır meyve suyu yerine taze sıkılmış Finike Portakalı suyu kullanıldığında sosun rengi daha canlı, aroması daha belirgin olur. Kabuk rendesi ise sosa portakalın kokusunu taşır. Malzemeler herkesin mutfağında bulunur ve hazırlığı kırk dakikayı geçmez; geri kalan işi buzdolabı yapar."
  ],
  "malzemeler": ["1 litre süt", "1 su bardağı irmik", "1 su bardağı toz şeker", "1 yemek kaşığı tereyağı", "1 paket vanilya", "Sos için: 2 su bardağı taze sıkılmış Finike Portakalı suyu", "Sos için: 3 yemek kaşığı toz şeker", "Sos için: 2 yemek kaşığı mısır nişastası", "Sos için: 1 portakalın kabuk rendesi", "Süslemek için: birkaç portakal dilimi veya ceviz içi"],
  "adimlar": [
    "Sütü, irmiği ve şekeri bir tencereye alın. Ocağı açmadan önce iyice karıştırın; böylece irmik topaklanmaz.",
    "Orta ateşte, sürekli karıştırarak pişirin. Karışım kaynayıp koyulaşmaya başladığında ateşi kısın ve 5 dakika daha karıştırmaya devam edin.",
    "Ocaktan alın, tereyağı ve vanilyayı ekleyip tereyağı eriyene kadar karıştırın.",
    "Yaklaşık 20x30 cm boyutundaki bir borcamın içini suyla ıslatın ve irmiği dökün. Üzerini spatulayla düzeltin ve ılınmaya bırakın.",
    "Sos için portakal suyunu, şekeri ve nişastayı soğukken bir tencerede çırpıcıyla karıştırın. Nişasta tamamen çözülmelidir.",
    "Karışımı orta ateşte sürekli karıştırarak pişirin. Kaynayıp koyulaşınca ve rengi parlaklaşınca ocaktan alın, kabuk rendesini ekleyin.",
    "Sosu biraz ılıttıktan sonra irmiğin üzerine bir kaşık yardımıyla eşit şekilde yayın.",
    "Tatlıyı oda sıcaklığına geldikten sonra buzdolabına koyun ve en az 3 saat dinlendirin. Dilimleyip portakal dilimleri veya cevizle süsleyerek servis edin."
  ],
  "puf": [
    "Borcamı ıslatmak küçük ama önemli bir adımdır. Islak yüzey irmiğin yapışmasını engeller ve dilimleri temiz çıkarmanızı sağlar.",
    "Sosu irmiğin üzerine dökmeden önce irmiğin üst yüzeyinin hafifçe kabuk bağlamasını bekleyin. Sıcak irmiğin üzerine sıcak sos dökerseniz iki kat birbirine karışır ve tatlının o net görüntüsü kaybolur.",
    "Kabuk rendesini sadece turuncu kısımdan alın. Beyaz kısım sosa acılık verir. Rendeyi sosu ocaktan aldıktan sonra eklemek, kabuğun uçucu aromasının pişerken kaybolmasını önler.",
    "Portakal suyunuz çok tatlıysa sostaki şekeri bir kaşık azaltabilirsiniz. Finike Portakalı’nın dengeli asidi sayesinde sos genellikle fazladan şekere ihtiyaç duymaz; tadına bakarak karar verin."
  ],
  "neden": "Bu tatlıda portakal hem renk hem tat hem de koku olarak kendini gösterir. Taze sıkılmış Finike Portakalı suyu, sosa hazır meyve sularında bulunmayan canlı bir turuncu renk ve meyvenin gerçek aromasını verir. İnce ve aromatik kabuğu ise az miktarda rendeyle bile sosu kokulandırır. Coğrafi işaret tescilli Finike Portakalı’nın tatlı-ekşi dengesi, sütlü irmik tabanıyla bir araya geldiğinde ne fazla şekerli ne de fazla ekşi bir tat ortaya çıkarır.",
  "servis": "Portakallı irmik tatlısı soğuk servis edilir. Kare dilimler hâlinde kesip her dilimin üzerine bir portakal dilimi ya da bir ceviz içi koyabilirsiniz. Yanında demli bir çay ya da Türk kahvesi çok yakışır. Üzeri streç filmle kapatılmış olarak buzdolabında 3 gün saklanabilir. Dondurucuya koymayın; sos çözülürken suyunu bırakır.",
  "sss": [
    ("Portakal sosu neden kıvam almadı?", "Nişasta soğuk sıvıda tam çözülmediğinde veya sos yeterince kaynatılmadığında kıvam tutmaz. Sosu kaynadıktan sonra bir iki dakika daha karıştırarak pişirmek gerekir."),
    ("Hazır portakal suyu kullanılabilir mi?", "Kullanılabilir, ancak renk ve aroma taze sıkılmış suyla aynı olmaz. Hazır meyve sularının çoğu şekerli olduğu için sostaki şekeri de azaltmanız gerekir."),
    ("İrmik yerine başka bir taban olur mu?", "İrmik yerine pirinç unu veya bisküvi tabanı da kullanılabilir. Bisküvi tabanı için ufalanmış bisküviyi eritilmiş tereyağıyla karıştırıp borcamın dibine bastırmanız yeterli.")
  ],
  "ilgili": ["portakal-kabugu-receli", "sekerlenmis-portakal-kabugu", "taze-sikma-portakal-suyu"]
},
{
  "slug": "portakalli-narli-roka-salatasi",
  "ad": "Portakallı, Narlı Roka Salatası",
  "kat": "tuzlu", "etiket": ["Dilim", "Su"], "ph": "ph-dish", "gorsel": "kesit.jpg",
  "sure": "15 dk", "zorluk": "Kolay", "porsiyon": "4 kişilik",
  "hazirlik": "PT15M", "pisirme": "PT0M", "toplam": "PT15M", "verim": "4 kişilik", "tur": "Salata",
  "ozet": "Çekirdeksiz dilimler zarından ayrılınca salatanın yıldızı olur. Nar ve ceviz kış sofrasını tamamlar.",
  "aciklama": "Portakallı, narlı roka salatası tarifi: zarından ayrılmış Finike Portakalı dilimleri, nar, ceviz ve portakal suyu soslu 15 dakikalık kış salatası.",
  "giris": [
    "Kışın sofraya renk getiren en kolay yol bir kase portakallı salatadır. Bu tarifte acımsı roka, tatlı ve sulu portakal dilimleri, ekşimsi nar taneleri ve çıtır ceviz bir araya gelir. Her lokmada farklı bir tat ve doku hissedilir. Hazırlaması on beş dakika sürer, pişirme gerektirmez ve hem et yemeklerinin yanına hem de tek başına hafif bir öğün olarak yakışır.",
    "Salatanın yıldızı, zarından ayrılmış portakal dilimleridir. Profesyonel mutfaklarda “supreme” adı verilen bu teknik, dilimleri ince zarlarından kurtararak yalnızca sulu meyve etini bırakır. Finike Portakalı’nın çekirdeksiz yapısı bu işi çok kolaylaştırır; çekirdek ayıklamakla uğraşmadan, temiz ve parlak dilimler elde edersiniz."
  ],
  "malzemeler": ["1 demet roka", "2 adet Finike Portakalı", "Yarım nar", "1 küçük kırmızı soğan", "Bir avuç ceviz içi", "Sos için: 3 yemek kaşığı zeytinyağı", "Sos için: 2 yemek kaşığı taze portakal suyu", "Sos için: 1 tatlı kaşığı nar ekşisi", "Sos için: tuz ve isteğe göre karabiber"],
  "adimlar": [
    "Rokayı bol suda yıkayın, kalın saplarını ayıklayın ve salata kurutucusunda ya da temiz bir bezle iyice kurulayın. Islak roka sosu tutmaz.",
    "Portakalların alt ve üst uçlarını düz bir şekilde kesin, böylece tezgâhta sabit dururlar.",
    "Keskin bir bıçakla kabuğu yukarıdan aşağıya, beyaz kısmıyla birlikte şeritler hâlinde soyun. Meyvenin yüzeyinde beyaz kısım kalmamalıdır.",
    "Portakalı elinizde tutarak bıçağı her dilimin iki yanındaki zarın hemen içinden geçirin ve dilimleri bir kaseye çıkarın. Kalan zarı kasenin üzerinde sıkarak suyunu alın; bu suyu sosta kullanacaksınız.",
    "Narı tanelerine ayırın. Kırmızı soğanı ince halkalar hâlinde doğrayın; acılığını azaltmak isterseniz 5 dakika soğuk suda bekletip süzün.",
    "Cevizleri kuru bir tavada 2-3 dakika hafifçe kavurun ve iri parçalar hâlinde kırın.",
    "Sos malzemelerini küçük bir kavanozda kapağı kapalı olarak çalkalayın.",
    "Rokayı servis tabağına yayın; portakal dilimlerini, soğanı, narı ve cevizi üzerine dağıtın. Sosu servis etmeden hemen önce gezdirin."
  ],
  "puf": [
    "Sosu en son eklemek bu salatanın altın kuralıdır. Roka narin bir yapraktır; sosla erken buluşursa birkaç dakika içinde söner ve suyunu bırakır.",
    "Portakal dilimlerini çıkardıktan sonra kalan zarı sıkmayı unutmayın. Bu su, sosun içine portakalın kendi tadını taşır ve salatanın bütün malzemelerini birbirine bağlar.",
    "Cevizi kavurmak küçük ama fark yaratan bir adımdır. Isı cevizin yağını harekete geçirir, acılığını azaltır ve onu daha çıtır yapar. Tavadan gözünüzü ayırmayın; ceviz çok çabuk yanar.",
    "Nar ekşisi yoksa birkaç damla limon suyu ve bir tutam şekerle benzer bir denge kurabilirsiniz. Salataya keçi peyniri ya da ezine peyniri eklemek onu doyurucu bir öğüne dönüştürür."
  ],
  "neden": "Bir salatada portakal dilimlerinin göz önünde olduğunu düşünürsek, meyvenin görüntüsü ve dokusu tadı kadar önemlidir. Finike Portakalı çekirdeksizdir; bu sayede dilimler bölünmeden, bütün ve düzgün çıkar. İnce zarı kolay ayrılır ve dilimler suyunu salata tabağına değil ağzınıza bırakır. Tatlı-ekşi dengesi, rokanın acımsı tadını ve nar ekşisinin keskinliğini yumuşatır. Kooperatif üreticilerimizin bahçesinden gelen taze portakal, salatanın renginin de canlı kalmasını sağlar.",
  "servis": "Bu salata fırında balık, ızgara tavuk ya da kuzu etinin yanına çok yakışır. Yılbaşı ve kış sofralarında renkleriyle masanın en dikkat çeken tabağı olur. Sossuz hâlde, malzemeleri ayrı kaplarda tutarak buzdolabında yarım gün saklayabilirsiniz. Sos eklendikten sonra salata en geç bir saat içinde tüketilmelidir.",
  "sss": [
    ("Portakal dilimleri zarından nasıl ayrılır?", "Kabuğu beyaz kısmıyla birlikte bıçakla soyduktan sonra, bıçağı her dilimin iki yanındaki zarın hemen içinden geçirerek dilimleri tek tek çıkarabilirsiniz. Keskin, ince ağızlı bir bıçak işi çok kolaylaştırır."),
    ("Roka yerine başka yeşillik kullanılabilir mi?", "Evet. Kıvırcık, semizotu, ıspanak yaprağı veya marul karışımı da bu salataya uyar. Hafif acılığı olan yeşillikler portakalla en iyi dengeyi kurar."),
    ("Salata önceden hazırlanabilir mi?", "Malzemeleri önceden hazırlayıp ayrı kaplarda saklayabilirsiniz. Sosu ve rokayı servisten hemen önce birleştirmek gerekir.")
  ],
  "ilgili": ["portakalli-firin-tavuk-baget", "portakalli-zeytinyagli-enginar", "taze-sikma-portakal-suyu"]
},
{
  "slug": "portakalli-firin-tavuk-baget",
  "ad": "Portakallı Fırın Tavuk Baget",
  "kat": "tuzlu", "etiket": ["Su", "Dilim"], "ph": "ph-dish", "gorsel": "kesit.jpg",
  "sure": "1 sa 10 dk", "zorluk": "Kolay", "porsiyon": "4 kişilik",
  "hazirlik": "PT30M", "pisirme": "PT40M", "toplam": "PT1H10M", "verim": "4 kişilik", "tur": "Ana yemek",
  "ozet": "Portakal suyu ve balla karamelize olan tavuk. Tatlı-tuzlu dengeyi düşük asitli Finike Portakalı kurar.",
  "aciklama": "Portakallı fırın tavuk baget tarifi: Finike Portakalı suyu, bal ve sarımsakla marine edilip fırında karamelize olan, tatlı-tuzlu dengeli ana yemek.",
  "giris": [
    "Portakallı tavuk, tatlı ve tuzlu tatları bir arada sevenlerin vazgeçemediği bir yemektir. Bu tarifte tavuk bagetler taze portakal suyu, bal, sarımsak ve kekikten oluşan bir sosta marine edilir, ardından portakal halkalarının üzerinde fırında pişirilir. Pişme sırasında sos koyulaşır ve tavuğun derisini parlak, hafif karamelize bir tabakayla kaplar.",
    "Yemeğin başarısı portakal suyunun dengesine bağlıdır. Çok ekşi bir portakal etin üzerinde keskin bir tat bırakır, çok tatlı olanı ise sosu şurup gibi yapar. Finike Portakalı’nın dengeli asidi bu iki uç arasında doğru noktayı bulur. Hazırlığı kısa, pişirmesi ise neredeyse tamamen fırına bırakılan bu tarif, kalabalık akşam yemekleri için de idealdir."
  ],
  "malzemeler": ["8 adet tavuk baget", "1 su bardağı taze sıkılmış Finike Portakalı suyu", "1 portakalın kabuk rendesi", "2 yemek kaşığı bal", "2 diş sarımsak, ezilmiş", "2 yemek kaşığı zeytinyağı", "1 tatlı kaşığı tuz", "Yarım tatlı kaşığı karabiber", "1 tatlı kaşığı kuru kekik", "1 adet Finike Portakalı, halka dilimlenmiş"],
  "adimlar": [
    "Tavuk bagetleri soğuk sudan geçirin ve kağıt havluyla iyice kurulayın. Derinin kuru olması, fırında daha iyi kızarmasını sağlar.",
    "Her bagetin kalın kısmına bıçakla 2-3 çizik atın. Böylece sos etin içine daha iyi işler ve tavuk eşit pişer.",
    "Portakal suyu, kabuk rendesi, bal, sarımsak, zeytinyağı, tuz, karabiber ve kekiği geniş bir kapta çırpın.",
    "Bagetleri sosa ekleyin ve her tarafı kaplanacak şekilde karıştırın. Kabın üzerini kapatıp en az 30 dakika, mümkünse 2-3 saat buzdolabında marine edin.",
    "Fırını 200 °C’ye ısıtın. Portakal halkalarını fırın tepsisinin tabanına dizin.",
    "Bagetleri portakal halkalarının üzerine yerleştirin ve marine sosunun yarısını üzerine dökün. Kalan sosu ayırın.",
    "Tavukları 40 dakika pişirin. Pişirmenin ortasında bagetleri çevirin ve ayırdığınız sosla fırçalayarak yağlayın.",
    "Son 5 dakikada fırının üst ızgarasını açarak derinin karamelize olmasını sağlayın. Bagetlerin en kalın yerine bıçak batırdığınızda berrak su çıkıyorsa tavuk pişmiştir."
  ],
  "puf": [
    "Marine süresini kısaltmayın. Portakal suyundaki doğal asit tavuğu yumuşatır, bal ve sarımsak ise lezzeti etin içine taşır. Bir gece önceden marine edilmiş tavuk, en lezzetli sonucu verir.",
    "Portakal halkaları sadece süs değildir. Tavukların altında kalarak hem etin tepsiye yapışmasını engeller hem de pişerken kendi suyunu sosa bırakır. Fırından çıkan karamelize halkaları servis tabağında tavukla birlikte sunun.",
    "Bal yanmaya eğilimlidir. Tavuğun üst kısmı pişme süresi dolmadan fazla kararıyorsa tepsinin üzerine gevşekçe yağlı kâğıt ya da folyo örtün.",
    "Tepside kalan sosu atmayın. Bir tencereye alıp birkaç dakika kaynatarak koyulaştırın ve servis sırasında tavukların üzerine gezdirin."
  ],
  "neden": "Tatlı-tuzlu yemeklerde meyvenin asit ve şeker dengesi her şeydir. Finike Portakalı’nın dengeli asidi, balın tatlılığını dengeleyerek sosun ağır ve şekerli olmasını engeller. İnce kabuğu sayesinde kabuk rendesi aromatiktir ve acılık bırakmaz. Halkalar hâlinde fırına giren dilimler, çekirdeksiz olduğu için yemeğin içinde çekirdek bırakmaz. Kooperatifimizin üreticilerinden gelen taze portakal, sosun lezzetini doğrudan belirler.",
  "servis": "Portakallı fırın tavuk; tereyağlı pirinç pilavı, bulgur pilavı ya da fırında patatesle çok iyi gider. Yanına portakallı, narlı roka salatası koyarak bütün bir portakal menüsü hazırlayabilirsiniz. Artan tavuk ağzı kapalı bir kapta buzdolabında 2 gün saklanabilir. Isıtırken sosu sulandırmak için birkaç kaşık portakal suyu ekleyin.",
  "sss": [
    ("Baget yerine tavuğun başka kısmı kullanılabilir mi?", "Evet. Bütün but, kalçalı but veya kanat da bu tarifle güzel olur. Göğüs eti daha çabuk kuruduğu için pişirme süresini 25-30 dakikaya düşürmek gerekir."),
    ("Bal yerine ne kullanılabilir?", "Bal yerine pekmez veya esmer şeker kullanabilirsiniz. Pekmez sosa daha koyu bir renk ve hafif yanık bir aroma verir."),
    ("Tavuğun piştiği nasıl anlaşılır?", "Bagetin en kalın yerine bıçak batırdığınızda çıkan su berrak olmalı, pembe olmamalıdır. Et termometresi kullanıyorsanız iç sıcaklık 75 °C’ye ulaşmalıdır.")
  ],
  "ilgili": ["portakalli-narli-roka-salatasi", "portakalli-zeytinyagli-enginar", "portakalli-irmik-tatlisi"]
},
{
  "slug": "sekerlenmis-portakal-kabugu",
  "ad": "Şekerlenmiş Portakal Kabuğu",
  "kat": "tatli kabuk", "etiket": ["Kabuk"], "ph": "ph-peel", "gorsel": "kuru.jpg",
  "sure": "2 sa + kuruma", "zorluk": "Orta", "porsiyon": "1 kavanoz",
  "hazirlik": "PT30M", "pisirme": "PT1H30M", "toplam": "PT14H", "verim": "1 kavanoz", "tur": "Tatlı",
  "ozet": "Sıktığınız portakalların kabuğunu çöpe atmayın. Bitter çikolataya batırınca kahvenin yanına hazır ikram olur.",
  "aciklama": "Şekerlenmiş portakal kabuğu (portakal şekerlemesi) tarifi: Finike Portakalı kabuklarını haşlayıp şerbette pişirerek yapılan, çikolatalı da sunulabilen ev şekerlemesi.",
  "giris": [
    "Şekerlenmiş portakal kabuğu, sıfır atık mutfağın en lezzetli örneklerinden biridir. Kahvaltıda sıkılan portakalların kabukları, birkaç saatlik emekle kavanozda saklanan, şeker kristalleriyle kaplı turuncu şekerlemelere dönüşür. Avrupa pastanelerinde “candied peel” ya da “orangette” adıyla satılan bu şekerlemeyi evde yapmak hem çok daha ekonomik hem de çok daha lezzetlidir.",
    "Tarifin sırrı, kabukların birkaç kez haşlanarak acılığının alınması ve ardından kısık ateşte, sabırla şerbette pişirilmesidir. Finike Portakalı’nın ince kabuğu bu işlemi kısaltır; kabuklar şerbeti daha hızlı emer ve yarı saydam, yumuşak bir dokuya kavuşur. Bitter çikolataya batırıldığında ise kahvenin yanında sunulabilecek en şık ikramlardan biri olur."
  ],
  "malzemeler": ["4 adet Finike Portakalı’nın kabuğu", "2 su bardağı toz şeker (şerbet için)", "1 su bardağı su", "Yarım su bardağı toz şeker (bulamak için)", "İsteğe göre: 100 gram bitter çikolata"],
  "adimlar": [
    "Portakalları ılık suda fırçayla yıkayın. Kabukları dört parça hâlinde soyun ve meyveden ayırın.",
    "Kabukları yaklaşık parmak kalınlığında, 5-6 mm genişliğinde uzun şeritler hâlinde kesin. Beyaz kısım çok kalınsa bir kaşıkla bir kısmını sıyırabilirsiniz.",
    "Şeritleri bir tencereye alın, üzerini geçecek kadar soğuk su ekleyin ve kaynatın. Kaynadıktan sonra 5 dakika pişirip süzün.",
    "Bu haşlama işlemini her seferinde suyu değiştirerek toplam 3 kez tekrarlayın. Her haşlama kabuklardaki acılığın bir kısmını daha alır.",
    "Aynı tencerede 2 su bardağı şeker ile 1 su bardağı suyu kaynatın. Şeker eridiğinde süzülmüş kabukları ekleyin.",
    "Kabukları kısık ateşte, ara sıra karıştırarak 45-60 dakika pişirin. Kabuklar yarı saydam hâle gelip şerbet koyulaştığında ocaktan alın.",
    "Kabukları bir süzgeçle şerbetten çıkarın ve bir tel ızgaranın üzerine aralıklı olarak dizin. Bir gece oda sıcaklığında kurumaya bırakın.",
    "Ertesi gün kabukları toz şekere bulayın. İsterseniz benmari usulü eritilmiş bitter çikolataya yarısına kadar batırıp yağlı kâğıt üzerinde donmaya bırakın."
  ],
  "puf": [
    "Haşlama sayısını kabuğun tadına göre ayarlayın. Üçüncü haşlamadan sonra bir şerit tadın; hâlâ belirgin bir acılık varsa bir kez daha haşlayın. Finike Portakalı’nın ince kabuğunda genellikle üç haşlama yeterli olur.",
    "Şerbeti yüksek ateşte kaynatmayın. Yüksek ısıda şeker karamelleşir ve kabuklar sertleşir. Kısık ateşte ağır ağır pişirmek, kabuğun şerbeti içine çekmesini ve yumuşak kalmasını sağlar.",
    "Kurutma süresini kısaltmayın. Yeterince kurumamış kabuklar şekeri eritir ve kavanozda birbirine yapışır. Havalandırmalı fırında 50 °C’de 1-2 saat kurutarak süreci hızlandırabilirsiniz.",
    "Kalan şerbeti atmayın. Portakal aromalı bu şurup; kek, pankek, yoğurt ya da çayı tatlandırmak için mükemmeldir. Ağzı kapalı bir şişede buzdolabında haftalarca saklanır."
  ],
  "neden": "Şekerlemede kabuğun kalitesi, son ürünün dokusunu ve aromasını doğrudan belirler. Finike Portakalı’nın ince ve aromatik kabuğu, kalın kabuklu portakallara göre daha az beyaz kısım içerir; bu yüzden şekerleme daha az lifli ve daha yumuşak olur. Dalında olgunlaşan portakalların kabuğundaki uçucu yağlar daha yoğundur ve şekerlemeye belirgin bir portakal kokusu verir. Kooperatif ortaklarımızın bahçesinden gelen portakalı sıkıp suyunu içtikten sonra kabuğunu bu tarifle değerlendirmek, meyvenin tamamından yararlanmak demektir.",
  "servis": "Şekerlenmiş portakal kabuğu Türk kahvesi ya da espresso yanında ikram olarak sunulabilir. Küçük parçalar hâlinde doğranarak keklere, kurabiyelere, panettone ve aşure gibi tatlılara eklenebilir. Hava almayan bir kavanozda, serin ve kuru bir yerde 1-2 ay saklanabilir. Çikolatalı olanları sıcak havalarda buzdolabında tutun.",
  "sss": [
    ("Şekerlenmiş kabuk neden sert oldu?", "Şerbet çok yüksek ateşte veya çok uzun süre kaynatıldığında şeker karamelleşir ve kabuklar sertleşir. Kısık ateşte pişirmek ve kabuklar yarı saydam olunca ocaktan almak gerekir."),
    ("Mandalina veya limon kabuğuyla da yapılır mı?", "Evet. Mandalina kabuğu daha ince olduğu için daha az haşlama ister; limon kabuğu ise daha acı olduğu için bir haşlama fazla yapılmalıdır."),
    ("Kabuklar ne kadar dayanır?", "İyice kurutulup şekere bulanmış kabuklar hava almayan bir kavanozda serin bir yerde 1-2 ay saklanabilir.")
  ],
  "ilgili": ["portakal-kabugu-receli", "portakal-kabuklu-tarcinli-kis-cayi", "portakalli-irmik-tatlisi"]
},
{
  "slug": "portakal-kabuklu-tarcinli-kis-cayi",
  "ad": "Portakal Kabuklu Tarçınlı Kış Çayı",
  "kat": "icecek kabuk", "etiket": ["Kabuk", "Kuru dilim"], "ph": "ph-juice", "gorsel": "kuru.jpg",
  "sure": "10 dk", "zorluk": "Kolay", "porsiyon": "4 bardak",
  "hazirlik": "PT3M", "pisirme": "PT7M", "toplam": "PT10M", "verim": "4 bardak", "tur": "İçecek",
  "ozet": "Kurutulmuş kabuk veya dilimlerle demlenen, şekersiz bile tatlı aromalı bir kış içeceği.",
  "aciklama": "Portakal kabuklu tarçınlı kış çayı tarifi: kurutulmuş Finike Portakalı kabuğu, tarçın ve karanfille demlenen, şekersiz de tatlı aromalı sıcak içecek. Kabuk kurutma yöntemiyle.",
  "giris": [
    "Soğuk kış akşamlarında evin içini portakal ve tarçın kokusuyla dolduran bir bardak sıcak içecek kadar iyi gelen az şey vardır. Portakal kabuklu tarçınlı kış çayı, kurutulmuş portakal kabuğu ya da dilimleri, tarçın çubuğu ve karanfille demlenen kafeinsiz bir bitki çayıdır. Şeker eklemeden bile tatlımsı bir aromaya sahiptir ve hazırlaması on dakika sürer.",
    "Bu çayın en güzel yanı, mutfakta çoğu zaman çöpe giden portakal kabuklarını değerlendirmesidir. Kış boyunca sıktığınız Finike Portakalı’nın kabuklarını kurutup bir kavanozda biriktirirseniz, bütün mevsim boyunca elinizin altında hazır bir çay malzemesi olur. Aşağıda hem çayın tarifini hem de kabukların evde nasıl kurutulacağını bulacaksınız."
  ],
  "malzemeler": ["1 litre su", "Bir avuç kurutulmuş Finike Portakalı kabuğu veya 4-5 kuru portakal dilimi", "1 çubuk tarçın", "3 adet karanfil", "İsteğe göre: 1 dilim taze zencefil", "İsteğe göre: bal"],
  "adimlar": [
    "Kabukları kendiniz kurutacaksanız: Portakalları ılık suda fırçayla yıkayın, kabuğun yalnızca turuncu kısmını soyacakla ince şeritler hâlinde alın.",
    "Şeritleri bir tepsiye tek kat olarak yayın ve kuru, havadar bir yerde 3-4 gün ya da 60 °C fırında kapağı aralık olarak 2-3 saat kurutun. Kabuklar kırıldığında çıtırdamalıdır.",
    "Kuru dilim için portakalları 4-5 mm kalınlığında halkalar hâlinde kesin ve 80 °C fırında, ara ara çevirerek 3-4 saat kurutun.",
    "Çay için suyu bir demlik ya da tencerede kaynatın.",
    "Kaynayan suya kurutulmuş kabukları veya dilimleri, tarçın çubuğunu, karanfilleri ve isterseniz zencefili ekleyin.",
    "Ocağı hemen kapatın ve kabın kapağını kapatın. Çayı 7 dakika demlenmeye bırakın.",
    "Çayı süzerek bardaklara paylaştırın. Tatlandırmak isterseniz bal, çay biraz ılındıktan sonra eklenmelidir.",
    "Servis ederken bardağın içine bir kuru portakal dilimi koyarak sunabilirsiniz."
  ],
  "puf": [
    "Suyu kaynattıktan sonra malzemelerle birlikte kaynatmaya devam etmeyin. Kaynayan su kabuklardaki acı maddeleri çıkarır. Ocağı kapatıp kapağı kapalı olarak demlemek, aromayı korurken acılığı önler.",
    "Kurutulacak kabuklarda yalnızca turuncu kısmı kullanın. Beyaz kısım hem kurumayı geciktirir hem de çaya acılık verir. Soyacak bu iş için bıçaktan daha kullanışlıdır.",
    "Balı kaynar suya eklemeyin. Yüksek sıcaklık balın aromasını bozar. Çay içilebilecek sıcaklığa geldiğinde eklenen bal, tadını en iyi şekilde gösterir.",
    "Kurutulmuş kabukları ağzı sıkıca kapanan cam bir kavanozda, ışıktan uzak tutun. Böylece aromalarını aylarca korurlar. Kavanoza birkaç tarçın çubuğu koymak, hazır bir çay karışımı elde etmenizi sağlar."
  ],
  "neden": "Kurutulmuş kabuğun aroması, kabuktaki uçucu yağlardan gelir. Finike Portakalı dalında olgunlaştığı için kabuğu aromatik yağ bakımından zengindir ve kurutulduktan sonra da kokusunu uzun süre korur. İnce kabuğu sayesinde daha hızlı ve eşit kurur, beyaz kısmı az olduğu için çaya acılık vermez. Kooperatifimizin üreticilerinden gelen portakalların kabuğunu bu şekilde değerlendirmek, meyvenin hiçbir kısmının boşa gitmemesini sağlar.",
  "servis": "Kış çayı akşam saatlerinde, yemekten sonra ya da yatmadan önce kafeinsiz bir içecek olarak içilebilir. Yanında kuru incir, ceviz veya şekerlenmiş portakal kabuğu çok iyi gider. Demlenmiş çay buzdolabında bir gün saklanabilir ve ısıtılarak içilebilir. Yaz aylarında soğutup buzla servis ederek ferahlatıcı bir soğuk çay hâline de getirebilirsiniz.",
  "sss": [
    ("Taze portakal kabuğu ile yapılabilir mi?", "Evet. Taze kabuğun yalnızca turuncu kısmını ince şeritler hâlinde soyup kullanabilirsiniz. Taze kabuk daha keskin bir aroma verir; kurutulmuş kabuk ise daha yumuşak ve tatlımsı bir tat bırakır."),
    ("Kurutulmuş portakal kabuğu ne kadar dayanır?", "İyice kurutulmuş kabuklar ağzı sıkı kapanan bir cam kavanozda, ışıktan uzak tutulduğunda 6 aya kadar aromasını korur."),
    ("Siyah çayla karıştırılabilir mi?", "Evet. Demlenmiş siyah çaya birkaç kurutulmuş kabuk ve bir tarçın çubuğu eklemek, klasik çaya portakal aroması katmanın kolay bir yoludur."),
    ("Kış çayı kafein içerir mi?", "Hayır. Siyah veya yeşil çay eklemediğiniz sürece portakal kabuğu, tarçın ve karanfilden oluşan bu içecek kafeinsizdir. Bu yüzden akşam saatlerinde ve yatmadan önce gönül rahatlığıyla içilebilir; çocuklar için de bal eklenmiş hafif bir sıcak içecek olarak hazırlanabilir."),
    ("Hangi baharatlar eklenebilir?", "Tarçın ve karanfile ek olarak birkaç tane yıldız anason, bir iki kakule tanesi ya da birkaç dilim taze zencefil eklenebilir. Baharatları az miktarla başlatıp tadına göre artırmak, portakal aromasının baskılanmamasını sağlar."),
  ],
  "ilgili": ["sekerlenmis-portakal-kabugu", "taze-sikma-portakal-suyu", "portakalli-ev-limonatasi"]
},
{
  "slug": "portakalli-zeytinyagli-enginar",
  "ad": "Portakallı Zeytinyağlı Enginar",
  "kat": "narenciye tuzlu", "etiket": ["Limon", "Portakal suyu"], "leaf": ["Limon"], "ph": "ph-dish", "gorsel": "kesit.jpg",
  "sure": "45 dk", "zorluk": "Orta", "porsiyon": "4 kişilik",
  "hazirlik": "PT15M", "pisirme": "PT30M", "toplam": "PT45M", "verim": "4 kişilik", "tur": "Zeytinyağlı",
  "ozet": "Enginar kararmasın diye limon, tatlı bir derinlik için portakal suyu. Finike limonuyla iki narenciye bir arada.",
  "aciklama": "Portakallı zeytinyağlı enginar tarifi: limonla kararması önlenen enginar çanakları, Finike Portakalı suyu ve havuçla pişirilen, soğuk servis edilen zeytinyağlı.",
  "giris": [
    "Zeytinyağlı enginar, Ege ve Akdeniz mutfağının bahar sofralarındaki en zarif yemeklerinden biridir. Klasik tarifte enginar limon ve zeytinyağıyla pişirilir. Bu tarifte ise pişirme suyunun bir kısmının yerini taze sıkılmış portakal suyu alır. Portakal, enginarın hafif buruk tadını yumuşatır ve yemeğe tatlımsı bir derinlik katar.",
    "Finike yalnızca portakalıyla değil, limonuyla da bilinir. Bu tarif, iki Finike narenciyesini aynı tencerede buluşturuyor: Limon enginarın kararmasını önlüyor, portakal ise lezzeti tamamlıyor. Soğuk servis edilen bu zeytinyağlı, bir gün önceden hazırlanabildiği için misafir sofraları için de çok pratiktir."
  ],
  "malzemeler": ["6 adet enginar çanağı (temizlenmiş)", "1 adet limon", "1 su bardağı taze sıkılmış Finike Portakalı suyu", "Yarım su bardağı zeytinyağı", "1 adet havuç", "1 adet kuru soğan", "1 tatlı kaşığı toz şeker", "1 tatlı kaşığı tuz", "Yarım su bardağı su", "Yarım demet dereotu"],
  "adimlar": [
    "Geniş bir kaba soğuk su doldurun, limonun suyunu sıkın ve sıktığınız limon yarımlarını da suya atın.",
    "Enginar çanaklarını kesilen yüzeylerine limon sürerek limonlu suya bırakın. Kesilen enginar havayla temas ettiğinde hızla kararır; limonlu su bunu önler.",
    "Soğanı ince yarım ay, havucu küçük küpler hâlinde doğrayın.",
    "Geniş, dibi kalın bir tencerede zeytinyağını ısıtın. Soğanı ekleyip pembeleşmeden, yalnızca yumuşayana kadar 3-4 dakika çevirin. Havucu ekleyip 2 dakika daha karıştırın.",
    "Enginarları limonlu sudan çıkarın ve çukur kısımları yukarı bakacak şekilde tencereye dizin. Soğan ve havuçlu karışımı çanakların içine paylaştırın.",
    "Portakal suyunu, yarım su bardağı suyu, şekeri ve tuzu karıştırıp enginarların üzerine dökün.",
    "Tencerenin üzerine enginarların boyutunda yağlı kâğıt kapatın, ardından kapağını kapatın. Kısık ateşte yaklaşık 30 dakika, enginarlar çatal batırınca kolayca yumuşayana kadar pişirin.",
    "Ocaktan alın ve tencerede oda sıcaklığına gelene kadar soğumaya bırakın. Servis tabağına alıp üzerine ince kıyılmış dereotu serpin."
  ],
  "puf": [
    "Enginarları tencerede soğutmak önemlidir. Sıcakken tabağa alınan zeytinyağlılar dağılır ve suyunu çeker. Tencerede soğuyan enginar, pişirme suyunu emerek daha lezzetli olur.",
    "Pişirme sırasında enginarların üzerine yağlı kâğıt kapatmak, buharın her tarafa eşit dağılmasını ve enginarların üst kısmının kurumamasını sağlar. Bu, zeytinyağlıları hem eşit pişiren hem de renklerini koruyan eski bir ev yöntemidir.",
    "Zeytinyağlılarda şeker, sebzenin doğal tadını dengelemek için kullanılır. Portakal suyu zaten tatlılık verdiği için şekeri azaltabilir ya da tamamen çıkarabilirsiniz.",
    "Taze enginar bulamazsanız dondurulmuş enginar çanakları da kullanabilirsiniz. Bu durumda pişirme süresini 20 dakikaya düşürün ve enginarları çözdürmeden doğrudan tencereye dizin."
  ],
  "neden": "Zeytinyağlılarda pişirme suyu, yemeğin bütün lezzetini taşır. Finike Portakalı’nın dengeli asit ve şeker oranı, enginarın buruk tadını bastırmadan yumuşatır ve limonun keskinliğini dengeler. Taze sıkılmış suyun doğal aroması, hazır meyve sularındaki koruyucu ve şeker tadını yemeğe katmaz. Kooperatif üreticilerimizden gelen portakal ve Finike limonu bir arada kullanıldığında, yemek bölgenin narenciye kültürünü sofraya taşır.",
  "servis": "Portakallı zeytinyağlı enginar soğuk ya da oda sıcaklığında, dereotuyla süslenerek servis edilir. Yanına taze ekmek ve bir dilim limon koyabilirsiniz. Ana yemek olarak sunmak için yanına bezelye veya bakla ekleyebilirsiniz. Ağzı kapalı bir kapta buzdolabında 3 gün saklanabilir; dinlendikçe lezzeti daha da oturur.",
  "sss": [
    ("Enginar neden kararır?", "Enginarın kesilen yüzeyi havayla temas ettiğinde oksitlenerek kararır. Kesilen yüzeye limon sürmek ve enginarı pişirene kadar limonlu suda bekletmek kararmayı önler."),
    ("Zeytinyağlı enginar sıcak yenir mi?", "Zeytinyağlı yemekler geleneksel olarak soğuk ya da oda sıcaklığında servis edilir. Sıcakken zeytinyağının tadı tam ortaya çıkmaz ve enginar kolay dağılır."),
    ("Portakal suyu yerine ne kullanılabilir?", "Portakal suyu yerine mandalina suyu da kullanılabilir. Portakal suyu olmadan klasik tarif için portakal suyunun yerine su ekleyip limon miktarını artırabilirsiniz."),
    ("Enginar çanağı nasıl temizlenir?", "Enginarın dış yapraklarını, açık renkli iç yapraklara ulaşana kadar elle koparın. Üst kısmı bıçakla kesin, sapı kısaltın ve çanağın kenarlarını yuvarlak olacak şekilde düzeltin. Ortadaki tüylü kısmı bir kaşıkla oyarak çıkarın ve çanağı hemen limonlu suya bırakın."),
  ],
  "ilgili": ["portakalli-narli-roka-salatasi", "portakalli-firin-tavuk-baget", "portakalli-ev-limonatasi"]
},
{
  "slug": "portakalli-ev-limonatasi",
  "ad": "Portakallı Ev Limonatası",
  "kat": "narenciye icecek", "etiket": ["Limon", "Portakal"], "leaf": ["Limon"], "ph": "ph-juice", "gorsel": "meyvesuyu.jpg",
  "sure": "20 dk + 1 gece", "zorluk": "Kolay", "porsiyon": "2 litre",
  "hazirlik": "PT20M", "pisirme": "PT0M", "toplam": "PT12H20M", "verim": "2 litre", "tur": "İçecek",
  "ozet": "Kabukların yağını şekerle çıkaran geleneksel yöntem. Portakal limonun keskinliğini yumuşatır.",
  "aciklama": "Portakallı ev limonatası tarifi: limon ve Finike Portakalı kabuklarının şekerle ovalanarak aromasının çıkarıldığı geleneksel yöntemle 2 litre ev yapımı limonata.",
  "giris": [
    "Ev yapımı limonata, yaz sofralarının ve bayram ziyaretlerinin klasik içeceğidir. Hazır toz limonatalardan çok farklı bir tada sahip olan gerçek ev limonatasının sırrı, meyvenin suyundan çok kabuğundadır. Geleneksel yöntemde limon kabukları şekerle ovalanır; şeker kabuktaki aromatik yağları çeker ve limonataya o kendine özgü, mis gibi kokuyu verir.",
    "Bu tarifte limona Finike Portakalı eşlik ediyor. Portakal, limonun keskin ekşiliğini yumuşatır, rengine hafif bir altın tonu ekler ve içimi daha dengeli bir limonata ortaya çıkarır. Bir gece buzdolabında dinlenen limonata, ertesi gün en lezzetli hâline ulaşır."
  ],
  "malzemeler": ["4 adet limon", "2 adet Finike Portakalı", "1,5 su bardağı toz şeker", "2 litre soğuk içme suyu", "Birkaç dal taze nane", "Servis için buz"],
  "adimlar": [
    "Limonları ve portakalları ılık suda fırçayla iyice yıkayın; kabukları da kullanılacağı için bu adım önemlidir.",
    "Meyvelerin kabuklarını soyacakla, beyaz kısma inmeden ince şeritler hâlinde soyun.",
    "Soyduğunuz kabukları geniş bir kaba alın, üzerine şekeri ekleyin. Kabukları şekerle birlikte elinizle ovalayın ve ezin. Şeker nemlenip sararmaya başlayacaktır.",
    "Kabını kapatıp şekerli kabukları 30 dakika bekletin. Bu sürede şeker kabuklardaki aromatik yağları çeker.",
    "Soyulmuş limon ve portakalları ikiye kesip suyunu sıkın. Sıktığınız suyu şekerli kabukların üzerine ekleyin.",
    "Şeker tamamen eriyene kadar karıştırın. Şeker erimekte zorlanıyorsa bir su bardağı ılık su ekleyebilirsiniz.",
    "Kalan soğuk suyu ekleyin, birkaç dal naneyi de içine atın ve karıştırın. Kabın ağzını kapatıp bir gece buzdolabında dinlendirin.",
    "Ertesi gün limonatayı süzerek sürahiye alın. Buz ve taze nane yapraklarıyla servis edin."
  ],
  "puf": [
    "Kabukları şekerle ovalamak bu tarifin kalbidir. Bu adımı atlarsanız elinizde yalnızca şekerli limon suyu kalır. Ovaladıkça şekerin rengi sararır ve mutfak limon kokusuyla dolar; bu, aromanın şekere geçtiğinin işaretidir.",
    "Kabuğun beyaz kısmını kesinlikle kullanmayın. Beyaz kısım bir gece bekledikten sonra limonataya belirgin bir acılık verir. Soyacakla ince soymak, bıçakla soymaktan daha güvenlidir.",
    "Şekeri damak zevkinize göre ayarlayın. Finike Portakalı limonatanın ekşiliğini yumuşattığı için klasik limonata tariflerine göre daha az şekerle yetinebilirsiniz. Tadına bakarak şekeri azaltıp çoğaltın.",
    "Limonatayı dinlendirdikten sonra mutlaka süzün. Kabuklar sıvıda uzun süre kalırsa ikinci günden sonra acılaşma başlar. Süzülmüş limonata buzdolabında 3 gün tazeliğini korur."
  ],
  "neden": "Limonatada portakalın görevi, limonun keskin ekşiliğini dengeleyip içimi yumuşatmaktır. Finike Portakalı’nın dengeli asidi ve doğal şekeri bu görevi en iyi şekilde yerine getirir ve limonatada daha az şeker kullanmanıza izin verir. İnce, aromatik kabuğu şekerle ovalandığında limon kabuğunun aromasına tatlı bir portakal kokusu ekler. Kooperatif üreticilerimizin bahçesinden gelen taze meyve, limonatanın aromasını doğrudan zenginleştirir.",
  "servis": "Portakallı ev limonatası buzla ve taze nane yapraklarıyla, soğuk olarak servis edilir. Bardağın kenarına bir portakal ya da limon dilimi takarak sunabilirsiniz. Maden suyuyla yarı yarıya karıştırarak gazlı bir limonata elde edebilirsiniz. Süzülmüş limonata ağzı kapalı bir cam şişede buzdolabında 3 gün saklanabilir.",
  "sss": [
    ("Limonata neden acı olur?", "Kabuğun beyaz kısmı kullanıldığında veya kabuklar limonatada çok uzun süre bekletildiğinde acılık oluşur. Kabukları ince soymak ve dinlendirdikten sonra süzmek acılığı önler."),
    ("Limonata hemen içilebilir mi?", "Evet, ama bir gece dinlendirilmiş limonatanın aroması çok daha yoğun ve dengeli olur. Acele ediyorsanız en az 2 saat buzdolabında bekletin."),
    ("Şeker yerine bal kullanılabilir mi?", "Kullanılabilir. Ancak kabukların aromasını çekme işini en iyi kristal şeker yapar. Bal kullanacaksanız kabukları az miktarda şekerle ovalayıp, balı sonradan ılık suda eriterek ekleyin."),
    ("Limonata dondurulabilir mi?", "Evet. Süzülmüş limonatayı buz kalıplarında dondurup sonradan bardaklara buz yerine koyabilirsiniz. Böylece buz eridikçe limonata sulanmaz, aksine tadı korunur. Dondurulmuş limonata küpleri dondurucuda 2-3 ay saklanabilir."),
    ("Bir litre limonata için ne kadar meyve gerekir?", "Bu tarifin yarısı, yani 2 limon, 1 portakal ve 3/4 su bardağı şekerle 1 litre limonata elde edilir. Meyveler küçükse bir limon daha eklemek ekşilik dengesini korur."),
  ],
  "ilgili": ["taze-sikma-portakal-suyu", "portakal-kabuklu-tarcinli-kis-cayi", "portakalli-zeytinyagli-enginar"]
},
]
