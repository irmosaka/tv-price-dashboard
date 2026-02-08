let currentData = [];
let displayedRows = 20;
let sortCol = null;
let sortDir = 'asc';

function toPersianDigits(num) {
    if (num === '—' || num === null || num === undefined) return '—';
    return num.toLocaleString('fa-IR');  // کاما هر ۳ رقم + اعداد فارسی
}

function extractSizeAndBrand(title) {
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    let brand = 'نامشخص';
    const techMatch = title.match(/ال\s*ای\s*دی|کیو\s*ال\s*ای\s*دی|اولد/i);
    const tech = techMatch ? techMatch[0].replace(/\s*/g, '').toLowerCase() : 'ال ای دی';

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
    
    // فیکس پاناسونیک
    if (brand.includes('پاناسونیک')) {
        brand = 'پاناسونیک';
    }

    return { size, brand: brand || 'نامشخص', tech };
}

function loadData(raw) {
    currentData = raw.map(item => {
        const title = item['ellipsis-2'] || 'نامشخص';
        const { size, brand, tech } = extractSizeAndBrand(title);
        let p = (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '');
        p = p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        let o = (item['text-neutral-300'] || p).toString().replace(/[^0-9۰-۹]/g, '');
        o = o.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const newItem = {
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
        return newItem;
    }).filter(d => d.price_num > 0 && d.brand !== 'ایلیا');  // حذف ایلیا

    // ذخیره در localStorage برای جایگزین دائمی
    localStorage.setItem('daily_prices_data', JSON.stringify(currentData));

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
    let data = currentData;
    updateStats(data);
    document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

    const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
    document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();
    document.getElementById('brand-filter').innerHTML = '<option value="">همه برندها</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');

    const techs = [...new Set(data.map(d => d.tech))].sort();
    document.getElementById('tech-filter').innerHTML = '<option value="">همه تکنولوژی‌ها</option>' + techs.map(t => `<option value="${t}">${t}</option>`).join('');

    // سورت پیش‌فرض: قیمت فروش از کم به زیاد
    data.sort((a, b) => a.price_num - b.price_num);

    renderTable(data);
    updateChart(data);
}

function renderTable(data, limit = displayedRows) {
    const tbody = document.querySelector('#product-table tbody');
    const footer = document.getElementById('table-footer');
    
    const visibleData = data.slice(0, limit);
    tbody.innerHTML = visibleData.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.brand}</td>
            <td>${toPersianDigits(item.price_num)} تومان</td>
            <td>${toPersianDigits(item.original_price_num)} تومان</td>
            <td>${item.discount}</td>
            <td>${item.rating}</td>
            <td>${item.stock}</td>
            <td><a href="${item.link}" target="_blank">مشاهده</a></td>
        </tr>
    `).join('');

    if (data.length > limit) {
        footer.style.display = 'table-row-group';
    } else {
        footer.style.display = 'none';
    }
}

function loadMoreRows() {
    displayedRows += 20;
    const filteredData = getFilteredData();
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
            return sortDir === 'asc' ? va.localeCompare(vb, 'fa') : vb.localeCompare(va, 'fa');
        }
    });

    renderTable(sorted);
    updateChart(sorted);
}

function applyFilters() {
    displayedRows = 20;
    const filteredData = getFilteredData();
    updateStats(filteredData);
    renderTable(filteredData);
    updateChart(filteredData);
}

function updateChart(data) {
    console.log("به‌روزرسانی چارت‌ها با", data.length, "ردیف");

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
                scales: { y: { beginAtZero: true } }
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
                plugins: { legend: { display: false } }  // حذف legend (پای چارت)
            }
        });
    }

    const scatterData = data.map(item => ({
        x: +item.size.replace('نامشخص', '0'),
        y: item.price_num
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
                }
            }
        });
    }
}

// ایونت‌ها
fetch('daily_prices.json')
    .then(r => r.json())
    .then(loadData)
    .catch(e => console.error("خطا در لود JSON:", e));

// لود از localStorage (جایگزین فایل اصلی)
const savedData = localStorage.getItem('daily_prices_data');
if (savedData) {
    const parsedData = JSON.parse(savedData);
    currentData = parsedData;
    updateUI();
}

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
    updateStats(currentData);
    renderTable(currentData);
    updateChart(currentData);
});

document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const json = JSON.parse(ev.target.result);
                loadData(json);
                alert('فایل JSON جدید لود و جایگزین شد!');
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
