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

    // Si la petición comienza con "/sw/", es una petición mágica para nuestro iframe.
    // Ej: /sw/https://google.com
    if (url.pathname.startsWith('/sw/')) {
        let targetUrl = url.pathname.replace('/sw/', '') + url.search;

        // Si el targetUrl no tiene dominio (ej: es un script relativo pedido por la página inyectada)
        // Por ejemplo, el navegador pide: /sw/script.js. Tenemos que saber a qué dominio real pertenece.
        // Como simplificación básica para este proxy local, asumimos que el iframe hace sus peticiones base bien.
        // Para peticiones complejas (CORS total), enviaríamos la petición a nuestro server.js proxy.

        // Enviamos la petición a nuestro proxy local que hace el Header Stripping
        const proxyUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        // Reconstruimos el objeto Request como explica la arquitectura
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

                    // También podríamos inyectar un script para comunicar la URL actual a logic_navegador.js
                    const scriptInjector = `<script>
                        window.parent.postMessage({type: 'nav-update', url: window.location.href}, '*');
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