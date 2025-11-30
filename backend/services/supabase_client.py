"""
Supabase Client Service

Singleton client for database operations using service role key.
"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get singleton Supabase client with service role key."""
    global _client

    if _client is None:
        url = os.getenv("SUPABASE_URL")
        # Use service role key for backend operations (bypasses RLS)
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required")

        _client = create_client(url, key)

    return _client


def reset_client():
    """Reset the singleton client (useful for testing)."""
    global _client
    _client = None
