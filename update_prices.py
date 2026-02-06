import requests
from bs4 import BeautifulSoup
import json
import re

print("تلاش برای استخراج قیمت تلویزیون‌ها...")

tv_data = []
error_message = None

try:
    url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
        "Referer": "https://torob.com/"
    }

    print("ارسال درخواست به ترب...")
    response = requests.get(url, headers=headers, timeout=20)
    print(f"وضعیت پاسخ: {response.status_code}")

    if response.status_code != 200:
        error_message = f"ترب پاسخ نداد (کد {response.status_code})"
    else:
        soup = BeautifulSoup(response.text, 'html.parser')
        print("صفحه دریافت شد، شروع پارس...")

        # پیدا کردن همه المان‌های احتمالی محصول
        possible_items = soup.find_all(['div', 'article', 'li'], class_=re.compile(r'(product|item|card|row|tile|good|offer)'))

        print(f"تعداد المان احتمالی محصول: {len(possible_items)}")

        for item in possible_items:
            try:
                # عنوان
                title_tag = item.find(['h2', 'h3', 'span', 'div'], class_=re.compile(r'(title|name|model|product-name|good-title)'))
                title = title_tag.get_text(strip=True) if title_tag else None

                if not title or 'تلویزیون' not in title.lower():
                    continue

                # قیمت (جستجوی قوی‌تر)
                price = "نامشخص"
                price_candidates = item.find_all(string=re.compile(r'[\d,]+.*تومان|از.*تومان|قیمت.*تومان|\d{6,}', re.IGNORECASE))
                for p in price_candidates:
                    p_text = p.strip()
                    match = re.search(r'([\d,]+(?:\.\d+)?)\s*(تومان)?', p_text)
                    if match:
                        price = match.group(1).replace(',', '') + " تومان"
                        break

                # لینک
                link = ""
                link_tag = item.find('a', href=True)
                if link_tag:
                    href = link_tag['href']
                    if href.startswith('/'):
                        link = "https://torob.com" + href
                    elif href.startswith('http'):
                        link = href

                # برند، سایز، تکنولوژی (از عنوان)
                brand = "نامشخص"
                brand_match = re.search(r'(سامسونگ|ال جی|ال‌جی|سونی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس|tcl|hisense|lg|sony|samsung)', title, re.IGNORECASE)
                if brand_match:
                    brand = brand_match.group(0)

                size = "نامشخص"
                size_match = re.search(r'(\d{2,3})\s*(اینچ|")', title, re.IGNORECASE)
                if size_match:
                    size = size_match.group(1) + " اینچ"

                tech = "نامشخص"
                tech_match = re.search(r'(oled|qled|led|nanocell|miniled|uhd|4k|8k)', title, re.IGNORECASE)
                if tech_match:
                    tech = tech_match.group(0).upper()

                # تعداد فروشندگان (اگر در لیست اصلی باشد)
                num_sellers = "نامشخص"
                sellers_text = item.find(string=re.compile(r'(از|در)\s*\d+\s*(فروشگاه|فروشنده)'))
                if sellers_text:
                    num_match = re.search(r'\d+', sellers_text)
                    if num_match:
                        num_sellers = num_match.group(0)

                tv_data.append({
                    "title": title,
                    "brand": brand,
                    "size": size,
                    "tech": tech,
                    "num_sellers": num_sellers,
                    "avg_price_top5": price,   # فعلاً حداقل قیمت
                    "link": link
                })

            except:
                continue

        if tv_data:
            print(f"موفقیت: {len(tv_data)} محصول استخراج شد")
        else:
            print("هیچ محصولی پیدا نشد - احتمالاً ساختار صفحه تغییر کرده")

except Exception as e:
    error_message = f"خطا در اجرا: {str(e)}"
    print(error_message)

# اگر چیزی پیدا نشد، حداقل یک ردیف اطلاع‌رسانی بگذار
if not tv_data:
    tv_data = [{
        "title": "خطا در بروزرسانی - داده‌ای استخراج نشد",
        "brand": "-",
        "size": "-",
        "tech": "-",
        "num_sellers": "-",
        "avg_price_top5": "در حال حاضر امکان استخراج وجود ندارد",
        "link": "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
    }]

# همیشه ذخیره کن
with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print("فایل tv_prices.json ذخیره شد")
