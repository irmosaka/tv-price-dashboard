export function renderTable(data, isTorob) {
  const tbody = document.querySelector('#product-table tbody');
  tbody.innerHTML = data.map(item => {
    if (isTorob) {
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${toPersianDigits(item.price_num)} تومان</td>
          <td>${toPersianDigits(item.sellers)} فروشنده</td>
          <td><a href="${item.link}" target="_blank">مشاهده</a></td>
        </tr>
      `;
    } else {
      // دیجی‌کالا کامل
      return `...`;
    }
  }).join('');
}
