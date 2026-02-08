let currentData = [];
let displayedRows = 20;
let sortCol = null;
let sortDir = 'asc';

function toPersianDigits(num) {
    if (num === '—' || num === null || num === undefined) return '—';
    return num.toLocaleString('fa-IR');   // کاما هر ۳ رقم + اعداد فارسی
}

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

    // آپلود جدید → جایگزین دائمی در localStorage
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
            options: { responsive: true, maintainAspectRatio: false }
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

// Modal تمام صفحه
function openModal(chartId) {
    const modal = document.getElementById('chart-modal');
    const canvas = document.getElementById('modal-canvas');
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * 0.95 * pixelRatio;
    canvas.height = window.innerHeight * 0.85 * pixelRatio;
    canvas.style.width = '95%';
    canvas.style.height = '85vh';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (window.modalChart) {
        window.modalChart.destroy();
        window.modalChart = null;
    }

    const filteredData = getFilteredData();

    let chartInstance;

    if (chartId === 'brand-price-chart') {
        const brandAvg = {};
        filteredData.forEach(item => {
            if (item.brand !== 'نامشخص') {
                if (!brandAvg[item.brand]) brandAvg[item.brand] = { sum: 0, count: 0 };
                brandAvg[item.brand].sum += item.price_num;
                brandAvg[item.brand].count++;
            }
        });
        const labels = Object.keys(brandAvg);
        const avgPrices = labels.map(b => Math.round(brandAvg[b].sum / brandAvg[b].count));

        chartInstance = new Chart(ctx, {
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
                responsive: false,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: true, position: 'top' } }
            }
        });
    }

    if (chartId === 'brand-pie-chart') {
        const brandCount = {};
        filteredData.forEach(item => {
            if (item.brand !== 'نامشخص') brandCount[item.brand] = (brandCount[item.brand] || 0) + 1;
        });
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(brandCount),
                datasets: [{
                    data: Object.values(brandCount),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            },
            options: { responsive: false, maintainAspectRatio: false }
        });
    }

    if (chartId === 'price-size-scatter') {
        const scatterData = filteredData.map(item => ({
            x: +item.size.replace('نامشخص', '0'),
            y: item.price_num
        }));

        chartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'قیمت بر حسب سایز',
                    data: scatterData,
                    backgroundColor: 'rgba(54,162,235,0.6)',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', title: { display: true, text: 'سایز (اینچ)' } },
                    y: { title: { display: true, text: 'قیمت (تومان)' } }
                }
            }
        });
    }

    window.modalChart = chartInstance;

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal() {
    const modal = document.getElementById('chart-modal');
    if (!modal) return;

    modal.classList.remove('show');

    if (window.modalChart) {
        window.modalChart.destroy();
        window.modalChart = null;
    }

    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        // دوباره فعال کردن سورت جدول
        renderTable(currentData);
        updateChart(currentData);
    }, 450);
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

document.querySelectorAll('.chart-card').forEach(card => {
    card.addEventListener('click', () => {
        const chartId = card.getAttribute('data-chart-id');
        if (chartId) openModal(chartId);
    });
});

document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col));
});

['price-filter','size-filter','brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
});

document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
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

document.getElementById('close-modal')?.addEventListener('click', closeModal);

document.getElementById('chart-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تلویزیون‌ها");
    XLSX.writeFile(wb, "tv_prices.xlsx");
}
