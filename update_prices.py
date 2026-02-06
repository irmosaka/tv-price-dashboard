import requests
from bs4 import BeautifulSoup
import json
import re

print("تلاش برای استخراج قیمت تلویزیون‌ها...")

tv_data = []
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
    "Referer": "https://torob.com/"
}

base_url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price&size=30"

for page in range(1, 6):  # تا صفحه ۵ (حدود ۱۵۰ محصول)
    url = base_url + f"&page={page}" if page > 1 else base_url
    print(f"در حال پردازش صفحه {page}: {url}")

    try:
        response = requests.get(url, headers=headers, timeout=20)
        print(f"  وضعیت: {response.status_code}")

        if response.status_code != 200:
            print("  صفحه پاسخ نداد - ادامه به صفحه بعدی")
            continue

        soup = BeautifulSoup(response.text, 'html.parser')

        # المان‌های احتمالی کارت محصول (گسترش یافته)
        items = soup.find_all(['div', 'li', 'article'], class_=re.compile(r'(product|item|card|good|offer|row|tile|shop|list-item)'))

        print(f"  تعداد المان احتمالی: {len(items)}")

        for item in items:
            # عنوان
            title_tag = item.find(['h2', 'h3', 'div', 'span'], class_=re.compile(r'(title|name|model|product-name|good-title|text)'))
            title = title_tag.get_text(strip=True) if title_tag else ""
            if not title or 'تلویزیون' not in title.lower():
                continue

            # قیمت (قوی‌ترین regex ممکن)
            price = "نامشخص"
            price_texts = item.find_all(string=re.compile(r'\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?\s*(تومان|از|قیمت)', re.IGNORECASE))
            for txt in price_texts:
                txt = txt.strip()
                match = re.search(r'([\d,.]+)\s*(تومان|از)?', txt)
                if match:
                    raw_num = match.group(1).replace(',', '').replace('.', '')
                    try:
                        num = int(raw_num)
                        price = f"{num:,} تومان"
                        break
                    except:
                        pass

            # لینک (اولویت به href کامل یا نسبی)
            link = ""
            a_tag = item.find('a', href=True)
            if a_tag:
                href = a_tag['href'].strip()
                if href.startswith('http'):
                    link = href
                elif href.startswith('/'):
                    link = "https://torob.com" + href
                elif href:  # اگر فقط مسیر باشه
                    link = "https://torob.com" + href

            # تعداد فروشندگان (بهبود regex)
            num_sellers = "نامشخص"
            sellers_match = item.find(string=re.compile(r'(از|در)\s*(\d+)\s*(فروشگاه|فروشنده|فروشگاه‌های دیگر)'))
            if sellers_match:
                num = re.search(r'\d+', sellers_match)
                if num:
                    num_sellers = num.group(0)

            # برند، سایز، تکنولوژی از عنوان
            brand_match = re.search(r'(سامسونگ|ال جی|ال‌جی|سونی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس|tcl|hisense|lg|sony|samsung)', title, re.IGNORECASE)
            brand = brand_match.group(0) if brand_match else "نامشخص"

            size_match = re.search(r'(\d{2,3})\s*(اینچ|")', title, re.IGNORECASE)
            size = size_match.group(1) + " اینچ" if size_match else "نامشخص"

            tech_match = re.search(r'(oled|qled|led|nanocell|miniled|uhd|4k|8k)', title, re.IGNORECASE)
            tech = tech_match.group(0).upper() if tech_match else "نامشخص"

            tv_data.append({
                "title": title,
                "brand": brand,
                "size": size,
                "tech": tech,
                "num_sellers": num_sellers,
                "avg_price_top5": price,
                "link": link
            })

        if len(tv_data) >= 100:
            break  # محدودیت برای جلوگیری از timeout

    except Exception as e:
        print(f"  خطا در صفحه {page}: {str(e)}")
        continue

# اگر هیچی نبود، پیام بگذار
if not tv_data:
    tv_data = [{
        "title": "هیچ محصولی استخراج نشد - لطفاً دوباره Run کنید یا صفحه را چک کنید",
        "brand": "-",
        "size": "-",
        "tech": "-",
        "num_sellers": "-",
        "avg_price_top5": "-",
        "link": base_url
    }]

with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print(f"ذخیره شد: {len(tv_data)} محصول")
