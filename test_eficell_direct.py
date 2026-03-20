from playwright.sync_api import sync_playwright
import time

def test_eficell():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a custom User-Agent to bypass potential blocks
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        )
        page = context.new_page()

        print("Navigating to local proxy to test eficell...")

        # intercepting requests to log them
        def intercept_request(route):
            print(f"Request: {route.request.method} {route.request.url}")
            route.continue_()

        page.route("**/*", intercept_request)

        # Let's add console log capturing
        def log_console(msg):
            print(f"Console: {msg.text}")
        page.on("console", log_console)

        # Let's test going through the SW via the proper proxy url /sw/
        page.goto('http://localhost:3000/')

        # Now go to the specific URL inside the SW scope to allow interception
        page.goto('http://localhost:3000/sw/https://eficell.cl/')

        page.wait_for_timeout(8000)

        # Take a screenshot
        page.screenshot(path='eficell_direct_proxy_screenshot.png')
        print("Saved screenshot of eficell via proxy to eficell_direct_proxy_screenshot.png")

        # Let's see the body content
        try:
            content = page.locator('body').inner_text()
            print("--- Content Snippet ---")
            print(content[:500])
            print("------------------------------")

        except Exception as e:
            print("Error waiting for body:", e)

        browser.close()

if __name__ == "__main__":
    test_eficell()