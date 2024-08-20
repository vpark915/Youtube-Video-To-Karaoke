let player;
let sourceLyrics = [];
let translatedLyrics = [];

async function handleVideoLink() {
    const videoLink = document.getElementById('video-link').value;
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    const videoId = extractVideoId(videoLink);
    if (videoId) {
        await handleLyrics(videoLink, sourceLang, targetLang);
        initializePlayer(videoId);
    }
}


// Event listener for the 'submit-button' click
document.getElementById('submit-button').addEventListener('click', async function(event) {
    event.preventDefault();
    await handleVideoLink();
});

function extractVideoId(url) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
}

async function initializePlayer(videoId) {
    player = new YT.Player('youtube-player', {
        height: '390',
        width: '640',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

async function handleLyrics(videoLink, sourceLang, targetLang) {
    // Get the lyrics from the server
    const lyricsResponse = await fetch('http://dev-mac:3000/lyrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            link: videoLink,
            sourceLang: sourceLang,
            targetLang: targetLang
        })
    });

    const lyrics = await lyricsResponse.json();
    sourceLyrics = lyrics.sourceLyrics;
    translatedLyrics = lyrics.translatedLyrics;
    console.log(sourceLyrics)

    // Populate the src lyrics container
    const sourceLyricsContainer = document.getElementById('src-lyrics-container');
    const translatedLyricsContainer = document.getElementById('trns-lyrics-container');
    sourceLyricsContainer.innerHTML = '';
    translatedLyricsContainer.innerHTML = '';

    sourceLyrics.forEach((line, index) => {
        const div = document.createElement('div');
        div.classList.add('lyrics-line');
        div.setAttribute('data-start', line.start);
        div.setAttribute('data-end', line.end);
        div.textContent = line.text;
        sourceLyricsContainer.appendChild(div);
    });
     
    translatedLyrics.forEach((line, index) => {
        const div = document.createElement('div');
        div.classList.add('lyrics-line');
        div.setAttribute('data-start', line.start);
        div.setAttribute('data-end', line.end);
        div.textContent = line.text;
        translatedLyricsContainer.appendChild(div);
    });
    // Start the interval to sync lyrics with the video
    setInterval(syncLyricsWithVideo, 100);
}

function onPlayerReady(event) {
    // Player is ready
}

function onPlayerStateChange(event) {
    // You can handle different states here if needed
}

function syncLyricsWithVideo() {
    const currentTime = player.getCurrentTime();
    const sourceLyricsLines = document.querySelectorAll('#src-lyrics-container .lyrics-line');
    const translatedLyricsLines = document.querySelectorAll('#trns-lyrics-container .lyrics-line');

    // Function to highlight lyrics
    const highlightLyrics = (lyricsLines) => {
        lyricsLines.forEach((lyricsLineElement) => {
            const startTime = parseFloat(lyricsLineElement.getAttribute('data-start'));
            const endTime = parseFloat(lyricsLineElement.getAttribute('data-end'));

            if (currentTime >= startTime && currentTime <= endTime) {
                lyricsLineElement.classList.add('highlight');
            } else {
                lyricsLineElement.classList.remove('highlight');
            }
        });
    };

    // Highlight source lyrics
    highlightLyrics(sourceLyricsLines);

    // Highlight translated lyrics
    highlightLyrics(translatedLyricsLines);
}