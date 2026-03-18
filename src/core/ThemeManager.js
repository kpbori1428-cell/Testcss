class ThemeManager {
    constructor() {
        this.themes = {
            solar: {
                primary: '#f59e0b',
                bgDark: '#1e1e2e',
                glow: 'rgba(245, 158, 11, 0.4)',
                font: 'sans-serif'
            },
            ocean: {
                primary: '#0ea5e9',
                bgDark: '#0f172a',
                glow: 'rgba(14, 165, 233, 0.4)',
                font: 'serif'
            },
            forest: {
                primary: '#10b981',
                bgDark: '#064e3b',
                glow: 'rgba(16, 185, 129, 0.4)',
                font: 'monospace'
            }
        };
    }

    apply(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        this.setupPostProcessing(theme);

        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--bg-dark', theme.bgDark);
        root.style.setProperty('--primary-glow', theme.glow);

        document.body.style.backgroundColor = theme.bgDark;
        document.body.style.fontFamily = theme.font;

        console.log(`[ThemeManager] Tema aplicado: ${themeName}`);
    }

    setupPostProcessing(theme) {
        let container = document.getElementById('post-process-layer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'post-process-layer';
            container.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:99999;';
            document.body.appendChild(container);
        }

        // Procedural Grain effect using SVG filter
        container.innerHTML = `
            <svg width="0" height="0" style="position:absolute">
                <filter id="grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch"/>
                    <feColorMatrix type="saturate" values="0"/>
                    <feComponentTransfer>
                        <feFuncR type="linear" slope="0.1"/>
                        <feFuncG type="linear" slope="0.1"/>
                        <feFuncB type="linear" slope="0.1"/>
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" mode="overlay"/>
                </filter>
            </svg>
            <div style="position:absolute; inset:0; backdrop-filter: url(#grain); opacity: 0.2;"></div>
            <div style="position:absolute; inset:0; background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%);"></div>
        `;
    }
}

export const themeManager = new ThemeManager();
