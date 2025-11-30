# 🔄 Migration Strategy - Adding Database Without Breaking Current Implementation

## 🎯 Goal
Add persistent PostgreSQL database to Journi **without affecting the current working implementation**.

## ✅ Safe Approach: Parallel Implementation

### Current Architecture (Keep Running)
```
Frontend → WebSocket → Backend (LangGraph) → InMemorySaver (volatile)
                                           → Supabase Storage (photos)
```

### New Architecture (Add Alongside)
```
Frontend → WebSocket → Backend (LangGraph) → InMemorySaver (volatile) ← KEEP
                                           → AsyncPostgresSaver (persistent) ← ADD
                                           → Supabase Storage (photos) ← KEEP
         → API Routes → Supabase Client → PostgreSQL Tables ← NEW
```

---

## 🔐 Phase 0: Prerequisites (Safe to do now)

### Step 0.1: Get PostgreSQL Connection String
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl
2. Settings → Database → Connection String → URI
3. Copy the connection string (format: `postgresql://postgres:[password]@db.jtnukzkvwsrsbvedrwsl.supabase.co:5432/postgres`)

### Step 0.2: Add to Backend Environment
**File**: `backend/.env` (create if doesn't exist)
```bash
# OpenAI (required for LangGraph agent)
OPENAI_API_KEY=your_key_here

# Supabase Storage (already working)
SUPABASE_URL=https://jtnukzkvwsrsbvedrwsl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# NEW - PostgreSQL persistence for LangGraph
SUPABASE_DB_URL=postgresql://postgres:[YOUR_PASSWORD]@db.jtnukzkvwsrsbvedrwsl.supabase.co:5432/postgres
```

**Impact**: ✅ None - Backend already checks for this variable and falls back to InMemorySaver if missing

---

## 📊 Phase 1: Create Database Schema (No code changes)

### Step 1.1: Create Tables in Supabase
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/sql
2. Run the schema creation script (see `schema.sql` below)

**Impact**: ✅ None - Just creates empty tables, doesn't affect running code

### Step 1.2: Enable RLS Policies
1. Run RLS policies script (see `rls_policies.sql` below)

**Impact**: ✅ None - Only affects new data access patterns

---

## 🔌 Phase 2: Enable LangGraph Persistence (Minimal risk)

### Step 2.1: Add SUPABASE_DB_URL to Backend
Once you have the connection string, add it to backend environment.

**What happens**:
- `backend/graph.py` line 1325 will detect `SUPABASE_DB_URL`
- Will use `AsyncPostgresSaver` instead of `InMemorySaver`
- LangGraph state will persist to PostgreSQL automatically
- First run will call `await _checkpointer.setup()` to create checkpoint tables

**Risk**: 🟡 Low
- If connection fails → Falls back to InMemorySaver (same as before)
- If successful → State persists between restarts (improvement!)

**Testing**:
```bash
# Restart backend
cd backend
python main.py

# Check logs for:
# ✅ "Using PostgreSQL checkpointer" (success)
# ⚠️  "Using in-memory checkpointer" (fallback, same as before)
```

---

## 📝 Phase 3: Add API Routes for Database Access (Optional, new features)

This phase adds NEW functionality without touching existing code.

### Step 3.1: Create API Routes for Trips
**File**: `src/app/api/trips/route.ts` (NEW FILE)

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query trips where user is participant
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      trip_participants!inner(user_id)
    `)
    .eq('trip_participants.user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**Impact**: ✅ None - New endpoint doesn't affect existing WebSocket flow

### Step 3.2: Create Frontend Hook
**File**: `src/hooks/useTrips.ts` (NEW FILE)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      const response = await fetch('/api/trips');
      const data = await response.json();
      setTrips(data);
      setLoading(false);
    }
    fetchTrips();
  }, []);

  return { trips, loading };
}
```

**Impact**: ✅ None - Optional hook, doesn't replace existing data fetching

---

## 🔄 Phase 4: Gradual Migration (When ready)

### Option A: Keep Both Systems (Recommended for now)
- LangGraph continues managing real-time state (WebSocket)
- Database stores historical data (past trips, archived expenses)
- Best of both worlds: Real-time + Persistence

### Option B: Full Migration (Future)
- Move all state management to database
- LangGraph only for AI chat processing
- Requires rewriting data access patterns

**Recommendation**: Start with Option A, migrate to Option B later if needed.

---

## 🛡️ Safety Guarantees

### 1. Backward Compatibility
- ✅ If database is down → Falls back to InMemorySaver
- ✅ Existing WebSocket flow unchanged
- ✅ All current features continue working

### 2. Rollback Plan
If anything goes wrong:
```bash
# Remove SUPABASE_DB_URL from backend/.env
# Restart backend → Back to InMemorySaver
```

### 3. Testing Strategy
1. **Local Testing**: Test each phase on localhost first
2. **Staging**: Deploy to separate Supabase project for testing
3. **Production**: Deploy with feature flags to enable gradually

---

## 📋 Implementation Checklist

### Phase 0: Prerequisites
- [ ] Get Supabase PostgreSQL connection string
- [ ] Add to `backend/.env` as `SUPABASE_DB_URL`
- [ ] Verify backend can connect (check logs)

### Phase 1: Database Schema
- [ ] Run `schema.sql` in Supabase SQL Editor
- [ ] Verify tables created (8 tables)
- [ ] Run `rls_policies.sql`
- [ ] Verify RLS enabled

### Phase 2: Enable Persistence
- [ ] Restart backend with `SUPABASE_DB_URL`
- [ ] Verify "Using PostgreSQL checkpointer" in logs
- [ ] Test LangGraph checkpoint tables created
- [ ] Verify existing features still work

### Phase 3: API Routes (Optional)
- [ ] Create `/api/trips` route
- [ ] Create `/api/expenses` route
- [ ] Create `useTrips` hook
- [ ] Test in dashboard

### Phase 4: Integration
- [ ] Decide on Option A or B
- [ ] Update frontend to use database for historical data
- [ ] Keep WebSocket for real-time features

---

## 🚨 What NOT to Do

❌ **Don't**: Modify `backend/graph.py` LangGraph state logic
❌ **Don't**: Remove InMemorySaver fallback
❌ **Don't**: Change WebSocket message structure
❌ **Don't**: Alter existing frontend data hooks during migration
❌ **Don't**: Drop tables without backup

✅ **Do**: Add new code alongside existing
✅ **Do**: Test each phase independently
✅ **Do**: Keep rollback option available
✅ **Do**: Monitor logs for errors
✅ **Do**: Backup data before major changes

---

## 📊 Migration Timeline

### Week 1: Foundation
- Day 1-2: Phase 0 (Get credentials, test connection)
- Day 3-4: Phase 1 (Create schema, enable RLS)
- Day 5: Phase 2 (Enable LangGraph persistence)

### Week 2: Integration
- Day 1-3: Phase 3 (API routes for trips/expenses)
- Day 4-5: Test and verify all features work

### Week 3: Optimization
- Update frontend to use database for historical data
- Keep WebSocket for real-time
- Monitor performance

---

## 🎯 Success Metrics

After migration, you should have:
1. ✅ All current features working unchanged
2. ✅ LangGraph state persists between restarts
3. ✅ Historical trips stored in database
4. ✅ Expenses queryable via SQL
5. ✅ Zero downtime during migration
6. ✅ Ability to rollback if needed

---

## 📞 Next Steps

1. **Get PostgreSQL connection string** from Supabase dashboard
2. **Run schema creation scripts** (I'll provide these next)
3. **Test connection** with `SUPABASE_DB_URL` in backend
4. **Verify** existing features still work
5. **Gradually add** new database-backed features

Ready to proceed? I can provide the exact SQL scripts for Phase 1.
