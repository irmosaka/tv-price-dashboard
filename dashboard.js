// dashboard.js - نسخه حرفه‌ای و اصلاح شده
let allProducts = [];
let filteredProducts = [];
let currentChartType = 'bar';
let currentPage = 1;
const itemsPerPage = 10;

// داده نمونه برای شروع
const sampleProducts = [
    {
        id: 1,
        name: "تلویزیون سامسونگ 55 اینچ QLED 4K UA55Q70A",
        price: 32450000,
        seller: "دیجی‌کالا",
        brand: "سامسونگ",
        size: "55 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/123",
        category: "QLED"
    },
    {
        id: 2,
        name: "تلویزیون ال جی 65 اینچ 4K UHD 65NANO75",
        price: 38900000,
        seller: "ترب",
        brand: "LG",
        size: "65 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/456",
        category: "NanoCell"
    },
    {
        id: 3,
        name: "تلویزیون سونی 50 اینچ 4K Bravia XR",
        price: 41500000,
        seller: "بانه مارکت",
        brand: "سونی",
        size: "50 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/789",
        category: "Bravia"
    },
    {
        id: 4,
        name: "تلویزیون شیائومی 43 اینچ 4K Android TV",
        price: 18500000,
        seller: "شیائومی استور",
        brand: "شیائومی",
        size: "43 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/101",
        category: "Android TV"
    },
    {
        id: 5,
        name: "تلویزیون TCL 50 اینچ 4K QLED",
        price: 24500000,
        seller: "ترب",
        brand: "TCL",
        size: "50 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/202",
        category: "QLED"
    },
    {
        id: 6,
        name: "تلویزیون سامسونگ 43 اینچ Crystal 4K",
        price: 21500000,
        seller: "دیجی‌کالا",
        brand: "سامسونگ",
        size: "43 اینچ",
        date: "۱۴۰۳/۰۱/۲۷",
        url: "https://torob.com/p/303",
        category: "Crystal"
    },
    {
        id: 7,
        name: "تلویزیون LG 55 اینچ OLED C3",
        price: 48900000,
        seller: "ترب",
        brand: "LG",
        size: "55 اینچ",
        date: "۱۴۰۳/۰۱/２７",
        url: "https://torob.com/p/404",
        category: "OLED"
    },
    {
        id: 8,
        name: "تلویزیون سونی 65 اینچ 4K OLED",
        price: 53900000,
        seller: "بانه مارکت",
        brand: "سونی",
        size: "65 اینچ",
        date: "۱۴۰۳/۰۱/27",
        url: "https://torob.com/p/505",
        category: "OLED"
    },
    {
        id: 9,
        name: "تلویزیون هيسنس 50 اینچ 4K UHD",
        price: 19500000,
        seller: "ترب",
        brand: "هيسنس",
        size: "50 اینچ",
        date: "۱۴۰۳/۰۱/27",
        url: "https://torob.com/p/606",
        category: "UHD"
    },
    {
        id: 10,
        name: "تلویزیون شیائومی 55 اینچ QLED",
        price: 28500000,
        seller: "شیائومی استور",
        brand: "شیائومی",
        size: "55 اینچ",
        date: "۱۴۰۳/۰۱/27",
        url: "https://torob.com/p/707",
        category: "QLED"
    }
];

// تابع بارگذاری داده نمونه
function loadSampleData() {
    console.log('📋 بارگذاری داده نمونه...');
    allProducts = [...sampleProducts];
    filteredProducts = [...sampleProducts];
    
    updateDashboard();
    updateTable();
    createCharts();
    
    showNotification('✅ داده‌های نمونه با موفقیت بارگذاری شدند!', 'success');
}

// تابع بروزرسانی داشبورد
function updateDashboard() {
    console.log('📊 بروزرسانی داشبورد...');
    
    if (filteredProducts.length === 0) {
        console.warn('هیچ داده‌ای برای نمایش وجود ندارد');
        return;
    }
    
    // محاسبه آمار
    const stats = calculateStatistics(filteredProducts);
    
    // آپدیت کارت‌ها
    document.getElementById('total-products').textContent = stats.totalProducts;
    document.getElementById('avg-price').textContent = formatPrice(stats.avgPrice);
    document.getElementById('total-sellers').textContent = stats.totalSellers;
    document.getElementById('max-price').textContent = formatPrice(stats.maxPrice);
    
    // آپدیت تاریخ
    document.getElementById('current-date').textContent = 
        `آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}`;
    
    // آپدیت شمارنده
    document.getElementById('showing-count').textContent = filteredProducts.length;
    document.getElementById('total-count').textContent = allProducts.length;
    
    console.log('آمار محاسبه شده:', stats);
}

