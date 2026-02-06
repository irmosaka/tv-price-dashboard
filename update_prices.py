import requests
import json
import time
import sys

url = "https://torob.com/api/v4/search/?sort=price&size=50&query=%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://torob.com/browse/94/tv/",
    "Origin": "https://torob.com",
    "Connection": "keep-alive"
}

print("در حال ارسال درخواست به API ترب...")

try:
    response = requests.get(url, headers=headers, timeout=20)
    print(f"وضعیت پاسخ: {response.status_code}")
    print(f"هدرهای پاسخ: {response.headers}")

    if response.status_code != 200:
        print(f"خطا در درخواست: {response.text[:500]}")  # چاپ بخشی از پاسخ برای دیباگ
        sys.exit(1)

    data_raw = response.json()
    print("JSON دریافت شد. کلیدهای اصلی:", list(data_raw.keys()))

    results = data_raw.get('results', []) or data_raw.get('items', []) or data_raw.get('data', [])
    tv_data = []

    for item in results[:50]:  # حداکثر ۵۰ تا
        title = item.get('name1') or item.get('name') or 'نامشخص'
        price_int = item.get('price') or item.get('min_price') or None
        price_str = f"{int(price_int):,} تومان" if price_int else "نامشخص"
        link_base = item.get('more_info_url') or item.get('url') or ''
        link = f"https://torob.com{link_base}" if link_base else ""
        brand = item.get('shop_text', 'نامشخص').split()[0] if item.get('shop_text') else 'نامشخص'
        size = "نامشخص"
        if 'اینچ' in title:
            parts = title.split('اینچ')
            size = parts[0].strip().split()[-1] + " اینچ" if parts[0].strip().split() else "نامشخص"

        tv_data.append({
            "title": title,
            "price": price_str,
            "brand": brand,
            "size": size,
            "link": link
        })

        time.sleep(1)  # تأخیر بیشتر برای جلوگیری از بلاک

    with open('tv_prices.json', 'w', encoding='utf-8') as f:
        json.dump(tv_data, f, ensure_ascii=False, indent=4)

    print(f"ذخیره شد: {len(tv_data)} محصول")

except requests.exceptions.RequestException as e:
    print(f"خطای شبکه/درخواست: {str(e)}")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"خطا در پارس JSON: {str(e)} - پاسخ خام: {response.text[:500]}")
    sys.exit(1)
except Exception as e:
    print(f"خطای غیرمنتظره: {str(e)}")
    sys.exit(1)
