from playwright.sync_api import sync_playwright
import time

def verify_phone():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1200, "height": 800})

        # Cargar la app
        page.goto("http://localhost:8000")
        time.sleep(1)

        # Seleccionar Teléfono Inteligente
        page.click("button:has-text('Teléfono Inteligente')")
        time.sleep(1)

        # Screenshot de Home Screen con nuevas apps
        page.screenshot(path="phone_home_new.png")
        print("Home guardado.")

        # Click Mapa
        page.evaluate("document.getElementById('app_mapa').click()")
        time.sleep(1)
        page.screenshot(path="phone_mapa.png")
        print("Mapa guardado.")

        # Interactuar con mapa
        page.mouse.move(200, 200)
        time.sleep(0.5)
        page.screenshot(path="phone_mapa_movido.png")

        # Click Home
        page.evaluate("document.getElementById('home_button').click()")
        time.sleep(1)

        # Click Navegador
        page.evaluate("document.getElementById('app_navegador').click()")
        time.sleep(1)
        page.screenshot(path="phone_navegador.png")
        print("Navegador guardado.")

        browser.close()

if __name__ == "__main__":
    verify_phone()