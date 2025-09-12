-- Create storage policies for charts bucket to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to charts bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'charts');

CREATE POLICY "Users can view charts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'charts');

CREATE POLICY "Users can update their own chart uploads" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chart uploads" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);