-- Stored, editable travel-guide content for destinations.
-- When present, the public /destinations/{id}/guide endpoint serves this
-- instead of generating a guide with AI.
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS guide_text TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS top_attractions TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS food_recommendations TEXT;
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS travel_tips TEXT;
