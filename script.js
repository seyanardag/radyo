$(document).ready(function () {
    const audio = new Audio();
    let isPlaying = false;
    let currentStationIndex = 0;
    let totalBytesLoaded = 0;
    let startTime = 0;
    let stations = [];
    let isRadioMode = true;

    // Albüm kapağına tıklama
    $('.album-art').click(function () {
        $('#dataUsage').parent().toggleClass('show');
    });

    // MP3 dosyalarını kontrol et ve JSON verisiyle birleştir
    async function checkAndMergeMP3Files(jsonData) {
        try {
            const response = await fetch('mp3/');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const mp3Files = Array.from(doc.querySelectorAll('a'))
                .filter(a => a.href.endsWith('.mp3'))
                .map(a => decodeURIComponent(a.href.split('/').pop()));

            // JSON'da olmayan MP3'leri bul
            const existingUrls = jsonData.map(item => decodeURIComponent(item.url.split('/').pop()));
            const newMP3s = mp3Files.filter(file => !existingUrls.includes(file));

            // Yeni MP3'leri ekle
            newMP3s.forEach(file => {
                const fileName = file.replace('.mp3', '');
                const title = fileName.includes(' - ') ? fileName.split(' - ')[1] : fileName;
                const artist = fileName.includes(' - ') ? fileName.split(' - ')[0] : 'Bilinmeyen Sanatçı';

                jsonData.push({
                    title: title,
                    artist: artist,
                    url: `./mp3/${encodeURIComponent(file)}`,
                    cover: '<i class="fas fa-music"></i>'
                });
            });

            return jsonData;
        } catch (error) {
            console.error('MP3 dosyaları kontrol edilirken hata oluştu:', error);
            return jsonData;
        }
    }

    // Mod değiştirme butonu
    $('#modeSwitch').click(function () {
        isRadioMode = !isRadioMode;
        const $icon = $(this).find('i');

        if (isRadioMode) {
            $icon.removeClass('fa-music').addClass('fa-broadcast-tower');
            loadStations('radio.json');
        } else {
            $icon.removeClass('fa-broadcast-tower').addClass('fa-music');
            loadStations('mp3.json');
        }
    });

    // Radyo istasyonları listesini yükle
    async function loadStations(jsonFile) {
        try {
            const response = await fetch(jsonFile);
            let data = await response.json();

            // Eğer MP3 modundaysak, dosyaları kontrol et
            if (!isRadioMode) {
                data = await checkAndMergeMP3Files(data);
            }

            stations = data;
            currentStationIndex = 0;
            createPlaylist();
            updateStationInfo();
            if (isPlaying) {
                playStation();
            }
        } catch (error) {
            console.error('Veri yüklenirken hata oluştu:', error);
        }
    }

    // İlk yükleme
    loadStations('radio.json');

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

            // Radyo resmi veya müzik ikonu
            // let $img;
            // if (station.cover.startsWith('<i')) {
            //     $img = $('<div>')
            //         .addClass('station-image')
            //         .html(station.cover);
            // } else {
            //     $img = $('<img>')
            //         .addClass('station-image')
            //         .attr('src', station.cover)
            //         .attr('alt', station.title);
            // }

            let $img;

            if (station.cover && station.cover.trim().startsWith('<i')) {
                // Eğer HTML ikon ise
                $img = $('<div>')
                    .addClass('station-image')
                    .html(station.cover);
            } else if (station.cover) {
                // Eğer resim URL'si ise
                $img = $('<img>')
                    .addClass('station-image')
                    .attr('src', station.cover)
                    .attr('alt', station.title || '');
            } else {
                // Eğer cover yoksa boş bir div oluştur
                $img = $('<div>').addClass('station-image');
            }

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

        // Albüm kapağı veya müzik ikonu
        if (station.cover.startsWith('<i')) {
            $('#albumArt').replaceWith($('<div>')
                .attr('id', 'albumArt')
                .addClass('album-art')
                .html(station.cover));
        } else {
            $('#albumArt').replaceWith($('<img>')
                .attr('id', 'albumArt')
                .addClass('album-art')
                .attr('src', station.cover)
                .attr('alt', station.title));
        }

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

}); 