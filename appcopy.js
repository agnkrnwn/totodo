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
    const toggleTafsir = document.getElementById('toggleTafsir');
    const tafsirSection = document.getElementById('tafsirSection');
    const ayahTafsir = document.getElementById('ayahTafsir');
    const toggleDarkMode = document.getElementById('toggleDarkMode');

    const searchWorker = new Worker('search.worker.js');
    let isIndexBuilt = false;

    searchWorker.onmessage = function(e) {
        if (e.data.type === 'indexBuilt') {
            isIndexBuilt = true;
            searchButton.disabled = false;
            searchButton.textContent = 'Cari';
        } else if (e.data.type === 'searchResults') {
            displayResults(e.data.results, searchInput.value);
        }
    }

    searchWorker.postMessage({ type: 'buildIndex' });

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

    function performSearch() {
        const keyword = searchInput.value.toLowerCase();
        if (keyword.length < 3) {
            alert('Mohon masukkan minimal 3 karakter.');
            return;
        }

        if (!isIndexBuilt) {
            alert('Indeks pencarian sedang dibangun. Mohon tunggu sebentar.');
            return;
        }

        resultsDiv.innerHTML = 'Mencari...';
        searchWorker.postMessage({ type: 'search', keyword });
    }

    function displayResults(results, keyword) {
        if (results.length === 0) {
            resultsDiv.innerHTML = 'Tidak ditemukan hasil.';
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
    
                // Menambahkan kembali tombol "Tampilkan Tafsir"
                const toggleTafsir = document.getElementById('toggleTafsir');
                const tafsirSection = document.getElementById('tafsirSection');
                const ayahTafsir = document.getElementById('ayahTafsir');
    
                toggleTafsir.style.display = 'block'; // Memastikan tombol terlihat
                toggleTafsir.innerText = 'Tampilkan Tafsir';
                tafsirSection.classList.add('hidden');
                ayahTafsir.innerText = ayahData.tafsir || 'Tafsir tidak tersedia.';
    
                toggleTafsir.onclick = function() {
                    tafsirSection.classList.toggle('hidden');
                    toggleTafsir.innerText = tafsirSection.classList.contains('hidden') ? 'Tampilkan Tafsir' : 'Sembunyikan Tafsir';
                };
    
                // Tombol Download untuk TikTok
                const downloadButton = document.createElement('button');
                downloadButton.innerText = 'Download for TikTok';
                downloadButton.className = 'bg-blue-500 text-white px-4 py-2 rounded mt-4';
                downloadButton.addEventListener('click', () => downloadForTikTok(ayahData, surahNameFormatted));
    
                const modalContent = ayahModal.querySelector('div');
                // Hapus tombol download yang mungkin sudah ada sebelumnya
                const existingDownloadButton = modalContent.querySelector('button[innerText="Download for TikTok"]');
                if (existingDownloadButton) {
                    modalContent.removeChild(existingDownloadButton);
                }
                modalContent.appendChild(downloadButton);
    
                ayahModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading Ayah details:', error);
        }
    }

    function downloadForTikTok(ayahData, surahName) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 1080;
        canvas.height = 1920;
        
        // Set background (dark mode)
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Constants for layout
        const margin = 100;
        const spacing = 40;
        
        // Calculate total content height
        let totalHeight = calculateTotalHeight(ctx, ayahData, canvas.width - margin * 2);
        
        // Calculate starting Y position to center content vertically
        let currentY = (canvas.height - totalHeight) / 2;
        
        // Draw Arabic text (right-aligned)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px "Traditional Arabic"';
        ctx.textAlign = 'right';
        currentY = wrapText(ctx, ayahData.text, canvas.width - margin, currentY, canvas.width - margin * 2, 80) + spacing;
        
        // Reset text alignment for other text (left-aligned)
        ctx.textAlign = 'left';
        
        // Draw Latin transliteration
        ctx.font = '30px Arial';
        ctx.fillStyle = '#E0E0E0';
        currentY = wrapText(ctx, ayahData.teksLatin, margin, currentY, canvas.width - margin * 2, 40) + spacing;
        
        // Draw Indonesian translation
        currentY = wrapText(ctx, ayahData.teksIndonesia, margin, currentY, canvas.width - margin * 2, 40) + spacing;
        
        // Draw surah name just below the Indonesian translation (centered)
        ctx.font = '28px Arial';
        ctx.fillStyle = '#BBBBBB';
        ctx.textAlign = 'center';
        ctx.fillText(surahName, canvas.width / 2, currentY);
        
        // Convert canvas to PNG and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quran_ayah_${surahName.replace(/\s/g, '_')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
    
    function calculateTotalHeight(ctx, ayahData, maxWidth) {
        let height = 0;
        ctx.font = 'bold 60px "Traditional Arabic"';
        height += measureTextHeight(ctx, ayahData.text, maxWidth, 80);
        ctx.font = '30px Arial';
        height += measureTextHeight(ctx, ayahData.teksLatin, maxWidth, 40);
        height += measureTextHeight(ctx, ayahData.teksIndonesia, maxWidth, 40);
        height += 28; // Tinggi untuk nama surah
        return height + 160; // Add extra spacing
    }
    
    function measureTextHeight(ctx, text, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let height = lineHeight;
    
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                line = words[n] + ' ';
                height += lineHeight;
            } else {
                line = testLine;
            }
        }
        return height;
    }
    
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testY = y;
    
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, testY);
                line = words[n] + ' ';
                testY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, testY);
        return testY + lineHeight;
    }
});