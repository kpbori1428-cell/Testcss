from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=1920,1080')

service = Service()
driver = webdriver.Chrome(options=options, service=service)

driver.get("http://localhost:8000")
time.sleep(2)

wait = WebDriverWait(driver, 10)

def click_element(by, value):
    elem = wait.until(EC.presence_of_element_located((by, value)))
    driver.execute_script("arguments[0].click();", elem)

# Test Navigation App
print("Opening Navigation app...")
click_element(By.ID, "app_navegador")
time.sleep(1)

print("Checking Navigation app view...")
try:
    nav_view = wait.until(EC.presence_of_element_located((By.ID, "app_view_navegador")))
    print("Navigation app view found successfully!")
except Exception as e:
    print("Failed to find Navigation app view:", e)

# Test Settings App
print("Opening Settings app...")
# Go home first
home_btn = driver.find_element(By.ID, "home_button")
if home_btn:
    print("Clicking Home button...")
    driver.execute_script("arguments[0].click();", home_btn)
    time.sleep(1)

click_element(By.ID, "app_ajustes")
time.sleep(1)

print("Checking Settings app view...")
try:
    settings_view = wait.until(EC.presence_of_element_located((By.ID, "app_view_ajustes")))
    print("Settings app view found successfully!")
except Exception as e:
    print("Failed to find Settings app view:", e)

driver.quit()
