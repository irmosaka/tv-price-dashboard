// dashboard.js - نسخه نهایی (سایز قوی‌تر + برند الفبایی + رفع تمام مشکلات قبلی)

let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

// لیست برندهای مجاز (دقیقاً همون‌هایی که گفتی + سامسونگ و سام الکترونیک)
const TOROB_BRANDS = [
  "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سام", "سامسونگ", "سونی",
  "لیماک جنرال اینترنشنال", "نکسار", "هایسنس", "ورلد استار", "پارس", "پاناسونیک"
];

function toPersianDigits(num) {
  if (num === '—' || num === null || num === undefined) return '—';
  return num.toLocaleString('fa-IR');
}

// استخراج برند فقط از لیست مجاز (ضدگلوله)
function extractBrandFromTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) return 'نامشخص';

  const lowerTitle = title.toLowerCase();

  // اولویت اول: سامسونگ و سام الکترونیک
  if (lowerTitle.includes('سامسونگ')) return 'سامسونگ';
  if (lowerTitle.includes('سام الکترونیک')) return 'سام الکترونیک';

  // بقیه برندها
  for (const brand of TOROB_BRANDS) {
    if (lowerTitle.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return 'نامشخص';
}

// استخراج سایز - نسخه فوق‌العاده قوی برای ترب
function extractSize(title) {
  if (!title || typeof title !== 'string') return 'نامشخص';

  // نرمال‌سازی کامل
  let normalized = title
    .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d - '0'])      // انگلیسی → فارسی
    .replace(/[\u200C\u200D]/g, ' ')                    // نیم‌فاصله → فضای معمولی
    .replace(/\s+/g, ' ')                               // فاصله‌های زیاد → یکی
    .replace(/["']/g, '')                               // نقل‌قول‌ها رو حذف کن
    .trim();

  // الگوهای بسیار گسترده
  const patterns = [
    /(\d{2,3})\s*اینچ/i,
    /(\d{2,3})\s*اینج/i,
    /سایز\s*(\d{2,3})/i,
    /اندازه\s*(\d{2,3})/i,
    /(\d{2,3})\s*["']?اینچ/i,
    /(\d{2,3})\s*['"]?اینچ/i,
    /(\d{2,3})\s*اینچ\s*/i,
    /سایز\s*(\d{2,3})\s*اینچ/i,
    /اندازه\s*(\d{2,3})\s*اینچ/i,
    /(\d{2,3})\s*(?:inch|inچ)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 32 && num <= 100) {
        return num.toString();
      }
    }
  }

  return 'نامشخص';
}

// استخراج تکنولوژی
function extractTech(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('q led')) return 'QLED';
  if (lower.includes('oled') || lower.includes('اولد')) return 'OLED';
  return 'LED';
}

function loadData(raw, source = 'digikala') {
  let processed = [];

  if (source === 'torob') {
    processed = raw.map((item, index) => {
      try {
        if (!item || typeof item !== 'object') return null;

        const title = String(item['ProductCard_desktop_product-name__JwqeK'] ?? '').trim();
        const brand = extractBrandFromTitle(title);
        const size = extractSize(title);
        const tech = extractTech(title);

        let priceText = item['ProductCard_desktop_product-price-text__y20OV'] ?? '0';
        let price_num = parseInt(
          String(priceText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
        ) || 0;

        let sellersText = item['ProductCard_desktop_shops__mbtsF'] ?? '0';
        let sellers = parseInt(
          String(sellersText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
        ) || 0;

        const link = item['ProductCards_cards__MYvdn href'] ?? '#';

        if (price_num <= 0) return null;

        return {
          name: title || 'نام محصول نامشخص',
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
      } catch (err) {
        console.error(`خطا در رکورد ترب ${index}:`, err);
        return null;
      }
    }).filter(item => item !== null);
  } else {
    processed = raw.map(item => {
      const title = item['ellipsis-2'] || 'نامشخص';
      const brand = extractBrandFromTitle(title);
      const size = extractSize(title);
      const tech = extractTech(title);
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
    }).filter(d => d.price_num > 0);
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

  // سایزها - مرتب از کوچک به بزرگ
  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))]
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n >= 32 && n <= 100)
    .sort((a, b) => a - b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  // برندها - مرتب الفبایی (از الف تا ی)
  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  if (currentTab === 'torob') {
    // الفبایی برای ترب
    [...TOROB_BRANDS].sort((a, b) => a.localeCompare(b, 'fa')).forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
  } else {
    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort((a, b) => a.localeCompare(b, 'fa'));
    brands.forEach(b => {
      brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
  }

  // تکنولوژی‌ها
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
      data: { labels, datasets: [{ label: 'میانگین قیمت (تومان)', data: avgPrices, backgroundColor: 'rgba(75,192,192,0.6)', borderColor: 'rgba(75,192,192,1)', borderWidth: 1 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
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
        datasets: [{ data: Object.values(brandCount), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
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
      data: { datasets: [{ label: 'قیمت بر حسب سایز', data: scatterData, backgroundColor: 'rgba(54,162,235,0.6)', pointRadius: 5 }] },
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

// تمام ایونت‌ها در انتها
document.addEventListener('DOMContentLoaded', () => {
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
    updateUI();
  });

  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });

  document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        let text = ev.target.result.trim();
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        if (text.endsWith(',]')) text = text.slice(0, -2) + ']';

        const json = JSON.parse(text);
        const source = prompt('منبع داده (digikala یا torob):')?.trim().toLowerCase() || 'digikala';
        loadData(json, source);
        alert(`داده‌های ${source} لود شد (${json.length} محصول)`);
        e.target.value = '';
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };

    reader.readAsText(file);
  });

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
});

// تابع دانلود اکسل
function downloadExcel() {
  const data = currentData[currentTab] || [];
  if (data.length === 0) return alert('هیچ داده‌ای برای دانلود وجود ندارد');

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (err) {
    alert('خطا در دانلود اکسل. مطمئن شو کتابخانه XLSX لود شده باشه.');
  }
}
