fetch('daily_prices.json')
    .then(response => response.json())
    .then(rawData => {
        // پردازش داده خام - فقط فیلدهای مهم
        const data = rawData.map(item => {
            // قیمت فروش (flex)
            let priceStr = item['flex'] || '0';
            priceStr = priceStr.replace(/[^0-9]/g, ''); // فقط عدد نگه دار
            
            // قیمت اصلی (text-neutral-300)
            let origStr = item['text-neutral-300'] || priceStr;
            origStr = origStr.replace(/[^0-9]/g, '');
            
            return {
                name: item['ellipsis-2'] || 'نامشخص',
                link: item['block href'] || '#',
                stock: item['text-caption'] || 'نامشخص',
                rating: item['text-body2-strong'] || '—',
                discount: item['text-body2-strong (2)'] || '—',
                price_num: parseInt(priceStr) || 0,
                original_price_num: parseInt(origStr) || 0,
                sellers: (item['text-caption'] || '').includes('موجود') || (item['text-caption'] || '').includes('باقی مانده') ? 1 : 0
            };
        }).filter(item => item.price_num > 0); // محصولات بدون قیمت حذف

        // تابع رندر
        function render(filteredData) {
            // آمار
            const prices = filteredData.map(i => i.price_num);
            const avg = prices.length ? (prices.reduce((a,b)=>a+b,0) / prices.length).toFixed(0) : 0;
            const totalSellers = filteredData.reduce((sum, i) => sum + i.sellers, 0);
            
            document.getElementById('avg-price').textContent = Number(avg).toLocaleString('fa-IR') + ' تومان';
            document.getElementById('total-items').textContent = filteredData.length;
            document.getElementById('total-sellers').textContent = totalSellers;

            // جدول
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

        // فیلتر زنده
        const slider = document.getElementById('price-filter');
        const valueSpan = document.getElementById('filter-value');
        slider.addEventListener('input', () => {
            const minPrice = parseInt(slider.value);
            valueSpan.textContent = minPrice.toLocaleString('fa-IR') + ' تومان';
            const filtered = data.filter(item => item.price_num >= minPrice);
            render(filtered);
        });
    })
    .catch(err => {
        console.error(err);
        document.body.innerHTML += '<p style="color:red; text-align:center;">خطا در بارگذاری داده‌ها. مطمئن شوید فایل daily_prices.json در ریپو وجود دارد.</p>';
    });
