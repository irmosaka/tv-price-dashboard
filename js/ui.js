// js/ui.js
import { toPersianDigits } from './utils.js';

export function updateStats(data) {
  const prices = data.map(item => item.price_num).filter(p => p > 0);
  const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  document.getElementById('avg-price').textContent = toPersianDigits(avg) + ' تومان';
  document.getElementById('total-items').textContent = toPersianDigits(data.length);
  document.getElementById('total-sellers').textContent = toPersianDigits(data.reduce((s, i) => s + (i.sellers || 0), 0));
  document.getElementById('total-brands').textContent = toPersianDigits(new Set(data.map(i => i.brand)).size);
}

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
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.brand}</td>
          <td>${toPersianDigits(item.price_num)} تومان</td>
          <td>${toPersianDigits(item.original_price_num)} تومان</td>
          <td>${item.discount}</td>
          <td>${item.rating}</td>
          <td>${item.stock}</td>
          <td><a href="${item.link}" target="_blank">مشاهده</a></td>
        </tr>
      `;
    }
  }).join('');
}

export function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / 20);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.onclick = () => {
      currentPage = i;
      renderCurrentPage();
    };
    pagination.appendChild(btn);
  }
}
