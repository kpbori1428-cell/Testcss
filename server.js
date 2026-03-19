const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '')));

// Simple CORS proxy endpoint to fetch raw HTML
app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('No URL provided');

    const protocol = targetUrl.startsWith('https') ? https : http;

    protocol.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Pretend to be a normal browser
        },
        rejectUnauthorized: false // Bypass "unable to get local issuer certificate" in local testing proxy
    }, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            // Header Stripping for iframe compatibility
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/html');

            // Re-inject a modified CSP to allow our frame-src if needed
            // Omitted X-Frame-Options entirely since res.setHeader only adds, it doesn't pass the original unless explicitly copied.

            res.send(data);
        });

    }).on('error', (err) => {
        console.error('Proxy Error:', err.message);
        res.status(500).send('Error fetching URL: ' + err.message);
    });
});

app.listen(port, () => {
  console.log(`Motor 3D funcionando en http://localhost:${port}`);
});