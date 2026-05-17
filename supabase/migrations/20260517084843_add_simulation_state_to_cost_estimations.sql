ALTER TABLE cost_estimations ADD COLUMN simulation_state jsonb;
COMMENT ON COLUMN cost_estimations.simulation_state IS 'Stores the full simulation parameters (JSON) for version history restoration';
