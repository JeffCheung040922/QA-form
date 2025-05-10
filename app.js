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

    // 取得今日 key
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayKey = `excelData_${yyyy}${mm}${dd}`;
    let allData = JSON.parse(localStorage.getItem(todayKey) || '[]');

    // 重新排序
    const excelData = {
      customer_number: data.customer_number,
      bride: data.bride,
      groom: data.groom,
      phone: data.phone,
      date: data.date,
      bigday: data.bigday,
      // ...其他欄位
    };

    allData.push(excelData);
    localStorage.setItem(todayKey, JSON.stringify(allData));

    // 產生 Excel
    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "表單資料");
    XLSX.writeFile(wb, `customer_form_${yyyy}${mm}${dd}.xlsx`);

    alert('已下載 Excel（離線可用）！');
    this.reset();
  });

  // 生成 Customer Number
  let number = localStorage.getItem('customer_number') || 599;
  number = parseInt(number, 10) + 1;
  localStorage.setItem('customer_number', number);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const customerNumber = `repo${yyyy}${mm}${dd}${number}`;
  document.getElementById('customer_number').value = customerNumber;
});
