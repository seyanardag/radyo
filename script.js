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
    function loadStations(jsonFile) {
        $.getJSON(jsonFile, function (data) {
            stations = data;
            currentStationIndex = 0;
            createPlaylist();
            updateStationInfo();
            if (isPlaying) {
                playStation();
            }
        });
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

}); 