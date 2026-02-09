// dashboard.js - نسخه کامل، ضدگل‌گوله، استخراج برند دقیق از لیست ثابت

let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

// لیست برندهای مجاز (دقیقاً همان‌هایی که گفتی + سامسونگ اضافه شد)
const TOROB_BRANDS = [
  "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سام", "سامسونگ",
  "سونی", "لیماک جنرال اینترنشنال", "نکسار", "هایسنس", "ورلد استار", "پارس", "پاناسونیک"
];

// تبدیل لیست به regex برای جستجوی دقیق‌تر و سریع‌تر
const BRAND_REGEX = new RegExp(
  TOROB_BRANDS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

function toPersianDigits(num) {
  if (num === '—' || num === null || num === undefined) return '—';
  return num.toLocaleString('fa-IR');
}

function extractBrandFromTitle(title) {
  if (!title || typeof title !== 'string' || !title.trim()) return 'نامشخص';

  const match = title.match(BRAND_REGEX);
  return match ? match[0] : 'نامشخص';
}

function extractSizeAndTech(title) {
  title = String(title ?? '').trim();

  const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
  const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

  let tech = 'LED';
  const lower = title.toLowerCase();

  if (lower.includes('qled') || lower.includes('کیوالایدی') || lower.includes('q led')) tech = 'QLED';
  else if (lower.includes('oled') || lower.includes('اولد')) tech = 'OLED';

  return { size, tech };
}

function loadData(raw, source = 'digikala') {
  let processed = [];

  if (source === 'torob') {
    processed = raw.map((item, index) => {
      try {
        if (!item || typeof item !== 'object') return null;

        const title = String(item['ProductCard_desktop_product-name__JwqeK'] ?? '').trim();
        const brand = extractBrandFromTitle(title);
        const { size, tech } = extractSizeAndTech(title);

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
      const { size, tech } = extractSizeAndTech(title);
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

// بقیه توابع (updateStats, updateUI, renderTable, ...) بدون تغییر اساسی

function updateUI() {
  const data = currentData[currentTab] || [];
  if (data.length === 0) {
    document.querySelector('#product-table tbody').innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;">هیچ داده‌ای موجود نیست</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  updateStats(data);
  document.getElementById('last-update').textContent = `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;

  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  if (currentTab === 'torob') {
    TOROB_BRANDS.forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
  } else {
    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();
    brands.forEach(b => {
      brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
  }

  let techs = [...new Set(data.map(d => d.tech))].sort();
  if (!techs.includes('QLED')) techs.push('QLED');
  document.getElementById('tech-filter').innerHTML = '<option value="">همه تکنولوژی‌ها</option>' + techs.map(t => `<option value="${t}">${t}</option>`).join('');

  renderTable(data);
  updateChart(data);
}

// بقیه کد (renderTable, changePage, getFilteredData, sortTable, applyFilters, updateChart, event listenerها و دانلود اکسل) بدون تغییر اساسی

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

  ['price-filter', 'size-filter', 'brand-filter', 'tech-filter'].forEach(id => {
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

  updateUI();
});
