#!/usr/bin/env python3
# scripts/scraper.py - نسخه سازگار با GitHub Actions

import os
import json
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

def setup_driver():
    """تنظیمات درایور برای GitHub Actions"""
    from selenium.webdriver.chrome.options import Options
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # بدون نمایش گرافیکی
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # استفاده از Chrome خود GitHub Actions
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def search_torob_prices(product_name):
    """جستجوی قیمت یک محصول"""
    driver = setup_driver()
    
    try:
        # جستجو در گوگل
        driver.get("https://www.google.com")
        search_box = driver.find_element(By.NAME, "q")
        
        # تایپ آرام (شبیه انسان)
        for char in f"{product_name} site:torob.com":
            search_box.send_keys(char)
            time.sleep(0.05)
        
        search_box.send_keys(Keys.RETURN)
        time.sleep(2)
        
        # پیدا کردن لینک ترب
        torob_links = driver.find_elements(By.XPATH, "//a[contains(@href, 'torob.com')]")
        
        if torob_links:
            torob_links[0].click()
            time.sleep(3)
            
            # استخراج داده‌ها (با توجه به ساختار سایت ترب)
            product_data = {
                'name': product_name,
                'price': None,
                'seller': 'ترب',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'url': driver.current_url
            }
            
            # تلاش برای پیدا کردن قیمت
            try:
                # چندین روش برای پیدا کردن قیمت
                price_selectors = [
                    "//span[contains(@class, 'price')]",
                    "//div[contains(@class, 'price')]",
                    "//span[contains(text(), 'تومان')]",
                    "//*[contains(text(), 'تومان')]"
                ]
                
                for selector in price_selectors:
                    try:
                        price_elements = driver.find_elements(By.XPATH, selector)
                        if price_elements:
                            price_text = price_elements[0].text
                            # استخراج عدد از متن
                            import re
                            numbers = re.findall(r'\d[\d,]*', price_text)
                            if numbers:
                                price = int(numbers[0].replace(',', ''))
                                product_data['price'] = price
                                break
                    except:
                        continue
                        
            except Exception as e:
                print(f"خطا در استخراج قیمت: {e}")
            
            return product_data
            
    except Exception as e:
        print(f"خطا برای محصول {product_name}: {e}")
        return None
        
    finally:
        driver.quit()
    
    return None

def main():
    """تابع اصلی"""
    print("شروع استخراج داده از ترب...")
    
    # خواندن لیست محصولات
    products = []
    try:
        with open('data/products.txt', 'r', encoding='utf-8') as f:
            products = [line.strip() for line in f if line.strip()]
    except:
        # لیست پیش‌فرض
        products = [
            "تلویزیون سامسونگ 55 اینچ",
            "تلویزیون ال جی 65 اینچ", 
            "تلویزیون سونی 50 اینچ",
            "تلویزیون شیائومی 43 اینچ"
        ]
    
    # استخراج داده برای هر محصول
    results = []
    for product in products:
        print(f"در حال استخراج: {product}")
        data = search_torob_prices(product)
        if data:
            results.append(data)
        time.sleep(2)  # تاخیر بین درخواست‌ها
    
    # ساخت دیتای نهایی
    output_data = {
        "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "products": results
    }
    
    # ذخیره در فایل
    os.makedirs('data', exist_ok=True)
    with open('data/torob-data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"تعداد محصولات استخراج شده: {len(results)}")
    print("ذخیره در data/torob-data.json")

if __name__ == "__main__":
    main()
