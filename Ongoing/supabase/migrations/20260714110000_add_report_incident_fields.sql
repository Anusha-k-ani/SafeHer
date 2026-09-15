-- Incident / "something happened" reporting

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS report_kind text NOT NULL DEFAULT 'feeling',
  ADD COLUMN IF NOT EXISTS incident_type text;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_report_kind_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_report_kind_check
  CHECK (report_kind IN ('feeling', 'incident'));

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_incident_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_incident_type_check
  CHECK (
    incident_type IS NULL OR incident_type IN (
      'harassment',
      'stalking',
      'theft',
      'assault',
      'suspicious_activity',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS reports_incident_idx
  ON public.reports (report_kind, incident_type)
  WHERE report_kind = 'incident';
