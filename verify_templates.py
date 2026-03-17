from playwright.sync_api import sync_playwright

def verify_templates():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Test loading Carousel
        page.goto("http://localhost:8000")
        page.wait_for_load_state("networkidle")
        page.click("button:has-text('Carrusel Circular')")
        page.wait_for_timeout(2000)
        page.screenshot(path="carousel.png")
        print("Carousel captured.")

        # Test loading Gallery
        page.click("button:has-text('Galería 3D')")
        page.wait_for_timeout(2000)
        page.screenshot(path="gallery.png")
        print("Gallery captured.")

        browser.close()

if __name__ == "__main__":
    verify_templates()
