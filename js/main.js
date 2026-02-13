// js/main.js
import { loadData, extractBrand, extractSize, extractTech } from './data.js';
import { getFilteredData } from './filters.js';
import { updateStats, renderTable, updatePagination } from './ui.js';

let currentData = { torob: [], digikala: [] };
let currentTab = 'torob';
let currentPage = 1;
const rowsPerPage = 20;

function renderCurrentPage() {
  const data = currentData[currentTab] || [];
  const filtered = getFilteredData(data);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filtered.slice(start, end);

  renderTable(pageData, currentTab === 'torob');
  updatePagination(filtered.length);
}

function updateUI() {
  const data = currentData[currentTab] || [];
  updateStats(data);
  renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', () => {
  // تب‌ها
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      currentPage = 1;
      updateUI();
    });
  });

  // فیلترها
  ['price-filter', 'size-filter', 'brand-filter', 'tech-filter', 'search-input'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      currentPage = 1;
      updateUI();
    });
    document.getElementById(id)?.addEventListener('change', () => {
      currentPage = 1;
      updateUI();
    });
  });

  // پاک کردن فیلترها
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.getElementById('price-filter').value = 0;
    document.getElementById('size-filter').value = '';
    document.getElementById('brand-filter').value = '';
    document.getElementById('tech-filter').value = '';
    document.getElementById('search-input').value = '';
    currentPage = 1;
    updateUI();
  });

  // آپلود
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('file-input').click();
  });

  document.getElementById('file-input')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    let source = file.name.toLowerCase().startsWith('torob') ? 'torob' : 'digikala';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result);
        currentData[source] = processItems(json, source);
        updateUI();
        alert(`داده‌های ${source} لود شد (${json.length} محصول)`);
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // دانلود اکسل
  document.getElementById('download-excel')?.addEventListener('click', () => {
    const data = currentData[currentTab] || [];
    if (!data.length) return alert('داده‌ای برای دانلود وجود ندارد');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentTab);
    XLSX.writeFile(wb, `${currentTab}_prices.xlsx`);
  });

  updateUI();
});
