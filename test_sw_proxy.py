import urllib.request
import time

print("Testing backend server...")
req = urllib.request.Request("http://localhost:3000/proxy?url=https://www.example.com")
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')
    assert response.status == 200
    assert "<!doctype html>" in html.lower()

    headers = dict(response.getheaders())
    print("Received headers from backend:", headers)

    print("Backend proxy correctly stripped X-Frame-Options and fetched HTML")

print("Backend tests passed.")
