# Rockr (岩究生) - Bug Fix & Improvement Plan

> **創建日期**: 2026-01-31  
> **目標**: 根據用戶測試反饋,修復核心問題並優化用戶體驗

---

## 📋 問題清單

### ✅ 優先級 P0 - 緊急修復

#### 問題 1: Android 地圖閃退 🔴
**症狀**: Android 平台切換到地圖視圖時應用崩潰

**原因分析**:
- 在 `app/(tabs)/index.tsx:825` 使用了 `PROVIDER_GOOGLE`
- Android 需要在 `AndroidManifest.xml` 中配置 Google Maps API Key
- 目前 `app.config.ts` 缺少 `android.config.googleMaps.apiKey` 配置

**修復步驟**:
1. **獲取 Google Maps API Key**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 啟用 Maps SDK for Android
   - 創建 API Key（限制僅供 Android 使用）
   - 添加 SHA-1 證書指紋

2. **配置 app.config.ts**
   ```typescript
   android: {
     config: {
       googleMaps: {
         apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID || ""
       }
     },
     // ... 其他配置
   }
   ```

3. **添加環境變數**
   - 創建 `.env` 文件（如果不存在）
   - 添加: `GOOGLE_MAPS_API_KEY_ANDROID=YOUR_KEY_HERE`
   - 記得加入 `.gitignore`

4. **驗證測試**
   - 在 Android 實機/模擬器上測試
   - 確認地圖正常載入
   - 檢查 Logcat 確認無錯誤

**預計工時**: 30-60 分鐘（不含 API Key 審核時間）

---

### ✅ 優先級 P1 - 重要改進

#### 問題 2: 移除名稱排序選項 🟡
**原因**: 用戶反饋名稱排序不實用，建議簡化 UI

**修改位置**: `app/(tabs)/index.tsx`

**變更內容**:
1. **修改 Type 定義** (Line 461)
   ```typescript
   // 原本
   type SortOption = 'distance' | 'name' | 'price';
   
   // 修改為
   type SortOption = 'distance' | 'price';
   ```

2. **移除 UI 排序按鈕** (Line 766-780)
   - 刪除「名稱」排序按鈕
   - 保留「距離」和「價格」兩個選項

3. **簡化排序邏輯** (Line 521-529)
   - 移除 `sortBy === 'name'` 的處理邏輯
   - 保持距離和價格排序

**預計工時**: 15 分鐘

---

#### 問題 3: 新增「回報場館」功能 🟡
**目標**: 讓用戶能夠提交遺漏的攀岩館資訊

**實現方案**: Google Forms 整合（最快速的方案）

**步驟**:

1. **創建 Google Form**
   - 建立表單收集：
     - 場館名稱*
     - 所在縣市*
     - 區域*
     - 詳細地址*
     - 場館類型（抱石/上攀/混合）*
     - 價格範圍
     - 營業時間
     - Google Maps 連結
     - 聯絡人 Email（選填）
   - 獲取表單分享連結

2. **在 UI 中加入按鈕**
   - **位置 A**: 首頁搜尋結果為空時
   - **位置 B**: 地圖視圖的浮動按鈕
   - **位置 C**: Profile 頁面的「提供建議」區

3. **代碼實現**
   ```typescript
   // 在 constants/const.ts 加入
   export const REPORT_GYM_FORM_URL = 'https://forms.gle/YOUR_FORM_ID';
   
   // 在 index.tsx 加入函數
   const handleReportMissingGym = useCallback(() => {
     Linking.openURL(REPORT_GYM_FORM_URL);
   }, []);
   ```

4. **UI 設計建議**
   - 空狀態顯示: "找不到你的場館？"
   - 按鈕樣式: 主色調outline風格
   - Icon: `plus.circle` 或 `building.2`

**預計工時**: 45 分鐘（含表單設計）

---

#### 問題 4: 鍵盤遮擋輸入框 🟡
**症狀**: 搜尋框和備註輸入時，鍵盤會遮擋內容

