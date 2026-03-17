from playwright.sync_api import sync_playwright

def verify_templates():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We need a local server running or we can just access it locally
        page.goto("http://localhost:8000")
        page.wait_for_load_state("networkidle")

        page.evaluate("document.querySelector('button[data-url=\"./template_gallery.json\"]').click()")
        page.wait_for_timeout(2000)
        page.screenshot(path="gallery2.png")
        print("Gallery captured.")

        page.evaluate("document.querySelector('button[data-url=\"./template_carousel.json\"]').click()")
        page.wait_for_timeout(2000)
        page.screenshot(path="carousel2.png")
        print("Carousel captured.")

        browser.close()

if __name__ == "__main__":
    verify_templates()
