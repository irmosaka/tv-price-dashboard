// real-data-digikala.js - نسخه مخصوص دیجی‌کالا
window.DIGIKALA_DATA = {
  "last_updated": "در حال بارگذاری...",
  "products": []
};

// تابع اصلی بارگذاری داده از دیجی‌کالا
async function loadDigikalaData() {
  console.log('🔍 شروع بارگذاری داده از دیجی‌کالا...');
  
  // نمایش وضعیت بارگذاری
  showLoadingState(true);
  
  try {
    // اول سعی کن از فایل JSON دیجی‌کالا بخونی
    const response = await fetch('data/digikala-data.json');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ داده دیجی‌کالا دریافت شد:', data);
      
      window.DIGIKALA_DATA = data;
      processDigikalaData(data);
      showNotification('✅ داده‌های واقعی از دیجی‌کالا بارگذاری شدند!', 'success');
      
    } else {
      // اگر فایل وجود نداشت، داده نمونه بساز
      console.log('❌ فایل دیجی‌کالا یافت نشد، استفاده از داده تستی');
      useDigikalaSampleData();
    }
    
  } catch (error) {
    console.log('❌ خطا در لود داده دیجی‌کالا:', error);
    useDigikalaSampleData();
  } finally {
    showLoadingState(false);
  }
}

// پردازش داده دیجی‌کالا
function processDigikalaData(data) {
  console.log('🔄 پردازش داده دیجی‌کالا...');
  
  // تبدیل به فرمت استاندارد داشبورد
  const processedProducts = data.products.map(product => ({
    id: product.id || Math.floor(Math.random() * 1000),
    name: product.name || 'تلویزیون دیجی‌کالا',
    price: product.price || 25000000,
    seller: product.seller || 'دیجی‌کالا',
    brand: product.brand || extractBrandFromName(product.name),
    size: product.size || extractSizeFromName(product.name),
    date: product.persian_date || new Date().toLocaleDateString('fa-IR'),
    url: product.url || '#',
    category: product.category || 'تلویزیون'
  }));
  
  // آپدیت داشبورد
  updateDashboardWithData(processedProducts, data.persian_last_updated || data.last_updated);
}

// استفاده از داده نمونه دیجی‌کالا
function useDigikalaSampleData() {
  console.log('📋 استفاده از داده نمونه دیجی‌کالا');
  
  const sampleData = {
    "last_updated": new Date().toLocaleString('fa-IR'),
    "products": [
      {
        "id": 1,
        "name": "تلویزیون سامسونگ 55 اینچ 4K UHD Smart TV CU8000",
        "price": 32900000,
        "seller": "دیجی‌کالا",
        "brand": "سامسونگ",
        "size": "55 اینچ",
        "date": new Date().toLocaleDateString('fa-IR'),
        "url": "https://www.digikala.com/product/dkp-1234567",
        "category": "4K UHD"
      },
      {
        "id": 2,
        "name": "تلویزیون ال جی 65 اینچ 4K UHD NanoCell 65NANO75",
        "price": 41900000,
        "seller": "دیجی‌کالا",
        "brand": "LG",
        "size": "65 اینچ",
        "date": new Date().toLocaleDateString('fa-IR'),
        "url": "https://www.digikala.com/product/dkp-7654321",
        "category": "NanoCell"
      },
      {
        "id": 3,
        "name": "تلویزیون سونی 50 اینچ 4K Bravia KD50X75K",
        "price": 28900000,
        "seller": "دیجی‌کالا",
        "brand": "سونی",
        "size": "50 اینچ",
        "date": new Date().toLocaleDateString('fa-IR'),
        "url": "https://www.digikala.com/product/dkp-9876543",
        "category": "Bravia"
      },
      {
        "id": 4,
        "name": "تلویزیون شیائومی 43 اینچ 4K Android TV A Series",
        "price": 18500000,
        "seller": "دیجی‌کالا",
        "brand": "شیائومی",
        "size": "43 اینچ",
        "date": new Date().toLocaleDateString('fa-IR'),
        "url": "https://www.digikala.com/product/dkp-4567890",
        "category": "Android TV"
      },
      {
        "id": 5,
        "name": "تلویزیون TCL 50 اینچ 4K QLED C645",
        "price": 24500000,
        "seller": "دیجی‌کالا",
        "brand": "TCL",
        "size": "50 اینچ",
        "date": new Date().toLocaleDateString('fa-IR'),
        "url": "https://www.digikala.com/product/dkp-1357924",
        "category": "QLED"
      }
    ]
  };
  
  window.DIGIKALA_DATA = sampleData;
  processDigikalaData(sampleData);
  
  showNotification('⚠️ از داده نمونه دیجی‌کالا استفاده شد. اسکریپت را اجرا کنید.', 'warning');
}

