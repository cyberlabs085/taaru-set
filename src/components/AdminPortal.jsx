import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import logoOfficialSq from '../assets/logo_official_sq.jpg';
import { 
  Shield, Users, Calendar, Phone, MessageSquare, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Download, LogOut, RefreshCw, X, ArrowUpRight, 
  UserPlus, BarChart3, TrendingUp, DollarSign, MapPin, 
  Layers, ExternalLink, Activity, Check, Lock, KeyRound,
  Menu, ChevronRight, Sparkles, Building2, Car, Sparkle
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

  // --- FORMULAIRE NOUVEAU MEMBRE D'ÉQUIPE (Super Admin) ---
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('operations');
  const [teamMsg, setTeamMsg] = useState('');

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
        setAuthError(`⛔ ACCÈS REFUSÉ (Code 403) : Le compte "${user.email}" n'est pas autorisé par la direction de TAARU SET. Toute tentative d'intrusion est bloquée et journalisée.`);
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
        setAuthError(`⛔ ACCÈS STRICTEMENT REFUSÉ : L'adresse "${cleanEmail}" ne figure pas dans le registre officiel de TAARU SET. Seuls les collaborateurs accrédités peuvent se connecter.`);
        return;
      }

      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + '/?admin'
        });
        if (error) throw error;
        setAuthSuccessMsg(`Un lien d'activation sécurisé a été expédié à ${cleanEmail}. Consultez votre boîte de réception pour définir votre mot de passe personnel.`);
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

  // Modification statut réservation
  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('taaru_bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (!error) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Suppression réservation
  const handleDeleteBooking = async (bookingId) => {
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

  // Ajout réservation manuelle
  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('taaru_bookings').insert({
        client_name: manualName.trim(),
        client_phone: manualPhone.trim(),
        service_type: manualService,
        service_details: manualDetails.trim() || manualService,
        quarter: manualQuarter.trim(),
        estimated_price_fcfa: parseInt(manualPrice, 10) || 0,
        intervention_date: manualDate.trim() || 'À caler',
        status: 'confirmee',
        source: 'appel_direct'
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

  // Gestion Équipe
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    setTeamMsg('');
    if (!supabase) return;

    try {
      const { error } = await supabase.from('taaru_team_members').insert({
        email: newMemberEmail.trim().toLowerCase(),
        full_name: newMemberName.trim(),
        role: newMemberRole,
        is_active: true
      });

      if (error) throw error;
      setTeamMsg('✅ Collaborateur accrédité dans le registre. Il peut désormais activer son mot de passe en toute sécurité.');
      setNewMemberEmail('');
      setNewMemberName('');
      loadAllData();
    } catch (err) {
      setTeamMsg(`❌ Erreur : ${err.message || 'Impossible d\'ajouter ce membre.'}`);
    }
  };

  const handleToggleMemberActive = async (memberId, currentStatus) => {
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
          b.service_type?.toLowerCase().includes(q)
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
      const s = b.service_type || 'Autre';
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

  // Sélecteur de couleur de badge de statut
  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-amber-950/50 text-amber-300 border-amber-800/60';
      case 'confirmee':
        return 'bg-blue-950/50 text-blue-300 border-blue-800/60';
      case 'en_cours':
        return 'bg-purple-950/50 text-purple-300 border-purple-800/60';
      case 'terminee':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
      case 'annulee':
        return 'bg-rose-950/50 text-rose-300 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'confirmee': return 'Confirmée';
      case 'en_cours': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  // --- ÉCRAN DE CHARGEMENT INITIAL ---
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070A10] flex flex-col items-center justify-center p-4 font-sans text-white">
        <div className="relative mb-5">
          <img 
            src={logoOfficialSq} 
            alt="TAARU SET" 
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-2xl shadow-emerald-950/80" 
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070A10] animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide font-['Outfit']">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Vérification de sécurité Zero-Trust...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Accréditation du terminal auprès du noyau Supabase</p>
      </div>
    );
  }

  // --- ÉCRAN DE CONNEXION ZERO-TRUST HAUTE SÉCURITÉ ---
  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070A10] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-sm sm:max-w-md border border-slate-800/90 bg-[#0B0F19] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden">
          
          {/* Lueur d'ambiance émeraude subtile */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* En-tête avec VRAI LOGO TAARU SET */}
          <div className="flex items-start justify-between pb-5 mb-5 border-b border-slate-800/80 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/60 bg-[#072212] flex items-center justify-center shrink-0">
                <img 
                  src={logoOfficialSq} 
                  alt="Logo officiel TAARU SET" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-['Outfit'] font-black text-lg tracking-tight leading-none text-white">
                  <span>TAARU</span>
                  <span className="text-[#16A34A]">SET</span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-1">Portail de Gestion Officiel</p>
                <p className="text-[10px] text-slate-500">Le charme de la propreté • Dakar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer"
              title="Retourner au site public"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badge Zero-Trust */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-['Outfit'] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              <Lock className="w-3 h-3 text-emerald-400" />
              Accès Privé Protégé (Noyau PostgreSQL)
            </span>
          </div>

          {authError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Outfit']">
                Adresse email accréditée
              </label>
              <input 
                type="email" 
                required
                placeholder="votre-nom@taaruset.sn"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                disabled={lockoutTimer > 0}
                className="w-full h-11 px-3.5 rounded-xl bg-[#070A10] border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors font-medium"
              />
            </div>

            {!isResetMode && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Outfit']">
                  Mot de passe personnel
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={lockoutTimer > 0}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#070A10] border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors font-medium"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutTimer > 0}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:from-[#0f6c44] hover:to-[#18b553] disabled:bg-slate-800 disabled:text-slate-600 text-white font-['Outfit'] font-bold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-950/60 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {lockoutTimer > 0 ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Verrouillé ({lockoutTimer}s)</span>
                </>
              ) : isResetMode ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Envoyer le lien d'activation</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Se connecter au portail</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsResetMode(!isResetMode);
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              {isResetMode ? '← Retour à la connexion standard' : 'Première invitation / Mot de passe oublié ?'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- PORTAIL PLEIN ÉCRAN DÉDIÉ (STANDALONE WORKSPACE) ---
  return (
    <div className="fixed inset-0 z-50 bg-[#070A10] text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE MOBILE TOPBAR (Visible uniquement sur mobile < md)             */}
      {/* ========================================================================= */}
      <header className="md:hidden h-14 bg-[#0B0F19] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <img 
            src={logoOfficialSq} 
            alt="TAARU SET" 
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/40" 
          />
          <div className="flex items-center gap-1 font-['Outfit'] font-black text-sm tracking-tight text-white leading-none">
            <span>TAARU</span>
            <span className="text-[#16A34A]">SET</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold ml-1">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'bookings' && (
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold font-['Outfit'] flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* TIROIR DÉROULANT MOBILE (Slide-Over Drawer) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[#0B0F19] border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src={logoOfficialSq} alt="TAARU SET" className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500/40" />
                <div>
                  <div className="font-['Outfit'] font-extrabold text-sm text-white">Menu Gestionnaire</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{session.user.email}</div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Drawer Tabs */}
            <div className="space-y-1.5 font-['Outfit']">
              <button
                type="button"
                onClick={() => { setActiveTab('bookings'); setIsMobileMenuOpen(false); }}
                className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'bookings' ? 'bg-emerald-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4" />
                  <span>Réservations & Planning</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-black/30 text-white font-semibold">
                  {bookings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }}
                className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'clients' ? 'bg-blue-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Répertoire Clients CRM</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-black/30 text-white font-semibold">
                  {clients.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }}
                className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'stats' ? 'bg-amber-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistiques & Bilan</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              </button>

              {currentMember?.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }}
                  className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                    activeTab === 'team' ? 'bg-purple-600 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4" />
                    <span>Équipe & Droits</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-black/30 text-white font-semibold">
                    {teamMembers.length}
                  </span>
                </button>
              )}
            </div>

            {/* Actions secondaires Drawer */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-2 text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Voir le site public TAARU SET</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full h-10 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 flex items-center justify-center gap-2 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIDEBAR DE NAVIGATION DESKTOP (Fixée à gauche sur md+)                 */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0B0F19] border-r border-slate-800/90 shrink-0">
        
        {/* Identité Entreprise avec Logo Officiel */}
        <div className="p-4 lg:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-emerald-500/40 shadow-md shadow-emerald-950/60 bg-[#072212] shrink-0">
              <img 
                src={logoOfficialSq} 
                alt="Logo TAARU SET" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="flex items-center gap-1 font-['Outfit'] font-black text-sm tracking-tight text-white leading-none">
                <span>TAARU</span>
                <span className="text-[#16A34A]">SET</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide block mt-0.5">
                Portail Gestionnaire
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync
          </span>
        </div>

        {/* Profil Collaborateur Certifié */}
        <div className="p-3.5 mx-3.5 my-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">Accès Vérifié</div>
          <div className="text-xs font-bold text-slate-100 truncate mt-0.5">{session.user.email}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              {currentMember?.role === 'super_admin' ? 'Super Admin' : (currentMember?.role || 'Opérateur')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">• Dakar, SN</span>
          </div>
        </div>

        {/* Navigation Onglets */}
        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto text-xs font-['Outfit'] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-emerald-600 to-[#15803D] text-white shadow-md shadow-emerald-950/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>Réservations</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20 text-white">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-950/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-300" />
              <span>Répertoire Clients</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20 text-white">
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-amber-300" />
              <span>Statistiques & Bilan</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </button>

          {currentMember?.role === 'super_admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`w-full h-10 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-950/60 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-purple-300" />
                <span>Équipe & Droits</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/20 text-white">
                {teamMembers.length}
              </span>
            </button>
          )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-1.5 font-['Outfit']">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 px-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Voir le site public</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-9 px-3 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. ESPACE DE TRAVAIL PRINCIPAL                                            */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-[#070A10] overflow-hidden">
        
        {/* Topbar Header Desktop (Masqué sur mobile, visible sur md+) */}
        <header className="hidden md:flex h-14 px-6 border-b border-slate-800/80 items-center justify-between shrink-0 bg-[#0B0F19]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold font-['Outfit'] text-white tracking-tight">
              {activeTab === 'bookings' && 'Planning des Réservations & Interventions'}
              {activeTab === 'clients' && 'Répertoire des Clients (CRM)'}
              {activeTab === 'stats' && 'Tableau de Bord Décisionnel & Bilan'}
              {activeTab === 'team' && 'Collaborateurs & Gestion des Droits'}
            </h2>
            {loadingData && (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-3 font-['Outfit']">
            {activeTab === 'bookings' && (
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/60"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle intervention</span>
              </button>
            )}

            {activeTab === 'clients' && (
              <button
                type="button"
                onClick={exportClientsCSV}
                className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exporter CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAllData}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Corps des onglets (Scrollable, avec padding-bottom renforcé sur mobile pour la Bottom Nav) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-24 md:pb-6 space-y-5">

          {/* ========================================================================= */}
          {/* ONGLET 1 : RÉSERVATIONS & PLANNING                                        */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Barre de contrôle : Recherche et Filtres */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Filtrer par nom, téléphone, quartier, service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                  />
                </div>

                {/* Filtres par statut (Défilement horizontal doux sur mobile) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-800/80 bg-[#0E131F] p-1 rounded-xl text-xs font-['Outfit'] font-semibold shrink-0">
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
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
                        bookingFilter === tab.id
                          ? 'bg-slate-800 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* --- VUE MOBILE : CARTES MÉTIER TACTILES (< md) --- */}
              <div className="md:hidden space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-[#0B0F19] rounded-2xl border border-slate-800/80 p-6">
                    Aucune réservation ne correspond à vos filtres.
                  </div>
                ) : (
                  filteredBookings.map((b) => (
                    <div 
                      key={b.id}
                      className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm space-y-3"
                    >
                      {/* Top Carte : Nom, Quartier et Prix */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-['Outfit'] font-bold text-sm text-white">{b.client_name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{b.quarter || 'Dakar'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-['Outfit'] font-extrabold text-base text-emerald-400 tabular-nums">
                            {formatPrice(b.estimated_price_fcfa)}
                          </span>
                        </div>
                      </div>

                      {/* Service & Détails */}
                      <div className="p-2.5 rounded-xl bg-[#070A10] border border-slate-800/60 text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{b.service_type}</div>
                        {b.service_details && b.service_details !== b.service_type && (
                          <div className="text-slate-400 text-[11px] leading-relaxed">{b.service_details}</div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.intervention_date || 'Date à définir'} {b.intervention_time ? `• ${b.intervention_time}` : ''}</span>
                        </div>
                      </div>

                      {/* Statut sélecteur et Actions au toucher */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        {/* Sélecteur de statut */}
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
                            className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                            title="Appeler directement"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Appel</span>
                          </a>

                          <a
                            href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-xs font-semibold flex items-center gap-1.5"
                            title="Ouvrir WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id)}
                            className="h-8 w-8 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* --- VUE DESKTOP : TABLE SPATIEUSE HAUTE DENSITÉ (>= md) --- */}
              <div className="hidden md:block border border-slate-800/80 rounded-2xl bg-[#0B0F19] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0E131F] text-slate-400 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-800/80">
                      <tr>
                        <th className="py-3 px-4 font-bold">Client</th>
                        <th className="py-3 px-4 font-bold">Prestation</th>
                        <th className="py-3 px-4 font-bold">Quartier & Date</th>
                        <th className="py-3 px-4 font-bold">Montant</th>
                        <th className="py-3 px-4 font-bold">Statut</th>
                        <th className="py-3 px-4 text-right font-bold">Actions directes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-14 text-center text-slate-500 text-xs">
                            Aucune réservation ne correspond aux critères sélectionnés.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* Client */}
                            <td className="py-3.5 px-4">
                              <div className="font-['Outfit'] font-bold text-white text-sm">{b.client_name}</div>
                              <div className="text-xs text-slate-400 font-medium tabular-nums">{b.client_phone}</div>
                            </td>

                            {/* Service */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-semibold text-slate-200 text-xs">{b.service_type}</div>
                              <div className="text-[11px] text-slate-400 truncate">{b.service_details}</div>
                            </td>

                            {/* Quartier & Date */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-300 font-semibold text-xs">{b.quarter}</div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {b.intervention_date || 'Date à fixer'} {b.intervention_time ? `• ${b.intervention_time}` : ''}
                              </div>
                            </td>

                            {/* Montant */}
                            <td className="py-3.5 px-4 font-['Outfit'] font-extrabold text-emerald-400 text-sm tabular-nums">
                              {formatPrice(b.estimated_price_fcfa)}
                            </td>

                            {/* Statut sélecteur */}
                            <td className="py-3.5 px-4">
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

                            {/* Actions rapides */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`tel:${b.client_phone.replace(/\s+/g, '')}`}
                                  className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Appeler directement"
                                >
                                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Appel</span>
                                </a>

                                <a
                                  href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-8 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/70 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Ouvrir WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="h-8 w-8 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Supprimer la réservation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
          {activeTab === 'clients' && (
            <div className="space-y-4">
              
              {/* VUE MOBILE : Cartes clients (< md) */}
              <div className="md:hidden space-y-3">
                {clients.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-[#0B0F19] rounded-2xl border border-slate-800 p-6">
                    Aucun client répertorié pour le moment.
                  </div>
                ) : (
                  clients.map(c => (
                    <div key={c.id} className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-['Outfit'] font-bold text-sm text-white">{c.full_name}</h4>
                          <div className="text-xs text-slate-400 font-medium tabular-nums">{c.phone}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{c.quarter || 'Dakar'}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold ${
                          c.loyalty_status === 'Client VIP' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' :
                          c.loyalty_status === 'Client Régulier' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {c.loyalty_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                        <div className="text-slate-400">
                          <span>{c.total_orders} commande{c.total_orders > 1 ? 's' : ''}</span>
                        </div>
                        <div className="font-['Outfit'] font-extrabold text-emerald-400 text-sm tabular-nums">
                          {formatPrice(c.total_spent_fcfa)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VUE DESKTOP : Table clients (>= md) */}
              <div className="hidden md:block border border-slate-800/80 rounded-2xl bg-[#0B0F19] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131F] text-slate-400 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Téléphone</th>
                      <th className="py-3 px-4">Quartier</th>
                      <th className="py-3 px-4">Commandes</th>
                      <th className="py-3 px-4">Total Dépensé</th>
                      <th className="py-3 px-4">Statut Fidélité</th>
                      <th className="py-3 px-4">Dernière commande</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-slate-500 text-xs">
                          Aucun client répertorié. Les clients s'enregistrent automatiquement dès qu'ils valident une réservation sur le site.
                        </td>
                      </tr>
                    ) : (
                      clients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-['Outfit'] font-bold text-white text-sm">{c.full_name}</td>
                          <td className="py-3.5 px-4 text-slate-300 text-xs tabular-nums font-medium">{c.phone}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">{c.quarter || 'Dakar'}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-bold font-['Outfit']">{c.total_orders}</td>
                          <td className="py-3.5 px-4 font-['Outfit'] font-extrabold text-emerald-400 text-sm tabular-nums">
                            {formatPrice(c.total_spent_fcfa)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold ${
                              c.loyalty_status === 'Client VIP' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60' :
                              c.loyalty_status === 'Client Régulier' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/60' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {c.loyalty_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs font-medium tabular-nums">
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
          {/* ONGLET 3 : STATISTIQUES & BILAN COMPLET                                   */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              
              {/* Cartes KPI Principales (2 cols sur mobile, 4 sur desktop) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Chiffre d'Affaires</div>
                  <div className="text-lg sm:text-2xl font-['Outfit'] font-extrabold text-emerald-400 mt-1.5 tabular-nums">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Prestations engagées ou finalisées</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Total Interventions</div>
                  <div className="text-lg sm:text-2xl font-['Outfit'] font-extrabold text-white mt-1.5 tabular-nums">
                    {stats.totalBookings}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Sur l'ensemble des formules</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Panier Moyen</div>
                  <div className="text-lg sm:text-2xl font-['Outfit'] font-extrabold text-blue-400 mt-1.5 tabular-nums">
                    {formatPrice(stats.avgBasket)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Moyenne par client à Dakar</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Clients Enregistrés</div>
                  <div className="text-lg sm:text-2xl font-['Outfit'] font-extrabold text-purple-400 mt-1.5 tabular-nums">
                    {clients.length}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Contacts qualifiés répertoriés</div>
                </div>
              </div>

              {/* Grille Analytique Double Colonne */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* 1. Répartition du Chiffre d'Affaires par Métier */}
                <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-slate-200">Volume par prestation</h4>
                      <p className="text-[11px] text-slate-400">Part de chiffre d'affaires générée par formule</p>
                    </div>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="space-y-3.5 pt-2">
                    {stats.serviceDistribution.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Données en cours de synchronisation.
                      </div>
                    ) : (
                      stats.serviceDistribution.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            <span className="font-['Outfit'] font-bold text-slate-300 tabular-nums">
                              {formatPrice(item.amount)} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(item.percentage, 4)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Top Quartiers Stratégiques à Dakar */}
                <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-slate-200">Concentration géographique</h4>
                      <p className="text-[11px] text-slate-400">Zones les plus demandeuses pour vos équipes terrain</p>
                    </div>
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {stats.topQuarters.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Aucune donnée géographique enregistrée.
                      </div>
                    ) : (
                      stats.topQuarters.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0E131F] border border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 font-['Outfit'] text-xs text-slate-300 flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{q.name}</span>
                          </div>
                          <span className="text-xs font-['Outfit'] font-bold text-emerald-400 tabular-nums">
                            {q.count} intervention{q.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Pipeline des Interventions (Entonnoir d'état) */}
              <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-slate-200">État du flux opérationnel</h4>
                    <p className="text-[11px] text-slate-400">Suivi en temps réel de l'exécution terrain</p>
                  </div>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-['Outfit'] font-bold text-amber-400 uppercase">En attente</div>
                    <div className="text-xl font-['Outfit'] font-black text-white mt-1 tabular-nums">{stats.statusCounts.en_attente}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-['Outfit'] font-bold text-blue-400 uppercase">Confirmées</div>
                    <div className="text-xl font-['Outfit'] font-black text-white mt-1 tabular-nums">{stats.statusCounts.confirmee}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-['Outfit'] font-bold text-purple-400 uppercase">En cours</div>
                    <div className="text-xl font-['Outfit'] font-black text-white mt-1 tabular-nums">{stats.statusCounts.en_cours}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-['Outfit'] font-bold text-emerald-400 uppercase">Terminées</div>
                    <div className="text-xl font-['Outfit'] font-black text-white mt-1 tabular-nums">{stats.statusCounts.terminee}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-['Outfit'] font-bold text-slate-400 uppercase">Annulées</div>
                    <div className="text-xl font-['Outfit'] font-black text-slate-400 mt-1 tabular-nums">{stats.statusCounts.annulee}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 4 : GESTION ÉQUIPE & DROITS                                        */}
          {/* ========================================================================= */}
          {activeTab === 'team' && currentMember?.role === 'super_admin' && (
            <div className="space-y-5">
              
              {/* Formulaire d'invitation réservé au Super Admin */}
              <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/90 space-y-4 shadow-sm">
                <div>
                  <h4 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-slate-200">Accréditer un collaborateur</h4>
                  <p className="text-[11px] text-slate-400">
                    Seuls les emails inscrits ici sont autorisés par le noyau PostgreSQL à créer ou réinitialiser un mot de passe.
                  </p>
                </div>

                {teamMsg && (
                  <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-700 text-xs text-emerald-300 font-semibold font-['Outfit']">
                    {teamMsg}
                  </div>
                )}

                <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-300 mb-1">Nom complet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Mouhamadou / Djiby"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-300 mb-1">Adresse email officielle</label>
                    <input 
                      type="email" 
                      required
                      placeholder="nom@collaborateur.sn"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-300 mb-1">Attribution du rôle</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="operations">Co-fondateur • Opérations (Djiby)</option>
                      <option value="strategy">Co-fondateur • Stratégie (Mouhamadou)</option>
                      <option value="super_admin">Super-Admin / Direction (Mamadou)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-['Outfit'] font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950/60"
                    >
                      Accréditer l'accès
                    </button>
                  </div>
                </form>
              </div>

              {/* Table des collaborateurs */}
              <div className="border border-slate-800/80 rounded-2xl bg-[#0B0F19] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131F] text-slate-400 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-3 px-4">Nom</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Rôle</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-['Outfit'] font-bold text-white text-sm">{m.full_name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium tabular-nums">{m.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {m.role === 'super_admin' ? 'Super Admin' : m.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold ${
                            m.is_active ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}>
                            {m.is_active ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleMemberActive(m.id, m.is_active)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-['Outfit'] font-bold transition-colors cursor-pointer ${
                              m.is_active ? 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 border border-rose-800/40' : 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40'
                            }`}
                          >
                            {m.is_active ? 'Suspendre' : 'Réactiver'}
                          </button>
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
      {/* 4. BARRE DE NAVIGATION INFÉRIEURE MOBILE (Sticky Mobile Bottom Bar)        */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800/90 flex items-center justify-around z-30 px-2 font-['Outfit']">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
            activeTab === 'bookings' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-emerald-600 text-white">
              {bookings.length}
            </span>
          </div>
          <span className="text-[10px] font-bold">Planning</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
            activeTab === 'clients' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Clients</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
            activeTab === 'stats' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Bilan</span>
        </button>

        {currentMember?.role === 'super_admin' && (
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors ${
              activeTab === 'team' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-bold">Équipe</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl text-slate-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 5. MODALE D'AJOUT RÉSERVATION MANUELLE (TACTILE & RESPONSIVE)               */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0E131F] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-['Outfit'] font-bold text-white">Nouvelle commande manuelle</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setIsManualModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Nom complet du client</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Mamadou Diop"
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-white font-medium focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Téléphone WhatsApp</label>
                <input 
                  type="text" 
                  required 
                  placeholder="+221 77 123 45 67"
                  value={manualPhone} 
                  onChange={e => setManualPhone(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-white font-medium focus:outline-none focus:border-emerald-500 tabular-nums" 
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Formule / Prestation</label>
                <select 
                  value={manualService} 
                  onChange={e => setManualService(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nettoyage Canapés & Salons Kärcher">Nettoyage Canapés & Salons Kärcher</option>
                  <option value="Lavage Auto Mobile Kärcher">Lavage Auto Mobile Kärcher</option>
                  <option value="Nettoyage Fin de Chantier & Villas">Nettoyage Fin de Chantier & Villas</option>
                  <option value="Bureaux, Locaux & Syndics">Bureaux, Locaux & Syndics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Quartier à Dakar</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Almadies"
                    value={manualQuarter} 
                    onChange={e => setManualQuarter(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-white font-medium focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Montant estimé (FCFA)</label>
                  <input 
                    type="number" 
                    required 
                    value={manualPrice} 
                    onChange={e => setManualPrice(e.target.value)} 
                    className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-emerald-400 font-['Outfit'] font-extrabold focus:outline-none focus:border-emerald-500 tabular-nums" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-300 mb-1">Date & Créneau horaire souhaité</label>
                <input 
                  type="text" 
                  value={manualDate} 
                  onChange={e => setManualDate(e.target.value)} 
                  placeholder="Demain matin (09h00)"
                  className="w-full h-10 px-3 rounded-xl bg-[#070A10] border border-slate-700/80 text-white font-medium focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-11 mt-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#16A34A] hover:from-emerald-500 hover:to-emerald-400 text-white font-['Outfit'] font-bold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-950/60"
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
