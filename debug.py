from playwright.sync_api import sync_playwright
import time

def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 800, "height": 800})
        page.goto("http://localhost:8000")
        time.sleep(1)
        page.click("button:has-text('Teléfono Inteligente')")
        time.sleep(1)
        # Capture full page instead of element
        page.screenshot(path="debug_layout.png")
        browser.close()

if __name__ == "__main__":
    check()