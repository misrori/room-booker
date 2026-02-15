-- Create the email whitelist table
CREATE TABLE IF NOT EXISTS public.email_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the whitelist (needed for verification)
CREATE POLICY "Allow authenticated users to read whitelist" 
ON public.email_whitelist 
FOR SELECT 
TO authenticated 
USING (true);

-- Insert initial allowed emails
INSERT INTO public.email_whitelist (email)
VALUES 
    ('ormraat.pte@gmail.com'),
    ('mihaly.orsos@datapao.com')
ON CONFLICT (email) DO NOTHING;
