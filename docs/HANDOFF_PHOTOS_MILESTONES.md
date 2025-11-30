# Handoff: Photos & Milestones Feature

**Assigned to:** [Other Dev]
**Date:** 2024-11-29

---

## Your Scope

You own **photos and milestones** - database, backend, and frontend integration.

---

## Current State

### What Already Exists (In-Memory Only)

**`backend/graph.py`** has TypedDict definitions (lines 50-91):

```python
class Photo(TypedDict):
    id: str
    milestone_id: str
    storage_url: str
    storage_path: str
    thumbnail_url: Optional[str]
    description: str
    tags: list[str]
    detected_people: list[str]
    location: Optional[str]
    uploaded_by: str
    uploaded_at: str
    order_index: int

class Milestone(TypedDict):
    id: str
    name: str
    description: Optional[str]
    location: Optional[str]
    tags: list[str]
    created_at: str
    created_by: str
    photo_count: int
    cover_photo_id: Optional[str]
```

**LangGraph State** (`JourniState` line 79-91):
```python
milestones: list[Milestone]
photos: list[Photo]
```

**Tools Already Implemented** (lines 292-510):
- `create_milestone()` - Creates milestone in LangGraph state
- `edit_milestone()` - Edits milestone
- `delete_milestone()` - Deletes milestone
- `list_milestones()` - Lists all milestones
- `register_photo()` - Registers photo metadata
- `edit_photo()` - Edits photo metadata
- `delete_photo()` - Deletes photo
- `list_photos()` - Lists photos
- `view_photos()` - View/analyze stored photos

**Storage Service** (`backend/services/supabase_storage.py`):
- Already uploads to Supabase Storage bucket `trip-photos/{session_id}/{filename}`
- Has `upload()`, `delete()`, `download_as_base64()`, `get_public_url()`

### What's Missing

1. **Database tables** - Photos/milestones only exist in LangGraph state (lost if checkpointer not configured)
2. **REST API endpoints** - No HTTP endpoints for CRUD
3. **Frontend UI** - No gallery, no milestone viewer, no photo upload UI (only via chat)
4. **Sync with Supabase** - Currently stored in LangGraph checkpoints, not queryable

---

## Your Migrations

### `004_milestones.sql`

```sql
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cover_photo_id UUID  -- Will reference photos.id after that table exists
);

CREATE INDEX idx_milestones_trip_id ON public.milestones(trip_id);
```

### `005_photos.sql`

```sql
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    detected_people TEXT[] DEFAULT '{}',
    location TEXT,
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_index INTEGER DEFAULT 0
);

CREATE INDEX idx_photos_trip_id ON public.photos(trip_id);
CREATE INDEX idx_photos_milestone_id ON public.photos(milestone_id);

-- Add foreign key for cover_photo after photos table exists
ALTER TABLE public.milestones
ADD CONSTRAINT fk_cover_photo
FOREIGN KEY (cover_photo_id) REFERENCES public.photos(id) ON DELETE SET NULL;
```

---

## Files You Own (Safe to Modify)

### Backend
| File | What to Do |
|------|------------|
| `backend/services/milestone_service.py` | **CREATE** - CRUD for milestones table |
| `backend/services/photo_service.py` | **CREATE** - CRUD for photos table |
| `backend/models/photo.py` | **CREATE** - Pydantic models |
| `backend/models/milestone.py` | **CREATE** - Pydantic models |

### Frontend
| File | What to Do |
|------|------------|
| `src/app/session/[id]/gallery/page.tsx` | **CREATE** - Photo gallery view |
| `src/components/PhotoUpload.tsx` | **CREATE** - Upload component |
| `src/components/MilestoneCard.tsx` | **CREATE** - Milestone display |
| `src/components/PhotoGrid.tsx` | **CREATE** - Photo grid display |
| `src/lib/api/photos.ts` | **CREATE** - API service for photos |

### Database
| File | What to Do |
|------|------------|
| `supabase/migrations/004_milestones.sql` | **CREATE** |
| `supabase/migrations/005_photos.sql` | **CREATE** |

---

## Files to AVOID (I'm Working On These)

| File | Reason |
|------|--------|
| `backend/main.py` | I'm adding session/trip endpoints and new WebSocket |
| `backend/middleware/auth.py` | I'm creating this for JWT validation |
| `backend/services/session_service.py` | I'm creating this |
| `backend/services/auth_service.py` | I'm creating this |
| `src/app/create-session/page.tsx` | I'm fixing session creation flow |
| `src/app/session/[id]/page.tsx` | I'm adding session validation |
| `src/app/join/[code]/page.tsx` | I'm adding session validation |
| `supabase/migrations/006_anonymous_sessions.sql` | My migration |

---

## Shared Files (Coordinate Before Editing)

| File | Notes |
|------|-------|
| `backend/graph.py` | Has photo/milestone tool handlers. If you need to modify sync logic, ping me first. |
| `backend/services/__init__.py` | We both add exports here. Quick sync needed. |
| `src/hooks/useJourniChat.ts` | I might touch this for session validation. Check before modifying. |

---

## API Endpoints You Should Create

Add these to `backend/main.py` (coordinate with me on placement):

```python
# Milestones
GET  /api/trips/{trip_id}/milestones          # List milestones
POST /api/trips/{trip_id}/milestones          # Create milestone
GET  /api/trips/{trip_id}/milestones/{id}     # Get milestone
PUT  /api/trips/{trip_id}/milestones/{id}     # Update milestone
DELETE /api/trips/{trip_id}/milestones/{id}   # Delete milestone

# Photos
GET  /api/trips/{trip_id}/photos              # List photos
POST /api/trips/{trip_id}/photos              # Upload photo
GET  /api/trips/{trip_id}/photos/{id}         # Get photo
PUT  /api/trips/{trip_id}/photos/{id}         # Update photo metadata
DELETE /api/trips/{trip_id}/photos/{id}       # Delete photo
GET  /api/milestones/{id}/photos              # Photos in milestone
```

---

## Decision: LangGraph vs Supabase Tables

**Option A: Keep using LangGraph tools, sync to Supabase**
- Pros: AI can still register photos via chat
- Cons: Dual-write complexity

**Option B: Move entirely to Supabase, remove LangGraph photo tools**
- Pros: Single source of truth, queryable
- Cons: Lose AI chat-based photo registration

**Recommendation:** Start with Option B for simplicity. The chat-based photo registration can be re-added later if needed.

---

## Questions?

Ping the main dev (working on sessions) before modifying shared files.
