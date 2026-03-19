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
        }
    }

    if (targetUrl) {
        // Enviamos la petición reconstruida a nuestro proxy local que hace el Header Stripping
        const proxyUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        // Reconstruimos el objeto Request forzando CORS (Punto 1 de la arquitectura sugerida)
        const modifiedRequest = new Request(proxyUrl, {
            method: event.request.method,
            headers: event.request.headers,
            mode: 'cors', // Forzamos a CORS para el proxy
            credentials: 'omit', // Omitimos cookies propias hacia el proxy (el proxy descargará sin cookies por ahora)
            redirect: 'manual'
        });

        event.respondWith(
            fetch(modifiedRequest).then(async (response) => {
                // Clonamos la respuesta si es necesario modificarla
                const contentType = response.headers.get('content-type') || '';

                // Si es HTML, aplicamos las técnicas de reescritura
                if (contentType.includes('text/html')) {
                    let text = await response.text();
                    const targetOrigin = new URL(targetUrl).origin;

                    // Inyección programática del Nodo <base> para arreglar el 80% de rutas relativas
                    text = text.replace(/<head[^>]*>/i, `<head><base href="${targetOrigin}/">`);

                    // Inyección de script para mantener sincronizada la barra de URL del teléfono 3D
                    const scriptInjector = `<script>
                        window.parent.postMessage({type: 'nav-update', url: "${targetUrl}"}, '*');
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