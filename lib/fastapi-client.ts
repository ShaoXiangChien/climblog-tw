/**
 * FastAPI Backend Client
 * Handles communication with the FastAPI backend for gym submissions and feedback
 */

import Constants from 'expo-constants';

// Get FastAPI backend URL from environment
const FASTAPI_BASE_URL = Constants.expoConfig?.extra?.fastApiUrl || 'http://localhost:8000';

export interface GymSubmission {
  user_id: number;
  name: string;
  city: string;
  district?: string;
  address: string;
  lat?: string;
  lng?: string;
  type: 'bouldering' | 'lead' | 'mixed';
  price_from?: number;
  hours_text?: string;
  tags?: string[];
  cover_image_url?: string;
  phone?: string;
  website?: string;
  description?: string;
}

export interface GymSubmissionResponse extends GymSubmission {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmission {
  user_id?: number;
  email?: string;
  category: 'bug' | 'feature_request' | 'improvement' | 'other';
  subject: string;
  message: string;
  app_version?: string;
  device_info?: string;
}

export interface FeedbackResponse extends FeedbackSubmission {
  id: number;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

class FastAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit a new gym
   */
  async submitGym(gym: GymSubmission): Promise<GymSubmissionResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/gyms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gym),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit gym');
    }

    return response.json();
  }

  /**
   * Get user's gym submissions
   */
  async getUserGymSubmissions(
    userId: number,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<GymSubmissionResponse[]> {
    const params = new URLSearchParams({ user_id: userId.toString() });
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/gyms/submissions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch gym submissions');
    }

    return response.json();
  }

  /**
   * Get all approved gyms
   */
  async getApprovedGyms(): Promise<GymSubmissionResponse[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/gyms/approved`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch approved gyms');
    }

    return response.json();
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit feedback');
    }

    return response.json();
  }

  /**
   * Get user's feedback submissions
   */
  async getUserFeedback(userId: number): Promise<FeedbackResponse[]> {
    const params = new URLSearchParams({ user_id: userId.toString() });

    const response = await fetch(`${this.baseUrl}/api/v1/feedback/my?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch feedback');
    }

    return response.json();
  }
}

// Export singleton instance
export const fastApiClient = new FastAPIClient();
