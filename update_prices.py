import requests
from bs4 import BeautifulSoup
import json
import re
import time

print("استخراج قیمت تلویزیون‌ها از ترب...")

tv_data = []
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Accept-Language": "fa-IR,fa;q=0.9"
}

# URL پایه با sort=-price
base_url = "https://torob.com/browse/246/%D8%AA%D9%84%D9%88%DB%8C%D8%B2%DB%8C%D9%88%D9%86-tv/?sort=-price"

# گرفتن صفحه اول
response = requests.get(base_url, headers=headers)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    products = soup.find_all('div', class_='product-item')[:40]  # تا ۴۰ تا

    for product in products:
        try:
            title_tag = product.find('h2') or product.find('h3') or product.find(class_='product-title')
            title = title_tag.text.strip() if title_tag else "نامشخص"

            price_tag = product.find(class_='product-price') or product.find(string=re.compile(r'تومان'))
            price = price_tag.text.strip() if price_tag else "نامشخص"

            link_tag = product.find('a')
            link = "https://torob.com" + link_tag['href'] if link_tag and 'href' in link_tag.attrs else ""

            # برند و سایز و تکنولوژی از عنوان
            brand = re.search(r'(سامسونگ|سونی|ال جی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس)', title).group(0) if re.search(r'(سامسونگ|سونی|ال جی|جی پلاس|دوو|اسنوا|ایکس ویژن|تی سی ال|هایسنس)', title) else "نامشخص"
            size = re.search(r'(\d{2,3})\s*اینچ', title).group(1) + " اینچ" if re.search(r'(\d{2,3})\s*اینچ', title) else "نامشخص"
            tech = re.search(r'(LED|OLED|QLED|NanoCell|MiniLED|UHD|4K|8K)', title).group(0) if re.search(r'(LED|OLED|QLED|NanoCell|MiniLED|UHD|4K|8K)', title) else "نامشخص"

            # تعداد فروشندگان و میانگین قیمت از صفحه جزئیات (فقط برای ۱۵ اول)
            if len(tv_data) < 15:
                detail_resp = requests.get(link, headers=headers)
                if detail_resp.status_code == 200:
                    detail_soup = BeautifulSoup(detail_resp.text, 'html.parser')
                    sellers_text = detail_soup.find(string=re.compile(r'از \d+ فروشگاه'))
                    num_sellers = int(re.search(r'\d+', sellers_text).group()) if sellers_text else 0

                    # ۵ قیمت اول بدون آگهی
                    prices = []
                    seller_rows = detail_soup.find_all('div', class_='seller-row')[:5]
                    for row in seller_rows:
                        if 'ad' not in row.get('class', []):
                            p_tag = row.find(class_='price')
                            if p_tag:
                                p_clean = int(re.sub(r'[^\d]', '', p_tag.text))
                                prices.append(p_clean)
                    avg_price = sum(prices) / len(prices) if prices else 0
                    avg_str = f"{int(avg_price):,} تومان" if avg_price else "نامشخص"
                else:
                    num_sellers = 0
                    avg_str = "نامشخص"
            else:
                num_sellers = "نامشخص (برای سرعت)"
                avg_str = "نامشخص (برای سرعت)"

            tv_data.append({
                "title": title,
                "price": price,
                "brand": brand,
                "size": size,
                "tech": tech,
                "num_sellers": num_sellers,
                "avg_price_top5": avg_str,
                "link": link
            })

            time.sleep(1.5)  # تأخیر

        except Exception as e:
            print(f"خطا: {e}")
            continue

    # اگر pagination نیاز بود، صفحه دوم اضافه کن (برای بیشتر از ۴۰)
    next_link = soup.find('a', rel='next')
    if next_link and len(tv_data) < 80:
        page2_url = "https://torob.com" + next_link['href']
        response2 = requests.get(page2_url, headers=headers)
        if response2.status_code == 200:
            soup2 = BeautifulSoup(response2.text, 'html.parser')
            products2 = soup2.find_all('div', class_='product-item')[:40]
            # تکرار استخراج برای محصولات صفحه دوم (شبیه بالا، اما کوتاه برای اختصار)

# ذخیره همیشه
with open('tv_prices.json', 'w', encoding='utf-8') as f:
    json.dump(tv_data, f, ensure_ascii=False, indent=4)

print(f"ذخیره شد: {len(tv_data)} محصول")
