// js/dashboard.js - همه چیز در یک فایل برای رفع مشکل scope و فونت

let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
const rowsPerPage = 20;
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

function extractBrand(title) {
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

  const normalized = title
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
    /[\d۰-۹]{2,3}\s*اینچ/i,
    /سایز\s*[\d۰-۹]{2,3}\s*اینچ/i
  ];

  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const n = parseInt(m[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10);
      if (n >= 32 && n <= 100) return n.toString();
    }
  }
  return 'نامشخص';
}

function extractTech(title) {
  const l = (title || '').toLowerCase();
  if (l.includes('qled') || l.includes('کیوالایدی') || l.includes('q led')) return 'QLED';
  if (l.includes('oled') || l.includes('اولد')) return 'OLED';
  return 'LED';
}

function loadData(raw, source = 'digikala') {
  let processed = [];

  if (source === 'torob') {
    processed = raw.map(item => {
      const title = String(item['ProductCard_desktop_product-name__JwqeK'] ?? '').trim();
      const brand = extractBrand(title);
      const size = extractSize(title);
      const tech = extractTech(title);

      let price_num = parseInt(
        String(item['ProductCard_desktop_product-price-text__y20OV'] ?? '0')
          .replace(/[^0-9۰-۹]/g, '')
          .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      ) || 0;

      let sellers = parseInt(
        String(item['ProductCard_desktop_shops__mbtsF'] ?? '0')
          .replace(/[^0-9۰-۹]/g, '')
          .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      ) || 0;

      const link = item['ProductCards_cards__MYvdn href'] ?? '#';

      if (price_num <= 0) return null;

      return { name: title || 'نام محصول نامشخص', brand, link, price_num, sellers, size, tech };
    }).filter(Boolean);
  } else {
    processed = raw.map(item => {
      const title = item['ellipsis-2'] || 'نامشخص';
      const brand = extractBrand(title);
      const size = extractSize(title);
      const tech = extractTech(title);
      let p = String(item['flex'] || '0').replace(/[^0-9۰-۹]/g, '');
      p = p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      let o = String(item['text-neutral-300'] || p).replace(/[^0-9۰-۹]/g, '');
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
  updateUI();
}

function updateStats(data) {
  const prices = data.map(i => i.price_num).filter(p => p > 0);
  const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
  document.getElementById('avg-price').textContent = toPersianDigits(avg) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((s,i)=>s+(i.sellers||0),0));
  document.getElementById('total-brands').textContent = toPersianDigits(new Set(data.map(i=>i.brand)).size);
}

function updateUI() {
  const data = currentData[currentTab] || [];
  if (!data.length) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">هیچ داده‌ای موجود نیست</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  updateStats(data);
  document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))]
    .map(s => parseInt(s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10))
    .filter(n => !isNaN(n) && n >= 32 && n <= 100)
    .sort((a,b)=>a-b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  if (currentTab === 'torob') {
    [...TOROB_BRANDS].sort((a,b)=>a.localeCompare(b,'fa')).forEach(b=>{
      brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
  } else {
    const brands = [...new Set(data.map(d=>d.brand).filter(b=>b!=='متفرقه'))].sort((a,b)=>a.localeCompare(b,'fa'));
    brands.forEach(b=>brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
  }

  renderTable(data);
}

function renderTable(data) {
  const tbody = document.querySelector('#product-table tbody');
  const isTorob = currentTab === 'torob';

  tbody.innerHTML = data.map(item => isTorob ? `
    <tr>
      <td>${item.name}</td>
      <td>${item.brand}</td>
      <td>${toPersianDigits(item.price_num)} تومان</td>
      <td>${toPersianDigits(item.sellers)} فروشنده</td>
      <td><a href="${item.link}" target="_blank">مشاهده</a></td>
    </tr>
  ` : `
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

  // صفحه‌بندی
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.onclick = () => {
      currentPage = i;
      renderTable(data);
    };
    pagination.appendChild(btn);
  }
}

function applyFilters() {
  currentPage = 1;
  const data = currentData[currentTab] || [];
  const filtered = getFilteredData(data);
  updateStats(filtered);
  renderTable(filtered);
}

function getFilteredData(data) {
  let filtered = [...data];

  const search = document.getElementById('search-input')?.value?.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(search) || item.brand.toLowerCase().includes(search)
    );
  }

  const minPrice = parseInt(document.getElementById('price-filter')?.value) || 0;
  if (minPrice > 0) filtered = filtered.filter(i => i.price_num >= minPrice);

  const size = document.getElementById('size-filter')?.value;
  if (size) filtered = filtered.filter(i => i.size === size);

  const brand = document.getElementById('brand-filter')?.value;
  if (brand) filtered = filtered.filter(i => i.brand === brand);

  const tech = document.getElementById('tech-filter')?.value;
  if (tech) filtered = filtered.filter(i => i.tech === tech);

  return filtered;
}

function sortTable(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }

  const data = currentData[currentTab] || [];
  const filtered = getFilteredData(data);

  filtered.sort((a, b) => {
    let va = a[col], vb = b[col];
    if (col === 'price_num' || col === 'sellers') {
      va = va || 0;
      vb = vb || 0;
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    va = (va || '').toString();
    vb = (vb || '').toString();
    return sortDir === 'asc' ? va.localeCompare(vb, 'fa') : vb.localeCompare(va, 'fa');
  });

  renderTable(filtered);
}

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

  ['price-filter','size-filter','brand-filter','tech-filter','search-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('tech-filter').value = '';
    document.getElementById('search-input').value = '';
    applyFilters();
  });

  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });

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
        alert('خطا در فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('download-excel')?.addEventListener('click', () => {
    const data = currentData[currentTab] || [];
    if (!data.length) return alert('هیچ داده‌ای برای دانلود وجود ندارد');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices_${new Date().toISOString().slice(0,10)}.xlsx`);
  });

  updateUI();
});
