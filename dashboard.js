let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let displayedRows = 20;
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

function toPersianDigits(num) {
    if (num === '—' || num === null || num === undefined) return '—';
    return num.toLocaleString('fa-IR');
}

function extractSizeAndBrand(title) {
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    let brand = 'نامشخص';
    let tech = 'LED';

    const lower = title.toLowerCase().replace(/\s+/g, ' ');

    if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('کیو ال ای دی') || lower.includes('کیو-ال-ای-دی')) {
        tech = 'QLED';
    } else if (lower.includes('oled') || lower.includes('اولد') || lower.includes('اول-ای-دی')) {
        tech = 'OLED';
    } else if (lower.includes('ال ای دی') || lower.includes('الایدی') || lower.includes('led')) {
        tech = 'LED';
    }

    // استخراج برند
    const afterLed = title.split(/ال\s*ای\s*دی/i)[1];
    if (afterLed) {
        let cleaned = afterLed
            .replace(/^\s*هوشمند\s*/i, '')
            .split(/\s*(مدل|سایز|اینچ|اینج|$)/i)[0]
            .trim()
            .replace(/\s+/g, ' ');
        if (cleaned && cleaned.length > 1) brand = cleaned;
    }
    if (brand === 'نامشخص') {
        const words = title.split(/\s+/);
        for (let i = 0; i < words.length - 2; i++) {
            if (/ال\s*ای\s*دی/i.test(words[i] + ' ' + words[i+1])) {
                let nxt = words[i+2] || words[i+1];
                if (nxt && !/هوشمند|مدل|سایز/i.test(nxt)) {
                    brand = nxt;
                    break;
                }
            }
        }
    }
    brand = brand.replace(/هوشمند|ال\s*ای\s*دی/gi, '').replace(/\s+/g, ' ').trim();
    
    if (brand.includes('پاناسونیک')) brand = 'پاناسونیک';

    return { size, brand: brand || 'نامشخص', tech };
}

function loadData(raw, source = 'digikala') {
    let processed = [];

    if (source === 'torob') {
        processed = raw.map(item => {
            const title = item['ProductCard_desktop_product-name__JwqeK'] || 'نامشخص';
            const { size, brand, tech } = extractSizeAndBrand(title);

            // قیمت فروش
            let priceText = item['ProductCard_desktop_product-price-text__y20OV'] || '0';
            let price_num = parseInt(priceText.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

            // تعداد فروشنده
            let sellersText = item['ProductCard_desktop_shops__mbtsF'] || '0';
            let sellers = parseInt(sellersText.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

            const link = item['ProductCards_cards__MYvdn href'] || '#';

            return {
                name: title,
                brand,
                link,
                stock: '—',
                rating: '—',
                discount: '—',
                price_num,
                original_price_num: 0,
                sellers,
                size,
                tech
            };
        }).filter(d => d.price_num > 0 && d.brand !== 'ایلیا');
    } else {
        // دیجی‌کالا (کد قبلی)
        processed = raw.map(item => { /* همان کد قبلی */ });
    }

    currentData[source] = processed;
    localStorage.setItem(`daily_prices_${source}`, JSON.stringify(processed));
    updateUI();
}

// بقیه توابع (updateUI, renderTable, getFilteredData, sortTable, applyFilters, updateChart) همان قبلی هستند
// فقط renderTable رو کمی تغییر دادم تا برای torob ستون "قیمت اصلی" به "تعداد فروشنده" نمایش داده بشه

function renderTable(data, page = currentPage) {
    const tbody = document.querySelector('#product-table tbody');
    
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const visibleData = data.slice(start, end);

    tbody.innerHTML = visibleData.map(item => {
        const isTorob = currentTab === 'torob';
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.brand}</td>
                <td>${toPersianDigits(item.price_num)} تومان</td>
                <td>${isTorob ? toPersianDigits(item.sellers) + ' فروشنده' : toPersianDigits(item.original_price_num) + ' تومان'}</td>
                <td>${item.discount}</td>
                <td>${item.rating}</td>
                <td>${item.stock}</td>
                <td><a href="${item.link}" target="_blank">مشاهده</a></td>
            </tr>
        `;
    }).join('');

    // Pagination
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === page ? 'active' : '';
        btn.onclick = () => changePage(i);
        pagination.appendChild(btn);
    }
}

// بقیه کد (updateUI, getFilteredData, sortTable, applyFilters, updateChart, ایونت‌ها) همان نسخه قبلی است
// برای جلوگیری از طولانی شدن، فقط بخش‌های تغییر کرده رو بالا گذاشتم. اگر نیاز به کل فایل داری بگو تا کامل بفرستم.
