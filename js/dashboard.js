// js/dashboard.js - نسخه نهایی با فیکس تمام مشکلات

let currentData = { digikala: [], torob: [] };
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

      let price_num = parseInt(String(item['ProductCard_desktop_product-price-text__y20OV'] || '0')
        .replace(/[^0-9۰-۹]/g, '')
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

      let sellers = parseInt(String(item['ProductCard_desktop_shops__mbtsF'] || '0')
        .replace(/[^0-9۰-۹]/g, '')
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

      const link = item['ProductCards_cards__MYvdn href'] || '#';

      if (price_num <= 0) return null;

      return { name: title, brand, link, price_num, sellers, size };
    }).filter(Boolean);
  } else {
    // دیجی‌کالا - دقیقاً بر اساس JSON که فرستادی
    processed = raw.map(item => {
      const title = item['ellipsis-2'] || 'نامشخص';
      const brand = extractBrand(title);
      const size = extractSize(title);

      let price_num = parseInt(String(item['flex'] || '0').replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;
      let original_price_num = parseInt(String(item['text-neutral-300'] || '0').replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

      return {
        name: title,
        brand,
        link: item['block href'] || '#',
        stock: item['text-caption'] || 'نامشخص',
        rating: item['text-body2-strong'] || '—',
        discount: item['text-body2-strong (2)'] || '—',
        price_num,
        original_price_num,
        sellers: 1,
        size
      };
    }).filter(d => d.price_num > 0);
  }

  currentData[source] = processed;
  currentTab = source;
  displayedCount = 20;
  renderUI();
}

function renderUI() {
  const data = currentData[currentTab] || [];
  if (!data.length) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:50px;">هیچ داده‌ای موجود نیست</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  updateStats(data);
  document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

  // سایزها
  const sizes = [...new Set(data.map(d => d.size).filter(Boolean))]
    .map(s => parseInt(s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10))
    .filter(n => !isNaN(n) && n >= 32 && n <= 100)
    .sort((a,b) => a-b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  // برندها
  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';
  const brands = currentTab === 'torob' ? TOROB_BRANDS : [...new Set(data.map(d => d.brand))];
  brands.sort((a,b) => a.localeCompare(b,'fa')).forEach(b => {
    brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
  });

  renderTable(data);
}

function updateStats(data) {
  const prices = data.map(i => i.price_num || i.price).filter(p => p > 0);
  const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
  document.getElementById('avg-price').textContent = toPersianDigits(avg) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((s,i)=>s+(i.sellers||0),0));
  document.getElementById('total-brands').textContent = toPersianDigits(new Set(data.map(i=>i.brand)).size);
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
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderUI();
    });
  });

  document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('file-input').click());

  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = 'digikala';
    if (file.name.toLowerCase().startsWith('torob')) source = 'torob';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        let text = ev.target.result.trim();
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        if (text.endsWith(',]')) text = text.slice(0, -2) + ']';

        const json = JSON.parse(text);
        loadData(json, source);
      } catch (err) {
        alert('خطا در فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    renderUI();
  });

  ['search-input','price-filter','size-filter','brand-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderUI);
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
