/**
 * Photo and Milestone API Client
 *
 * Handles fetching photos and milestones from the backend REST API.
 */

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ============== TYPES ==============

export interface Milestone {
  id: number;
  trip_id: number;
  name: string;
  description?: string;
  location?: string;
  tags: string[];
  created_at: string;
  created_by_user_id?: string;
  photo_count: number;
  cover_photo_id?: number;
}

export interface Photo {
  id: number;
  trip_id: number;
  milestone_id?: number;
  uploaded_by_user_id?: string;
  photo_url: string;
  thumbnail_url?: string;
  storage_path?: string;
  description?: string;
  tags: string[];
  detected_people: string[];
  location_name?: string;
  order_index: number;
  created_at: string;
}

// ============== API FUNCTIONS ==============

/**
 * Get all milestones for a trip.
 *
 * @param tripId - The trip ID
 * @returns Array of milestones
 */
export async function getTripMilestones(tripId: number): Promise<Milestone[]> {
  try {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/milestones`);

    if (!res.ok) {
      throw new Error(`Failed to fetch milestones: ${res.statusText}`);
    }

    const data = await res.json();
    return data.milestones || [];
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }
}

/**
 * Get all photos in a specific milestone.
 *
 * @param milestoneId - The milestone ID
 * @returns Array of photos
 */
export async function getMilestonePhotos(milestoneId: number): Promise<Photo[]> {
  try {
    const res = await fetch(`${API_URL}/api/milestones/${milestoneId}/photos`);

    if (!res.ok) {
      throw new Error(`Failed to fetch milestone photos: ${res.statusText}`);
    }

    const data = await res.json();
    return data.photos || [];
  } catch (error) {
    console.error("Error fetching milestone photos:", error);
    return [];
  }
}

/**
 * Get all photos for a trip (across all milestones).
 *
 * @param tripId - The trip ID
 * @returns Array of photos
 */
export async function getTripPhotos(tripId: number): Promise<Photo[]> {
  try {
    const res = await fetch(`${API_URL}/api/trips/${tripId}/photos`);

    if (!res.ok) {
      throw new Error(`Failed to fetch trip photos: ${res.statusText}`);
    }

    const data = await res.json();
    return data.photos || [];
  } catch (error) {
    console.error("Error fetching trip photos:", error);
    return [];
  }
}
