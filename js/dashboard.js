// js/dashboard.js - نسخه خفن نهایی

let currentData = { torob: [], digikala: [] };
let currentTab = 'torob';

const TOROB_BRANDS = [
  "سامسونگ", "سام الکترونیک", "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سونی", "لیماک جنرال اینترنشنال", "نکسار", "هایسنس",
  "ورلد استار", "پارس", "پاناسونیک"
];

function toPersianDigits(n) {
  if (n == null) return '—';
  return n.toLocaleString('fa-IR');
}

function extractBrand(title) {
  if (!title) return 'متفرقه';
  const l = title.toLowerCase();
  if (l.includes('سامسونگ')) return 'سامسونگ';
  if (l.includes('سام الکترونیک') || l.includes('سام')) return 'سام الکترونیک';
  for (const b of TOROB_BRANDS) if (l.includes(b.toLowerCase())) return b;
  return 'متفرقه';
}

function extractSize(title) {
  if (!title) return 'نامشخص';
  const n = title.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d - '0'])
                .replace(/[\u200C\u200D]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

  const m = n.match(/(\d{2,3})\s*اینچ|سایز\s*(\d{2,3})|اندازه\s*(\d{2,3})/i);
  if (m) {
    const num = parseInt((m[1] || m[2] || m[3]).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10);
    if (num >= 32 && num <= 100) return num.toString();
  }
  return 'نامشخص';
}

function loadData(raw, source) {
  const processed = raw.map(item => {
    const title = String(item['ProductCard_desktop_product-name__JwqeK'] || item['ellipsis-2'] || '').trim();
    return {
      name: title || 'نامشخص',
      brand: extractBrand(title),
      price: parseInt((item['ProductCard_desktop_product-price-text__y20OV'] || item['flex'] || '0').replace(/[^0-9]/g,'')) || 0,
      sellers: parseInt((item['ProductCard_desktop_shops__mbtsF'] || '0').replace(/[^0-9]/g,'')) || 1,
      link: item['ProductCards_cards__MYvdn href'] || item['block href'] || '#',
      size: extractSize(title)
    };
  }).filter(i => i.price > 0);

  currentData[source] = processed;
  currentTab = source;
  renderUI();
}

function renderUI() {
  const data = currentData[currentTab] || [];
  if (!data.length) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="5" class="text-center py-20 text-slate-500 dark:text-slate-400 text-lg">هیچ داده‌ای موجود نیست</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  // Stats
  const prices = data.map(i => i.price).filter(p => p > 0);
  document.getElementById('avg-price').textContent = toPersianDigits(prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((s,i)=>s+i.sellers,0));
  document.getElementById('total-brands').textContent = toPersianDigits(new Set(data.map(i=>i.brand)).size);

  // سایزها
  const sizes = [...new Set(data.map(d => d.size).filter(Boolean))]
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n))
    .sort((a,b)=>a-b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  // برندها
  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';
  (currentTab === 'torob' ? TOROB_BRANDS : [...new Set(data.map(d => d.brand))]).forEach(b => {
    brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
  });

  renderTable(data);
}

function renderTable(data) {
  const tbody = document.querySelector('#product-table tbody');
  tbody.innerHTML = data.map(item => `
    <tr class="hover:bg-indigo-50 dark:hover:bg-slate-700/50 transition-colors">
      <td class="px-6 py-4 font-medium">${item.name}</td>
      <td class="px-6 py-4">${item.brand}</td>
      <td class="px-6 py-4">${toPersianDigits(item.price)} تومان</td>
      <td class="px-6 py-4">${toPersianDigits(item.sellers)} فروشنده</td>
      <td class="px-6 py-4">
        <a href="${item.link}" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline">مشاهده</a>
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // دارک مود
  const toggle = document.getElementById('theme-toggle');
  const isDark = localStorage.getItem('darkMode') !== 'false';
  document.documentElement.classList.toggle('dark', isDark);
  toggle.querySelector('.light-icon').classList.toggle('hidden', isDark);
  toggle.querySelector('.dark-icon').classList.toggle('hidden', !isDark);

  toggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', dark);
    toggle.querySelector('.light-icon').classList.toggle('hidden', dark);
    toggle.querySelector('.dark-icon').classList.toggle('hidden', !dark);
  });

  // تب‌ها
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderUI();
    });
  });

  // آپلود
  document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('file-input').click());

  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = file.name.toLowerCase().startsWith('torob') ? 'torob' : 'digikala';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result);
        loadData(json, source);
      } catch (err) {
        alert('خطا در فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // فیلترها
  ['search-input','price-filter','size-filter','brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderUI);
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    renderUI();
  });

  document.getElementById('download-excel').addEventListener('click', () => {
    const data = currentData[currentTab] || [];
    if (!data.length) return alert('داده‌ای وجود ندارد');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices_${new Date().toISOString().slice(0,10)}.xlsx`);
  });

  renderUI();
});
