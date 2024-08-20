const OpenAI = require("openai");
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Compress and transcribe the audio file
async function CompressAndTranslateSong(songPath, sourceLang, targetLang) {
    const ext = path.extname(songPath).toLowerCase();
    let compressedPath = songPath;

    if (ext !== '.mp3') {
        compressedPath = await CompressSong(songPath);
    }
    const sourceLyricsList = await TranscribeSong(compressedPath, sourceLang);
    const translatedLyricsList = await TranslateSRT(sourceLyricsList, targetLang);
    fs.unlink(songPath, (err) => {
        if (err) {
            console.error(`Error deleting ${songPath}: ${err.message}`);
        } else {
            console.log(`${songPath} was deleted successfully`);
        }
    })
    return {
        sourceLyrics: sourceLyricsList,
        translatedLyrics: translatedLyricsList
    };
}

// Compress the audio file
async function CompressSong(inputPath) {
    return new Promise((resolve, reject) => {
        const outputPath = inputPath.replace('.wav', '_compressed.mp3');
        console.log(outputPath);
        ffmpeg(inputPath)
            .format('mp3') // Convert to a more compressed format
            .on('end', () => {
                console.log('File has been compressed successfully');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('An error occurred: ' + err.message);
                reject(err);
            })
            .save(outputPath);
    });
}

// Transcribe the audio file
async function TranscribeSong(songPath, language) {
    try {
        const transcriptionSRT = await openai.audio.transcriptions.create({
            file: fs.createReadStream(songPath),
            model: "whisper-1",
            language: language,
            response_format: "srt"
        });
        const parsedSRT = parseSRT(transcriptionSRT);
        console.log(parsedSRT);
        return parsedSRT;
    } catch (error) {
        console.error(`Error transcribing ${songPath}: ${error.message}`);
    }
}

// Translate the SRT Content
async function TranslateSRT(srtContent, targetLang) {
    let translatedLyrics = [];
    for (const line of srtContent) {
        const translation = await openai.chat.completions.create({
            messages: [
                {"role": "system", "content": `Translate the following line to ${targetLang} language: "${line.text}". Only respond with the translated text.`},
            ],
            model: "gpt-4-turbo",
        });
        console.log("Translation:", translation.choices[0].message.content);
        translatedLyrics.push({ start: line.start, end: line.end, text: translation.choices[0].message.content });
    }
    return translatedLyrics;
}

// Parse the SRT content into an array of objects
function parseSRT(srtContent) {
    // Split the content into blocks by double newlines or more
    const srtBlocks = srtContent.trim().split(/\n{2,}/);

    // Parse each block into an object
    return srtBlocks.map(block => {
        const lines = block.split(/\n/);

        // Ensure the block has at least three lines: index, time range, and text
        if (lines.length < 3) {
            console.error("Invalid block structure:", block);
            return null;
        }

        const timeRange = lines[1].split(' --> ');
        if (timeRange.length !== 2) {
            console.error("Invalid time range format:", lines[1]);
            return null;
        }

        const start = timeStringToSeconds(timeRange[0].trim());
        const end = timeStringToSeconds(timeRange[1].trim());

        const text = lines.slice(2).join('\n'); // Join the text lines in case there are multiple lines

        return { start, end, text };
    }).filter(Boolean); // Filter out any null values resulting from errors
}

// Convert a time string in HH:MM:SS,SSS format to seconds
function timeStringToSeconds(timeString) {
    const timeParts = timeString.split(':');
    if (timeParts.length !== 3) {
        console.error("Invalid time string format:", timeString);
        return 0;
    }

    const [hours, minutes, seconds] = timeParts;
    const [secs, ms] = seconds.split(',');

    return parseInt(hours, 10) * 3600 +
           parseInt(minutes, 10) * 60 +
           parseInt(secs, 10) +
           (parseInt(ms, 10) / 1000 || 0);
}

module.exports = { CompressAndTranslateSong };