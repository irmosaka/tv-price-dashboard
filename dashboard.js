let currentData = [];
let sortColumn = '';
let sortDirection = 'asc';  // برای سورت

console.log("dashboard.js - نسخه کامل با سورت، آپلود و اکسل");

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

        if (cleaned && cleaned.length > 1) {
            brand = cleaned;
        }
    }

    if (brand === 'نامشخص') {
        const words = title.split(/\s+/);
        for (let i = 0; i < words.length - 2; i++) {
            if (/ال\s*ای\s*دی/i.test(words[i] + ' ' + words[i+1])) {
                let next = words[i+2] || words[i+1];
                if (next && !/هوشمند|مدل|سایز/i.test(next)) {
                    brand = next;
                    break;
                } else if (/هوشمند/i.test(next) && words[i+3]) {
                    brand = words[i+3];
                    break;
                }
            }
        }
    }

    brand = brand.replace(/هوشمند|ال\s*ای\s*دی/gi, '').replace(/\s+/g, ' ').trim();
    return { size, brand: brand || 'نامشخص' };
}

function loadData(rawData) {
    console.log(`بارگذاری ${rawData.length} آیتم`);
    currentData = rawData.map((item, idx) => {
        const title = item['ellipsis-2'] || 'نامشخص';
        const { size, brand } = extractSizeAndBrand(title);

        let pStr = (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '');
        pStr = pStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

        let oStr = (item['text-neutral-300'] || pStr).toString().replace(/[^0-9۰-۹]/g, '');
        oStr = oStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

        return {
            name: title,
            brand,
            link: item['block href'] || '#',
            stock: item['text-caption'] || 'نامشخص',
            rating: item['text-body2-strong'] || '—',
            discount: item['text-body2-strong (2)'] || '—',
            price_num: parseInt(pStr) || 0,
            original_price_num: parseInt(oStr) || 0,
            sellers: /موجود|باقی مانده/i.test(item['text-caption'] || '') ? 1 : 0,
            size
        };
    }).filter(d => d.price_num > 0);

    console.log(`داده معتبر: ${currentData.length}`);
    updateFiltersAndRender();
}

function updateFiltersAndRender() {
    const validData = currentData.filter(d => d.price_num > 0);

    // آمار
    const prices = validData.map(d => d.price_num);
    const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
    document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('total-items').textContent = validData.length;
    document.getElementById('total-sellers').textContent = validData.reduce((s,d)=>s+d.sellers,0);
    document.getElementById('total-brands').textContent = [...new Set(validData.map(d => d.brand))].length;

    // تاریخ بروزرسانی
    document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

    // فیلترهای select
    const sizes = [...new Set(validData.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
    document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

    const brands = [...new Set(validData.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();
    document.getElementById('brand-filter').innerHTML = '<option value="">همه برندها</option>' + brands.map(b => `<option value="${b}">${b}</option>`).join('');

    // رندر جدول
    renderTable(validData);

    // چارت (اختیاری)
    updateChart(validData);
}

function renderTable(data) {
    const tbody = document.querySelector('#product-table tbody');
    tbody.innerHTML = data.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.price_num.toLocaleString('fa-IR')} تومان</td>
            <td>${d.original_price_num.toLocaleString('fa-IR')} تومان</td>
            <td>${d.brand}</td>
            <td>${d.discount}</td>
            <td>${d.rating}</td>
            <td>${d.stock}</td>
            <td><a href="${d.link}" target="_blank">مشاهده</a></td>
        </tr>
    `).join('');
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    let sorted = [...currentData];
    sorted.sort((a, b) => {
        let valA = a[column], valB = b[column];
        if (column.includes('price_num')) {
            valA = valA || 0;
            valB = valB || 0;
        } else if (column === 'brand' || column === 'name') {
            valA = valA.toString().localeCompare(valB.toString());
            valB = 0;
            return valA - valB;
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    renderTable(sorted);
    updateChart(sorted);
}

function updateChart(data) {
    const ctx = document.getElementById('price-chart')?.getContext('2d');
    if (ctx && data.length > 0) {
        if (window.myChart) window.myChart.destroy();
        window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name.slice(0,25) + (d.name.length>25?'...':'')),
                datasets: [{
                    label: 'قیمت فروش (تومان)',
                    data: data.map(d => d.price_num),
                    backgroundColor: 'rgba(37,99,235,0.3)',
                    borderColor: 'rgba(37,99,235,0.8)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }
}

function applyFilters() {
    let filtered = currentData;
    const minPrice = +document.getElementById('price-filter').value || 0;
    filtered = filtered.filter(d => d.price_num >= minPrice);

    const selSize = document.getElementById('size-filter').value;
    if (selSize) filtered = filtered.filter(d => d.size === selSize);

    const selBrand = document.getElementById('brand-filter').value;
    if (selBrand) filtered = filtered.filter(d => d.brand === selBrand);

    renderTable(filtered);
    updateChart(filtered);
    document.getElementById('total-items').textContent = filtered.length;  // بروزرسانی آمار
}

// لود اولیه
fetch('daily_prices.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(loadData)
    .catch(e => {
        console.error(e);
        document.body.innerHTML += '<p style="color:red;text-align:center;font-size:1.3rem;">خطا در لود JSON: ' + e.message + '</p>';
    });

// آپلود فایل
document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const json = JSON.parse(event.target.result);
                loadData(json);
            } catch (err) {
                alert('فایل JSON نامعتبر است: ' + err.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert('لطفاً فایل JSON معتبر انتخاب کنید');
    }
});

// دانلود اکسل
function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "قیمت‌ها");
    XLSX.writeFile(wb, "tv_prices.xlsx");
}

// ایونت‌های فیلتر
['price-filter', 'size-filter', 'brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
});

// ایونت سورت روی thها
document.querySelectorAll('th[onclick]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.getAttribute('onclick').match(/'([^']+)'/)[1]));
});
