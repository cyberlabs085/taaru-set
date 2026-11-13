import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Shield, Users, Calendar, Phone, MessageSquare, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Download, LogOut, RefreshCw, X, ArrowUpRight, 
  UserPlus, BarChart3, TrendingUp, DollarSign, MapPin, 
  Layers, ExternalLink, ChevronRight, Activity, Check,
  Briefcase, CheckSquare, Sparkles, Building2, Car, Sofa
} from 'lucide-react';

export default function AdminPortal({ onClose }) {
  // --- AUTHENTIFICATION ---
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [currentMember, setCurrentMember] = useState(null);

  // --- NAVIGATION ONGLETS ---
  // 'bookings' | 'clients' | 'stats' | 'team'
  const [activeTab, setActiveTab] = useState('bookings');

  // --- DONNÉES RÉELLES SUPABASE ---
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- FILTRES & RECHERCHE ---
  const [bookingFilter, setBookingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statsPeriod, setStatsPeriod] = useState('month'); // 'all' | 'month' | 'week'

  // --- MODALE NOUVELLE RÉSERVATION MANUELLE ---
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('Nettoyage Canapés & Salons Kärcher');
  const [manualDetails, setManualDetails] = useState('');
  const [manualQuarter, setManualQuarter] = useState('Almadies');
  const [manualPrice, setManualPrice] = useState('35000');
  const [manualDate, setManualDate] = useState('Demain matin');

  // --- FORMULAIRE NOUVEAU MEMBRE D'ÉQUIPE (Mamadou) ---
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('operations');
  const [teamMsg, setTeamMsg] = useState('');

  // 1. Initialisation Session Supabase
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

  // 2. Vérification profil équipe
  const checkAndLoadTeamMember = async (user) => {
    try {
      const { data: allMembers, error: listErr } = await supabase
        .from('taaru_team_members')
        .select('*');

      if (!listErr && allMembers && allMembers.length === 0) {
        // Premier utilisateur = SUPER ADMIN (Mamadou / Administrateur)
        const { data: newAdmin, error: insErr } = await supabase
          .from('taaru_team_members')
          .insert({
            user_id: user.id,
            email: user.email.toLowerCase(),
            full_name: user.user_metadata?.full_name || 'Mamadou - CEO',
            role: 'super_admin',
            is_active: true
          })
          .select()
          .single();

        if (!insErr && newAdmin) {
          setCurrentMember(newAdmin);
        }
      } else if (allMembers && allMembers.length > 0) {
        const found = allMembers.find(
          m => m.email.toLowerCase() === user.email.toLowerCase() || m.user_id === user.id
        );

        if (found && found.is_active) {
          if (!found.user_id) {
            await supabase.from('taaru_team_members').update({ user_id: user.id }).eq('id', found.id);
          }
          setCurrentMember(found);
        } else {
          // Bloquer l'accès pour tout email non whitelisté
          await supabase.auth.signOut();
          setSession(null);
          setCurrentMember(null);
          setAuthError("Accès restreint : cette adresse n'a pas été autorisée par la direction de TAARU SET.");
          setAuthLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
      loadAllData();
    }
  };

  // 3. Chargement des données
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

  // Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!supabase) {
      setAuthError('Connexion au serveur indisponible.');
      return;
    }

    const cleanEmail = authEmail.trim().toLowerCase();

    try {
      if (isSignUpMode) {
        // Vérification de la liste blanche
        const { data: isWhitelisted } = await supabase.rpc('is_email_whitelisted', { 
          p_email: cleanEmail 
        });

        const { count } = await supabase
          .from('taaru_team_members')
          .select('*', { count: 'exact', head: true });

        if (count && count > 0 && !isWhitelisted) {
          throw new Error(`Accès refusé : l'adresse "${cleanEmail}" n'est pas autorisée. Veuillez contacter la direction.`);
        }

        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: authPassword,
          options: {
            data: { full_name: fullNameInput }
          }
        });
        if (error) throw error;
        setAuthSuccessMsg('Accès activé. Vous pouvez désormais vous connecter.');
        setIsSignUpMode(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message || 'Identifiants invalides ou compte non configuré.');
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
    if (!confirm('Confirmer la suppression de cette réservation du registre ?')) return;
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

  // Gestion Équipe (Mamadou)
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
      setTeamMsg('Collaborateur autorisé. Il peut désormais activer son mot de passe.');
      setNewMemberEmail('');
      setNewMemberName('');
      loadAllData();
    } catch (err) {
      setTeamMsg(`Erreur : ${err.message || 'Impossible d\'ajouter ce membre.'}`);
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

  // Export CSV
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

  // Analytics & Bilan
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedOrDone = bookings.filter(b => b.status === 'terminee' || b.status === 'confirmee' || b.status === 'en_cours');
    const totalRevenue = confirmedOrDone.reduce((acc, b) => acc + (b.estimated_price_fcfa || 0), 0);
    const avgBasket = confirmedOrDone.length > 0 ? Math.round(totalRevenue / confirmedOrDone.length) : 0;

    // Répartition par service
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

    // Top Quartiers à Dakar
    const quarterMap = {};
    bookings.forEach(b => {
      const q = b.quarter || 'Dakar Centre';
      quarterMap[q] = (quarterMap[q] || 0) + 1;
    });

    const topQuarters = Object.entries(quarterMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Funnel d'états
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

  // --- ÉCRAN DE CONNEXION ÉPURÉ (ANTI-SLOP) ---
  if (!session) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090D16] flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-slate-800 bg-[#0E131F] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                TS
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 tracking-tight">TAARU SET</h1>
                <p className="text-[11px] text-slate-400 font-mono">Espace Gestionnaire</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Retour au site"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs leading-relaxed">
              {authError}
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs leading-relaxed">
              {authSuccessMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {isSignUpMode && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nom & Prénom
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Mamadou"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#090D16] border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Adresse email
              </label>
              <input 
                type="email" 
                required
                placeholder="direction@taaruset.sn"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#090D16] border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Mot de passe
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#090D16] border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer mt-2"
            >
              {isSignUpMode ? 'Activer mon accès officiel' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isSignUpMode ? 'Déjà configuré ? Se connecter' : 'Première activation ? Créer son mot de passe'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PORTAIL PLEIN ÉCRAN DÉDIÉ (DESIGN STANDARDS LINEAR / STRIPE) ---
  return (
    <div className="fixed inset-0 z-50 bg-[#090D16] text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* 1. SIDEBAR DE NAVIGATION GAUCHE */}
      <aside className="w-full md:w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col shrink-0">
        
        {/* Identité Entreprise */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              TS
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">TAARU SET</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Back-Office v2.0</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live
          </span>
        </div>

        {/* Profil Utilisateur Actif */}
        <div className="p-3 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Session active</div>
          <div className="text-xs font-bold text-slate-200 truncate mt-0.5">{session.user.email}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
              {currentMember?.role === 'super_admin' ? 'Super Admin' : (currentMember?.role || 'Opérateur')}
            </span>
            <span className="text-[10px] text-slate-500">• Dakar, SN</span>
          </div>
        </div>

        {/* Navigation Onglets */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`w-full h-9 px-3 rounded-lg font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-slate-800 text-white border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Réservations</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`w-full h-9 px-3 rounded-lg font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-slate-800 text-white border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Répertoire Clients</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`w-full h-9 px-3 rounded-lg font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-slate-800 text-white border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Statistiques & Bilan</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`w-full h-9 px-3 rounded-lg font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              activeTab === 'team'
                ? 'bg-slate-800 text-white border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Équipe & Droits</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
              {teamMembers.length}
            </span>
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-8 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 flex items-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Voir le site public</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full h-8 px-2.5 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 flex items-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 2. ESPACE DE TRAVAIL PRINCIPAL */}
      <main className="flex-1 flex flex-col bg-[#090D16] overflow-hidden">
        
        {/* Topbar Header */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0B0F19]/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {activeTab === 'bookings' && 'Planning des Réservations'}
              {activeTab === 'clients' && 'Base de Données Clients (CRM)'}
              {activeTab === 'stats' && 'Tableau de Bord Décisionnel'}
              {activeTab === 'team' && 'Collaborateurs & Droits d\'Accès'}
            </h2>
            {loadingData && (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'bookings' && (
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle intervention</span>
              </button>
            )}

            {activeTab === 'clients' && (
              <button
                type="button"
                onClick={exportClientsCSV}
                className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAllData}
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Corps des onglets */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* ONGLET 1 : RÉSERVATIONS & PLANNING                                        */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Barre de contrôle : Recherche et Filtres */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Filtrer par nom, téléphone, quartier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#0E131F] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 border border-slate-800/80 bg-[#0E131F] p-0.5 rounded-lg text-xs">
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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        bookingFilter === tab.id
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table des réservations */}
              <div className="border border-slate-800/80 rounded-xl bg-[#0B0F19] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0E131F] text-slate-400 text-[10px] font-mono uppercase tracking-wider border-b border-slate-800/80">
                      <tr>
                        <th className="py-2.5 px-3.5 font-semibold">Client</th>
                        <th className="py-2.5 px-3.5 font-semibold">Service</th>
                        <th className="py-2.5 px-3.5 font-semibold">Quartier & Date</th>
                        <th className="py-2.5 px-3.5 font-semibold">Montant</th>
                        <th className="py-2.5 px-3.5 font-semibold">Statut</th>
                        <th className="py-2.5 px-3.5 text-right font-semibold">Actions directes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                            Aucune réservation ne correspond aux critères sélectionnés.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/25 transition-colors">
                            {/* Client */}
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-white text-xs">{b.client_name}</div>
                              <div className="font-mono text-[11px] text-slate-400">{b.client_phone}</div>
                            </td>

                            {/* Service */}
                            <td className="py-3 px-3.5 max-w-xs">
                              <div className="font-semibold text-slate-200 text-xs">{b.service_type}</div>
                              <div className="text-[11px] text-slate-400 truncate">{b.service_details}</div>
                            </td>

                            {/* Quartier & Date */}
                            <td className="py-3 px-3.5">
                              <div className="text-slate-300 font-medium text-xs">{b.quarter}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {b.intervention_date || 'Date à fixer'} {b.intervention_time ? `• ${b.intervention_time}` : ''}
                              </div>
                            </td>

                            {/* Montant */}
                            <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 text-xs">
                              {formatPrice(b.estimated_price_fcfa)}
                            </td>

                            {/* Statut sélecteur */}
                            <td className="py-3 px-3.5">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${
                                  b.status === 'en_attente' ? 'bg-amber-950/40 text-amber-300 border-amber-800/50' :
                                  b.status === 'confirmee' ? 'bg-blue-950/40 text-blue-300 border-blue-800/50' :
                                  b.status === 'en_cours' ? 'bg-purple-950/40 text-purple-300 border-purple-800/50' :
                                  b.status === 'terminee' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' :
                                  'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                <option value="en_attente">En attente</option>
                                <option value="confirmee">Confirmée</option>
                                <option value="en_cours">En cours</option>
                                <option value="terminee">Terminée</option>
                                <option value="annulee">Annulée</option>
                              </select>
                            </td>

                            {/* Actions rapides */}
                            <td className="py-3 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`tel:${b.client_phone.replace(/\s+/g, '')}`}
                                  className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Appeler directement"
                                >
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <span>Appel</span>
                                </a>

                                <a
                                  href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-7 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Ouvrir WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="h-7 w-7 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Supprimer la réservation"
                                >
                                  <Trash2 className="w-3 h-3" />
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
              <div className="border border-slate-800/80 rounded-xl bg-[#0B0F19] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131F] text-slate-400 text-[10px] font-mono uppercase tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-2.5 px-3.5">Client</th>
                      <th className="py-2.5 px-3.5">Téléphone</th>
                      <th className="py-2.5 px-3.5">Quartier</th>
                      <th className="py-2.5 px-3.5">Commandes</th>
                      <th className="py-2.5 px-3.5">Total Dépensé</th>
                      <th className="py-2.5 px-3.5">Statut Fidélité</th>
                      <th className="py-2.5 px-3.5">Dernière commande</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                          Aucun client répertorié. Les clients s'enregistrent automatiquement dès qu'ils valident une réservation sur le site.
                        </td>
                      </tr>
                    ) : (
                      clients.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/25 transition-colors">
                          <td className="py-3 px-3.5 font-bold text-white text-xs">{c.full_name}</td>
                          <td className="py-3 px-3.5 font-mono text-slate-300 text-xs">{c.phone}</td>
                          <td className="py-3 px-3.5 text-slate-400 text-xs">{c.quarter || 'Dakar'}</td>
                          <td className="py-3 px-3.5 font-mono text-slate-300 font-bold">{c.total_orders}</td>
                          <td className="py-3 px-3.5 font-mono font-extrabold text-emerald-400 text-xs">
                            {formatPrice(c.total_spent_fcfa)}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.loyalty_status === 'Client VIP' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50' :
                              c.loyalty_status === 'Client Régulier' ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {c.loyalty_status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px]">
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
            <div className="space-y-6">
              
              {/* Cartes KPI Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Chiffre d'Affaires Réalisé</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatPrice(stats.totalRevenue)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Prestations engagées ou finalisées</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Total Interventions</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">{stats.totalBookings}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Sur l'ensemble des services</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Panier Moyen</div>
                  <div className="text-xl font-bold font-mono text-blue-400 mt-1">{formatPrice(stats.avgBasket)}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Moyenne par client à Dakar</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Base Clients Unique</div>
                  <div className="text-xl font-bold font-mono text-purple-400 mt-1">{clients.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Contacts qualifiés répertoriés</div>
                </div>
              </div>

              {/* Grille Analytique Double Colonne */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Répartition du Chiffre d'Affaires par Métier */}
                <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Volume par prestation</h4>
                      <p className="text-[11px] text-slate-400">Part de chiffre d'affaires générée par service</p>
                    </div>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="space-y-3 pt-2">
                    {stats.serviceDistribution.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        Données en cours de synchronisation.
                      </div>
                    ) : (
                      stats.serviceDistribution.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            <span className="font-mono text-slate-400">{formatPrice(item.amount)} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(item.percentage, 4)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Top Quartiers Stratégiques à Dakar */}
                <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Concentration géographique</h4>
                      <p className="text-[11px] text-slate-400">Zones les plus demandeuses pour orienter vos campagnes</p>
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
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E131F] border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-800 font-mono text-[10px] text-slate-400 flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{q.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {q.count} intervention{q.count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Pipeline des Interventions (Entonnoir d'état) */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">État du flux opérationnel</h4>
                    <p className="text-[11px] text-slate-400">Suivi en direct de l'exécution terrain</p>
                  </div>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-mono text-amber-400 uppercase">En attente</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{stats.statusCounts.en_attente}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-mono text-blue-400 uppercase">Confirmées</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{stats.statusCounts.confirmee}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-mono text-purple-400 uppercase">En cours</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{stats.statusCounts.en_cours}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-mono text-emerald-400 uppercase">Terminées</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">{stats.statusCounts.terminee}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-800 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Annulées</div>
                    <div className="text-xl font-bold font-mono text-slate-400 mt-1">{stats.statusCounts.annulee}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 4 : GESTION ÉQUIPE & DROITS                                        */}
          {/* ========================================================================= */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              
              {/* Formulaire d'invitation réservé au Super Admin */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 space-y-4">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">Autoriser un collaborateur</h4>
                  <p className="text-[11px] text-slate-400">
                    Seuls les emails enregistrés ici peuvent activer leur accès au tableau de bord.
                  </p>
                </div>

                {teamMsg && (
                  <div className="p-3 rounded-lg bg-[#0E131F] border border-slate-700 text-xs text-emerald-300 font-mono">
                    {teamMsg}
                  </div>
                )}

                <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nom complet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Mouhamadou / Djiby"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Adresse email officielle</label>
                    <input 
                      type="email" 
                      required
                      placeholder="nom@collaborateur.sn"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Attribution du rôle</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0E131F] border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="operations">Co-fondateur • Opérations (Djiby)</option>
                      <option value="strategy">Co-fondateur • Stratégie (Mouhamadou)</option>
                      <option value="super_admin">Super-Admin / Direction (Mamadou)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Autoriser l'accès
                    </button>
                  </div>
                </form>
              </div>

              {/* Table des collaborateurs */}
              <div className="border border-slate-800/80 rounded-xl bg-[#0B0F19] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0E131F] text-slate-400 text-[10px] font-mono uppercase tracking-wider border-b border-slate-800/80">
                    <tr>
                      <th className="py-2.5 px-3.5">Nom</th>
                      <th className="py-2.5 px-3.5">Email</th>
                      <th className="py-2.5 px-3.5">Rôle</th>
                      <th className="py-2.5 px-3.5">Statut</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {teamMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/25 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-white">{m.full_name}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-300">{m.email}</td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {m.role === 'super_admin' ? 'Super Admin' : m.role}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.is_active ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          }`}>
                            {m.is_active ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleMemberActive(m.id, m.is_active)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
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

      {/* MODALE D'AJOUT RÉSERVATION MANUELLE (ÉPURÉE) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0E131F] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Nouvelle commande manuelle</h4>
              <button type="button" onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nom du client</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Mamadou Diop"
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)} 
                  className="w-full h-8 px-2.5 rounded bg-[#090D16] border border-slate-700 text-white" 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Téléphone WhatsApp</label>
                <input 
                  type="text" 
                  required 
                  placeholder="+221 77 ..."
                  value={manualPhone} 
                  onChange={e => setManualPhone(e.target.value)} 
                  className="w-full h-8 px-2.5 rounded bg-[#090D16] border border-slate-700 text-white font-mono" 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service</label>
                <select 
                  value={manualService} 
                  onChange={e => setManualService(e.target.value)} 
                  className="w-full h-8 px-2 rounded bg-[#090D16] border border-slate-700 text-white"
                >
                  <option value="Nettoyage Canapés & Salons Kärcher">Nettoyage Canapés & Salons Kärcher</option>
                  <option value="Lavage Auto Mobile Kärcher">Lavage Auto Mobile Kärcher</option>
                  <option value="Nettoyage Fin de Chantier & Villas">Nettoyage Fin de Chantier & Villas</option>
                  <option value="Bureaux, Locaux & Syndics">Bureaux, Locaux & Syndics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Quartier</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Almadies"
                    value={manualQuarter} 
                    onChange={e => setManualQuarter(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded bg-[#090D16] border border-slate-700 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Montant (FCFA)</label>
                  <input 
                    type="number" 
                    required 
                    value={manualPrice} 
                    onChange={e => setManualPrice(e.target.value)} 
                    className="w-full h-8 px-2.5 rounded bg-[#090D16] border border-slate-700 text-white font-mono font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Date & Créneau</label>
                <input 
                  type="text" 
                  value={manualDate} 
                  onChange={e => setManualDate(e.target.value)} 
                  className="w-full h-8 px-2.5 rounded bg-[#090D16] border border-slate-700 text-white" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-9 mt-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
              >
                Enregistrer dans la base de données
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
