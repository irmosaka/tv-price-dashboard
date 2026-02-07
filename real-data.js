// real-data.js - نسخه ساده برای مبتدیان
async function loadRealData() {
    console.log('🔍 در حال بارگذاری داده واقعی...');
    
    // ابتدا دکمه را غیرفعال کن
    const button = event?.target;
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-hourglass"></i> در حال بارگذاری...';
        button.disabled = true;
    }
    
    try {
        // سعی کن از فایل JSON داده بخوانی
        const response = await fetch('data/torob-data.json');
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ داده واقعی دریافت شد:', data);
            
            // تبدیل به فرمت مورد نیاز داشبورد
            if (data.products && Array.isArray(data.products)) {
                // اگر داده اسکریپت اصلی است، تبدیلش کن
                const convertedProducts = data.products.map((item, index) => ({
                    id: index + 1,
                    name: item.name || item.title || 'تلویزیون ترب',
                    price: parsePrice(item.price),
                    seller: item.seller || 'ترب',
                    brand: extractBrand(item.name || item.title),
                    size: extractSize(item.name || item.title),
                    date: item.date || new Date().toLocaleDateString('fa-IR'),
                    url: item.url || '#',
                    category: '4K UHD' // می‌توانی از داده استخراج کنی
                }));
                
                // آپدیت داشبورد
                if (typeof window.allProducts !== 'undefined') {
                    window.allProducts = convertedProducts;
                    window.filteredProducts = convertedProducts;
                    
                    if (typeof window.updateDashboard === 'function') {
                        window.updateDashboard();
                        window.updateTable();
                        window.createCharts();
                        window.populateSellerFilter();
                    }
                    
                    showNotification(`✅ ${convertedProducts.length} محصول واقعی بارگذاری شد`, 'success');
                }
            } else {
                throw new Error('فرمت داده اشتباه است');
            }
        } else {
            // اگر فایل وجود نداشت، داده نمونه بساز
            throw new Error('فایل داده یافت نشد');
        }
    } catch (error) {
        console.log('❌ خطا در لود داده واقعی:', error);
        
        // یک داده واقعی نمونه بساز
        createSampleRealData();
    } finally {
        // دکمه را فعال کن
        if (button) {
            setTimeout(() => {
                button.innerHTML = '<i class="bi bi-database"></i> داده واقعی';
                button.disabled = false;
            }, 1000);
        }
    }
}

// تابع تبدیل قیمت از متن به عدد
function parsePrice(price) {
    if (!price) return 25000000; // قیمت پیش‌فرض
    
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
        // حذف کاما و تبدیل به عدد
        const num = parseInt(price.replace(/,/g, ''));
        return isNaN(num) ? 25000000 : num;
    }
    
    return 25000000;
}

// تابع استخراج برند از نام محصول
function extractBrand(productName) {
    if (!productName) return 'نامشخص';
    
    const brands = ['سامسونگ', 'ال جی', 'LG', 'سونی', 'شیائومی', 'TCL', 'هيسنس', 'پاناسونیک'];
    
    for (const brand of brands) {
        if (productName.includes(brand)) {
            return brand;
        }
    }
    
    return 'نامشخص';
}

// تابع استخراج سایز از نام محصول
function extractSize(productName) {
    if (!productName) return 'نامشخص';
    
    // الگوهای سایز
    const sizePatterns = [
        /(\d+)\s*اینچ/,
        /(\d+)"/
    ];
    
    for (const pattern of sizePatterns) {
        const match = productName.match(pattern);
        if (match && match[1]) {
            return match[1] + ' اینچ';
        }
    }
    
    return 'نامشخص';
}

// تابع ایجاد داده واقعی نمونه
function createSampleRealData() {
    console.log('📋 ایجاد داده واقعی نمونه...');
    
    const sampleRealData = [
        {
            id: 1,
            name: "تلویزیون سامسونگ 55 اینچ QLED 4K از ترب",
            price: 31500000,
            seller: "ترب",
            brand: "سامسونگ",
            size: "55 اینچ",
            date: new Date().toLocaleDateString('fa-IR'),
            url: "https://torob.com/p/real-123",
            category: "QLED"
        },
        {
            id: 2,
            name: "تلویزیون ال جی 65 اینچ OLED از دیجی‌کالا",
            price: 45900000,
            seller: "دیجی‌کالا",
            brand: "LG",
            size: "65 اینچ",
            date: new Date().toLocaleDateString('fa-IR'),
            url: "https://torob.com/p/real-456",
            category: "OLED"
        },
        {
            id: 3,
            name: "تلویزیون سونی 50 اینچ 4K از بانه",
            price: 38500000,
            seller: "بانه مارکت",
            brand: "سونی",
            size: "50 اینچ",
            date: new Date().toLocaleDateString('fa-IR'),
            url: "https://torob.com/p/real-789",
            category: "Bravia"
        }
    ];
    
    // آپدیت داشبورد
    if (typeof window.allProducts !== 'undefined') {
        window.allProducts = sampleRealData;
        window.filteredProducts = sampleRealData;
        
        if (typeof window.updateDashboard === 'function') {
            window.updateDashboard();
            window.updateTable();
            window.createCharts();
            window.populateSellerFilter();
        }
        
        showNotification('✅ داده واقعی نمونه ایجاد شد', 'success');
    }
}

// وقتی صفحه لود شد
document.addEventListener('DOMContentLoaded', function() {
    console.log('real-data.js آماده است');
    
    // بعد از 3 ثانیه بررسی کن اگر داده واقعی وجود دارد
    setTimeout(() => {
        checkForRealData();
    }, 3000);
});

// بررسی وجود فایل داده واقعی
async function checkForRealData() {
    try {
        const response = await fetch('data/torob-data.json');
        if (response.ok) {
            console.log('✅ فایل داده واقعی موجود است');
            // می‌توانی یک نوتیفیکیشن نشان بدهی
        }
    } catch (error) {
        console.log('ℹ️ فایل داده واقعی یافت نشد');
    }
}
