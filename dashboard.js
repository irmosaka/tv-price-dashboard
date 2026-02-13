let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = 'price_num';
let sortDir = 'asc';

// لیست کامل برندها (مرتب شده بر اساس حروف الفبا)
const TOROB_BRANDS = [
  "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "پارس", "پاناسونیک",
  "تی سی ال", "توشیبا", "جی بی پی", "جی پلاس", "جی وی سی", "دوو", "سام الکترونیک",
  "سامسونگ", "سونی", "لیماک جنرال اینترنشنال", "نکسار", "هایسنس", "ورلد استار"
].sort((a, b) => a.localeCompare(b, 'fa'));

// برندهایی که باید به عنوان متفرقه دسته‌بندی شوند (اما در فیلتر نمایش داده نمی‌شوند)
const IGNORED_BRANDS = ["بویمن", "جی بی پی", "لیماک جنرال اینترنشنال", "ورلد استار"];

// کلمات کلیدی برای حذف کامل محصول (این محصولات اصلاً نمایش داده نمی‌شوند)
const EXCLUDE_KEYWORDS = [
  "ویدئو وال", "LED Wall", "پاورولوژی", "powerology",
  "ال ای دی ۱۵.۶ اینچ", "15.6 اینچ", "مانیتور", "monitor",
  "ITC", "گام پیکسل", "فضای داخلی", "ولگا", "volga",
  "ضخیم", "نرمال", "۴۰ پین", "40 Pin"
];

// متغیرهای نمودارها
let chartBrandAvg = null;
let chartSizeAvg = null;
let chartBrandCount = null;

// تابع کمکی برای نرمال‌سازی متن (حذف کاراکترهای خاص)
function normalizeText(text) {
  if (!text) return '';
  // حذف zero-width spaces و کاراکترهای کنترلی
  return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function toPersianDigits(num) {
  if (num === '—' || num === null || num === undefined) return '—';
  return num.toLocaleString('fa-IR');
}

// تشخیص برند با روش includes و اولویت طول عبارت
function extractBrandFromTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) return 'متفرقه';

  const normalized = normalizeText(title).toLowerCase();

  // لیست برندها به همراه نام‌های انگلیسی معادل (با اولویت طول)
  const brandPatterns = [
    // برندهای بلندتر اول
    { name: 'لیماک جنرال اینترنشنال', patterns: ['لیماک جنرال اینترنشنال', 'limak general international'] },
    { name: 'ورلد استار', patterns: ['ورلد استار', 'worldstar'] },
    { name: 'پاناسونیک', patterns: ['پاناسونیک', 'panasonic'] },
    { name: 'توشیبا', patterns: ['توشیبا', 'toshiba'] },
    { name: 'سام الکترونیک', patterns: ['سام الکترونیک'] },
    { name: 'سامسونگ', patterns: ['سامسونگ', 'samsung'] },
    { name: 'سونی', patterns: ['سونی', 'sony'] },
    { name: 'ال جی', patterns: ['ال جی', 'ال‌جی', 'lg'] },
    { name: 'اسنوا', patterns: ['اسنوا'] },
    { name: 'دوو', patterns: ['دوو'] },
    { name: 'هایسنس', patterns: ['هایسنس', 'hisense'] },
    { name: 'تی سی ال', patterns: ['تی سی ال', 'tcl'] },
    { name: 'ایکس ویژن', patterns: ['ایکس ویژن', 'xvision'] },
    { name: 'آپلاس', patterns: ['آپلاس', 'aplus'] },
    { name: 'آیوا', patterns: ['آیوا', 'aiwa'] },
    { name: 'جی پلاس', patterns: ['جی پلاس', 'gplus'] },
    { name: 'جی وی سی', patterns: ['جی وی سی', 'jvc'] },
    { name: 'نکسار', patterns: ['نکسار', 'nexar'] },
    { name: 'پارس', patterns: ['پارس', 'pars'] },
    { name: 'بویمن', patterns: ['بویمن', 'boyman'] },
    { name: 'جی بی پی', patterns: ['جی بی پی', 'gbp'] },
    // برای «سام» به‌تنهایی (با شرط عدم وجود سامسونگ و وجود UA/QA)
    { name: 'سام الکترونیک', patterns: ['سام'], condition: (txt) => txt.includes('سام') && !txt.includes('سامسونگ') && (txt.includes('ua') || txt.includes('qa')) }
  ];

  // اول بررسی شرطی برای «سام» (با UA/QA)
  for (const bp of brandPatterns) {
    if (bp.condition) {
      if (bp.condition(normalized)) {
        return bp.name;
      }
    }
  }

  // سپس بررسی الگوهای معمولی (با اولویت طول)
  // ابتدا لیست را بر اساس طول بلندترین pattern مرتب می‌کنیم
  const flatPatterns = [];
  brandPatterns.forEach(bp => {
    if (!bp.condition) { // آن‌هایی که شرط ندارند
      bp.patterns.forEach(p => {
        flatPatterns.push({ name: bp.name, pattern: p.toLowerCase() });
      });
    }
  });
  flatPatterns.sort((a, b) => b.pattern.length - a.pattern.length);

  for (const { name, pattern } of flatPatterns) {
    if (normalized.includes(pattern)) {
      // اگر برند در لیست نادیده‌گرفته‌شده است، متفرقه برگردان
      if (IGNORED_BRANDS.includes(name)) return 'متفرقه';
      return name;
    }
  }

  return 'متفرقه';
}

