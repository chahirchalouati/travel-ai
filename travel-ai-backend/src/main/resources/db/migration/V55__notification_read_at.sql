-- Add read_at timestamp to notification_log so users can mark notifications as read
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
