const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const port = 3000;
const m3uUrl = process.env.M3U_URL;
const epgUrl = process.env.EPG_URL;
const downloadPath = './downloaded.m3u';
const epgDownloadPath = './downloaded.xml';

// Download file using axios and store it on the server
const downloadFile = async (url, filePath) => {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(filePath));
        return new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Error downloading file from ${url}: ${error.message}`);
    }
};

// Schedule the periodic download of the M3U and EPG files
const scheduleDownload = async () => {
    try {
        await downloadFile(m3uUrl, downloadPath);
        console.log('M3U file downloaded successfully!');
        await downloadFile(epgUrl, epgDownloadPath);
        console.log('EPG file downloaded successfully!');
        startServer();
    } catch (error) {
        console.error('Error downloading files:', error);
    }
};

// Start the server
const startServer = () => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

// Ping route for uptimerobot
app.all('/', (_req, res) => {
    res.send('API is running!');
});

// Serve the downloaded M3U file to any client that connects
app.get('/m3u', (req, res) => {
    console.log("Serving the m3u file...");
    if (!fs.existsSync(downloadPath)) {
        return res.status(500).send('M3U file not available');
    }
    const fileStream = fs.createReadStream(downloadPath);
    fileStream.pipe(res);
});

// Serve the downloaded EPG file to any client that connects
app.get('/epg', (req, res) => {
    console.log("Serving the epg file...");
    if (!fs.existsSync(epgDownloadPath)) {
        return res.status(500).send('EPG file not available');
    }
    const fileStream = fs.createReadStream(epgDownloadPath);
    fileStream.pipe(res);
});

// Start the download and server
scheduleDownload();
