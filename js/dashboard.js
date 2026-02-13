// js/dashboard.js - نسخه خفن و نهایی

let currentData = { torob: [], digikala: [] };
let currentTab = 'torob';
let displayedCount = 20;

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
  let processed = [];

  if (source === 'torob') {
    processed = raw.map(item => {
      const title = String(item['ProductCard_desktop_product-name__JwqeK'] || '').trim();
      const brand = extractBrand(title);
      const size = extractSize(title);

      let price = parseInt(String(item['ProductCard_desktop_product-price-text__y20OV'] || '0').replace(/[^0-9]/g, '')) || 0;
      let sellers = parseInt(String(item['ProductCard_desktop_shops__mbtsF'] || '0').replace(/[^0-9]/g, '')) || 0;
      const link = item['ProductCards_cards__MYvdn href'] || '#';

      if (price <= 0) return null;

      return { name: title, brand, price, sellers, link, size };
    }).filter(Boolean);
  } else {
    processed = raw.map(item => {
      const title = item['ellipsis-2'] || 'نامشخص';
      const brand = extractBrand(title);
      const size = extractSize(title);
      let price = parseInt(String(item['flex'] || '0').replace(/[^0-9]/g, '')) || 0;
      return { name: title, brand, price, sellers: 1, link: item['block href'] || '#', size };
    }).filter(i => i.price > 0);
  }

  currentData[source] = processed;
  currentTab = source;
  displayedCount = 20;
  renderUI();
}

function renderUI() {
  const data = currentData[currentTab] || [];
  if (!data.length) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="5" class="text-center py-20 text-gray-500 dark:text-gray-400">هیچ داده‌ای موجود نیست</td></tr>';
    return;
  }

  updateStats(data);
  renderTable(data.slice(0, displayedCount));
}

function updateStats(data) {
  const prices = data.map(i => i.price).filter(p => p > 0);
  document.getElementById('avg-price').textContent = toPersianDigits(prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((s,i)=>s+i.sellers,0));
  document.getElementById('total-brands').textContent = toPersianDigits(new Set(data.map(i=>i.brand)).size);
}

function renderTable(data) {
  const tbody = document.querySelector('#product-table tbody');
  tbody.innerHTML = data.map(item => `
    <tr class="hover:bg-blue-50 dark:hover:bg-slate-700 transition">
      <td class="px-6 py-4">${item.name}</td>
      <td class="px-6 py-4 font-medium">${item.brand}</td>
      <td class="px-6 py-4">${toPersianDigits(item.price)} تومان</td>
      <td class="px-6 py-4">${toPersianDigits(item.sellers)} فروشنده</td>
      <td class="px-6 py-4">
        <a href="${item.link}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">مشاهده</a>
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // دارک مود
  const toggle = document.getElementById('theme-toggle');
  const isDark = localStorage.getItem('darkMode') === 'true';
  document.documentElement.classList.toggle('dark', isDark);
  toggle.textContent = isDark ? '☀️' : '🌙';

  toggle.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', dark);
    toggle.textContent = dark ? '☀️' : '🌙';
  });

  // تب‌ها
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      displayedCount = 20;
      renderUI();
    });
  });

  // آپلود
  document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('file-input').click());

  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = 'digikala';
    if (file.name.toLowerCase().startsWith('torob')) source = 'torob';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result);
        loadData(json, source);
      } catch (err) {
        alert('خطا: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // بارگذاری بیشتر
  document.getElementById('load-more').addEventListener('click', () => {
    displayedCount += 20;
    renderUI();
  });

  // فیلترها
  ['search-input','price-filter','size-filter','brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      displayedCount = 20;
      renderUI();
    });
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    displayedCount = 20;
    renderUI();
  });

  document.getElementById('download-excel').addEventListener('click', () => {
    const data = currentData[currentTab] || [];
    if (!data.length) return alert('داده‌ای وجود ندارد');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices.xlsx`);
  });

  renderUI();
});
