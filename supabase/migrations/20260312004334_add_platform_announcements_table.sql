-- Platform-wide announcements from Super Admin to businesses/staff
CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'success')),
    target_role TEXT NOT NULL DEFAULT 'all' CHECK (target_role IN ('all', 'patron', 'staff')),
    target_sector_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Super Admins can do everything
CREATE POLICY "Super Admins can manage platform announcements"
ON public.platform_announcements
FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'));

-- Everyone can view active announcements matching their role
CREATE POLICY "Users can view relevant platform announcements"
ON public.platform_announcements
FOR SELECT
USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
    AND (
        target_role = 'all'
        OR (target_role = 'patron' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'patron'))
        OR (target_role = 'staff' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'personel'))
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_platform_announcements_updated_at
    BEFORE UPDATE ON public.platform_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