**修改位置**: 
- `app/(tabs)/index.tsx` (搜尋框)
- `app/(tabs)/record.tsx` (備註輸入)

**解決方案**:

1. **包裹搜尋區域** (index.tsx Line 688-706)
   ```tsx
   import { KeyboardAvoidingView } from 'react-native';
   
   // 在搜尋區域外包裹
   <KeyboardAvoidingView
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
     keyboardVerticalOffset={100}
   >
     <View style={styles.searchSection}>
       {/* 現有搜尋框代碼 */}
     </View>
   </KeyboardAvoidingView>
   ```

2. **優化備註輸入**
   - 檢查 `record.tsx` 是否也需要相同處理
   - 考慮加入 `KeyboardAvoidingView` + `ScrollView`

3. **額外優化**
   - 加入 `dismissKeyboard` 功能（點擊空白處收鍵盤）
   - 設定合適的 `returnKeyType`
   - iOS: 使用 `inputAccessoryView` 增加完成按鈕（可選）

**預計工時**: 30 分鐘

---

### ✅ 優先級 P2 - 體驗優化

#### 問題 6: 等級系統調整 🟢
**現狀**: 預設使用 V-grade，但台灣館多使用顏色系統

**分析**:
- 目前 `lib/store.ts:14` 預設 `gradeSystem: 'v-grade'`
- 台灣攀岩館等級系統多樣：
  - 顏色標籤（每館不同）
  - V 級 (V0-V16)
  - Font 級 (4a-8c+)
  - 各館自定義系統

**建議方案**:

**階段 1: 快速修復（推薦）**
1. **在 Settings 頁面加入系統切換**
   ```typescript
   // lib/types.ts 擴展
   type GradeSystem = 'v-grade' | 'font' | 'color' | 'custom';
   ```

2. **UI 選項**
   - V 級 (國際通用)
   - Font 級 (歐洲系統)
   - 顏色標籤（簡化記錄）
   - 自訂標籤

3. **修改記錄界面**
   - 根據選擇顯示不同輸入方式
   - 顏色系統：色塊選擇器
   - V/Font: 數字選擇器
   - 自訂: 文字輸入

**階段 2: 進階功能（未來）**
- 允許用戶為每個館設定不同等級系統
- 社群共享各館的等級對應表
- 統計分析時自動換算等級

**預計工時**: 
- 階段 1: 2 小時
- 階段 2: 4-6 小時（未來迭代）

---

## 📊 實施時程表

### Week 1（立即開始）
| 日期 | 任務 | 負責人 | 狀態 |
|------|------|--------|------|
| Day 1 | 申請 Google Maps API Key | Dev | ⏳ 待開始 |
| Day 1-2 | 修復 Android 地圖閃退 (P0) | Dev | ⏳ 待開始 |
| Day 2 | 移除名稱排序 (P1) | Dev | ⏳ 待開始 |
| Day 2 | 修復鍵盤遮擋問題 (P1) | Dev | ⏳ 待開始 |
| Day 3 | 創建 Google Form + 整合 (P1) | Dev | ⏳ 待開始 |
| Day 4-5 | 等級系統調整 階段1 (P2) | Dev | ⏳ 待開始 |
| Day 6 | 整合測試 + Bug 修復 | Dev | ⏳ 待開始 |
| Day 7 | 發布 TestFlight/內測版本 | Dev | ⏳ 待開始 |

---

## 🧪 測試檢查清單

### Android 地圖測試
- [ ] 開啟地圖視圖不閃退
- [ ] 地圖正確顯示用戶位置
- [ ] Marker 點擊正常顯示 Callout
- [ ] 地圖縮放、拖動流暢
- [ ] 切換地區篩選器正常運作

### UI/UX 測試
- [ ] 搜尋框鍵盤不遮擋輸入
- [ ] 排序只顯示「距離」和「價格」
- [ ] 空狀態顯示「回報場館」按鈕
- [ ] 點擊回報按鈕正確開啟 Google Form
- [ ] 等級系統設定可切換並儲存

