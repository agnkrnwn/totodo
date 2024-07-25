// search.worker.js
let searchIndex = {};

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzySearch(keyword, threshold = 1) {  // Mengubah threshold menjadi 1
    const results = [];
    const keywordLength = keyword.length;
    Object.keys(searchIndex).forEach(indexedWord => {
        // Hanya periksa kata-kata dengan panjang yang mirip
        if (Math.abs(indexedWord.length - keywordLength) <= 1) {
            const distance = levenshteinDistance(keyword, indexedWord);
            if (distance <= threshold) {
                results.push(...searchIndex[indexedWord]);
            }
        }
    });
    return Array.from(new Set(results.map(JSON.stringify))).map(JSON.parse);
}

// Tambahkan fungsi untuk mencari kata yang tepat
function exactSearch(keyword) {
    return searchIndex[keyword] || [];
}

async function buildSearchIndex() {
    try {
        const chapterData = await fetch('chapter.json').then(response => response.json());
        for (let i = 1; i <= 114; i++) {
            const surahNumber = i.toString().padStart(3, '0');
            try {
                const response = await fetch(`quranupdate/${surahNumber}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const surahData = await response.json();
                if (surahData && surahData.ayah) {
                    surahData.ayah.forEach(ayah => {
                        if (ayah.teksIndonesia) {
                            const words = ayah.teksIndonesia.toLowerCase().split(/\s+/);
                            words.forEach(word => {
                                if (!searchIndex[word]) {
                                    searchIndex[word] = [];
                                }
                                searchIndex[word].push({
                                    surah: chapterData.chapters[i - 1].surah,
                                    ayahNumber: ayah.number,
                                    surahId: surahNumber,
                                    text: ayah.teksIndonesia
                                });
                            });
                        } else {
                            console.warn(`teksIndonesia missing for surah ${surahNumber}, ayah ${ayah.number}`);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error loading surah ${surahNumber}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading chapter data:', error);
    }
    self.postMessage({ type: 'indexBuilt' });
}

self.onmessage = function(e) {
    if (e.data.type === 'buildIndex') {
        buildSearchIndex();
    } else if (e.data.type === 'search') {
        const exactResults = exactSearch(e.data.keyword);
        const fuzzyResults = fuzzySearch(e.data.keyword);
        const combinedResults = [...exactResults, ...fuzzyResults];
        const uniqueResults = Array.from(new Set(combinedResults.map(JSON.stringify))).map(JSON.parse);
        self.postMessage({ type: 'searchResults', results: uniqueResults });
    }
}