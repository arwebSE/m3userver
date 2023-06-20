const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');
const request = require('request');

const app = express();
const port = 3000;
const m3uUrl = process.env.M3U_URL;
const epgUrl = process.env.EPG_URL;
const downloadPath = './downloaded.m3u';
const epgDownloadPath = './downloaded.xml';

// Download file using request and store it on the server
const downloadFile = (url, filePath) => {
    return new Promise((resolve, reject) => {
        request(url)
            .pipe(fs.createWriteStream(filePath))
            .on('finish', resolve)
            .on('error', reject);
    });
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
    if (!fs.existsSync(downloadPath)) {
        return res.status(500).send('M3U file not available');
    }
    const fileStream = fs.createReadStream(downloadPath);
    fileStream.pipe(res);
});

// Serve the downloaded EPG file to any client that connects
app.get('/epg', (req, res) => {
    if (!fs.existsSync(epgDownloadPath)) {
        return res.status(500).send('EPG file not available');
    }
    const fileStream = fs.createReadStream(epgDownloadPath);
    fileStream.pipe(res);
});

// Start the download and server
scheduleDownload();
