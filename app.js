document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const ayahModal = document.getElementById('ayahModal');
    const closeModal = document.getElementById('closeModal');
    const surahName = document.getElementById('surahName');
    const ayahText = document.getElementById('ayahText');
    const ayahLatin = document.getElementById('ayahLatin');
    const ayahIndonesia = document.getElementById('ayahIndonesia');
    const tafsirSection = document.getElementById('tafsirSection');
    const ayahTafsir = document.getElementById('ayahTafsir');
    const toggleTafsir = document.getElementById('toggleTafsir');
    const toggleDarkMode = document.getElementById('toggleDarkMode');

    searchButton.addEventListener('click', performSearch);
    closeModal.addEventListener('click', () => {
        ayahModal.classList.add('hidden');
        tafsirSection.classList.add('hidden');
        toggleTafsir.innerHTML = '<i class="fas fa-book"></i> Tampilkan Tafsir';
    });

    toggleTafsir.addEventListener('click', () => {
        tafsirSection.classList.toggle('hidden');
        toggleTafsir.innerHTML = tafsirSection.classList.contains('hidden') ? '<i class="fas fa-book"></i> Tampilkan Tafsir' : '<i class="fas fa-book"></i> Sembunyikan Tafsir';
    });

    toggleDarkMode.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });

    async function performSearch() {
        const keyword = searchInput.value.toLowerCase();
        if (keyword.length < 3) {
            showNotification('Mohon masukkan minimal 3 karakter.', 'error');
            return;
        }

        resultsDiv.innerHTML = `
            <p>Mencari di mulai...</p>
            <div class="spinner"></div>
            <div class="progress-bar" id="progressBar"></div>
        `;
        
        const progressBar = document.getElementById('progressBar');
        const startTime = Date.now();
        const results = await searchQuran(keyword, progressBar);
        const endTime = Date.now();
        
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        showNotification(`Pencarian selesai dalam ${duration} detik.`, 'success');
        displayResults(results, keyword);
    }

    async function searchQuran(keyword, progressBar) {
        const results = [];
        const chapterData = await fetch('chapter.json').then(response => response.json());
        const totalSurahs = 114;
        let processedSurahs = 0;

        for (let i = 1; i <= totalSurahs; i++) {
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

            // Update progress bar
            processedSurahs++;
            const progress = Math.round((processedSurahs / totalSurahs) * 100);
            progressBar.style.width = `${progress}%`;
        }

        return results;
    }

    function displayResults(results, keyword) {
        resultsDiv.innerHTML = '';

        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>Tidak ditemukan hasil.</p>';
            return;
        }

        let html = `<h2 class="text-xl font-bold mb-4">Hasil Pencarian (${results.length} ayat ditemukan):</h2>`;
        html += '<ul class="space-y-4">';
        results.forEach(result => {
            const highlightedText = highlightKeyword(result.text, keyword);
            html += `
                <li class="bg-white dark:bg-gray-700 p-4 rounded shadow cursor-pointer" data-surah="${result.surahId}" data-ayah="${result.ayahNumber}">
                    <p class="font-bold">${result.surah} : ${result.ayahNumber}</p>
                    <p>${highlightedText}</p>
                </li>
            `;
        });
        html += '</ul>';

        resultsDiv.innerHTML = html;

        document.querySelectorAll('#results li').forEach(item => {
            item.addEventListener('click', () => {
                const surahId = item.getAttribute('data-surah');
                const ayahNumber = item.getAttribute('data-ayah');
                showAyahDetails(surahId, ayahNumber);
            });
        });
    }

    function highlightKeyword(text, keyword) {
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-500">$1</span>');
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerText = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async function showAyahDetails(surahId, ayahNumber) {
        try {
            const surahData = await fetch(`quranupdate/${surahId}.json`).then(response => response.json());
            const ayahData = surahData.ayah.find(ayah => ayah.number === ayahNumber);

            if (ayahData) {
                const surahNameFormatted = `${surahData.id}. ${surahData.name} : ${ayahNumber}`;

                surahName.innerText = surahNameFormatted;
                ayahText.innerText = ayahData.text;
                ayahLatin.innerText = ayahData.teksLatin;
                ayahIndonesia.innerText = ayahData.teksIndonesia;
                ayahTafsir.innerText = ayahData.tafsir || 'Tafsir tidak tersedia.';

                ayahModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading Ayah details:', error);
        }
    }
});