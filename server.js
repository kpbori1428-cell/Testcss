const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '')));

// Simple CORS proxy endpoint to fetch raw HTML
// Permitir solicitudes pre-flight OPTIONS de CORS para fetches dinámicos de scripts/fuentes/imágenes
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.send();
});

// Fallback route if Service Worker isn't active yet, redirect to the real proxy
app.get('/sw/*', (req, res) => {
    const targetUrl = req.url.replace('/sw/', '');
    res.redirect(`/proxy?url=${encodeURIComponent(targetUrl)}`);
});

// Manejamos cualquier tipo de método HTTP para que las apps web modernas funcionen
app.all('/proxy', (req, res) => {
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

    // Remove headers that might conflict or betray proxy
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.referer;
    delete headers['accept-encoding']; // to avoid dealing with gzip/brotli decompression manually in the proxy
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const options = {
        method: req.method,
        headers: headers,
        rejectUnauthorized: false // Bypass cert errors in local tests
    };

    const proxyReq = protocol.request(targetUrl, options, (proxyRes) => {
        // Forward the original status code
        res.status(proxyRes.statusCode);

        // Header Stripping for iframe compatibility
        const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // Re-inject a modified CSP to allow our frame-src if needed
        // Omitted X-Frame-Options entirely since res.setHeader only adds, it doesn't pass the original unless explicitly copied.

        // Si es HTML, necesitamos bufferizar para inyectar DOCTYPE si falta (Quirks Mode fix)
        if (contentType.includes('text/html')) {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                const headStr = data.substring(0, 100).toLowerCase();
                if (!headStr.includes('<!doctype html>')) {
                    data = '<!DOCTYPE html>\n' + data;
                }
                res.send(data);
            });
        } else {
            // Para cualquier otro archivo (JS, CSS, Imágenes, Videos, Binarios), NO bufferizar como string.
            // Transmitir directamente por tubería (pipe) para ahorrar RAM y no corromper los binarios.
            proxyRes.pipe(res);
        }
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy Error:', err.message);
        res.status(500).send('Error fetching URL: ' + err.message);
    });

    // Pipe the request body if it's a POST/PUT
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
});

app.listen(port, () => {
  console.log(`Motor 3D funcionando en http://localhost:${port}`);
});