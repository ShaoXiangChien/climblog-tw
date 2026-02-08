# FastAPI Backend Deployment Guide

本指南說明如何將 FastAPI 後端部署到 Google Cloud Run。

## 前置準備

### 1. 安裝 Google Cloud SDK

如果尚未安裝，請先安裝 `gcloud` CLI：

```bash
# macOS
brew install --cask google-cloud-sdk

# 或從官網下載
# https://cloud.google.com/sdk/docs/install
```

### 2. 登入並設定專案

```bash
# 登入 Google Cloud
gcloud auth login

# 設定專案 ID（替換成你的專案 ID）
gcloud config set project YOUR_PROJECT_ID

# 啟用必要的 API
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. 準備資料庫

確保你有一個可以從外部連接的 MySQL 資料庫。選項包括：

- **Cloud SQL**（推薦）：Google Cloud 的託管 MySQL
- **TiDB Cloud**：免費層級的分散式資料庫
- **其他雲端資料庫**：如 PlanetScale、AWS RDS 等

## 部署步驟

### 1. 執行資料庫遷移

在部署前，先確保資料庫 schema 已更新：

```bash
# 從專案根目錄執行
pnpm db:push
```

這會建立 `user_submitted_gyms` 和 `user_feedback` 兩個新表。

### 2. 建置並推送 Docker 映像

```bash
# 進入 FastAPI 後端目錄
cd fastapi-backend

# 建置並推送到 Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/rockr-api
```

### 3. 部署到 Cloud Run

```bash
# 部署服務
gcloud run deploy rockr-api \
  --image gcr.io/YOUR_PROJECT_ID/rockr-api \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars DB_HOST=YOUR_DB_HOST,DB_PORT=3306,DB_USER=YOUR_DB_USER,DB_PASSWORD=YOUR_DB_PASSWORD,DB_NAME=rockr
```

**重要參數說明：**

- `--region asia-east1`：選擇台灣附近的區域（台灣、香港、日本都可以）
- `--allow-unauthenticated`：允許公開訪問（因為是 mobile app 的 API）
- `--set-env-vars`：設定環境變數

### 4. 設定 CORS

部署完成後，取得 Cloud Run 的 URL（例如 `https://rockr-api-xxx.a.run.app`），然後更新 CORS 設定：

```bash
gcloud run services update rockr-api \
  --update-env-vars ALLOWED_ORIGINS=https://your-app-url.com,exp://192.168.1.100:8081
```

對於開發環境，可以暫時使用 `*` 允許所有來源：

```bash
gcloud run services update rockr-api \
  --update-env-vars ALLOWED_ORIGINS=*
```

### 5. 更新 App 配置

在專案的 `.env` 檔案中，更新 FastAPI URL：

```env
EXPO_PUBLIC_FASTAPI_URL=https://rockr-api-xxx.a.run.app
```

## 驗證部署

### 1. 測試 API

```bash
# 取得 Cloud Run URL
FASTAPI_URL=$(gcloud run services describe rockr-api --region asia-east1 --format 'value(status.url)')

# 測試健康檢查
curl $FASTAPI_URL/health

# 測試提交場館（需要替換 user_id）
curl -X POST $FASTAPI_URL/api/v1/gyms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "測試場館",
    "city": "台北",
    "address": "測試地址",
    "type": "bouldering"
  }'
```

### 2. 查看日誌

```bash
# 查看即時日誌
gcloud run services logs tail rockr-api --region asia-east1

# 或在 Cloud Console 查看
# https://console.cloud.google.com/run
```

## 環境變數設定

Cloud Run 需要設定以下環境變數：

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `DB_HOST` | 資料庫主機 | `35.xxx.xxx.xxx` 或 Cloud SQL instance |
| `DB_PORT` | 資料庫埠號 | `3306` |
| `DB_USER` | 資料庫使用者 | `root` |
| `DB_PASSWORD` | 資料庫密碼 | `your_password` |
| `DB_NAME` | 資料庫名稱 | `rockr` |
| `ALLOWED_ORIGINS` | CORS 允許的來源 | `*` 或特定 URL |

## 使用 Cloud SQL（推薦）

如果使用 Google Cloud SQL，可以透過 Unix socket 連接以提升安全性和效能：

### 1. 建立 Cloud SQL 實例

```bash
gcloud sql instances create rockr-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-east1
```

### 2. 建立資料庫和使用者

```bash
# 設定 root 密碼
gcloud sql users set-password root \
  --instance=rockr-db \
  --password=YOUR_PASSWORD

# 建立資料庫
gcloud sql databases create rockr --instance=rockr-db
```

### 3. 連接 Cloud Run 和 Cloud SQL

```bash
gcloud run services update rockr-api \
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-east1:rockr-db \
  --update-env-vars DB_HOST=/cloudsql/YOUR_PROJECT_ID:asia-east1:rockr-db
```

## 成本估算

- **Cloud Run**：免費額度每月 200 萬次請求，超過後約 $0.40/百萬次請求
- **Cloud SQL (db-f1-micro)**：約 $9.37/月
- **Container Registry**：儲存費用約 $0.026/GB/月

對於 MVP 階段，預估每月成本約 $10-15 USD。

## 更新部署

當你修改了程式碼後，重新部署：

```bash
cd fastapi-backend

# 重新建置並部署
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/rockr-api

# Cloud Run 會自動使用新的映像，或手動觸發
gcloud run deploy rockr-api \
  --image gcr.io/YOUR_PROJECT_ID/rockr-api \
  --platform managed \
  --region asia-east1
```

## 監控和維護

### 查看服務狀態

```bash
gcloud run services describe rockr-api --region asia-east1
```

### 設定自動擴展

```bash
gcloud run services update rockr-api \
  --min-instances 0 \
  --max-instances 10 \
  --region asia-east1
```

### 設定記憶體和 CPU

```bash
gcloud run services update rockr-api \
  --memory 512Mi \
  --cpu 1 \
  --region asia-east1
```

## 疑難排解

### 1. 資料庫連接失敗

- 檢查資料庫主機是否允許外部連接
- 確認防火牆規則
- 驗證帳號密碼是否正確

### 2. CORS 錯誤

- 確認 `ALLOWED_ORIGINS` 環境變數已正確設定
- 檢查 app 的請求來源是否在允許清單中

### 3. 部署失敗

- 查看建置日誌：`gcloud builds log <BUILD_ID>`
- 檢查 Dockerfile 和 requirements.txt 是否正確

## 安全性建議

1. **不要在程式碼中硬編碼密碼**：使用環境變數
2. **限制 CORS**：生產環境不要使用 `*`
3. **使用 Cloud SQL**：比公開的資料庫更安全
4. **啟用 Cloud Armor**：防止 DDoS 攻擊（進階）
5. **定期更新依賴**：`pip install --upgrade -r requirements.txt`

## 下一步

- [ ] 設定 CI/CD 自動部署（GitHub Actions）
- [ ] 新增 API 認證（JWT tokens）
- [ ] 實作 rate limiting
- [ ] 建立 admin dashboard
- [ ] 設定監控和警報（Cloud Monitoring）