### 跨平台測試
- [ ] iOS 實機測試
- [ ] Android 實機測試
- [ ] Web 版本正常運作（降級處理）

---

## 📝 變更記錄

| 版本 | 日期 | 變更內容 | 狀態 |
|------|------|----------|------|
| v1.0.1 | 2026-02-XX | 修復 Android 地圖閃退 | 🔄 計劃中 |
| v1.0.1 | 2026-02-XX | 移除名稱排序 | 🔄 計劃中 |
| v1.0.1 | 2026-02-XX | 新增回報場館功能 | 🔄 計劃中 |
| v1.0.1 | 2026-02-XX | 修復鍵盤遮擋 | 🔄 計劃中 |
| v1.0.2 | 2026-02-XX | 等級系統優化 | 🔄 計劃中 |

---

## 🔍 後續觀察事項

### 數據收集
1. **Google Form 提交量**
   - 追蹤每週場館回報數量
   - 分析最常被回報的地區
   - 優先更新高需求區域

2. **使用者行為**
   - 哪個排序方式最常被使用？
   - 地圖 vs 列表的使用比例
   - 等級系統的選擇分布

3. **崩潰監控**
   - 使用 Sentry 或 Firebase Crashlytics
   - 監控 Android 地圖相關錯誤
   - 追蹤鍵盤相關的 UI 問題

---

## 💡 未來功能規劃（V1.1+）

### 場館數據管理
- [ ] 建立後台管理系統（可選）
- [ ] 半自動更新場館資訊
- [ ] 社群驗證機制（點讚/回報錯誤）

### 社交功能
- [ ] 場館評分系統
- [ ] 用戶留言/心得
- [ ] 攀岩夥伴配對

### 個人化
- [ ] 記錄每館的個人最佳成績
- [ ] 訓練進度追蹤
- [ ] 目標設定與提醒

### 離線功能
- [ ] 離線地圖支援
- [ ] 離線場館資訊
- [ ] 同步機制優化

---

## 📚 參考資料

### Google Maps 配置
- [Expo Google Maps 文檔](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Maps Platform - 開始使用](https://developers.google.com/maps/documentation/android-sdk/get-api-key)

### React Native 鍵盤處理
- [KeyboardAvoidingView 文檔](https://reactnative.dev/docs/keyboardavoidingview)
- [react-native-keyboard-aware-scroll-view](https://github.com/APSL/react-native-keyboard-aware-scroll-view)

### 等級系統參考
- [台灣抱石等級對照](https://www.climb.tw/grade-comparison)
- [國際攀岩等級系統](https://www.mountainproject.com/international-climbing-grades)

---

## ✅ 完成標準

### P0 任務
- ✅ Android 地圖可正常使用，無閃退
- ✅ 通過至少 3 台不同 Android 設備測試
- ✅ 在 4G 網路環境下地圖載入正常

### P1 任務
- ✅ 所有排序和篩選功能運作正常
- ✅ 用戶可成功提交場館回報表單
- ✅ 鍵盤不遮擋任何輸入框

### P2 任務
- ✅ 用戶可切換等級系統
- ✅ 不同系統的記錄正確儲存和顯示
- ✅ 設定在重啟 app 後保持

---

## 🙋‍♂️ 團隊協作

### 需要外部資源
- [ ] Google Maps API Key (需要信用卡驗證)
- [ ] 測試用戶招募（Android 用戶優先）
- [ ] UI/UX 設計師審查等級系統界面

### 內部分工
- **前端開發**: 所有 UI 相關修改
- **數據管理**: Google Form 創建與資料整理
- **測試**: 跨平台功能驗證
- **文檔**: 用戶指南更新

---

**備註**: 
- 所有代碼變更應該創建 feature branch
- 提交前必須通過 ESLint 檢查
- 每個 PR 需要包含測試說明
- 重大變更需要在 CHANGELOG.md 記錄

**最後更新**: 2026-01-31  
**文檔版本**: 1.0
