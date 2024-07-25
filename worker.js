// worker.js

self.addEventListener('message', async function(event) {
    const { keyword, chapterData } = event.data;

    const results = await searchQuran(keyword, chapterData);
    self.postMessage(results);
});

async function searchQuran(keyword, chapterData) {
    const results = [];

    for (let i = 1; i <= 114; i++) {
        const surahNumber = i.toString().padStart(3, '0');
        try {
            const surahData = await fetch(`quranupdate/${surahNumber}.json`).then(response => response.json());
            if (surahData && surahData.ayah) {
                surahData.ayah.forEach(ayah => {
                    if (ayah.teksIndonesia && ayah.teksIndonesia.toLowerCase().includes(keyword)) {
                        results.push({
                            surah: chapterData.chapters[i - 1].surah,
                            ayahNumber: ayah.number,
                            text: ayah.teksIndonesia,
                            surahId: surahNumber,
                            ayah
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Error loading surah ${surahNumber}:`, error);
        }
    }

    return results;
}
