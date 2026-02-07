console.log("اسکریپت dashboard.js - نسخه فیکس برند");

function extractSizeAndBrand(title) {
    // سایز: عدد قبل از "اینچ" یا "اینج" (قبلاً کار می‌کرد، نگه می‌داریم)
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    // برند: ساده‌تر و قوی‌تر
    // ۱. اول سعی می‌کنیم متن بعد از "ال ای دی" تا "مدل" یا "سایز" یا انتها بگیریم
    let brand = 'نامشخص';
    const brandPart = title.split(/ال\s*ای\s*دی/i)[1]; // بعد از "ال ای دی"
    if (brandPart) {
        // حذف قسمت‌های بعد از مدل/سایز/هوشمند و غیره
        const cleaned = brandPart
            .split(/\s*(مدل|سایز|هوشمند|\d{2,3}|اینچ|اینج)/i)[0]
            .trim()
            .replace(/\s+/g, ' ');

        if (cleaned && cleaned.length > 1) {
            brand = cleaned;
        }
    }

    // اگر هنوز نامشخص بود، تخمین دوم: کلمه دوم یا سوم عنوان (معمولاً برند هست)
    if (brand === 'نامشخص') {
        const words = title.split(/\s+/);
        if (words.length >= 3) {
            // مثلاً "تلویزیون هوشمند ال ای دی سامسونگ ..." → سامسونگ
            brand = words[3] || words[2] || 'نامشخص';
        }
    }

    // تمیز نهایی برند
    brand = brand
        .replace(/هوشمند|ال\s*ای\s*دی/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return { size, brand: brand || 'نامشخص' };
}

fetch('daily_prices.json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        console.log("JSON دریافت شد");
        return response.json();
    })
    .then(rawData => {
        console.log(`تعداد خام: ${rawData.length}`);

        const data = rawData.map((item, idx) => {
            const title = item['ellipsis-2'] || 'نامشخص';
            const { size, brand } = extractSizeAndBrand(title);

            let pStr = (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '');
            pStr = pStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

            let oStr = (item['text-neutral-300'] || pStr).toString().replace(/[^0-9۰-۹]/g, '');
            oStr = oStr.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

            const price_num = parseInt(pStr) || 0;
            const original_price_num = parseInt(oStr) || price_num;

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
        }).filter(item => item.price_num > 0);

        console.log(`تعداد معتبر: ${data.length}`);

        const sizes = [...new Set(data.map(i => i.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
        const brands = [...new Set(data.map(i => i.brand).filter(b => b !== 'نامشخص'))].sort();

        console.log("سایزها:", sizes);
        console.log("برندها:", brands);

        // پر کردن select سایز
        document.getElementById('size-filter').innerHTML = 
            '<option value="">همه سایزها</option>' + 
            sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

        // پر کردن select برند
        document.getElementById('brand-filter').innerHTML = 
            '<option value="">همه برندها</option>' + 
            brands.map(b => `<option value="${b}">${b}</option>`).join('');

        // رندر و فیلترها (بقیه کد بدون تغییر - فقط بخش‌های لازم رو خلاصه کردم)
        function render(filtered) {
            // آمار
            const avg = filtered.length ? Math.round(filtered.reduce((s,i)=>s+i.price_num,0)/filtered.length) : 0;
            document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
            document.getElementById('total-items').textContent = filtered.length;
            document.getElementById('total-sellers').textContent = filtered.reduce((s,i)=>s+i.sellers,0);

            // جدول
            const tbody = document.querySelector('#product-table tbody');
            tbody.innerHTML = filtered.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.original_price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${item.discount}</td>
                    <td>${item.rating}</td>
                    <td>${item.stock}</td>
                    <td><a href="${item.link}" target="_blank">مشاهده</a></td>
                </tr>
            `).join('');

            // چارت (اگر نیاز داری نگه دار)
        }

        render(data);

        // فیلترها
        const apply = () => {
            let f = data;
            const min = +document.getElementById('price-filter').value || 0;
            f = f.filter(i => i.price_num >= min);
            const sz = document.getElementById('size-filter').value;
            if (sz) f = f.filter(i => i.size === sz);
            const br = document.getElementById('brand-filter').value;
            if (br) f = f.filter(i => i.brand === br);
            render(f);
        };

        ['price-filter', 'size-filter', 'brand-filter'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', apply);
            document.getElementById(id)?.addEventListener('input', apply);
        });
    })
    .catch(e => console.error("خطا:", e));
