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
    if 'تلویزیون' not in title:
        continue

    # قیمت: جستجو در متن‌های بعدی یا والد
    price = "نامشخص"
    current = title_tag
    for _ in range(5):  # ۵ المان بعدی چک کن
        current = current.find_next()
        if current and current.string:
            text = current.string.strip()
            if 'تومان' in text:
                price_match = re.search(r'([\d,]+(?:\.\d+)?)\s*تومان', text)
                if price_match:
                    price = price_match.group(0)
                    break

    # لینک
    link_tag = title_tag.find_parent('a') or title_tag.find('a')
    link = "https://torob.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else url

    # بقیه فیلدها مثل قبل (brand, size, tech)

    tv_data.append({
        "title": title,
        "brand": brand,
        "size": size,
        "tech": tech,
        "num_sellers": "نامشخص (در لیست اصلی نیست)",
        "avg_price_top5": price,  # فعلاً حداقل قیمت
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
