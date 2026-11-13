import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import logoOfficialSq from '../assets/logo_official_sq.jpg';
import { 
  Shield, Users, Calendar, Phone, MessageSquare, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Download, LogOut, RefreshCw, X, ArrowUpRight, 
  UserPlus, BarChart3, TrendingUp, DollarSign, MapPin, 
  Layers, ExternalLink, Activity, Check, Lock, KeyRound,
  Menu, ChevronRight, Sparkles, Building2, Car, Sparkle,
  Briefcase, UserCheck, UserX, ChevronDown, CheckCircle,
  ShieldCheck, Eye, EyeOff
} from 'lucide-react';

export default function AdminPortal({ onClose }) {
  // --- AUTHENTIFICATION SÉCURISÉE ZERO-TRUST ---
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [currentMember, setCurrentMember] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // --- NAVIGATION ONGLETS & MENU MOBILE ---
  // 'bookings' | 'clients' | 'stats' | 'team'
  const [activeTab, setActiveTab] = useState('bookings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- DONNÉES RÉELLES SUPABASE ---
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- FILTRES & RECHERCHE ---
  const [bookingFilter, setBookingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODALE NOUVELLE RÉSERVATION MANUELLE ---
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('Nettoyage Canapés & Salons Kärcher');
  const [manualDetails, setManualDetails] = useState('');
  const [manualQuarter, setManualQuarter] = useState('Almadies');
  const [manualPrice, setManualPrice] = useState('35000');
  const [manualDate, setManualDate] = useState('Demain matin');

  // --- FORMULAIRE D'AJOUT COLLABORATEUR FLEXIBLE (Super Admin) ---
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberJobTitle, setNewMemberJobTitle] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('agent');
  const [teamMsg, setTeamMsg] = useState('');

  // --- PERMISSIONS DÉRIVÉES DU RÔLE DE L'UTILISATEUR CONNECTÉ ---
  const userRole = currentMember?.role || 'agent';
  const isSuperAdmin = userRole === 'super_admin';
  const canManageTeam = isSuperAdmin;
  const canViewStats = isSuperAdmin || userRole === 'admin';
  const canViewCRM = isSuperAdmin || userRole === 'admin' || userRole === 'sales';
  const canDeleteBookings = isSuperAdmin || userRole === 'admin';

  // Sécurité navigation : si un utilisateur n'a pas les droits pour l'onglet courant, le rediriger vers 'bookings'
  useEffect(() => {
    if (activeTab === 'team' && !canManageTeam) {
      setActiveTab('bookings');
    }
    if (activeTab === 'stats' && !canViewStats) {
      setActiveTab('bookings');
    }
    if (activeTab === 'clients' && !canViewCRM) {
      setActiveTab('bookings');
    }
  }, [activeTab, canManageTeam, canViewStats, canViewCRM]);

  // 1. Initialisation Session Supabase & Audit de Sécurité
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAndLoadTeamMember(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAndLoadTeamMember(session.user);
      } else {
        setCurrentMember(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Décompte de verrouillage anti-brute force
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTimer]);

  // 2. VÉRIFICATION STRICTE ZERO-TRUST EXÉCUTÉE EN BASE DE DONNÉES (POSTGRESQL SECURITY DEFINER)
  const checkAndLoadTeamMember = async (user) => {
    try {
      const { data: memberList, error: rpcErr } = await supabase.rpc('get_current_team_member');

      if (rpcErr || !memberList || memberList.length === 0) {
        console.warn('Security Alert: Unauthorized access attempt rejected:', user.email);
        await supabase.auth.signOut();
        setSession(null);
        setCurrentMember(null);
        setAuthError(`⛔ ACCÈS REFUSÉ (Code 403) : Le compte "${user.email}" n'est pas accrédité sur le portail TAARU SET. Seuls les membres enregistrés par la direction peuvent y accéder.`);
        setAuthLoading(false);
        return;
      }

      const verified = memberList[0];
      if (!verified.is_active) {
        await supabase.auth.signOut();
        setSession(null);
        setCurrentMember(null);
        setAuthError("⛔ ACCÈS SUSPENDU : Ce compte collaborateur a été désactivé par la direction.");
        setAuthLoading(false);
        return;
      }

      if (user.id && !verified.user_id) {
        await supabase.from('taaru_team_members').update({ user_id: user.id }).eq('id', verified.id);
      }

      setCurrentMember(verified);
      loadAllData();
    } catch (e) {
      console.error('Zero-Trust Auth Verification Error:', e);
      await supabase.auth.signOut();
      setSession(null);
      setCurrentMember(null);
      setAuthError("Échec de la validation de sécurité côté serveur.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Chargement des données (protégé par RLS en base)
  const loadAllData = async () => {
    if (!supabase) return;
    setLoadingData(true);
    try {
      const [bookingsRes, clientsRes, teamRes] = await Promise.all([
        supabase.from('taaru_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('taaru_clients').select('*').order('last_order_at', { ascending: false }),
        supabase.from('taaru_team_members').select('*').order('created_at', { ascending: true })
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Realtime Supabase
  useEffect(() => {
    if (!supabase || !session) return;

    const channel = supabase
      .channel('taaru-portal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_bookings' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_clients' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_team_members' }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // GESTIONNAIRE DE CONNEXION SÉCURISÉE
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (lockoutTimer > 0) {
      setAuthError(`Verrouillage de sécurité actif. Veuillez patienter ${lockoutTimer} secondes.`);
      return;
    }

    if (!supabase) {
      setAuthError('Connexion au serveur de sécurité indisponible.');
      return;
    }

    const cleanEmail = authEmail.trim().toLowerCase();

    try {
      const { data: isWhitelisted } = await supabase.rpc('is_email_whitelisted', { 
        p_email: cleanEmail 
      });

      if (!isWhitelisted) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 4) setLockoutTimer(60);
          return next;
        });
        setAuthError(`⛔ ACCÈS STRICTEMENT REFUSÉ : L'adresse "${cleanEmail}" n'est pas accréditée dans le registre officiel de TAARU SET. Demandez à votre administrateur de vous ajouter.`);
        return;
      }

      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + '/?admin'
        });
        if (error) throw error;
        setAuthSuccessMsg(`Un lien d'activation sécurisé a été expédié à ${cleanEmail}. Consultez vos emails pour définir votre mot de passe.`);
        setIsResetMode(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: authPassword,
      });

      if (error) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 4) setLockoutTimer(60);
          return next;
        });
        throw new Error('Mot de passe erroné ou identifiants incorrects.');
      }

      setFailedAttempts(0);
    } catch (err) {
      setAuthError(err.message || 'Échec lors de l\'authentification sécurisée.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setCurrentMember(null);
  };

  // --- TRAÇABILITÉ DES COMMANDES : MODIFICATION STATUT AVEC « TRAITÉ PAR » ---
  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!supabase) return;

    const updaterName = currentMember?.full_name || session.user.email.split('@')[0];
    const updaterEmail = session.user.email;
    const now = new Date().toISOString();

    try {
      const updatePayload = {
        status: newStatus,
        updated_at: now,
        processed_by_name: updaterName,
        processed_by_email: updaterEmail,
        processed_at: now
      };

      const { error } = await supabase
        .from('taaru_bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (!error) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updatePayload } : b));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Suppression réservation
  const handleDeleteBooking = async (bookingId) => {
    if (!canDeleteBookings) {
      alert('Action restreinte : Seuls les administrateurs peuvent supprimer une commande.');
      return;
    }
    if (!confirm('Confirmer la suppression de cette réservation du registre officiel ?')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taaru_bookings')
        .delete()
        .eq('id', bookingId);
      if (!error) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ajout réservation manuelle avec traçabilité immédiate
  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    const updaterName = currentMember?.full_name || session.user.email.split('@')[0];
    const updaterEmail = session.user.email;
    const now = new Date().toISOString();

    try {
      const { error } = await supabase.from('taaru_bookings').insert({
        client_name: manualName.trim(),
        client_phone: manualPhone.trim(),
        service_type: manualService,
        service_details: manualDetails.trim() || manualService,
        quarter: manualQuarter.trim(),
        estimated_price_fcfa: parseInt(manualPrice, 10) || 0,
        intervention_date: manualDate.trim() || 'À fixer',
        status: 'confirmee',
        source: 'appel_direct',
        processed_by_name: updaterName,
        processed_by_email: updaterEmail,
        processed_at: now
      });

      if (!error) {
        setIsManualModalOpen(false);
        setManualName('');
        setManualPhone('');
        setManualDetails('');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- GESTION ÉQUIPE UNIVERSELLE (Super Admin Uniquement) ---
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!canManageTeam) {
      setTeamMsg('⛔ Action refusée : Seul le Super Administrateur peut accréditer des collaborateurs.');
      return;
    }
    setTeamMsg('');
    if (!supabase) return;

    try {
      const { error } = await supabase.from('taaru_team_members').insert({
        email: newMemberEmail.trim().toLowerCase(),
        full_name: newMemberName.trim(),
        phone: newMemberPhone.trim() || null,
        job_title: newMemberJobTitle.trim() || null,
        role: newMemberRole,
        is_active: true
      });

      if (error) throw error;
      setTeamMsg(`✅ Collaborateur « ${newMemberName.trim()} » accrédité avec succès en tant que [${getRoleLabel(newMemberRole)}] ! Il/Elle peut désormais activer son accès.`);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberJobTitle('');
      loadAllData();
    } catch (err) {
      setTeamMsg(`❌ Erreur : ${err.message || 'Impossible d\'ajouter ce collaborateur.'}`);
    }
  };

  const handleToggleMemberActive = async (memberId, currentStatus) => {
    if (!canManageTeam) {
      alert('Action refusée : Seul le Super Administrateur peut modifier le statut des collaborateurs.');
      return;
    }
    if (!supabase) return;
    try {
      await supabase
        .from('taaru_team_members')
        .update({ is_active: !currentStatus })
        .eq('id', memberId);
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTeamMember = async (memberId, memberEmail, memberName) => {
    if (!canManageTeam) {
      alert('Action refusée : Seul le Super Administrateur peut révoquer des membres.');
      return;
    }
    if (memberEmail === 'ssow2006@gmail.com') {
      alert('Protection de sécurité : Le compte Super Admin principal ne peut pas être supprimé.');
      return;
    }
    if (!confirm(`Confirmer la révocation et la suppression définitive de l'accès pour « ${memberName || memberEmail} » ?`)) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('taaru_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      setTeamMsg(`✅ Collaborateur « ${memberEmail} » révoqué et supprimé du registre.`);
    } catch (err) {
      setTeamMsg(`❌ Erreur de suppression : ${err.message}`);
    }
  };

  // Export CSV Clients
  const exportClientsCSV = () => {
    if (clients.length === 0) return;
    const headers = ['Nom Client', 'Telephone', 'Quartier', 'Commandes', 'Total Depense FCFA', 'Fidelite', 'Derniere Commande'];
    const rows = clients.map(c => [
      `"${c.full_name}"`,
      `"${c.phone}"`,
      `"${c.quarter || 'Dakar'}"`,
      c.total_orders,
      c.total_spent_fcfa,
      `"${c.loyalty_status}"`,
      c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `taaru_set_clients_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtre réservations
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.client_name?.toLowerCase().includes(q) ||
          b.client_phone?.toLowerCase().includes(q) ||
          b.quarter?.toLowerCase().includes(q) ||
          b.service_type?.toLowerCase().includes(q) ||
          b.processed_by_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, bookingFilter, searchQuery]);

  // Analytics & Statistiques
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedOrDone = bookings.filter(b => b.status === 'terminee' || b.status === 'confirmee' || b.status === 'en_cours');
    const totalRevenue = confirmedOrDone.reduce((acc, b) => acc + (b.estimated_price_fcfa || 0), 0);
    const avgBasket = confirmedOrDone.length > 0 ? Math.round(totalRevenue / confirmedOrDone.length) : 0;

    const serviceMap = {};
    bookings.forEach(b => {
      const s = b.service_type || 'Autre formule';
      serviceMap[s] = (serviceMap[s] || 0) + (b.estimated_price_fcfa || 0);
    });

    const serviceDistribution = Object.entries(serviceMap).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    const quarterMap = {};
    bookings.forEach(b => {
      const q = b.quarter || 'Dakar Centre';
      quarterMap[q] = (quarterMap[q] || 0) + 1;
    });

    const topQuarters = Object.entries(quarterMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const statusCounts = {
      en_attente: bookings.filter(b => b.status === 'en_attente').length,
      confirmee: bookings.filter(b => b.status === 'confirmee').length,
      en_cours: bookings.filter(b => b.status === 'en_cours').length,
      terminee: bookings.filter(b => b.status === 'terminee').length,
      annulee: bookings.filter(b => b.status === 'annulee').length,
    };

    return {
      totalBookings,
      totalRevenue,
      avgBasket,
      serviceDistribution,
      topQuarters,
      statusCounts
    };
  }, [bookings]);

  const formatPrice = (p) => (p || 0).toLocaleString('fr-FR') + ' FCFA';

  // Badges de statut aux couleurs douces et nobles de Taaru Sett
  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'confirmee':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'en_cours':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'terminee':
        return 'bg-emerald-50 text-[#0D5C3A] border-emerald-200';
      case 'annulee':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return 'Super-Admin / Direction';
      case 'admin': return 'Responsable Opérations';
      case 'agent': return 'Chef d\'Équipe Terrain';
      case 'sales': return 'Chargé(e) Clientèle';
      default: return role;
    }
  };

  // --- ÉCRAN DE CHARGEMENT INITIAL TAARU SET ---
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAF7] flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-[#0D5C3A]/20 shadow-xl shadow-[#0D5C3A]/10 bg-white p-1">
            <img 
              src={logoOfficialSq} 
              alt="TAARU SET" 
              className="w-full h-full object-cover rounded-xl" 
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold font-['Outfit'] text-slate-900 tracking-tight">
          <RefreshCw className="w-4 h-4 text-[#0D5C3A] animate-spin" />
          <span>Vérification d'habilitation Taaru Sett...</span>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">Contrôle des permissions d'accès au portail</p>
      </div>
    );
  }

  // --- ÉCRAN DE CONNEXION ÉLÉGANT STYLE OFFICIEL TAARU SET (FOND CLAIR & ÉCO-ORGANIQUE) ---
  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAF7] flex items-center justify-center p-4 sm:p-6 font-sans antialiased overflow-y-auto">
        
        {/* Motif décoratif végétal subtil */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#0D5C3A]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="w-full max-w-sm sm:max-w-md bg-white border border-slate-200/90 rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(13,92,58,0.12)] relative z-10">
          
          {/* En-tête avec VRAI LOGO TAARU SET */}
          <div className="flex items-start justify-between pb-5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-[#0D5C3A]/15 shadow-md shadow-[#0D5C3A]/10 bg-white p-0.5 shrink-0">
                <img 
                  src={logoOfficialSq} 
                  alt="Logo officiel TAARU SET" 
                  className="w-full h-full object-cover rounded-xl" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-['Outfit'] font-black text-xl tracking-tight leading-none text-slate-900">
                  <span>TAARU</span>
                  <span className="text-[#16A34A]">SET</span>
                </div>
                <p className="text-xs font-bold text-[#0D5C3A] mt-1 font-['Outfit']">Portail de Gestion Officiel</p>
                <p className="text-[11px] text-slate-500 font-medium">Le charme de la propreté • Dakar</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              title="Retourner au site public"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge officiel de sécurité */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-['Outfit'] font-bold bg-emerald-50 text-[#0D5C3A] border border-emerald-200/80">
              <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
              Espace Restreint à l'Équipe Accréditée
            </span>
          </div>

          {authError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span className="font-medium">{authSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Outfit']">
                Adresse email professionnelle
              </label>
              <input 
                type="email" 
                required
                placeholder="votre-nom@taaruset.sn"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                disabled={lockoutTimer > 0}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 disabled:opacity-50 transition-all font-medium"
              />
            </div>

            {!isResetMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Outfit']">
                  Mot de passe personnel
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={lockoutTimer > 0}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 disabled:opacity-50 transition-all font-medium"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutTimer > 0}
              className="w-full h-11 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 text-white font-['Outfit'] font-bold text-sm transition-all cursor-pointer shadow-md shadow-[#0D5C3A]/25 flex items-center justify-center gap-2"
            >
              {lockoutTimer > 0 ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Verrouillé temporairement ({lockoutTimer}s)</span>
                </>
              ) : isResetMode ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Recevoir le lien d'activation</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Accéder à mon espace</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsResetMode(!isResetMode);
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className="text-xs font-bold font-['Outfit'] text-[#0D5C3A] hover:text-[#16A34A] transition-colors cursor-pointer py-1"
            >
              {isResetMode ? '← Retour à la connexion habituelle' : 'Première activation ou mot de passe oublié ?'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- PORTAIL PLEIN ÉCRAN DÉDIÉ (THÈME CLAIR & ÉCO-ORGANIQUE TAARU SET) ---
  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAF7] text-slate-800 flex flex-col md:flex-row overflow-hidden font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE MOBILE TOPBAR (Smartphone < md)                                */}
      {/* ========================================================================= */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-[#0D5C3A]/20 p-0.5 bg-white">
            <img 
              src={logoOfficialSq} 
              alt="TAARU SET" 
              className="w-full h-full object-cover rounded-lg" 
            />
          </div>
          <div className="flex items-center gap-1 font-['Outfit'] font-black text-sm tracking-tight text-slate-900 leading-none">
            <span>TAARU</span>
            <span className="text-[#16A34A]">SET</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#0D5C3A] border border-emerald-200 font-bold font-['Outfit'] ml-1">
            {isSuperAdmin ? 'Super Admin' : getRoleLabel(userRole)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'bookings' && (
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="h-8 px-2.5 rounded-xl bg-[#0D5C3A] text-white text-xs font-bold font-['Outfit'] flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* TIROIR DÉROULANT MOBILE (Slide-Over Drawer) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white border-t border-slate-200 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src={logoOfficialSq} alt="TAARU SET" className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#0D5C3A]/20" />
                <div>
                  <div className="font-['Outfit'] font-extrabold text-sm text-slate-900">Portail Taaru Sett</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{session.user.email}</div>
                  <div className="text-[10px] text-[#0D5C3A] font-bold font-['Outfit']">{getRoleLabel(userRole)}</div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Drawer Tabs (Filtrés selon permissions) */}
            <div className="space-y-1.5 font-['Outfit']">
              <button
                type="button"
                onClick={() => { setActiveTab('bookings'); setIsMobileMenuOpen(false); }}
                className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'bookings' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>Réservations & Planning</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {bookings.length}
                </span>
              </button>

              {canViewCRM && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }}
                  className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                    activeTab === 'clients' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Répertoire Clients CRM</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {clients.length}
                  </span>
                </button>
              )}

              {canViewStats && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }}
                  className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                    activeTab === 'stats' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4" />
                    <span>Statistiques & Bilan</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                </button>
              )}

              {canManageTeam && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }}
                  className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                    activeTab === 'team' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4" />
                    <span>Équipe & Droits</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {teamMembers.length}
                  </span>
                </button>
              )}
            </div>

            {/* Actions secondaires Drawer */}
            <div className="pt-3 border-t border-slate-100 space-y-2 font-['Outfit']">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <ExternalLink className="w-4 h-4 text-[#0D5C3A]" />
                <span>Voir le site public TAARU SET</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full h-10 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIDEBAR DE NAVIGATION DESKTOP (Fixée à gauche, Thème Blanc & Vert)      */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200/90 shrink-0 shadow-xs">
        
        {/* Identité Entreprise avec Logo Officiel */}
        <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1 ring-[#0D5C3A]/20 shadow-md shadow-[#0D5C3A]/10 bg-white p-0.5 shrink-0">
              <img 
                src={logoOfficialSq} 
                alt="Logo TAARU SET" 
                className="w-full h-full object-cover rounded-xl" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1 font-['Outfit'] font-black text-base tracking-tight text-slate-900 leading-none">
                <span>TAARU</span>
                <span className="text-[#16A34A]">SET</span>
              </div>
              <span className="text-[11px] text-[#0D5C3A] font-bold font-['Outfit'] tracking-wide block mt-0.5">
                Portail Gestionnaire
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold bg-emerald-50 text-[#0D5C3A] border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
            Sync
          </span>
        </div>

        {/* Profil Collaborateur Certifié avec badge de rôle dynamique */}
        <div className="p-3.5 mx-3.5 my-3.5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">Accès Certifié</div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">{session.user.email}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold ${
              isSuperAdmin ? 'bg-[#0D5C3A] text-white shadow-xs' :
              userRole === 'admin' ? 'bg-blue-700 text-white shadow-xs' :
              userRole === 'sales' ? 'bg-amber-700 text-white shadow-xs' :
              'bg-slate-700 text-white shadow-xs'
            }`}>
              {getRoleLabel(userRole)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">• Dakar</span>
          </div>
        </div>

        {/* Navigation Onglets (Filtrés dynamiquement selon le rôle du compte) */}
        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto text-xs font-['Outfit'] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4" />
              <span>Réservations</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {bookings.length}
            </span>
          </button>

          {canViewCRM && (
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Répertoire Clients</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {clients.length}
              </span>
            </button>
          )}

          {canViewStats && (
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Statistiques & Bilan</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            </button>
          )}

          {canManageTeam && (
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4" />
                <span>Équipe & Droits</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {teamMembers.length}
              </span>
            </button>
          )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3.5 border-t border-slate-100 space-y-1.5 font-['Outfit']">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 px-3 rounded-xl text-slate-600 hover:text-[#0D5C3A] hover:bg-emerald-50/50 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#0D5C3A]" />
            <span>Voir le site public</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-9 px-3 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. ESPACE DE TRAVAIL PRINCIPAL (Fond clair #F8FAF7)                       */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-[#F8FAF7] overflow-hidden">
        
        {/* Topbar Header Desktop */}
        <header className="hidden md:flex h-16 px-6 sm:px-8 border-b border-slate-200/80 items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold font-['Outfit'] text-slate-900 tracking-tight">
              {activeTab === 'bookings' && 'Planning des Réservations & Interventions'}
              {activeTab === 'clients' && 'Répertoire des Clients (CRM)'}
              {activeTab === 'stats' && 'Tableau de Bord Décisionnel & Bilan Financier'}
              {activeTab === 'team' && 'Équipe & Gestion Universelle des Accès'}
            </h2>
            {loadingData && (
              <RefreshCw className="w-4 h-4 text-[#0D5C3A] animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-3 font-['Outfit']">
            {activeTab === 'bookings' && (
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0D5C3A]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle intervention</span>
              </button>
            )}

            {activeTab === 'clients' && canViewCRM && (
              <button
                type="button"
                onClick={exportClientsCSV}
                className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-[#0D5C3A]" />
                <span>Exporter CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAllData}
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Corps des onglets (Scrollable, padding renforcé sur mobile pour la Bottom Nav) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6">

          {/* ========================================================================= */}
          {/* ONGLET 1 : RÉSERVATIONS & PLANNING                                        */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Barre de contrôle : Recherche et Filtres */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, téléphone, quartier, formule, opérateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 transition-all font-medium shadow-xs"
                  />
                </div>

                {/* Filtres par statut (Défilement horizontal doux sur mobile) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200 bg-white p-1 rounded-xl text-xs font-['Outfit'] font-bold shrink-0 shadow-xs">
                  {[
                    { id: 'all', label: 'Toutes' },
                    { id: 'en_attente', label: 'En attente' },
                    { id: 'confirmee', label: 'Confirmées' },
                    { id: 'en_cours', label: 'En cours' },
                    { id: 'terminee', label: 'Terminées' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBookingFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
                        bookingFilter === tab.id
                          ? 'bg-[#0D5C3A] text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* --- VUE MOBILE : CARTES MÉTIER TACTILES (< md) AVEC TRAÇABILITÉ --- */}
              <div className="md:hidden space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    Aucune réservation ne correspond à vos filtres.
                  </div>
                ) : (
                  filteredBookings.map((b) => (
                    <div 
                      key={b.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                    >
                      {/* Top Carte : Nom, Quartier et Prix */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-['Outfit'] font-bold text-base text-slate-900">{b.client_name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0D5C3A] shrink-0" />
                            <span className="font-medium">{b.quarter || 'Dakar'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-['Outfit'] font-extrabold text-base text-[#0D5C3A] tabular-nums">
                            {formatPrice(b.estimated_price_fcfa)}
                          </span>
                        </div>
                      </div>

                      {/* Service & Détails */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                        <div className="font-bold text-slate-800">{b.service_type}</div>
                        {b.service_details && b.service_details !== b.service_type && (
                          <div className="text-slate-600 text-[11px] leading-relaxed">{b.service_details}</div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
                          <span>{b.intervention_date || 'Date à définir'} {b.intervention_time ? `• ${b.intervention_time}` : ''}</span>
                        </div>
                      </div>

                      {/* BADGE DE TRAÇABILITÉ : QUI A TRAITÉ CETTE COMMANDE ? */}
                      <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-[#F8FAF7] border border-slate-200/80">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#0D5C3A]" />
                          <span className="text-slate-500 text-[11px]">Traité par :</span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {b.processed_by_name || 'En attente de prise en charge'}
                          </span>
                        </div>
                        {b.processed_at && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(b.processed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(b.processed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Statut sélecteur et Actions au toucher */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        {/* Sélecteur de statut (met à jour automatiquement "traité par") */}
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                          className={`text-xs font-['Outfit'] font-bold py-1.5 px-3 rounded-xl border focus:outline-none cursor-pointer ${getStatusBadge(b.status)}`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="confirmee">Confirmée</option>
                          <option value="en_cours">En cours</option>
                          <option value="terminee">Terminée</option>
                          <option value="annulee">Annulée</option>
                        </select>

                        {/* Actions directes rapides */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${b.client_phone.replace(/\s+/g, '')}`}
                            className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center gap-1.5"
                            title="Appeler directement"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                            <span>Appel</span>
                          </a>

                          <a
                            href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-bold font-['Outfit'] flex items-center gap-1.5"
                            title="Ouvrir WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {canDeleteBookings && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b.id)}
                              className="h-8 w-8 rounded-xl bg-slate-100 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* --- VUE DESKTOP : TABLE SPATIEUSE HAUTE DENSITÉ (>= md) AVEC TRAÇABILITÉ --- */}
              <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-5">Client</th>
                        <th className="py-3.5 px-5">Prestation demandée</th>
                        <th className="py-3.5 px-5">Quartier & Date</th>
                        <th className="py-3.5 px-5">Montant</th>
                        <th className="py-3.5 px-5">Statut</th>
                        <th className="py-3.5 px-5">Traçabilité Opérateur</th>
                        <th className="py-3.5 px-5 text-right">Actions rapides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-14 text-center text-slate-500 text-xs">
                            Aucune réservation ne correspond aux critères sélectionnés.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                            {/* Client */}
                            <td className="py-4 px-5">
                              <div className="font-['Outfit'] font-bold text-slate-900 text-sm">{b.client_name}</div>
                              <div className="text-xs text-slate-500 font-medium tabular-nums mt-0.5">{b.client_phone}</div>
                            </td>

                            {/* Service */}
                            <td className="py-4 px-5 max-w-xs">
                              <div className="font-bold text-slate-800 text-xs">{b.service_type}</div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">{b.service_details}</div>
                            </td>

                            {/* Quartier & Date */}
                            <td className="py-4 px-5">
                              <div className="text-slate-800 font-semibold text-xs">{b.quarter}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {b.intervention_date || 'Date à fixer'} {b.intervention_time ? `• ${b.intervention_time}` : ''}
                              </div>
                            </td>

                            {/* Montant */}
                            <td className="py-4 px-5 font-['Outfit'] font-extrabold text-[#0D5C3A] text-sm tabular-nums">
                              {formatPrice(b.estimated_price_fcfa)}
                            </td>

                            {/* Statut sélecteur */}
                            <td className="py-4 px-5">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                className={`text-xs font-['Outfit'] font-bold py-1 px-3 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(b.status)}`}
                              >
                                <option value="en_attente">En attente</option>
                                <option value="confirmee">Confirmée</option>
                                <option value="en_cours">En cours</option>
                                <option value="terminee">Terminée</option>
                                <option value="annulee">Annulée</option>
                              </select>
                            </td>

                            {/* TRAÇABILITÉ DESKTOP : NOM DU COLLABORATEUR QUI A TRAITÉ */}
                            <td className="py-4 px-5">
                              {b.processed_by_name ? (
                                <div>
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0D5C3A] border border-emerald-200 text-[11px] font-bold font-['Outfit']">
                                    <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                    <span>{b.processed_by_name}</span>
                                  </div>
                                  {b.processed_at && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                      Le {new Date(b.processed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(b.processed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Non traité</span>
                              )}
                            </td>

                            {/* Actions rapides */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2 font-['Outfit']">
                                <a
                                  href={`tel:${b.client_phone.replace(/\s+/g, '')}`}
                                  className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                  title="Appeler directement"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                                  <span>Appel</span>
                                </a>

                                <a
                                  href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                  title="Ouvrir WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>

                                {canDeleteBookings && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(b.id)}
                                    className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Supprimer la réservation"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : RÉPERTOIRE CLIENTS (CRM)                                       */}
          {/* ========================================================================= */}
          {activeTab === 'clients' && canViewCRM && (
            <div className="space-y-4">
              
              {/* VUE MOBILE : Cartes clients (< md) */}
              <div className="md:hidden space-y-3">
                {clients.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    Aucun client répertorié pour le moment.
                  </div>
                ) : (
                  clients.map(c => (
                    <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-['Outfit'] font-bold text-base text-slate-900">{c.full_name}</h4>
                          <div className="text-xs text-slate-500 font-medium tabular-nums">{c.phone}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.quarter || 'Dakar'}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold ${
                          c.loyalty_status === 'Client VIP' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          c.loyalty_status === 'Client Régulier' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.loyalty_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-slate-500 font-medium">
                          <span>{c.total_orders} commande{c.total_orders > 1 ? 's' : ''}</span>
                        </div>
                        <div className="font-['Outfit'] font-extrabold text-[#0D5C3A] text-base tabular-nums">
                          {formatPrice(c.total_spent_fcfa)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VUE DESKTOP : Table clients (>= md) */}
              <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Client</th>
                      <th className="py-3.5 px-5">Téléphone</th>
                      <th className="py-3.5 px-5">Quartier</th>
                      <th className="py-3.5 px-5">Commandes</th>
                      <th className="py-3.5 px-5">Total Dépensé</th>
                      <th className="py-3.5 px-5">Statut Fidélité</th>
                      <th className="py-3.5 px-5">Dernière commande</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-slate-500 text-xs">
                          Aucun client répertorié. Les clients s'enregistrent automatiquement dès qu'ils valident une réservation sur le site.
                        </td>
                      </tr>
                    ) : (
                      clients.map((c) => (
                        <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-4 px-5 font-['Outfit'] font-bold text-slate-900 text-sm">{c.full_name}</td>
                          <td className="py-4 px-5 text-slate-600 text-xs tabular-nums font-medium">{c.phone}</td>
                          <td className="py-4 px-5 text-slate-500 text-xs font-medium">{c.quarter || 'Dakar'}</td>
                          <td className="py-4 px-5 text-slate-800 font-bold font-['Outfit'] text-sm">{c.total_orders}</td>
                          <td className="py-4 px-5 font-['Outfit'] font-extrabold text-[#0D5C3A] text-sm tabular-nums">
                            {formatPrice(c.total_spent_fcfa)}
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold ${
                              c.loyalty_status === 'Client VIP' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              c.loyalty_status === 'Client Régulier' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {c.loyalty_status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-slate-500 text-xs font-medium tabular-nums">
                            {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('fr-FR') : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : STATISTIQUES & BILAN COMPLET (Admin & Super Admin uniquement)  */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && canViewStats && (
            <div className="space-y-6">
              
              {/* Cartes KPI Principales (2 cols sur mobile, 4 sur desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Chiffre d'Affaires</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-[#0D5C3A] mt-2 tabular-nums">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Prestations engagées ou finalisées</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Total Interventions</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-slate-900 mt-2 tabular-nums">
                    {stats.totalBookings}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Sur l'ensemble des formules</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Panier Moyen</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-blue-700 mt-2 tabular-nums">
                    {formatPrice(stats.avgBasket)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Moyenne par client à Dakar</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Clients Enregistrés</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-purple-700 mt-2 tabular-nums">
                    {clients.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">Contacts qualifiés répertoriés</div>
                </div>
              </div>

              {/* Grille Analytique Double Colonne */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                
                {/* 1. Répartition du Chiffre d'Affaires par Métier */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider text-slate-900">Volume par prestation</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Part de chiffre d'affaires générée par formule</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {stats.serviceDistribution.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Données en cours de synchronisation.
                      </div>
                    ) : (
                      stats.serviceDistribution.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="font-['Outfit'] font-bold text-[#0D5C3A] tabular-nums">
                              {formatPrice(item.amount)} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(item.percentage, 4)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Top Quartiers Stratégiques à Dakar */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider text-slate-900">Concentration géographique</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Quartiers de Dakar avec la plus forte demande</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {stats.topQuarters.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Aucune donnée géographique enregistrée.
                      </div>
                    ) : (
                      stats.topQuarters.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-['Outfit'] text-xs text-slate-700 flex items-center justify-center font-bold shadow-xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{q.name}</span>
                          </div>
                          <span className="text-xs font-['Outfit'] font-bold text-[#0D5C3A] tabular-nums">
                            {q.count} intervention{q.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Pipeline des Interventions (Entonnoir d'état) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider text-slate-900">État du flux opérationnel</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Suivi en direct de l'exécution sur le terrain</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-center">
                    <div className="text-[11px] font-['Outfit'] font-bold text-amber-800 uppercase">En attente</div>
                    <div className="text-2xl font-['Outfit'] font-extrabold text-amber-900 mt-1 tabular-nums">{stats.statusCounts.en_attente}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center">
                    <div className="text-[11px] font-['Outfit'] font-bold text-blue-800 uppercase">Confirmées</div>
                    <div className="text-2xl font-['Outfit'] font-extrabold text-blue-900 mt-1 tabular-nums">{stats.statusCounts.confirmee}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 text-center">
                    <div className="text-[11px] font-['Outfit'] font-bold text-purple-800 uppercase">En cours</div>
                    <div className="text-2xl font-['Outfit'] font-extrabold text-purple-900 mt-1 tabular-nums">{stats.statusCounts.en_cours}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-center">
                    <div className="text-[11px] font-['Outfit'] font-bold text-[#0D5C3A] uppercase">Terminées</div>
                    <div className="text-2xl font-['Outfit'] font-extrabold text-[#0D5C3A] mt-1 tabular-nums">{stats.statusCounts.terminee}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[11px] font-['Outfit'] font-bold text-slate-500 uppercase">Annulées</div>
                    <div className="text-2xl font-['Outfit'] font-extrabold text-slate-700 mt-1 tabular-nums">{stats.statusCounts.annulee}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 4 : GESTION ÉQUIPE UNIVERSELLE (Super Admin Uniquement)            */}
          {/* ========================================================================= */}
          {activeTab === 'team' && canManageTeam && (
            <div className="space-y-6">
              
              {/* Formulaire d'ajout universel de collaborateur */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0D5C3A]" />
                    <h4 className="font-['Outfit'] font-bold text-base text-slate-900">Accréditer un collaborateur (Gestion des Droits)</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    En tant que <strong>Super-Admin</strong>, vous contrôlez qui a accès à quoi. Définissez le rôle précis du collaborateur.
                  </p>
                </div>

                {teamMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold font-['Outfit'] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span>{teamMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1">Nom complet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Awa Ndiaye"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1">Adresse email de connexion</label>
                    <input 
                      type="email" 
                      required
                      placeholder="nom@taaruset.sn ou gmail"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1">Téléphone WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="+221 77 ..."
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-medium tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1">Rôle & Droits accordés</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-bold font-['Outfit']"
                    >
                      <option value="agent">Chef d'Équipe Terrain (Planning uniquement)</option>
                      <option value="sales">Chargé(e) Clientèle (Planning + CRM Clients)</option>
                      <option value="admin">Responsable Opérations (Planning + CRM + Bilan)</option>
                      <option value="super_admin">Super-Admin / Direction (Accès total absolu)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs transition-colors cursor-pointer shadow-md shadow-[#0D5C3A]/20 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Accréditer le membre</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Table des collaborateurs (Thème clair avec suppression et gestion de statut) */}
              <div className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Collaborateur</th>
                      <th className="py-3.5 px-5">Email accrédité</th>
                      <th className="py-3.5 px-5">Téléphone</th>
                      <th className="py-3.5 px-5">Rôle & Permissions</th>
                      <th className="py-3.5 px-5">Statut</th>
                      <th className="py-3.5 px-5 text-right">Gestion des droits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D5C3A] font-['Outfit'] font-black text-xs flex items-center justify-center shadow-xs">
                              {m.full_name ? m.full_name.slice(0, 2).toUpperCase() : 'TS'}
                            </div>
                            <div>
                              <div className="font-['Outfit'] font-bold text-slate-900 text-sm">{m.full_name}</div>
                              {m.job_title && (
                                <div className="text-[11px] text-slate-500 font-medium">{m.job_title}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-700 text-xs font-medium tabular-nums">{m.email}</td>
                        
                        <td className="py-4 px-5 text-slate-600 text-xs font-medium tabular-nums">
                          {m.phone ? (
                            <a 
                              href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[#0D5C3A] hover:underline font-bold"
                            >
                              {m.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold ${
                            m.role === 'super_admin' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                            m.role === 'admin' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            m.role === 'sales' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {getRoleLabel(m.role)}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold ${
                            m.is_active ? 'bg-emerald-50 text-[#0D5C3A] border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {m.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2 font-['Outfit']">
                            <button
                              type="button"
                              onClick={() => handleToggleMemberActive(m.id, m.is_active)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                m.is_active 
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                  : 'bg-emerald-50 text-[#0D5C3A] hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {m.is_active ? 'Suspendre' : 'Réactiver'}
                            </button>

                            {m.email !== 'ssow2006@gmail.com' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTeamMember(m.id, m.email, m.full_name)}
                                className="h-8 w-8 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Révoquer et supprimer ce collaborateur"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 4. BARRE DE NAVIGATION INFÉRIEURE MOBILE (Sticky Bottom Bar Thème Blanc)  */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around z-30 px-2 font-['Outfit'] shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
            activeTab === 'bookings' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-[#0D5C3A] text-white">
              {bookings.length}
            </span>
          </div>
          <span className="text-[10px] font-bold">Planning</span>
        </button>

        {canViewCRM && (
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
              activeTab === 'clients' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Clients</span>
          </button>
        )}

        {canViewStats && (
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
              activeTab === 'stats' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Bilan</span>
          </button>
        )}

        {canManageTeam && (
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
              activeTab === 'team' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-bold">Équipe</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl text-slate-400 hover:text-slate-700"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 5. MODALE NOUVELLE COMMANDE MANUELLE (STYLE TAARU SET)                    */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-['Outfit'] font-bold text-slate-900">Nouvelle intervention manuelle</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setIsManualModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Nom complet du client</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Mamadou Diop"
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#0D5C3A]" 
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Téléphone WhatsApp</label>
                <input 
                  type="text" 
                  required 
                  placeholder="+221 77 123 45 67"
                  value={manualPhone} 
                  onChange={e => setManualPhone(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#0D5C3A] tabular-nums" 
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Formule / Prestation</label>
                <select 
                  value={manualService} 
                  onChange={e => setManualService(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold font-['Outfit'] focus:outline-none focus:bg-white focus:border-[#0D5C3A]"
                >
                  <option value="Nettoyage Canapés & Salons Kärcher">Nettoyage Canapés & Salons Kärcher</option>
                  <option value="Lavage Auto Mobile Kärcher">Lavage Auto Mobile Kärcher</option>
                  <option value="Nettoyage Fin de Chantier & Villas">Nettoyage Fin de Chantier & Villas</option>
                  <option value="Bureaux, Locaux & Syndics">Bureaux, Locaux & Syndics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Quartier à Dakar</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Almadies"
                    value={manualQuarter} 
                    onChange={e => setManualQuarter(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#0D5C3A]" 
                  />
                </div>
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Montant estimé (FCFA)</label>
                  <input 
                    type="number" 
                    required 
                    value={manualPrice} 
                    onChange={e => setManualPrice(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[#0D5C3A] font-['Outfit'] font-extrabold focus:outline-none focus:bg-white focus:border-[#0D5C3A] tabular-nums" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Date & Créneau horaire souhaité</label>
                <input 
                  type="text" 
                  value={manualDate} 
                  onChange={e => setManualDate(e.target.value)} 
                  placeholder="Demain matin (09h00)"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#0D5C3A]" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-11 mt-3 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-sm transition-all cursor-pointer shadow-md shadow-[#0D5C3A]/25"
              >
                Enregistrer la réservation dans Supabase
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
