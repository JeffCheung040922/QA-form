// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 表單提交儲存到 localStorage
document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.main-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {};
    formData.forEach((v, k) => data[k] = v);

    // 產生 Excel 並下載
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "表單資料");
    XLSX.writeFile(wb, "customer_form.xlsx");

    alert('已下載 Excel（離線可用）！');
    this.reset();
  });
});
