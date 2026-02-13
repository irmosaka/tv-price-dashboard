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

let myChart = null;

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
    if (lower.includes(brand.toLowerCase())) {
      return brand;
    }
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
    /[\d۰-۹]{2,3}\s*اینچ/i,
    /سایز\s*[\d۰-۹]{2,3}\s*اینچ/i
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

function updateStats(data) {
  const prices = data.map(item => item.price_num).filter(p => p > 0);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  document.getElementById('avg-price').textContent = toPersianDigits(avgPrice) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((sum, item) => sum + item.sellers, 0));
  document.getElementById('total-brands').textContent = toPersianDigits([...new Set(data.map(item => item.brand))].length);
  document.getElementById('product-count').textContent = data.length;
}

function updateSortIcons() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    const existingIcon = th.querySelector('.sort-icon');
    if (existingIcon) {
      existingIcon.remove();
    }
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

function renderChart(data) {
  const ctx = document.getElementById('price-chart');
  if (!ctx) {
    console.warn('عنصر canvas برای نمودار پیدا نشد');
    return;
  }

  if (myChart) {
    myChart.destroy();
  }

  const brandGroups = {};
  data.forEach(item => {
    if (item.brand && item.price_num > 0) {
      if (!brandGroups[item.brand]) {
        brandGroups[item.brand] = {
          total: 0,
          count: 0
        };
      }
      brandGroups[item.brand].total += item.price_num;
      brandGroups[item.brand].count += 1;
    }
  });

  const chartData = Object.entries(brandGroups)
    .map(([brand, stats]) => ({
      brand,
      avgPrice: Math.round(stats.total / stats.count)
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 10);

  const labels = chartData.map(item => item.brand);
  const prices = chartData.map(item => item.avgPrice);

  try {
    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'میانگین قیمت (تومان)',
          data: prices,
          backgroundColor: 'rgba(102, 126, 234, 0.7)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return toPersianDigits(value) + ' تومان';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `میانگین قیمت: ${toPersianDigits(context.raw)} تومان`;
              }
            }
          },
          legend: {
            labels: {
              font: {
                family: 'Vazir, Tahoma, sans-serif'
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('خطا در رسم نمودار:', error);
  }
}

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

  const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))]
    .map(s => {
      let numStr = s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      return parseInt(numStr, 10);
    })
    .filter(n => !isNaN(n) && n >= 32 && n <= 100)
    .sort((a, b) => a - b);

  document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' + 
    sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

  const brandSelect = document.getElementById('brand-filter');
  brandSelect.innerHTML = '<option value="">همه برندها</option>';

  if (currentTab === 'torob') {
    [...TOROB_BRANDS].sort((a, b) => a.localeCompare(b, 'fa')).forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
  } else {
    const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'متفرقه' && b !== 'نامشخص'))].sort((a, b) => a.localeCompare(b, 'fa'));
    brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
  }

  renderTable(data);
  renderChart(data);
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
      aVal = aVal.toLocaleLowerCase('fa');
      bVal = bVal.toLocaleLowerCase('fa');
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
    if (isTorob) {
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${toPersianDigits(item.price_num)} تومان</td>
          <td>${toPersianDigits(item.sellers)} فروشنده</td>
          <td><a href="${item.link}" target="_blank" class="product-link">مشاهده</a></td>
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
          <td><a href="${item.link}" target="_blank" class="product-link">مشاهده</a></td>
        </tr>
      `;
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
  if (minPrice > 0) {
    filtered = filtered.filter(item => item.price_num >= minPrice);
  }
  
  const selectedSize = document.getElementById('size-filter').value;
  if (selectedSize) {
    filtered = filtered.filter(item => item.size === selectedSize);
  }
  
  const selectedBrand = document.getElementById('brand-filter').value;
  if (selectedBrand) {
    filtered = filtered.filter(item => item.brand === selectedBrand);
  }
  
  const selectedTech = document.getElementById('tech-filter').value;
  if (selectedTech) {
    filtered = filtered.filter(item => item.tech === selectedTech);
  }
  
  return filtered;
}

function applyFilters() {
  currentPage = 1;
  const filteredData = getFilteredData();
  updateStats(filteredData);
  renderTable(filteredData);
  renderChart(filteredData);
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
      console.log('Chart.js loaded successfully');
      if (currentData[currentTab] && currentData[currentTab].length > 0) {
        renderChart(currentData[currentTab]);
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
      sortCol = null;
      sortDir = 'asc';
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
    if (filterValue) {
      filterValue.textContent = '۰ تومان';
    }
    currentPage = 1;
    sortCol = null;
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
      if (userSource === 'torob' || userSource === 'digikala') {
        source = userSource;
      } else {
        alert('منبع داده نامعتبر است. از digikala استفاده می‌شود.');
      }
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
