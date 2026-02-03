// آدرس API بک‌اند
const API_URL = 'http://localhost:3000/api/scrape';

// فیلترهای پیشرفته
const filters = {
    brand: 'all',
    minPrice: 0,
    maxPrice: 50000000,
    minSize: 32,
    maxSize: 85,
    minDiscount: 0,
    inStock: false
};

// دریافت داده از API
async function fetchTVData() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}?brand=${filters.brand}`);
        
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            updateAll(result.data);
            updateLastUpdate(result.lastUpdated);
            showNotification(`✅ ${result.data.length} محصول دریافت شد`);
        } else {
            throw new Error(result.error || 'خطا در دریافت داده');
        }
    } catch (error) {
        console.error('خطا:', error);
        showNotification(`❌ خطا: ${error.message}`, 'error');
        // در صورت خطا، داده‌های نمونه نمایش داده می‌شود
        updateAll(generateSampleData());
    } finally {
        showLoading(false);
    }
}

// فیلتر کردن داده‌ها
function filterData(data) {
    return data.filter(item => {
        return (
            (filters.brand === 'all' || item.brand === filters.brand) &&
            item.price >= filters.minPrice &&
            item.price <= filters.maxPrice &&
            item.size >= filters.minSize &&
            item.size <= filters.maxSize &&
            item.discount >= filters.minDiscount &&
            (!filters.inStock || item.status === 'موجود')
        );
    });
}

// آپدیت فیلترها در صفحه
function updateFiltersUI() {
    document.getElementById('brandFilter').value = filters.brand;
    document.getElementById('minPrice').value = filters.minPrice;
    document.getElementById('maxPrice').value = filters.maxPrice;
    document.getElementById('sizeRange').value = filters.minSize;
    document.getElementById('discountFilter').value = filters.minDiscount;
    document.getElementById('inStockFilter').checked = filters.inStock;
    
    // نمایش محدوده قیمت
    document.getElementById('priceRange').textContent = 
        `${formatPrice(filters.minPrice)} - ${formatPrice(filters.maxPrice)}`;
    document.getElementById('sizeValue').textContent = `${filters.minSize} اینچ`;
}

// اضافه کردن فیلترهای پیشرفته به HTML
function addAdvancedFilters() {
    const controlsDiv = document.querySelector('.controls');
    
    const advancedFilters = `
        <div class="advanced-filters">
            <div class="filter-group">
                <label for="minPrice">حداقل قیمت:</label>
                <input type="range" id="minPrice" min="0" max="100000000" step="1000000" value="0">
                <span id="priceRange">0 - 50,000,000 تومان</span>
            </div>
            
            <div class="filter-group">
                <label for="sizeRange">حداقل اندازه:</label>
                <input type="range" id="sizeRange" min="32" max="85" step="1" value="32">
                <span id="sizeValue">32 اینچ</span>
            </div>
            
            <div class="filter-group">
                <label for="discountFilter">حداقل تخفیف:</label>
                <input type="range" id="discountFilter" min="0" max="50" step="5" value="0">
                <span id="discountValue">0%</span>
            </div>
            
            <div class="filter-group checkbox">
                <input type="checkbox" id="inStockFilter">
                <label for="inStockFilter">فقط موجود</label>
            </div>
        </div>
    `;
    
    controlsDiv.insertAdjacentHTML('beforeend', advancedFilters);
    
    // اضافه کردن event listeners برای فیلترها
    document.getElementById('minPrice').addEventListener('input', function(e) {
        filters.minPrice = parseInt(e.target.value);
        updateFiltersUI();
        fetchTVData();
    });
    
    document.getElementById('sizeRange').addEventListener('input', function(e) {
        filters.minSize = parseInt(e.target.value);
        updateFiltersUI();
        fetchTVData();
    });
    
    // ... بقیه event listeners
}
