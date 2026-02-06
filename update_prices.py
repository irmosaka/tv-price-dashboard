import requests
from bs4 import BeautifulSoup
import json
import re
import time

print("استخراج واقعی تلویزیون‌ها از ترب...")

url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price&size=50"  # افزایش به ۵۰

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
    "Referer": "https://torob.com/"
}

tv_data = []

try:
    response = requests.get(url, headers=headers, timeout=20)
    print(f"Status code: {response.status_code}")

    if response.status_code != 200:
        raise Exception("ترب پاسخ نداد")

    soup = BeautifulSoup(response.text, 'html.parser')

    # پیدا کردن همه عنوان‌ها (معمولاً h2 یا h3)
    titles = soup.find_all(['h2', 'h3'])

    print(f"تعداد عنوان‌های پیدا شده: {len(titles)}")

    for title_tag in titles:
        title = title_tag.get_text(strip=True)
        if not title or 'تلویزیون' not in title:
            continue  # فقط تلویزیون‌ها

        # قیمت بعدی (معمولاً متن بعد از h2)
        next_text = title_tag.find_next(string=True)
        price_match = re.search(r'(\d{1,3}(?:[.,]\d{3})*)\s*تومان', next_text or '')
        price = price_match.group(0) if price_match else "نامشخص"

        # لینک (a tag اطراف یا بعدی)
        link_tag = title_tag.find_parent('a') or title_tag.find('a')
        link = "https://torob.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else url

        # برند، سایز، تکنولوژی از عنوان
        brand_match = re.search(r'(سامسونگ|ال جی|سونی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس)', title)
        brand = brand_match.group(0) if brand_match else "نامشخص"

        size_match = re.search(r'(\d{2,3})\s*اینچ', title)
        size = size_match.group(1) + " اینچ" if size_match else "نامشخص"

        tech_match = re.search(r'(LED|OLED|QLED|NanoCell|MiniLED|UHD|4K|8K)', title)
        tech = tech_match.group(0) if tech_match else "نامشخص"

        # تعداد فروشندگان (تقریبی از متن)
        sellers_match = re.search(r'در \d+ فروشگاه', next_text or '')
        num_sellers = re.search(r'\d+', sellers_match.group(0)).group(0) if sellers_match else "نامشخص"

        tv_data.append({
            "title": title,
            "brand": brand,
            "size": size,
            "tech": tech,
            "num_sellers": num_sellers,
            "avg_price_top5": price,  # فعلاً min price، میانگین بعداً فیکس می‌کنیم
            "link": link
        })

        if len(tv_data) >= 50:
            break

        time.sleep(0.5)

    if not tv_data:
        raise Exception("هیچ محصولی پیدا نشد")

except Exception as e:
    print(f"خطا: {str(e)}")
    tv_data = [{"title": "خطا موقت - لطفاً دوباره Run کنید", "brand": "-", "size": "-", "tech": "-", "num_sellers": "-", "avg_price_top5": "-", "link": url}]

with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print(f"ذخیره شد: {len(tv_data)} محصول واقعی")
