from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

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

print("Finding Calculator app icon...")
calc_icon = wait.until(EC.presence_of_element_located((By.ID, "app_calculadora")))
print("Clicking on Calculator app icon...")
driver.execute_script("arguments[0].click();", calc_icon)

print("Checking for Calculator app view...")
calc_view = wait.until(EC.presence_of_element_located((By.ID, "app_view_calculadora")))
if calc_view:
    print("Calculator app view found successfully!")

    print("Clicking buttons to calculate 7 + 8...")
    # wait a bit for logic to be bound
    time.sleep(1)

    driver.execute_script("arguments[0].click();", wait.until(EC.presence_of_element_located((By.ID, "btn_7"))))
    driver.execute_script("arguments[0].click();", wait.until(EC.presence_of_element_located((By.ID, "btn_add"))))
    driver.execute_script("arguments[0].click();", wait.until(EC.presence_of_element_located((By.ID, "btn_8"))))
    driver.execute_script("arguments[0].click();", wait.until(EC.presence_of_element_located((By.ID, "btn_eq"))))

    time.sleep(0.5)

    screen = wait.until(EC.presence_of_element_located((By.ID, "texto_pantalla")))
    print(f"Result on screen: {screen.text}")
    print(f"Result HTML on screen: {screen.get_attribute('innerHTML')}")
    assert screen.text == "15" or screen.get_attribute('innerHTML') == "15", f"Calculator test failed! Expected '15', got '{screen.text}'"
    print("Calculation verified successfully.")
else:
    print("Calculator app view not found.")

driver.quit()
