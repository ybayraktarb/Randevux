-- Business Announcements Table
CREATE TABLE IF NOT EXISTS public.business_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_business_id ON public.business_announcements(business_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active_dates ON public.business_announcements(is_active, start_date, end_date);

-- RLS
ALTER TABLE public.business_announcements ENABLE ROW LEVEL SECURITY;

-- Customers can read active announcements
CREATE POLICY "Customers can view active announcements" ON public.business_announcements
    FOR SELECT
    USING (
        is_active = true AND 
        (start_date IS NULL OR start_date <= now()) AND 
        (end_date IS NULL OR end_date >= now())
    );

-- Business owners can manage their own announcements
CREATE POLICY "Owners can manage their own announcements" ON public.business_announcements
    FOR ALL
    TO authenticated
    USING (
        business_id IN (
            SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.business_announcements
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
