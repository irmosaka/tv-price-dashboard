let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

const TOROB_BRANDS = [
  "سامسونگ", "سام الکترونیک", "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سونی", "لیماک جنرال اینترنشنال", "نکسار", "هایسنس",
  "ورلد استار", "پارس", "پاناسونیک"
];

function toPersianDigits(num) {
  if (num === '—' || num === null || num === undefined) return '—';
  return num.toLocaleString('fa-IR');
}

function extractBrandFromTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) return 'متفرقه';

  const lower = title.toLowerCase();
  if (lower.includes('سامسونگ')) return 'سامسونگ';
  if (lower.includes('سام الکترونیک')) return 'سام الکترونیک';

  for (const brand of TOROB_BRANDS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return 'متفرقه';
}

function extractSize(title) {
  if (!title || typeof title !== 'string') return 'نامشخص';

  let normalized = title
    .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d - '0'])
    .replace(/[\u200C\u200D]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/["']/g, '')
    .trim();

  const patterns = [
    /(\d{2,3})\s*اینچ/i,
    /(\d{2,3})\s*اینج/i,
    /سایز\s*(\d{2,3})/i,
    /اندازه\s*(\d{2,3})/i,
    /(\d{2,3})\s*["']?اینچ/i,
    /[\d۰-۹]{2,3}\s*اینچ/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      let sizeStr = match[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      const num = parseInt(sizeStr, 10);
      if (num >= 32 && num <= 100) return num.toString();
    }
  }
  return 'نامشخص';
}

function extractTech(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('q led')) return 'QLED';
  if (lower.includes('oled') || lower.includes('اولد')) return 'OLED';
  return 'LED';
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

      return { name: title || 'نام محصول نامشخص', brand, link, price_num, sellers, size, tech };
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

function updateUI() {
  const data = currentData[currentTab] || [];
  if (data.length === 0) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">هیچ داده‌ای موجود نیست</td></tr>';
    return;
  }

  updateStats(data);
  document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

  // سایزها
  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))]
    .map(s => parseInt(s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10))
    .filter(n => !isNaN(n) && n >= 32 && n <= 100)
    .sort((a, b) => a - b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  // برندها
  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  if (currentTab === 'torob') {
    [...TOROB_BRANDS].sort((a, b) => a.localeCompare(b, 'fa')).forEach(b => {
      brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
  } else {
    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'متفرقه'))].sort((a, b) => a.localeCompare(b, 'fa'));
    brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
  }

  renderTable(data);
}

function renderTable(data, page = currentPage) {
  const tbody = document.querySelector('#product-table tbody');
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const visibleData = data.slice(start, end);

  const isTorob = currentTab === 'torob';

  tbody.innerHTML = visibleData.map(item => {
    if (isTorob) {
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${toPersianDigits(item.price_num)} تومان</td>
          <td>${toPersianDigits(item.sellers)} فروشنده</td>
          <td><a href="${item.link}" target="_blank">مشاهده</a></td>
        </tr>
      `;
    } else {
      return `
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
      `;
    }
  }).join('');

  // صفحه‌بندی
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
  renderTable(currentData[currentTab] || []);
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

function applyFilters() {
  currentPage = 1;
  const filteredData = getFilteredData();
  updateStats(filteredData);
  renderTable(filteredData);
}

function sortTable(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }
  renderTable(getFilteredData());
}

// ایونت‌ها
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
    updateUI();
  });

  document.getElementById('upload-btn')?.addEventListener('click', () => document.getElementById('file-input')?.click());

  document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = 'digikala';
    const name = file.name.toLowerCase();
    if (name.startsWith('torob')) source = 'torob';
    else if (name.startsWith('digikala')) source = 'digikala';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        let text = ev.target.result.trim();
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        if (text.endsWith(',]')) text = text.slice(0, -2) + ']';

        const json = JSON.parse(text);
        loadData(json, source);
        alert(`داده‌های ${source} لود شد (${json.length} محصول)`);
        e.target.value = '';
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  updateUI();
});