function extractSize(title) {
  if (!title || typeof title !== 'string') return 'نامشخص';

  const normalized = normalizeText(title);

  // الگوهای اصلی (با ذکر "اینچ" یا "سایز")
  const patterns = [
    /(\d{2,3})\s*اینچ/i,
    /(\d{2,3})\s*اینج/i,
    /سایز\s*(\d{2,3})/i,
    /اندازه\s*(\d{2,3})/i,
    /(\d{2,3})\s*["']?اینچ/i,
    /[\d۰-۹]{2,3}\s*اینچ/i,
    /سایز\s*[\d۰-۹]{2,3}\s*اینچ/i,
    /(\d{2,3})[\s_-]?اینچ/i,
    /(\d{2,3})"/i,
    /(\d{2,3})''/i,
    /(\d{2,3})\s*inch/i,
    /(\d{2,3})[\s_-]?inch/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      let sizeStr = match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      const num = parseInt(sizeStr, 10);
      if (num >= 24 && num <= 100) return num.toString();
    }
  }

  // اگر الگوهای اصلی پیدا نشد، به دنبال اعداد تنها می‌گردیم (با دقت)
  const standaloneNumbers = normalized.match(/\b(\d{2,3})\b/g);
  if (standaloneNumbers) {
    for (let numStr of standaloneNumbers) {
      const num = parseInt(numStr, 10);
      if (num >= 24 && num <= 100) return num.toString();
    }
  }

  return 'نامشخص';
}

function extractTech(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('qled') || lower.includes('کیو ال ای دی') || lower.includes('کیو‌ال‌ایدی') ||
      lower.includes('q led') || lower.includes('کیوال‌ایدی') ||
      (lower.includes('q') && lower.includes('led'))) return 'QLED';
  if (lower.includes('oled') || lower.includes('اولد') || lower.includes('او ال ای دی') ||
      (lower.includes('o') && lower.includes('led'))) return 'OLED';
  return 'LED';
}

// تابع بررسی اعتبار محصول (آیا باید نمایش داده شود؟)
function isValidProduct(item) {
  const title = item.name || '';
  // حذف محصولات با کلمات کلیدی ممنوع
  for (const kw of EXCLUDE_KEYWORDS) {
    if (title.includes(kw)) return false;
  }
  // حذف محصولات با سایز کمتر از 24 اینچ (به جز مواردی که سایز نامشخص است)
  if (item.size !== 'نامشخص') {
    const sizeNum = parseInt(item.size, 10);
    if (!isNaN(sizeNum) && (sizeNum < 24 || sizeNum > 100)) return false;
  }
  // حذف برند پاورولوژی (اگر تشخیص داده شود)
  if (title.toLowerCase().includes('powerology') || title.includes('پاورولوژی')) return false;
  return true;
}

