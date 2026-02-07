import streamlit as st
import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_tv_prices():
    url = 'https://www.digikala.com/search/category-tv2/'  
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    tvs = []
    for item in soup.find_all('div', class_='c-product-box'):  # کلاس رو بر اساس inspect سایت تنظیم کن
        name_tag = item.find('h3', class_='c-product-box__title')
        name = name_tag.text.strip() if name_tag else 'نامعلوم'
        
        price_tag = item.find('span', class_='c-price__value')
        price_str = price_tag.text.strip().replace(',', '').replace('تومان', '') if price_tag else '0'
        price = int(price_str) if price_str.isdigit() else 0
        
        link_tag = item.find('a', class_='c-product-box__img-link')
        link = 'https://www.digikala.com' + link_tag['href'] if link_tag else ''
        
        sellers_tag = item.find_all('div', class_='c-seller')  # کلاس فروشنده‌ها
        sellers = len(sellers_tag)
        
        tvs.append({'name': name, 'price': price, 'link': link, 'sellers': sellers})
    
    df = pd.DataFrame(tvs)
    avg_price = df['price'].mean()
    total_sellers = df['sellers'].sum()
    return df, avg_price, total_sellers

st.title("داشبورد حرفه‌ای قیمت تلویزیون‌ها")

if st.button("جمع‌آوری داده‌ها"):
    with st.spinner("در حال جمع‌آوری..."):
        df, avg_price, total_sellers = scrape_tv_prices()
        st.session_state['df'] = df
        st.session_state['avg_price'] = avg_price
        st.session_state['total_sellers'] = total_sellers

if 'df' in st.session_state:
    df = st.session_state['df']
    avg_price = st.session_state['avg_price']
    total_sellers = st.session_state['total_sellers']
    
    col1, col2, col3 = st.columns(3)
    col1.metric("تعداد تلویزیون‌ها", len(df))
    col2.metric("قیمت میانگین", f"{avg_price:,.0f} تومان")
    col3.metric("تعداد فروشنده‌ها کل", total_sellers)
    
    min_price = st.slider("حداقل قیمت", min_value=0, max_value=int(df['price'].max()), value=0)
    filtered_df = df[df['price'] >= min_price]
    
    st.dataframe(filtered_df.style.format({'link': lambda x: f'<a href="{x}" target="_blank">لینک</a>'}), unsafe_allow_html=True)
    
    st.subheader("نمودار قیمت‌ها")
    st.bar_chart(filtered_df.set_index('name')['price'])
