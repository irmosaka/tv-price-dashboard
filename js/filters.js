// js/filters.js
export function getFilteredData(data) {
  let filtered = [...data];

  // جستجو
  const search = document.getElementById('search-input')?.value?.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(search) || 
      item.brand.toLowerCase().includes(search)
    );
  }

  // قیمت حداقل
  const minPrice = parseInt(document.getElementById('price-filter')?.value) || 0;
  if (minPrice > 0) {
    filtered = filtered.filter(item => item.price_num >= minPrice);
  }

  // سایز
  const size = document.getElementById('size-filter')?.value;
  if (size) {
    filtered = filtered.filter(item => item.size === size);
  }

  // برند
  const brand = document.getElementById('brand-filter')?.value;
  if (brand) {
    filtered = filtered.filter(item => item.brand === brand);
  }

  // تکنولوژی
  const tech = document.getElementById('tech-filter')?.value;
  if (tech) {
    filtered = filtered.filter(item => item.tech === tech);
  }

  return filtered;
}
