const { promisify } = require('util');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytDlpWrap = new YTDlpWrap();
const execPromise = promisify(exec);
const fs = require('fs');

// Download the song and enhance vocals
async function DownloadSong(videoLink) {
    const outputTemplate = path.join('../../Singo-Download/%(title)s.%(ext)s');

    try {
        const stdout = await ytDlpWrap.execPromise([
            '-o', outputTemplate,
            '-f', 'bestaudio',
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--username', process.env.YT_USERNAME,
            '--password', process.env.YT_PASSWORD,
            videoLink
        ]);

        console.log(stdout);

        // Extract the filename from the stdout
        const outputPathMatch = stdout.match(/Destination: (.+\.mp3)/);
        if (outputPathMatch && outputPathMatch[1]) {
            const outputPath = outputPathMatch[1];   
            return outputPath;
        } else {
            throw new Error('Output file not found in command output');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error;
    }
}

module.exports = { DownloadSong };