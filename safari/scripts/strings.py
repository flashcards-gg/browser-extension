#!/usr/bin/env python3
"""Writes safari/App/Localizable.xcstrings: the container app's texts in the
extension's 30 languages. Three strings (the menu item, the description, the
key link) come from ../_locales so the app names things exactly as the
extension does; the rest are below, translated by hand. Run after editing:
python3 safari/scripts/strings.py"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APPLE = {'pt_BR': 'pt-BR', 'pt_PT': 'pt-PT', 'zh_CN': 'zh-Hans'}

FROM_LOCALES = {
    'Add to Flashcards.gg': 'menuAdd',
    'Add a card from selected text to your Flashcards.gg sets.': 'extDescription',
    'Create a key': 'optionsCreateKey',
}

ON, OFF, OPEN = 'The extension is on in Safari.', 'The extension is off in Safari.', 'Open Safari Settings'
S1 = 'Turn on Flashcards.gg in Safari Settings › Extensions.'
S2 = 'Click the Flashcards.gg button in the Safari toolbar and paste your API key from flashcards.gg (Account › API keys).'
S3 = 'Select text on a page, Control-click it and choose “%@”.'
MENU = ['About %@', 'Hide %@', 'Hide Others', 'Show All', 'Quit %@', 'Window', 'Minimize', 'Close']

T = {
 'ar': [ 'الإضافة مفعّلة في Safari.', 'الإضافة غير مفعّلة في Safari.', 'فتح إعدادات Safari',
   'فعّل Flashcards.gg في إعدادات Safari › الإضافات.',
   'انقر زر Flashcards.gg في شريط أدوات Safari والصق مفتاح API من flashcards.gg (الحساب › مفاتيح API).',
   'حدّد نصًا في صفحة، ثم انقر عليه مع الضغط على Control واختر «%@».',
   ['حول %@', 'إخفاء %@', 'إخفاء الآخرين', 'إظهار الكل', 'إنهاء %@', 'نافذة', 'تصغير', 'إغلاق'] ],
 'cs': [ 'Rozšíření je v Safari zapnuté.', 'Rozšíření je v Safari vypnuté.', 'Otevřít nastavení Safari',
   'Zapněte Flashcards.gg v Safari: Nastavení › Rozšíření.',
   'Klikněte na tlačítko Flashcards.gg na panelu nástrojů Safari a vložte svůj API klíč z flashcards.gg (Účet › API klíče).',
   'Označte text na stránce, klikněte na něj se stisknutou klávesou Control a vyberte „%@“.',
   ['O aplikaci %@', 'Skrýt %@', 'Skrýt ostatní', 'Zobrazit vše', 'Ukončit %@', 'Okno', 'Minimalizovat', 'Zavřít'] ],
 'da': [ 'Udvidelsen er slået til i Safari.', 'Udvidelsen er slået fra i Safari.', 'Åbn Safari-indstillinger',
   'Slå Flashcards.gg til i Safari-indstillinger › Udvidelser.',
   'Klik på Flashcards.gg-knappen på Safaris værktøjslinje, og indsæt din API-nøgle fra flashcards.gg (Konto › API-nøgler).',
   'Marker tekst på en side, ctrl-klik på den, og vælg »%@«.',
   ['Om %@', 'Skjul %@', 'Skjul andre', 'Vis alle', 'Slut %@', 'Vindue', 'Anbring i Dock', 'Luk'] ],
 'de': [ 'Die Erweiterung ist in Safari aktiviert.', 'Die Erweiterung ist in Safari deaktiviert.', 'Safari-Einstellungen öffnen',
   'Aktiviere Flashcards.gg in den Safari-Einstellungen › Erweiterungen.',
   'Klicke in der Safari-Symbolleiste auf die Taste „Flashcards.gg“ und füge deinen API-Schlüssel von flashcards.gg (Konto › API-Schlüssel) ein.',
   'Markiere Text auf einer Seite, klicke ihn mit gedrückter ctrl-Taste an und wähle „%@“.',
   ['Über %@', '%@ ausblenden', 'Andere ausblenden', 'Alle einblenden', '%@ beenden', 'Fenster', 'Im Dock ablegen', 'Schließen'] ],
 'el': [ 'Η επέκταση είναι ενεργή στο Safari.', 'Η επέκταση είναι ανενεργή στο Safari.', 'Άνοιγμα ρυθμίσεων Safari',
   'Ενεργοποιήστε το Flashcards.gg στις Ρυθμίσεις του Safari › Επεκτάσεις.',
   'Κάντε κλικ στο κουμπί Flashcards.gg στη γραμμή εργαλείων του Safari και επικολλήστε το κλειδί API από το flashcards.gg (Λογαριασμός › Κλειδιά API).',
   'Επιλέξτε κείμενο σε μια σελίδα, κάντε Control-κλικ πάνω του και επιλέξτε «%@».',
   ['Σχετικά με το %@', 'Απόκρυψη %@', 'Απόκρυψη άλλων', 'Εμφάνιση όλων', 'Έξοδος από %@', 'Παράθυρο', 'Ελαχιστοποίηση', 'Κλείσιμο'] ],
 'es': [ 'La extensión está activada en Safari.', 'La extensión está desactivada en Safari.', 'Abrir los ajustes de Safari',
   'Activa Flashcards.gg en Ajustes de Safari › Extensiones.',
   'Haz clic en el botón de Flashcards.gg de la barra de herramientas de Safari y pega tu clave de API de flashcards.gg (Cuenta › Claves de API).',
   'Selecciona texto en una página, haz clic en él con la tecla Control pulsada y elige «%@».',
   ['Acerca de %@', 'Ocultar %@', 'Ocultar otros', 'Mostrar todo', 'Salir de %@', 'Ventana', 'Minimizar', 'Cerrar'] ],
 'fi': [ 'Laajennus on päällä Safarissa.', 'Laajennus on pois päältä Safarissa.', 'Avaa Safarin asetukset',
   'Laita Flashcards.gg päälle kohdassa Safarin asetukset › Laajennukset.',
   'Klikkaa Flashcards.gg-painiketta Safarin työkalupalkissa ja liitä API-avaimesi flashcards.gg:stä (Tili › API-avaimet).',
   'Valitse tekstiä sivulta, ctrl-osoita sitä ja valitse ”%@”.',
   ['Tietoja: %@', 'Kätke %@', 'Kätke muut', 'Näytä kaikki', 'Lopeta %@', 'Ikkuna', 'Pienennä', 'Sulje'] ],
 'fr': [ 'L’extension est activée dans Safari.', 'L’extension est désactivée dans Safari.', 'Ouvrir les réglages de Safari',
   'Activez Flashcards.gg dans Réglages de Safari › Extensions.',
   'Cliquez sur le bouton Flashcards.gg dans la barre d’outils de Safari et collez votre clé API de flashcards.gg (Compte › Clés API).',
   'Sélectionnez du texte sur une page, cliquez dessus en maintenant la touche Contrôle enfoncée et choisissez « %@ ».',
   ['À propos de %@', 'Masquer %@', 'Masquer les autres', 'Tout afficher', 'Quitter %@', 'Fenêtre', 'Placer dans le Dock', 'Fermer'] ],
 'he': [ 'התוסף מופעל ב-Safari.', 'התוסף כבוי ב-Safari.', 'פתיחת ההגדרות של Safari',
   'הפעילו את Flashcards.gg בהגדרות Safari › הרחבות.',
   'לחצו על הכפתור Flashcards.gg בסרגל הכלים של Safari והדביקו את מפתח ה-API מ-flashcards.gg (חשבון › מפתחות API).',
   'סמנו טקסט בדף, לחצו עליו עם Control ובחרו ב“%@”.',
   ['אודות %@', 'הסתר את %@', 'הסתר אחרים', 'הצג הכל', 'צא מ-%@', 'חלון', 'מזער', 'סגור'] ],
 'hi': [ 'एक्सटेंशन Safari में चालू है।', 'एक्सटेंशन Safari में बंद है।', 'Safari सेटिंग्ज़ खोलें',
   'Safari सेटिंग्ज़ › एक्सटेंशन में Flashcards.gg चालू करें।',
   'Safari टूलबार में Flashcards.gg बटन पर क्लिक करें और flashcards.gg (खाता › API कुंजियाँ) से अपनी API कुंजी चिपकाएँ।',
   'पेज पर टेक्स्ट चुनें, Control दबाकर उस पर क्लिक करें और “%@” चुनें।',
   ['%@ के बारे में', '%@ छिपाएँ', 'अन्य छिपाएँ', 'सभी दिखाएँ', '%@ से बाहर निकलें', 'विंडो', 'छोटा करें', 'बंद करें'] ],
 'hr': [ 'Proširenje je uključeno u Safariju.', 'Proširenje je isključeno u Safariju.', 'Otvori postavke Safarija',
   'Uključite Flashcards.gg u postavkama Safarija › Proširenja.',
   'Kliknite tipku Flashcards.gg na alatnoj traci Safarija i zalijepite svoj API ključ s flashcards.gg (Račun › API ključevi).',
   'Označite tekst na stranici, kliknite ga uz pritisnutu tipku Control i odaberite „%@”.',
   ['O aplikaciji %@', 'Sakrij %@', 'Sakrij ostale', 'Prikaži sve', 'Zatvori %@', 'Prozor', 'Minimiziraj', 'Zatvori'] ],
 'hu': [ 'A bővítmény be van kapcsolva a Safariban.', 'A bővítmény ki van kapcsolva a Safariban.', 'A Safari beállításainak megnyitása',
   'Kapcsold be a Flashcards.gg-t a Safari beállításai › Bővítmények részen.',
   'Kattints a Flashcards.gg gombra a Safari eszközsorában, és illeszd be az API-kulcsodat a flashcards.gg-ről (Fiók › API-kulcsok).',
   'Jelölj ki szöveget egy oldalon, kattints rá a Control billentyűt lenyomva tartva, és válaszd a(z) „%@” lehetőséget.',
   ['A(z) %@ névjegye', '%@ elrejtése', 'Többi elrejtése', 'Összes megjelenítése', 'Kilépés: %@', 'Ablak', 'Kis méret', 'Bezárás'] ],
 'id': [ 'Ekstensi aktif di Safari.', 'Ekstensi nonaktif di Safari.', 'Buka Pengaturan Safari',
   'Aktifkan Flashcards.gg di Pengaturan Safari › Ekstensi.',
   'Klik tombol Flashcards.gg di bar alat Safari, lalu tempel kunci API Anda dari flashcards.gg (Akun › Kunci API).',
   'Pilih teks di halaman, klik teks itu sambil menekan Control, lalu pilih “%@”.',
   ['Tentang %@', 'Sembunyikan %@', 'Sembunyikan Lainnya', 'Tampilkan Semua', 'Keluar dari %@', 'Jendela', 'Minimalkan', 'Tutup'] ],
 'it': [ 'L’estensione è attiva in Safari.', 'L’estensione è disattivata in Safari.', 'Apri le impostazioni di Safari',
   'Attiva Flashcards.gg in Impostazioni di Safari › Estensioni.',
   'Fai clic sul pulsante Flashcards.gg nella barra degli strumenti di Safari e incolla la tua chiave API di flashcards.gg (Account › Chiavi API).',
   'Seleziona del testo in una pagina, fai clic sul testo tenendo premuto Ctrl e scegli “%@”.',
   ['Informazioni su %@', 'Nascondi %@', 'Nascondi altre', 'Mostra tutte', 'Esci da %@', 'Finestra', 'Contrai', 'Chiudi'] ],
 'ja': [ '拡張機能はSafariでオンになっています。', '拡張機能はSafariでオフになっています。', 'Safariの設定を開く',
   'Safariの設定 › 機能拡張でFlashcards.ggをオンにしてください。',
   'SafariのツールバーにあるFlashcards.ggボタンをクリックし、flashcards.gg（アカウント › APIキー）のAPIキーを貼り付けてください。',
   'ページ上のテキストを選択し、Controlキーを押しながらクリックして「%@」を選んでください。',
   ['%@について', '%@を非表示', 'ほかを非表示', 'すべてを表示', '%@を終了', 'ウインドウ', 'しまう', '閉じる'] ],
 'ko': [ 'Safari에서 확장 프로그램이 켜져 있습니다.', 'Safari에서 확장 프로그램이 꺼져 있습니다.', 'Safari 설정 열기',
   'Safari 설정 › 확장 프로그램에서 Flashcards.gg를 켜세요.',
   'Safari 도구 막대의 Flashcards.gg 버튼을 클릭하고 flashcards.gg(계정 › API 키)의 API 키를 붙여넣으세요.',
   '페이지에서 텍스트를 선택하고 Control 키를 누른 채 클릭한 다음 ‘%@’을(를) 선택하세요.',
   ['%@에 관하여', '%@ 가리기', '기타 가리기', '모두 보기', '%@ 종료', '윈도우', '최소화', '닫기'] ],
 'nl': [ 'De extensie staat aan in Safari.', 'De extensie staat uit in Safari.', 'Open Safari-instellingen',
   'Zet Flashcards.gg aan in Safari-instellingen › Extensies.',
   'Klik op de Flashcards.gg-knop in de Safari-knoppenbalk en plak je API-sleutel van flashcards.gg (Account › API-sleutels).',
   'Selecteer tekst op een pagina, klik er met de Control-toets ingedrukt op en kies ‘%@’.',
   ['Over %@', 'Verberg %@', 'Verberg andere', 'Toon alles', 'Stop %@', 'Venster', 'Minimaliseer', 'Sluit'] ],
 'no': [ 'Utvidelsen er slått på i Safari.', 'Utvidelsen er slått av i Safari.', 'Åpne Safari-innstillinger',
   'Slå på Flashcards.gg i Safari-innstillinger › Utvidelser.',
   'Klikk på Flashcards.gg-knappen i verktøylinjen i Safari, og lim inn API-nøkkelen din fra flashcards.gg (Konto › API-nøkler).',
   'Merk tekst på en side, kontrollklikk på den og velg «%@».',
   ['Om %@', 'Skjul %@', 'Skjul andre', 'Vis alle', 'Avslutt %@', 'Vindu', 'Minimer', 'Lukk'] ],
 'pl': [ 'Rozszerzenie jest włączone w Safari.', 'Rozszerzenie jest wyłączone w Safari.', 'Otwórz ustawienia Safari',
   'Włącz Flashcards.gg w Ustawieniach Safari › Rozszerzenia.',
   'Kliknij przycisk Flashcards.gg na pasku narzędzi Safari i wklej swój klucz API z flashcards.gg (Konto › Klucze API).',
   'Zaznacz tekst na stronie, kliknij go z klawiszem Control i wybierz „%@”.',
   ['%@ – informacje', 'Ukryj %@', 'Ukryj pozostałe', 'Pokaż wszystkie', 'Zakończ %@', 'Okno', 'Minimalizuj', 'Zamknij'] ],
 'pt_BR': [ 'A extensão está ativada no Safari.', 'A extensão está desativada no Safari.', 'Abrir os Ajustes do Safari',
   'Ative o Flashcards.gg em Ajustes do Safari › Extensões.',
   'Clique no botão Flashcards.gg na barra de ferramentas do Safari e cole sua chave de API do flashcards.gg (Conta › Chaves de API).',
   'Selecione um texto na página, clique nele com a tecla Control pressionada e escolha “%@”.',
   ['Sobre o %@', 'Ocultar %@', 'Ocultar Outros', 'Mostrar Tudo', 'Encerrar %@', 'Janela', 'Minimizar', 'Fechar'] ],
 'pt_PT': [ 'A extensão está ativada no Safari.', 'A extensão está desativada no Safari.', 'Abrir as Definições do Safari',
   'Ative o Flashcards.gg em Definições do Safari › Extensões.',
   'Clique no botão Flashcards.gg na barra de ferramentas do Safari e cole a sua chave de API do flashcards.gg (Conta › Chaves de API).',
   'Selecione texto numa página, clique nele com a tecla Control premida e escolha “%@”.',
   ['Acerca de %@', 'Ocultar %@', 'Ocultar outros', 'Mostrar tudo', 'Sair de %@', 'Janela', 'Minimizar', 'Fechar'] ],
 'ro': [ 'Extensia este activată în Safari.', 'Extensia este dezactivată în Safari.', 'Deschide configurările Safari',
   'Activează Flashcards.gg în Configurări Safari › Extensii.',
   'Fă clic pe butonul Flashcards.gg din bara de instrumente Safari și lipește cheia API de pe flashcards.gg (Cont › Chei API).',
   'Selectează text pe o pagină, fă Control-clic pe el și alege „%@”.',
   ['Despre %@', 'Ascunde %@', 'Ascunde celelalte', 'Afișează tot', 'Ieși din %@', 'Fereastră', 'Minimizează', 'Închide'] ],
 'ru': [ 'Расширение включено в Safari.', 'Расширение выключено в Safari.', 'Открыть настройки Safari',
   'Включите Flashcards.gg в настройках Safari › Расширения.',
   'Нажмите кнопку Flashcards.gg на панели инструментов Safari и вставьте API-ключ с flashcards.gg (Аккаунт › API-ключи).',
   'Выделите текст на странице, нажмите на него с клавишей Control и выберите «%@».',
   ['О программе %@', 'Скрыть %@', 'Скрыть остальные', 'Показать все', 'Завершить %@', 'Окно', 'Свернуть', 'Закрыть'] ],
 'sv': [ 'Tillägget är påslaget i Safari.', 'Tillägget är avslaget i Safari.', 'Öppna Safari-inställningar',
   'Slå på Flashcards.gg i Safari-inställningar › Tillägg.',
   'Klicka på Flashcards.gg-knappen i Safaris verktygsfält och klistra in din API-nyckel från flashcards.gg (Konto › API-nycklar).',
   'Markera text på en sida, kontrollklicka på den och välj ”%@”.',
   ['Om %@', 'Göm %@', 'Göm övriga', 'Visa alla', 'Avsluta %@', 'Fönster', 'Minimera', 'Stäng'] ],
 'th': [ 'ส่วนขยายเปิดอยู่ใน Safari', 'ส่วนขยายปิดอยู่ใน Safari', 'เปิดการตั้งค่า Safari',
   'เปิด Flashcards.gg ในการตั้งค่า Safari › ส่วนขยาย',
   'คลิกปุ่ม Flashcards.gg ในแถบเครื่องมือของ Safari แล้ววางคีย์ API จาก flashcards.gg (บัญชี › คีย์ API)',
   'เลือกข้อความบนหน้าเว็บ กด Control ค้างไว้แล้วคลิกที่ข้อความ จากนั้นเลือก “%@”',
   ['เกี่ยวกับ %@', 'ซ่อน %@', 'ซ่อนแอปอื่น', 'แสดงทั้งหมด', 'ออกจาก %@', 'หน้าต่าง', 'ย่อ', 'ปิด'] ],
 'tr': [ 'Uzantı Safari’de açık.', 'Uzantı Safari’de kapalı.', 'Safari Ayarları’nı aç',
   'Flashcards.gg’yi Safari Ayarları › Uzantılar bölümünde açın.',
   'Safari araç çubuğundaki Flashcards.gg düğmesine tıklayın ve flashcards.gg’deki (Hesap › API anahtarları) API anahtarınızı yapıştırın.',
   'Sayfada bir metin seçin, Control tuşuna basılı tutarak tıklayın ve “%@” seçeneğini seçin.',
   ['%@ Hakkında', '%@ Uygulamasını Gizle', 'Diğerlerini Gizle', 'Tümünü Göster', '%@ Uygulamasından Çık', 'Pencere', 'Küçült', 'Kapat'] ],
 'uk': [ 'Розширення увімкнене в Safari.', 'Розширення вимкнене в Safari.', 'Відкрити параметри Safari',
   'Увімкніть Flashcards.gg у параметрах Safari › Розширення.',
   'Натисніть кнопку Flashcards.gg на панелі інструментів Safari і вставте API-ключ із flashcards.gg (Акаунт › API-ключі).',
   'Виділіть текст на сторінці, натисніть на нього з клавішею Control і виберіть «%@».',
   ['Про %@', 'Сховати %@', 'Сховати інші', 'Показати всі', 'Завершити %@', 'Вікно', 'Згорнути', 'Закрити'] ],
 'vi': [ 'Tiện ích mở rộng đang bật trong Safari.', 'Tiện ích mở rộng đang tắt trong Safari.', 'Mở Cài đặt Safari',
   'Bật Flashcards.gg trong Cài đặt Safari › Tiện ích mở rộng.',
   'Bấm nút Flashcards.gg trên thanh công cụ Safari và dán khóa API từ flashcards.gg (Tài khoản › Khóa API).',
   'Chọn văn bản trên trang, Control-bấm vào đó và chọn “%@”.',
   ['Giới thiệu về %@', 'Ẩn %@', 'Ẩn các mục khác', 'Hiển thị tất cả', 'Thoát %@', 'Cửa sổ', 'Thu nhỏ', 'Đóng'] ],
 'zh_CN': [ '扩展已在 Safari 中开启。', '扩展已在 Safari 中关闭。', '打开 Safari 设置',
   '在 Safari 设置 › 扩展中开启 Flashcards.gg。',
   '点按 Safari 工具栏中的 Flashcards.gg 按钮，粘贴来自 flashcards.gg（账户 › API 密钥）的 API 密钥。',
   '在网页上选中文字，按住 Control 键点按，然后选择“%@”。',
   ['关于%@', '隐藏%@', '隐藏其他', '全部显示', '退出%@', '窗口', '最小化', '关闭'] ],
}

def unit(v):
    return {'stringUnit': {'state': 'translated', 'value': v}}

strings = {}
def put(key, lang, value):
    strings.setdefault(key, {'localizations': {}})['localizations'][APPLE.get(lang, lang)] = unit(value)

for lang in sorted(os.listdir(os.path.join(ROOT, '_locales'))):
    if lang == 'en':
        continue
    msgs = json.load(open(os.path.join(ROOT, '_locales', lang, 'messages.json'), encoding='utf-8'))
    for key, name in FROM_LOCALES.items():
        put(key, lang, msgs[name]['message'])
    on, off, op, s1, s2, s3, menu = T[lang]
    for key, value in zip([ON, OFF, OPEN, S1, S2, S3] + MENU, [on, off, op, s1, s2, s3] + menu):
        put(key, lang, value)

# English too, so the bundle gets an en.lproj: the App Store lists the
# languages it finds as .lproj folders.
for key in strings:
    put(key, 'en', key)

for key in strings:
    if '%@' in key:
        assert all(l['stringUnit']['value'].count('%@') == 1 for l in strings[key]['localizations'].values()), key
    assert len(strings[key]['localizations']) == 30, (key, len(strings[key]['localizations']))

out = {'sourceLanguage': 'en', 'strings': dict(sorted(strings.items())), 'version': '1.0'}
path = os.path.join(ROOT, 'safari', 'App', 'Localizable.xcstrings')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'{path}: {len(strings)} strings × 30 languages')
