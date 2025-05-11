// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 表單提交儲存到 localStorage
document.addEventListener('DOMContentLoaded', function() {
  // 自動填入今日日期
  document.getElementById('date').value = new Date().toISOString().slice(0, 10);

  // Customer Number 每日自動reset
  function getTodayStr() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  function updateCustomerNumber(reset = false) {
    const todayStr = getTodayStr();
    let lastDate = localStorage.getItem('customer_number_date');
    let number = localStorage.getItem('customer_number') || 600;
    if (reset || lastDate !== todayStr) {
      number = 600;
      localStorage.setItem('customer_number_date', todayStr);
    }
    number = parseInt(number, 10) + 1;
    localStorage.setItem('customer_number', number);
    localStorage.setItem('customer_number_date', todayStr);
    const customerNumber = `expo${todayStr}${number}`;
    document.getElementById('customer_number').value = customerNumber;
    return customerNumber;
  }

  // 初始顯示
  updateCustomerNumber();

  // 重置 Customer Number 按鈕
  document.getElementById('reset-number').addEventListener('click', function() {
    if (confirm('你確定要重置 Customer Number 嗎？')) {
      updateCustomerNumber(true);
    }
  });

  // 處理 overseas 選項的顯示/隱藏
  const overseasCheckboxes = document.querySelectorAll('input[name="overseas[]"]');
  const overseasOtherDiv = document.querySelector('.subsection:has(#overseas_other)');
  
  function updateOverseasVisibility() {
    const isOrderSelected = Array.from(overseasCheckboxes).some(cb => cb.value === '未決定' && cb.checked);
    if (isOrderSelected) {
      overseasOtherDiv.style.display = 'none';
    } else {
      overseasOtherDiv.style.display = '';
    }
  }

  overseasCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateOverseasVisibility);
  });

  // 初始化顯示狀態
  updateOverseasVisibility();

  const notesInput = document.getElementById('notes');
  if (notesInput && window.notesKeywords) {
    const notesTagify = new Tagify(notesInput, {
      whitelist: window.notesKeywords,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      }
    });
    notesInput.addEventListener('click', function() {
      notesTagify.dropdown.show();
    });
    window.notesTagify = notesTagify;
  }
});

// 檢查網絡狀態
function checkOnline() {
  return navigator.onLine;
}

// 儲存離線數據
function saveOfflineData(data) {
  let offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
  offlineData.push({
    data: data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('offlineData', JSON.stringify(offlineData));
  alert('已儲存離線數據，當有網絡時會自動同步');
}

// 同步離線數據
async function syncOfflineData() {
  if (!checkOnline()) return;
  
  let offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
  if (offlineData.length === 0) return;

  for (let item of offlineData) {
    try {
      // 生成 Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([item.data]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      
      // 下載 Excel
      XLSX.writeFile(wb, `customer_${item.timestamp}.xlsx`);
    } catch (error) {
      console.error('同步失敗:', error);
    }
  }

  // 清空離線數據
  localStorage.removeItem('offlineData');
  alert('離線數據已同步完成');
}

// 監聽網絡狀態
window.addEventListener('online', syncOfflineData);

// 修改提交處理
document.querySelector('.main-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      if (!data[key]) data[key] = [];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }

  // 讀取 phone_notes
  data.phone_notes = formData.get('phone_notes') || '';
  
  // 讀取 bigday_wear 及 preweddinghk_wear
  data.bigday_wear = (formData.getAll('bigday_wear[]') || []).join(', ');
  data.preweddinghk_wear = (formData.getAll('preweddinghk_wear[]') || []).join(', ');

  if (checkOnline()) {
    // 有網絡時直接生成 Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([data]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `customer_${new Date().toISOString()}.xlsx`);
  } else {
    // 冇網絡時儲存到本地
    saveOfflineData(data);
  }

  // 重置表單
  this.reset();
  updateCustomerNumber();
});

// 頁面載入時檢查並同步離線數據
window.addEventListener('load', syncOfflineData);

window.addEventListener('DOMContentLoaded', () => {
  if (window.bigDayHKKeywords) {
    const datalist = document.getElementById('bigday_hk_suggestions');
    if (datalist) {
      datalist.innerHTML = '';
      window.bigDayHKKeywords.forEach(keyword => {
        const option = document.createElement('option');
        option.value = keyword;
        datalist.appendChild(option);
      });
    }
  }
});