console.log("اسکریپت dashboard.js شروع به کار کرد");

fetch('daily_prices.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`خطای HTTP: ${response.status} - ${response.statusText}`);
        }
        console.log("فایل JSON با موفقیت دریافت شد");
        return response.json();
    })
    .then(rawData => {
        console.log(`تعداد آیتم‌های خام دریافتی: ${rawData.length}`);

        const data = rawData
            .map((item, index) => {
                try {
                    const title = item['ellipsis-2'] || 'نامشخص';

                    // parse قیمت فروش (flex)
                    let priceStr = item['flex'] || '0';
                    priceStr = priceStr
                        .replace(/[^0-9۰-۹]/g, '')                    // حذف همه غیرعدد
                        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); // فارسی → انگلیسی

                    // parse قیمت اصلی
                    let origStr = item['text-neutral-300'] || priceStr;
                    origStr = origStr
                        .replace(/[^0-9۰-۹]/g, '')
                        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

                    const price_num = parseInt(priceStr) || 0;
                    const original_price_num = parseInt(origStr) || price_num;

                    if (price_num === 0) {
                        console.warn(`آیتم ${index}: قیمت صفر یا نامعتبر بعد از parse → عنوان: ${title} | flex خام: "${item['flex']}"`);
                    }

                    return {
                        name: title,
                        link: item['block href'] || '#',
                        stock: item['text-caption'] || 'نامشخص',
                        rating: item['text-body2-strong'] || '—',
                        discount: item['text-body2-strong (2)'] || '—',
                        price_num,
                        original_price_num,
                        sellers: (item['text-caption'] || '').includes('موجود') || (item['text-caption'] || '').includes('باقی مانده') ? 1 : 0
                    };
                } catch (e) {
                    console.error(`خطا در پردازش آیتم ${index}:`, e);
                    return null;
                }
            })
            .filter(item => item !== null);   // فقط آیتم‌های بدون خطا

        console.log(`تعداد آیتم‌های پردازش‌شده بدون خطا: ${data.length}`);

        // اگر همه قیمت‌ها صفر بودن، پیام واضح نشون بده
        const validData = data.filter(item => item.price_num > 0);
        if (validData.length === 0) {
            document.body.innerHTML += '<p style="color: red; text-align: center; font-size: 1.3rem; margin: 2rem; direction: rtl;">هیچ محصول با قیمت معتبر پیدا نشد. لطفاً کنسول مرورگر (F12) را چک کنید و متن warnها را ببینید (مثلاً flex خام چه چیزی است؟).</p>';
            console.error("هیچ آیتمی قیمت معتبر نداشت → احتمالاً فیلد flex خالی یا فرمت اشتباه است");
            return;
        }

        // تابع رندر
        function render(filteredData) {
            const prices = filteredData.map(i => i.price_num);
            const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0) / prices.length) : 0;
            const totalSellers = filteredData.reduce((sum, i) => sum + i.sellers, 0);

            document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
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

            // چارت فقط اگر داده باشه
            if (filteredData.length > 0) {
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
        }

        // رندر اولیه با داده‌های معتبر
        render(validData);

        // فیلتر قیمت
        document.getElementById('price-filter').addEventListener('input', (e) => {
            const minPrice = parseInt(e.target.value) || 0;
            document.getElementById('filter-value').textContent = minPrice.toLocaleString('fa-IR') + ' تومان';
            const filtered = validData.filter(item => item.price_num >= minPrice);
            render(filtered);
        });
    })
    .catch(err => {
        console.error('خطای کلی در fetch یا پردازش:', err);
        document.body.innerHTML += `<p style="color: red; text-align: center; font-size: 1.3rem; margin: 2rem; direction: rtl;">
            خطا در بارگذاری داده‌ها: ${err.message}<br>
            لطفاً کنسول مرورگر (F12 → Console) را چک کنید.
        </p>`;
    });
