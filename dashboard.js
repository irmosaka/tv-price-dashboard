console.log("اسکریپت dashboard.js نسخه جدید شروع به کار کرد");

function extractSizeAndBrand(title) {
    // سایز: عدد ۲ یا ۳ رقمی نزدیک به "اینچ" یا "اینج" (با یا بدون فاصله)
    const sizeRegex = /(\d{2,3})\s*(?:اینچ|اینج|\s*")/i;
    const sizeMatch = title.match(sizeRegex);
    const size = sizeMatch ? sizeMatch[1] : null;

    // برند: متن بعد از "ال ای دی" تا "مدل"، "سایز"، "هوشمند" یا انتها
    const brandRegex = /ال\s*ای\s*دی\s+([^مدل\s*هوشمند\s*سایز]+?)(?:\s*(?:مدل|سایز|هوشمند|$))/i;
    let brandMatch = title.match(brandRegex);
    let brand = brandMatch ? brandMatch[1].trim() : null;

    if (brand) {
        brand = brand
            .replace(/\s*هوشمند\s*/gi, '')
            .replace(/\s*ال\s*ای\s*دی\s*/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return {
        size: size || 'نامشخص',
        brand: brand || 'نامشخص'
    };
}

fetch('daily_prices.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`مشکل در دریافت فایل: ${response.status} - ${response.statusText}`);
        }
        console.log("فایل daily_prices.json با موفقیت دریافت شد");
        return response.json();
    })
    .then(rawData => {
        console.log(`تعداد آیتم‌های خام: ${rawData.length}`);

        const processedData = rawData.map((item, index) => {
            try {
                const title = item['ellipsis-2'] || 'نامشخص';
                const { size, brand } = extractSizeAndBrand(title);

                // parse قیمت فروش (flex)
                let priceStr = (item['flex'] || '0').toString();
                priceStr = priceStr
                    .replace(/[^0-9۰-۹]/g, '')                    // فقط اعداد (فارسی+انگلیسی)
                    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); // فارسی به لاتین

                // parse قیمت اصلی
                let origStr = (item['text-neutral-300'] || priceStr).toString();
                origStr = origStr
                    .replace(/[^0-9۰-۹]/g, '')
                    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

                const price_num = parseInt(priceStr, 10) || 0;
                const original_price_num = parseInt(origStr, 10) || price_num;

                if (price_num === 0 && item['flex']) {
                    console.warn(
                        `آیتم ${index}: قیمت فروش صفر شد بعد از parse → ` +
                        `عنوان: ${title} | flex خام: "${item['flex']}"`
                    );
                }

                return {
                    name: title,
                    link: item['block href'] || '#',
                    stock: item['text-caption'] || 'نامشخص',
                    rating: item['text-body2-strong'] || '—',
                    discount: item['text-body2-strong (2)'] || '—',
                    price_num,
                    original_price_num,
                    sellers: /موجود|باقی مانده/i.test(item['text-caption'] || '') ? 1 : 0,
                    size,
                    brand
                };
            } catch (err) {
                console.error(`خطا در پردازش آیتم ${index}:`, err);
                return null;
            }
        }).filter(Boolean);  // حذف آیتم‌های null

        console.log(`تعداد آیتم‌های پردازش‌شده: ${processedData.length}`);

        // لیست منحصربه‌فرد سایز و برند
        const uniqueSizes = [...new Set(processedData.map(i => i.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>Number(a)-Number(b));
        const uniqueBrands = [...new Set(processedData.map(i => i.brand).filter(b => b !== 'نامشخص'))].sort();

        console.log("سایزهای منحصربه‌فرد:", uniqueSizes);
        console.log("برندهای منحصربه‌فرد:", uniqueBrands);

        // پر کردن select سایز
        const sizeSelect = document.getElementById('size-filter');
        if (sizeSelect) {
            sizeSelect.innerHTML = '<option value="">همه سایزها</option>' +
                uniqueSizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');
        }

        // پر کردن select برند
        const brandSelect = document.getElementById('brand-filter');
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">همه برندها</option>' +
                uniqueBrands.map(b => `<option value="${b}">${b}</option>`).join('');
        }

        // اگر هیچ داده معتبری نبود
        if (processedData.length === 0) {
            document.body.innerHTML += '<p style="color:red; text-align:center; font-size:1.4rem; margin:2rem; direction:rtl;">هیچ محصول با قیمت معتبر پیدا نشد. لطفاً کنسول را چک کنید (F12 → Console).</p>';
            return;
        }

        // تابع رندر داشبورد
        function render(filtered) {
            const prices = filtered.map(i => i.price_num).filter(p => p > 0);
            const avg = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
            const totalSellers = filtered.reduce((s, i) => s + i.sellers, 0);

            document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
            document.getElementById('total-items').textContent = filtered.length;
            document.getElementById('total-sellers').textContent = totalSellers;

            const tbody = document.querySelector('#product-table tbody');
            tbody.innerHTML = '';
            filtered.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.original_price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.discount}</td>
                    <td>${item.rating}</td>
                    <td>${item.stock}</td>
                    <td><a href="${item.link}" target="_blank">مشاهده</a></td>
                `;
                tbody.appendChild(tr);
            });

            // چارت
            const ctx = document.getElementById('price-chart')?.getContext('2d');
            if (ctx) {
                if (window.myChart) window.myChart.destroy();
                if (filtered.length > 0) {
                    window.myChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: filtered.map(i => i.name.slice(0,25) + (i.name.length>25?'...':'')),
                            datasets: [{
                                label: 'قیمت فروش (تومان)',
                                data: filtered.map(i => i.price_num),
                                backgroundColor: 'rgba(37,99,235,0.3)',
                                borderColor: 'rgba(37,99,235,0.8)',
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
        }

        // رندر اولیه
        render(processedData);

        // فیلتر قیمت
        const priceSlider = document.getElementById('price-filter');
        if (priceSlider) {
            priceSlider.addEventListener('input', e => {
                const val = Number(e.target.value);
                document.getElementById('filter-value').textContent = val.toLocaleString('fa-IR') + ' تومان';
                const filtered = processedData.filter(i => i.price_num >= val);
                render(filtered);
            });
        }

        // فیلتر سایز + برند
        const sizeFilter = document.getElementById('size-filter');
        const brandFilter = document.getElementById('brand-filter');

        if (sizeFilter && brandFilter) {
            const applyFilters = () => {
                let filtered = processedData;
                const minPrice = Number(priceSlider?.value || 0);
                filtered = filtered.filter(i => i.price_num >= minPrice);

                const selSize = sizeFilter.value;
                if (selSize) filtered = filtered.filter(i => i.size === selSize);

                const selBrand = brandFilter.value;
                if (selBrand) filtered = filtered.filter(i => i.brand === selBrand);

                render(filtered);
            };

            sizeFilter.addEventListener('change', applyFilters);
            brandFilter.addEventListener('change', applyFilters);
        }
    })
    .catch(err => {
        console.error('خطای کلی:', err);
        document.body.innerHTML += `<p style="color:red; text-align:center; font-size:1.4rem; margin:2rem; direction:rtl;">
            خطا: ${err.message}<br>کنسول مرورگر (F12) را چک کنید.
        </p>`;
    });
