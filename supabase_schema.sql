-- ==============================================================================
-- 🚀 TAARU SET — SCHEMA COMPLET DE BASE DE DONNÉES & SÉCURITÉ MAXIMALE (RLS)
-- ==============================================================================
-- Infrastructure : PostgreSQL / Supabase
-- Règle d'or : Sécurité maximale, zéro fuite de données, RLS étanche.
-- ==============================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLE DES MEMBRES D'ÉQUIPE (GESTION DES ACCÈS & RÔLES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.taaru_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'co_founder', 'operations', 'strategy')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABLE DES CLIENTS (RÉPERTOIRE CRM & FIDÉLISATION)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.taaru_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    quarter TEXT,
    total_orders INTEGER DEFAULT 1,
    total_spent_fcfa INTEGER DEFAULT 0,
    loyalty_status TEXT DEFAULT 'Nouveau Client' CHECK (loyalty_status IN ('Nouveau Client', 'Client Régulier', 'Client VIP')),
    last_order_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les recherches par téléphone et quartier
CREATE INDEX IF NOT EXISTS idx_taaru_clients_phone ON public.taaru_clients(phone);
CREATE INDEX IF NOT EXISTS idx_taaru_clients_quarter ON public.taaru_clients(quarter);

-- ------------------------------------------------------------------------------
-- 3. TABLE DES RÉSERVATIONS & INTERVENTIONS (LE CŒUR OPÉRATIONNEL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.taaru_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_id UUID REFERENCES public.taaru_clients(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL, -- 'Lavage Auto', 'Canapés & Matelas', 'Fin de Chantier', 'Bureaux'
    service_details TEXT,
    quarter TEXT NOT NULL, -- Quartier à Dakar
    intervention_date DATE,
    intervention_time TEXT,
    estimated_price_fcfa INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee')),
    assigned_to TEXT, -- ex: 'Djiby / Équipe Kärcher 1'
    source TEXT DEFAULT 'site_web', -- 'site_web', 'appel_direct', 'whatsapp'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les filtres rapides par statut et date
CREATE INDEX IF NOT EXISTS idx_taaru_bookings_status ON public.taaru_bookings(status);
CREATE INDEX IF NOT EXISTS idx_taaru_bookings_date ON public.taaru_bookings(intervention_date);
CREATE INDEX IF NOT EXISTS idx_taaru_bookings_created ON public.taaru_bookings(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. TRIGGER AUTOMATIQUE : ENREGISTRER LE CLIENT À CHAQUE RÉSERVATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_booking_client()
RETURNS TRIGGER AS $$
DECLARE
    existing_client_id UUID;
    v_total_orders INTEGER;
    v_total_spent INTEGER;
    v_loyalty TEXT;
BEGIN
    -- Vérifier si le client existe déjà par son numéro de téléphone
    SELECT id INTO existing_client_id FROM public.taaru_clients WHERE phone = NEW.client_phone;

    IF existing_client_id IS NOT NULL THEN
        -- Mise à jour du client existant
        UPDATE public.taaru_clients
        SET 
            total_orders = total_orders + 1,
            total_spent_fcfa = total_spent_fcfa + NEW.estimated_price_fcfa,
            last_order_at = NOW(),
            quarter = COALESCE(NEW.quarter, quarter)
        WHERE id = existing_client_id;

        -- Calcul du statut fidélité
        SELECT total_orders, total_spent_fcfa INTO v_total_orders, v_total_spent
        FROM public.taaru_clients WHERE id = existing_client_id;

        IF v_total_orders >= 5 OR v_total_spent >= 150000 THEN
            v_loyalty := 'Client VIP';
        ELSIF v_total_orders >= 2 THEN
            v_loyalty := 'Client Régulier';
        ELSE
            v_loyalty := 'Nouveau Client';
        END IF;

        UPDATE public.taaru_clients SET loyalty_status = v_loyalty WHERE id = existing_client_id;
        NEW.client_id := existing_client_id;
    ELSE
        -- Création d'un nouveau client
        INSERT INTO public.taaru_clients (phone, full_name, quarter, total_orders, total_spent_fcfa, loyalty_status)
        VALUES (
            NEW.client_phone,
            NEW.client_name,
            NEW.quarter,
            1,
            NEW.estimated_price_fcfa,
            'Nouveau Client'
        )
        RETURNING id INTO existing_client_id;

        NEW.client_id := existing_client_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_client ON public.taaru_bookings;
CREATE TRIGGER trg_booking_client
BEFORE INSERT ON public.taaru_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_booking_client();

-- ------------------------------------------------------------------------------
-- 5. SÉCURITÉ AU MAXIMUM : ROW LEVEL SECURITY (RLS) ÉTANCHE
-- ------------------------------------------------------------------------------
ALTER TABLE public.taaru_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taaru_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taaru_team_members ENABLE ROW LEVEL SECURITY;

-- FONCTION HELPER : L'utilisateur connecté fait-il partie de l'équipe active ?
CREATE OR REPLACE FUNCTION public.is_taaru_team_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.taaru_team_members
        WHERE (user_id = auth.uid() OR email = auth.jwt() ->> 'email')
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FONCTION HELPER : L'utilisateur est-il le Super Admin (Mamadou) ?
CREATE OR REPLACE FUNCTION public.is_taaru_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.taaru_team_members
        WHERE (user_id = auth.uid() OR email = auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLITIQUES RLS SUR LES RÉSERVATIONS (taaru_bookings) ---
-- A. Les clients anonymes du site peuvent UNIQUEMENT insérer une nouvelle réservation
CREATE POLICY "Public clients can only insert bookings"
ON public.taaru_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- B. Seule l'équipe connectée et active peut LIRE les réservations (Zéro lecture pour le public)
CREATE POLICY "Team members can view all bookings"
ON public.taaru_bookings
FOR SELECT
TO authenticated
USING (public.is_taaru_team_member());

-- C. Seule l'équipe connectée peut MODIFIER le statut des réservations
CREATE POLICY "Team members can update bookings"
ON public.taaru_bookings
FOR UPDATE
TO authenticated
USING (public.is_taaru_team_member())
WITH CHECK (public.is_taaru_team_member());

-- D. Seul le Super Admin peut SUPPRIMER une réservation
CREATE POLICY "Super admin can delete bookings"
ON public.taaru_bookings
FOR DELETE
TO authenticated
USING (public.is_taaru_super_admin());

-- --- POLITIQUES RLS SUR LES CLIENTS (taaru_clients) ---
-- A. Le public n'a AUCUN droit de lecture sur la liste des clients
-- B. Seule l'équipe connectée peut consulter le répertoire clients
CREATE POLICY "Team members can view clients"
ON public.taaru_clients
FOR SELECT
TO authenticated
USING (public.is_taaru_team_member());

CREATE POLICY "Team members can update clients"
ON public.taaru_clients
FOR UPDATE
TO authenticated
USING (public.is_taaru_team_member())
WITH CHECK (public.is_taaru_team_member());

-- --- POLITIQUES RLS SUR LES MEMBRES D'ÉQUIPE (taaru_team_members) ---
-- A. L'équipe peut voir qui fait partie de l'équipe
CREATE POLICY "Team members can view team"
ON public.taaru_team_members
FOR SELECT
TO authenticated
USING (public.is_taaru_team_member());

-- B. SEUL le Super Admin (Mamadou) peut AJOUTER, MODIFIER ou RETIRER des membres
CREATE POLICY "Only super admin can insert team members"
ON public.taaru_team_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_taaru_super_admin());

CREATE POLICY "Only super admin can update team members"
ON public.taaru_team_members
FOR UPDATE
TO authenticated
USING (public.is_taaru_super_admin())
WITH CHECK (public.is_taaru_super_admin());

CREATE POLICY "Only super admin can delete team members"
ON public.taaru_team_members
FOR DELETE
TO authenticated
USING (public.is_taaru_super_admin());

-- ==============================================================================
-- 6. TEMPS RÉEL (REALTIME) ACTIVÉ POUR SYNCHRONISATION EN DIRECT
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.taaru_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.taaru_clients;

