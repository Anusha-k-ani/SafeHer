-- Optional: hold new reports for moderation instead of auto-approve
-- ALTER TABLE public.reports ALTER COLUMN status SET DEFAULT 'pending';

-- Approve a report (service role / SQL editor)
-- UPDATE public.reports SET status = 'approved' WHERE id = '<uuid>';

-- Reject a report
-- UPDATE public.reports SET status = 'rejected' WHERE id = '<uuid>';

-- Rate-limit is enforced client-side via RPC count_recent_device_reports(device_id, 60)
-- and capped at 5 reports/hour in web/src/lib/reports.ts and mobile/lib/reports.ts.
