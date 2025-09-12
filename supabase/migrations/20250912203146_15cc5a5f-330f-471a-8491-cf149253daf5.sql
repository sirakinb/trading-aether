-- Create storage policies for audio bucket to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to audio bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Users can view audio files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'audio');

CREATE POLICY "Users can update their own audio uploads" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio uploads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);