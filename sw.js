self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Instalado. Tomando control inmediatamente...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activado. Reclamando clientes...');
    event.waitUntil(self.clients.claim());
});

// Extrae el dominio base real de la URL inyectada en el iframe
// ej: de "http://localhost:3000/sw/https://eficell.cl/algo" a "https://eficell.cl"
function getRealOrigin(referrerUrl) {
    if (!referrerUrl) return null;
    try {
        const parts = referrerUrl.split('/sw/');
        if (parts.length > 1) {
            const injectedUrl = new URL(parts[1]);
            return injectedUrl.origin;
        }
    } catch(e) {
        return null;
    }
    return null;
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Archivos propios del motor 3D que NUNCA deben ser proxificados
    const localSystemFiles = [
        '/', '/index.html', '/engine.js', '/apps.js', '/sw.js', '/data.json', '/instaladas.json',
        '/server.js', '/favicon.ico'
    ];
    if (localSystemFiles.includes(url.pathname) || url.pathname.endsWith('.json') || (url.pathname.endsWith('.js') && !event.request.referrer.includes('/sw/'))) {
        return; // Deja que el navegador lo pida normalmente
    }

    let targetUrl = null;

    // 1. Petición explícita inicial al túnel proxy (Ej: iframe.src = "/sw/https://google.com")
    if (url.pathname.startsWith('/sw/')) {
        targetUrl = url.pathname.replace('/sw/', '') + url.search;
    }
    // 2. Intercepción de Peticiones Dinámicas (Huérfanas)
    // Como el iframe está alojado en localhost, el navegador pedirá "http://localhost:3000/webchat/bubble.js"
    // Debemos atraparla, mirar quién la pidió (Referer) y redirigirla a su dominio real.
    else if (url.origin === self.location.origin) {
        const realOrigin = getRealOrigin(event.request.referrer);
        if (realOrigin) {
            // Reconstruimos la ruta con el origen real externo
            targetUrl = realOrigin + url.pathname + url.search;
            console.log(`[SW] Interceptada petición huérfana de ${url.pathname}, re-dirigiendo a ${targetUrl}`);
        } else {
            // Attempt to resolve based on the last known navigation if referrer is missing
            // We can check if it's a request to a proxy path
            // For now, if we can't find a referrer, we let it pass, but typically this is where 404s happen
        }
    } else {
        // Intercept external requests directly (like APIs and scripts from the same origin but blocked by CORS)
        // If it's not our origin, we should proxy it to bypass CORS!
        // We shouldn't intercept API requests made from within a page loaded directly in the iframe (direct requests not through our SW path /sw/)
        // Actually, we must intercept them to bypass CORS.
        if ((url.protocol === 'http:' || url.protocol === 'https:') && !event.request.url.includes('proxy?url=')) {
            targetUrl = url.href;
            console.log(`[SW] Proxificando petición externa: ${targetUrl}`);
        }
    }

    if (targetUrl) {
        // No proxificamos requests a google fonts directamente, a veces rompen el woff2
        if (targetUrl.includes('fonts.googleapis.com') || targetUrl.includes('fonts.gstatic.com')) {
            return;
        }

        // Enviamos la petición reconstruida a nuestro proxy local que hace el Header Stripping
        const proxyUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        // Reconstruimos el objeto Request forzando CORS (Punto 1 de la arquitectura sugerida)
        // We MUST NOT pass event.request.headers directly because some headers like Sec-Fetch-Dest are immutable and might conflict
        const newHeaders = new Headers();
        for (const [key, value] of event.request.headers.entries()) {
            // Drop problematic headers that might cause CORS issues or mismatches
            if (!key.toLowerCase().startsWith('sec-fetch-')) {
                newHeaders.append(key, value);
            }
        }

        const modifiedRequest = new Request(proxyUrl, {
            method: event.request.method,
            headers: newHeaders,
            mode: 'cors', // Forzamos a CORS para el proxy
            credentials: 'omit', // Omitimos cookies propias hacia el proxy (el proxy descargará sin cookies por ahora)
            redirect: 'follow'
        });

        event.respondWith(
            fetch(modifiedRequest).then(async (response) => {
                // Return immediately if it's an opaque response
                if (response.type === 'opaque') {
                     return response;
                }

                // Clonamos la respuesta si es necesario modificarla
                const contentType = response.headers.get('content-type') || '';

                // Si es HTML, aplicamos las técnicas de reescritura
                if (contentType.includes('text/html')) {
                    let text = await response.text();

                    // Inyección de script para mantener sincronizada la barra de URL del teléfono 3D
                    // The base tag is already handled by server.js proxy
                    const scriptInjector = `<script>
                        try {
                            window.parent.postMessage({type: 'nav-update', url: "${targetUrl}"}, '*');
                        } catch(e) {}
                    </script>`;
                    text = text.replace('</body>', `${scriptInjector}</body>`);

                    return new Response(text, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers // Ya vienen limpias de X-Frame-Options gracias al server.js
                    });
                }

                // Para binarios (JS, CSS, Imágenes), devolver la respuesta inalterada
                return response;
            }).catch((err) => {
                console.error('[SW] Error en proxy fetch:', err);
                return new Response(`Error: ${err.message}`, { status: 500 });
            })
        );
    }
});