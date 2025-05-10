// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 表單提交儲存到 localStorage
document.addEventListener('DOMContentLoaded', function() {
  // 自動填入今日日期
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  document.getElementById('date').value = todayStr;

  // 生成 Customer Number
  let number = localStorage.getItem('customer_number') || 599;
  number = parseInt(number, 10) + 1;
  localStorage.setItem('customer_number', number);

  const customerNumber = `repo${yyyy}${mm}${dd}${number}`;
  document.getElementById('customer_number').value = customerNumber;

  document.querySelector('.main-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // 收集表單資料
    const form = e.target;
    const formData = new FormData(form);
    const data = [];
    formData.forEach((value, key) => {
      data.push({ key, value });
    });

    // 轉成 Excel 格式
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "表單資料");

    // 下載 Excel 檔案
    XLSX.writeFile(wb, "customer_form.xlsx");
  });
});
