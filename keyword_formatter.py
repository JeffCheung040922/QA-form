def read_existing_keywords():
    try:
        with open('keywords.js', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 提取現有的關鍵字
        bigday_keywords = []
        interest_keywords = []
        overseas_keywords = []
        
        # 提取 BIG DAY 關鍵字
        if 'window.bigDayHKKeywords = [' in content:
            start = content.find('window.bigDayHKKeywords = [') + len('window.bigDayHKKeywords = [')
            end = content.find('];', start)
            if start < end:
                keywords_str = content[start:end].strip()
                keywords = [k.strip().strip('"').strip("'") for k in keywords_str.split(',') if k.strip()]
                bigday_keywords = [k for k in keywords if k]
        
        # 提取興趣關鍵字
        if 'window.interestKeywords = [' in content:
            start = content.find('window.interestKeywords = [') + len('window.interestKeywords = [')
            end = content.find('];', start)
            if start < end:
                keywords_str = content[start:end].strip()
                keywords = [k.strip().strip('"').strip("'") for k in keywords_str.split(',') if k.strip()]
                interest_keywords = [k for k in keywords if k]
        
        # 提取海外關鍵字
        if 'window.overseasKeywords = [' in content:
            start = content.find('window.overseasKeywords = [') + len('window.overseasKeywords = [')
            end = content.find('];', start)
            if start < end:
                keywords_str = content[start:end].strip()
                keywords = [k.strip().strip('"').strip("'") for k in keywords_str.split(',') if k.strip()]
                overseas_keywords = [k for k in keywords if k]
        
        print("\n=== 讀取到的現有關鍵字 ===")
        print("BIG DAY:", bigday_keywords)
        print("興趣元素/地點:", interest_keywords)
        print("海外:", overseas_keywords)
        
        return bigday_keywords, interest_keywords, overseas_keywords
    except FileNotFoundError:
        print("\n未找到 keywords.js 文件，將創建新文件")
        return [], [], []
    except Exception as e:
        print(f"\n讀取文件時出錯：{str(e)}")
        return [], [], []

def format_keywords():
    # 讀取現有的關鍵字
    existing_bigday, existing_interest, existing_overseas = read_existing_keywords()
    
    print("\n=== 現有的關鍵字 ===")
    if existing_bigday:
        print("\nBIG DAY 關鍵字：")
        for kw in existing_bigday:
            print(f"  - {kw}")
    if existing_interest:
        print("\n興趣元素/地點關鍵字：")
        for kw in existing_interest:
            print(f"  - {kw}")
    if existing_overseas:
        print("\n海外關鍵字：")
        for kw in existing_overseas:
            print(f"  - {kw}")
    
    print("\n=== 添加新的關鍵字 ===")
    print("請輸入新的 BIG DAY 關鍵字（每行一個，輸入空行結束）：")
    new_bigday = []
    skipped_bigday = []
    while True:
        keyword = input().strip()
        if not keyword:
            break
        if keyword in existing_bigday:
            print(f"  ! 已存在：{keyword}")
            skipped_bigday.append(keyword)
        else:
            print(f"  + 新增：{keyword}")
            new_bigday.append(keyword)
    
    print("\n請輸入新的興趣元素/地點關鍵字（每行一個，輸入空行結束）：")
    new_interest = []
    skipped_interest = []
    while True:
        keyword = input().strip()
        if not keyword:
            break
        if keyword in existing_interest:
            print(f"  ! 已存在：{keyword}")
            skipped_interest.append(keyword)
        else:
            print(f"  + 新增：{keyword}")
            new_interest.append(keyword)
    
    print("\n請輸入新的海外關鍵字（每行一個，輸入空行結束）：")
    new_overseas = []
    skipped_overseas = []
    while True:
        keyword = input().strip()
        if not keyword:
            break
        if keyword in existing_overseas:
            print(f"  ! 已存在：{keyword}")
            skipped_overseas.append(keyword)
        else:
            print(f"  + 新增：{keyword}")
            new_overseas.append(keyword)
    
    # 顯示添加結果
    print("\n=== 添加結果 ===")
    if new_bigday:
        print("\n新增的 BIG DAY 關鍵字：")
        for kw in new_bigday:
            print(f"  + {kw}")
    if skipped_bigday:
        print("\n跳過的 BIG DAY 關鍵字（已存在）：")
        for kw in skipped_bigday:
            print(f"  ! {kw}")
            
    if new_interest:
        print("\n新增的興趣元素/地點關鍵字：")
        for kw in new_interest:
            print(f"  + {kw}")
    if skipped_interest:
        print("\n跳過的興趣元素/地點關鍵字（已存在）：")
        for kw in skipped_interest:
            print(f"  ! {kw}")
            
    if new_overseas:
        print("\n新增的海外關鍵字：")
        for kw in new_overseas:
            print(f"  + {kw}")
    if skipped_overseas:
        print("\n跳過的海外關鍵字（已存在）：")
        for kw in skipped_overseas:
            print(f"  ! {kw}")
    
    # 合併現有和新的關鍵字
    all_bigday = existing_bigday + new_bigday
    all_interest = existing_interest + new_interest
    all_overseas = existing_overseas + new_overseas
    
    # 將關鍵字轉換成 JavaScript 陣列格式
    bigday_js = ",\n  ".join(f'"{kw}"' for kw in all_bigday)
    interest_js = ",\n  ".join(f'"{kw}"' for kw in all_interest)
    overseas_js = ",\n  ".join(f'"{kw}"' for kw in all_overseas)
    
    # 只生成 window.xxxKeywords 三個陣列
    js_code = f"""window.bigDayHKKeywords = [\n  {bigday_js}\n];\n\nwindow.interestKeywords = [\n  {interest_js}\n];\n\nwindow.overseasKeywords = [\n  {overseas_js}\n];"""
    
    print("\n轉換結果：")
    print(js_code)
    
    # 詢問是否要保存到檔案
    save = input("\n是否要保存到 keywords.js？(y/n): ").lower()
    if save == 'y':
        with open('keywords.js', 'w', encoding='utf-8') as f:
            f.write(js_code)
        print("已保存到 keywords.js")

if __name__ == "__main__":
    format_keywords() 