// تابع محاسبه آمار - درست و دقیق
function calculateStatistics(products) {
    if (!products || products.length === 0) {
        return {
            totalProducts: 0,
            avgPrice: 0,
            totalSellers: 0,
            maxPrice: 0,
            minPrice: 0
        };
    }
    
    // قیمت‌ها را استخراج کن
    const prices = products.map(p => {
        const price = typeof p.price === 'string' ? 
                     parseInt(p.price.replace(/,/g, '')) : 
                     p.price;
        return price || 0;
    }).filter(p => p > 0);
    
    // فروشنده‌های منحصر به فرد
    const sellers = [...new Set(products.map(p => p.seller).filter(s => s))];
    
    // محاسبات
    const totalProducts = products.length;
    const totalSellers = sellers.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const avgPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    
    return {
        totalProducts,
        avgPrice,
        totalSellers,
        maxPrice,
        minPrice,
        sellers: sellers
    };
}

// تابع ایجاد نمودارها
function createCharts() {
    createPriceDistributionChart();
    createBrandDistributionChart();
}

// نمودار توزیع قیمت
function createPriceDistributionChart() {
    const ctx = document.getElementById('priceDistributionChart');
    if (!ctx) return;
    
    // اگر قبلاً نموداری بود، پاکش کن
    if (window.priceChart) {
        window.priceChart.destroy();
    }
    
    // گروه‌بندی قیمت‌ها
    const priceRanges = {
        'کمتر از ۲۰M': 0,
        '۲۰-۳۰M': 0,
        '۳۰-۴۰M': 0,
        '۴۰-۵۰M': 0,
        'بیشتر از ۵۰M': 0
    };
    
    filteredProducts.forEach(product => {
        const price = product.price / 1000000; // تبدیل به میلیون تومان
        
        if (price < 20) priceRanges['کمتر از ۲۰M']++;
        else if (price >= 20 && price < 30) priceRanges['۲۰-۳۰M']++;
        else if (price >= 30 && price < 40) priceRanges['۳۰-۴۰M']++;
        else if (price >= 40 && price < 50) priceRanges['۴۰-۵۰M']++;
        else priceRanges['بیشتر از ۵۰M']++;
    });
    
    const labels = Object.keys(priceRanges);
    const data = Object.values(priceRanges);
    
    window.priceChart = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'تعداد محصولات',
                data: data,
                backgroundColor: [
                    'rgba(76, 201, 240, 0.7)',
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(58, 12, 163, 0.7)',
                    'rgba(247, 37, 133, 0.7)',
                    'rgba(255, 183, 3, 0.7)'
                ],
                borderColor: [
                    'rgba(76, 201, 240, 1)',
                    'rgba(67, 97, 238, 1)',
                    'rgba(58, 12, 163, 1)',
                    'rgba(247, 37, 133, 1)',
                    'rgba(255, 183, 3, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazir',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Vazir'
                    },
                    bodyFont: {
                        family: 'Vazir'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Vazir'
                        }
                    },
                    title: {
                        display: true,
                        text: 'تعداد محصولات',
                        font: {
                            family: 'Vazir',
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Vazir'
                        }
                    },
                    title: {
                        display: true,
                        text: 'بازه قیمت (میلیون تومان)',
                        font: {
                            family: 'Vazir',
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// نمودار توزیع برند
function createBrandDistributionChart() {
    const ctx = document.getElementById('brandDistributionChart');
    if (!ctx) return;
    
    if (window.brandChart) {
        window.brandChart.destroy();
    }
    
    // شمارش برندها
    const brandCount = {};
    filteredProducts.forEach(product => {
        const brand = product.brand || 'نامشخص';
        brandCount[brand] = (brandCount[brand] || 0) + 1;
    });
    
    const labels = Object.keys(brandCount);
    const data = Object.values(brandCount);
    
    window.brandChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(67, 97, 238, 0.8)',
                    'rgba(76, 201, 240, 0.8)',
                    'rgba(247, 37, 133, 0.8)',
                    'rgba(255, 183, 3, 0.8)',
                    'rgba(58, 12, 163, 0.8)',
                    'rgba(0, 200, 83, 0.8)'
                ],
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazir',
                            size: 11
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} محصول (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// تابع تغییر نوع نمودار
function changeChartType(type) {
    currentChartType = type;
    
    // آپدیت دکمه‌ها
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // ایجاد مجدد نمودار
    createPriceDistributionChart();
}

// تابع آپدیت جدول
function updateTable() {
    const tbody = document.getElementById('products-table');
    if (!tbody) return;
    
    // محاسبه محصولات این صفحه
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    // اگر داده‌ای وجود ندارد
    if (pageProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-exclamation-circle" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="mt-3 text-muted">هیچ محصولی یافت نشد</p>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }
    
    // ساخت ردیف‌های جدول
    let html = '';
    pageProducts.forEach((product, index) => {
        const globalIndex = startIndex + index + 1;
        
        html += `
            <tr>
                <td class="text-center fw-bold">${globalIndex}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="bi bi-tv text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${product.name}</div>
                            <small class="text-muted">${product.category || 'تلویزیون'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="price-badge">${formatPrice(product.price)}</span>
                </td>
                <td>
                    <span class="badge bg-info">${product.seller}</span>
                </td>
                <td>
                    <span class="badge bg-dark">${product.brand || 'نامشخص'}</span>
                </td>
                <td>${product.size || 'نامشخص'}</td>
                <td><small class="text-muted">${product.date}</small></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewProduct('${product.url}')" title="مشاهده">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="compareProduct(${product.id})" title="مقایسه">
                            <i class="bi bi-shuffle"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    updatePagination();
}

// تابع آپدیت صفحه‌بندی
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // دکمه قبلی
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    // صفحات
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // دکمه بعدی
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// تابع تغییر صفحه
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredProducts.length / itemsPerPage)) {
        return;
    }
    
    currentPage = page;
    updateTable();
}

// تابع اعمال فیلترها
function applyFilters() {
    const searchTerm = document.getElementById('search-product').value.toLowerCase();
    const minPrice = parseInt(document.getElementById('min-price-filter').value) || 0;
    const maxPrice = parseInt(document.getElementById('max-price-filter').value) || Infinity;
    const selectedSeller = document.getElementById('seller-filter').value;
    
    filteredProducts = allProducts.filter(product => {
        // فیلتر جستجو
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand?.toLowerCase().includes(searchTerm);
        
        // فیلتر قیمت
        const productPrice = product.price || 0;
        const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
        
        // فیلتر فروشنده
        const matchesSeller = !selectedSeller || product.seller === selectedSeller;
        
        return matchesSearch && matchesPrice && matchesSeller;
    });
    
    currentPage = 1;
    updateDashboard();
    updateTable();
    createCharts();
    
    showNotification(`✅ ${filteredProducts.length} محصول یافت شد`, 'success');
}

// تابع مشاهده محصول
function viewProduct(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    } else {
        showNotification('⚠️ لینک محصول موجود نیست', 'warning');
    }
}

// تابع مقایسه محصول
function compareProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        showNotification(`📊 محصول "${product.name}" به لیست مقایسه اضافه شد`, 'info');
        // اینجا می‌توانی منطق مقایسه را اضافه کنی
    }
}

// تابع نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
    // حذف نوتیفیکیشن‌های قبلی
    const existingAlerts = document.querySelectorAll('.alert-notification');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-notification alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        left: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 500px;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 10px;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${
                type === 'success' ? 'bi-check-circle-fill' : 
                type === 'warning' ? 'bi-exclamation-triangle-fill' : 
                'bi-info-circle-fill'
            } me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // حذف خودکار بعد از 5 ثانیه
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

// تابع ریفرش داده
function refreshData() {
    showLoading();
    showNotification('🔄 در حال بروزرسانی داده‌ها...', 'info');
    
    setTimeout(() => {
        if (typeof loadRealData === 'function') {
            loadRealData();
        } else {
            loadSampleData();
        }
    }, 1500);
}

// تابع خروجی اکسل
function exportToExcel() {
    showNotification('📊 آماده‌سازی خروجی Excel...', 'info');
    
    // شبیه‌سازی خروجی
    setTimeout(() => {
        const dataStr = JSON.stringify(allProducts, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'torob-prices.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('✅ فایل JSON دانلود شد', 'success');
    }, 1000);
}

// وقتی صفحه لود شد
document.addEventListener('DOMContentLoaded', function() {
    console.log('داشبورد حرفه‌ای راه‌اندازی شد');
    
    // بارگذاری اولیه
    setTimeout(() => {
        loadSampleData();
        
        // پر کردن لیست فروشندگان
        populateSellerFilter();
    }, 500);
});

// پر کردن فیلتر فروشندگان
function populateSellerFilter() {
    const sellerFilter = document.getElementById('seller-filter');
    if (!sellerFilter) return;
    
    // فروشندگان منحصر به فرد
    const sellers = [...new Set(allProducts.map(p => p.seller).filter(s => s))];
    
    // پاک کردن گزینه‌های فعلی (به جز اولین گزینه)
    while (sellerFilter.options.length > 1) {
        sellerFilter.remove(1);
    }
    
    // اضافه کردن فروشندگان
    sellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller;
        option.textContent = seller;
        sellerFilter.appendChild(option);
    });
}
