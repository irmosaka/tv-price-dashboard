const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// لیست URL‌های دیجی‌کالا برای تلویزیون
const DIGIKALA_URLS = {
  samsung: 'https://www.digikala.com/search/category-tv-video-audio/tv/',
  lg: 'https://www.digikala.com/search/category-tv-video-audio/tv/brands/lg/',
  sony: 'https://www.digikala.com/search/category-tv-video-audio/tv/brands/sony/',
  all: 'https://www.digikala.com/search/category-tv-video-audio/tv/'
};

// API برای اسکرپینگ
app.get('/api/scrape', async (req, res) => {
  try {
    const { brand = 'all', page = 1 } = req.query;
    
    console.log(`در حال اسکرپینگ برند: ${brand}, صفحه: ${page}`);
    
    // در مرحله اول، داده‌های نمونه برمی‌گردونیم
    // بعداً می‌تونی اسکرپر واقعی رو اضافه کنی
    const sampleData = generateSampleData(brand);
    
    res.json({
      success: true,
      brand,
      page,
      total: sampleData.length,
      data: sampleData,
      lastUpdated: new Date().toLocaleString('fa-IR')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API برای اسکرپینگ واقعی (احتیاط: ممکنه دیجی‌کالا بلاک کنه)
app.get('/api/scrape-real', async (req, res) => {
  try {
    const { brand = 'all' } = req.query;
    const url = DIGIKALA_URLS[brand] || DIGIKALA_URLS.all;
    
    // درخواست به دیجی‌کالا
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const products = [];
    
    // استخراج محصولات (باید با ساختار سایت تطبیق بدی)
    $('.product-list_ProductList__item__LiiNI').each((i, element) => {
      const title = $(element).find('.d-flex.ai-start.jc-start .ellipsis-2').text().trim();
      const priceText = $(element).find('.d-flex.ai-center.jc-end .mr-1').text().trim();
      const price = parseInt(priceText.replace(/,/g, '')) || 0;
      
      if (title && price > 0) {
        // استخراج برند و اندازه از عنوان
        const brandMatch = title.match(/(سامسونگ|Samsung|LG|ال جی|Sony|سونی|TCL|شیائومی|Xiaomi)/i);
        const sizeMatch = title.match(/(\d+)\s*(اینچ|inch|″)/i);
        
        products.push({
          id: i + 1,
          title,
          brand: brandMatch ? brandMatch[1] : 'نامشخص',
          size: sizeMatch ? parseInt(sizeMatch[1]) : null,
          price,
          originalPrice: price * 1.1, // قیمت اصلی (نمونه)
          discount: Math.floor(Math.random() * 30), // تخفیف تصادفی
          rating: (Math.random() * 2 + 3).toFixed(1), // امتیاز ۳-۵
          url: `https://www.digikala.com${$(element).find('a').attr('href')}`
        });
      }
    });
    
    res.json({
      success: true,
      brand,
      total: products.length,
      data: products.slice(0, 20), // فقط ۲۰ آیتم اول
      lastUpdated: new Date().toLocaleString('fa-IR')
    });
    
  } catch (error) {
    console.error('خطا در اسکرپینگ:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت داده از دیجی‌کالا'
    });
  }
});

// داده‌های نمونه برای توسعه
function generateSampleData(brand) {
  const brands = brand === 'all' ? ['Samsung', 'LG', 'Sony', 'TCL', 'Xiaomi'] : [brand];
  const data = [];
  
  let id = 1;
  brands.forEach(brandName => {
    for (let i = 0; i < 8; i++) {
      const basePrice = brandName === 'Samsung' ? 25000000 : 
                       brandName === 'LG' ? 22000000 : 
                       brandName === 'Sony' ? 30000000 : 
                       brandName === 'TCL' ? 15000000 : 12000000;
      
      data.push({
        id: id++,
        brand: brandName,
        model: `${brandName} ${['QN90A', 'C1', 'A80J', 'C825', 'Mi TV 6', 'AU8000', 'NanoCell', 'UHD'][i % 8]}`,
        size: [43, 50, 55, 65, 75, 55, 50, 65][i % 8],
        price: Math.round(basePrice * (0.8 + Math.random() * 0.4)),
        originalPrice: Math.round(basePrice * (1 + Math.random() * 0.2)),
        discount: Math.floor(Math.random() * 40),
        rating: (Math.random() * 2 + 3).toFixed(1),
        status: Math.random() > 0.3 ? 'موجود' : 'ناموجود',
        digikalaUrl: `https://www.digikala.com/product/${id}`
      });
    }
  });
  
  return data;
}

app.listen(PORT, () => {
  console.log(`سرور API روی پورت ${PORT} اجرا شد`);
  console.log(`آدرس: http://localhost:${PORT}/api/scrape`);
});
