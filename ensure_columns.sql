-- Ensure attachments column exists in broadcast_templates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='broadcast_templates' AND column_name='attachments') THEN
        ALTER TABLE broadcast_templates ADD COLUMN attachments TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Ensure recipients is TEXT[] (sometimes it might be JSONB or other types depending on initial migration)
-- For this app, we are using TEXT[] for simplicity and performance with array operations.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='broadcast_campaigns' AND column_name='recipients') THEN
        ALTER TABLE broadcast_campaigns ADD COLUMN recipients TEXT[] DEFAULT '{}';
    ELSE
        -- Ensure type is TEXT[]
        ALTER TABLE broadcast_campaigns ALTER COLUMN recipients TYPE TEXT[] USING recipients::text[];
    END IF;
END $$;
