# 新功能實作總結

## 概述

本次更新為 Rockr app 新增了兩個社群驅動的功能：

1. **用戶新增場館**：讓使用者可以提交新的攀岩場館資訊
2. **用戶回饋表單**：收集使用者的錯誤回報、功能建議和改進意見

## 技術架構

### 後端：FastAPI

建立了獨立的 FastAPI 後端服務，位於 `fastapi-backend/` 目錄：

```
fastapi-backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 主應用程式
│   ├── models.py        # Pydantic 資料模型
│   ├── database.py      # 資料庫連接和工具
│   └── crud.py          # 資料庫 CRUD 操作
├── Dockerfile           # Docker 容器配置
├── requirements.txt     # Python 依賴
├── .env.example        # 環境變數範例
└── README.md           # 後端文件
```

**技術棧：**
- FastAPI 0.115.6
- Uvicorn（ASGI server）
- MySQL connector
- Pydantic（資料驗證）

### 資料庫 Schema

在 `drizzle/schema.ts` 中新增了兩個表：

#### 1. `user_submitted_gyms`

儲存使用者提交的場館資訊：

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵 |
| userId | INT | 提交者 ID |
| name | VARCHAR(255) | 場館名稱 |
| city | VARCHAR(100) | 城市 |
| district | VARCHAR(100) | 區域 |
| address | TEXT | 地址 |
| lat, lng | VARCHAR(20) | GPS 座標 |
| type | ENUM | 場館類型（bouldering/lead/mixed） |
| priceFrom | INT | 起始價格 |
| hoursText | TEXT | 營業時間 |
| tags | TEXT | 標籤（JSON） |
| coverImageUrl | TEXT | 封面圖片 URL |
| phone | VARCHAR(50) | 電話 |
| website | VARCHAR(500) | 網站 |
| description | TEXT | 描述 |
| status | ENUM | 審核狀態（pending/approved/rejected） |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

#### 2. `user_feedback`

儲存使用者回饋：

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵 |
| userId | INT | 使用者 ID（可為空，支援匿名） |
| email | VARCHAR(320) | 聯絡信箱 |
| category | ENUM | 類別（bug/feature_request/improvement/other） |
| subject | VARCHAR(255) | 主旨 |
| message | TEXT | 詳細內容 |
| appVersion | VARCHAR(50) | App 版本 |
| deviceInfo | TEXT | 裝置資訊 |
| status | ENUM | 處理狀態（new/in_progress/resolved/closed） |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

### API 端點

#### 場館提交

- `POST /api/v1/gyms/submit` - 提交新場館
- `GET /api/v1/gyms/submissions?user_id={id}&status={status}` - 查詢使用者的提交
- `GET /api/v1/gyms/approved` - 取得已審核通過的場館
- `GET /api/v1/gyms/{gym_id}` - 取得特定場館資訊

#### 回饋表單

- `POST /api/v1/feedback` - 提交回饋
- `GET /api/v1/feedback/my?user_id={id}` - 查詢使用者的回饋
- `GET /api/v1/feedback/{feedback_id}` - 取得特定回饋

#### 管理端點（未來）

- `GET /api/v1/admin/feedback?status={status}` - 管理員查看所有回饋

### 前端整合

#### 新增頁面

1. **`app/submit-gym.tsx`** - 場館提交表單
   - 完整的表單欄位（名稱、地址、類型、價格等）
   - 類型選擇器（抱石/上攀/混合）
   - 標籤輸入
   - GPS 座標（選填）
   - 提交狀態處理

2. **`app/feedback.tsx`** - 回饋表單
   - 類別選擇（錯誤回報/功能建議/改進建議/其他）
   - 主旨和詳細內容
   - 選填的聯絡信箱
   - 自動收集裝置資訊和 app 版本

#### API Client

建立了 `lib/fastapi-client.ts` 來處理與 FastAPI 後端的通訊：

```typescript
// 主要功能
- submitGym(gym: GymSubmission)
- getUserGymSubmissions(userId, status?)
- getApprovedGyms()
- submitFeedback(feedback: FeedbackSubmission)
- getUserFeedback(userId)
```

#### Profile 頁面更新

在 `app/(tabs)/profile.tsx` 中新增了兩個入口：

1. **社群貢獻** 區塊
   - 新增場館按鈕

2. **關於** 區塊
   - 意見回饋按鈕

### 配置更新

#### `app.config.ts`

新增 FastAPI URL 配置：

```typescript
extra: {
  fastApiUrl: process.env.EXPO_PUBLIC_FASTAPI_URL || "http://localhost:8000",
}
```

#### `.env`

新增環境變數：

```env
EXPO_PUBLIC_FASTAPI_URL=http://localhost:8000
```

## 部署

### 本地開發

1. **啟動資料庫遷移**
   ```bash
   pnpm db:push
   ```

