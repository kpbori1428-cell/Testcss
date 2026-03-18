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

        const root = document.documentElement;
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--bg-dark', theme.bgDark);
        root.style.setProperty('--primary-glow', theme.glow);

        document.body.style.backgroundColor = theme.bgDark;
        document.body.style.fontFamily = theme.font;

        console.log(`[ThemeManager] Tema aplicado: ${themeName}`);
    }
}

export const themeManager = new ThemeManager();
