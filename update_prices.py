import requests
import json

print("تلاش برای بروزرسانی قیمت تلویزیون‌ها از ترب...")

tv_data = []

try:
    url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
        "Referer": "https://torob.com/"
    }
    response = requests.get(url, headers=headers, timeout=15)
    print(f"Status code: {response.status_code}")

    if response.status_code == 200:
        print("صفحه لود شد، اما استخراج خودکار ممکن نیست (به دلیل لود جاوااسکریپت)")
        # اینجا می‌تونی داده نمونه یا قبلی نگه داری
        tv_data = [
            {
                "title": "نمونه - تلویزیون ال جی 65 اینچ OLED",
                "brand": "ال جی",
                "size": "65 اینچ",
                "tech": "OLED",
                "num_sellers": "نامشخص (خطا در استخراج)",
                "avg_price_top5": "نامشخص",
                "link": "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
            }
        ]
    else:
        print("ترب پاسخ نداد یا بلوک کرد")

except Exception as e:
    print(f"خطا: {str(e)}")

# همیشه فایل JSON رو بساز/بروزرسانی کن
if not tv_data:
    tv_data = [{
        "title": "خطا در بروزرسانی خودکار",
        "brand": "-",
        "size": "-",
        "tech": "-",
        "num_sellers": 0,
        "avg_price_top5": "در حال حاضر امکان استخراج خودکار وجود ندارد (ترب JS-heavy است)",
        "link": "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"
    }]

with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print("JSON ذخیره شد - workflow به پایان رسید")