// آپدیت داشبورد با داده جدید
function updateDashboardWithData(products, lastUpdated) {
  console.log('📊 آپدیت داشبورد با داده دیجی‌کالا');
  
  if (!products || products.length === 0) {
    console.warn('هیچ داده‌ای برای نمایش وجود ندارد');
    return;
  }
  
  // اگر داشبورد اصلی موجود است
  if (typeof window.allProducts !== 'undefined') {
    window.allProducts = products;
    window.filteredProducts = products;
    
    // آپدیت تاریخ
    document.getElementById('current-date').textContent = 
      `آخرین بروزرسانی: ${lastUpdated} (دیجی‌کالا)`;
    
    // آپدیت داشبورد
    if (typeof window.updateDashboard === 'function') {
      window.updateDashboard();
      window.updateTable();
      window.createCharts();
      window.populateSellerFilter();
    }
    
    console.log(`✅ ${products.length} محصول از دیجی‌کالا نمایش داده شد`);
    
  } else {
    // اگر داشبورد موجود نیست، یک نسخه ساده نمایش بده
    displaySimpleDigikalaData(products, lastUpdated);
  }
}

// نمایش ساده داده (اگر داشبورد لود نشده)
function displaySimpleDigikalaData(products, lastUpdated) {
  const container = document.querySelector('.container');
  if (!container) return;
  
  let html = `
    <div class="alert alert-info mt-3">
      <h5><i class="bi bi-shop me-2"></i>داده‌های دیجی‌کالا</h5>
      <p>آخرین بروزرسانی: ${lastUpdated}</p>
      <p>تعداد محصولات: ${products.length}</p>
    </div>
    
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-dark">
          <tr>
            <th>نام محصول</th>
            <th>قیمت</th>
            <th>برند</th>
            <th>سایز</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  products.forEach(product => {
    html += `
      <tr>
        <td>${product.name}</td>
        <td><strong>${product.price.toLocaleString('fa-IR')} تومان</strong></td>
        <td><span class="badge bg-primary">${product.brand}</span></td>
        <td>${product.size}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', html);
}

// استخراج برند از نام
function extractBrandFromName(name) {
  const brands = [
    { keywords: ['سامسونگ', 'samsung', 'SAMSUNG'], brand: 'سامسونگ' },
    { keywords: ['ال جی', 'lg', 'LG', 'الجی'], brand: 'LG' },
    { keywords: ['سونی', 'sony', 'SONY'], brand: 'سونی' },
    { keywords: ['شیائومی', 'xiaomi', 'XIAOMI'], brand: 'شیائومی' },
    { keywords: ['tcl', 'TCL'], brand: 'TCL' },
    { keywords: ['هيسنس', 'hisense', 'Hisense'], brand: 'هيسنس' },
    { keywords: ['پاناسونیک', 'panasonic', 'Panasonic'], brand: 'پاناسونیک' }
  ];
  
  if (!name) return 'نامشخص';
  
  const lowerName = name.toLowerCase();
  
  for (const item of brands) {
    for (const keyword of item.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return item.brand;
      }
    }
  }
  
  return 'نامشخص';
}

