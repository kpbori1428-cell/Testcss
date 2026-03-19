self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Instalado. Tomando control inmediatamente...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activado. Reclamando clientes...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Archivos propios del motor 3D que NUNCA deben ser proxificados
    const localSystemFiles = [
        '/', '/index.html', '/engine.js', '/apps.js', '/sw.js', '/data.json', '/instaladas.json',
        '/server.js', '/favicon.ico'
    ];
    if (localSystemFiles.includes(url.pathname) || url.pathname.endsWith('.json') || url.pathname.endsWith('.js') && !event.request.referrer.includes('/sw/')) {
        return; // Deja que el navegador lo pida normalmente
    }

    let targetUrl = null;

    // 1. Petición explícita al túnel proxy (Ej: src="/sw/https://google.com")
    if (url.pathname.startsWith('/sw/')) {
        targetUrl = url.pathname.replace('/sw/', '') + url.search;
    }
    // 2. Petición "Huérfana" (Ej: un script JS de la página inyectada pidió "/webchat/bubble.js")
    // Como el iframe está alojado en localhost, el navegador pedirá "http://localhost:3000/webchat/bubble.js"
    // Debemos atraparla, mirar quién la pidió (Referer) y redirigirla a su dominio real.
    else if (url.origin === self.location.origin) {
        const referrer = event.request.referrer;
        if (referrer && referrer.includes('/sw/')) {
            try {
                // Extraer el dominio real de la URL del referer
                // Ej referer: "http://localhost:3000/sw/https://eficell.cl/"
                const realOriginUrl = new URL(referrer.split('/sw/')[1]);
                targetUrl = realOriginUrl.origin + url.pathname + url.search;
            } catch (e) {
                console.error('[SW] Error reconstruyendo URL huérfana:', e);
            }
        }
    }

    if (targetUrl) {
        // Enviamos la petición reconstruida a nuestro proxy local que hace el Header Stripping
        const proxyUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        const modifiedRequest = new Request(proxyUrl, {
            method: event.request.method,
            headers: event.request.headers,
            mode: 'cors', // Forzamos CORS para que nuestro proxy lo maneje
            credentials: 'omit', // En un proxy avanzado se manejaría el state, aquí lo omitimos por simplicidad inicial
            redirect: 'manual'
        });

        event.respondWith(
            fetch(modifiedRequest).then(async (response) => {
                // Clonamos la respuesta para poder modificar sus cabeceras (Header Stripping se hace mayormente en server.js)
                // Pero aquí inyectamos la etiqueta <base> en el HTML si es HTML
                const contentType = response.headers.get('content-type') || '';

                if (contentType.includes('text/html')) {
                    let text = await response.text();

                    // Extraer el origen base para inyectar <base>
                    const targetOrigin = new URL(targetUrl).origin;

                    // Inyección programática de <base> para arreglar rutas relativas de CSS/Imágenes/Scripts
                    text = text.replace('<head>', `<head><base href="${targetOrigin}/">`);

                    // También podríamos inyectar un script para comunicar la URL original a logic_navegador.js
                    const scriptInjector = `<script>
                        window.parent.postMessage({type: 'nav-update', url: "${targetUrl}"}, '*');
                    </script>`;
                    text = text.replace('</body>', `${scriptInjector}</body>`);

                    return new Response(text, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers // Las cabeceras ya vienen "limpias" (sin X-Frame-Options) desde server.js
                    });
                }

                return response; // Para imágenes, CSS o scripts, devolver tal cual
            }).catch((err) => {
                console.error('[SW] Error en proxy fetch:', err);
                return new Response(`Error: ${err.message}`, { status: 500 });
            })
        );
    }
});