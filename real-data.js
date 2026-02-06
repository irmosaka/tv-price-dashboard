// real-data.js - داده‌های واقعی (توسط GitHub Actions پر می‌شه)
window.REAL_TOROB_DATA = {
  "last_updated": "هنوز اجرا نشده",
  "products": []
};

// تابع لود داده واقعی
async function loadRealData() {
  try {
    // سعی کن داده رو از فایل جداگانه بخونی
    const response = await fetch('data/torob-data.json');
    if (response.ok) {
      const data = await response.json();
      window.REAL_TOROB_DATA = data;
      showDataInDashboard();
      showNotification('✅ داده‌های واقعی بارگذاری شدند!', 'success');
    } else {
      throw new Error('فایل داده پیدا نشد');
    }
  } catch (error) {
    console.log('استفاده از داده نمونه:', error);
    // داده نمونه رو لود کن
    fetchSampleData();
  }
}

// نمایش داده در داشبورد
function showDataInDashboard() {
  const data = window.REAL_TOROB_DATA;
  
  // آپدیت تاریخ
  document.getElementById('current-date').textContent = 
    `آخرین بروزرسانی: ${data.last_updated}`;
  
  // اگر تابع‌های dashboard.js موجود هستند
  if (window.loadDataToTable && window.calculateStats && window.createChart) {
    window.loadDataToTable(data.products);
    window.calculateStats(data.products);
    window.createChart(data.products);
  } else {
    // روش ساده‌تر
    updateDashboardManually(data);
  }
}

// روش دستی برای آپدیت داشبورد
function updateDashboardManually(data) {
  // آپدیت کارت‌ها
  document.getElementById('total-models').textContent = data.products.length;
  
  if (data.products.length > 0) {
    const prices = data.products.map(p => p.price).filter(p => p);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    document.getElementById('avg-price').textContent = 
      avg.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('min-price').textContent = 
      min.toLocaleString('fa-IR') + ' تومان';
    document.getElementById('max-price').textContent = 
      max.toLocaleString('fa-IR') + ' تومان';
    
    // آپدیت جدول
    updateTable(data.products);
  }
}

// آپدیت جدول
function updateTable(products) {
  const tbody = document.getElementById('tv-table');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  products.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.name || 'نامشخص'}</strong></td>
      <td>${(item.price || 0).toLocaleString('fa-IR')} تومان</td>
      <td><span class="badge bg-info">${item.seller || 'ترب'}</span></td>
      <td>${item.date || 'نامشخص'}</td>
      <td><i class="bi bi-info-circle text-primary"></td>
    `;
    tbody.appendChild(row);
  });
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.container').prepend(alertDiv);
}

// دکمه‌های اضافه کردن به صفحه
function addRealDataButton() {
  const header = document.querySelector('.card-header .btn-light');
  if (header && header.parentNode) {
    const realDataBtn = document.createElement('button');
    realDataBtn.className = 'btn btn-success me-2';
    realDataBtn.innerHTML = '<i class="bi bi-database"></i> داده واقعی';
    realDataBtn.onclick = loadRealData;
    header.parentNode.insertBefore(realDataBtn, header);
  }
}

// وقتی صفحه لود شد
document.addEventListener('DOMContentLoaded', function() {
  // دکمه رو اضافه کن
  addRealDataButton();
  
  // بعد از ۲ ثانیه، بررسی کن اگر داده واقعی وجود داره
  setTimeout(() => {
    fetch('data/torob-data.json')
      .then(r => r.ok ? loadRealData() : null)
      .catch(() => console.log('داده واقعی یافت نشد'));
  }, 2000);
});
