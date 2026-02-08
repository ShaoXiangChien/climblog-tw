"""
CRUD operations for database tables.
"""
import json
from typing import List, Optional
from datetime import datetime
from .database import get_db_cursor
from .models import GymSubmissionCreate, FeedbackCreate


# Gym Submission CRUD
def create_gym_submission(gym: GymSubmissionCreate) -> int:
    """
    Create a new gym submission.
    
    Args:
        gym: Gym submission data
        
    Returns:
        ID of the created gym submission
    """
    with get_db_cursor() as cursor:
        tags_json = json.dumps(gym.tags) if gym.tags else "[]"
        
        query = """
        INSERT INTO user_submitted_gyms 
        (userId, name, city, district, address, lat, lng, type, priceFrom, 
         hoursText, tags, coverImageUrl, phone, website, description, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            gym.user_id,
            gym.name,
            gym.city,
            gym.district,
            gym.address,
            gym.lat,
            gym.lng,
            gym.type.value,
            gym.price_from,
            gym.hours_text,
            tags_json,
            gym.cover_image_url,
            gym.phone,
            gym.website,
            gym.description,
            "pending"
        )
        
        cursor.execute(query, values)
        return cursor.lastrowid


def get_gym_submission_by_id(gym_id: int) -> Optional[dict]:
    """Get a gym submission by ID."""
    with get_db_cursor() as cursor:
        query = "SELECT * FROM user_submitted_gyms WHERE id = %s"
        cursor.execute(query, (gym_id,))
        return cursor.fetchone()


def get_gym_submissions_by_user(user_id: int, status: Optional[str] = None) -> List[dict]:
    """
    Get all gym submissions by a user.
    
    Args:
        user_id: User ID
        status: Optional status filter
        
    Returns:
        List of gym submissions
    """
    with get_db_cursor() as cursor:
        if status:
            query = """
            SELECT * FROM user_submitted_gyms 
            WHERE userId = %s AND status = %s 
            ORDER BY createdAt DESC
            """
            cursor.execute(query, (user_id, status))
        else:
            query = """
            SELECT * FROM user_submitted_gyms 
            WHERE userId = %s 
            ORDER BY createdAt DESC
            """
            cursor.execute(query, (user_id,))
        
        return cursor.fetchall()


def get_approved_gyms() -> List[dict]:
    """Get all approved gym submissions."""
    with get_db_cursor() as cursor:
        query = """
        SELECT * FROM user_submitted_gyms 
        WHERE status = 'approved' 
        ORDER BY createdAt DESC
        """
        cursor.execute(query)
        return cursor.fetchall()


def update_gym_status(gym_id: int, status: str) -> bool:
    """
    Update gym submission status.
    
    Args:
        gym_id: Gym submission ID
        status: New status (pending/approved/rejected)
        
    Returns:
        True if updated successfully
    """
    with get_db_cursor() as cursor:
        query = "UPDATE user_submitted_gyms SET status = %s WHERE id = %s"
        cursor.execute(query, (status, gym_id))
        return cursor.rowcount > 0


# Feedback CRUD
def create_feedback(feedback: FeedbackCreate) -> int:
    """
    Create a new feedback entry.
    
    Args:
        feedback: Feedback data
        
    Returns:
        ID of the created feedback
    """
    with get_db_cursor() as cursor:
        query = """
        INSERT INTO user_feedback 
        (userId, email, category, subject, message, appVersion, deviceInfo, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            feedback.user_id,
            feedback.email,
            feedback.category.value,
            feedback.subject,
            feedback.message,
            feedback.app_version,
            feedback.device_info,
            "new"
        )
        
        cursor.execute(query, values)
        return cursor.lastrowid


def get_feedback_by_id(feedback_id: int) -> Optional[dict]:
    """Get feedback by ID."""
    with get_db_cursor() as cursor:
        query = "SELECT * FROM user_feedback WHERE id = %s"
        cursor.execute(query, (feedback_id,))
        return cursor.fetchone()


def get_feedback_by_user(user_id: int) -> List[dict]:
    """
    Get all feedback submitted by a user.
    
    Args:
        user_id: User ID
        
    Returns:
        List of feedback entries
    """
    with get_db_cursor() as cursor:
        query = """
        SELECT * FROM user_feedback 
        WHERE userId = %s 
        ORDER BY createdAt DESC
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchall()


def get_all_feedback(status: Optional[str] = None) -> List[dict]:
    """
    Get all feedback entries.
    
    Args:
        status: Optional status filter
        
    Returns:
        List of feedback entries
    """
    with get_db_cursor() as cursor:
        if status:
            query = """
            SELECT * FROM user_feedback 
            WHERE status = %s 
            ORDER BY createdAt DESC
            """
            cursor.execute(query, (status,))
        else:
            query = "SELECT * FROM user_feedback ORDER BY createdAt DESC"
            cursor.execute(query)
        
        return cursor.fetchall()


def update_feedback_status(feedback_id: int, status: str) -> bool:
    """
    Update feedback status.
    
    Args:
        feedback_id: Feedback ID
        status: New status
        
    Returns:
        True if updated successfully
    """
    with get_db_cursor() as cursor:
        query = "UPDATE user_feedback SET status = %s WHERE id = %s"
        cursor.execute(query, (status, feedback_id))
        return cursor.rowcount > 0
