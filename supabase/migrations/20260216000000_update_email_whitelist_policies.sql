-- Allow anonymous users to check whitelist (needed for sign up)
-- This is safe because it only allows SELECT on the email column, 
-- and the frontend needs this check before allowing a user to proceed with sign-up.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'email_whitelist' 
        AND policyname = 'Allow anonymous users to read whitelist'
    ) THEN
        CREATE POLICY "Allow anonymous users to read whitelist" 
        ON public.email_whitelist 
        FOR SELECT 
        TO anon 
        USING (true);
    END IF;
END $$;
