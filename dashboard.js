let currentData = { digikala: [], torob: [] };
let currentTab = 'digikala';
let currentPage = 1;
let rowsPerPage = 20;
let sortCol = null;
let sortDir = 'asc';

// لیست برندهای مجاز فقط برای تب ترب (دقیقاً همان‌هایی که گفتی)
const TOROB_BRANDS = [
  "آپلاس", "آیوا", "اسنوا", "ال جی", "ایکس ویژن", "بویمن", "تی سی ال",
  "جی بی پی", "جی وی سی", "جی پلاس", "دوو", "سام", "سونی",
  "لیماک جنرال اینترنشنال", "نکسار", "هایسنس", "ورلد استار", "پارس", "پاناسونیک"
];

function toPersianDigits(num) {
  if (num === '—' || num === null || num === undefined) return '—';
  return num.toLocaleString('fa-IR');
}

// استخراج برند فقط از لیست ثابت (دقیق و هوشمند)
function extractBrandFromTitle(title) {
  if (!title || typeof title !== 'string') return 'نامشخص';

  const lowerTitle = title.toLowerCase();

  for (const brand of TOROB_BRANDS) {
    if (lowerTitle.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'نامشخص';
}

// استخراج سایز و تکنولوژی
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
        let price_num = parseInt(String(priceText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

        let sellersText = item['ProductCard_desktop_shops__mbtsF'] ?? '0';
        let sellers = parseInt(String(sellersText).replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) || 0;

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
    // دیجی‌کالا (بدون تغییر عمده)
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

// بقیه توابع (updateStats, updateUI, renderTable, changePage, getFilteredData, sortTable, applyFilters, updateChart)

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

  // سایزها
  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  // برندها
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

  // تکنولوژی‌ها
  let techs = [...new Set(data.map(d => d.tech))].sort();
  if (!techs.includes('QLED')) techs.push('QLED');
  document.getElementById('tech-filter').innerHTML = '<option value="">همه تکنولوژی‌ها</option>' + techs.map(t => `<option value="${t}">${t}</option>`).join('');

  renderTable(data);
  updateChart(data);
}

// بقیه توابع (renderTable, changePage, getFilteredData, sortTable, applyFilters, updateChart) بدون تغییر اساسی هستند.
// برای کوتاه شدن پیام، آنها را اینجا تکرار نمی‌کنم. اگر نیاز به کامل‌ترین نسخه داری بگو.

document.addEventListener('DOMContentLoaded', () => {
  // تب‌ها
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      currentPage = 1;
      updateUI();
    });
  });

  // سورت
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col));
  });

  // فیلترها
  ['price-filter','size-filter','brand-filter','tech-filter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  // پاک کردن فیلترها
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('tech-filter').value = '';
    updateUI();
  });

  // آپلود
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
  updateUI();
});

// تابع دانلود اکسل
function downloadExcel() {
  const data = currentData[currentTab] || [];
  if (data.length === 0) return alert('هیچ داده‌ای برای دانلود وجود ندارد');

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, currentTab);
  XLSX.writeFile(wb, `${currentTab}_prices.xlsx`);
}
