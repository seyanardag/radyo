const fs = require('fs');
const path = require('path');

const mp3Dir = path.join(__dirname, 'mp3');
const outputFile = path.join(__dirname, 'mp3.json');

// Eski mp3.json'u oku (varsa)
let oldData = [];
if (fs.existsSync(outputFile)) {
    try {
        oldData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    } catch (e) { oldData = []; }
}

fs.readdir(mp3Dir, (err, files) => {
    if (err) {
        console.error('Klasör okunamadı:', err);
        return;
    }

    const mp3Files = files.filter(file => file.endsWith('.mp3'));

    const jsonList = mp3Files.map(file => {
        const fileName = file.replace('.mp3', '');
        const [artist, title] = fileName.includes(' - ') ? fileName.split(' - ') : ['Bilinmeyen Sanatçı', fileName];
        let genre = 'pop';
        if (fileName.toLowerCase().includes('slow')) {
            genre = 'slow';
        }
        // Eski kayıtlarda varsa addedAt'i koru
        let addedAt = new Date().toISOString();
        const old = oldData.find(item => item.url === `./mp3/${encodeURIComponent(file)}`);
        if (old && old.addedAt) addedAt = old.addedAt;
        return {
            title: title.trim(),
            artist: artist.trim(),
            url: `./mp3/${encodeURIComponent(file)}`,
            cover: `<i class="fas fa-music"></i>`,
            genre: genre,
            addedAt: addedAt
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(jsonList, null, 4));
    console.log('mp3.json başarıyla oluşturuldu.');
});
