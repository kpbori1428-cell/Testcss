import urllib.request
import time

print("Testing backend server...")
req = urllib.request.Request("http://localhost:3000/proxy?url=https://www.google.com")
with urllib.request.urlopen(req) as response:
    headers = dict(response.getheaders())
    print("Received headers from proxy:")
    for key, value in headers.items():
        print(f"{key}: {value}")
