-- Women's Safety Crowdsourcing: reports + area_safety aggregation

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  area text NOT NULL,
  is_safe boolean NOT NULL,
  safety_rating int CHECK (safety_rating IS NULL OR (safety_rating >= 1 AND safety_rating <= 5)),
  lighting_ok boolean,
  crowd_level int CHECK (crowd_level IS NULL OR (crowd_level >= 1 AND crowd_level <= 5)),
  police_nearby boolean,
  cctv_seen boolean,
  harassment_reported boolean,
  transport_nearby boolean,
  comment text,
  time_of_day text,
  reporter_id uuid,
  device_id text,
  status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'pending', 'rejected'))
);

CREATE INDEX IF NOT EXISTS reports_area_idx ON public.reports (area);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);
CREATE INDEX IF NOT EXISTS reports_device_created_idx ON public.reports (device_id, created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a report (anonymous crowdsourcing)
CREATE POLICY "Anyone can insert reports"
  ON public.reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can read only approved reports
CREATE POLICY "Public can read approved reports"
  ON public.reports
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Aggregated area safety view (security_invoker so RLS applies)
CREATE OR REPLACE VIEW public.area_safety
WITH (security_invoker = true)
AS
SELECT
  area,
  count(*)::int AS report_count,
  count(*) FILTER (WHERE is_safe)::int AS safe_count,
  count(*) FILTER (WHERE NOT is_safe)::int AS unsafe_count,
  CASE
    WHEN count(*) = 0 THEN 0
    ELSE round(100.0 * count(*) FILTER (WHERE is_safe) / count(*), 1)
  END AS pct_safe,
  round(avg(safety_rating)::numeric, 2) AS avg_rating,
  max(created_at) AS last_updated
FROM public.reports
WHERE status = 'approved'
GROUP BY area;

GRANT SELECT ON public.area_safety TO anon, authenticated;

-- Community summary helper (single-row KPIs via RPC)
CREATE OR REPLACE FUNCTION public.community_summary()
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'totalReports', count(*)::int,
    'safeReports', count(*) FILTER (WHERE is_safe)::int,
    'unsafeReports', count(*) FILTER (WHERE NOT is_safe)::int,
    'pctSafe', CASE
      WHEN count(*) = 0 THEN 0
      ELSE round(100.0 * count(*) FILTER (WHERE is_safe) / count(*), 1)
    END,
    'avgRating', round(avg(safety_rating)::numeric, 2),
    'areasCovered', count(DISTINCT area)::int,
    'lastUpdated', max(created_at)
  )
  FROM public.reports
  WHERE status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.community_summary() TO anon, authenticated;

-- Simple rate-limit helper: count recent reports from a device
CREATE OR REPLACE FUNCTION public.count_recent_device_reports(p_device_id text, p_minutes int DEFAULT 60)
RETURNS int
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT count(*)::int
  FROM public.reports
  WHERE device_id = p_device_id
    AND created_at > now() - (p_minutes || ' minutes')::interval;
$$;

GRANT EXECUTE ON FUNCTION public.count_recent_device_reports(text, int) TO anon, authenticated;
