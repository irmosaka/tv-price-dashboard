let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

function toPersianDigits(num) {
    if (num === '—' || num === null || num === undefined) return '—';
    return num.toLocaleString('fa-IR');
}

function extractSizeAndBrand(title) {
    // کاملاً امن: title هر چی باشه، string خالی می‌سازیم
    title = String(title || '').trim();

    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    let brand = 'نامشخص';
    let tech = 'LED';

    if (!title) return { size, brand, tech };

    const lower = title.toLowerCase().replace(/\s+/g, ' ');

    if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('کیو ال ای دی') ||
        lower.includes('کیو-ال-ای-دی') || lower.includes('q led')) {
        tech = 'QLED';
    } else if (lower.includes('oled') || lower.includes('اولد') || lower.includes('اول-ای-دی')) {
        tech = 'OLED';
    } else if (lower.includes('ال ای دی') || lower.includes('الایدی') || lower.includes('led')) {
        tech = 'LED';
    }

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
        processed = raw.map((item, index) => {
            // ایمنی: اگر آیتم نامعتبر بود، رد کن
            if (!item || typeof item !== 'object') {
                console.warn(`آیتم نامعتبر در ترب - ایندکس: ${index}`);
                return null;
            }

            // کلید رو امن می‌گیریم
            const title = item['ProductCard_desktop_product-name__JwqeK'] ?? 'نامشخص'; // ?? یعنی null/undefined رو به 'نامشخص' تبدیل می‌کنه
            const { size, brand, tech } = extractSizeAndBrand(title);

            let priceText = item['ProductCard_desktop_product-price-text__y20OV'] ?? '0';
            let price_num = parseInt(priceText.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

            let sellersText = item['ProductCard_desktop_shops__mbtsF'] ?? '0';
            let sellers = parseInt(sellersText.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

            const link = item['ProductCards_cards__MYvdn href'] ?? '#';

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
        }).filter(item => item !== null && item.price_num > 0 && item.brand !== 'ایلیا');
    } else {
        // دیجی‌کالا (بدون تغییر)
        processed = raw.map(item => {
            const title = item['ellipsis-2'] || 'نامشخص';
            const { size, brand, tech } = extractSizeAndBrand(title);
            let p = (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '');
            p = p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
            let o = (item['text-neutral-300'] || p).toString().replace(/[^0-9۰-۹]/g, '');
            o = o.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
            return {
                name: title,
                brand,
                link: item['block href'] || '#',
                stock: item['text-caption'] || 'نامشخص',
                rating: item['text-body2-strong'] || '—',
                discount: item['text-body2-strong (2)'] || '—',
                price_num: parseInt(p) || 0,
                original_price_num: parseInt(o) || 0,
                sellers: /موجود|باقی مانده/i.test(item['text-caption'] || '') ? 1 : 0,
                size,
                tech
            };
        }).filter(d => d.price_num > 0 && d.brand !== 'ایلیا');
    }

    currentData[source] = processed;
    localStorage.setItem(`daily_prices_${source}`, JSON.stringify(processed));
    updateUI();
}

// بقیه توابع بدون تغییر (updateStats, updateUI, renderTable, changePage, getFilteredData, sortTable, applyFilters, updateChart)

// ایونت‌ها و بقیه کد همان قبلی
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        currentPage = 1;
        updateUI();
    });
});

document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col));
});

['price-filter','size-filter','brand-filter','tech-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
});

document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('tech-filter').value = '';
    document.getElementById('filter-value').textContent = '۰ تومان';
    updateStats(currentData[currentTab] || []);
    renderTable(currentData[currentTab] || []);
    updateChart(currentData[currentTab] || []);
});

document.getElementById('upload-btn')?.addEventListener('click', () => {
    const input = document.getElementById('file-input');
    if (input) {
        input.value = '';
        input.click();
    }
});

document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            let text = ev.target.result;

            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
            text = text.trim();

            if (text.endsWith(',]')) text = text.slice(0, -2) + ']';

            const json = JSON.parse(text);

            const source = prompt('منبع داده (digikala یا torob):')?.trim().toLowerCase() || 'digikala';
            loadData(json, source);
            alert(`داده‌های ${source} لود شد (${json.length} محصول)`);

            e.target.value = '';
        } catch (err) {
            console.error('خطای JSON:', err);
            alert(`فایل JSON نامعتبر است!\n\nجزئیات: ${err.message}\n\nفایل را با VS Code تمیز کنید (Cut و Paste کنید).`);
        }
    };

    reader.readAsText(file);
});

function downloadExcel() {
    const data = currentData[currentTab] || [];
    if (data.length === 0) return alert('هیچ داده‌ای برای دانلود وجود ندارد');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices.xlsx`);
}

// لود اولیه
fetch('daily_prices.json')
    .then(r => r.json())
    .then(data => loadData(data, 'digikala'))
    .catch(() => {});

const savedDigikala = localStorage.getItem('daily_prices_digikala');
if (savedDigikala) currentData.digikala = JSON.parse(savedDigikala);

const savedTorob = localStorage.getItem('daily_prices_torob');
if (savedTorob) currentData.torob = JSON.parse(savedTorob);

updateUI();
