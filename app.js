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
    const formData = new FormData(this);
    const data = {};
    formData.forEach((v, k) => data[k] = v);

    // 儲存到 localStorage
    let allData = JSON.parse(localStorage.getItem('formData') || '[]');
    allData.push(data);
    localStorage.setItem('formData', JSON.stringify(allData));

    alert('已儲存（離線可用）！');
    this.reset();
  });
});
