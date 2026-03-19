from playwright.sync_api import sync_playwright

def test_eficell():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a custom User-Agent to bypass potential blocks
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        )
        page = context.new_page()

        print("Navigating to local proxy to test eficell...")
        # Open our 3D phone engine
        page.goto('http://localhost:3000/')
        page.wait_for_selector('#app-navegador', state='visible')

        # Click the browser app icon
        print("Clicking Navegador...")
        page.locator('#app-navegador').click(force=True)

        # Wait for the iframe inside the browser to load
        page.wait_for_selector('iframe', state='visible')

        # Wait a bit for the proxy/SW to initialize
        page.wait_for_timeout(2000)

        # Let's inspect what happens when we go to eficell.cl
        # We need to type the URL in the address bar and press Enter
        print("Typing eficell.cl...")
        url_input = page.locator('#url-input')
        url_input.fill('https://eficell.cl/')
        url_input.press('Enter')

        # We wait for the iframe to load the new URL via proxy
        page.wait_for_timeout(5000) # Give it time to load

        # Take a screenshot
        page.screenshot(path='eficell_proxy_screenshot.png')
        print("Saved screenshot of eficell via proxy to eficell_proxy_screenshot.png")

        # Let's see the direct iframe content
        iframe = page.frame_locator('iframe').first
        try:
            iframe.locator('body').wait_for(timeout=5000)
            print("Iframe body loaded.")

            # Print some content to see what we got
            content = iframe.locator('body').inner_text()
            print("--- Iframe Content Snippet ---")
            print(content[:500])
            print("------------------------------")

            # Capture network logs from the page
        except Exception as e:
            print("Error waiting for iframe body:", e)

        browser.close()

if __name__ == "__main__":
    test_eficell()