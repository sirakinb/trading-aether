-- Fix RLS policies to only allow authenticated users
-- Update conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update messages policies
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages from their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in their conversations"
ON public.messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Update trades policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can create their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;

CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades"
ON public.trades FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.trades FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
ON public.trades FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update memories policies
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can create their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

CREATE POLICY "Users can view their own memories"
ON public.memories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
ON public.memories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
ON public.memories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
ON public.memories FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update storage policies for charts bucket
DROP POLICY IF EXISTS "Users can upload their own charts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own charts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own charts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own charts" ON storage.objects;

CREATE POLICY "Users can upload their own charts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'charts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own charts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'charts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own charts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'charts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own charts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'charts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update storage policies for audio bucket
DROP POLICY IF EXISTS "Users can upload their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;

CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;