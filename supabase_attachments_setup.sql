-- ===== SUPABASE ATTACHMENTS SETUP SCRIPT =====
-- Run this script in your Supabase SQL Editor to set up the attachments system

-- 1. Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT,
    storage_path TEXT,
    notes TEXT,
    uploaded_by TEXT DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_property_key ON attachments(property_key);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);

-- 3. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_attachments_updated_at ON attachments;
CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for attachments table
-- Allow all operations for now (you can restrict these based on your needs)
DROP POLICY IF EXISTS "Enable read access for all users" ON attachments;
CREATE POLICY "Enable read access for all users" 
    ON attachments FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON attachments;
CREATE POLICY "Enable insert access for all users" 
    ON attachments FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON attachments;
CREATE POLICY "Enable update access for all users" 
    ON attachments FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON attachments;
CREATE POLICY "Enable delete access for all users" 
    ON attachments FOR DELETE 
    USING (true);

-- 7. Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create storage policies
-- Allow all operations on attachments bucket
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
CREATE POLICY "Enable read access for all users" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Enable insert access for all users" ON storage.objects;
CREATE POLICY "Enable insert access for all users" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Enable update access for all users" ON storage.objects;
CREATE POLICY "Enable update access for all users" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Enable delete access for all users" ON storage.objects;
CREATE POLICY "Enable delete access for all users" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'attachments');

-- 9. Create helpful views
CREATE OR REPLACE VIEW attachments_summary AS
SELECT 
    property_key,
    COUNT(*) as total_attachments,
    SUM(file_size) as total_size,
    MAX(created_at) as last_upload,
    STRING_AGG(DISTINCT file_type, ', ') as file_types
FROM attachments 
GROUP BY property_key;

-- 10. Create useful functions
CREATE OR REPLACE FUNCTION get_property_attachments(p_property_key TEXT)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.file_name,
        a.file_type,
        a.file_size,
        a.file_url,
        a.notes,
        a.created_at
    FROM attachments a
    WHERE a.property_key = p_property_key
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete attachments older than 30 days with no file_url
    DELETE FROM attachments 
    WHERE file_url IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to get attachment statistics
CREATE OR REPLACE FUNCTION get_attachment_stats()
RETURNS TABLE (
    total_attachments BIGINT,
    total_size BIGINT,
    avg_file_size NUMERIC,
    most_common_type TEXT,
    properties_with_attachments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_attachments,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(AVG(file_size), 0) as avg_file_size,
        (
            SELECT file_type 
            FROM attachments 
            WHERE file_type IS NOT NULL 
            GROUP BY file_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_common_type,
        COUNT(DISTINCT property_key) as properties_with_attachments
    FROM attachments;
END;
$$ LANGUAGE plpgsql;

-- 13. Insert sample data (optional - remove if not needed)
-- INSERT INTO attachments (property_key, file_name, file_type, file_size, notes) VALUES
-- ('sample_property_1', 'contract.pdf', 'application/pdf', 1024000, 'عقد الإيجار الأساسي'),
-- ('sample_property_1', 'photo.jpg', 'image/jpeg', 512000, 'صورة العقار'),
-- ('sample_property_2', 'documents.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 256000, 'وثائق إضافية');

-- 14. Grant necessary permissions (if using custom roles)
-- GRANT ALL ON attachments TO authenticated;
-- GRANT ALL ON attachments TO anon;

-- 15. Create notification function for real-time updates
CREATE OR REPLACE FUNCTION notify_attachment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('attachment_changes', json_build_object(
            'operation', 'INSERT',
            'property_key', NEW.property_key,
            'file_name', NEW.file_name,
            'id', NEW.id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('attachment_changes', json_build_object(
            'operation', 'UPDATE',
            'property_key', NEW.property_key,
            'file_name', NEW.file_name,
            'id', NEW.id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('attachment_changes', json_build_object(
            'operation', 'DELETE',
            'property_key', OLD.property_key,
            'file_name', OLD.file_name,
            'id', OLD.id
        )::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger for notifications
DROP TRIGGER IF EXISTS attachment_changes_trigger ON attachments;
CREATE TRIGGER attachment_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION notify_attachment_changes();

-- ===== VERIFICATION QUERIES =====
-- Run these to verify the setup worked correctly

-- Check if table was created
SELECT 'attachments table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachments');

-- Check if bucket was created
SELECT 'attachments bucket created' as status 
WHERE EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'attachments';

-- Check policies
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE tablename = 'attachments';

-- Test the functions
SELECT * FROM get_attachment_stats();

-- ===== CLEANUP SCRIPT (if needed) =====
-- Uncomment and run if you need to remove everything

-- DROP TRIGGER IF EXISTS attachment_changes_trigger ON attachments;
-- DROP FUNCTION IF EXISTS notify_attachment_changes();
-- DROP FUNCTION IF EXISTS get_attachment_stats();
-- DROP FUNCTION IF EXISTS cleanup_orphaned_attachments();
-- DROP FUNCTION IF EXISTS get_property_attachments(TEXT);
-- DROP VIEW IF EXISTS attachments_summary;
-- DROP TABLE IF EXISTS attachments;
-- DELETE FROM storage.buckets WHERE id = 'attachments';

-- ===== END OF SETUP SCRIPT =====
