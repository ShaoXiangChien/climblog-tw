# Backend Design for User-Submitted Gyms and Feedback

## Overview

This document outlines the design for two new features:
1. **User-submitted climbing gyms** - Allow users to contribute new gym information
2. **User feedback forms** - Collect user feedback and feature requests

## Architecture

### Technology Stack
- **Backend Framework**: FastAPI (Python)
- **Database**: MySQL (existing setup with Drizzle ORM)
- **Deployment**: Google Cloud Run
- **API Style**: RESTful API

### Database Schema

#### 1. User-Submitted Gyms Table (`user_submitted_gyms`)

```sql
CREATE TABLE user_submitted_gyms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  address TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  type ENUM('bouldering', 'lead', 'mixed') NOT NULL,
  price_from INT,
  hours_text TEXT,
  tags JSON,
  cover_image_url TEXT,
  phone VARCHAR(50),
  website VARCHAR(500),
  description TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Fields:**
- `id`: Auto-increment primary key
- `user_id`: Reference to the user who submitted
- `name`, `city`, `district`, `address`: Location information
- `lat`, `lng`: GPS coordinates (optional, can be geocoded later)
- `type`: Type of climbing gym
- `price_from`: Starting price
- `hours_text`: Operating hours as text
- `tags`: JSON array of tags
- `cover_image_url`: URL to uploaded cover image
- `phone`, `website`: Contact information
- `description`: Additional details
- `status`: Moderation status (pending/approved/rejected)
- `created_at`, `updated_at`: Timestamps

#### 2. User Feedback Table (`user_feedback`)

```sql
CREATE TABLE user_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  email VARCHAR(320),
  category ENUM('bug', 'feature_request', 'improvement', 'other') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  app_version VARCHAR(50),
  device_info TEXT,
  status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Fields:**
- `id`: Auto-increment primary key
- `user_id`: Reference to user (nullable for anonymous feedback)
- `email`: Contact email (optional)
- `category`: Type of feedback
- `subject`: Brief summary
- `message`: Detailed feedback content
- `app_version`: App version for debugging
- `device_info`: Device/OS information
- `status`: Feedback status
- `created_at`, `updated_at`: Timestamps

## API Endpoints

### FastAPI Backend

Base URL: `/api/v1`

#### Gym Submission Endpoints

1. **POST /api/v1/gyms/submit**
   - Submit a new gym
   - Request body: Gym information (JSON)
   - Response: Created gym submission with ID and status

2. **GET /api/v1/gyms/submissions**
   - Get user's gym submissions (authenticated)
   - Query params: `status` (optional filter)
   - Response: List of submissions

3. **GET /api/v1/gyms/approved**
   - Get all approved user-submitted gyms
   - Response: List of approved gyms

#### Feedback Endpoints

1. **POST /api/v1/feedback**
   - Submit user feedback
   - Request body: Feedback information (JSON)
   - Response: Created feedback with ID

2. **GET /api/v1/feedback/my**
   - Get user's feedback submissions (authenticated)
   - Response: List of feedback items

## Mobile App Integration

### New Screens

1. **Submit Gym Screen** (`app/submit-gym.tsx`)
   - Form with fields for gym information
   - Image picker for cover photo
   - Location picker (map or manual entry)
   - Tags selector
   - Submit button

2. **Feedback Screen** (`app/feedback.tsx`)
   - Category selector
   - Subject and message fields
   - Optional email field
   - Submit button

### Navigation

- Add "Submit Gym" option in profile tab or as a floating action button
- Add "Feedback" option in profile tab settings

## Deployment Strategy

### FastAPI Backend
- Containerize with Docker
- Deploy to Google Cloud Run
- Environment variables for database connection
- CORS configuration for mobile app

### Database Migration
- Use Drizzle Kit to generate and apply migrations
- Run migrations before deploying new backend version

## Security Considerations

1. **Authentication**: 
   - Optional for feedback (allow anonymous)
   - Required for gym submissions (to track submitter)

2. **Rate Limiting**:
   - Limit submissions per user per day
   - Prevent spam and abuse

3. **Input Validation**:
   - Validate all fields
   - Sanitize text inputs
   - Validate coordinates range

4. **Moderation**:
   - All gym submissions start as "pending"
   - Admin review required before approval
   - Future: Admin dashboard for moderation

## Future Enhancements

1. Image upload to cloud storage (GCS/S3)
2. Geocoding API integration for automatic lat/lng
3. Admin dashboard for moderation
4. Email notifications for submission status
5. Community voting/rating system
6. Duplicate detection for gym submissions
