// dashboard.js - نسخه کامل و نهایی

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
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    let brand = 'نامشخص';
    let tech = 'LED';

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
        processed = raw.map(item => {
            const title = item['ProductCard_desktop_product-name__JwqeK'] || 'نامشخص';
            const { size, brand, tech } = extractSizeAndBrand(title);

            let priceText = item['ProductCard_desktop_product-price-text__y20OV'] || '0';
            let price_num = parseInt(priceText.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

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

function updateStats(data) {
    const prices = data.map(item => item.price_num).filter(p => p > 0);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    document.getElementById('avg-price').textContent = toPersianDigits(avgPrice) + ' تومان';
    document.getElementById('total-items').textContent = toPersianDigits(data.length);
    document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((sum, item) => sum + item.sellers, 0));
    document.getElementById('total-brands').textContent = toPersianDigits([...new Set(data.map(item => item.brand))].length);
}

function updateUI() {
    const data = currentData[currentTab] || [];
    if (data.length === 0) {
        document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;">هیچ داده‌ای موجود نیست</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    updateStats(data);
    document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

    const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
    document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();
    document.getElementById('brand-filter').innerHTML = '<option value="">همه برندها</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');

    let techs = [...new Set(data.map(d => d.tech))].sort();
    if (!techs.includes('QLED')) techs.push('QLED');
    document.getElementById('tech-filter').innerHTML = '<option value="">همه تکنولوژی‌ها</option>' + techs.map(t => `<option value="${t}">${t}</option>`).join('');

    renderTable(data);
    updateChart(data);
}

function renderTable(data, page = currentPage) {
    const tbody = document.querySelector('#product-table tbody');
    
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const visibleData = data.slice(start, end);

    const isTorob = currentTab === 'torob';
    tbody.innerHTML = visibleData.map(item => `
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
    `).join('');

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

function changePage(page) {
    currentPage = page;
    const filteredData = getFilteredData();
    renderTable(filteredData, page);
}

function getFilteredData() {
    let filtered = currentData[currentTab] || [];
    const minPrice = parseInt(document.getElementById('price-filter').value) || 0;
    filtered = filtered.filter(item => item.price_num >= minPrice);
    const selectedSize = document.getElementById('size-filter').value;
    if (selectedSize) filtered = filtered.filter(item => item.size === selectedSize);
    const selectedBrand = document.getElementById('brand-filter').value;
    if (selectedBrand) filtered = filtered.filter(item => item.brand === selectedBrand);
    const selectedTech = document.getElementById('tech-filter').value;
    if (selectedTech) filtered = filtered.filter(item => item.tech === selectedTech);
    return filtered;
}

function sortTable(col) {
    if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sortCol = col;
        sortDir = 'asc';
    }

    let filtered = getFilteredData();

    filtered.sort((a, b) => {
        let va = a[col], vb = b[col];
        if (col.includes('price_num')) {
            va = va || 0;
            vb = vb || 0;
            return sortDir === 'asc' ? va - vb : vb - va;
        } else {
            va = (va || '').toString();
            vb = (vb || '').toString();
            return sortDir === 'asc' ? va.localeCompare(vb, 'fa') : vb.localeCompare(va, 'fa');
        }
    });

    renderTable(filtered);
    updateChart(filtered);
}

function applyFilters() {
    currentPage = 1;
    const filteredData = getFilteredData();
    updateStats(filteredData);
    renderTable(filteredData);
    updateChart(filteredData);
}

function updateChart(data) {
    if (data.length === 0) return;

    const brandAvg = {};
    data.forEach(item => {
        if (item.brand !== 'نامشخص') {
            if (!brandAvg[item.brand]) brandAvg[item.brand] = { sum: 0, count: 0 };
            brandAvg[item.brand].sum += item.price_num;
            brandAvg[item.brand].count++;
        }
    });
    const labels = Object.keys(brandAvg);
    const avgPrices = labels.map(b => Math.round(brandAvg[b].sum / brandAvg[b].count));

    const brandCtx = document.getElementById('brand-price-chart')?.getContext('2d');
    if (brandCtx) {
        if (window.brandChart) window.brandChart.destroy();
        window.brandChart = new Chart(brandCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'میانگین قیمت (تومان)',
                    data: avgPrices,
                    backgroundColor: 'rgba(75,192,192,0.6)',
                    borderColor: 'rgba(75,192,192,1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: { ticks: { font: { family: 'Vazirmatn' } } },
                    y: { ticks: { font: { family: 'Vazirmatn' } } }
                },
                plugins: {
                    legend: { labels: { font: { family: 'Vazirmatn' } } },
                    tooltip: { titleFont: { family: 'Vazirmatn' }, bodyFont: { family: 'Vazirmatn' } }
                }
            }
        });
    }

    const brandCount = {};
    data.forEach(item => {
        if (item.brand !== 'نامشخص') brandCount[item.brand] = (brandCount[item.brand] || 0) + 1;
    });
    const pieCtx = document.getElementById('brand-pie-chart')?.getContext('2d');
    if (pieCtx) {
        if (window.pieChart) window.pieChart.destroy();
        window.pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(brandCount),
                datasets: [{
                    data: Object.values(brandCount),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: { titleFont: { family: 'Vazirmatn' }, bodyFont: { family: 'Vazirmatn' } }
                }
            }
        });
    }

    const scatterData = data.map(item => ({
        x: +item.size.replace('نامشخص', '0'),
        y: item.price_num,
        brand: item.brand
    }));

    const scatterCtx = document.getElementById('price-size-scatter')?.getContext('2d');
    if (scatterCtx) {
        if (window.scatterChart) window.scatterChart.destroy();
        window.scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'قیمت بر حسب سایز',
                    data: scatterData,
                    backgroundColor: 'rgba(54,162,235,0.6)',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: 'سایز (اینچ)' } },
                    y: { title: { display: true, text: 'قیمت (تومان)' } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.brand} - ${toPersianDigits(context.raw.y)} تومان`;
                            }
                        }
                    },
                    legend: { labels: { font: { family: 'Vazirmatn' } } }
                }
            }
        });
    }
}

// ایونت تب‌ها
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
        input.value = ''; // ریست برای trigger دوباره
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

            // حذف BOM (خیلی مهم برای فایل‌های ترب)
            if (text.charCodeAt(0) === 0xFEFF) {
                text = text.slice(1);
            }

            // حذف فضاهای اضافی و خطوط خالی
            text = text.trim();

            // رفع مشکل کاما اضافی رایج در انتهای آرایه
            if (text.endsWith(',]')) {
                text = text.slice(0, -2) + ']';
            }

            const json = JSON.parse(text);

            const source = prompt('منبع داده (digikala یا torob):')?.trim().toLowerCase() || 'digikala';
            loadData(json, source);
            alert(`داده‌های ${source} با موفقیت لود شد (${json.length} محصول)`);

            // ریست input برای آپلود بعدی
            e.target.value = '';
        } catch (err) {
            console.error('خطای JSON:', err, '\nمتن اولیه فایل:', ev.target.result.substring(0, 300));
            alert(
                `فایل JSON نامعتبر است!\n\n` +
                `جزئیات: ${err.message}\n\n` +
                `پیشنهاد: فایل را با VS Code باز کنید → همه را انتخاب کنید → Cut کنید → دوباره Paste کنید → ذخیره کنید.\n` +
                `یا فقط چند آیتم اول را کپی کنید و در فایل جدید تست کنید.`
            );
        }
    };

    reader.onerror = () => alert('خطا در خواندن فایل. لطفاً دوباره امتحان کنید.');

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

// لود اولیه از فایل‌های محلی (اگر وجود داشته باشند)
fetch('daily_prices.json')
    .then(r => r.json())
    .then(data => loadData(data, 'digikala'))
    .catch(() => {});

const savedDigikala = localStorage.getItem('daily_prices_digikala');
if (savedDigikala) currentData.digikala = JSON.parse(savedDigikala);

const savedTorob = localStorage.getItem('daily_prices_torob');
if (savedTorob) currentData.torob = JSON.parse(savedTorob);

updateUI();
