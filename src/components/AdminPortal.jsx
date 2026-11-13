import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lock, Unlock, Shield, Users, Calendar, Phone, MessageSquare, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Download, LogOut, RefreshCw, X, ChevronDown, Check, UserPlus
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
  // 1: 'bookings', 2: 'clients', 3: 'stats', 4: 'team'
  const [activeTab, setActiveTab] = useState('bookings');

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
  const [manualService, setManualService] = useState('Lavage Auto Kärcher');
  const [manualDetails, setManualDetails] = useState('');
  const [manualQuarter, setManualQuarter] = useState('Almadies');
  const [manualPrice, setManualPrice] = useState('15000');
  const [manualDate, setManualDate] = useState('');

  // --- FORMULAIRE NOUVEAU MEMBRE D'ÉQUIPE (Mamadou) ---
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('operations');
  const [teamMsg, setTeamMsg] = useState('');

  // 1. Initialisation de la session Supabase
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

  // 2. Vérification et chargement du profil collaborateur
  const checkAndLoadTeamMember = async (user) => {
    try {
      // Vérifier si la table team_members est complètement vide (premier lancement)
      const { data: allMembers, error: listErr } = await supabase
        .from('taaru_team_members')
        .select('*');

      if (!listErr && allMembers && allMembers.length === 0) {
        // Premier utilisateur = SUPER ADMIN (Mamadou)
        const { data: newAdmin, error: insErr } = await supabase
          .from('taaru_team_members')
          .insert({
            user_id: user.id,
            email: user.email,
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
        const found = allMembers.find(m => m.email.toLowerCase() === user.email.toLowerCase() || m.user_id === user.id);
        if (found && found.is_active) {
          // Lier le user_id si pas encore fait
          if (!found.user_id) {
            await supabase.from('taaru_team_members').update({ user_id: user.id }).eq('id', found.id);
          }
          setCurrentMember(found);
        } else {
          // Refus strict : L'utilisateur n'est pas dans la liste blanche autorisée de TAARU SET
          await supabase.auth.signOut();
          setSession(null);
          setCurrentMember(null);
          setAuthError("⛔ Accès refusé : Votre adresse email n'est pas autorisée par la direction de TAARU SET.");
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

  // 3. Chargement de toutes les données Supabase + Realtime
  const loadAllData = async () => {
    if (!supabase) return;
    setLoadingData(true);
    try {
      // A. Réservations
      const { data: bookingsData } = await supabase
        .from('taaru_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (bookingsData) setBookings(bookingsData);

      // B. Clients CRM
      const { data: clientsData } = await supabase
        .from('taaru_clients')
        .select('*')
        .order('last_order_at', { ascending: false });
      if (clientsData) setClients(clientsData);

      // C. Membres d'équipe
      const { data: teamData } = await supabase
        .from('taaru_team_members')
        .select('*')
        .order('created_at', { ascending: true });
      if (teamData) setTeamMembers(teamData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // Abonnement Realtime Supabase
  useEffect(() => {
    if (!supabase || !session) return;

    const channel = supabase
      .channel('taaru-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_bookings' }, () => {
        loadAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_clients' }, () => {
        loadAllData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_team_members' }, () => {
        loadAllData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // --- ACTIONS AUTHENTIFICATION ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!supabase) {
      setAuthError('Connexion Supabase non disponible.');
      return;
    }

    try {
      if (isSignUpMode) {
        // VÉRIFICATION STRICTE DE LA LISTE BLANCHE (WHITELIST)
        const cleanEmail = authEmail.trim().toLowerCase();
        
        // Vérifier si la table a déjà des membres
        const { data: isWhitelisted } = await supabase.rpc('is_email_whitelisted', { 
          p_email: cleanEmail 
        });

        const { count } = await supabase
          .from('taaru_team_members')
          .select('*', { count: 'exact', head: true });

        // Si la table contient déjà des membres et que cet email n'est PAS autorisé : BLOCAGE IMMÉDIAT
        if (count && count > 0 && !isWhitelisted) {
          throw new Error(`⛔ Accès refusé : L'adresse "${cleanEmail}" n'est pas autorisée par la direction de TAARU SET. Seuls les collaborateurs invités peuvent créer un accès.`);
        }

        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: authPassword,
          options: {
            data: { full_name: fullNameInput }
          }
        });
        if (error) throw error;
        setAuthSuccessMsg('Compte activé avec succès ! Vous pouvez maintenant vous connecter.');
        setIsSignUpMode(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setCurrentMember(null);
  };

  // --- ACTIONS RÉSERVATIONS ---
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

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette réservation ?')) return;
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

  // Ajouter réservation manuelle
  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('taaru_bookings').insert({
        client_name: manualName,
        client_phone: manualPhone,
        service_type: manualService,
        service_details: manualDetails || manualService,
        quarter: manualQuarter,
        estimated_price_fcfa: parseInt(manualPrice, 10) || 0,
        intervention_date: manualDate || null,
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

  // --- ACTIONS MEMBRE D'ÉQUIPE (Mamadou) ---
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
      setTeamMsg('✅ Collaborateur autorisé avec succès ! Il peut maintenant se connecter avec cet email.');
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

  // --- EXPORT CSV CLIENTS ---
  const exportClientsCSV = () => {
    if (clients.length === 0) return;
    const headers = ['Nom Client', 'Telephone', 'Quartier', 'Nombre Commandes', 'Total Depense FCFA', 'Statut Fidelite', 'Derniere Commande'];
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
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `taaru_set_clients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrage des réservations
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter !== 'all' && b.status !== bookingFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.client_name?.toLowerCase().includes(q);
      const matchPhone = b.client_phone?.toLowerCase().includes(q);
      const matchQuarter = b.quarter?.toLowerCase().includes(q);
      const matchService = b.service_type?.toLowerCase().includes(q);
      return matchName || matchPhone || matchQuarter || matchService;
    }
    return true;
  });

  // Calcul des statistiques
  const totalRevenue = bookings
    .filter(b => b.status === 'terminee' || b.status === 'confirmee' || b.status === 'en_cours')
    .reduce((acc, b) => acc + (b.estimated_price_fcfa || 0), 0);

  const formatPrice = (p) => (p || 0).toLocaleString('fr-FR') + ' FCFA';

  // --- SI NON AUTHENTIFIÉ : ÉCRAN DE CONNEXION ---
  if (!session) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Espace Gestionnaire TAARU SET
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Portail officiel réservé à la direction et aux opérations
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {authError}
            </div>
          )}

          {authSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              {authSuccessMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUpMode && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nom complet
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Mamadou / Djiby"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Adresse Email Officielle
              </label>
              <input 
                type="email" 
                required
                placeholder="votre-email@taaruset.sn"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mot de Passe Personnel
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#16A34A] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer mt-2"
            >
              {isSignUpMode ? 'Créer mon accès officiel' : 'Se connecter en toute sécurité'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className="hover:text-emerald-400 font-medium transition-colors"
            >
              {isSignUpMode ? 'Déjà un accès ? Se connecter' : 'Première activation ? Créer son mot de passe'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SI AUTHENTIFIÉ : TABLEAU DE BORD COMPLET ---
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-4 sm:p-6 shadow-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* HEADER GESTIONNAIRE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Unlock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Espace Gestionnaire TAARU SET
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {currentMember?.role === 'super_admin' ? 'Super Admin' : (currentMember?.role || 'Équipe Active')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connecté en tant que : <strong className="text-slate-200">{session.user.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={loadAllData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BARRE D'ONGLETS OFFICIELS */}
        <div className="flex items-center gap-2 pt-3 pb-3 border-b border-slate-800 overflow-x-auto shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Réservations & Planning ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Base Clients CRM ({clients.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3. Bilan & Stats</span>
          </button>

          {/* Onglet Gestion d'Équipe (Visible pour Mamadou / Super Admin) */}
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ml-auto ${
              activeTab === 'team'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>4. Équipe & Accès ({teamMembers.length})</span>
          </button>
        </div>

        {/* CONTENU SELON L'ONGLET ACTIF */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">

          {/* ========================================================================= */}
          {/* ONGLET 1 : RÉSERVATIONS & PLANNING                                        */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <>
              {/* Barre de recherche, filtres et ajout manuel */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, téléphone, quartier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-[11px] font-semibold">
                    {['all', 'en_attente', 'confirmee', 'en_cours', 'terminee'].map((statusKey) => (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => setBookingFilter(statusKey)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          bookingFilter === statusKey ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {statusKey === 'all' && 'Tous'}
                        {statusKey === 'en_attente' && 'En attente'}
                        {statusKey === 'confirmee' && 'Confirmées'}
                        {statusKey === 'en_cours' && 'En cours'}
                        {statusKey === 'terminee' && 'Terminées'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nouvelle commande</span>
                  </button>
                </div>
              </div>

              {/* Tableau des réservations */}
              {filteredBookings.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Aucune réservation trouvée pour ce filtre.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => (
                    <div 
                      key={b.id}
                      className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 hover:border-slate-600 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-white">{b.client_name}</span>
                          <span className="text-xs text-emerald-400 font-semibold">{b.client_phone}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                            📍 {b.quarter}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-bold">
                            {formatPrice(b.estimated_price_fcfa)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          <strong>{b.service_type}</strong> — {b.service_details}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>📅 {b.intervention_date || 'Date à caler'} {b.intervention_time ? `(${b.intervention_time})` : ''}</span>
                          <span>•</span>
                          <span>Créée le : {new Date(b.created_at).toLocaleDateString('fr-FR')} à {new Date(b.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {b.source && <span className="text-[10px] text-slate-500">via {b.source}</span>}
                        </div>
                      </div>

                      {/* Actions rapides & Statut */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {/* Bouton Appeler */}
                        <a
                          href={`tel:${b.client_phone.replace(/\s+/g, '')}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Lancer l'appel téléphonique"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Appeler</span>
                        </a>

                        {/* Bouton WhatsApp */}
                        <a
                          href={`https://wa.me/${b.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, ici TAARU SET. Nous avons bien reçu votre demande pour ${b.service_type} à ${b.quarter}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#16A34A]/20 hover:bg-[#16A34A]/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title="Ouvrir la conversation WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Sélecteur de statut */}
                        <select
                          value={b.status}
                          onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none cursor-pointer ${
                            b.status === 'en_attente' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                            b.status === 'confirmee' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                            b.status === 'en_cours' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                            b.status === 'terminee' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                            'bg-slate-700 text-slate-400 border-slate-600'
                          }`}
                        >
                          <option value="en_attente">🟡 En attente</option>
                          <option value="confirmee">🔵 Confirmée</option>
                          <option value="en_cours">🟣 En cours</option>
                          <option value="terminee">🟢 Terminée</option>
                          <option value="annulee">🔴 Annulée</option>
                        </select>

                        {/* Bouton Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Supprimer la réservation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : BASE CLIENTS CRM                                               */}
          {/* ========================================================================= */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-white">Répertoire Officiel des Clients ({clients.length})</h4>
                  <p className="text-xs text-slate-400">Historique d'achat consolidé et statut fidélité calculé automatiquement</p>
                </div>

                <button
                  type="button"
                  onClick={exportClientsCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter vers Excel (CSV)</span>
                </button>
              </div>

              {clients.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Aucun client enregistré pour l'instant. Les clients s'enregistrent automatiquement dès qu'ils passent une réservation !
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3">Client</th>
                        <th className="p-3">Téléphone</th>
                        <th className="p-3">Quartier</th>
                        <th className="p-3">Commandes</th>
                        <th className="p-3">Total Dépensé</th>
                        <th className="p-3">Fidélité</th>
                        <th className="p-3">Dernière activité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{c.full_name}</td>
                          <td className="p-3 text-slate-300 font-mono">{c.phone}</td>
                          <td className="p-3 text-slate-400">{c.quarter || 'Dakar'}</td>
                          <td className="p-3 text-slate-300 font-bold">{c.total_orders}</td>
                          <td className="p-3 text-emerald-400 font-extrabold">{formatPrice(c.total_spent_fcfa)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.loyalty_status === 'Client VIP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              c.loyalty_status === 'Client Régulier' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {c.loyalty_status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('fr-FR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : BILAN & STATISTIQUES                                           */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires Encaissé / Engagé</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{formatPrice(totalRevenue)}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Cumul des prestations confirmées et terminées</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Réservations</div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-2">{bookings.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Toutes interventions confondues</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clients Uniques dans le CRM</div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-2">{clients.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Base de contacts valorisée à Dakar</p>
                </div>
              </div>

              {/* Répartition par statut */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5">
                <h4 className="font-extrabold text-sm text-white mb-3">Statut actuel du flux opérationnel</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-amber-400 font-bold">En attente</div>
                    <div className="text-xl font-black text-white mt-1">
                      {bookings.filter(b => b.status === 'en_attente').length}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-blue-400 font-bold">Confirmées</div>
                    <div className="text-xl font-black text-white mt-1">
                      {bookings.filter(b => b.status === 'confirmee').length}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-purple-400 font-bold">En cours</div>
                    <div className="text-xl font-black text-white mt-1">
                      {bookings.filter(b => b.status === 'en_cours').length}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-emerald-400 font-bold">Terminées</div>
                    <div className="text-xl font-black text-white mt-1">
                      {bookings.filter(b => b.status === 'terminee').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 4 : GESTION DE L'ÉQUIPE & ACCÈS (Mamadou)                         */}
          {/* ========================================================================= */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-white">Gestion de l'Équipe & Droits d'Accès</h4>
                  <p className="text-xs text-slate-400">
                    Mamadou (Super-Admin) peut autoriser de nouveaux collaborateurs ou retirer les accès.
                  </p>
                </div>
              </div>

              {/* Formulaire d'invitation réservé au Super Admin */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>+ Autoriser un nouveau collaborateur</span>
                </h5>

                {teamMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold">
                    {teamMsg}
                  </div>
                )}

                <form onSubmit={handleAddTeamMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nom complet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="ex: Mouhamadou / Djiby"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Adresse Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="email@collaborateur.sn"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rôle dans TAARU SET</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="operations">Co-fondateur • Opérations (Djiby)</option>
                      <option value="strategy">Co-fondateur • Stratégie (Mouhamadou)</option>
                      <option value="super_admin">Super Admin / CEO (Mamadou)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Autoriser l'accès
                    </button>
                  </div>
                </form>
              </div>

              {/* Liste des membres enregistrés */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Rôle</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {teamMembers.map(m => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{m.full_name}</td>
                        <td className="p-3 text-slate-300 font-mono">{m.email}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                            {m.role === 'super_admin' ? 'Super Admin' : m.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {m.is_active ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleMemberActive(m.id, m.is_active)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              m.is_active ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                          >
                            {m.is_active ? 'Désactiver' : 'Réactiver'}
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

        {/* MODALE D'AJOUT MANUEL D'UNE RÉSERVATION */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h4 className="font-extrabold text-sm text-white">Ajouter une commande manuelle</h4>
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
                    placeholder="ex: Mamadou Diop"
                    value={manualName} 
                    onChange={e => setManualName(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Numéro de téléphone</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="+221 77 ..."
                    value={manualPhone} 
                    onChange={e => setManualPhone(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Service</label>
                  <select 
                    value={manualService} 
                    onChange={e => setManualService(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Lavage Auto Kärcher">Lavage Auto Kärcher</option>
                    <option value="Nettoyage Canapés & Salons">Nettoyage Canapés & Salons</option>
                    <option value="Fin de Chantier & Villas">Fin de Chantier & Villas</option>
                    <option value="Bureaux & Entreprises">Bureaux & Entreprises</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quartier à Dakar</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ex: Almadies, Mermoz, Plateau"
                    value={manualQuarter} 
                    onChange={e => setManualQuarter(e.target.value)} 
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Montant estimé (FCFA)</label>
                    <input 
                      type="number" 
                      required 
                      value={manualPrice} 
                      onChange={e => setManualPrice(e.target.value)} 
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Date souhaitée</label>
                    <input 
                      type="date" 
                      value={manualDate} 
                      onChange={e => setManualDate(e.target.value)} 
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 mt-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer"
                >
                  Enregistrer dans la base de données
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

