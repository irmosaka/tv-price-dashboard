const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// API Scraping
app.post('/api/scrape-real', async (req, res) => {
    try {
        const { store = 'digikala', category = 'tv', pages = 1, delay = 1000 } = req.body;
        
        // در اینجا کد اسکرپر واقعی قرار می‌گیرد
        // برای مثال، یک نمونه ساده:
        const sampleData = [];
        
        // شبیه‌سازی اسکرپینگ
        for (let i = 0; i < 30; i++) {
            sampleData.push({
                title: `تلویزیون سامسونگ QLED ${55 + i % 20} اینچ`,
                brand: ['Samsung', 'LG', 'Sony'][i % 3],
                size: 43 + (i % 5) * 8,
                price: 15000000 + Math.random() * 30000000,
                originalPrice: 20000000 + Math.random() * 30000000,
                discount: Math.floor(Math.random() * 40),
                rating: (Math.random() * 2 + 3).toFixed(1),
                url: `https://www.digikala.com/product/${i}`
            });
        }
        
        res.json({
            success: true,
            store,
            total: sampleData.length,
            data: sampleData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ سرور بک‌اند روی پورت ${PORT} اجرا شد`);
    console.log(`🌐 آدرس: http://localhost:${PORT}`);
});
