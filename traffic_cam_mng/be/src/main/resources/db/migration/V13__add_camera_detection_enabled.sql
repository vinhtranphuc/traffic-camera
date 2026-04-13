-- Add detection_enabled flag separate from detection_settings config.
-- Purpose: UI toggle (on/off) is independent from the detection types config.
-- Saving settings does NOT imply enabling; pipeline only runs detection when
-- detection_enabled = TRUE.

ALTER TABLE cameras
    ADD COLUMN detection_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER detection_settings;
