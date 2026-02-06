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
        possible_items = soup.find_all(['div', 'article', 'li'], class_=re.compile(r'(product|item|card|row|tile)'))

        print(f"تعداد المان احتمالی محصول: {len(possible_items)}")

        for item in possible_items:
            try:
                title_tag = item.find(['h2', 'h3', 'span'], class_=re.compile(r'(title|name|model)'))
                title = title_tag.get_text(strip=True) if title_tag else None

                if not title or 'تلویزیون' not in title:
                    continue

                # قیمت
                price_tag = item.find(string=re.compile(r'[\d,]+.*تومان|از.*تومان'))
                price = price_tag.strip() if price_tag else "نامشخص"

                # لینک
                link_tag = item.find('a')
                link = "https://torob.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else ""

                tv_data.append({
                    "title": title,
                    "brand": "نامشخص",
                    "size": "نامشخص",
                    "tech": "نامشخص",
                    "num_sellers": "نامشخص",
                    "avg_price_top5": price,
                    "link": link
                })

            except:
                continue

        if tv_data:
            print(f"موفقیت: {len(tv_data)} محصول استخراج شد")
        else:
            print("هیچ محصولی پیدا نشد")

except Exception as e:
    error_message = f"خطا در اجرا: {str(e)}"
    print(error_message)

# اگر چیزی پیدا نشد یا خطا داشت، حداقل یک ردیف بگذار
if not tv_data:
    tv_data = [{
        "title": "خطا در بروزرسانی",
        "brand": "-",
        "size": "-",
        "tech": "-",
        "num_sellers": "-",
        "avg_price_top5": "در حال حاضر در دسترس نیست",
        "link": "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
    }]

# همیشه فایل را ذخیره کن
with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print("فایل tv_prices.json ذخیره شد")
