import requests
import json
import time

# این یک روش ساده بدون لایبرری خارجی برای گرفتن جستجوی تلویزیون از API غیررسمی ترب
# (بر اساس ساختار واقعی API ترب در ۲۰۲۵-۲۰۲۶)

url = "https://torob.com/api/v4/search/?sort=price&size=50&query=%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    data_raw = response.json()

    results = data_raw.get('results', [])
    tv_data = []

    for item in results:
        title = item.get('name1', 'نامشخص')
        price_int = item.get('price', None)
        price_str = f"{price_int:,} تومان" if price_int else "نامشخص"
        link = "https://torob.com" + item.get('more_info_url', '') if item.get('more_info_url') else ""
        brand = item.get('shop_text', 'نامشخص').split()[0] if item.get('shop_text') else 'نامشخص'
        size = "نامشخص"
        if 'اینچ' in title:
            parts = title.split('اینچ')
            size = parts[0].strip().split()[-1] + " اینچ"

        tv_data.append({
            "title": title,
            "price": price_str,
            "brand": brand,
            "size": size,
            "link": link
        })

        time.sleep(0.5)  # کمی تأخیر برای جلوگیری از بلاک

    # ذخیره در فایل JSON
    with open('tv_prices.json', 'w', encoding='utf-8') as f:
        json.dump(tv_data, f, ensure_ascii=False, indent=4)

    print(f"ذخیره شد: {len(tv_data)} تلویزیون")

except Exception as e:
    print(f"خطا: {str(e)}")
    # اگر خطا داد، فایل خالی یا قبلی رو نگه می‌داره
