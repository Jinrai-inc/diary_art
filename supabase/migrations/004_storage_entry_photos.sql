-- Create entry-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-photos', 'entry-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'entry-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'entry-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'entry-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read (bucket is public so URLs work without auth)
CREATE POLICY "Public can read entry photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'entry-photos');
