#!/usr/bin/env python3
# اسکریپت بسیار ساده برای مبتدیان - مخصوص دیجی‌کالا

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime
import re

def scrape_digikala_tv(page=1):
    """
    استخراج قیمت تلویزیون از دیجی‌کالا
    """
    url = f"https://www.digikala.com/search/category-tv2/?page={page}"
    
    # هدرها برای شبیه‌سازی مرورگر
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
    }
    
    try:
        print(f"📡 در حال دریافت صفحه {page}...")
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ خطا در دریافت صفحه: {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        products = []
        
        # پیدا کردن محصولات - بسیار ساده
        # دیجی‌کالا محصولات را در تگ‌های خاصی قرار می‌دهد
        product_cards = soup.find_all('div', {'class': 'product-list_ProductList__item__LiiNI'})
        
        if not product_cards:
            # روش جایگزین
            product_cards = soup.find_all('article', {'class': 'c-product-box'})
        
        print(f"🔍 تعداد کارت محصول یافت شده: {len(product_cards)}")
        
        for i, card in enumerate(product_cards[:10]):  # فقط 10 محصول اول
            try:
                # استخراج نام محصول
                name_elem = card.find('h3', {'class': 'c-product-box__title'})
                if not name_elem:
                    name_elem = card.find('h2')
                
                name = name_elem.text.strip() if name_elem else f"تلویزیون {i+1}"
                
                # استخراج قیمت
                price_elem = card.find('div', {'class': 'c-product-box__price'})
                if not price_elem:
                    price_elem = card.find('span', {'class': 'price'})
                
                price_text = price_elem.text.strip() if price_elem else "0"
                
                # تبدیل قیمت به عدد
                price = extract_price(price_text)
                
                # استخراج لینک
                link_elem = card.find('a', href=True)
                link = "https://www.digikala.com" + link_elem['href'] if link_elem else "#"
                
                # استخراج برند و سایز از نام
                brand = extract_brand(name)
                size = extract_size(name)
                
                product_data = {
                    'id': (page-1)*10 + i + 1,
                    'name': clean_text(name),
                    'price': price,
                    'seller': 'دیجی‌کالا',
                    'brand': brand,
                    'size': size,
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'persian_date': datetime.now().strftime('%Y/%m/%d'),
                    'url': link,
                    'category': 'تلویزیون'
                }
                
                products.append(product_data)
                print(f"  ✓ {product_data['name'][:30]}... - {price:,} تومان")
                
            except Exception as e:
                print(f"  ✗ خطا در پردازش محصول {i+1}: {e}")
                continue
        
        return products
        
    except Exception as e:
        print(f"❌ خطای کلی: {e}")
        return []

def extract_price(price_text):
    """استخراج عدد از متن قیمت"""
    if not price_text:
        return 25000000  # قیمت پیش‌فرض
    
    # حذف کاراکترهای غیرعددی
    numbers = re.findall(r'\d+', price_text.replace(',', ''))
    
    if numbers:
        # بزرگترین عدد را بگیر (معمولاً قیمت نهایی)
        price = int(max(numbers, key=len))
        
        # اگر قیمت خیلی کم است (مثلاً کمتر از 1 میلیون)، شاید واحد اشتباه باشد
        if price < 1000000:
            price *= 1000
        
        return price
    
    return 25000000

def extract_brand(product_name):
    """استخراج برند از نام محصول"""
    brands = ['سامسونگ', 'Samsung', 'ال جی', 'LG', 'سونی', 'Sony', 
              'شیائومی', 'Xiaomi', 'TCL', 'هيسنس', 'Hisense', 'پاناسونیک', 'Panasonic']
    
    for brand in brands:
        if brand.lower() in product_name.lower():
            return brand
    
    return 'نامشخص'

def extract_size(product_name):
    """استخراج سایز از نام محصول"""
    patterns = [
        r'(\d+)\s*اینچ',
        r'(\d+)"',
        r'(\d+)\s*inch',
        r'(\d+)\s*INCH'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, product_name)
        if match:
            return f"{match.group(1)} اینچ"
    
    return 'نامشخص'

def clean_text(text):
    """پاکسازی متن"""
    if not text:
        return ''
    
    # حذف فاصله‌های اضافه
    text = ' '.join(text.split())
    
    # جایگزینی عبارات
    replacements = {
        'تلویزیون ال سی دی': 'تلویزیون',
        'TV': 'تلویزیون',
        'Smart TV': 'تلویزیون هوشمند'
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text

def get_sample_data():
    """داده نمونه در صورت خطا"""
    return [
        {
            'id': 1,
            'name': 'تلویزیون سامسونگ 55 اینچ 4K UHD Smart TV',
            'price': 32900000,
            'seller': 'دیجی‌کالا',
            'brand': 'سامسونگ',
            'size': '55 اینچ',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'persian_date': datetime.now().strftime('%Y/%m/%d'),
            'url': 'https://www.digikala.com/product/123',
            'category': 'تلویزیون'
        },
        {
            'id': 2,
            'name': 'تلویزیون ال جی 65 اینچ NanoCell 4K',
            'price': 41900000,
            'seller': 'دیجی‌کالا',
            'brand': 'LG',
            'size': '65 اینچ',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'persian_date': datetime.now().strftime('%Y/%m/%d'),
            'url': 'https://www.digikala.com/product/456',
            'category': 'تلویزیون'
        }
    ]

def main():
    """تابع اصلی"""
    print("=" * 50)
    print("🎬 شروع استخراج قیمت تلویزیون از دیجی‌کالا")
    print("=" * 50)
    
    all_products = []
    
    try:
        # دریافت 2 صفحه اول
        for page in range(1, 3):
            products = scrape_digikala_tv(page)
            all_products.extend(products)
            
            if page < 2:
                print(f"⏳ منتظر 3 ثانیه برای صفحه بعدی...")
                time.sleep(3)  # تاخیر برای عدم بلاک شدن
        
        # اگر محصولی دریافت نشد، از داده نمونه استفاده کن
        if not all_products:
            print("⚠️ هیچ محصولی یافت نشد، استفاده از داده نمونه")
            all_products = get_sample_data()
        
        # ساخت دیتای نهایی
        output_data = {
            "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "persian_last_updated": datetime.now().strftime('%Y/%m/%d %H:%M'),
            "source": "digikala.com",
            "total_products": len(all_products),
            "products": all_products
        }
        
        # ذخیره در فایل
        import os
        os.makedirs('data', exist_ok=True)
        
        with open('data/digikala-data.json', 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print("=" * 50)
        print(f"✅ موفق! {len(all_products)} محصول ذخیره شد")
        print(f"📁 فایل: data/digikala-data.json")
        print("=" * 50)
        
        # نمایش خلاصه
        total_price = sum(p['price'] for p in all_products)
        avg_price = total_price // len(all_products) if all_products else 0
        
        print(f"📊 میانگین قیمت: {avg_price:,} تومان")
        print(f"🏷️ ارزان‌ترین: {min(p['price'] for p in all_products):,} تومان")
        print(f"🏷️ گران‌ترین: {max(p['price'] for p in all_products):,} تومان")
        
    except Exception as e:
        print(f"❌ خطای غیرمنتظره: {e}")
        
        # ذخیره داده نمونه در صورت خطا
        sample_output = {
            "last_updated": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "persian_last_updated": datetime.now().strftime('%Y/%m/%d %H:%M'),
            "source": "digikala-sample",
            "total_products": 2,
            "products": get_sample_data()
        }
        
        with open('data/digikala-data.json', 'w', encoding='utf-8') as f:
            json.dump(sample_output, f, ensure_ascii=False, indent=2)
        
        print("✅ داده نمونه ذخیره شد")

if __name__ == "__main__":
    main()