// استخراج سایز از نام
function extractSizeFromName(name) {
  if (!name) return 'نامشخص';
  
  const sizeMatch = name.match(/(\d+)\s*(اینچ|inch|"|INCH)/i);
  if (sizeMatch && sizeMatch[1]) {
    return sizeMatch[1] + ' اینچ';
  }
  
  return 'نامشخص';
}

// نمایش وضعیت بارگذاری
function showLoadingState(loading) {
  const button = document.getElementById('digikala-btn');
  if (button) {
    if (loading) {
      button.innerHTML = '<i class="bi bi-hourglass"></i> در حال بارگذاری...';
      button.disabled = true;
    } else {
      button.innerHTML = '<i class="bi bi-shop"></i> داده دیجی‌کالا';
      button.disabled = false;
    }
  }
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 
                   type === 'warning' ? 'bi-exclamation-triangle-fill' : 
                   'bi-info-circle-fill'} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.querySelector('.container').prepend(alertDiv);
  
  // حذف خودکار
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// اجرای اسکریپت روی GitHub
function runDigikalaScraper() {
  showNotification('🚀 درخواست اجرای اسکریپت دیجی‌کالا ارسال شد...', 'info');
  
  // می‌توانی اینجا GitHub API را صدا بزنی
  // اما برای سادگی، فقط راهنمایی نشان بده
  setTimeout(() => {
    const instructions = `
      <div class="alert alert-info">
        <h5><i class="bi bi-info-circle me-2"></i>راهنمای اجرای اسکریپت:</h5>
        <ol>
          <li>به مخزن خود در GitHub بروید</li>
          <li>به تب <strong>Actions</strong> بروید</li>
          <li>روی <strong>Scrape Digikala TV Prices</strong> کلیک کنید</li>
          <li>دکمه <strong>Run workflow</strong> را بزنید</li>
          <li>۲ دقیقه صبر کنید و صفحه را رفرش کنید</li>
        </ol>
        <p class="mb-1">یا مستقیم این لینک را باز کنید:</p>
        <code>https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/digikala-scraper.yml</code>
      </div>
    `;
    
    document.querySelector('.container').insertAdjacentHTML('afterbegin', instructions);
  }, 1000);
}

// اضافه کردن دکمه به صفحه
function addDigikalaButton() {
  // اگر دکمه از قبل وجود دارد، اضافه نکن
  if (document.getElementById('digikala-btn')) return;
  
  const header = document.querySelector('.card-header');
  if (header) {
    const buttonGroup = header.querySelector('.btn-group');
    if (buttonGroup) {
      const digikalaBtn = document.createElement('button');
      digikalaBtn.id = 'digikala-btn';
      digikalaBtn.className = 'btn btn-primary me-2';
      digikalaBtn.innerHTML = '<i class="bi bi-shop"></i> داده دیجی‌کالا';
      digikalaBtn.onclick = loadDigikalaData;
      
      buttonGroup.prepend(digikalaBtn);
      
      // دکمه اجرای اسکریپت
      const runBtn = document.createElement('button');
      runBtn.className = 'btn btn-warning me-2';
      runBtn.innerHTML = '<i class="bi bi-play-circle"></i> اجرای اسکریپت';
      runBtn.onclick = runDigikalaScraper;
      
      buttonGroup.prepend(runBtn);
      
      console.log('✅ دکمه‌های دیجی‌کالا اضافه شدند');
    }
  }
}

// وقتی صفحه لود شد
document.addEventListener('DOMContentLoaded', function() {
  console.log('دیجی‌کالا اسکریپت آماده است');
  
  // اضافه کردن دکمه‌ها
  addDigikalaButton();
  
  // بعد از 2 ثانیه بررسی کن اگر داده دیجی‌کالا وجود دارد
  setTimeout(() => {
    checkForDigikalaData();
  }, 2000);
});

// بررسی وجود داده دیجی‌کالا
async function checkForDigikalaData() {
  try {
    const response = await fetch('data/digikala-data.json');
    if (response.ok) {
      console.log('✅ فایل داده دیجی‌کالا موجود است');
      
      // اگر دکمه وجود دارد، رنگش را تغییر بده
      const btn = document.getElementById('digikala-btn');
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        btn.title = 'داده واقعی موجود است';
      }
      
      // یک نوتیفیکیشن کوچک نشان بده
      showNotification('📊 داده دیجی‌کالا موجود است. روی دکمه کلیک کنید!', 'info');
    }
  } catch (error) {
    console.log('ℹ️ فایل داده دیجی‌کالا یافت نشد');
  }
}
