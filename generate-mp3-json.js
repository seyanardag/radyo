const fs = require('fs');
const path = require('path');

const mp3Dir = path.join(__dirname, 'mp3');
const outputFile = path.join(__dirname, 'mp3.json');

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
        return {
            title: title.trim(),
            artist: artist.trim(),
            url: `./mp3/${encodeURIComponent(file)}`,
            cover: `<i class="fas fa-music"></i>`,
            genre: genre
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(jsonList, null, 4));
    console.log('mp3.json başarıyla oluşturuldu.');
});
