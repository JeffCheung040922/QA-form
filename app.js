// 註冊 service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// 表單提交儲存到 localStorage
document.addEventListener('DOMContentLoaded', function() {
  // 自動填入今日日期
  document.getElementById('date').value = new Date().toISOString().slice(0, 10);

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
  const ws = XLSX.utils.json_to_sheet(allData, { header: headerOrder });
  ws['!cols'] = colWidths;
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "表單資料");
  XLSX.writeFile(wb, `customer_form_${todayStr}.xlsx`);

  // 清空離線數據
  localStorage.removeItem('offlineData');
  alert('離線數據已同步完成！');
}

// XLSX 核心功能
const XLSX = {
  utils: {
    book_new: function() {
      return { Sheets: {}, SheetNames: [] };
    },
    json_to_sheet: function(data, opts) {
      const ws = {};
      const range = {s: {c:0, r:0}, e: {c:0, r:0}};
      
      // 處理數據
      data.forEach((row, R) => {
        Object.keys(row).forEach((key, C) => {
          const cell = { v: row[key] };
          const cell_ref = XLSX.utils.encode_cell({c: C, r: R});
          ws[cell_ref] = cell;
          if(range.e.c < C) range.e.c = C;
          if(range.e.r < R) range.e.r = R;
        });
      });
      
      ws['!ref'] = XLSX.utils.encode_range(range);
      return ws;
    },
    encode_cell: function(cell) {
      return String.fromCharCode(65 + cell.c) + (cell.r + 1);
    },
    encode_range: function(range) {
      return XLSX.utils.encode_cell(range.s) + ':' + XLSX.utils.encode_cell(range.e);
    },
    decode_range: function(ref) {
      // 只支援 A1:B2 格式
      const parts = ref.split(':');
      function decode_cell(cell) {
        const col = cell.charCodeAt(0) - 65;
        const row = parseInt(cell.slice(1), 10) - 1;
        return { c: col, r: row };
      }
      return { s: decode_cell(parts[0]), e: decode_cell(parts[1]) };
    }
  },
  book_append_sheet: function(wb, ws, name) {
    wb.SheetNames.push(name);
    wb.Sheets[name] = ws;
  },
  writeFile: function(wb, filename) {
    // 生成 CSV 格式
    let csv = '';
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // 加入表頭
    const headers = Object.keys(ws).filter(key => key !== '!ref');
    csv += headers.join(',') + '\n';
    
    // 加入數據
    for(let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for(let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({c:C, r:R})];
        row.push(cell ? cell.v : '');
      }
      csv += row.join(',') + '\n';
    }
    
    // 下載檔案
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace('.xlsx', '.csv');
    link.click();
  }
};

// 修改提交處理
document.querySelector('.main-form').addEventListener('submit', async function(e) {
  e.preventDefault();
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
      const tagData = window.bigDayOtherTagify.value; // 這是 array
      // 轉成「酒, 婚禮, ggg」格式
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

    // 取得 month 欄位
    data.month = formData.get('month') || '';

    // 取得 multi_days 及 multi_days_more，調轉來源
    data.multi_days = formData.get('multi_days_more') || '';
    data.multi_days_more = formData.get('multi_days') || '';
    data.other_days = formData.get('other_days') || '';

    // 處理天數資料
    if (data.multi_days === '其他天數' && data.other_days) {
      data.multi_days = data.other_days;
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
    }

    // 產生 Excel
    const headerOrder = [
      "customer_number",
      "submit_time",
      "bride",
      "bigday",
      "groom",
      "phone",
      "phone_notes",
      "staff_name",
      "date",
      "bigday_hk",
      "bigday_wear",
      "bigday_other",
      "prewedding_hk",
      "preweddinghk_wear",
      "interest",
      "overseas",
      "overseas_other",
      "expected_year",
      "future_year",
      "month",
      "multi_days",
      "multi_days_more",
      "notes",
    ];

    // 整理 Excel 資料，確保所有欄位都正確對應
    const excelData = {
      customer_number: data.customer_number || '',
      bride: data.bride || '',
      bigday: data.bigday || '',
      bigday_other: data.bigday_other || '',
      groom: data.groom || '',
      phone: data.phone || '',
      phone_notes: data.phone_notes || '',
      staff_name: data.staff_name || '',
      bigday_wear: data.bigday_wear || '',
      preweddinghk_wear: data.preweddinghk_wear || '',
      date: data.date || '',
      bigday_hk: data.bigday || '',
      prewedding_hk: data.preweddinghk || '',
      interest: data.interest || '',
      overseas: data.overseas || '',
      overseas_other: data.overseas_other || '',
      expected_year: data.expected_year || '',
      future_year: data.future_year || '',
      month: data.month || '',
      multi_days: data.multi_days || '',
      multi_days_more: data.multi_days_more || '',
      notes: data.notes || '',
      submit_time: data.submit_time || ''
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
      // 有網絡或電腦時自動判斷用 xlsx/full.min.js 定 fallback CSV
      const ws = XLSX.utils.json_to_sheet(allData, { header: headerOrder });
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "表單資料");
      if (typeof window.XLSX !== 'undefined' && window.XLSX.writeFile) {
        // 有外部 SheetJS，產生 .xlsx
        window.XLSX.writeFile(wb, `customer_form_${todayStr}.xlsx`);
      } else {
        // fallback 用簡化版產生 .csv
        XLSX.writeFile(wb, `customer_form_${todayStr}.csv`);
      }

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
    }

    // 重置表單
    this.reset();
    updateCustomerNumber();
    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
  });

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

    // 确保关键词列表已加载
    if (window.overseasKeywords && window.overseasKeywords.length > 0) {
      window.overseasOtherTagify.whitelist = window.overseasKeywords;
    }
  }

  const multiDaysSelect = document.getElementById('multi_days');
  const otherDaysInput = document.getElementById('other_days');
  
  if (multiDaysSelect && otherDaysInput) {
    multiDaysSelect.addEventListener('change', function() {
      if (this.value === '其他天數') {
        otherDaysInput.style.display = '';
        otherDaysInput.focus();
      } else {
        otherDaysInput.style.display = 'none';
        otherDaysInput.value = '';
      }
    });

    // 當輸入其他天數時，自動更新下拉選單的值
    otherDaysInput.addEventListener('input', function() {
      if (this.value) {
        multiDaysSelect.value = '其他天數';
      }
    });
  }

  // 頁面載入時檢查並同步離線數據
  window.addEventListener('load', function() {
    if (!isIPad()) {
      syncOfflineData();
    }
  });

  // staff_name Tagify + 記憶功能
  const staffNameInput = document.getElementById('staff_name');
  if (staffNameInput && window.staffNameKeywords) {
    const staffNameTagify = new Tagify(staffNameInput, {
      whitelist: window.staffNameKeywords,
      maxTags: 1,
      dropdown: {
        maxItems: 20,
        classname: "tags-look",
        enabled: 0,
        closeOnSelect: false,
        showAllItems: true
      }
    });
    staffNameInput.addEventListener('click', function() {
      staffNameTagify.dropdown.show();
    });
    window.staffNameTagify = staffNameTagify;
    // 自動填入上次用過嘅名
    const lastStaffName = localStorage.getItem('last_staff_name');
    if (lastStaffName) {
      staffNameTagify.addTags([lastStaffName]);
    }
    // 提交時自動儲存
    document.querySelector('.main-form').addEventListener('submit', function() {
      const tagData = staffNameTagify.value;
      if (tagData && tagData.length > 0) {
        localStorage.setItem('last_staff_name', tagData[0].value);
      }
    });
  }
});

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