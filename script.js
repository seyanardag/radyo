$(document).ready(function () {
    const audio = new Audio();
    let isPlaying = false;
    let currentStationIndex = 0;
    let totalBytesLoaded = 0;
    let startTime = 0;

    // Albüm kapağına tıklama
    $('.album-art').click(function () {
        $('#dataUsage').parent().toggleClass('show');
    });

    // Radyo istasyonları listesi
    const stations = [
        {
            title: "Süper FM",
            artist: "Canlı Yayın",
            url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM128AAC.aac?",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/super-fm-dinle.jpg"
        },
        {
            title: "Fenomen",
            artist: "Canlı Yayın",
            url: "https://live.radyofenomen.com/fenomen/128/icecast.audio",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/radyo-fenomen.jpg"
        },
        {
            title: "Power Türk",
            artist: "Canlı Yayın",
            url: "https://live.powerapp.com.tr/powerturk/mpeg/icecast.audio?/;stream.mp3",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/power-turk-dinle.png"
        },
        {
            title: "Slow Türk",
            artist: "Canlı Yayın",
            url: "https://radyo.duhnet.tv/ak_dtvh_slowturk?",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/slow-turk-dinle.jpg"
        },
        {
            title: "Alem FM",
            artist: "Canlı Yayın",
            url: "https://turkmedya.radyotvonline.net/alemfmaac?",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/alem-fm.jpg"
        },
        {
            title: "Joy Türk",
            artist: "Canlı Yayın",
            url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK128AAC.aac?",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/joy-turk-dinle.jpg"
        },
        {
            title: "Best FM",
            artist: "Canlı Yayın",
            url: "https://officialbestfm.radyotvonline.net/bestfmofficial?/;stream.mp3",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/best-fm-dinle-100x100.png"
        },
        {
            title: "Number One FM",
            artist: "Canlı Yayın",
            url: "https://www.canliradyodinle.fm/28a6837b-461f-45f7-a7c2-9865f6c93122",
            cover: "https://www.canliradyodinle.fm/wp-content/uploads/number-one-turk-fm.jpg"
        },
        {
            title: "Ava Max - So am I",
            artist: "Ava Max",
            url: "./mp3/Ava Max - So Am I [Official Music Video].mp3",
            cover: "https://i.ytimg.com/vi_webp/SxGLPVvNjvY/maxresdefault.webp?v=5c8132a0"
        }

    ];

    // Çalma listesini oluştur
    function createPlaylist() {
        const $playlist = $('#playlist');
        $playlist.empty();

        stations.forEach((station, index) => {
            const $li = $('<li>')
                .data('index', index);

            // Sıra numarası
            const $number = $('<span>')
                .addClass('station-number')
                .text((index + 1).toString().padStart(2, '0'));

            // Radyo resmi
            const $img = $('<img>')
                .addClass('station-image')
                .attr('src', station.cover)
                .attr('alt', station.title);

            // Radyo adı
            const $title = $('<span>')
                .addClass('station-title')
                .text(station.title);

            $li.append($number, $img, $title);

            if (index === currentStationIndex) {
                $li.addClass('active');
            }

            $playlist.append($li);
        });
    }

    // Radyo bilgilerini güncelle
    function updateStationInfo() {
        const station = stations[currentStationIndex];
        $('#songTitle').text(station.title);
        $('#artistName').text(station.artist);
        $('#albumArt').attr('src', station.cover);

        // Çalma listesindeki aktif radyoyu güncelle
        $('#playlist li').removeClass('active');
        $(`#playlist li:eq(${currentStationIndex})`).addClass('active');
    }

    // Radyoyu çal
    function playStation() {
        const station = stations[currentStationIndex];
        audio.src = station.url;
        audio.play();
        isPlaying = true;
        $('#playBtn i').removeClass('fa-play').addClass('fa-pause');

        // Veri sayacını sıfırla
        totalBytesLoaded = 0;
        startTime = Date.now();
        updateDataUsage();
    }

    // Radyoyu durdur
    function pauseStation() {
        audio.pause();
        isPlaying = false;
        $('#playBtn i').removeClass('fa-pause').addClass('fa-play');
    }

    // Veri kullanımını güncelle
    function updateDataUsage() {
        if (!isPlaying) return;

        // Yaklaşık bit hızı (128kbps için)
        const bitrate = 128 * 1024; // 128kbps to bits per second
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const bytesLoaded = (bitrate * elapsedSeconds) / 8; // bits to bytes

        // Veri kullanımını formatla
        let dataUsage;
        if (bytesLoaded < 1024) {
            dataUsage = bytesLoaded.toFixed(2) + ' B';
        } else if (bytesLoaded < 1024 * 1024) {
            dataUsage = (bytesLoaded / 1024).toFixed(2) + ' KB';
        } else {
            dataUsage = (bytesLoaded / (1024 * 1024)).toFixed(2) + ' MB';
        }

        // Veri kullanımını göster
        $('#dataUsage').text('İndirilen: ' + dataUsage);

        // Her saniye güncelle
        setTimeout(updateDataUsage, 1000);
    }

    // İlerleme çubuğunu güncelle
    audio.addEventListener('timeupdate', function () {
        const progress = (audio.currentTime / audio.duration) * 100;
        $('.progress').css('width', progress + '%');

        // Zaman bilgisini güncelle
        $('#currentTime').text(formatTime(audio.currentTime));

        // Radyo yayını için sonsuz işareti göster
        if (audio.duration === Infinity) {
            $('#totalTime').text('∞');
        } else {
            $('#totalTime').text(formatTime(audio.duration));
        }
    });

    // Zamanı formatla
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Kontrol butonları
    $('#playBtn').click(function () {
        if (isPlaying) {
            pauseStation();
        } else {
            playStation();
        }
    });

    $('#nextBtn').click(function () {
        currentStationIndex = (currentStationIndex + 1) % stations.length;
        updateStationInfo();
        playStation();
    });

    $('#prevBtn').click(function () {
        currentStationIndex = (currentStationIndex - 1 + stations.length) % stations.length;
        updateStationInfo();
        playStation();
    });

    // Ses kontrolü
    $('#volumeSlider').on('input', function () {
        const volume = $(this).val() / 100;
        audio.volume = volume;
    });

    // İlerleme çubuğu tıklama
    $('.progress-bar').click(function (e) {
        const percent = e.offsetX / $(this).width();
        audio.currentTime = percent * audio.duration;
    });

    // Çalma listesi tıklama
    $('#playlist').on('click', 'li', function () {
        currentStationIndex = $(this).data('index');
        updateStationInfo();
        playStation();
    });

    // Sayfa yüklendiğinde çalma listesini oluştur ve ilk radyoyu hazırla
    createPlaylist();
    updateStationInfo();

    // PWA Yükleme İşlemleri
    let deferredPrompt;
    const installButton = document.createElement('button');
    installButton.style.display = 'none';
    document.body.appendChild(installButton);

    console.log('PWA yükleme scripti başlatıldı');

    // PWA yükleme durumunu kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Uygulama zaten PWA olarak çalışıyor');
    } else {
        console.log('Uygulama henüz PWA olarak yüklenmemiş');
        // Kullanıcıya bilgi ver
        showInfoMessage();
    }

    // Bilgi mesajını göster
    function showInfoMessage() {
        const infoPopup = document.createElement('div');
        infoPopup.className = 'install-popup';
        infoPopup.innerHTML = `
            <div class="install-popup-content">
                <h3>Radyo Uygulaması</h3>
                <p>Uygulamayı yüklemek için sayfada biraz zaman geçirmeniz gerekiyor. Birkaç dakika sonra yükleme seçeneği otomatik olarak görünecektir.</p>
                <div class="install-buttons">
                    <button class="install-no">Tamam</button>
                </div>
            </div>
        `;
        document.body.appendChild(infoPopup);

        // Tamam butonuna tıklandığında
        document.querySelector('.install-no').addEventListener('click', () => {
            infoPopup.remove();
        });
    }

    // PWA yükleme popup'ını göster
    function showInstallPopup() {
        if (!deferredPrompt) {
            console.log('PWA yükleme özelliği henüz hazır değil');
            return;
        }

        console.log('PWA yükleme popup\'ı gösteriliyor');
        const installPopup = document.createElement('div');
        installPopup.className = 'install-popup';
        installPopup.innerHTML = `
            <div class="install-popup-content">
                <h3>Radyo Uygulamasını Yükleyin</h3>
                <p>Radyo uygulamasını cihazınıza yükleyerek daha hızlı erişim sağlayabilirsiniz.</p>
                <div class="install-buttons">
                    <button class="install-yes">Yükle</button>
                    <button class="install-no">Daha Sonra</button>
                </div>
            </div>
        `;
        document.body.appendChild(installPopup);

        // Yükleme butonuna tıklandığında
        document.querySelector('.install-yes').addEventListener('click', async () => {
            console.log('Yükle butonuna tıklandı');
            installPopup.remove();
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Kullanıcı seçimi:', outcome);
            if (outcome === 'accepted') {
                console.log('Kullanıcı PWA yüklemeyi kabul etti');
            }
            deferredPrompt = null;
        });

        // Daha sonra butonuna tıklandığında
        document.querySelector('.install-no').addEventListener('click', () => {
            console.log('Daha sonra butonuna tıklandı');
            installPopup.remove();
        });
    }

    // PWA yükleme olayını dinle
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event tetiklendi');
        e.preventDefault();
        deferredPrompt = e;
        // Event tetiklendiğinde popup'ı göster
        showInstallPopup();
    });

    // PWA zaten yüklüyse
    window.addEventListener('appinstalled', (e) => {
        console.log('PWA başarıyla yüklendi', e);
    });
}); 