function loadData(raw, source = 'digikala') {
  let processed = [];

  if (source === 'torob') {
    processed = raw.map((item) => {
      const title = String(item['ProductCard_desktop_product-name__JwqeK'] ?? '').trim();
      const brand = extractBrandFromTitle(title);
      const size = extractSize(title);
      const tech = extractTech(title);

      let priceText = item['ProductCard_desktop_product-price-text__y20OV'] ?? '0';
      let price_num = parseInt(String(priceText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

      let sellersText = item['ProductCard_desktop_shops__mbtsF'] ?? '0';
      let sellers = parseInt(String(sellersText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

      const link = item['ProductCards_cards__MYvdn href'] ?? '#';

      if (price_num <= 0) return null;

      return { 
        name: title || 'نام محصول نامشخص', 
        brand, 
        link, 
        price_num, 
        sellers, 
        size, 
        tech 
      };
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

  // فیلتر نهایی: حذف محصولات نامعتبر
  processed = processed.filter(isValidProduct);

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
  document.getElementById('total-brands').textContent = toPersianDigits([...new Set(data.map(item => item.brand).filter(b => b !== 'متفرقه'))].length);
  document.getElementById('product-count').textContent = data.length;
}

function updateSortIcons() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    const existingIcon = th.querySelector('.sort-icon');
    if (existingIcon) existingIcon.remove();
  });

  if (sortCol) {
    const th = document.querySelector(`th[data-col="${sortCol}"]`);
    if (th) {
      const icon = document.createElement('span');
      icon.className = 'sort-icon';
      icon.textContent = sortDir === 'asc' ? ' ↑' : ' ↓';
      icon.style.marginLeft = '5px';
      th.appendChild(icon);
    }
  }
}

// ==================== توابع رسم هر نمودار ====================
function renderBrandAvgChart(data) {
  const ctx = document.getElementById('chart-brand-avg');
  if (!ctx) return;
  if (chartBrandAvg) chartBrandAvg.destroy();

  const brandGroups = {};
  data.forEach(item => {
    if (item.brand && item.price_num > 0 && item.brand !== 'متفرقه' && item.brand !== 'نامشخص') {
      if (!brandGroups[item.brand]) brandGroups[item.brand] = { total: 0, count: 0 };
      brandGroups[item.brand].total += item.price_num;
      brandGroups[item.brand].count += 1;
    }
  });

  const chartData = Object.entries(brandGroups)
    .map(([brand, stats]) => ({ brand, value: Math.round(stats.total / stats.count) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const labels = chartData.map(d => d.brand);
  const values = chartData.map(d => d.value);
  const backgroundColors = chartData.map(d => {
    if (d.brand === 'اسنوا') return '#4CAF50';      // سبز
    if (d.brand === 'دوو') return '#F44336';        // قرمز
    return '#42A5F5';                                // آبی
  });

  chartBrandAvg = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'میانگین قیمت (تومان)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'Vazir, Tahoma, sans-serif' },
      scales: { y: { beginAtZero: true, ticks: { callback: v => toPersianDigits(v) + ' تومان' } } },
      plugins: { tooltip: { callbacks: { label: ctx => `میانگین: ${toPersianDigits(ctx.raw)} تومان` } } }
    }
  });
}

function renderSizeAvgChart(data) {
  const ctx = document.getElementById('chart-size-avg');
  if (!ctx) return;
  if (chartSizeAvg) chartSizeAvg.destroy();

  const sizeGroups = {};
  data.forEach(item => {
    const size = item.size;
    if (size !== 'نامشخص' && item.price_num > 0) {
      if (!sizeGroups[size]) sizeGroups[size] = { total: 0, count: 0 };
      sizeGroups[size].total += item.price_num;
      sizeGroups[size].count += 1;
    }
  });

  const chartData = Object.entries(sizeGroups)
    .map(([size, stats]) => ({ size, value: Math.round(stats.total / stats.count) }))
    .sort((a, b) => parseInt(a.size) - parseInt(b.size))
    .slice(0, 15);

  chartSizeAvg = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.size + ' اینچ'),
      datasets: [{
        label: 'میانگین قیمت (تومان)',
        data: chartData.map(d => d.value),
        backgroundColor: '#FFA726',
        borderColor: '#FB8C00',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'Vazir, Tahoma, sans-serif' },
      scales: { y: { beginAtZero: true, ticks: { callback: v => toPersianDigits(v) + ' تومان' } } },
      plugins: { tooltip: { callbacks: { label: ctx => `میانگین: ${toPersianDigits(ctx.raw)} تومان` } } }
    }
  });
}

function renderBrandCountChart(data) {
  const ctx = document.getElementById('chart-brand-count');
  if (!ctx) return;
  if (chartBrandCount) chartBrandCount.destroy();

  const brandCounts = {};
  data.forEach(item => {
    if (item.brand && item.brand !== 'متفرقه' && item.brand !== 'نامشخص') {
      brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
    }
  });

  const chartData = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  chartBrandCount = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.brand),
      datasets: [{
        label: 'تعداد محصولات',
        data: chartData.map(d => d.value),
        backgroundColor: '#66BB6A',
        borderColor: '#43A047',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: { family: 'Vazir, Tahoma, sans-serif' },
      scales: { y: { beginAtZero: true, ticks: { callback: v => toPersianDigits(v) } } },
      plugins: { tooltip: { callbacks: { label: ctx => `تعداد: ${toPersianDigits(ctx.raw)}` } } }
    }
  });
}

