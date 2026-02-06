import requests
from bs4 import BeautifulSoup
import json
import re
import time
import sys

print("شروع استخراج قیمت تلویزیون‌ها از ترب...")

# URL دسته‌بندی تلویزیون‌ها (مرتب بر اساس قیمت)
category_url = "https://torob.com/browse/94/tv/?sort=price&size=20"  # ۲۰ محصول اول

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://torob.com/"
}

tv_data = []

try:
    # گرفتن لیست محصولات از صفحه دسته‌بندی
    response = requests.get(category_url, headers=headers, timeout=20)
    if response.status_code != 200:
        print(f"خطا در دسته‌بندی: {response.status_code}")
        sys.exit(1)

    soup = BeautifulSoup(response.text, 'html.parser')
    products = soup.find_all('div', attrs={'data-test': 'product-card'})[:15]  # حداکثر ۱۵ تا برای سرعت

    print(f"تعداد محصولات پیدا شده: {len(products)}")

    for product in products:
        try:
            # استخراج از لیست
            title_tag = product.find('span', class_=re.compile(r'(title|name)'))
            title = title_tag.text.strip() if title_tag else "نامشخص"

            link_tag = product.find('a')
            link = "https://torob.com" + link_tag['href'] if link_tag else ""

            # برند از عنوان (مثل سامسونگ، ال جی)
            brand_match = re.search(r'(سامسونگ|ال جی|سونی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس)', title)
            brand = brand_match.group(0) if brand_match else "نامشخص"

            # سایز (مثل 55 اینچ)
            size_match = re.search(r'(\d{2})\s*اینچ', title)
            size = size_match.group(1) + " اینچ" if size_match else "نامشخص"

            # تکنولوژی (از عنوان مثل LED, OLED, QLED)
            tech_match = re.search(r'(LED|OLED|QLED|NanoCell|MiniLED|UHD|4K|8K)', title)
            tech = tech_match.group(0) if tech_match else "نامشخص"

            # حالا رفتن به صفحه جزئیات برای تعداد فروشندگان و میانگین قیمت
            detail_response = requests.get(link, headers=headers, timeout=20)
            if detail_response.status_code != 200:
                print(f"خطا در جزئیات {title}: {detail_response.status_code}")
                num_sellers = 0
                avg_price = "نامشخص"
            else:
                detail_soup = BeautifulSoup(detail_response.text, 'html.parser')

                # تعداد فروشندگان (معمولاً در span یا div با متن "از X فروشگاه")
                sellers_tag = detail_soup.find(string=re.compile(r'از \d+ فروشگاه'))
                num_sellers = int(re.search(r'\d+', sellers_tag).group(0)) if sellers_tag else 0

                # لیست فروشندگان (بدون آگهی)
                seller_rows = detail_soup.find_all('div', class_=re.compile(r'(seller|store)-row(?!-ad)'))[:5]  # ۵ اول بدون ad کلاس
                prices = []
                for row in seller_rows:
                    price_tag = row.find('span', class_=re.compile(r'price|cost'))
                    if price_tag:
                        price_clean = int(re.sub(r'[^\d]', '', price_tag.text.strip()))
                        prices.append(price_clean)

                avg_price = sum(prices) / len(prices) if prices else 0
                avg_price_str = f"{int(avg_price):,} تومان" if avg_price else "نامشخص"

            tv_data.append({
                "title": title,
                "brand": brand,
                "size": size,
                "tech": tech,
                "num_sellers": num_sellers,
                "avg_price_top5": avg_price_str,
                "link": link
            })

            time.sleep(2)  # تأخیر برای جلوگیری از بلوک

        except Exception as e:
            print(f"خطا در محصول: {e}")
            continue

    if tv_data:
        with open('tv_prices.json', 'w', encoding='utf-8') as f:
            json.dump(tv_data, f, ensure_ascii=False, indent=4)
        print(f"ذخیره شد: {len(tv_data)} محصول")
    else:
        sys.exit(1)

except Exception as e:
    print(f"خطای کلی: {e}")
    sys.exit(1)