2. **啟動 FastAPI 後端**
   ```bash
   cd fastapi-backend
   pip install -r requirements.txt
   python -m app.main
   ```

3. **啟動 App**
   ```bash
   pnpm dev
   ```

### Cloud Run 部署

詳細步驟請參考 `DEPLOYMENT_GUIDE.md`。

簡要步驟：

1. 建置 Docker 映像
   ```bash
   cd fastapi-backend
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/rockr-api
   ```

2. 部署到 Cloud Run
   ```bash
   gcloud run deploy rockr-api \
     --image gcr.io/YOUR_PROJECT_ID/rockr-api \
     --platform managed \
     --region asia-east1 \
     --set-env-vars DB_HOST=...,DB_USER=...,DB_PASSWORD=...
   ```

3. 更新 app 的 `.env`
   ```env
   EXPO_PUBLIC_FASTAPI_URL=https://rockr-api-xxx.a.run.app
   ```

## 使用流程

### 新增場館

1. 使用者點擊 Profile > 社群貢獻 > 新增場館
2. 填寫場館資訊（必填：名稱、城市、地址、類型）
3. 提交後狀態為 "pending"
4. 管理員審核後變更為 "approved" 或 "rejected"
5. 已審核通過的場館可透過 API 取得並顯示在 app 中

### 提交回饋

1. 使用者點擊 Profile > 關於 > 意見回饋
2. 選擇類別（錯誤回報、功能建議等）
3. 填寫主旨和詳細內容
4. 選填聯絡信箱（如需回覆）
5. 系統自動收集裝置資訊和 app 版本
6. 提交後管理員可在後台查看

## 安全性考量

1. **輸入驗證**：使用 Pydantic 進行嚴格的資料驗證
2. **CORS 設定**：可限制允許的來源
3. **審核機制**：場館提交需要管理員審核
4. **匿名支援**：回饋表單支援匿名提交
5. **Rate Limiting**：未來可加入限流機制

## 未來改進

### 短期（MVP 後）

- [ ] 管理員審核介面（Web dashboard）
- [ ] Email 通知（審核結果）
- [ ] 圖片上傳功能（Cloud Storage）
- [ ] 重複場館檢測
- [ ] Rate limiting 防止濫用

### 中期

- [ ] 場館評分和評論系統
- [ ] 地圖上顯示使用者提交的場館
- [ ] 自動地理編碼（地址轉座標）
- [ ] 場館照片上傳和管理
- [ ] 進階搜尋和篩選

### 長期

- [ ] 社群投票系統
- [ ] 場館認證機制
- [ ] 場館所有者認領
- [ ] 整合社群媒體分享
- [ ] 多語言支援

## 檔案清單

### 新增檔案

```
fastapi-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── crud.py
├── Dockerfile
├── .dockerignore
├── requirements.txt
├── .env.example
└── README.md

app/
├── submit-gym.tsx
└── feedback.tsx

lib/
└── fastapi-client.ts

BACKEND_DESIGN.md
DEPLOYMENT_GUIDE.md
NEW_FEATURES_SUMMARY.md (本檔案)
```

### 修改檔案

```
drizzle/schema.ts          # 新增兩個表的 schema
app/(tabs)/profile.tsx     # 新增導航按鈕
app.config.ts              # 新增 fastApiUrl 配置
.env                       # 新增 EXPO_PUBLIC_FASTAPI_URL
```

## 測試建議

### API 測試

使用 FastAPI 自動生成的文件進行測試：
- 訪問 `http://localhost:8000/docs`
- 使用 Swagger UI 測試各個端點

### App 測試

1. **場館提交流程**
   - 測試必填欄位驗證
   - 測試類型選擇
   - 測試標籤輸入（逗號分隔）
   - 驗證提交成功訊息

2. **回饋表單流程**
   - 測試各種類別
   - 測試匿名提交（不填 email）
   - 測試已登入使用者提交
   - 驗證裝置資訊收集

3. **整合測試**
   - 確認 API 連接正常
   - 測試錯誤處理（網路斷線等）
   - 驗證資料正確儲存到資料庫

## 注意事項

1. **資料庫遷移**：部署前務必執行 `pnpm db:push`
2. **環境變數**：確保 FastAPI URL 在 `.env` 中正確設定
3. **CORS 設定**：生產環境要設定正確的 ALLOWED_ORIGINS
4. **審核機制**：目前沒有管理介面，需要直接操作資料庫
5. **圖片上傳**：目前只支援 URL，未來需整合 Cloud Storage

## 成本估算（Cloud Run）

- **免費額度**：每月 200 萬次請求
- **超出後**：約 $0.40/百萬次請求
- **預估**：MVP 階段應該在免費額度內

## 支援

如有問題，請參考：
- `fastapi-backend/README.md` - 後端詳細文件
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `BACKEND_DESIGN.md` - 設計文件
