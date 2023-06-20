const express = require('express');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const port = 3000;
const m3uUrl = process.env.ENDPOINT_URL;
const downloadPath = './downloaded.m3u';

// Download the M3U file and store it on the server
const downloadM3U = async () => {
    try {
        const response = await axios.get(m3uUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(downloadPath, Buffer.from(response.data, 'binary'));
        console.log('M3U file downloaded successfully!');
    } catch (error) {
        console.error('Error downloading the M3U file:', error);
    }
};

// Schedule the periodic download of the M3U file
cron.schedule('0 0 * * *', () => {
    downloadM3U();
});

// Ping route for uptimerobot
app.all("/", (_req, res) => {
    res.send("API is running!");
});

// Serve the downloaded M3U file to any client that connects
app.get('/m3u', (req, res) => {
    if (!fs.existsSync(downloadPath)) {
        return res.status(500).send('M3U file not available');
    }
    const fileStream = fs.createReadStream(downloadPath);
    fileStream.pipe(res);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    downloadM3U();
});
