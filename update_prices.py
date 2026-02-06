import requests
from bs4 import BeautifulSoup
import json
import re
import sys

print("شروع اسکرپینگ صفحه تلویزیون ترب...")

url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=price"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://torob.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

try:
    response = requests.get(url, headers=headers, timeout=20)
    print(f"کد وضعیت: {response.status_code}")

    if response.status_code != 200:
        print(f"خطا: وضعیت {response.status_code} - ممکن است بلوک شده یا صفحه تغییر کرده")
        print("بخشی از پاسخ:", response.text[:300])
        sys.exit(1)

    soup = BeautifulSoup(response.text, 'html.parser')

    # پیدا کردن کارت‌های محصول - کلاس‌های رایج ترب در ۲۰۲۶
    product_cards = soup.find_all('div', attrs={'data-test': 'product-card'})  # اصلی‌ترین selector

    if not product_cards:
        # fallback selector اگر data-test تغییر کرده
        product_cards = soup.find_all('div', class_=re.compile(r'(product|item|card)'))[:20]
        print("از fallback selector استفاده شد")

    print(f"تعداد کارت‌های پیدا شده: {len(product_cards)}")

    tv_data = []

    for card in product_cards:
        try:
            # عنوان
            title_tag = card.find('span', class_=re.compile(r'(title|name)')) or card.find('h2') or card.find('a')
            title = title_tag.get_text(strip=True) if title_tag else "نامشخص"

            # قیمت
            price_tag = card.find('span', class_=re.compile(r'(price|cost|value)')) or card.find(string=re.compile(r'تومان|،'))
            price_text = price_tag.get_text(strip=True) if price_tag else "نامشخص"
            price_clean = re.sub(r'[^\d]', '', price_text) if price_text != "نامشخص" else "نامشخص"

            # لینک
            link_tag = card.find('a')
            link = "https://torob.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else ""

            # برند و سایز تقریبی از عنوان
            brand = "نامشخص"
            size = "نامشخص"
            if "سامسونگ" in title or "Sony" in title or "ال جی" in title:
                brand = title.split()[0]
            if 'اینچ' in title:
                size_match = re.search(r'(\d{2,3})\s*اینچ', title)
                size = size_match.group(1) + " اینچ" if size_match else "نامشخص"

            tv_data.append({
                "title": title,
                "price": f"{price_clean} تومان" if price_clean != "نامشخص" else "نامشخص",
                "brand": brand,
                "size": size,
                "link": link
            })

        except Exception as inner_e:
            print(f"خطا در یک محصول: {inner_e}")
            continue

    if tv_data:
        with open('tv_prices.json', 'w', encoding='utf-8') as f:
            json.dump(tv_data, f, ensure_ascii=False, indent=4)
        print(f"ذخیره شد: {len(tv_data)} محصول")
    else:
        print("هیچ محصولی پیدا نشد - احتمال تغییر ساختار صفحه")
        sys.exit(1)

except Exception as e:
    print(f"خطای کلی: {str(e)}")
    sys.exit(1)
