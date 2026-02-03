const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

// اجازه دسترسی از مرورگر
app.use(cors());
app.use(express.json());

// تست سلامت سرور
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'سرور اسکرپر ترب فعال است',
        version: '1.0.0'
    });
});

// API اصلی برای اسکرپ ترب
app.post('/api/scrape-torob', async (req, res) => {
    try {
        const { searchQuery = 'تلویزیون', maxPages = 2 } = req.body;
        
        console.log(`🔍 در حال اسکرپ ترب برای: ${searchQuery}`);
        
        // در اینجا اسکرپر واقعی ترب را فراخوانی می‌کنیم
        // فعلاً از داده‌های نمونه استفاده می‌کنیم
        const products = await scrapeTorobSimulation(searchQuery, maxPages);
        
        res.json({
            success: true,
            query: searchQuery,
            total_products: products.length,
            data: products,
            timestamp: new Date().toLocaleString('fa-IR'),
            note: 'داده‌های واقعی بعداً فعال می‌شود'
        });
        
    } catch (error) {
        console.error('❌ خطا در اسکرپینگ:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// اسکرپر واقعی ترب (بعداً کامل می‌شود)
async function scrapeTorobReal(searchQuery) {
    // این تابع واقعی بعداً نوشته می‌شود
    throw new Error('اسکرپر واقعی هنوز کامل نشده');
}

// اسکرپر شبیه‌سازی شده برای تست
async function scrapeTorobSimulation(searchQuery, maxPages = 2) {
    console.log(`📊 شبیه‌سازی اسکرپ از ترب برای: ${searchQuery}`);
    
    // داده‌های نمونه بر اساس الگوریتم شما
    const products = [];
    const brands = ['سامسونگ', 'ال جی', 'سونی', 'TCL', 'شیائومی', 'هایسنس', 'پاناسونیک', 'توشیبا'];
    const sizes = [32, 43, 50, 55, 65, 75, 85];
    
    for (let i = 0; i < 40; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        // الگوریتم شما: میانگین قیمت ۵ فروشنده اول
        const sellerCount = Math.floor(Math.random() * 10) + 1; // 1-10 فروشنده
        const prices = [];
        
        // قیمت‌های ۵ فروشنده اول
        for (let j = 0; j < Math.min(5, sellerCount); j++) {
            const basePrice = size * 500000 + Math.random() * 10000000;
            const variation = Math.random() * 0.2 - 0.1; // ±10% تغییر
            prices.push(Math.round(basePrice * (1 + variation)));
        }
        
        // میانگین قیمت فروشندگان
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        
        // تخفیف تصادفی
        const discount = sellerCount > 3 ? Math.floor(Math.random() * 25) : 0;
        
        products.push({
            id: i + 1,
            name: `تلویزیون ${brand} ${size} اینچ`,
            brand: brand,
            size: size,
            technology: ['LED', 'QLED', 'OLED', '4K UHD'][Math.floor(Math.random() * 4)],
            price: avgPrice, // قیمت مرجع (میانگین ۵ فروشنده اول)
            discount: discount,
            rating: (Math.random() * 2 + 3).toFixed(1), // 3-5
            in_stock: true,
            source: 'torob',
            seller_count: sellerCount,
            price_range: {
                min: Math.min(...prices),
                max: Math.max(...prices),
                avg: avgPrice
            },
            top_sellers: Math.min(5, sellerCount),
            last_updated: new Date().toLocaleString('fa-IR')
        });
    }
    
    return products;
}

// شروع سرور
app.listen(PORT, () => {
    console.log(`🚀 سرور اسکرپر ترب روی پورت ${PORT} اجرا شد`);
    console.log(`🌐 آدرس: http://localhost:${PORT}`);
    console.log(`📊 API سلامت: http://localhost:${PORT}/api/health`);
    console.log(`🔍 API اسکرپ: http://localhost:${PORT}/api/scrape-torob`);
});
