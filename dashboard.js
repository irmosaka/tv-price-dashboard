let currentData = [];
let displayedRows = 20;  // تعداد اولیه ردیف‌ها
let allData = [];  // داده کامل
let sortCol = null;
let sortDir = 'asc';

function extractSizeAndBrand(title) {
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    let brand = 'نامشخص';
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
                } else if (/هوشمند/i.test(nxt) && words[i+3]) {
                    brand = words[i+3];
                    break;
                }
            }
        }
    }
    brand = brand.replace(/هوشمند|ال\s*ای\s*دی/gi, '').replace(/\s+/g, ' ').trim();
    return { size, brand: brand || 'نامشخص' };
}

function loadData(raw) {
    currentData = raw.map(item => {
        const title = item['ellipsis-2'] || 'نامشخص';
        const { size, brand } = extractSizeAndBrand(title);
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
            size
        };
    }).filter(d => d.price_num > 0);
    updateUI();
}

function updateStats(data) {
    const prices = data.map(item => item.price_num).filter(p => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    document.getElementById('avg-price').textContent = avgPrice.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('total-items').textContent = data.length;
    document.getElementById('total-sellers').textContent = data.reduce((sum, item) => sum + item.sellers, 0);
    document.getElementById('total-brands').textContent = [...new Set(data.map(item => item.brand))].length;
}

function updateUI() {
    const data = currentData;
    const prices = data.map(d => d.price_num);
    const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
    document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('total-items').textContent = data.length;
    document.getElementById('total-sellers').textContent = data.reduce((s,d)=>s+d.sellers,0);
    document.getElementById('total-brands').textContent = [...new Set(data.map(d => d.brand))].length;
    document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

    const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
    document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();
    document.getElementById('brand-filter').innerHTML = '<option value="">همه برندها</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');

    renderTable(data);
}

function renderTable(data, limit = displayedRows) {
    const tbody = document.querySelector('#product-table tbody');
    const footer = document.getElementById('table-footer');
    
    // فقط limit ردیف نشون بده
    const visibleData = data.slice(0, limit);
    tbody.innerHTML = visibleData.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.brand}</td>
            <td>${item.price_num.toLocaleString('fa-IR')} تومان</td>
            <td>${item.original_price_num.toLocaleString('fa-IR')} تومان</td>
            <td>${item.discount}</td>
            <td>${item.rating}</td>
            <td>${item.stock}</td>
            <td><a href="${item.link}" target="_blank">مشاهده</a></td>
        </tr>
    `).join('');

    // اگر داده بیشتری هست، دکمه نشون بده
    if (data.length > limit) {
        footer.style.display = 'table-row-group';
    } else {
        footer.style.display = 'none';
    }
}

function loadMoreRows() {
    displayedRows += 20;  // ۲۰ ردیف بیشتر لود کن
    const filteredData = getFilteredData();  // داده فیلترشده رو بگیر
    renderTable(filteredData, displayedRows);
    
    if (filteredData.length <= displayedRows) {
        document.getElementById('load-more').textContent = 'همه داده‌ها لود شد';
        document.getElementById('load-more').disabled = true;
    }
}

function getFilteredData() {
    let filtered = currentData;
    const minPrice = parseInt(document.getElementById('price-filter').value) || 0;
    filtered = filtered.filter(item => item.price_num >= minPrice);

    const selectedSize = document.getElementById('size-filter').value;
    if (selectedSize) filtered = filtered.filter(item => item.size === selectedSize);

    const selectedBrand = document.getElementById('brand-filter').value;
    if (selectedBrand) filtered = filtered.filter(item => item.brand === selectedBrand);

    return filtered;
}


function sortTable(col) {
    if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortCol = col;
        sortDir = 'asc';
    }

    let sorted = [...currentData];
    sorted.sort((a, b) => {
        let va = a[col], vb = b[col];
        if (col.includes('price_num')) {
            va = va || 0;
            vb = vb || 0;
            return sortDir === 'asc' ? va - vb : vb - va;
        } else {
            va = (va || '').toString();
            vb = (vb || '').toString();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
    });

    renderTable(sorted);
}

function applyFilters() {
    let filtered = currentData;
    const minPrice = parseInt(document.getElementById('price-filter').value) || 0;
    filtered = filtered.filter(item => item.price_num >= minPrice);

    const selectedSize = document.getElementById('size-filter').value;
    if (selectedSize) filtered = filtered.filter(item => item.size === selectedSize);

    const selectedBrand = document.getElementById('brand-filter').value;
    if (selectedBrand) filtered = filtered.filter(item => item.brand === selectedBrand);

    // بروزرسانی آمار برای داده فیلترشده
displayedRows = 20;  // ریست به ۲۰ ردیف
    const filteredData = getFilteredData();
    updateStats(filteredData);
    renderTable(filteredData);
}

document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('filter-value').textContent = '۰ تومان';
    updateStats(currentData);  // آمار کامل
    renderTable(currentData);
    updateChart(currentData);
});

document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const json = JSON.parse(ev.target.result);
                loadData(json);
            } catch (err) {
                alert('فایل JSON نامعتبر است');
            }
        };
        reader.readAsText(file);
    }
});

function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تلویزیون‌ها");
    XLSX.writeFile(wb, "tv_prices.xlsx");
}

// ایونت‌ها
fetch('daily_prices.json').then(r => r.json()).then(loadData).catch(e => console.error(e));
document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col));
});
['price-filter','size-filter','brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
});
