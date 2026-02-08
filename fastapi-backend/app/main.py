"""
FastAPI backend for Rockr climbing app.
Handles user-submitted gyms and feedback forms.
"""
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import (
    GymSubmissionCreate,
    GymSubmissionResponse,
    FeedbackCreate,
    FeedbackResponse,
    SuccessResponse,
    ErrorResponse,
)
from . import crud
from .database import init_db_pool

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Rockr API",
    description="Backend API for Rockr climbing gym app",
    version="1.0.0",
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup."""
    init_db_pool()
    print("✅ Database connection pool initialized")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Rockr API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy"}


# ==================== Gym Submission Endpoints ====================

@app.post(
    "/api/v1/gyms/submit",
    response_model=GymSubmissionResponse,
    status_code=201,
    tags=["Gyms"],
)
async def submit_gym(gym: GymSubmissionCreate):
    """
    Submit a new climbing gym.
    
    Users can submit new gyms to be added to the database.
    All submissions start with 'pending' status and require admin approval.
    """
    try:
        gym_id = crud.create_gym_submission(gym)
        gym_data = crud.get_gym_submission_by_id(gym_id)
        
        if not gym_data:
            raise HTTPException(status_code=500, detail="Failed to retrieve created gym")
        
        return GymSubmissionResponse(**gym_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create gym submission: {str(e)}")


@app.get(
    "/api/v1/gyms/submissions",
    response_model=List[GymSubmissionResponse],
    tags=["Gyms"],
)
async def get_user_gym_submissions(
    user_id: int = Query(..., description="User ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """
    Get gym submissions by user.
    
    Retrieve all gym submissions made by a specific user,
    optionally filtered by status.
    """
    try:
        submissions = crud.get_gym_submissions_by_user(user_id, status)
        return [GymSubmissionResponse(**sub) for sub in submissions]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve submissions: {str(e)}")


@app.get(
    "/api/v1/gyms/approved",
    response_model=List[GymSubmissionResponse],
    tags=["Gyms"],
)
async def get_approved_gyms():
    """
    Get all approved gym submissions.
    
    Returns all gyms that have been approved by admins
    and are ready to be displayed in the app.
    """
    try:
        gyms = crud.get_approved_gyms()
        return [GymSubmissionResponse(**gym) for gym in gyms]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve approved gyms: {str(e)}")


@app.get(
    "/api/v1/gyms/{gym_id}",
    response_model=GymSubmissionResponse,
    tags=["Gyms"],
)
async def get_gym_submission(gym_id: int):
    """Get a specific gym submission by ID."""
    try:
        gym = crud.get_gym_submission_by_id(gym_id)
        
        if not gym:
            raise HTTPException(status_code=404, detail="Gym submission not found")
        
        return GymSubmissionResponse(**gym)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve gym: {str(e)}")


# ==================== Feedback Endpoints ====================

@app.post(
    "/api/v1/feedback",
    response_model=FeedbackResponse,
    status_code=201,
    tags=["Feedback"],
)
async def submit_feedback(feedback: FeedbackCreate):
    """
    Submit user feedback.
    
    Users can submit bug reports, feature requests, improvements,
    or other feedback. User ID is optional for anonymous submissions.
    """
    try:
        feedback_id = crud.create_feedback(feedback)
        feedback_data = crud.get_feedback_by_id(feedback_id)
        
        if not feedback_data:
            raise HTTPException(status_code=500, detail="Failed to retrieve created feedback")
        
        return FeedbackResponse(**feedback_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {str(e)}")


@app.get(
    "/api/v1/feedback/my",
    response_model=List[FeedbackResponse],
    tags=["Feedback"],
)
async def get_my_feedback(user_id: int = Query(..., description="User ID")):
    """
    Get user's feedback submissions.
    
    Retrieve all feedback submitted by a specific user.
    """
    try:
        feedback_list = crud.get_feedback_by_user(user_id)
        return [FeedbackResponse(**fb) for fb in feedback_list]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve feedback: {str(e)}")


@app.get(
    "/api/v1/feedback/{feedback_id}",
    response_model=FeedbackResponse,
    tags=["Feedback"],
)
async def get_feedback(feedback_id: int):
    """Get a specific feedback entry by ID."""
    try:
        feedback = crud.get_feedback_by_id(feedback_id)
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return FeedbackResponse(**feedback)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve feedback: {str(e)}")


# ==================== Admin Endpoints (Future) ====================
# TODO: Add authentication middleware for admin endpoints

@app.get(
    "/api/v1/admin/feedback",
    response_model=List[FeedbackResponse],
    tags=["Admin"],
)
async def get_all_feedback_admin(status: Optional[str] = Query(None, description="Filter by status")):
    """
    [Admin] Get all feedback entries.
    
    Note: This endpoint should be protected with authentication in production.
    """
    try:
        feedback_list = crud.get_all_feedback(status)
        return [FeedbackResponse(**fb) for fb in feedback_list]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve feedback: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
