# Rockr FastAPI Backend

FastAPI backend service for handling user-submitted climbing gyms and feedback forms.

## Features

- **User-Submitted Gyms**: Allow users to submit new climbing gyms to the database
- **User Feedback**: Collect bug reports, feature requests, and general feedback
- **RESTful API**: Clean and well-documented API endpoints
- **Cloud Run Ready**: Containerized for easy deployment to Google Cloud Run

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **MySQL**: Database (shared with main app)
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server

## Local Development

### Prerequisites

- Python 3.11+
- MySQL database (shared with main app)
- pip or virtualenv

### Setup

1. **Create virtual environment** (optional but recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   
   From the main project root, run:
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   python -m app.main
   # Or use uvicorn directly:
   uvicorn app.main:app --reload --port 8000
   ```

6. **Access the API**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Gym Submissions

- `POST /api/v1/gyms/submit` - Submit a new gym
- `GET /api/v1/gyms/submissions?user_id={id}` - Get user's submissions
- `GET /api/v1/gyms/approved` - Get all approved gyms
- `GET /api/v1/gyms/{gym_id}` - Get specific gym submission

### Feedback

- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/my?user_id={id}` - Get user's feedback
- `GET /api/v1/feedback/{feedback_id}` - Get specific feedback

### Admin (Future)

- `GET /api/v1/admin/feedback` - Get all feedback (requires auth)

## Deployment to Google Cloud Run

### Prerequisites

- Google Cloud account
- `gcloud` CLI installed and configured
- Docker installed

### Build and Deploy

1. **Build the Docker image**
   ```bash
   docker build -t rockr-api .
   ```

2. **Test locally with Docker**
   ```bash
   docker run -p 8080:8080 \
     -e DB_HOST=your_db_host \
     -e DB_USER=your_db_user \
     -e DB_PASSWORD=your_db_password \
     -e DB_NAME=rockr \
     rockr-api
   ```

3. **Deploy to Cloud Run**
   ```bash
   # Set your GCP project
   gcloud config set project YOUR_PROJECT_ID

   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/rockr-api

   # Deploy to Cloud Run
   gcloud run deploy rockr-api \
     --image gcr.io/YOUR_PROJECT_ID/rockr-api \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated \
     --set-env-vars DB_HOST=YOUR_DB_HOST,DB_USER=YOUR_DB_USER,DB_PASSWORD=YOUR_DB_PASSWORD,DB_NAME=rockr
   ```

4. **Update CORS settings**
   
   After deployment, update the `ALLOWED_ORIGINS` environment variable with your app's URL:
   ```bash
   gcloud run services update rockr-api \
     --update-env-vars ALLOWED_ORIGINS=https://your-app-url.com
   ```

### Environment Variables for Cloud Run

Set these in Cloud Run:

- `DB_HOST`: Database host (e.g., Cloud SQL instance)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (rockr)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

## Database Schema

The backend uses two main tables:

### `user_submitted_gyms`
Stores user-submitted climbing gyms with moderation status.

### `user_feedback`
Stores user feedback, bug reports, and feature requests.

See `../drizzle/schema.ts` for full schema definitions.

## Development Notes

- All gym submissions start with `pending` status
- Feedback can be submitted anonymously (user_id is optional)
- CORS is configured to allow requests from the mobile app
- Database connection pooling is used for better performance

## Testing

Test the API using the interactive docs at `/docs` or with curl:

```bash
# Submit a gym
curl -X POST http://localhost:8000/api/v1/gyms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Test Gym",
    "city": "台北",
    "address": "Test Address",
    "type": "bouldering"
  }'

# Submit feedback
curl -X POST http://localhost:8000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "category": "feature_request",
    "subject": "New Feature",
    "message": "Please add this feature..."
  }'
```

## Future Enhancements

- [ ] Authentication middleware for admin endpoints
- [ ] Rate limiting to prevent spam
- [ ] Image upload to Cloud Storage
- [ ] Email notifications for submission status
- [ ] Admin dashboard
- [ ] Geocoding API integration
- [ ] Duplicate gym detection

## License

Private and proprietary.
