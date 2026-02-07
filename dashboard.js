// لود JSON خام
fetch('daily_prices.json')
    .then(response => response.json())
    .then(rawData => {
        // استخراج و پردازش فیلدهای مورد نظر (بدون تمیز دستی)
        let data = rawData.map(item => ({
            name: item['ellipsis-2'] || 'نامشخص',
            link: item['block href'] || '#',
            stock: item['text-caption'] || 'نامشخص',
            rating: item['text-body2-strong'] || '---',
            discount: item['text-body2-strong (2)'] || '۰٪',
            price: item['flex'] || '۰',
            original_price: item['text-neutral-300'] || item['flex'] || '۰'
        }));
        
        // تبدیل قیمت به عدد (رفع باگ string به int، حذف کاما و تومان)
        data.forEach(item => {
            item.price_num = parseInt(item.price.replace(/[,\s]/g, '')) || 0;
            item.original_price_num = parseInt(item.original_price.replace(/[,\s]/g, '')) || item.price_num;
            // تعداد فروشنده از موجودی (ساده: اگر موجود باشه = ۱)
            item.sellers = (item.stock.includes('موجود') || item.stock.includes('باقی مانده')) ? 1 : 0;
        });
        
        // تابع رندر (برای فیلتر دینامیک)
        function render(data) {
            // محاسبات آمار (رفع باگ میانگین)
            let prices = data.map(item => item.price_num).filter(p => p > 0);
            let avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length || 0;
            let totalSellers = data.reduce((sum, item) => sum + item.sellers, 0);
            let totalItems = data.length;
            
            // نمایش آمار
            document.getElementById('avg-price').textContent = avgPrice.toLocaleString('fa-IR');
            document.getElementById('total-items').textContent = totalItems;
            document.getElementById('total-sellers').textContent = totalSellers;
            
            // ساخت جدول (لینک clickable)
            let tbody = document.querySelector('#product-table tbody');
            tbody.innerHTML = '';
            data.forEach(item => {
                let row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.original_price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.discount}</td>
                    <td>${item.rating}</td>
                    <td>${item.stock}</td>
                    <td><a href="${item.link}" target="_blank">مشاهده</a></td>
                `;
                tbody.appendChild(row);
            });
            
            // چارت قیمت‌ها
            let ctx = document.getElementById('price-chart').getContext('2d');
            if (window.myChart) window.myChart.destroy();  // پاک کردن چارت قبلی
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.name.substring(0, 20) + '...'),
                    datasets: [{
                        label: 'قیمت فروش (تومان)',
                        data: data.map(item => item.price_num),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: { y: { beginAtZero: true } },
                    responsive: true
                }
            });
        }
        
        // رندر اولیه
        render(data);
        
        // فیلتر دینامیک با slider
        document.getElementById('price-filter').addEventListener('input', (e) => {
            document.getElementById('filter-value').textContent = e.target.value.toLocaleString('fa-IR') + ' تومان';
            let filtered = data.filter(item => item.price_num >= parseInt(e.target.value));
            render(filtered);
        });
    })
    .catch(error => {
        console.error('خطا در لود JSON:', error);
        document.body.innerHTML += '<p>خطا: فایل daily_prices.json پیدا نشد. آپلود کن.</p>';
    });
