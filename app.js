// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 表單提交儲存到 localStorage
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
