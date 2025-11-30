# 🚀 Database Setup Guide - Journi

## Quick Start (5 Minutes)

### Step 1: Get Your PostgreSQL Connection String
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/settings/database)
2. Click **Settings → Database**
3. Find **Connection String** section
4. Select **URI** tab
5. Copy the connection string (it looks like this):
   ```
   postgresql://postgres.jtnukzkvwsrsbvedrwsl:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 2: Run Database Migrations
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/sql)
2. Click **New Query**
3. Copy and paste the content from each migration file **in order**:
   - ✅ First: `supabase/migrations/001_initial_schema.sql`
   - ✅ Second: `supabase/migrations/002_rls_policies.sql`
   - ✅ Third: `supabase/migrations/003_views_and_functions.sql`
4. Click **Run** after each file

### Step 3: Configure Backend (Optional - for LangGraph persistence)
1. Create `backend/.env` file if it doesn't exist:
   ```bash
   cd backend
   touch .env
   ```

2. Add these environment variables:
   ```bash
   # OpenAI API (required for chatbot)
   OPENAI_API_KEY=your_openai_key_here

   # Supabase Storage (already configured)
   SUPABASE_URL=https://jtnukzkvwsrsbvedrwsl.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # NEW - PostgreSQL persistence (paste your connection string here)
   SUPABASE_DB_URL=postgresql://postgres.jtnukzkvwsrsbvedrwsl:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

3. Restart your backend:
   ```bash
   python main.py
   ```

4. Check logs for success:
   ```
   ✅ "Using PostgreSQL checkpointer" = Success! Data will persist
   ⚠️  "Using in-memory checkpointer" = Fallback (check connection string)
   ```

---

## What Just Happened?

### ✅ Tables Created (8 total)
1. **users** - User profiles extending Supabase Auth
2. **trips** - Trip/session metadata with unique codes
3. **trip_participants** - Who's in each trip
4. **expenses** - All expenses recorded
5. **expense_splits** - How expenses are divided
6. **chat_messages** - Group chat history
7. **photos** - Photo album metadata
8. **locations** - Visited places for map

### 🔐 Security Enabled
- Row Level Security (RLS) on all tables
- Users can only see their own trips
- Automatic permission checks
- 35 security policies created

### ⚡ Auto Features Added
1. **Auto expense splits** - When you add an expense, it's automatically split equally among all participants
2. **Auto timestamps** - `updated_at` updates automatically
3. **Balance calculations** - View `user_trip_balances` to see who owes what
4. **Debt simplification** - Call `calculate_debt_summary(trip_id)` to minimize transactions
5. **Session code generator** - Use `generate_session_code()` for unique trip codes

---

## Verify It's Working

### Check Tables Exist
1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl/editor)
2. You should see 8 new tables on the left sidebar

### Run a Test Query
Go to SQL Editor and run:
```sql
-- Should return your tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show: chat_messages, expense_splits, expenses, locations,
--              photos, trip_participants, trips, users
```

---

## 🎯 Impact on Current App

### ✅ What Still Works (No Changes)
- ✅ Authentication (Supabase Auth)
- ✅ Dashboard page
- ✅ Create session page
- ✅ Session/chatbot page
- ✅ WebSocket real-time chat
- ✅ Photo uploads to Supabase Storage
- ✅ All existing features

### 🆕 What's New
- ✅ Database tables ready for use
- ✅ LangGraph can persist state (if `SUPABASE_DB_URL` configured)
- ✅ RLS security policies active
- ✅ Helper functions available for queries

### ❌ What Doesn't Change Automatically
- Current frontend still uses mock data in some places
- Need to create API routes to use the database from frontend
- Backend LangGraph still uses in-memory state unless you add `SUPABASE_DB_URL`

---

## Next Steps (Optional)

### Option 1: Enable Backend Persistence (Recommended)
Add `SUPABASE_DB_URL` to `backend/.env` so LangGraph state persists between restarts.

### Option 2: Create API Routes (Future)
Create Next.js API routes to read/write trips and expenses from the database:
- `GET /api/trips` - List user's trips
- `POST /api/trips` - Create new trip
- `GET /api/expenses/[tripId]` - Get trip expenses
- `POST /api/expenses` - Add expense

### Option 3: Keep Current Setup
Everything works as-is. Database is ready when you need it.

---

## Useful Queries

### Get all trips for a user
```sql
SELECT t.*, COUNT(tp.user_id) as participant_count
FROM trips t
JOIN trip_participants tp ON t.id = tp.trip_id
WHERE tp.user_id = auth.uid()
GROUP BY t.id
ORDER BY t.start_date DESC;
```

### Get trip summary with stats
```sql
SELECT * FROM trip_summary_stats
WHERE trip_id = 1;
```

### Calculate who owes whom
```sql
SELECT * FROM calculate_debt_summary(1);
-- Replace 1 with your trip_id
```

### See all balances
```sql
SELECT * FROM user_trip_balances
WHERE trip_id = 1;
```

---

## Troubleshooting

### "Permission denied" errors
- Make sure you're authenticated (run queries in Supabase dashboard while logged in)
- Check RLS policies are enabled
- Verify user is in `trip_participants` table

### Backend not connecting to database
```bash
# Check your connection string format
echo $SUPABASE_DB_URL

# Should look like:
# postgresql://postgres.XXX:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Make sure there are no extra spaces or line breaks
```

### Tables not showing up
- Run migrations in order: 001 → 002 → 003
- Check for SQL errors in the output
- Refresh your browser

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Database Dashboard**: https://supabase.com/dashboard/project/jtnukzkvwsrsbvedrwsl

---

## 🎉 You're Done!

Your database is now set up and ready to use. The migrations are safe to run and won't affect your current implementation. Everything continues to work as before, with database persistence now available when you need it.
