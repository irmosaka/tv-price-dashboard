// داده‌های نمونه (شبیه‌سازی خروجی اسکریپت ترب)
const sampleData = {
    "last_updated": "۱۴۰۳/۰۱/۲۰ - ۱۵:۳۰",
    "products": [
        {
            "id": 1,
            "name": "تلویزیون سامسونگ ۵۵ اینچ QLED 4K",
            "price": 28500000,
            "seller": "دیجی‌کالا",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "down"
        },
        {
            "id": 2,
            "name": "تلویزیون LG 65 اینچ NanoCell",
            "price": 34900000,
            "seller": "ترب",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "up"
        },
        {
            "id": 3,
            "name": "تلویزیون سونی ۵۵ اینچ Bravia XR",
            "price": 32500000,
            "seller": "بانه مارکت",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "stable"
        },
        {
            "id": 4,
            "name": "تلویزیون شیائومی ۵۰ اینچ 4K",
            "price": 18500000,
            "seller": "شیائومی استور",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "down"
        },
        {
            "id": 5,
            "name": "تلویزیون TCL ۴۳ اینچ Android",
            "price": 21500000,
            "seller": "ترب",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "stable"
        },
        {
            "id": 6,
            "name": "تلویزیون سامسونگ ۶۵ اینچ Neo QLED",
            "price": 42900000,
            "seller": "دیجی‌کالا",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "up"
        },
        {
            "id": 7,
            "name": "تلویزیون الجی ۵۵ اینچ OLED",
            "price": 38900000,
            "seller": "ترب",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "down"
        },
        {
            "id": 8,
            "name": "تلویزیون سونی ۶۵ اینچ OLED",
            "price": 47900000,
            "seller": "بانه مارکت",
            "date": "۱۴۰۳/۰۱/۲۰",
            "trend": "stable"
        }
    ]
};

// تابع فرمت کردن قیمت به فارسی
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " تومان";
}

// تابع بارگذاری داده در جدول
function loadDataToTable(data) {
    const tableBody = document.getElementById('tv-table');
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // تعیین آیکون وضعیت
        let statusIcon, statusClass, statusText;
        switch(item.trend) {
            case 'up':
                statusIcon = 'bi-arrow-up-circle-fill';
                statusClass = 'price-up';
                statusText = 'افزایش قیمت';
                break;
            case 'down':
                statusIcon = 'bi-arrow-down-circle-fill';
                statusClass = 'price-down';
                statusText = 'کاهش قیمت';
                break;
            default:
                statusIcon = 'bi-dash-circle-fill';
                statusClass = 'text-secondary';
                statusText = 'ثابت';
        }
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td><span class="fw-bold">${formatPrice(item.price)}</span></td>
            <td><span class="badge bg-info">${item.seller}</span></td>
            <td>${item.date}</td>
            <td><i class="bi ${statusIcon} ${statusClass} me-1"></i> ${statusText}</td>
        `;
        tableBody.appendChild(row);
    });
}

// تابع محاسبه آمار
function calculateStats(data) {
    const prices = data.map(item => item.price);
    const totalModels = data.length;
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // آپدیت آمار در صفحه
    document.getElementById('total-models').textContent = totalModels;
    document.getElementById('avg-price').textContent = formatPrice(avgPrice);
    document.getElementById('min-price').textContent = formatPrice(minPrice);
    document.getElementById('max-price').textContent = formatPrice(maxPrice);
    document.getElementById('current-date').textContent = `آخرین بروزرسانی: ${sampleData.last_updated}`;
}

// تابع ایجاد نمودار
function createChart(data) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // گروه‌بندی داده‌ها بر اساس برند
    const brands = {};
    data.forEach(item => {
        const brand = item.name.split(' ')[0]; // اولین کلمه = نام برند
        if (!brands[brand]) {
            brands[brand] = {
                total: 0,
                count: 0
            };
        }
        brands[brand].total += item.price;
        brands[brand].count += 1;
    });
    
    const labels = Object.keys(brands);
    const avgPrices = labels.map(brand => Math.round(brands[brand].total / brands[brand].count));
    
    // تخریب نمودار قبلی اگر وجود دارد
    if (window.priceChart instanceof Chart) {
        window.priceChart.destroy();
    }
    
    // ایجاد نمودار جدید
    window.priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'میانگین قیمت (تومان)',
                data: avgPrices,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(118, 75, 162, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatPrice(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return (value / 1000000) + 'M';
                        }
                    },
                    title: {
                        display: true,
                        text: 'قیمت (میلیون تومان)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'برند تلویزیون'
                    }
                }
            }
        }
    });
}

// تابع اعمال فیلترها
function applyFilters() {
    let filteredData = [...sampleData.products];
    
    // فیلتر جستجوی متن
    const searchTerm = document.getElementById('search-model').value.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // فیلتر حداقل قیمت
    const minPrice = document.getElementById('min-price-filter').value;
    if (minPrice) {
        filteredData = filteredData.filter(item => item.price >= parseInt(minPrice));
    }
    
    // فیلتر حداکثر قیمت
    const maxPrice = document.getElementById('max-price-filter').value;
    if (maxPrice) {
        filteredData = filteredData.filter(item => item.price <= parseInt(maxPrice));
    }
    
    // مرتب‌سازی
    const sortBy = document.getElementById('sort-by').value;
    switch(sortBy) {
        case 'price-asc':
            filteredData.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredData.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredData.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
            break;
    }
    
    // آپدیت صفحه با داده‌های فیلتر شده
    loadDataToTable(filteredData);
    calculateStats(filteredData);
    createChart(filteredData);
}

// تابع بارگذاری داده نمونه
function loadSampleData() {
    // شبیه‌سازی بارگذاری
    document.getElementById('current-date').textContent = 'در حال بارگذاری داده...';
    
    setTimeout(() => {
        loadDataToTable(sampleData.products);
        calculateStats(sampleData.products);
        createChart(sampleData.products);
        
        // ریست فیلترها
        document.getElementById('search-model').value = '';
        document.getElementById('min-price-filter').value = '';
        document.getElementById('max-price-filter').value = '';
        document.getElementById('sort-by').value = 'price-asc';
        
        // نمایش پیام موفقیت
        alert('✅ داده‌های نمونه با موفقیت بارگذاری شدند!');
    }, 800);
}

// تابع شبیه‌سازی اجرای اسکریپت اصلی
function simulateScraping() {
    alert('🚀 در حال شبیه‌سازی اجرای اسکریپت اصلی...\n\nاین مراحل انجام می‌شوند:\n1. خواندن لیست تلویزیون‌ها از فایل Excel\n2. جستجو در گوگل برای هر مدل\n3. استخراج قیمت از سایت ترب\n4. ذخیره در JSON و Excel\n\nبرای اجرای واقعی، اسکریپت اصلی را روی کامپیوتر خود اجرا کنید.');
}

// بارگذاری اولیه صفحه
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    
    // اضافه کردن رویداد به دکمه‌ها
    document.querySelector('.refresh-btn').addEventListener('click', loadSampleData);
    
    // اضافه کردن رویداد جستجو با Enter
    document.getElementById('search-model').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            applyFilters();
        }
    });
});
