const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '')));

// Simple CORS proxy endpoint to fetch raw HTML
// Fallback route if Service Worker isn't active yet, redirect to the real proxy
app.get('/sw/*', (req, res) => {
    const targetUrl = req.url.replace('/sw/', '');
    res.redirect(`/proxy?url=${encodeURIComponent(targetUrl)}`);
});

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('No URL provided');

    // Basic SSRF protection: only allow http and https protocols
    try {
        const parsedUrl = new URL(targetUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).send('Invalid protocol');
        }

        // Prevent accessing localhost or loopback addresses to avoid SSRF to internal services
        if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname.startsWith('10.') || parsedUrl.hostname.startsWith('192.168.')) {
            return res.status(403).send('Access to internal networks is forbidden');
        }
    } catch(e) {
        return res.status(400).send('Invalid URL format');
    }

    const protocol = targetUrl.startsWith('https') ? https : http;

    protocol.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Pretend to be a normal browser
        },
        // We restore this locally because example.com or the local proxy testing environment fails standard node certs
        rejectUnauthorized: false
    }, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            // Header Stripping for iframe compatibility
            const contentType = proxyRes.headers['content-type'] || 'text/html';
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', contentType);

            // Re-inject a modified CSP to allow our frame-src if needed
            // Omitted X-Frame-Options entirely since res.setHeader only adds, it doesn't pass the original unless explicitly copied.

            // Evitar "Quirks Mode" forzando el DOCTYPE si es HTML y por alguna razón el proxy lo pierde en la lectura de chunks
            if (contentType.includes('text/html') && typeof data === 'string') {
                const headStr = data.substring(0, 100).toLowerCase();
                if (!headStr.includes('<!doctype html>')) {
                    data = '<!DOCTYPE html>\n' + data;
                }
            }

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