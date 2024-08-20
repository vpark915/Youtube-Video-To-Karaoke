const express = require('express');
require('dotenv/config');
const { CompressAndTranslateSong } = require('./utils/transcription.js');
const { DownloadSong } = require('./utils/ytDownload.js');

const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/lyrics', async(req, res) => {
    const videoLink = req.body.link;
    const sourceLang = req.body.sourceLang;
    const targetLang = req.body.targetLang;
    console.log("Received video link:", videoLink);
    const outputPath = await DownloadSong(videoLink);
    const lyrics = await CompressAndTranslateSong(outputPath, sourceLang, targetLang);
    res.json(lyrics);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
