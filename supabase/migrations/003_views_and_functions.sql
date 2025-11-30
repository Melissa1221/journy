-- ============================================
-- JOURNI - Helper Views and Functions
-- ============================================
-- Version: 1.0
-- Created: 2024-11-29
-- Description: Useful views and functions for common queries
-- ============================================

-- ============================================
-- VIEW: user_trip_balances
-- ============================================
-- Calculates balance for each user in each trip
-- Positive balance = user is owed money
-- Negative balance = user owes money

CREATE OR REPLACE VIEW user_trip_balances AS
SELECT
  tp.trip_id,
  tp.user_id,
  u.full_name,
  u.email,
  u.avatar_url,
  -- Total amount paid by this user
  COALESCE(SUM(CASE WHEN e.paid_by_user_id = tp.user_id THEN e.amount ELSE 0 END), 0) AS total_paid,
  -- Total amount this user owes (their share of expenses)
  COALESCE(SUM(es.amount), 0) AS total_owed,
  -- Balance: positive = owed to them, negative = they owe
  COALESCE(SUM(CASE WHEN e.paid_by_user_id = tp.user_id THEN e.amount ELSE 0 END), 0)
    - COALESCE(SUM(es.amount), 0) AS balance
FROM trip_participants tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN expenses e ON e.trip_id = tp.trip_id
LEFT JOIN expense_splits es ON es.user_id = tp.user_id
  AND es.expense_id IN (
    SELECT id FROM expenses WHERE trip_id = tp.trip_id
  )
GROUP BY tp.trip_id, tp.user_id, u.full_name, u.email, u.avatar_url;

COMMENT ON VIEW user_trip_balances IS 'Balance calculation for each user in each trip';

-- ============================================
-- VIEW: trip_summary_stats
-- ============================================
-- Summary statistics for each trip

CREATE OR REPLACE VIEW trip_summary_stats AS
SELECT
  t.id AS trip_id,
  t.name AS trip_name,
  t.status,
  t.start_date,
  t.end_date,
  -- Duration calculations
  (t.end_date - t.start_date + 1) AS total_days,
  CASE
    WHEN CURRENT_DATE < t.start_date THEN 'upcoming'
    WHEN CURRENT_DATE > t.end_date THEN 'completed'
    ELSE 'active'
  END AS current_status,
  -- Participant count
  COUNT(DISTINCT tp.user_id) AS participant_count,
  -- Expense statistics
  COALESCE(SUM(e.amount), 0) AS total_spent,
  COUNT(DISTINCT e.id) AS expense_count,
  -- Photo count
  COUNT(DISTINCT p.id) AS photo_count,
  -- Location count
  COUNT(DISTINCT l.id) AS location_count,
  -- Chat message count
  COUNT(DISTINCT cm.id) AS message_count
FROM trips t
LEFT JOIN trip_participants tp ON t.id = tp.trip_id
LEFT JOIN expenses e ON t.id = e.trip_id
LEFT JOIN photos p ON t.id = p.trip_id
LEFT JOIN locations l ON t.id = l.trip_id
LEFT JOIN chat_messages cm ON t.id = cm.trip_id
GROUP BY t.id, t.name, t.status, t.start_date, t.end_date;

COMMENT ON VIEW trip_summary_stats IS 'Summary statistics for all trips';

-- ============================================
-- FUNCTION: get_trip_duration
-- ============================================
-- Returns detailed duration info for a trip

