console.log("dashboard.js - نسخه فیکس نهایی برند");

function extractSizeAndBrand(title) {
    // سایز (این قسمت قبلاً خوب کار می‌کرد، نگه می‌داریم)
    const sizeMatch = title.match(/(\d{2,3})\s*(?:اینچ|اینج)/i);
    const size = sizeMatch ? sizeMatch[1] : 'نامشخص';

    // برند - نسخه قوی‌تر برای موارد "ال ای دی هوشمند برند ..."
    let brand = 'نامشخص';

    // ۱. اول چک می‌کنیم آیا "ال ای دی هوشمند" داریم یا نه
    const afterLed = title.split(/ال\s*ای\s*دی/i)[1];
    if (afterLed) {
        let cleaned = afterLed
            .replace(/^\s*هوشمند\s*/i, '')          // حذف "هوشمند" در ابتدای بخش
            .split(/\s*(مدل|سایز|اینچ|اینج|$)/i)[0] // تا مدل/سایز قطع کن
            .trim()
            .replace(/\s+/g, ' ');

        if (cleaned && cleaned.length > 1 && !/^[۰-۹]+$/.test(cleaned)) {
            brand = cleaned;
        }
    }

    // ۲. اگر هنوز پیدا نشد، fallback: کلمه بعد از "ال ای دی" یا "هوشمند"
    if (brand === 'نامشخص') {
        const words = title.split(/\s+/);
        let found = false;
        for (let i = 0; i < words.length - 1; i++) {
            if (/ال\s*ای\s*دی/i.test(words[i] + ' ' + words[i+1])) {
                // بعدش هوشمند باشه یا مستقیم برند
                let nextWord = words[i+2] || words[i+1];
                if (nextWord && !/هوشمند|مدل|سایز/i.test(nextWord)) {
                    brand = nextWord;
                    found = true;
                    break;
                } else if (/هوشمند/i.test(nextWord) && words[i+3]) {
                    brand = words[i+3];
                    found = true;
                    break;
                }
            }
        }
    }

    // تمیز نهایی
    brand = brand
        .replace(/هوشمند|ال\s*ای\s*دی/gi, '')
        .replace(/[^آ-یa-zA-Z\s]/g, '')  // فقط حروف و فاصله نگه دار
        .replace(/\s+/g, ' ')
        .trim();

    return { size, brand: brand || 'نامشخص' };
}

fetch('daily_prices.json')
    .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        console.log("JSON OK");
        return r.json();
    })
    .then(raw => {
        console.log(`خام: ${raw.length} آیتم`);

        const data = raw.map((item, i) => {
            const title = item['ellipsis-2'] || 'نامشخص';
            const { size, brand } = extractSizeAndBrand(title);

            let p = (item['flex'] || '0').toString().replace(/[^0-9۰-۹]/g, '');
            p = p.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

            let o = (item['text-neutral-300'] || p).toString().replace(/[^0-9۰-۹]/g, '');
            o = o.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

            return {
                name: title,
                link: item['block href'] || '#',
                stock: item['text-caption'] || 'نامشخص',
                rating: item['text-body2-strong'] || '—',
                discount: item['text-body2-strong (2)'] || '—',
                price_num: parseInt(p) || 0,
                original_price_num: parseInt(o) || 0,
                sellers: /موجود|باقی مانده/i.test(item['text-caption'] || '') ? 1 : 0,
                size,
                brand
            };
        }).filter(d => d.price_num > 0);

        console.log(`معتبر: ${data.length}`);

        const sizes = [...new Set(data.map(d => d.size).filter(s => s !== 'نامشخص'))].sort((a,b)=>+a-+b);
        const brands = [...new Set(data.map(d => d.brand).filter(b => b !== 'نامشخص'))].sort();

        console.log("سایزها:", sizes);
        console.log("برندها:", brands);

        document.getElementById('size-filter').innerHTML = '<option value="">همه سایزها</option>' +
            sizes.map(s => `<option value="${s}">${s} اینچ</option>`).join('');

        document.getElementById('brand-filter').innerHTML = '<option value="">همه برندها</option>' +
            brands.map(b => `<option value="${b}">${b}</option>`).join('');

        function render(f) {
            const avg = f.length ? Math.round(f.reduce((s,d)=>s+d.price_num,0)/f.length) : 0;
            document.getElementById('avg-price').textContent = avg.toLocaleString('fa-IR') + ' تومان';
            document.getElementById('total-items').textContent = f.length;
            document.getElementById('total-sellers').textContent = f.reduce((s,d)=>s+d.sellers,0);

            document.querySelector('#product-table tbody').innerHTML = f.map(d => `
                <tr>
                    <td>${d.name}</td>
                    <td>${d.price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${d.original_price_num.toLocaleString('fa-IR')} تومان</td>
                    <td>${d.discount}</td>
                    <td>${d.rating}</td>
                    <td>${d.stock}</td>
                    <td><a href="${d.link}" target="_blank">مشاهده</a></td>
                </tr>
            `).join('');
        }

        render(data);

        const applyFilter = () => {
            let f = data;
            const minP = +document.getElementById('price-filter')?.value || 0;
            f = f.filter(d => d.price_num >= minP);

            const sz = document.getElementById('size-filter')?.value;
            if (sz) f = f.filter(d => d.size === sz);

            const br = document.getElementById('brand-filter')?.value;
            if (br) f = f.filter(d => d.brand === br);

            render(f);
        };

        ['price-filter','size-filter','brand-filter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(id.includes('input') ? 'input' : 'change', applyFilter);
        });
    })
    .catch(e => console.error("خطا:", e));
