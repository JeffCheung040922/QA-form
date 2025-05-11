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

document.querySelector('.main-form').addEventListener('submit', function(e) {
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

    // 產生 Excel
    const headerOrder = [
      "customer_number",
      "submit_time",
      "bride",
      "bigday",
      "groom",
      "phone",
      "phone_notes",
      "date",
      "bigday_hk",
      "bigday_wear",
      "bigday_other",
      "prewedding_hk",
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

    // 產生 Excel，包含所有今日資料
    const ws = XLSX.utils.json_to_sheet(allData, { header: headerOrder });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "表單資料");
    XLSX.writeFile(wb, `customer_form_${todayStr}.xlsx`);

    // 下載表格截圖
    const customerNumber = data.customer_number || 'form_screenshot';
    
    // 使用 html-to-image 進行截圖
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

    alert('已下載 Excel！');

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