$(document).ready(function () {
    const audio = new Audio();
    let isPlaying = false;
    let currentStationIndex = 0;
    let totalBytesLoaded = 0;
    let startTime = 0;
    let stations = [];
    let isRadioMode = true;
    let selectedGenre = 'pop'; // MP3 modunda aktif tab
    let mp3SortType = 'json'; // Sıralama tipi

    // Albüm kapağına tıklama
    $('.album-art').click(function () {
        $('#dataUsage').parent().toggleClass('show');
    });

    // MP3 dosyalarını kontrol et ve JSON verisiyle birleştir
    async function checkAndMergeMP3Files(jsonData) {
        try {
            const response = await fetch('./mp3/');
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
                let genre = 'pop';
                if (fileName.toLowerCase().includes('slow')) {
                    genre = 'slow';
                }
                const addedAt = new Date().toISOString();
                jsonData.push({
                    title: title,
                    artist: artist,
                    url: `./mp3/${encodeURIComponent(file)}`,
                    cover: '<i class="fas fa-music"></i>',
                    genre: genre,
                    addedAt: addedAt
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
            $('#mp3Tabs').hide();
            $('#mp3SortBar').hide();
            $('h3').text('Radyo İstasyonları');
            loadStations('radio.json');
        } else {
            $icon.removeClass('fa-broadcast-tower').addClass('fa-music');
            $('#mp3Tabs').show();
            $('#mp3SortBar').show();
            $('h3').text('MP3 Listesi');
            selectedGenre = 'pop';
            $('.mp3-tab').removeClass('active');
            $('.mp3-tab[data-genre="pop"]').addClass('active');
            loadStations('mp3.json');
        }
    });

    // Sıralama seçimi değişince listeyi güncelle
    $('#mp3SortSelect').on('change', function () {
        mp3SortType = $(this).val();
        createPlaylist();
    });

    // MP3 tab tıklama
    $('#mp3Tabs').on('click', '.mp3-tab', function () {
        if (!isRadioMode) {
            $('.mp3-tab').removeClass('active');
            $(this).addClass('active');
            selectedGenre = $(this).data('genre');
            createPlaylist();
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
    $('#mp3Tabs').hide();
    $('#mp3SortBar').hide();

    // Çalma listesini oluştur
    function createPlaylist() {
        const $playlist = $('#playlist');
        $playlist.empty();

        let filteredStations = stations;
        if (!isRadioMode) {
            filteredStations = stations.filter(station => (station.genre || 'pop') === selectedGenre);
            // Sıralama uygula
            if (mp3SortType === 'date') {
                filteredStations = filteredStations.slice().sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
            } else if (mp3SortType === 'az') {
                filteredStations = filteredStations.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            } else if (mp3SortType === 'za') {
                filteredStations = filteredStations.slice().sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            } // json sırası için dokunma
        }

        filteredStations.forEach((station, index) => {
            const $li = $('<li>')
                .data('index', stations.indexOf(station)); // Orijinal indexi koru

            // Sıra numarası
            const $number = $('<span>')
                .addClass('station-number')
                .text((index + 1).toString().padStart(2, '0'));

            let $img;
            if (station.cover && station.cover.trim().startsWith('<i')) {
                $img = $('<div>')
                    .addClass('station-image')
                    .html(station.cover);
            } else if (station.cover) {
                $img = $('<img>')
                    .addClass('station-image')
                    .attr('src', station.cover)
                    .attr('alt', station.title || '');
            } else {
                $img = $('<div>').addClass('station-image');
            }

            const $title = $('<span>')
                .addClass('station-title')
                .text(station.title);

            // Listeye ekle butonu (sadece mp3 modunda)
            let $addBtn = null;
            if (!isRadioMode) {
                $addBtn = $('<button>')
                    .addClass('add-to-playlist-btn')
                    .attr('title', 'Şarkı listesine ekle')
                    .css({ background: 'none', border: 'none', color: '#4CAF50', fontSize: '1.3rem', cursor: 'pointer', marginLeft: '8px' })
                    .html('<i class="fas fa-plus"></i>');
            }

            $li.append($number, $img, $title);
            if ($addBtn) $li.append($addBtn);

            if (stations.indexOf(station) === currentStationIndex) {
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

    // MP3 modunda şarkı bittiğinde otomatik olarak sonraki şarkıya geç
    audio.addEventListener('ended', function () {
        if (!isRadioMode) {
            currentStationIndex = (currentStationIndex + 1) % stations.length;
            updateStationInfo();
            playStation();
        }
    });

    // Playlist panelini aç/kapat
    $('#playlistSwitch').click(function () {
        $('#playlistPanel').fadeIn(200);
        renderPlaylistLists();
    });
    $('#playlistPanel .close-panel').click(function () {
        $('#playlistPanel').fadeOut(200);
    });

    // Playlistleri localStorage'dan yükle ve listele
    function getPlaylists() {
        return JSON.parse(localStorage.getItem('playlists') || '[]');
    }
    function renderPlaylistLists() {
        const playlists = getPlaylists();
        let html = '';
        if (playlists.length === 0) {
            html = '<p>Henüz bir şarkı listeniz yok.</p>';
        } else {
            html = '<ul>' + playlists.map((pl, i) => `<li data-index="${i}"><i class='fas fa-list'></i> ${pl.name} <span style='flex:1'></span> <span style='opacity:0.7'>${pl.songs.length} şarkı</span></li>`).join('') + '</ul>';
        }
        $('#playlistLists').html(html);
    }

    // Playlist ekleme
    $('#addPlaylistBtn').click(function () {
        const name = $('#newPlaylistName').val().trim();
        if (!name) return;
        let playlists = getPlaylists();
        if (playlists.some(pl => pl.name === name)) {
            alert('Bu isimde bir liste zaten var!');
            return;
        }
        playlists.push({ name: name, songs: [] });
        localStorage.setItem('playlists', JSON.stringify(playlists));
        $('#newPlaylistName').val('');
        renderPlaylistLists();
    });

    // Playlist'e tıklayınca şarkıları göster
    $('#playlistLists').on('click', 'li', function () {
        const index = $(this).data('index');
        showPlaylistSongs(index);
    });

    // Seçili playlistin şarkılarını göster
    function showPlaylistSongs(index) {
        const playlists = getPlaylists();
        const playlist = playlists[index];
        if (!playlist) return;
        let html = `<h3 style='text-align:center;'>${playlist.name}</h3>`;
        if (playlist.songs.length === 0) {
            html += '<p>Bu listede henüz şarkı yok.</p>';
        } else {
            html += '<ul>' + playlist.songs.map((song, i) =>
                `<li data-song-index='${i}'>
                    <span>${song.title} - ${song.artist}</span>
                    <button class='playSongBtn' style='margin-left:auto; background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer;'><i class='fas fa-play'></i></button>
                    <button class='removeSongBtn' style='background:none; border:none; color:#f55; font-size:1.2rem; cursor:pointer;'><i class='fas fa-trash'></i></button>
                </li>`
            ).join('') + '</ul>';
        }
        $('#playlistSongsArea').html(html);
        $('#playlistSongsArea').data('playlist-index', index);
    }

    // Playlist şarkılarını kapatınca alanı temizle
    $('#playlistPanel .close-panel').click(function () {
        $('#playlistSongsArea').html('');
    });

    // Playlistteki şarkıyı çal
    $('#playlistSongsArea').on('click', '.playSongBtn', function () {
        const playlistIndex = $('#playlistSongsArea').data('playlist-index');
        const songIndex = $(this).closest('li').data('song-index');
        const playlists = getPlaylists();
        const song = playlists[playlistIndex].songs[songIndex];
        if (!song) return;
        isRadioMode = false;
        $('#mp3Tabs').hide();
        $('h3').text('MP3 Listesi');
        stations = playlists[playlistIndex].songs;
        currentStationIndex = songIndex;
        createPlaylist();
        updateStationInfo();
        playStation();
        $('#playlistPanel').fadeOut(200);
    });

    // Playlistten şarkı çıkar
    $('#playlistSongsArea').on('click', '.removeSongBtn', function () {
        const playlistIndex = $('#playlistSongsArea').data('playlist-index');
        const songIndex = $(this).closest('li').data('song-index');
        let playlists = getPlaylists();
        playlists[playlistIndex].songs.splice(songIndex, 1);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        showPlaylistSongs(playlistIndex);
        renderPlaylistLists();
    });

    // Listeye ekle butonuna tıklama
    $('#playlist').on('click', '.add-to-playlist-btn', function (e) {
        e.stopPropagation();
        const songIndex = $(this).closest('li').data('index');
        const song = stations[songIndex];
        $('#addToPlaylistModal').data('song', song).fadeIn(200);
        renderAddToPlaylistList();
    });
    $('#closeAddToPlaylistModal').click(function () {
        $('#addToPlaylistModal').fadeOut(200);
    });

    // Modalda playlistleri listele
    function renderAddToPlaylistList() {
        const playlists = getPlaylists();
        let html = '';
        if (playlists.length === 0) {
            html = '<p>Önce bir şarkı listesi oluşturun.</p>';
        } else {
            html = '<ul>' + playlists.map((pl, i) => `<li data-index="${i}" style='cursor:pointer;'><i class="fas fa-list"></i> ${pl.name}</li>`).join('') + '</ul>';
        }
        $('#addToPlaylistListArea').html(html);
    }

    // Modalda bir playlist seçilince şarkıyı ekle
    $('#addToPlaylistListArea').on('click', 'li', function () {
        const playlistIndex = $(this).data('index');
        const song = $('#addToPlaylistModal').data('song');
        let playlists = getPlaylists();
        // Aynı şarkı zaten varsa ekleme
        if (playlists[playlistIndex].songs.some(s => s.url === song.url)) {
            alert('Bu şarkı zaten bu listede!');
            return;
        }
        playlists[playlistIndex].songs.push(song);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        $('#addToPlaylistModal').fadeOut(200);
        renderPlaylistLists();
        // Kullanıcıya kısa bir bildirim
        $('<div>Şarkı listeye eklendi!</div>').css({ position: 'fixed', top: '30px', right: '30px', background: '#4CAF50', color: '#fff', padding: '10px 20px', borderRadius: '8px', zIndex: 9999 }).appendTo('body').delay(1200).fadeOut(400, function () { $(this).remove(); });
    });

}); 