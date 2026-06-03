-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1 NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions on table public.rate_limits from anon, authenticated, public
REVOKE ALL ON TABLE public.rate_limits FROM public, anon, authenticated;

-- Create the check_rate_limit RPC function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
) RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  reset_time TIMESTAMPTZ
) AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_reset TIMESTAMPTZ;
  v_count INT;
  v_window INTERVAL := (p_window_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Clean up expired entries in the table
  DELETE FROM public.rate_limits WHERE expires_at < v_now;

  -- Lock row for update or insert new one
  INSERT INTO public.rate_limits (key, count, expires_at)
  VALUES (p_key, 1, v_now + v_window)
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
    WHEN public.rate_limits.expires_at < v_now THEN 1
    ELSE public.rate_limits.count + 1
  END,
  expires_at = CASE
    WHEN public.rate_limits.expires_at < v_now THEN v_now + v_window
    ELSE public.rate_limits.expires_at
  END
  RETURNING public.rate_limits.count, public.rate_limits.expires_at INTO v_count, v_reset;

  IF v_count > p_max_requests THEN
    RETURN QUERY SELECT FALSE, v_count, v_reset;
  ELSE
    RETURN QUERY SELECT TRUE, v_count, v_reset;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from public, anon, and authenticated roles so only service_role (backend) can run it
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
