// تابع کمکی برای استخراج سایز و برند از عنوان
function extractSizeAndBrand(title) {
    // سایز: نزدیک‌ترین عدد قبل از "اینچ" یا "اینج"
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : null;

    // برند: متن بعد از "ال ای دی" تا "مدل" یا انتها
    const brandMatch = title.match(/ال\s*ای\s*دی\s+([^مدل]+?)(?:\s+مدل|$)/i);
    let brand = brandMatch ? brandMatch[1].trim() : null;
    
    // تمیز کردن برند (حذف کلمات اضافی مثل "هوشمند" اگر لازم)
    if (brand) {
        brand = brand.replace(/\s*هوشمند\s*/gi, '').trim();
    }

    return { size, brand };
}

fetch('daily_prices.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('فایل daily_prices.json پیدا نشد یا مشکل شبکه');
        }
        return response.json();
    })
    .then(rawData => {
        // پردازش داده‌ها
        const data = rawData.map(item => {
            const title = item['ellipsis-2'] || 'نامشخص';
            const { size, brand } = extractSizeAndBrand(title);

            let priceStr = item['flex'] || '0';
            priceStr = priceStr.replace(/[^0-9]/g, '');

            let origStr = item['text-neutral-300'] || priceStr;
            origStr = origStr.replace(/[^0-9]/g, '');

            return {
                name: title,
                link: item['block href'] || '#',
                stock: item['text-caption'] || 'نامشخص',
                rating: item['text-body2-strong'] || '—',
                discount: item['text-body2-strong (2)'] || '—',
                price_num: parseInt(priceStr) || 0,
                original_price_num: parseInt(origStr) || 0,
                sellers: (item['text-caption'] || '').includes('موجود') || (item['text-caption'] || '').includes('باقی مانده') ? 1 : 0,
                size: size || 'نامشخص',
                brand: brand || 'نامشخص'
            };
        }).filter(item => item.price_num > 0);

        // گرفتن لیست منحصربه‌فرد سایزها و برندها برای select
        const uniqueSizes = [...new Set(data.map(i => i.size).filter(Boolean))].sort((a,b) => Number(a)-Number(b));
        const uniqueBrands = [...new Set(data.map(i => i.brand).filter(Boolean))].sort();

        // پر کردن select سایز
        const sizeSelect = document.getElementById('size-filter');
        sizeSelect.innerHTML = '<option value="">همه سایزها</option>' + 
            uniqueSizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

        // پر کردن select برند
        const brandSelect = document.getElementById('brand-filter');
        brandSelect.innerHTML = '<option value="">همه برندها</option>' + 
            uniqueBrands.map(b => `<option value="${b}">${b}</option>`).join('');

        // تابع رندر
        function render(filteredData) {
            const prices = filteredData.map(i => i.price_num);
            const avg = prices.length ? (prices.reduce((a,b)=>a+b,0) / prices.length).toFixed(0) : 0;
            const totalSellers = filteredData.reduce((sum, i) => sum + i.sellers, 0);
            
            document.getElementById('avg-price').textContent = Number(avg).toLocaleString('fa-IR') + ' تومان';
            document.getElementById('total-items').textContent = filteredData.length;
            document.getElementById('total-sellers').textContent = totalSellers;

            const tbody = document.querySelector('#product-table tbody');
            tbody.innerHTML = '';
            filteredData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.original_price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.discount}</td>
                    <td>${item.rating}</td>
                    <td>${item.stock}</td>
                    <td><a href="${item.link}" target="_blank" rel="noopener">مشاهده</a></td>
                `;
                tbody.appendChild(row);
            });

            // چارت
            const ctx = document.getElementById('price-chart').getContext('2d');
            if (window.myChart) window.myChart.destroy();
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: filteredData.map(i => i.name.substring(0, 25) + (i.name.length > 25 ? '...' : '')),
                    datasets: [{
                        label: 'قیمت فروش (تومان)',
                        data: filteredData.map(i => i.price_num),
                        backgroundColor: 'rgba(37, 99, 235, 0.35)',
                        borderColor: 'rgba(37, 99, 235, 0.8)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // رندر اولیه
        render(data);

        // فیلتر قیمت
        document.getElementById('price-filter').addEventListener('input', (e) => {
            document.getElementById('filter-value').textContent = Number(e.target.value).toLocaleString('fa-IR') + ' تومان';
            applyFilters();
        });

        // فیلتر سایز و برند
        document.getElementById('size-filter').addEventListener('change', applyFilters);
        document.getElementById('brand-filter').addEventListener('change', applyFilters);

        function applyFilters() {
            let filtered = data;

            const minPrice = parseInt(document.getElementById('price-filter').value);
            filtered = filtered.filter(item => item.price_num >= minPrice);

            const selectedSize = document.getElementById('size-filter').value;
            if (selectedSize) {
                filtered = filtered.filter(item => item.size === selectedSize);
            }

            const selectedBrand = document.getElementById('brand-filter').value;
            if (selectedBrand) {
                filtered = filtered.filter(item => item.brand === selectedBrand);
            }

            render(filtered);
        }
    })
    .catch(err => {
        console.error('خطا:', err);
        document.body.innerHTML += `<p style="color:red; text-align:center; font-size:1.2rem;">
            خطا در بارگذاری داده‌ها: ${err.message}<br>
            لطفاً چک کنید فایل daily_prices.json در ریپو وجود داشته باشد و محتوای معتبر JSON داشته باشد.
        </p>`;
    });
