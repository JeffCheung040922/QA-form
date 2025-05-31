// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// Modal 控制函數
function showModal() {
  const modal = document.getElementById('modalOverlay');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  // 將焦點設回工作人員名單欄位
  document.getElementById('staff_name').focus();
}

// 按 ESC 鍵關閉 modal
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// 表單提交儲存到 localStorage
document.addEventListener('DOMContentLoaded', function() {
  // 自動填入今日日期
  document.getElementById('date').value = new Date().toISOString().slice(0, 10);
  // 強制 Big Day 日期預設為空
  var bigdayDateInput = document.getElementById('bigday_date');
  if (bigdayDateInput) bigdayDateInput.value = '';

  // 負責同事記憶功能
  const staffNameField = document.getElementById('staff_name');
  if (staffNameField) {
    // 從 localStorage 讀取上次輸入的值
    const lastStaffName = localStorage.getItem('last_staff_name');
    if (lastStaffName) {
      staffNameField.value = lastStaffName;
    }
    
    // 當輸入值改變時保存到 localStorage
    staffNameField.addEventListener('change', function() {
      localStorage.setItem('last_staff_name', this.value);
    });
  }

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

  // 負責同事（staff_name）Tagify
  const staffNameInput = document.getElementById('staff_name');
  if (staffNameInput && window.staffNameKeywords) {
    const staffNameTagify = new Tagify(staffNameInput, {
      whitelist: window.staffNameKeywords,
      maxTags: 1,
      enforceWhitelist: false,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      },
      originalInputValueFormat: valuesArr => valuesArr.map(item => item.value).join('')
    });
    
    // 在表單提交時檢查
    document.querySelector('.main-form').addEventListener('submit', function(e) {
      const value = staffNameTagify.value;
      if (!value || value.length === 0) {
        e.preventDefault();
        showModal();
        return;
      }
    });

    staffNameInput.addEventListener('click', function() {
      staffNameTagify.dropdown.show();
    });
    window.staffNameTagify = staffNameTagify;
  }

  // Tagify 多選關鍵詞
  const bigdayOtherInput = document.getElementById('bigday_other');
  if (bigdayOtherInput && window.bigDayHKKeywords) {
    const bigDayOtherTagify = new Tagify(bigdayOtherInput, {
      whitelist: window.bigDayHKKeywords,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      }
    });
    bigdayOtherInput.addEventListener('click', function() {
      bigDayOtherTagify.dropdown.show();
    });
    window.bigDayOtherTagify = bigDayOtherTagify;
  }

  // 興趣元素/地點的 Tagify
  const interestInput = document.getElementById('interest');
  if (interestInput && window.interestKeywords) {
    const interestTagify = new Tagify(interestInput, {
      whitelist: window.interestKeywords,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      }
    });
    interestInput.addEventListener('click', function() {
      interestTagify.dropdown.show();
    });
    window.interestTagify = interestTagify;
  }

  // 海外其他的 Tagify
  const overseasOtherInput = document.getElementById('overseas_other');
  if (overseasOtherInput && window.overseasKeywords) {
    const overseasOtherTagify = new Tagify(overseasOtherInput, {
      whitelist: window.overseasKeywords,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      }
    });
    overseasOtherInput.addEventListener('click', function() {
      overseasOtherTagify.dropdown.show();
    });
    window.overseasOtherTagify = overseasOtherTagify;
  }

  // 其他/注意事項的 Tagify
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

  // 修改提交處理
  document.querySelector('.main-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 檢查必填欄位 - 改用 modal
    const staffName = document.getElementById('staff_name').value;
    if (!staffName || staffName.trim() === '') {
      showModal();
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
    
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
    // 讀取 bigday[] checkbox 多選
    data.bigday = (formData.getAll('bigday[]') || []).join(', ');
    // 讀取 bigday(date) input
    data.bigday_date = formData.get('bigday_date') || '';
    // 讀取 date 欄位（表單最頂 Date:）
    data.date = formData.get('date') || '';
    // 將所有 array 欄位轉成字串
    Object.keys(data).forEach(k => {
      if (Array.isArray(data[k])) {
        data[k.replace('[]', '')] = data[k].join(', ');
        delete data[k];
      }
    });

    // 加入提交時間
    const submitTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    data['submit_time'] = submitTime;

    // 取得今日 key
    const todayStr = getTodayStr();
    const todayKey = `excelData_${todayStr}`;

    // 每日自動 reset 疊加資料
    let lastExcelDate = localStorage.getItem('last_excel_date');
    if (lastExcelDate !== todayStr) {
      localStorage.setItem(todayKey, '[]');
      localStorage.setItem('last_excel_date', todayStr);
    }
    let allData = JSON.parse(localStorage.getItem(todayKey) || '[]');

    // 取得 bigday_other 的 tagify 值並轉成字串
    if (window.bigDayOtherTagify) {
      const tagData = window.bigDayOtherTagify.value;
      data.bigday_other = tagData.map(tag => tag.value).join(', ');
    }

    // 取得 interest 的 tagify 值
    if (window.interestTagify) {
      const tagData = window.interestTagify.value;
      data.interest = tagData.map(tag => tag.value).join(', ');
    }

    // 取得 overseas_other 的 tagify 值
    if (window.overseasOtherTagify) {
      const tagData = window.overseasOtherTagify.value;
      data.overseas_other = tagData.map(tag => tag.value).join(', ');
    }

    // 取得 notes 的 tagify 值
    if (window.notesTagify) {
      const tagData = window.notesTagify.value;
      data.notes = tagData.map(tag => tag.value).join(', ');
    }

    // 取得 staff_name 的 tagify 值
    if (window.staffNameTagify) {
      const tagData = window.staffNameTagify.value;
      data.staff_name = tagData.map(tag => tag.value).join(', ');
    } else {
      data.staff_name = document.getElementById('staff_name').value || '';
    }

    // Debug log
    console.log('表單提交', data);

    // 產生 Excel
    const headerOrder = [
      "customer_number",
      "submit_time",
      "bride",
      "bride_phone",
      "groom",
      "groom_phone",
      "staff_name",
      "bigday",
      "bigday_other",
      "bigday_type",
      "bigday_wear",
      "bigday_date",
      "prewedding_hk",
      "interest",
      "overseas",
      "notes"
    ];

    // 整理 Excel 資料，確保所有欄位都正確對應
    const excelData = {
      customer_number: data.customer_number || '',
      submit_time: data.submit_time || '',
      bride: data.bride || '',
      bride_phone: data.bride_phone || '',
      groom: data.groom || '',
      groom_phone: data.groom_phone || '',
      staff_name: data.staff_name || '',
      bigday: data.bigday || '',
      bigday_other: data.bigday_other || '',
      bigday_type: data.bigday_type || '',
      bigday_wear: data.bigday_wear || '',
      bigday_date: data.bigday_date || '',
      prewedding_hk: data.preweddinghk || '',
      interest: data.interest || '',
      overseas: (data.overseas || '') + (data.overseas_other ? ', ' + data.overseas_other : ''),
      notes: data.notes || ''
    };

    // Excel 欄寬自動根據內容調整（字體20，buffer加大）
    const colWidths = Object.keys(excelData).map(key => {
      const val = excelData[key] ? String(excelData[key]) : '';
      // 1.5 倍 buffer，模擬大字體
      return { wch: Math.max(20, key.length * 1.5 + 4, val.length * 1.5 + 4) };
    });

    // 疊加資料
    allData.push(excelData);
    localStorage.setItem(todayKey, JSON.stringify(allData));

    if (isIPad() && !checkOnline()) {
      // iPad 冇網絡時儲存到本地
      saveOfflineData(data);
    } else {
      try {
        // 檢查是否使用本地 XLSX 庫
        if (typeof XLSX === 'undefined') {
          throw new Error('XLSX 庫未加載，請確保已引入 xlsx.full.min.js');
        }

        // 產生 Excel
        const ws = XLSX.utils.json_to_sheet(allData, { header: headerOrder });
        ws['!cols'] = colWidths;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "表單資料");
        
        // 使用本地 XLSX 庫生成 Excel
        XLSX.writeFile(wb, `customer_form_${todayStr}.xlsx`);

        // 下載表格截圖
        const customerNumber = data.customer_number || 'form_screenshot';
        htmlToImage.toPng(document.querySelector('.main-form'), {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        })
        .then(function (dataUrl) {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${customerNumber}_${timeStr}.png`;
          link.click();
        })
        .catch(function (error) {
          console.error('截圖失敗:', error);
        });

        alert('已下載表格！');
      } catch (error) {
        console.error('Excel 生成失敗:', error);
        alert('Excel 生成失敗：' + error.message);
      }
    }

    // 重置表單
    this.reset();
    updateCustomerNumber();
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
    // 清空 staff_name 記憶
    localStorage.removeItem('last_staff_name');
    document.getElementById('staff_name').value = '';
    if (window.staffNameTagify) window.staffNameTagify.removeAllTags();
  });

  // 檢查網絡狀態
  function checkOnline() {
    return navigator.onLine;
  }

  // 檢查是否 iPad
  function isIPad() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // 儲存離線數據
  function saveOfflineData(data) {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    offlineData.push({
      data: data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
    alert('已儲存離線數據，請用電腦打開網頁同步數據');
  }

  // 同步離線數據
  async function syncOfflineData() {
    let offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    if (offlineData.length === 0) return;

    // 取得今日 key
    const todayStr = getTodayStr();
    const todayKey = `excelData_${todayStr}`;
    
    // 讀取現有數據
    let allData = JSON.parse(localStorage.getItem(todayKey) || '[]');
    
    // 加入離線數據
    offlineData.forEach(item => {
      allData.push(item.data);
    });
    
    // 儲存更新後嘅數據
    localStorage.setItem(todayKey, JSON.stringify(allData));
    
    // 產生 Excel
    const headerOrder = [
      "customer_number",
      "submit_time",
      "bride",
      "bride_phone",
      "groom",
      "groom_phone",
      "staff_name",
      "bigday",
      "bigday_other",
      "bigday_type",
      "bigday_wear",
      "bigday_date",
      "expected_date",
      "prewedding_hk",
      "interest",
      "overseas",
      "notes"
    ];

    const ws = XLSX.utils.json_to_sheet(allData, { header: headerOrder });
    const colWidths = Object.keys(allData[0] || {}).map(key => {
      const val = String(allData[0][key] || '');
      return { wch: Math.max(20, key.length * 1.5 + 4, val.length * 1.5 + 4) };
    });
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "表單資料");
    XLSX.writeFile(wb, `customer_form_${todayStr}.xlsx`);

    // 清空離線數據
    localStorage.removeItem('offlineData');
    alert('離線數據已同步完成！');
  }

  // 頁面載入時檢查並同步離線數據
  window.addEventListener('load', function() {
    if (!isIPad()) {
      syncOfflineData();
    }
  });
});