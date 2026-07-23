DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback" 
    ON public.feedback FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id));
    
DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback" 
    ON public.feedback FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id))
    WITH CHECK (auth.uid() = (SELECT s.user_id FROM public.sessions s JOIN public.answers a ON a.session_id = s.id WHERE a.id = answer_id));
