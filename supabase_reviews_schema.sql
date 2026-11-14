-- ==============================================================================
-- 🚀 TAARU SET — SCHEMA DES AVIS CLIENTS VÉRIFIÉS (TABLE taaru_reviews)
-- ==============================================================================
-- Ce script configure la table des avis, l'indexation et la sécurité RLS.
-- À exécuter dans le Supabase SQL Editor si besoin.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.taaru_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.taaru_bookings(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    service_type TEXT,
    quarter TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    recommend BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes rapides et affichage immédiat
CREATE INDEX IF NOT EXISTS idx_taaru_reviews_status ON public.taaru_reviews(status);
CREATE INDEX IF NOT EXISTS idx_taaru_reviews_created ON public.taaru_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_taaru_reviews_booking ON public.taaru_reviews(booking_id);

-- Activer Row Level Security
ALTER TABLE public.taaru_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Tout le monde (visiteurs du site) peut lire les avis approuvés
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.taaru_reviews;
CREATE POLICY "Public can view approved reviews" ON public.taaru_reviews
    FOR SELECT USING (status = 'approved');

-- 2. Tout le monde peut déposer un avis (INSERT public via le lien WhatsApp)
DROP POLICY IF EXISTS "Public can insert review" ON public.taaru_reviews;
CREATE POLICY "Public can insert review" ON public.taaru_reviews
    FOR INSERT WITH CHECK (true);

-- 3. Les collaborateurs authentifiés ont un accès total pour gérer et modérer
DROP POLICY IF EXISTS "Staff can view all reviews" ON public.taaru_reviews;
CREATE POLICY "Staff can view all reviews" ON public.taaru_reviews
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can update reviews" ON public.taaru_reviews;
CREATE POLICY "Staff can update reviews" ON public.taaru_reviews
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can delete reviews" ON public.taaru_reviews;
CREATE POLICY "Staff can delete reviews" ON public.taaru_reviews
    FOR DELETE TO authenticated USING (true);

-- Activer les notifications en temps réel Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.taaru_reviews;