function renderAllCharts(data) {
  renderBrandAvgChart(data);
  renderSizeAvgChart(data);
  renderBrandCountChart(data);
}
// ================================================================

function updateUI() {
  const data = currentData[currentTab] || [];
  
  if (currentTab === 'torob') {
    document.getElementById('table-header-digikala').style.display = 'none';
    document.getElementById('table-header-torob').style.display = '';
  } else {
    document.getElementById('table-header-digikala').style.display = '';
    document.getElementById('table-header-torob').style.display = 'none';
  }
  
  if (data.length === 0) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">هیچ داده‌ای موجود نیست. لطفاً فایل JSON را بارگذاری کنید.</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  updateStats(data);
  document.getElementById('last-update').textContent = new Date().toLocaleString('fa-IR');

  const sizeFilter = document.getElementById('size-filter');
  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))]
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n >= 24 && n <= 100)
    .sort((a, b) => a - b);

  sizeFilter.innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  const validBrands = TOROB_BRANDS.filter(brand => !IGNORED_BRANDS.includes(brand));
  
  if (currentTab === 'torob') {
    validBrands.forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
  } else {
    const existingBrands = new Set(data.map(d => d.brand).filter(b => b !== 'متفرقه' && b !== 'نامشخص'));
    validBrands.forEach(brand => {
      if (existingBrands.has(brand)) brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
    const otherBrands = [...existingBrands].filter(b => !validBrands.includes(b)).sort((a, b) => a.localeCompare(b, 'fa'));
    otherBrands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
  }

  renderTable(data);
  renderAllCharts(data);
}

function sortData(data) {
  if (!sortCol) return data;

  return [...data].sort((a, b) => {
    let aVal = a[sortCol];
    let bVal = b[sortCol];

    if (sortCol.includes('price') || sortCol.includes('sellers') || sortCol === 'size') {
      aVal = typeof aVal === 'string' ? parseFloat(aVal) || 0 : aVal || 0;
      bVal = typeof bVal === 'string' ? parseFloat(bVal) || 0 : bVal || 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal, 'fa') : bVal.localeCompare(aVal, 'fa');
    }

    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderTable(data, page = currentPage) {
  const sortedData = sortData(data);
  const tbody = document.querySelector('#product-table tbody');
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const visibleData = sortedData.slice(start, end);
  const isTorob = currentTab === 'torob';

  tbody.innerHTML = visibleData.map(item => {
    const isSpecialBrand = item.brand === 'اسنوا' || item.brand === 'دوو';
    const rowClass = isSpecialBrand ? 'style="background-color: #fff3e0;"' : '';
    
    if (isTorob) {
      return `<tr ${rowClass}><td>${item.name}</td><td><strong>${item.brand}</strong></td><td>${toPersianDigits(item.price_num)} تومان</td><td>${toPersianDigits(item.sellers)} فروشنده</td><td><a href="${item.link}" target="_blank" class="product-link">مشاهده</a></td></tr>`;
    } else {
      return `<tr ${rowClass}><td>${item.name}</td><td><strong>${item.brand}</strong></td><td>${toPersianDigits(item.price_num)} تومان</td><td>${toPersianDigits(item.original_price_num)} تومان</td><td>${item.discount}</td><td>${item.rating}</td><td>${item.stock}</td><td><a href="${item.link}" target="_blank" class="product-link">مشاهده</a></td></tr>`;
    }
  }).join('');

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  const maxVisiblePages = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '۱';
    firstBtn.onclick = () => changePage(1);
    pagination.appendChild(firstBtn);
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'pagination-ellipsis';
      pagination.appendChild(ellipsis);
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.textContent = toPersianDigits(i);
    btn.className = i === page ? 'active' : '';
    btn.onclick = () => changePage(i);
    pagination.appendChild(btn);
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'pagination-ellipsis';
      pagination.appendChild(ellipsis);
    }
    const lastBtn = document.createElement('button');
    lastBtn.textContent = toPersianDigits(totalPages);
    lastBtn.onclick = () => changePage(totalPages);
    pagination.appendChild(lastBtn);
  }

  updateSortIcons();
}

function changePage(page) {
  currentPage = page;
  const filteredData = getFilteredData();
  renderTable(filteredData);
}

function getFilteredData() {
  let filtered = currentData[currentTab] || [];
  
  const minPrice = parseInt(document.getElementById('price-filter').value) || 0;
  if (minPrice > 0) filtered = filtered.filter(item => item.price_num >= minPrice);
  
  const selectedSize = document.getElementById('size-filter').value;
  if (selectedSize) filtered = filtered.filter(item => item.size === selectedSize);
  
  const selectedBrand = document.getElementById('brand-filter').value;
  if (selectedBrand) filtered = filtered.filter(item => item.brand === selectedBrand);
  
  const selectedTech = document.getElementById('tech-filter').value;
  if (selectedTech) filtered = filtered.filter(item => item.tech === selectedTech);
  
  return filtered;
}

function applyFilters() {
  currentPage = 1;
  const filteredData = getFilteredData();
  updateStats(filteredData);
  renderTable(filteredData);
  renderAllCharts(filteredData);
}

function sortTable(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      console.log('Chart.js loaded');
      if (currentData[currentTab] && currentData[currentTab].length > 0) {
        renderAllCharts(currentData[currentTab]);
      }
    };
    document.head.appendChild(script);
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      currentPage = 1;
      sortCol = 'price_num';
      sortDir = 'asc';
      updateUI();
    });
  });

  document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col));
  });

  ['price-filter', 'size-filter', 'brand-filter', 'tech-filter'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', applyFilters);
      element.addEventListener('change', applyFilters);
    }
  });

  const priceFilter = document.getElementById('price-filter');
  const filterValue = document.getElementById('filter-value');
  if (priceFilter && filterValue) {
    priceFilter.addEventListener('input', function() {
      filterValue.textContent = toPersianDigits(this.value) + ' تومان';
    });
  }

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('tech-filter').value = '';
    if (filterValue) filterValue.textContent = '۰ تومان';
    currentPage = 1;
    sortCol = 'price_num';
    sortDir = 'asc';
    updateUI();
  });

  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });

  document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = 'digikala';
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.startsWith('torob')) source = 'torob';
    else if (fileNameLower.startsWith('digikala')) source = 'digikala';
    else {
      const userSource = prompt('نام فایل شناخته نشد. منبع داده (digikala یا torob):')?.trim().toLowerCase();
      if (userSource === 'torob' || userSource === 'digikala') source = userSource;
      else alert('منبع داده نامعتبر است. از digikala استفاده می‌شود.');
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        let text = ev.target.result.trim();
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        if (text.endsWith(',]')) text = text.slice(0, -2) + ']';

        const json = JSON.parse(text);
        loadData(json, source);
        alert(`داده‌های ${source} از فایل "${file.name}" لود شد (${json.length} محصول)`);
        e.target.value = '';
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  updateUI();
});
