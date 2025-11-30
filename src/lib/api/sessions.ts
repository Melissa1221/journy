/**
 * Session/Trip API Service
 *
 * API client for trip CRUD operations.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Types
export interface CreateTripRequest {
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  location?: string;
}

export interface TripResponse {
  id: number;
  name: string;
  session_code: string;
  start_date: string;
  end_date: string;
  location: string | null;
  status: string;
  creator_id: string;
  created_at: string;
  updated_at?: string;
}

export interface TripPublicInfo {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string | null;
  participant_count: number;
  status: string;
}

export interface JoinTripResponse {
  status: string;
  user_id?: string;
  anonymous_token?: string;
  display_name?: string;
  trip_id: number;
  session_code: string;
}

// API Functions

/**
 * Create a new trip. Requires authentication.
 */
export async function createTrip(
  data: CreateTripRequest,
  accessToken: string
): Promise<TripResponse> {
  const response = await fetch(`${BACKEND_URL}/api/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create trip: ${response.status}`);
  }

  return response.json();
}

/**
 * Get trip by session code. Public endpoint.
 */
export async function getTripByCode(code: string): Promise<TripPublicInfo | null> {
  const response = await fetch(`${BACKEND_URL}/api/trips/code/${code.toUpperCase()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to get trip: ${response.status}`);
  }

  return response.json();
}

/**
 * Get trip by ID. Requires authentication.
 */
export async function getTripById(
  tripId: number,
  accessToken: string
): Promise<TripResponse | null> {
  const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to get trip: ${response.status}`);
  }

  return response.json();
}

/**
 * List user's trips. Requires authentication.
 */
export async function listTrips(
  accessToken: string
): Promise<{ trips: TripResponse[]; total: number }> {
  const response = await fetch(`${BACKEND_URL}/api/trips`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to list trips: ${response.status}`);
  }

  return response.json();
}

/**
 * Join a trip.
 * - Authenticated users: pass accessToken
 * - Anonymous users: pass displayName
 */
export async function joinTrip(
  tripId: number,
  options: { accessToken?: string; displayName?: string }
): Promise<JoinTripResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const body: Record<string, string> = {};
  if (options.displayName) {
    body.display_name = options.displayName;
  }

  const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}/join`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to join trip: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a trip. Creator only.
 */
export async function deleteTrip(
  tripId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to delete trip: ${response.status}`);
  }
}