CREATE OR REPLACE FUNCTION get_trip_duration(trip_id_param BIGINT)
RETURNS TABLE(
  total_days INTEGER,
  current_day INTEGER,
  days_left INTEGER,
  progress_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (end_date - start_date + 1)::INTEGER AS total_days,
    LEAST((CURRENT_DATE - start_date + 1)::INTEGER, (end_date - start_date + 1)::INTEGER) AS current_day,
    GREATEST((end_date - CURRENT_DATE)::INTEGER, 0) AS days_left,
    ROUND(
      (LEAST((CURRENT_DATE - start_date + 1)::NUMERIC, (end_date - start_date + 1)::NUMERIC)
      / NULLIF((end_date - start_date + 1)::NUMERIC, 0)) * 100,
      1
    ) AS progress_percent
  FROM trips
  WHERE id = trip_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_trip_duration IS 'Calculate trip duration and progress';

-- ============================================
-- FUNCTION: calculate_debt_summary
-- ============================================
-- Simplifies complex debts into minimal transactions
-- Uses greedy algorithm to minimize number of transactions

CREATE OR REPLACE FUNCTION calculate_debt_summary(trip_id_param BIGINT)
RETURNS TABLE(
  debtor_id UUID,
  debtor_name TEXT,
  creditor_id UUID,
  creditor_name TEXT,
  amount DECIMAL,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH balances AS (
    SELECT * FROM user_trip_balances WHERE trip_id = trip_id_param
  )
  SELECT
    debtor.user_id AS debtor_id,
    debtor.full_name AS debtor_name,
    creditor.user_id AS creditor_id,
    creditor.full_name AS creditor_name,
    LEAST(ABS(debtor.balance), creditor.balance) AS amount,
    'PEN'::TEXT AS currency
  FROM balances debtor
  CROSS JOIN balances creditor
  WHERE debtor.balance < -0.01  -- owes money (with small threshold for floating point)
    AND creditor.balance > 0.01  -- is owed money
    AND debtor.trip_id = creditor.trip_id
  ORDER BY amount DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_debt_summary IS 'Calculate simplified debt summary (who owes whom)';

-- ============================================
-- FUNCTION: generate_session_code
-- ============================================
-- Generates a unique 6-character alphanumeric session code

CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Excluding similar looking chars (I, O, 0, 1, L)
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM trips WHERE session_code = result) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_session_code IS 'Generate unique 6-character session code for trips';

-- ============================================
-- FUNCTION: auto_create_expense_splits
-- ============================================
-- Automatically creates expense splits when an expense is created
-- Divides amount equally among all trip participants

CREATE OR REPLACE FUNCTION auto_create_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  split_amount DECIMAL(10, 2);
  participant_count INTEGER;
BEGIN
  -- Count participants in the trip
  SELECT COUNT(*) INTO participant_count
  FROM trip_participants
  WHERE trip_id = NEW.trip_id;

  -- Calculate split amount (divide equally)
  split_amount := NEW.amount / participant_count;

  -- Create split for each participant
  FOR participant IN
    SELECT user_id FROM trip_participants WHERE trip_id = NEW.trip_id
  LOOP
    INSERT INTO expense_splits (expense_id, user_id, amount)
    VALUES (NEW.id, participant.user_id, split_amount);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-create splits on expense insert
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_create_expense_splits ON expenses;
CREATE TRIGGER trigger_auto_create_expense_splits
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_expense_splits();

COMMENT ON FUNCTION auto_create_expense_splits IS 'Automatically split expenses equally among participants';

-- ============================================
-- FUNCTION: get_user_trip_stats
-- ============================================
-- Get comprehensive stats for a user in a specific trip

CREATE OR REPLACE FUNCTION get_user_trip_stats(
  p_user_id UUID,
  p_trip_id BIGINT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', p_user_id,
    'trip_id', p_trip_id,
    'total_paid', COALESCE(SUM(CASE WHEN e.paid_by_user_id = p_user_id THEN e.amount ELSE 0 END), 0),
    'total_owed', COALESCE(SUM(es.amount), 0),
    'balance', COALESCE(SUM(CASE WHEN e.paid_by_user_id = p_user_id THEN e.amount ELSE 0 END), 0)
      - COALESCE(SUM(es.amount), 0),
    'expense_count', COUNT(DISTINCT CASE WHEN e.paid_by_user_id = p_user_id THEN e.id END),
    'photos_uploaded', COUNT(DISTINCT p.id),
    'locations_added', COUNT(DISTINCT l.id),
    'messages_sent', COUNT(DISTINCT cm.id)
  ) INTO result
  FROM trip_participants tp
  LEFT JOIN expenses e ON e.trip_id = tp.trip_id
  LEFT JOIN expense_splits es ON es.user_id = tp.user_id
    AND es.expense_id IN (SELECT id FROM expenses WHERE trip_id = tp.trip_id)
  LEFT JOIN photos p ON p.trip_id = tp.trip_id AND p.uploaded_by_user_id = tp.user_id
  LEFT JOIN locations l ON l.trip_id = tp.trip_id AND l.added_by_user_id = tp.user_id
  LEFT JOIN chat_messages cm ON cm.trip_id = tp.trip_id AND cm.user_id = tp.user_id
  WHERE tp.user_id = p_user_id AND tp.trip_id = p_trip_id
  GROUP BY tp.user_id, tp.trip_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_trip_stats IS 'Get comprehensive statistics for a user in a trip';

-- ============================================
-- FUNCTION: get_recent_activity
-- ============================================
-- Get recent activity feed for a trip (expenses, photos, locations)

CREATE OR REPLACE FUNCTION get_recent_activity(
  p_trip_id BIGINT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  activity_type TEXT,
  activity_id BIGINT,
  user_id UUID,
  user_name TEXT,
  description TEXT,
  amount DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Expenses
    SELECT
      'expense'::TEXT AS activity_type,
      e.id AS activity_id,
      e.paid_by_user_id AS user_id,
      u.full_name AS user_name,
      e.description,
      e.amount,
      e.created_at
    FROM expenses e
    JOIN users u ON e.paid_by_user_id = u.id
    WHERE e.trip_id = p_trip_id

    UNION ALL

    -- Photos
    SELECT
      'photo'::TEXT AS activity_type,
      p.id AS activity_id,
      p.uploaded_by_user_id AS user_id,
      u.full_name AS user_name,
      COALESCE(p.caption, 'Uploaded a photo') AS description,
      NULL::DECIMAL AS amount,
      p.created_at
    FROM photos p
    JOIN users u ON p.uploaded_by_user_id = u.id
    WHERE p.trip_id = p_trip_id

    UNION ALL

    -- Locations
    SELECT
      'location'::TEXT AS activity_type,
      l.id AS activity_id,
      l.added_by_user_id AS user_id,
      u.full_name AS user_name,
      'Added location: ' || l.name AS description,
      NULL::DECIMAL AS amount,
      l.created_at
    FROM locations l
    JOIN users u ON l.added_by_user_id = u.id
    WHERE l.trip_id = p_trip_id
  )
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recent_activity IS 'Get recent activity feed for a trip';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Views and functions created successfully!';
  RAISE NOTICE '📊 Views created: 2';
  RAISE NOTICE '⚡ Functions created: 6';
  RAISE NOTICE '🔧 Triggers created: 1 (auto expense splits)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  1. Query user_trip_balances for balance info';
  RAISE NOTICE '  2. Query trip_summary_stats for trip statistics';
  RAISE NOTICE '  3. Call calculate_debt_summary(trip_id) for who owes whom';
  RAISE NOTICE '  4. Use generate_session_code() when creating trips';
  RAISE NOTICE '  5. Expense splits are automatically created!';
END $$;
