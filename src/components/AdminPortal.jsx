import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import logoOfficialSq from '../assets/logo_official_sq.jpg';
import { 
  Shield, Users, Calendar, Phone, MessageSquare, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertCircle, 
  Trash2, Download, LogOut, RefreshCw, X, ArrowUpRight, 
  UserPlus, BarChart3, TrendingUp, DollarSign, MapPin, 
  Layers, ExternalLink, Activity, Check, Lock, KeyRound,
  Menu, ChevronRight, Building2, Car, Briefcase, 
  UserCheck, UserX, ChevronDown, CheckCircle, ShieldCheck, 
  Eye, EyeOff, Copy, FileText, Info, Repeat, CalendarCheck,
  CheckCircle as CheckIcon, Circle, UserCog, Mail, FileSpreadsheet, Star
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
  // 'bookings' | 'subscriptions' | 'clients' | 'stats' | 'team'
  const [activeTab, setActiveTab] = useState('bookings');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- DONNÉES RÉELLES SUPABASE ---
  const [bookings, setBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- FILTRES & RECHERCHE ---
  const [bookingFilter, setBookingFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- COPIE 1-CLIC TÉLÉPHONE AVEC RETOUR VISUEL ---
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyPhone = (phone, id) => {
    if (!phone) return;
    const clean = phone.trim();
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // --- MODALE DÉTAILS COMPLETS DE COMMANDE ---
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  // --- MODALE NOUVELLE RÉSERVATION MANUELLE ---
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualService, setManualService] = useState('Nettoyage Canapés & Salons Kärcher');
  const [manualDetails, setManualDetails] = useState('');
  const [manualQuarter, setManualQuarter] = useState('Almadies');
  const [manualPrice, setManualPrice] = useState('35000');
  const [manualDate, setManualDate] = useState('Demain matin');

  // --- MODALE NOUVEL ABONNEMENT (4 PASSAGES) ---
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [subClientName, setSubClientName] = useState('');
  const [subClientPhone, setSubClientPhone] = useState('');
  const [subPlanName, setSubPlanName] = useState('Pack Auto Mensuel Sérénité (4 passages / mois)');
  const [subServiceType, setSubServiceType] = useState('Lavage Auto Mobile à Domicile');
  const [subPrice, setSubPrice] = useState('30000');
  const [subQuarter, setSubQuarter] = useState('Almadies');
  const [subAddress, setSubAddress] = useState('');
  const [subFrequency, setSubFrequency] = useState('1 passage / semaine (Samedi)');
  const [subP1Date, setSubP1Date] = useState('');
  const [subP2Date, setSubP2Date] = useState('');
  const [subP3Date, setSubP3Date] = useState('');
  const [subP4Date, setSubP4Date] = useState('');
  const [subNotes, setSubNotes] = useState('');

  // --- GÉNÉRATEUR CRYPTOGRAPHIQUE HAUTE SÉCURITÉ ---
  const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums = '23456789';
    const symbols = '!@#$%^&*()_+';
    let res = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      nums[Math.floor(Math.random() * nums.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    const all = upper + lower + nums + symbols;
    for (let i = 0; i < 8; i++) {
      res.push(all[Math.floor(Math.random() * all.length)]);
    }
    return res.sort(() => Math.random() - 0.5).join('');
  };

  // --- FORMULAIRE D'AJOUT COLLABORATEUR (Super Admin) ---
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [provisionMode, setProvisionMode] = useState('manual'); // 'manual' (Recommandé & 100% Immédiat via WhatsApp) | 'invite'
  const [newMemberPassword, setNewMemberPassword] = useState(() => generateStrongPassword());
  const [showNewMemberPassword, setShowNewMemberPassword] = useState(false);
  const [newMemberJobTitle, setNewMemberJobTitle] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('agent');
  const [teamMsg, setTeamMsg] = useState('');
  const [createdMemberSuccess, setCreatedMemberSuccess] = useState(null);
  const [editingPasswordMember, setEditingPasswordMember] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordResetSuccessMsg, setPasswordResetSuccessMsg] = useState('');

  // --- CHANGEMENT DE MOT DE PASSE AUTONOME (Mon Profil Connecté) ---
  const [isSelfPasswordModalOpen, setIsSelfPasswordModalOpen] = useState(false);
  const [selfNewPassword, setSelfNewPassword] = useState('');
  const [selfNewPasswordConfirm, setSelfNewPasswordConfirm] = useState('');
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const [selfPasswordMsg, setSelfPasswordMsg] = useState('');
  const [selfPasswordError, setSelfPasswordError] = useState('');
  const [selfPasswordLoading, setSelfPasswordLoading] = useState(false);

  // --- RÉCUPÉRATION / DÉFINITION PERSONNELLE DE MOT DE PASSE (PASSWORD RECOVERY) ---
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('');
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // --- PERMISSIONS DÉRIVÉES DU RÔLE DE L'UTILISATEUR CONNECTÉ ---
  const userRole = currentMember?.role || 'agent';
  const isSuperAdmin = userRole === 'super_admin';
  const canManageTeam = isSuperAdmin;
  const canViewStats = isSuperAdmin || userRole === 'admin';
  const canViewCRM = isSuperAdmin || userRole === 'admin' || userRole === 'sales';
  const canDeleteBookings = isSuperAdmin || userRole === 'admin';

  // --- AVIS & NOTATIONS CLIENTS VÉRIFIÉS (Demandé par Mamadou) ---
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsFilter, setReviewsFilter] = useState('all'); // 'all' | 'approved' | 'pending'
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [copiedReviewLink, setCopiedReviewLink] = useState(false);

  // Sécurité navigation
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

    // Détection immédiate si l'utilisateur arrive via un lien de réinitialisation/invitation
    if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAndLoadTeamMember(session.user);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
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

  // 2. VÉRIFICATION STRICTE ZERO-TRUST
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

  // 3. Chargement des données réelles
  const loadAllData = async () => {
    if (!supabase) return;
    setLoadingData(true);
    try {
      const [bookingsRes, clientsRes, teamRes, subsRes, reviewsRes] = await Promise.all([
        supabase.from('taaru_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('taaru_clients').select('*').order('last_order_at', { ascending: false }),
        supabase.from('taaru_team_members').select('*').order('created_at', { ascending: true }),
        supabase.from('taaru_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('taaru_reviews').select('*').order('created_at', { ascending: false })
      ]);

      let currentSubs = subsRes.data || [];
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
      if (reviewsRes && reviewsRes.data) setReviewsList(reviewsRes.data);

      // Auto-réconciliation des réservations de formules abonnements vers taaru_subscriptions
      if (bookingsRes.data) {
        const missing = bookingsRes.data.filter(b => {
          const txt = `${b.service_type || ''} ${b.service_details || ''}`.toLowerCase();
          const isSub = txt.includes('abonnement') || txt.includes('pack mensuel') || txt.includes('4 lavages');
          if (!isSub) return false;
          const bP = b.client_phone ? b.client_phone.replace(/[^0-9]/g, '') : '';
          const bN = b.client_name ? b.client_name.trim().toLowerCase() : '';
          return !currentSubs.some(s => {
            const sP = s.client_phone ? s.client_phone.replace(/[^0-9]/g, '') : '';
            const sN = s.client_name ? s.client_name.trim().toLowerCase() : '';
            return (bP && sP && bP === sP) || (bN && sN && (bN.includes(sN) || sN.includes(bN)));
          });
        });

        if (missing.length > 0) {
          for (const b of missing) {
            let p1 = 'P1: À caler';
            let p2 = 'P2: À caler';
            let p3 = 'P3: À caler';
            let p4 = 'P4: À caler';
            const matchDates = b.service_details?.match(/Dates:\s*([^\]]+)/i);
            if (matchDates && matchDates[1]) {
              const parts = matchDates[1].split(',').map(s => s.trim());
              if (parts[0]) p1 = parts[0];
              if (parts[1]) p2 = parts[1];
              if (parts[2]) p3 = parts[2];
              if (parts[3]) p4 = parts[3];
            }

            const { data: newSub } = await supabase.from('taaru_subscriptions').insert({
              client_name: b.client_name || 'Client Dakar',
              client_phone: b.client_phone || 'Non précisé',
              service_type: b.service_type || 'Abonnement',
              plan_name: b.service_details ? b.service_details.split(' - ')[0] : 'Pack Mensuel Sérénité',
              price_fcfa: b.estimated_price_fcfa || 30000,
              quarter: b.quarter || 'Dakar',
              frequency: '4 passages par mois',
              preferred_day: 'À convenir',
              passage_1_date: p1,
              passage_1_status: 'a_venir',
              passage_2_date: p2,
              passage_2_status: 'a_venir',
              passage_3_date: p3,
              passage_3_status: 'a_venir',
              passage_4_date: p4,
              passage_4_status: 'a_venir',
              status: 'actif',
              notes: b.service_details || 'Créé depuis la réservation client'
            }).select().single();

            if (newSub) {
              currentSubs = [newSub, ...currentSubs];
            }
          }
        }
      }

      setSubscriptions(currentSubs);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_subscriptions' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'taaru_reviews' }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Fermeture universelle des modales avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedBookingDetails(null);
        setIsNewBookingModalOpen(false);
        setIsSelfPasswordModalOpen(false);
        setEditingPasswordMember(null);
        setDeleteConfirmBooking(null);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // URL de redirection officielle pour l'authentification et les emails (évite tout localhost)
  const getAuthRedirectUrl = () => {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      return `${window.location.origin}/?admin`;
    }
    return 'https://www.taaruset.com/?admin';
  };

  // Connexion sécurisée
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
          redirectTo: getAuthRedirectUrl()
        });
        if (error) throw error;
        setAuthSuccessMsg(`✓ Un lien officiel et sécurisé a été expédié à "${cleanEmail}". Ouvrez votre boîte de réception et cliquez sur le lien pour définir votre mot de passe confidentiel.`);
        setIsResetMode(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: authPassword
      });

      if (error) {
        setFailedAttempts(prev => {
          const next = prev + 1;
          if (next >= 4) setLockoutTimer(60);
          return next;
        });
        setAuthError(`Échec d'authentification : ${error.message === 'Invalid login credentials' ? 'Mot de passe incorrect ou compte non activé.' : error.message}`);
        return;
      }

      setFailedAttempts(0);
      setSession(data.session);
      checkAndLoadTeamMember(data.session.user);
    } catch (err) {
      setAuthError(err.message || 'Erreur inattendue de connexion.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setCurrentMember(null);
  };

  // Définition du mot de passe personnel suite au clic sur le lien d'invitation/récupération
  const handleUpdateRecoveryPassword = async (e) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (recoveryPassword.length < 8) {
      setRecoveryError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: recoveryPassword
      });
      if (error) throw error;

      if (session?.user?.email) {
        await supabase.rpc('admin_reset_member_password', {
          p_email: session.user.email,
          p_new_password: recoveryPassword
        });
      }

      setRecoverySuccess('✓ Votre mot de passe personnel a été enregistré avec succès ! Connexion à votre espace en cours...');
      setTimeout(() => {
        setIsRecoveryMode(false);
        window.location.hash = '';
      }, 1500);
    } catch (err) {
      setRecoveryError(err.message || 'Erreur lors de l\'enregistrement du mot de passe.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Modification autonome de mot de passe par le collaborateur connecté
  const handleUpdateSelfPassword = async (e) => {
    e.preventDefault();
    setSelfPasswordError('');
    setSelfPasswordMsg('');

    if (selfNewPassword.length < 8) {
      setSelfPasswordError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (selfNewPassword !== selfNewPasswordConfirm) {
      setSelfPasswordError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    setSelfPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: selfNewPassword
      });
      if (error) throw error;

      if (session?.user?.email) {
        await supabase.rpc('admin_reset_member_password', {
          p_email: session.user.email,
          p_new_password: selfNewPassword
        });
      }

      setSelfPasswordMsg('✓ Votre mot de passe a été mis à jour avec succès !');
      setTimeout(() => {
        setIsSelfPasswordModalOpen(false);
        setSelfNewPassword('');
        setSelfNewPasswordConfirm('');
        setSelfPasswordMsg('');
      }, 1500);
    } catch (err) {
      setSelfPasswordError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setSelfPasswordLoading(false);
    }
  };

  // Envoi d'une invitation par email pour définir son mot de passe en privé
  const handleSendResetEmail = async (email) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getAuthRedirectUrl()
      });
      if (error) throw error;
      setPasswordResetSuccessMsg(`✓ Un lien officiel et confidentiel a été expédié à "${email}". Le collaborateur peut cliquer dessus pour définir son mot de passe personnel.`);
      setEditingPasswordMember(null);
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    }
  };

  // ---------------------------------------------------------------------------
  // LOGIQUE AUDITÉE & CORRIGÉE : STATUT & PRISE EN CHARGE
  // ---------------------------------------------------------------------------

  // 1. Modification du statut :
  // - Si la commande a déjà été prise en charge par quelqu'un, ON PRÉSERVE l'opérateur d'origine !
  // - Si elle n'a jamais été prise en charge et qu'on la valide, on l'attribue à l'opérateur courant.
  const handleUpdateStatus = async (bookingId, newStatus) => {
    const target = bookings.find(b => b.id === bookingId);

    // Verrouillage irrévocable : si la commande est déjà terminée, interdiction formelle de modifier son statut (même pour Super-Admin)
    if (target?.status === 'terminee') {
      alert("Cette intervention est définitivement terminée et archivée. Son statut est verrouillé de manière irrévocable.");
      return;
    }

    // Confirmation explicite obligatoire avant de clôturer une commande
    if (newStatus === 'terminee') {
      const confirmed = window.confirm(
        "Êtes-vous certain de vouloir marquer cette intervention comme TERMINÉE ?\n\nATTENTION : Une fois marquée comme terminée, la commande sera DÉFINITIVEMENT clôturée, verrouillée et archivée. Il sera impossible de revenir en arrière ou de modifier son statut."
      );
      if (!confirmed) return;
    }

    const now = new Date().toISOString();
    const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Opérateur TAARU SET';
    const updaterEmail = session?.user?.email || '';
    const operatorName = target?.processed_by_name || (newStatus !== 'en_attente' ? updaterName : null);
    const operatorEmail = target?.processed_by_email || (newStatus !== 'en_attente' ? updaterEmail : null);
    const operatorAt = target?.processed_at || (newStatus !== 'en_attente' ? now : null);

    // Mise à jour optimiste immédiate (0ms)
    setBookings(prev => prev.map(b => b.id === bookingId ? { 
      ...b, 
      status: newStatus,
      updated_at: now,
      processed_by_name: operatorName,
      processed_by_email: operatorEmail,
      processed_at: operatorAt
    } : b));

    if (selectedBookingDetails?.id === bookingId) {
      setSelectedBookingDetails(prev => ({
        ...prev,
        status: newStatus,
        updated_at: now,
        processed_by_name: operatorName,
        processed_by_email: operatorEmail,
        processed_at: operatorAt
      }));
    }

    if (!supabase) return;
    try {
      await supabase
        .from('taaru_bookings')
        .update({ 
          status: newStatus, 
          updated_at: now,
          processed_by_name: operatorName,
          processed_by_email: operatorEmail,
          processed_at: operatorAt
        })
        .eq('id', bookingId);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Prendre en charge :
  // STRICTEMENT RÉSERVÉ aux commandes en statut 'en_attente' sans opérateur.
  // Fait passer instantanément le statut à 'confirmee', estampille l'opérateur et fait disparaître le bouton.
  const handleTakeOverBooking = async (bookingId) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    // Règle logique stricte : si la commande n'est plus en attente OU si déjà prise en charge
    if (target.status !== 'en_attente' || target.processed_by_name) {
      alert("Cette commande a déjà été acceptée ou prise en charge par un collaborateur.");
      return;
    }

    const now = new Date().toISOString();
    const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Opérateur TAARU SET';
    const updaterEmail = session?.user?.email || '';
    const nextStatus = 'confirmee'; // Dès qu'on prend en charge, la commande est acceptée et confirmée

    // Mise à jour optimiste (0ms)
    setBookings(prev => prev.map(b => b.id === bookingId ? {
      ...b,
      status: nextStatus,
      updated_at: now,
      processed_by_name: updaterName,
      processed_by_email: updaterEmail,
      processed_at: now
    } : b));

    if (selectedBookingDetails?.id === bookingId) {
      setSelectedBookingDetails(prev => ({
        ...prev,
        status: nextStatus,
        updated_at: now,
        processed_by_name: updaterName,
        processed_by_email: updaterEmail,
        processed_at: now
      }));
    }

    if (!supabase) return;
    try {
      await supabase
        .from('taaru_bookings')
        .update({
          status: nextStatus,
          updated_at: now,
          processed_by_name: updaterName,
          processed_by_email: updaterEmail,
          processed_at: now
        })
        .eq('id', bookingId);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Réassignation d'opérateur (Super Admin / Admin uniquement)
  const handleReassignBooking = async (bookingId, newOperatorName, newOperatorEmail) => {
    if (!canViewStats) return;
    const now = new Date().toISOString();

    setBookings(prev => prev.map(b => b.id === bookingId ? {
      ...b,
      processed_by_name: newOperatorName,
      processed_by_email: newOperatorEmail,
      processed_at: now
    } : b));

    if (selectedBookingDetails?.id === bookingId) {
      setSelectedBookingDetails(prev => ({
        ...prev,
        processed_by_name: newOperatorName,
        processed_by_email: newOperatorEmail,
        processed_at: now
      }));
    }

    if (!supabase) return;
    try {
      await supabase.from('taaru_bookings').update({
        processed_by_name: newOperatorName,
        processed_by_email: newOperatorEmail,
        processed_at: now
      }).eq('id', bookingId);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Suppression réservation
  const handleDeleteBooking = async (bookingId) => {
    if (!canDeleteBookings) {
      alert("Seuls les Super Administrateurs et Responsables d'Opérations peuvent supprimer une réservation.");
      return;
    }
    if (!confirm('Confirmer la suppression définitive de cette réservation du registre officiel TAARU SET ?')) return;
    
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    if (selectedBookingDetails?.id === bookingId) setSelectedBookingDetails(null);

    if (!supabase) return;
    try {
      await supabase.from('taaru_bookings').delete().eq('id', bookingId);
    } catch (e) {
      console.error(e);
    }
  };

  // --- AVIS CLIENTS VÉRIFIÉS : STATISTIQUES & ACTIONS (Demandé par Mamadou) ---
  const reviewsStats = useMemo(() => {
    if (!reviewsList || reviewsList.length === 0) {
      return { total: 0, avg: '5.0', count5: 0, count4: 0, count3: 0, countLow: 0, recommendRate: 100, approvedCount: 0 };
    }
    const total = reviewsList.length;
    const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = (sum / total).toFixed(1);
    const count5 = reviewsList.filter(r => Number(r.rating) === 5).length;
    const count4 = reviewsList.filter(r => Number(r.rating) === 4).length;
    const count3 = reviewsList.filter(r => Number(r.rating) === 3).length;
    const countLow = reviewsList.filter(r => Number(r.rating) < 3).length;
    const recommends = reviewsList.filter(r => r.recommend !== false).length;
    const recommendRate = Math.round((recommends / total) * 100);
    const approvedCount = reviewsList.filter(r => r.status === 'approved').length;
    return { total, avg, count5, count4, count3, countLow, recommendRate, approvedCount };
  }, [reviewsList]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter(r => {
      if (reviewsFilter === 'approved' && r.status !== 'approved') return false;
      if (reviewsFilter === 'pending' && r.status === 'approved') return false;
      if (reviewsSearch) {
        const q = reviewsSearch.toLowerCase();
        const name = (r.client_name || '').toLowerCase();
        const service = (r.service_type || '').toLowerCase();
        const quarter = (r.quarter || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        if (!name.includes(q) && !service.includes(q) && !quarter.includes(q) && !comment.includes(q)) return false;
      }
      return true;
    });
  }, [reviewsList, reviewsFilter, reviewsSearch]);

  const getReviewWhatsAppUrl = (booking) => {
    if (!booking?.client_phone) return '#';
    let cleanPhone = booking.client_phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('221') && cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
    const reviewLink = `https://www.taaruset.com/?review=${booking.id}&name=${encodeURIComponent(booking.client_name || '')}&service=${encodeURIComponent(booking.service_type || '')}&quarter=${encodeURIComponent(booking.quarter || '')}`;
    const message = `Bonjour ${booking.client_name || 'cher client'} ✨,\n\nToute l'équipe TAARU SET vous remercie pour votre confiance lors de votre prestation "${booking.service_type || 'Nettoyage'}" à ${booking.quarter || 'Dakar'} !\n\nVotre avis compte énormément pour nous. Pourriez-vous prendre 15 secondes pour noter la qualité de notre équipe et partager votre retour ?\n\n👉 Cliquez ici pour donner votre note : ${reviewLink}\n\nMerci infiniment et à très bientôt !\nL'équipe TAARU SET Dakar 🇸🇳`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getThankYouWhatsAppUrl = (review) => {
    if (!review?.client_phone) return '#';
    let cleanPhone = review.client_phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('221') && cleanPhone.length === 9) cleanPhone = '221' + cleanPhone;
    const message = `Bonjour ${review.client_name} ✨,\n\nUn immense merci pour votre superbe note de ${review.rating}/5 et vos mots chaleureux sur TAARU SET !\n\nToute notre équipe est heureuse de vous savoir satisfait(e). Au plaisir de vous retrouver pour une prochaine intervention !\n\nBien cordialement,\nMamadou & l'équipe TAARU SET 🇸🇳`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleToggleReviewStatus = async (reviewId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    setReviewsList(prev => prev.map(r => r.id === reviewId ? { ...r, status: nextStatus } : r));
    if (!supabase) return;
    try {
      await supabase.from('taaru_reviews').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', reviewId);
    } catch (e) {
      console.error('Erreur changement statut avis:', e);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Supprimer définitivement cet avis du registre officiel TAARU SET ?')) return;
    setReviewsList(prev => prev.filter(r => r.id !== reviewId));
    if (!supabase) return;
    try {
      await supabase.from('taaru_reviews').delete().eq('id', reviewId);
    } catch (e) {
      console.error('Erreur suppression avis:', e);
    }
  };

  const handleCopyGeneralReviewLink = () => {
    navigator.clipboard.writeText('https://www.taaruset.com/?review=nouveau');
    setCopiedReviewLink(true);
    setTimeout(() => setCopiedReviewLink(false), 2500);
  };

  // Ajout réservation manuelle
  const handleCreateManualBooking = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const now = new Date().toISOString();
      const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Opérateur TAARU SET';
      const updaterEmail = session?.user?.email || '';

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
    } catch (err) {
      console.error(err);
    }
  };

  // Création d'un nouvel abonnement (4 passages)
  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const now = new Date().toISOString();
      const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Direction TAARU SET';
      const updaterEmail = session?.user?.email || '';

      const { error } = await supabase.from('taaru_subscriptions').insert({
        client_name: subClientName.trim(),
        client_phone: subClientPhone.trim(),
        plan_name: subPlanName,
        service_type: subServiceType,
        price_fcfa: parseInt(subPrice, 10) || 30000,
        quarter: subQuarter.trim(),
        address: subAddress.trim(),
        frequency: subFrequency,
        passage_1_date: subP1Date || 'Passage 1',
        passage_1_status: 'en_attente',
        passage_2_date: subP2Date || 'Passage 2',
        passage_2_status: 'en_attente',
        passage_3_date: subP3Date || 'Passage 3',
        passage_3_status: 'en_attente',
        passage_4_date: subP4Date || 'Passage 4',
        passage_4_status: 'en_attente',
        status: 'actif',
        processed_by_name: updaterName,
        processed_by_email: updaterEmail,
        processed_at: now,
        notes: subNotes.trim()
      });

      if (!error) {
        setIsNewSubModalOpen(false);
        setSubClientName('');
        setSubClientPhone('');
        setSubAddress('');
        setSubP1Date('');
        setSubP2Date('');
        setSubP3Date('');
        setSubP4Date('');
        setSubNotes('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Validation / Annulation d'un passage en 1 clic (OPTIMISTE 0ms)
  const handleTogglePassageStatus = async (subId, passageNum, currentStatus) => {
    const targetSub = subscriptions.find(s => s.id === subId);
    if (!targetSub) return;

    // Si l'abonnement est déjà clôturé / validé définitivement, verrouillage irrévocable
    if (targetSub.is_closed || targetSub.status === 'complete') {
      alert("Cet abonnement a déjà été définitivement clôturé et validé (4/4 passages). Les passages sont verrouillés et ne peuvent plus être modifiés.");
      return;
    }

    const now = new Date().toISOString();
    const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Opérateur TAARU SET';
    const updaterEmail = session?.user?.email || '';

    const newPassageStatus = currentStatus === 'effectue' ? 'a_venir' : 'effectue';
    const fieldKey = `passage_${passageNum}_status`;

    const nextDoneCount = [1, 2, 3, 4].filter(n => {
      if (n === passageNum) return newPassageStatus === 'effectue';
      return targetSub?.[`passage_${n}_status`] === 'effectue';
    }).length;

    // RÈGLES DE STATUT AUTOMATIQUE SELON LE NOMBRE DE PASSAGES :
    // 0 passage : 'actif'
    // 1, 2, 3 passages : 'en_cours'
    // 4 passages : 'en_cours' (en attente du bouton de clôture définitive) ou 'complete' si clôturé
    let nextStatus = 'actif';
    if (nextDoneCount >= 1 && nextDoneCount < 4) {
      nextStatus = 'en_cours';
    } else if (nextDoneCount === 4) {
      nextStatus = targetSub.is_closed ? 'complete' : 'en_cours';
    }

    // Mise à jour locale optimiste immédiate (0ms)
    setSubscriptions(prev => prev.map(s => s.id === subId ? {
      ...s,
      [fieldKey]: newPassageStatus,
      status: nextStatus,
      processed_by_name: updaterName,
      processed_by_email: updaterEmail,
      processed_at: now
    } : s));

    if (!supabase) return;
    try {
      await supabase
        .from('taaru_subscriptions')
        .update({
          [fieldKey]: newPassageStatus,
          status: nextStatus,
          updated_at: now,
          processed_by_name: updaterName,
          processed_by_email: updaterEmail,
          processed_at: now
        })
        .eq('id', subId);
    } catch (e) {
      console.error(e);
      loadAllData();
    }
  };

  // Suppression d'un abonnement
  const handleDeleteSubscription = async (subId) => {
    if (!canDeleteBookings) {
      alert("Seuls les Super Administrateurs et Responsables d'Opérations peuvent supprimer un abonnement.");
      return;
    }
    if (!confirm('Confirmer la suppression de cet abonnement ?')) return;

    setSubscriptions(prev => prev.filter(s => s.id !== subId));

    if (!supabase) return;
    try {
      await supabase.from('taaru_subscriptions').delete().eq('id', subId);
    } catch (e) {
      console.error(e);
    }
  };

  // Ajout universel d'un collaborateur AVEC PROVISIONNEMENT AUTH DIRECT
  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!canManageTeam) {
      setTeamMsg('⛔ Action refusée : Seul le Super Administrateur peut accréditer des collaborateurs.');
      return;
    }
    if (!supabase) return;

    try {
      const cleanEmail = newMemberEmail.trim().toLowerCase();
      const cleanName = newMemberName.trim();
      const cleanPhone = newMemberPhone.trim();
      const cleanJob = newMemberJobTitle.trim() || (
        newMemberRole === 'super_admin' ? 'Direction Générale (Super Admin)' :
        newMemberRole === 'admin' ? 'Responsable Opérations' :
        newMemberRole === 'sales' ? 'Chargé(e) Clientèle & Commercial' : 'Chef d\'Équipe Terrain'
      );

      // Si mode invitation (Zéro-Connaissance / Confidentiel) : mot de passe aléatoire cryptographique fort
      const effectivePassword = provisionMode === 'invite'
        ? generateStrongPassword()
        : (newMemberPassword.trim() || generateStrongPassword());

      if (effectivePassword.length < 6) {
        setTeamMsg('⛔ Le mot de passe de connexion doit comporter au moins 6 caractères.');
        return;
      }

      // 1. Provisionnement complet dans PostgreSQL via RPC sécurisé
      const { data, error } = await supabase.rpc('admin_provision_team_member', {
        p_email: cleanEmail,
        p_password: effectivePassword,
        p_full_name: cleanName,
        p_phone: cleanPhone,
        p_role: newMemberRole,
        p_job_title: cleanJob
      });

      if (error || (data && data.success === false)) {
        setTeamMsg(`Erreur : ${error?.message || data?.error}`);
        return;
      }

      // 2. Si mode invitation par email (Zéro-Connaissance) :
      // On déclenche l'envoi du lien officiel par email pour que le membre définisse son mot de passe confidentiel
      let emailSuccess = false;
      let emailNotice = '';
      if (provisionMode === 'invite') {
        try {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: getAuthRedirectUrl()
          });
          if (resetErr) {
            emailSuccess = false;
            emailNotice = `Note : L'envoi de l'email automatique a été refusé par le serveur (${resetErr.message}). Transmettez-lui directement ses accès ci-dessous via WhatsApp.`;
          } else {
            emailSuccess = true;
          }
        } catch (mailErr) {
          emailSuccess = false;
          emailNotice = `Note : L'envoi automatique d'email n'a pas pu aboutir. Transmettez-lui directement ses accès ci-dessous via WhatsApp.`;
        }
      }

      setCreatedMemberSuccess({
        name: cleanName,
        email: cleanEmail,
        // Toujours fournir le mot de passe généré pour permettre un secours immédiat par WhatsApp
        password: effectivePassword,
        phone: cleanPhone,
        role: newMemberRole,
        mode: provisionMode,
        emailSuccess,
        emailNotice
      });

      setTeamMsg(
        provisionMode === 'invite'
          ? (emailSuccess
              ? `✓ "${cleanName}" a été accrédité avec succès ! Une invitation officielle a été envoyée par email à "${cleanEmail}".`
              : `✓ "${cleanName}" accrédité ! Mais l'envoi d'email Supabase a échoué. Transmettez-lui les accès générés par WhatsApp ci-dessous.`)
          : `✓ Collaborateur "${cleanName}" accrédité avec succès ! Transmettez-lui ses accès par WhatsApp.`
      );

      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberJobTitle('');
      setNewMemberRole('agent');
      setNewMemberPassword('');
      loadAllData();
    } catch (err) {
      setTeamMsg(`Erreur inattendue : ${err.message}`);
    }
  };

  // Réinitialisation du mot de passe d'un collaborateur
  const handleResetMemberPassword = async (email, newPassword) => {
    if (!canManageTeam) return;
    if (!newPassword || newPassword.length < 6) {
      alert("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (!supabase) return;

    try {
      const { data, error } = await supabase.rpc('admin_reset_member_password', {
        p_email: email,
        p_new_password: newPassword.trim()
      });

      if (error || (data && data.success === false)) {
        alert(`Erreur : ${error?.message || data?.error}`);
      } else {
        setPasswordResetSuccessMsg(`Mot de passe mis à jour avec succès pour ${email} ! Nouveau mot de passe : ${newPassword.trim()}`);
        setEditingPasswordMember(null);
        setNewPasswordInput('');
      }
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    }
  };

  // Désactiver ou réactiver un collaborateur
  const handleToggleMemberActive = async (memberId, currentStatus, memberEmail) => {
    if (!canManageTeam) return;
    if (memberEmail === 'ssow2006@gmail.com') {
      alert("Le compte Super-Admin principal de la direction ne peut pas être suspendu.");
      return;
    }

    const nextStatus = !currentStatus;
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, is_active: nextStatus } : m));

    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('admin_toggle_member_active', {
        p_email: memberEmail.trim().toLowerCase(),
        p_active: nextStatus
      });
      if (error || (data && data.success === false)) {
        console.error('Erreur RPC admin_toggle_member_active:', error || data?.error);
        await supabase
          .from('taaru_team_members')
          .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', memberId);
      }
    } catch (e) {
      console.error(e);
      try {
        await supabase
          .from('taaru_team_members')
          .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', memberId);
      } catch (err) {}
    }
  };

  // Suppression définitive d'un collaborateur (Base taaru_team_members + auth.users + destruction sessions)
  const handleDeleteTeamMember = async (memberId, memberEmail) => {
    if (!canManageTeam) return;
    if (memberEmail === 'ssow2006@gmail.com') {
      alert("Protection critique : Le compte Super-Admin principal ne peut jamais être supprimé.");
      return;
    }
    if (!confirm(`Supprimer définitivement l'accréditation du collaborateur "${memberEmail}" ?\n\nATTENTION : Il sera totalement supprimé de la base de données et du registre de connexion (auth.users), et toutes ses sessions actives seront immédiatement révoquées. Il ne pourra plus jamais se connecter.`)) return;

    setTeamMembers(prev => prev.filter(m => m.id !== memberId));

    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('admin_delete_team_member', {
        p_email: memberEmail.trim().toLowerCase()
      });
      if (error || (data && data.success === false)) {
        console.error('Erreur RPC admin_delete_team_member:', error || data?.error);
        await supabase.from('taaru_team_members').delete().eq('id', memberId);
      }
    } catch (e) {
      console.error(e);
      try {
        await supabase.from('taaru_team_members').delete().eq('id', memberId);
      } catch (err) {}
    }
  };

  // Extraction des initiales d'un collaborateur
  const getInitials = (name) => {
    if (!name) return 'TS';
    const clean = name.replace(/\([^)]*\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'TS';
  };

  // Formatage monétaire FCFA
  const formatPrice = (val) => {
    if (!val && val !== 0) return '0 FCFA';
    return `${Number(val).toLocaleString('fr-FR')} FCFA`;
  };

  // Style des badges de rôle
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
      case 'co_founder':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'admin':
      case 'operations':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'sales':
      case 'strategy':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'agent':
      default:
        return 'bg-emerald-50 text-[#0D5C3A] border-emerald-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return '👑 Super Admin';
      case 'co_founder': return '👑 Co-Fondateur';
      case 'admin':
      case 'operations': return '🛡️ Responsable Opérations';
      case 'sales':
      case 'strategy': return '💼 Chargé(e) Clientèle';
      case 'agent':
      default: return '👷 Chef d\'Équipe Terrain';
    }
  };

  // Filtrage des réservations
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (b.client_name?.toLowerCase().includes(q)) ||
        (b.client_phone?.toLowerCase().includes(q)) ||
        (b.quarter?.toLowerCase().includes(q)) ||
        (b.service_type?.toLowerCase().includes(q)) ||
        (b.processed_by_name?.toLowerCase().includes(q)) ||
        (b.service_details?.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [bookings, bookingFilter, searchQuery]);

  // Filtrage des abonnements
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchesFilter = subFilter === 'all' || s.status === subFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (s.client_name?.toLowerCase().includes(q)) ||
        (s.client_phone?.toLowerCase().includes(q)) ||
        (s.quarter?.toLowerCase().includes(q)) ||
        (s.plan_name?.toLowerCase().includes(q)) ||
        (s.processed_by_name?.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [subscriptions, subFilter, searchQuery]);

  // Détection & liaison automatique des commandes sous formule abonnement
  const isAbonnementBooking = (booking) => {
    if (!booking) return false;
    const text = `${booking.service_type || ''} ${booking.service_details || ''} ${booking.notes || ''}`.toLowerCase();
    return (
      text.includes('abonnement') ||
      text.includes('pack mensuel') ||
      text.includes('4 lavages') ||
      text.includes('4 passages') ||
      text.includes('passages')
    );
  };

  const findSubscriptionForBooking = (booking) => {
    if (!booking || !subscriptions.length) return null;
    const cleanPhone = booking.client_phone ? booking.client_phone.replace(/[^0-9]/g, '') : '';
    const cleanName = booking.client_name ? booking.client_name.trim().toLowerCase() : '';

    return subscriptions.find(s => {
      const sPhone = s.client_phone ? s.client_phone.replace(/[^0-9]/g, '') : '';
      const sName = s.client_name ? s.client_name.trim().toLowerCase() : '';
      return (cleanPhone && sPhone && cleanPhone === sPhone) || (cleanName && sName && (cleanName.includes(sName) || sName.includes(cleanName)));
    });
  };

  const handleGoToSubscription = (clientNameOrPhone) => {
    setActiveTab('subscriptions');
    setSearchQuery(clientNameOrPhone ? clientNameOrPhone.trim() : '');
    setSubFilter('all');
    if (selectedBookingDetails) {
      setSelectedBookingDetails(null);
    }
  };

  // Décomposition propre des détails de commande pour éviter les blocs de texte bruts
  const parseServiceDetails = (rawDetails) => {
    if (!rawDetails) return { plan: '', dates: [], time: '', raw: '' };

    let plan = rawDetails;
    let dates = [];
    let time = '';

    // Détecter et extraire le créneau horaire
    const timeMatch = rawDetails.match(/à\s+([A-Za-zÀ-ÿ0-9\s\(\)\:\-]+)$/i);
    if (timeMatch) {
      time = timeMatch[1].trim();
      plan = plan.replace(timeMatch[0], '').trim();
    }

    // Détecter et extraire les dates programmées
    const datesMatch = rawDetails.match(/\[Dates:\s*([^\]]+)\]/i);
    if (datesMatch) {
      dates = datesMatch[1].split(',').map(d => d.trim());
      plan = plan.replace(datesMatch[0], '').trim();
    }

    // Nettoyer les mentions redondantes
    plan = plan.replace(/\s*-\s*Abonnement\s*:\s*4 dates libres/i, '')
               .replace(/\s*-\s*Abonnement\s*:/i, '')
               .replace(/\s*-\s*Demain/i, '')
               .trim();

    return { plan, dates, time, raw: rawDetails };
  };

  // Clôture définitive du mois d'abonnement (4/4 validés)
  const handleConfirmCloseSubscription = async (subId) => {
    const targetSub = subscriptions.find(s => s.id === subId);
    if (!targetSub) return;

    const confirmed = window.confirm(
      `Confirmez-vous la clôture définitive de l'abonnement de ${targetSub.client_name} (4/4 passages validés) ?\n\n• Les 4 passages seront définitivement validés et verrouillés\n• La commande sur le Planning passera automatiquement en TERMINÉE\n• Ce mois sera archivé comme 100% complété.`
    );
    if (!confirmed) return;

    const now = new Date().toISOString();
    const updaterName = currentMember?.full_name || session?.user?.email?.split('@')[0] || 'Opérateur TAARU SET';
    const updaterEmail = session?.user?.email || '';

    // 1. Verrouiller la fiche abonnement
    setSubscriptions(prev => prev.map(s => s.id === subId ? {
      ...s,
      status: 'complete',
      is_closed: true,
      processed_by_name: updaterName,
      processed_by_email: updaterEmail,
      processed_at: now
    } : s));

    // 2. Trouver et marquer automatiquement la commande du planning en 'terminee'
    const cleanPhone = targetSub.client_phone ? targetSub.client_phone.replace(/[^0-9]/g, '') : '';
    const cleanName = targetSub.client_name ? targetSub.client_name.trim().toLowerCase() : '';

    const matchingBooking = bookings.find(b => {
      const bP = b.client_phone ? b.client_phone.replace(/[^0-9]/g, '') : '';
      const bN = b.client_name ? b.client_name.trim().toLowerCase() : '';
      return (cleanPhone && bP && cleanPhone === bP) || (cleanName && bN && (cleanName.includes(bN) || bN.includes(cleanName)));
    });

    if (matchingBooking) {
      setBookings(prev => prev.map(b => b.id === matchingBooking.id ? {
        ...b,
        status: 'terminee',
        updated_at: now,
        processed_by_name: b.processed_by_name || updaterName,
        processed_by_email: b.processed_by_email || updaterEmail,
        processed_at: b.processed_at || now
      } : b));

      if (selectedBookingDetails?.id === matchingBooking.id) {
        setSelectedBookingDetails(prev => ({
          ...prev,
          status: 'terminee',
          updated_at: now,
          processed_by_name: prev.processed_by_name || updaterName,
          processed_by_email: prev.processed_by_email || updaterEmail,
          processed_at: prev.processed_at || now
        }));
      }

      if (supabase) {
        await supabase
          .from('taaru_bookings')
          .update({
            status: 'terminee',
            updated_at: now,
            processed_by_name: matchingBooking.processed_by_name || updaterName,
            processed_by_email: matchingBooking.processed_by_email || updaterEmail,
            processed_at: matchingBooking.processed_at || now
          })
          .eq('id', matchingBooking.id);
      }
    }

    if (supabase) {
      await supabase
        .from('taaru_subscriptions')
        .update({
          status: 'complete',
          is_closed: true,
          updated_at: now,
          processed_by_name: updaterName,
          processed_by_email: updaterEmail,
          processed_at: now
        })
        .eq('id', subId);
    }
  };

  // Badges statuts de réservations
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmee':
        return 'bg-emerald-50 text-[#0D5C3A] border-emerald-200';
      case 'en_cours':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'terminee':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'annulee':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'en_attente':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  // Calcul des statistiques réelles (sans fausses données)
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'terminee');
    const totalRevenue = completedBookings.reduce((acc, curr) => acc + (curr.estimated_price_fcfa || 0), 0);
    const activeSubCount = subscriptions.filter(s => s.status === 'actif').length;
    const monthlyRecurringRevenue = subscriptions.filter(s => s.status === 'actif').reduce((acc, curr) => acc + (curr.price_fcfa || 0), 0);
    const pendingCount = bookings.filter(b => b.status === 'en_attente').length;
    const avgBasket = completedBookings.length > 0 ? Math.round(totalRevenue / completedBookings.length) : 0;

    const serviceMap = {};
    bookings.forEach(b => {
      const s = b.service_type || 'Autre formule';
      serviceMap[s] = (serviceMap[s] || 0) + (b.estimated_price_fcfa || 0);
    });

    const serviceDistribution = Object.entries(serviceMap).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalRevenue > 0 ? Math.min(Math.round((amount / totalRevenue) * 100), 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalBookings,
      completedCount: completedBookings.length,
      totalRevenue,
      pendingCount,
      avgBasket,
      serviceDistribution,
      activeSubCount,
      monthlyRecurringRevenue
    };
  }, [bookings, subscriptions]);

  // 1. Export Excel Professionnel Stylisé & Coloré (.xls compatible Microsoft Excel / Google Sheets)
  const exportBookingsToExcel = () => {
    if (bookings.length === 0) {
      alert("Aucune réservation à exporter.");
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const totalCA = bookings.reduce((acc, b) => acc + (Number(b.estimated_price_fcfa) || 0), 0);

    const getStatusStyle = (status) => {
      switch (status) {
        case 'terminee':
          return { bg: '#DCFCE7', color: '#166534', label: 'Terminée' };
        case 'en_cours':
          return { bg: '#DBEAFE', color: '#1E40AF', label: 'En cours' };
        case 'confirmee':
          return { bg: '#E0E7FF', color: '#3730A3', label: 'Confirmée' };
        case 'annulee':
          return { bg: '#FEE2E2', color: '#991B1B', label: 'Annulée' };
        case 'en_attente':
        default:
          return { bg: '#FEF3C7', color: '#92400E', label: 'En attente' };
      }
    };

    let tableRows = bookings.map((b, idx) => {
      const st = getStatusStyle(b.status);
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAF7';
      const cleanPhone = b.client_phone ? b.client_phone.replace(/\s+/g, ' ') : '';
      const price = Number(b.estimated_price_fcfa) || 0;
      const formattedPrice = price.toLocaleString('fr-FR') + ' FCFA';
      const dateCreation = b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : '';
      const dateIntervention = b.intervention_date || 'À fixer';
      const heureIntervention = b.intervention_time || '';
      const processedBy = b.processed_by_name || 'Non assigné';

      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #64748B;">#${idx + 1}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${b.client_name || ''}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; mso-number-format:'\\@'; color: #334155;">${cleanPhone}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold; color: #0D5C3A;">${b.service_type || ''}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; color: #475569;">${(b.service_details || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; color: #334155;">${b.quarter || ''}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center; color: #334155;">${dateIntervention} ${heureIntervention}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: right; font-weight: bold; color: #0D5C3A; font-family: monospace;">${formattedPrice}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center;">
            <span style="background-color: ${st.bg}; color: ${st.color}; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; display: inline-block;">
              ${st.label}
            </span>
          </td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; color: #0F172A; font-weight: 500;">${processedBy}</td>
          <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: center; color: #64748B; font-size: 11px;">${dateCreation}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Registre TAARU SET</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1E293B; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0D5C3A; color: #FFFFFF; font-weight: bold; padding: 12px 10px; text-align: left; border: 1px solid #09482E; font-size: 12px; }
        </style>
      </head>
      <body>
        <table style="margin-bottom: 20px;">
          <tr>
            <td colspan="11" style="background-color: #0D5C3A; color: #FFFFFF; padding: 18px; font-size: 18px; font-weight: bold; text-align: center;">
              TAARU SET • REGISTRE OFFICIEL DES COMMANDES & INTERVENTIONS DAKAR
            </td>
          </tr>
          <tr style="background-color: #F1F5F9;">
            <td colspan="6" style="padding: 8px 12px; font-weight: bold; color: #475569;">
              Document généré le : ${dateStr} à ${timeStr} • Domaine officiel : www.taaruset.com
            </td>
            <td colspan="5" style="padding: 8px 12px; text-align: right; font-weight: bold; color: #0D5C3A;">
              Total : ${bookings.length} réservations • Chiffre d'affaires : ${totalCA.toLocaleString('fr-FR')} FCFA
            </td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">N°</th>
              <th style="width: 180px;">Client</th>
              <th style="width: 130px;">Téléphone</th>
              <th style="width: 180px;">Prestation</th>
              <th style="width: 250px;">Formule & Détails</th>
              <th style="width: 150px;">Quartier</th>
              <th style="width: 160px; text-align: center;">Date & Heure</th>
              <th style="width: 140px; text-align: right;">Montant</th>
              <th style="width: 130px; text-align: center;">Statut</th>
              <th style="width: 160px;">Opérateur Traité Par</th>
              <th style="width: 110px; text-align: center;">Date Enregistrement</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #E2E8F0; font-weight: bold;">
              <td colspan="7" style="padding: 12px; border: 1px solid #CBD5E1; text-align: right; font-size: 13px;">
                TOTAL GÉNÉRAL DU REGISTRE (${bookings.length} commandes) :
              </td>
              <td style="padding: 12px; border: 1px solid #CBD5E1; text-align: right; font-size: 14px; color: #0D5C3A; font-family: monospace;">
                ${totalCA.toLocaleString('fr-FR')} FCFA
              </td>
              <td colspan="3" style="padding: 12px; border: 1px solid #CBD5E1;"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TAARU_SET_Registre_${now.toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export CSV Standard optimisé pour Excel France / Windows (point-virgule et UTF-8 BOM)
  const exportBookingsToCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['ID', 'Date_Creation', 'Client', 'Telephone', 'Service', 'Details', 'Quartier', 'Date_Intervention', 'Heure', 'Montant_FCFA', 'Statut', 'Traite_Par', 'Date_Traitement'];
    const rows = bookings.map(b => [
      b.id,
      b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : '',
      `"${(b.client_name || '').replace(/"/g, '""')}"`,
      `"${(b.client_phone || '').replace(/"/g, '""')}"`,
      `"${(b.service_type || '').replace(/"/g, '""')}"`,
      `"${(b.service_details || '').replace(/"/g, '""')}"`,
      `"${(b.quarter || '').replace(/"/g, '""')}"`,
      `"${b.intervention_date || ''}"`,
      `"${b.intervention_time || ''}"`,
      b.estimated_price_fcfa || 0,
      b.status || 'en_attente',
      `"${(b.processed_by_name || '').replace(/"/g, '""')}"`,
      b.processed_at ? new Date(b.processed_at).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TAARU_SET_Donnees_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // ÉCRAN DE CONNEXION ZERO-TRUST
  // ---------------------------------------------------------------------------
  if (!session || authLoading || isRecoveryMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAF7] flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(13,92,58,0.12)] space-y-6">
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-md border-2 border-white ring-2 ring-emerald-500/20">
              <img src={logoOfficialSq} alt="TAARU SET" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-['Outfit'] font-bold text-[#0D5C3A] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Portail Collaborateurs & Direction</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-['Outfit'] font-black text-slate-900 tracking-tight">
                {isRecoveryMode ? "Définir votre Mot de Passe" : isResetMode ? "Activation & Réinitialisation" : "TAARU SET • Dakar"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isRecoveryMode 
                  ? "Créez votre propre mot de passe personnel confidentiel"
                  : isResetMode 
                  ? "Lien sécurisé pour première connexion ou mot de passe oublié"
                  : "Authentification chiffrée & contrôle d'accès sur liste blanche"}
              </p>
            </div>
          </div>

          {/* MODE DÉFINITION DE MOT DE PASSE PERSONNEL (RECOVERY) */}
          {isRecoveryMode ? (
            <div className="space-y-4">
              {recoverySuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 font-bold leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              {recoveryError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateRecoveryPassword} className="space-y-4 font-['Outfit']">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Nouveau mot de passe secret
                  </label>
                  <div className="relative">
                    <input
                      type={showRecoveryPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Min. 8 caractères"
                      value={recoveryPassword}
                      onChange={(e) => setRecoveryPassword(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showRecoveryPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Retapez votre mot de passe"
                    value={recoveryPasswordConfirm}
                    onChange={(e) => setRecoveryPasswordConfirm(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading || !recoveryPassword || recoveryPassword.length < 8}
                  className="w-full h-12 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#0D5C3A]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recoveryLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-300" />
                  )}
                  <span>Enregistrer & Accéder à mon Espace</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {authError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 font-medium leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {lockoutTimer > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between font-['Outfit'] font-bold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Verrouillage anti-brute force</span>
                  </div>
                  <span className="tabular-nums font-black text-amber-700">{lockoutTimer}s</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email professionnel accrédité
                  </label>
                  <input
                    type="email"
                    required
                    disabled={lockoutTimer > 0}
                    placeholder="Ex: direction@taaruset.sn ou gmail"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-[#0D5C3A] transition-all font-medium disabled:opacity-50"
                  />
                </div>

                {!isResetMode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-['Outfit'] font-bold text-slate-700 uppercase tracking-wider">
                        Mot de passe sécurisé
                      </label>
                      <button
                        type="button"
                        onClick={() => { setIsResetMode(true); setAuthError(''); setAuthSuccessMsg(''); }}
                        className="text-xs text-[#0D5C3A] hover:underline font-bold cursor-pointer"
                      >
                        1ère connexion ou mot de passe oublié ?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      disabled={lockoutTimer > 0}
                      placeholder="••••••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-[#0D5C3A] transition-all font-medium disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={lockoutTimer > 0}
                  className="w-full h-12 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#0D5C3A]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 text-emerald-300" />
                  <span>{isResetMode ? "Envoyer le lien d'activation sécurisé" : "Déverrouiller l'Espace Sécurisé"}</span>
                </button>
              </form>

              {isResetMode && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsResetMode(false); setAuthError(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold font-['Outfit'] cursor-pointer"
                  >
                    ← Retour à la connexion classique
                  </button>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-[#16A34A]" />
              PostgreSQL RLS Actif
            </span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-slate-700 underline font-semibold cursor-pointer"
            >
              Retour au site vitrine
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // INTERFACE PRINCIPALE DU PORTAIL ADMINISTRATEUR
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAF7] text-slate-800 flex flex-col font-sans overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR INSTITUTIONNELLE ÉPURÉE                                         */}
      {/* ========================================================================= */}
      <header className="h-16 px-3.5 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-xs border border-emerald-500/20 shrink-0">
              <img src={logoOfficialSq} alt="TAARU SET" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-['Outfit'] font-black text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap">
                  TAARU <span className="text-[#16A34A]">SET</span>
                </span>
                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-extrabold border ${getRoleBadge(userRole)}`}>
                  {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Opérations' : userRole === 'sales' ? 'Commercial' : 'Terrain'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Système d'Exploitation Opérationnel • Dakar
              </p>
            </div>
          </div>
        </div>

        {/* Profil connecté & Actions (Épuré et aéré sur mobile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-['Outfit'] font-bold text-slate-900 leading-tight">
              {currentMember?.full_name || session?.user?.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
              {currentMember?.job_title || session?.user?.email}
            </span>
          </div>

          {/* Avatar avec initiales - clic rapide pour modifier mot de passe */}
          <div 
            onClick={() => { setIsSelfPasswordModalOpen(true); setSelfPasswordMsg(''); setSelfPasswordError(''); }}
            className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#0D5C3A] font-['Outfit'] font-black text-xs flex items-center justify-center border border-emerald-300 shadow-xs cursor-pointer transition-colors"
            title="Mon profil & Mot de passe"
          >
            {getInitials(currentMember?.full_name)}
          </div>

          {/* Bouton clé mot de passe : visible sur tablette/desktop, intégré dans le drawer sur mobile */}
          <button
            type="button"
            onClick={() => { setIsSelfPasswordModalOpen(true); setSelfPasswordMsg(''); setSelfPasswordError(''); }}
            className="hidden sm:flex h-9 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] text-xs font-['Outfit'] font-bold items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
            title="Modifier mon mot de passe"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Mon Mot de Passe</span>
          </button>

          {/* Bouton quitter */}
          <button
            type="button"
            onClick={handleSignOut}
            className="h-8.5 w-8.5 sm:w-auto sm:h-9 sm:px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CORPS PRINCIPAL : SIDEBAR DESKTOP + ZONE DE TRAVAIL                    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --- SIDEBAR DESKTOP --- */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/90 flex-col justify-between p-4 shrink-0 shadow-xs font-['Outfit']">
          <div className="space-y-6">
            
            <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accréditation</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">
                {currentMember?.full_name}
              </div>
              <div className="text-[11px] text-[#0D5C3A] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{getRoleLabel(userRole)}</span>
              </div>
            </div>

            {/* Navigation standardisée (sans icônes IA) */}
            <nav className="space-y-1.5">
              
              {/* 1. Planning Réservations */}
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'bookings'
                    ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>Planning Commandes</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {bookings.length}
                </span>
              </button>

              {/* 2. Suivi Abonnements (Icône Repeat sobre) */}
              <button
                type="button"
                onClick={() => setActiveTab('subscriptions')}
                className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'subscriptions'
                    ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-4 h-4" />
                  <span>Suivi Abonnements</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {subscriptions.length}
                </span>
              </button>

              {/* 3. Répertoire Clients CRM */}
              {canViewCRM && (
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'clients'
                      ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Répertoire Clients</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {clients.length}
                  </span>
                </button>
              )}

              {/* 4. Avis Clients Vérifiés (Demandé par Mamadou) */}
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Avis & Notations</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {reviewsList.length}
                </span>
              </button>

              {/* 5. Statistiques & Bilan */}
              {canViewStats && (
                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'stats'
                      ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Statistiques & Bilan</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                </button>
              )}

              {/* 6. Équipe & Droits */}
              {canManageTeam && (
                <button
                  type="button"
                  onClick={() => setActiveTab('team')}
                  className={`w-full h-11 px-3.5 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                    activeTab === 'team'
                      ? 'bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Équipe & Droits</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {teamMembers.length}
                  </span>
                </button>
              )}
            </nav>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 font-['Outfit']">
            <button
              type="button"
              onClick={exportBookingsToExcel}
              className="w-full h-9 px-3 rounded-xl bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white border border-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Télécharger le registre au format Excel avec couleurs et totaux"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exporter en Excel (Couleurs)</span>
            </button>

            <button
              type="button"
              onClick={exportBookingsToCSV}
              className="w-full h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Télécharger en fichier CSV compatible Excel France"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV (Standard)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-8 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-[11px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Voir le site vitrine</span>
            </button>
          </div>
        </aside>

        {/* --- MENU MOBILE SLIDE-OVER (DRAWER) --- */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl space-y-6">
              
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs">
                      <img src={logoOfficialSq} alt="TAARU SET" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-['Outfit'] font-black text-slate-900 text-base">TAARU SET</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAF7] border border-slate-200/80">
                  <div className="font-['Outfit'] font-bold text-xs text-slate-900 truncate">
                    {currentMember?.full_name}
                  </div>
                  <div className="text-[11px] text-[#0D5C3A] font-medium mt-0.5">
                    {getRoleLabel(userRole)}
                  </div>
                </div>

                <div className="space-y-1.5 font-['Outfit'] text-xs">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('bookings'); setIsMobileMenuOpen(false); }}
                    className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                      activeTab === 'bookings' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4" />
                      <span>Planning Commandes</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {bookings.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }}
                    className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                      activeTab === 'subscriptions' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Repeat className="w-4 h-4" />
                      <span>Suivi Abonnements</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {subscriptions.length}
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
                        <span>Répertoire Clients</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {clients.length}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setActiveTab('reviews'); setIsMobileMenuOpen(false); }}
                    className={`w-full h-11 px-4 rounded-xl font-bold flex items-center justify-between transition-colors ${
                      activeTab === 'reviews' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Avis & Notations</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {reviewsList.length}
                    </span>
                  </button>

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
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 font-['Outfit']">
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); exportBookingsToExcel(); }}
                  className="w-full h-9 px-4 rounded-xl bg-emerald-50 hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white flex items-center justify-center gap-2 text-xs font-bold border border-emerald-300 shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exporter en Excel (Couleurs)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); exportBookingsToCSV(); }}
                  className="w-full h-8 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV (Standard)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 text-xs font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Voir le site vitrine</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setIsSelfPasswordModalOpen(true); setSelfPasswordMsg(''); setSelfPasswordError(''); }}
                  className="w-full h-10 px-4 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center gap-2 text-xs font-bold font-['Outfit'] border border-emerald-200 mb-2"
                >
                  <KeyRound className="w-4 h-4 text-[#16A34A]" />
                  <span>Modifier mon mot de passe</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full h-10 px-4 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>

            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* --- ZONE CENTRALE DE TRAVAIL --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">

          {/* En-tête de section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-['Outfit'] font-bold uppercase tracking-wider">
                <span>Espace Opérationnel</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0D5C3A]">
                  {activeTab === 'bookings' && 'Planning des Commandes'}
                  {activeTab === 'subscriptions' && 'Suivi des Abonnements (4 passages)'}
                  {activeTab === 'clients' && 'Répertoire Clients & CRM'}
                  {activeTab === 'reviews' && 'Avis Clients Vérifiés & Satisfaction'}
                  {activeTab === 'stats' && 'Statistiques & Bilan Financier'}
                  {activeTab === 'team' && 'Équipe & Gestion Universelle des Droits'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-slate-900 tracking-tight mt-1">
                {activeTab === 'bookings' && 'Interventions & Réservations Dakar'}
                {activeTab === 'subscriptions' && 'Suivi des Abonnements & Passages Programmés'}
                {activeTab === 'clients' && 'Base de Contacts & Historique Clients'}
                {activeTab === 'reviews' && 'Avis Clients Vérifiés & Modération en Direct'}
                {activeTab === 'stats' && 'Tableau de Bord de Performance'}
                {activeTab === 'team' && 'Accréditations & Équipe Opérationnelle'}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadAllData}
                className="h-10 w-10 rounded-xl bg-white border border-slate-200/90 text-slate-600 hover:text-[#0D5C3A] hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#0D5C3A]' : ''}`} />
              </button>

              {activeTab === 'bookings' && (
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center gap-2 shadow-md shadow-[#0D5C3A]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Réservation</span>
                </button>
              )}

              {activeTab === 'subscriptions' && (
                <button
                  type="button"
                  onClick={() => setIsNewSubModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center gap-2 shadow-md shadow-[#0D5C3A]/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvel Abonnement</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ONGLET 1 : PLANNING DES COMMANDES                                         */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Filtres & Recherche */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-['Outfit'] text-xs">
                  {[
                    { id: 'all', label: 'Toutes', count: bookings.length },
                    { id: 'en_attente', label: 'En attente', count: bookings.filter(b => b.status === 'en_attente').length },
                    { id: 'confirmee', label: 'Confirmées', count: bookings.filter(b => b.status === 'confirmee').length },
                    { id: 'en_cours', label: 'En cours', count: bookings.filter(b => b.status === 'en_cours').length },
                    { id: 'terminee', label: 'Terminées', count: bookings.filter(b => b.status === 'terminee').length },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBookingFilter(f.id)}
                      className={`h-9 px-3.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                        bookingFilter === f.id
                          ? 'bg-[#0D5C3A] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        bookingFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Recherche client, téléphone, quartier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 focus:outline-none focus:border-[#0D5C3A] shadow-xs font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* --- VUE MOBILE : CARTES TACTILES (< md) SANS DÉBORDEMENT --- */}
              <div className="md:hidden space-y-3.5">
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 shadow-xs font-medium">
                    Aucune réservation ne correspond à votre filtre.
                  </div>
                ) : (
                  filteredBookings.map((b) => {
                    // RÈGLE LOGIQUE STRICTE : La prise en charge n'est possible QUE SI la commande est en attente ET non assignée
                    const canTakeOver = b.status === 'en_attente' && !b.processed_by_name;

                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                      >
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

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                          <div className="font-bold text-slate-800">{b.service_type}</div>
                          {(() => {
                            const parsed = parseServiceDetails(b.service_details);
                            return (
                              <div className="text-slate-600 text-[11px] leading-relaxed">
                                {parsed.plan || b.service_details}
                              </div>
                            );
                          })()}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#0D5C3A]" />
                            <span>{b.intervention_date || 'Date à définir'} {b.intervention_time ? `• ${b.intervention_time}` : ''}</span>
                          </div>
                        </div>

                        {/* MODULE SUIVI ABONNEMENT EN DIRECT SUR PLANNING (MOBILE AÉRÉ) */}
                        {isAbonnementBooking(b) && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-300 text-xs space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D5C3A] text-white font-['Outfit'] font-black text-[10px] uppercase tracking-wide shadow-xs shrink-0">
                                <Repeat className="w-3 h-3 text-emerald-300" />
                                <span>Abonnement Mensuel</span>
                              </span>
                              {(() => {
                                const sub = findSubscriptionForBooking(b);
                                if (sub) {
                                  const done = [1, 2, 3, 4].filter(n => sub[`passage_${n}_status`] === 'effectue').length;
                                  const isClosed = sub.is_closed || sub.status === 'complete';
                                  return (
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold border ${
                                      isClosed
                                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                                        : done === 4
                                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                        : done > 0
                                        ? 'bg-emerald-100 text-[#0D5C3A] border-emerald-300'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {isClosed ? '✓ Mois Clôturé (4/4)' : done === 4 ? '4/4 Validés • À clôturer' : `${done}/4 validés • ${done > 0 ? 'En cours' : 'À venir'}`}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Abonné
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Bouton direct d'accès au Suivi des Abonnements */}
                            <button
                              type="button"
                              onClick={() => handleGoToSubscription(b.client_name)}
                              className="w-full h-8 px-3 rounded-xl bg-white hover:bg-[#0D5C3A] hover:text-white border border-emerald-300 text-[#0D5C3A] font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                              <span>Suivi des 4 Passages Abonnement</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* BADGE DE TRAÇABILITÉ AUDITÉ (MOBILE PRO) */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0D5C3A] font-['Outfit'] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                {b.processed_by_name ? getInitials(b.processed_by_name) : 'TS'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] text-slate-400 font-medium leading-none">Opérateur en charge</div>
                                <div className={`font-['Outfit'] font-bold text-xs truncate mt-0.5 ${b.processed_by_name ? 'text-slate-900' : 'text-amber-700'}`}>
                                  {b.processed_by_name || (b.status === 'en_attente' ? 'En attente d\'attribution' : 'Équipe TAARU SET')}
                                </div>
                              </div>
                            </div>
                            {b.processed_at && (
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                Le {new Date(b.processed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {/* SI EN ATTENTE ET SANS OPÉRATEUR : BOUTON PLEINE LARGEUR VISIBLE */}
                          {canTakeOver && (
                            <button
                              type="button"
                              onClick={() => handleTakeOverBooking(b.id)}
                              className="w-full h-8.5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Prendre en charge cette intervention</span>
                            </button>
                          )}
                        </div>

                        {/* Boutons d'action rapides */}
                        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(b.client_phone, b.id)}
                            className={`h-9 px-2 rounded-xl text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1 border transition-colors ${
                              copiedId === b.id
                                ? 'bg-emerald-50 border-emerald-300 text-[#0D5C3A]'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {copiedId === b.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                <span className="text-[11px]">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[11px]">Copier</span>
                              </>
                            )}
                          </button>

                          <a
                            href={`tel:${b.client_phone?.replace(/\s+/g, '')}`}
                            className="h-9 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                            <span className="text-[11px]">Appel</span>
                          </a>

                          <a
                            href={`https://wa.me/${b.client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0D5C3A] text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[11px]">WhatsApp</span>
                          </a>

                          <a
                            href={getReviewWhatsAppUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1 shadow-2xs"
                            title="Demander un avis 5 étoiles sur WhatsApp"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            <span className="text-[11px]">Avis</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setSelectedBookingDetails(b)}
                            className="h-9 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[11px]">Détails</span>
                          </button>
                        </div>

                        {/* Statut sélecteur mobile */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-xs font-['Outfit'] font-bold text-slate-600">Statut actuel :</span>
                          {b.status === 'terminee' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-['Outfit'] font-bold text-xs border border-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Terminée (Verrouillée)</span>
                            </div>
                          ) : (
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                              className={`text-xs font-['Outfit'] font-bold py-1.5 px-3 rounded-xl border focus:outline-none cursor-pointer ${getStatusBadge(b.status)}`}
                            >
                              <option value="en_attente">En attente</option>
                              <option value="confirmee">Confirmée</option>
                              <option value="en_cours">En cours</option>
                              <option value="terminee">Terminée (Clôturer)</option>
                              <option value="annulee">Annulée</option>
                            </select>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* --- VUE DESKTOP : TABLEAU COMPLET FLUIDE SANS SCROLL HORIZONTAL (>= md) --- */}
              <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 text-[11px] font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr className="whitespace-nowrap">
                        <th className="py-3 px-3.5 min-w-[135px]">Client</th>
                        <th className="py-3 px-3.5 min-w-[170px]">Prestation & Formule</th>
                        <th className="py-3 px-3.5 min-w-[130px]">Quartier & Date</th>
                        <th className="py-3 px-3.5 min-w-[95px]">Montant</th>
                        <th className="py-3 px-3.5 min-w-[125px]">Statut</th>
                        <th className="py-3 px-3.5 min-w-[145px]">Opérateur</th>
                        <th className="py-3 px-3.5 min-w-[125px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            Aucune réservation ne correspond à vos filtres.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const canTakeOver = b.status === 'en_attente' && !b.processed_by_name;

                          return (
                            <tr key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="py-3 px-3.5 min-w-[135px]">
                                <div className="font-['Outfit'] font-bold text-slate-900 text-xs whitespace-nowrap">{b.client_name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-slate-500 text-[11px] font-medium tabular-nums whitespace-nowrap">{b.client_phone}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(b.client_phone, b.id)}
                                    className="text-slate-400 hover:text-[#0D5C3A] cursor-pointer"
                                    title="Copier le numéro"
                                  >
                                    {copiedId === b.id ? (
                                      <span className="text-[9px] text-[#16A34A] font-bold">Copié !</span>
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-3.5 min-w-[170px] max-w-[210px]">
                                <div className="font-bold text-slate-800 text-xs truncate" title={b.service_type}>{b.service_type}</div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5" title={b.service_details}>{b.service_details}</div>
                                {isAbonnementBooking(b) && (
                                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#0D5C3A] border border-emerald-300 text-[9px] font-['Outfit'] font-extrabold whitespace-nowrap">
                                      <Repeat className="w-2.5 h-2.5 text-[#16A34A]" />
                                      <span>Abonnement 4P</span>
                                    </span>
                                    {(() => {
                                      const sub = findSubscriptionForBooking(b);
                                      if (sub) {
                                        const done = [1, 2, 3, 4].filter(n => sub[`passage_${n}_status`] === 'effectue').length;
                                        return (
                                          <span className="text-[9px] font-bold text-[#0D5C3A] bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded whitespace-nowrap">
                                            {done}/4 validés
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3.5 min-w-[130px] whitespace-nowrap">
                                <div className="text-slate-800 font-semibold text-xs truncate max-w-[130px]">{b.quarter}</div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  {b.intervention_date || 'Date à fixer'} {b.intervention_time ? `• ${b.intervention_time}` : ''}
                                </div>
                              </td>

                              <td className="py-3 px-3.5 min-w-[95px] whitespace-nowrap font-['Outfit'] font-extrabold text-[#0D5C3A] text-xs tabular-nums">
                                {formatPrice(b.estimated_price_fcfa)}
                              </td>

                              <td className="py-3 px-3.5 min-w-[125px] whitespace-nowrap">
                                {b.status === 'terminee' ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-['Outfit'] font-bold text-[11px] border border-slate-300">
                                    <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Clôturée</span>
                                  </div>
                                ) : (
                                  <select
                                    value={b.status}
                                    onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                    className={`text-[11px] font-['Outfit'] font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadge(b.status)}`}
                                  >
                                    <option value="en_attente">En attente</option>
                                    <option value="confirmee">Confirmée</option>
                                    <option value="en_cours">En cours</option>
                                    <option value="terminee">Terminée</option>
                                    <option value="annulee">Annulée</option>
                                  </select>
                                )}
                              </td>

                              {/* OPÉRATEUR & TRAÇABILITÉ AUDITÉE (COMPACT & ÉPURÉ) */}
                              <td className="py-3 px-3.5 min-w-[145px] whitespace-nowrap">
                                {b.processed_by_name ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-300/80 text-[#0D5C3A] font-['Outfit'] font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                                      {getInitials(b.processed_by_name)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="font-['Outfit'] font-bold text-slate-900 text-xs truncate max-w-[105px] leading-snug" title={b.processed_by_name}>
                                          {b.processed_by_name}
                                        </span>
                                        <CheckCircle2 className="w-3 h-3 text-[#16A34A] shrink-0" />
                                      </div>
                                      {b.processed_at && (
                                        <div className="text-[9px] text-slate-400 font-medium">
                                          {new Date(b.processed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(b.processed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : canTakeOver ? (
                                  <button
                                    type="button"
                                    onClick={() => handleTakeOverBooking(b.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#0D5C3A] text-[#0D5C3A] hover:text-white border border-emerald-300 font-['Outfit'] font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                    title="Prendre en charge cette réservation"
                                  >
                                    <UserPlus className="w-3 h-3 text-[#16A34A]" />
                                    <span>Prendre en charge</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                                    Non assigné
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3.5 text-right min-w-[125px] whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1 font-['Outfit']">
                                  {isAbonnementBooking(b) && (
                                    <button
                                      type="button"
                                      onClick={() => handleGoToSubscription(b.client_name)}
                                      className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-[#0D5C3A] hover:text-white text-[#0D5C3A] border border-emerald-300 flex items-center justify-center cursor-pointer transition-colors"
                                      title="Ouvrir le suivi de l'abonnement"
                                    >
                                      <Repeat className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <a
                                    href={getReviewWhatsAppUrl(b)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-7 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 text-[11px] font-bold font-['Outfit'] shadow-2xs transition-colors"
                                    title="Envoyer une demande d'avis 5 étoiles par WhatsApp au client"
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                    <span>Avis</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingDetails(b)}
                                    className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Voir les détails complets de la fiche"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Détails</span>
                                  </button>

                                  <a
                                    href={`https://wa.me/${b.client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${b.client_name}, nous confirmons votre intervention TAARU SET pour ${b.service_type} à ${b.quarter}.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 flex items-center justify-center transition-colors"
                                    title="Contacter sur WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-[#16A34A]" />
                                  </a>

                                  <a
                                    href={`tel:${b.client_phone?.replace(/\s+/g, '')}`}
                                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                                    title="Appeler le client"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                                  </a>

                                  {canDeleteBookings && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBooking(b.id)}
                                      className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Supprimer la réservation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 2 : SUIVI DES ABONNEMENTS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none font-['Outfit'] text-xs">
                  {[
                    { id: 'all', label: 'Tous les abonnements', count: subscriptions.length },
                    { id: 'actif', label: 'En cours', count: subscriptions.filter(s => s.status === 'actif').length },
                    { id: 'complete', label: 'Mois terminés', count: subscriptions.filter(s => s.status === 'complete').length },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSubFilter(f.id)}
                      className={`h-9 px-3.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                        subFilter === f.id
                          ? 'bg-[#0D5C3A] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        subFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Recherche abonné, téléphone, quartier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 focus:outline-none focus:border-[#0D5C3A] shadow-xs font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {filteredSubscriptions.length === 0 ? (
                <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto">
                    <Repeat className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-['Outfit'] font-bold text-slate-800 text-sm">Aucun abonnement enregistré</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Les abonnements récurrents (4 passages / mois) s'affichent ici. Vous pouvez en créer un manuellement avec le bouton ci-dessous.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewSubModalOpen(true)}
                    className="h-10 px-4 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-['Outfit'] font-bold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvel Abonnement (4 passages)</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* --- VUE MOBILE : CARTES COMPACTES --- */}
                  <div className="md:hidden space-y-3">
                    {filteredSubscriptions.map((sub) => {
                      const completedPassages = [1, 2, 3, 4].filter(n => sub[`passage_${n}_status`] === 'effectue').length;
                      const isClosed = sub.is_closed || sub.status === 'complete';
                      const isDisabled = isClosed;

                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-['Outfit'] font-bold text-base text-slate-900">{sub.client_name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-bold border ${
                                  isClosed
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : completedPassages === 4
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                    : completedPassages > 0
                                    ? 'bg-emerald-50 text-[#0D5C3A] border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {isClosed ? '✓ Mois Clôturé (4/4)' : completedPassages === 4 ? '4/4 Validés • À clôturer' : completedPassages > 0 ? `En cours (${completedPassages}/4)` : 'À venir (0/4)'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#0D5C3A] shrink-0" />
                                <span>{sub.quarter || 'Dakar'}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{sub.plan_name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-['Outfit'] font-black text-sm text-[#0D5C3A] tabular-nums">
                                {formatPrice(sub.price_fcfa)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(sub.client_phone, sub.id)}
                              className={`h-8 px-2 rounded-xl text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1 border transition-colors ${
                                copiedId === sub.id
                                  ? 'bg-emerald-50 border-emerald-300 text-[#0D5C3A]'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {copiedId === sub.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                  <span className="text-[10px]">Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-[10px]">Copier</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`tel:${sub.client_phone?.replace(/\s+/g, '')}`}
                              className="h-8 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                              <span className="text-[10px]">Appel</span>
                            </a>

                            <a
                              href={`https://wa.me/${sub.client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${sub.client_name}, nous vous contactons pour le suivi de votre abonnement TAARU SET (${sub.plan_name}).`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0D5C3A] text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="text-[10px]">WhatsApp</span>
                            </a>
                          </div>

                          {/* LES 4 PASSAGES TACTILES COMPACTS SANS SCROLL */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-['Outfit'] font-bold text-slate-600">
                              <span>4 Passages du mois :</span>
                              <span className="text-[#0D5C3A] tabular-nums">{completedPassages}/4 validés</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {[1, 2, 3, 4].map((num) => {
                                const isDone = sub[`passage_${num}_status`] === 'effectue';
                                const dateLabel = sub[`passage_${num}_date`] || `P${num}`;

                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => !isDisabled && handleTogglePassageStatus(sub.id, num, sub[`passage_${num}_status`])}
                                    className={`py-2 px-1 rounded-xl text-center text-xs font-['Outfit'] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                                      isDisabled ? 'cursor-not-allowed opacity-75 pointer-events-none select-none' : 'cursor-pointer'
                                    } ${
                                      isDone
                                        ? 'bg-emerald-50 border-emerald-300 text-[#0D5C3A] shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                    }`}
                                    title={isDisabled ? "Abonnement clôturé (verrouillé)" : "Cliquer pour valider/annuler"}
                                  >
                                    <div className="flex items-center gap-1">
                                      {isDone ? (
                                        <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                      ) : (
                                        <Circle className="w-3 h-3 text-slate-400" />
                                      )}
                                      <span className="text-[11px]">P{num}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-medium truncate max-w-full">
                                      {dateLabel.replace(/Passage \d/, '').trim() || dateLabel}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* BOUTON DE CLÔTURE DÉFINITIVE DU MOIS SI 4/4 ATTEINTS */}
                            {completedPassages === 4 && !isClosed && (
                              <button
                                type="button"
                                onClick={() => handleConfirmCloseSubscription(sub.id)}
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#0D5C3A] hover:from-emerald-700 hover:to-[#094129] text-white font-['Outfit'] font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all animate-pulse"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                <span>🔒 Confirmer & Clôturer Définitivement le Mois (4/4)</span>
                              </button>
                            )}

                            {isClosed && (
                              <div className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0D5C3A] text-center font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                <span>Mois 100% complété & clôturé (4/4 validés)</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-medium">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-[#0D5C3A]" />
                              <span>Géré par : <strong className="text-slate-700">{sub.processed_by_name || 'Équipe'}</strong></span>
                            </span>
                            {canDeleteBookings && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="text-slate-400 hover:text-rose-600 font-bold"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* --- VUE DESKTOP : TABLEAU SYNTHÉTIQUE COMPACT --- */}
                  <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-5">Abonné & Contact</th>
                          <th className="py-3.5 px-5">Formule & Quartier</th>
                          <th className="py-3.5 px-5">Progression</th>
                          <th className="py-3.5 px-5 text-center">Validation Directe des 4 Passages</th>
                          <th className="py-3.5 px-5">Géré par</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredSubscriptions.map((sub) => {
                          const completedPassages = [1, 2, 3, 4].filter(n => sub[`passage_${n}_status`] === 'effectue').length;
                          const isClosed = sub.is_closed || sub.status === 'complete';
                          const isDisabled = isClosed;

                          return (
                            <tr key={sub.id} className="hover:bg-emerald-50/20 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-['Outfit'] font-bold text-slate-900 text-sm">{sub.client_name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-slate-600 text-xs font-medium tabular-nums">{sub.client_phone}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(sub.client_phone, sub.id)}
                                    className="text-slate-400 hover:text-[#0D5C3A] cursor-pointer"
                                    title="Copier le numéro"
                                  >
                                    {copiedId === sub.id ? (
                                      <span className="text-[10px] text-[#16A34A] font-bold">Copié !</span>
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-5">
                                <div className="font-bold text-slate-800 text-xs">{sub.plan_name}</div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                  <span>{sub.quarter}</span>
                                  <span>•</span>
                                  <span className="font-['Outfit'] font-bold text-[#0D5C3A]">{formatPrice(sub.price_fcfa)}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] rounded-full"
                                      style={{ width: `${(completedPassages / 4) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-['Outfit'] font-bold text-xs text-slate-700 tabular-nums">
                                    {completedPassages}/4
                                  </span>
                                </div>
                                {isClosed ? (
                                  <span className="inline-block mt-1 text-[10px] font-['Outfit'] font-bold text-[#0D5C3A] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    ✓ Clôturé
                                  </span>
                                ) : completedPassages === 4 ? (
                                  <span className="inline-block mt-1 text-[10px] font-['Outfit'] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 animate-pulse">
                                    4/4 À clôturer
                                  </span>
                                ) : null}
                              </td>

                              <td className="py-3.5 px-5 text-center">
                                <div className="inline-flex flex-col items-center gap-1.5">
                                  <div className="inline-flex items-center gap-1.5">
                                    {[1, 2, 3, 4].map((num) => {
                                      const isDone = sub[`passage_${num}_status`] === 'effectue';
                                      const dateLabel = sub[`passage_${num}_date`] || `P${num}`;

                                      return (
                                        <button
                                          key={num}
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => !isDisabled && handleTogglePassageStatus(sub.id, num, sub[`passage_${num}_status`])}
                                          className={`h-8 px-2.5 rounded-lg text-xs font-['Outfit'] font-bold flex items-center gap-1 border transition-all ${
                                            isDisabled ? 'cursor-not-allowed opacity-75 pointer-events-none select-none' : 'cursor-pointer'
                                          } ${
                                            isDone
                                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-[#0D5C3A] shadow-xs'
                                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                                          }`}
                                          title={isDisabled ? "Abonnement clôturé (verrouillé)" : "Cliquer pour valider/annuler"}
                                        >
                                          {isDone ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                          ) : (
                                            <Circle className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                          <span>P{num}</span>
                                          <span className="text-[10px] text-slate-400 font-medium">
                                            {dateLabel.replace(/Passage \d/, '').trim()}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {completedPassages === 4 && !isClosed && (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmCloseSubscription(sub.id)}
                                      className="h-7 px-3 rounded-lg bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer animate-pulse transition-all mt-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                                      <span>🔒 Clôturer le mois (4/4)</span>
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-5">
                                <div className="text-xs font-semibold text-slate-800">
                                  {sub.processed_by_name || 'Équipe TAARU SET'}
                                </div>
                                {sub.processed_at && (
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(sub.processed_at).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5 font-['Outfit']">
                                  <a
                                    href={`tel:${sub.client_phone?.replace(/\s+/g, '')}`}
                                    className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                                    title="Appeler"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                                    <span>Appel</span>
                                  </a>

                                  <a
                                    href={`https://wa.me/${sub.client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${sub.client_name}, nous faisons le suivi de vos passages TAARU SET.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-bold flex items-center gap-1"
                                    title="WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </a>

                                  {canDeleteBookings && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubscription(sub.id)}
                                      className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 3 : RÉPERTOIRE CLIENTS (CRM) - RESPONSIVE MOBILE SANS DÉBORDEMENT  */}
          {/* ========================================================================= */}
          {activeTab === 'clients' && canViewCRM && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-['Outfit'] font-bold text-base text-slate-900">Portefeuille Clients Dakar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Contacts réguliers qualifiés et historique d'interventions</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] font-['Outfit'] font-black text-sm border border-emerald-200">
                  {clients.length} Clients
                </span>
              </div>

              {/* --- VUE MOBILE : CARTES TACTILES CLIENTS (< md) --- */}
              <div className="md:hidden space-y-3.5">
                {clients.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6 shadow-xs font-medium">
                    Aucun contact client enregistré. Les clients sont créés automatiquement lors de chaque réservation.
                  </div>
                ) : (
                  clients.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] font-['Outfit'] font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {c.full_name ? c.full_name.slice(0, 2).toUpperCase() : 'CL'}
                          </div>
                          <div>
                            <div className="font-['Outfit'] font-bold text-slate-900 text-sm">{c.full_name}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-[#0D5C3A]" />
                              <span>{c.quarter || c.preferred_quarter || 'Dakar'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase font-['Outfit']">Total Dépensé</div>
                          <div className="font-['Outfit'] font-black text-sm text-[#0D5C3A] tabular-nums">
                            {formatPrice(c.total_spent_fcfa)}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 text-[11px]">Commandes : </span>
                          <span className="font-['Outfit'] font-bold text-slate-900">{c.total_orders || 1} passée(s)</span>
                        </div>
                        <div className="font-['Outfit'] font-bold text-slate-800 text-xs tabular-nums">
                          {c.phone}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(c.phone, c.id)}
                          className={`h-8 px-2 rounded-xl text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1 border transition-colors ${
                            copiedId === c.id
                              ? 'bg-emerald-50 border-emerald-300 text-[#0D5C3A]'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                        >
                          {copiedId === c.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                              <span className="text-[10px]">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[10px]">Copier</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`tel:${c.phone?.replace(/\s+/g, '')}`}
                          className="h-8 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                          <span className="text-[10px]">Appel</span>
                        </a>

                        <a
                          href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${c.full_name}, l'équipe TAARU SET vous salue.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0D5C3A] text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[10px]">WhatsApp</span>
                        </a>
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* --- VUE DESKTOP : TABLEAU COMPLET (>= md) --- */}
              <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-['Outfit'] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Nom du client</th>
                      <th className="py-3.5 px-5">Téléphone direct</th>
                      <th className="py-3.5 px-5">Quartier habituel</th>
                      <th className="py-3.5 px-5">Total Commandes</th>
                      <th className="py-3.5 px-5">Montant cumulé</th>
                      <th className="py-3.5 px-5 text-right">Contacter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          Aucun contact client enregistré.
                        </td>
                      </tr>
                    ) : (
                      clients.map((c) => (
                        <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="py-4 px-5 font-['Outfit'] font-bold text-slate-900 text-sm">{c.full_name}</td>
                          
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-700">{c.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(c.phone, c.id)}
                                className="text-slate-400 hover:text-[#0D5C3A] cursor-pointer"
                                title="Copier le numéro"
                              >
                                {copiedId === c.id ? (
                                  <span className="text-[10px] text-[#16A34A] font-bold">Copié !</span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-slate-600">{c.quarter || c.preferred_quarter || 'Dakar'}</td>
                          <td className="py-4 px-5 font-['Outfit'] font-bold text-slate-900 tabular-nums">{c.total_orders || 1}</td>
                          <td className="py-4 px-5 font-['Outfit'] font-extrabold text-[#0D5C3A] tabular-nums">{formatPrice(c.total_spent_fcfa)}</td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2 font-['Outfit']">
                              <a
                                href={`tel:${c.phone?.replace(/\s+/g, '')}`}
                                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                                <span>Appel</span>
                              </a>
                              <a
                                href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${c.full_name}, l'équipe TAARU SET vous salue.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
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
          {/* ONGLET 4 : STATISTIQUES & BILAN FINANCIER                                 */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && canViewStats && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Chiffre d'Affaires Réalisé</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-black text-[#0D5C3A] mt-2 tabular-nums">
                    {formatPrice(stats.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">{stats.completedCount} prestations encaissées</div>
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
                  <div className="text-[11px] font-['Outfit'] font-bold uppercase tracking-wider text-slate-400">Abonnements Récurrents</div>
                  <div className="text-xl sm:text-2xl font-['Outfit'] font-extrabold text-purple-700 mt-2 tabular-nums">
                    {formatPrice(stats.monthlyRecurringRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">{stats.activeSubCount} abonnés réguliers</div>
                </div>
              </div>

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

            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET 5 : GESTION ÉQUIPE UNIVERSELLE (Super Admin Uniquement)            */}
          {/* ========================================================================= */}
          {activeTab === 'team' && canManageTeam && (
            <div className="space-y-6">

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

                <form onSubmit={handleAddTeamMember} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                  </div>

                  {/* SÉLECTEUR DE MÉTHODE D'ACCRÉDITATION */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-2">
                      Mode d'attribution du mot de passe
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* OPTION 1 : RECOMMANDÉE (WhatsApp / SMS) - 100% FIABLE ET IMMÉDIAT */}
                      <button
                        type="button"
                        onClick={() => {
                          setProvisionMode('manual');
                          if (!newMemberPassword) setNewMemberPassword(generateStrongPassword());
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
                          provisionMode === 'manual'
                            ? 'bg-emerald-50/80 border-[#0D5C3A] ring-1 ring-[#0D5C3A]/30 text-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                          provisionMode === 'manual' ? 'border-[#0D5C3A] bg-[#0D5C3A]' : 'border-slate-300 bg-white'
                        }`}>
                          {provisionMode === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-['Outfit'] font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>Mot de passe temporaire (WhatsApp / SMS)</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-[#0D5C3A] font-extrabold uppercase">Recommandé • 100% Immédiat</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Génère un mot de passe temporaire robuste à transmettre en 1 clic par WhatsApp. Zéro dépendance email, fonctionne instantanément sans blocage. Le collaborateur pourra le changer dès sa connexion.
                          </p>
                        </div>
                      </button>

                      {/* OPTION 2 : INVITATION PAR EMAIL */}
                      <button
                        type="button"
                        onClick={() => setProvisionMode('invite')}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
                          provisionMode === 'invite'
                            ? 'bg-emerald-50/80 border-[#0D5C3A] ring-1 ring-[#0D5C3A]/30 text-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                          provisionMode === 'invite' ? 'border-[#0D5C3A] bg-[#0D5C3A]' : 'border-slate-300 bg-white'
                        }`}>
                          {provisionMode === 'invite' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-['Outfit'] font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>Invitation Privée par Email</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-extrabold uppercase">Option Email</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Envoie un email automatique pour créer son mot de passe. Nécessite que le quota email Supabase ne soit pas dépassé.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-['Outfit'] font-bold text-slate-700 mb-1">Rôle & Droits accordés</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-bold font-['Outfit']"
                      >
                        <option value="agent">Chef d'Équipe Terrain (Planning uniquement)</option>
                        <option value="sales">Chargé(e) Clientèle (Planning + CRM Clients)</option>
                        <option value="admin">Responsable Opérations (Planning + CRM + Bilan)</option>
                        <option value="super_admin">Super-Admin / Direction (Accès total absolu)</option>
                      </select>
                    </div>

                    {provisionMode === 'manual' ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-['Outfit'] font-bold text-slate-700">Mot de passe temporaire fort</label>
                          <button
                            type="button"
                            onClick={() => setNewMemberPassword(generateStrongPassword())}
                            className="text-[10px] text-[#0D5C3A] hover:underline font-bold cursor-pointer"
                          >
                            Régénérer
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showNewMemberPassword ? "text" : "password"}
                            required
                            minLength={8}
                            placeholder="Min. 8 caractères"
                            value={newMemberPassword}
                            onChange={(e) => setNewMemberPassword(e.target.value)}
                            className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewMemberPassword(!showNewMemberPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-slate-700 font-medium">
                        <span className="font-bold text-[#0D5C3A] flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-[#16A34A]" />
                          Invitation Confidentielle :
                        </span>
                        <span>Le membre définira lui-même son mot de passe secret via l'email officiel d'activation.</span>
                      </div>
                    )}

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full h-10 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs transition-colors cursor-pointer shadow-md shadow-[#0D5C3A]/20 flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{provisionMode === 'invite' ? "Envoyer l'Invitation Officielle" : "Accréditer le Membre"}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* BANNIÈRE SUCCÈS AVEC ACCÈS COPIABLES ET TRANSMISSION WHATSAPP */}
                {createdMemberSuccess && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-400 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                        <div>
                          <h5 className="font-['Outfit'] font-bold text-sm text-slate-900">
                            {createdMemberSuccess.mode === 'invite'
                              ? `Invitation confidentielle expédiée à ${createdMemberSuccess.name} !`
                              : `Compte prêt avec mot de passe temporaire pour ${createdMemberSuccess.name} !`}
                          </h5>
                          <p className="text-xs text-slate-600">
                            {createdMemberSuccess.mode === 'invite'
                              ? `Compte accrédité pour ${createdMemberSuccess.email}. Transmettez-lui ses accès directement par WhatsApp ci-dessous.`
                              : `Transmettez ce mot de passe temporaire sécurisé au collaborateur. Il pourra le modifier dès sa première connexion.`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreatedMemberSuccess(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {createdMemberSuccess.emailNotice && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                        ⚠️ {createdMemberSuccess.emailNotice}
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1.5 font-['Outfit']">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Lien de connexion :</span>
                        <span className="font-bold text-[#0D5C3A] select-all">{getAuthRedirectUrl()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email accrédité :</span>
                        <span className="font-bold text-slate-900 select-all">{createdMemberSuccess.email}</span>
                      </div>
                      {createdMemberSuccess.password ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Mot de passe temporaire fort :</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                            {createdMemberSuccess.password}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Mot de passe confidentiel :</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Défini personnellement par l'utilisateur via son email
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const adminUrl = getAuthRedirectUrl();
                          const text = createdMemberSuccess.password
                            ? `Bonjour ${createdMemberSuccess.name},\n\nVoici tes accès au portail opérationnel TAARU SET :\n🌐 Lien : ${adminUrl}\n📧 Email : ${createdMemberSuccess.email}\n🔑 Mot de passe temporaire : ${createdMemberSuccess.password}\n\nTu pourras changer ton mot de passe dès ta connexion.`
                            : `Bonjour ${createdMemberSuccess.name},\n\nTu as été accrédité sur le portail TAARU SET :\n🌐 Lien : ${adminUrl}\n📧 Email : ${createdMemberSuccess.email}\n\nUn email sécurisé vient de t'être expédié pour définir ton mot de passe personnel en toute confidentialité. Clique sur le lien reçu dans ta boîte email.`;
                          navigator.clipboard.writeText(text);
                          alert("Message d'invitation copié dans le presse-papier !");
                        }}
                        className="h-9 px-3.5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le message d'invitation</span>
                      </button>

                      {createdMemberSuccess.phone && (
                        <a
                          href={`https://wa.me/${createdMemberSuccess.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            createdMemberSuccess.password
                              ? `Bonjour ${createdMemberSuccess.name},\n\nVoici tes accès au portail opérationnel TAARU SET :\n🌐 Lien : ${getAuthRedirectUrl()}\n📧 Identifiant : ${createdMemberSuccess.email}\n🔑 Mot de passe temporaire : ${createdMemberSuccess.password}\n\nTu peux te connecter dès maintenant pour gérer tes interventions.`
                              : `Bonjour ${createdMemberSuccess.name},\n\nTu as été accrédité sur le portail TAARU SET :\n🌐 Lien : ${getAuthRedirectUrl()}\n📧 Email : ${createdMemberSuccess.email}\n\nUn email t'a été expédié pour définir ton mot de passe personnel en toute confidentialité.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-3.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#0D5C3A] font-['Outfit'] font-bold text-xs flex items-center gap-1.5 border border-emerald-300 shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Transmettre par WhatsApp ➔</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {passwordResetSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold font-['Outfit'] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>{passwordResetSuccessMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordResetSuccessMsg('')}
                      className="text-emerald-700 hover:text-emerald-950 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* --- VUE MOBILE : CARTES TACTILES COLLABORATEURS (< md) --- */}
              <div className="md:hidden space-y-3.5">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] font-['Outfit'] font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {m.full_name ? m.full_name.slice(0, 2).toUpperCase() : 'TS'}
                        </div>
                        <div>
                          <div className="font-['Outfit'] font-bold text-slate-900 text-sm">{m.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{m.job_title || 'Collaborateur TAARU SET'}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-['Outfit'] font-extrabold border ${getRoleBadge(m.role)}`}>
                        {getRoleLabel(m.role)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-[11px]">Email :</span>
                        <span className="font-semibold text-slate-800 text-[11px] select-all truncate max-w-[200px]">{m.email}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 font-medium text-[11px]">Téléphone :</span>
                        <span className="font-['Outfit'] font-bold text-slate-900 text-xs">{m.phone || 'Non renseigné'}</span>
                      </div>
                    </div>

                    {m.phone && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(m.phone, m.id)}
                          className={`h-8 px-2 rounded-xl text-xs font-['Outfit'] font-bold flex items-center justify-center gap-1 border transition-colors ${
                            copiedId === m.id
                              ? 'bg-emerald-50 border-emerald-300 text-[#0D5C3A]'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                              <span className="text-[10px]">Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[10px]">Copier</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`tel:${m.phone?.replace(/\s+/g, '')}`}
                          className="h-8 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                          <span className="text-[10px]">Appel</span>
                        </a>

                        <a
                          href={`https://wa.me/${m.phone?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0D5C3A] text-xs font-bold font-['Outfit'] flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="text-[10px]">WhatsApp</span>
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${m.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-[#16A34A]' : 'bg-slate-300'}`}></span>
                        {m.is_active ? 'Compte Actif' : 'Suspendu'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setEditingPasswordMember(m); setNewPasswordInput(''); }}
                          className="h-7 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] text-[11px] font-bold font-['Outfit'] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Modifier le mot de passe"
                        >
                          <KeyRound className="w-3 h-3 text-[#16A34A]" />
                          <span>Accès</span>
                        </button>

                        {m.email !== 'ssow2006@gmail.com' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleMemberActive(m.id, m.is_active, m.email)}
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold font-['Outfit'] cursor-pointer transition-colors ${
                                m.is_active
                                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-[#0D5C3A] hover:bg-emerald-100'
                              }`}
                            >
                              {m.is_active ? 'Suspendre' : 'Réactiver'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTeamMember(m.id, m.email)}
                              className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                              title="Révoquer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">Direction</span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* --- VUE DESKTOP : TABLEAU COMPLET (>= md) --- */}
              <div className="hidden md:block border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-xs">
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
                            <div className="flex items-center gap-2">
                              <span>{m.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPhone(m.phone, m.id)}
                                className="text-slate-400 hover:text-[#0D5C3A] cursor-pointer"
                                title="Copier le numéro"
                              >
                                {copiedId === m.id ? (
                                  <span className="text-[10px] text-[#16A34A] font-bold">Copié !</span>
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <a
                                href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0D5C3A] hover:underline font-bold"
                                title="WhatsApp direct"
                              >
                                <MessageSquare className="w-3.5 h-3.5 inline text-[#16A34A]" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Non renseigné</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-['Outfit'] font-bold border ${getRoleBadge(m.role)}`}>
                            {getRoleLabel(m.role)}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-['Outfit'] ${
                            m.is_active ? 'bg-emerald-50 text-[#0D5C3A]' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? 'bg-[#16A34A]' : 'bg-slate-400'}`}></span>
                            {m.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-['Outfit']">
                            <button
                              type="button"
                              onClick={() => { setEditingPasswordMember(m); setNewPasswordInput(''); }}
                              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#0D5C3A] text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                              title="Définir un nouveau mot de passe"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#0D5C3A]" />
                              <span>Mot de passe</span>
                            </button>

                            {m.email !== 'ssow2006@gmail.com' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberActive(m.id, m.is_active, m.email)}
                                  className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    m.is_active
                                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-[#0D5C3A] hover:bg-emerald-100'
                                  }`}
                                >
                                  {m.is_active ? 'Suspendre' : 'Réactiver'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeamMember(m.id, m.email)}
                                  className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Supprimer l'accès"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs italic font-medium px-2">Direction</span>
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

          {/* ========================================================================= */}
          {/* ONGLET AVIS & NOTATIONS CLIENTS VÉRIFIÉS (DEMANDÉ PAR MAMADOU)             */}
          {/* ========================================================================= */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">

              {/* 1. 4 CARTES STATISTIQUES & LIEN PUBLIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Carte 1 : Note Globale */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-['Outfit'] font-bold text-slate-500 uppercase tracking-wider">Note Moyenne</span>
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">{reviewsStats.avg}</span>
                    <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[10px] text-slate-400 font-bold ml-1">({reviewsStats.total} avis)</span>
                  </div>
                </div>

                {/* Carte 2 : Taux de Recommandation */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-['Outfit'] font-bold text-slate-500 uppercase tracking-wider">Recommandation</span>
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-['Outfit'] font-black text-[#0D5C3A] tracking-tight">{reviewsStats.recommendRate}%</span>
                    <span className="text-xs font-bold text-emerald-600">des clients</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Recommandent TAARU SET à leurs proches</p>
                </div>

                {/* Carte 3 : Avis Publiés en Ligne */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-['Outfit'] font-bold text-slate-500 uppercase tracking-wider">En Ligne sur le Site</span>
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">{reviewsStats.approvedCount}</span>
                    <span className="text-xs font-bold text-slate-400">visibles</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-500 font-medium">Section Témoignages taaruset.com</span>
                  </div>
                </div>

                {/* Carte 4 : Lien Public de Notation */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-300 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-['Outfit'] font-bold text-[#0D5C3A] uppercase tracking-wider">Lien Public Avis</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0D5C3A] text-[9px] font-extrabold">Partageable</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-1">À partager sur WhatsApp ou par SMS à n'importe quel client</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyGeneralReviewLink}
                    className="w-full h-9 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedReviewLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Lien Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le Lien Public</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* 2. BARRE D'ACTIONS, RECHERCHE & FILTRES */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewsSearch}
                    onChange={(e) => setReviewsSearch(e.target.value)}
                    placeholder="Rechercher par client, quartier, service ou commentaire..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A] font-medium"
                  />
                  {reviewsSearch && (
                    <button
                      type="button"
                      onClick={() => setReviewsSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-['Outfit']">
                  <button
                    type="button"
                    onClick={() => setReviewsFilter('all')}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      reviewsFilter === 'all'
                        ? 'bg-[#0D5C3A] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Tous ({reviewsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewsFilter('approved')}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      reviewsFilter === 'approved'
                        ? 'bg-[#0D5C3A] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    En ligne ({reviewsStats.approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewsFilter('pending')}
                    className={`h-9 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      reviewsFilter === 'pending'
                        ? 'bg-[#0D5C3A] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Masqués ({reviewsList.length - reviewsStats.approvedCount})
                  </button>
                </div>
              </div>

              {/* 3. LISTE DES AVIS (DESKTOP TABLE & MOBILE CARDS) */}
              {filteredReviews.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                  <h4 className="font-['Outfit'] font-bold text-base text-slate-900">Aucun avis trouvé</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {reviewsSearch
                      ? `Aucun retour client ne correspond à "${reviewsSearch}".`
                      : "Les avis laissés par vos clients apparaîtront ici dès qu'ils auront cliqué sur le lien WhatsApp."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                  
                  {/* Vue Mobile : Cartes */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredReviews.map((r) => (
                      <div key={r.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-['Outfit'] font-bold text-sm text-slate-900">{r.client_name}</h5>
                              {r.is_verified && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0D5C3A] text-[9px] font-extrabold">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>Vérifié</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.quarter ? `${r.quarter} • ` : ''}{r.service_type || 'Prestation TAARU SET'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-800 text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{r.rating}/5</span>
                          </div>
                        </div>

                        {r.comment && (
                          <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{r.comment}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-['Outfit'] pt-1">
                          <span>{new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${r.status === 'approved' ? 'bg-emerald-100 text-[#0D5C3A]' : 'bg-slate-100 text-slate-600'}`}>
                            {r.status === 'approved' ? '✓ Visible en ligne' : 'Masqué du site'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 font-['Outfit']">
                          {r.client_phone && (
                            <a
                              href={getThankYouWhatsAppUrl(r)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#16A34A]" />
                              <span>Remercier (WhatsApp)</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleReviewStatus(r.id, r.status)}
                            className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            {r.status === 'approved' ? 'Masquer' : 'Publier'}
                          </button>
                          {canDeleteBookings && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(r.id)}
                              className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vue Desktop : Tableau Haute Densité */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200/80 font-['Outfit'] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Client & Localisation</th>
                          <th className="py-3 px-4">Prestation Évaluée</th>
                          <th className="py-3 px-4">Note & Recommandation</th>
                          <th className="py-3 px-4">Commentaire Client</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Visibilité Site</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredReviews.map((r, idx) => (
                          <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                            
                            <td className="py-3.5 px-4 font-['Outfit']">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{r.client_name}</span>
                                {r.is_verified && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0D5C3A] text-[9px] font-extrabold">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Vérifié</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {r.quarter || 'Dakar'} {r.client_phone ? `• ${r.client_phone}` : ''}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-['Outfit'] font-semibold text-slate-800 text-xs">
                                {r.service_type || 'Prestation TAARU SET'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= (Number(r.rating) || 5)
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'fill-slate-200 text-slate-200'
                                    }`}
                                  />
                                ))}
                                <span className="font-['Outfit'] font-extrabold text-slate-800 text-xs ml-1">{r.rating}/5</span>
                              </div>
                              {r.recommend !== false && (
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                  ✓ Recommande TAARU SET
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              {r.comment ? (
                                <p className="text-xs text-slate-700 italic line-clamp-2" title={r.comment}>
                                  "{r.comment}"
                                </p>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Aucun commentaire textuel</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500 font-['Outfit']">
                              {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-['Outfit']">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                                r.status === 'approved'
                                  ? 'bg-emerald-100 text-[#0D5C3A] border border-emerald-300/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300/60'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'approved' ? 'bg-[#16A34A]' : 'bg-slate-400'}`}></span>
                                <span>{r.status === 'approved' ? 'Visible en Ligne' : 'Masqué'}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-['Outfit']">
                              <div className="flex items-center justify-end gap-1.5">
                                {r.client_phone && (
                                  <a
                                    href={getThankYouWhatsAppUrl(r)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                    title="Envoyer un message de remerciement au client sur WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3 text-[#16A34A]" />
                                    <span>Remercier</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleToggleReviewStatus(r.id, r.status)}
                                  className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                    r.status === 'approved'
                                      ? 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-[#0D5C3A] border-emerald-300'
                                  }`}
                                  title={r.status === 'approved' ? 'Masquer cet avis du site public' : 'Publier cet avis sur le site public'}
                                >
                                  {r.status === 'approved' ? 'Masquer' : 'Publier'}
                                </button>

                                {canDeleteBookings && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(r.id)}
                                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Supprimer cet avis définitivement"
                                  >
                                    <Trash2 className="w-3 h-3" />
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
          )}

        </main>
      </div>

      {/* MODALE DE GESTION DU MOT DE PASSE D'UN COLLABORATEUR */}
      {editingPasswordMember && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) { setEditingPasswordMember(null); setNewPasswordInput(''); } }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 font-['Outfit']"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Modifier le mot de passe</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Collaborateur : {editingPasswordMember.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEditingPasswordMember(null); setNewPasswordInput(''); }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email de connexion :</span>
                <span className="font-bold text-slate-900">{editingPasswordMember.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rôle :</span>
                <span className="font-semibold text-[#0D5C3A]">{getRoleLabel(editingPasswordMember.role)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-[#0D5C3A] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Option 1 (Recommandée • Confidentielle) :</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  Envoyer un lien officiel par email pour que le collaborateur définisse lui-même son mot de passe en toute confidentialité (zéro connaissance admin).
                </p>
                <button
                  type="button"
                  onClick={() => handleSendResetEmail(editingPasswordMember.email)}
                  className="w-full h-9 rounded-xl bg-white hover:bg-emerald-50 text-[#0D5C3A] border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Envoyer l'invitation par email</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Option 2 : Mot de passe temporaire fort</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateStrongPassword())}
                    className="text-[10px] text-[#0D5C3A] hover:underline font-bold cursor-pointer"
                  >
                    Générer mot de passe fort
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Min. 8 caractères"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0D5C3A]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditingPasswordMember(null); setNewPasswordInput(''); }}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={!newPasswordInput || newPasswordInput.length < 6}
                onClick={() => handleResetMemberPassword(editingPasswordMember.email, newPasswordInput)}
                className="h-10 px-5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Enregistrer le mot de passe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE AUTONOME : MODIFIER MON MOT DE PASSE (MON PROFIL) */}
      {isSelfPasswordModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsSelfPasswordModalOpen(false); }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 font-['Outfit']"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Modifier mon mot de passe</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Confidentiel • {session?.user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelfPasswordModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selfPasswordMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{selfPasswordMsg}</span>
              </div>
            )}

            {selfPasswordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{selfPasswordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSelfPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe personnel</label>
                <div className="relative">
                  <input
                    type={showSelfPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Min. 8 caractères"
                    value={selfNewPassword}
                    onChange={(e) => setSelfNewPassword(e.target.value)}
                    className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfPassword(!showSelfPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSelfPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type={showSelfPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Confirmez le nouveau mot de passe"
                  value={selfNewPasswordConfirm}
                  onChange={(e) => setSelfNewPasswordConfirm(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0D5C3A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelfPasswordModalOpen(false)}
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={selfPasswordLoading || !selfNewPassword || selfNewPassword.length < 8}
                  className="h-10 px-5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {selfPasswordLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-300" />
                  )}
                  <span>Enregistrer mon mot de passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALE DÉTAILS COMPLETS DE COMMANDE (AUDITÉE & LOGIQUE PARFAITE)       */}
      {/* ========================================================================= */}
      {selectedBookingDetails && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedBookingDetails(null); }}
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg h-[92vh] sm:h-auto sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            
            {/* EN-TÊTE FIXE STICKY AVEC BOUTON FERMER TRÈS CLAIR */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-20 shadow-2xs">
              <div>
                <span className="text-[10px] font-['Outfit'] font-bold text-[#0D5C3A] uppercase tracking-wider">Fiche d'Intervention Complète</span>
                <h3 className="text-xl font-['Outfit'] font-black text-slate-900 mt-0.5">{selectedBookingDetails.client_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingDetails(null)}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer text-xs font-['Outfit'] font-extrabold transition-colors border border-slate-300 shadow-xs"
                title="Fermer cette fiche (ou touche Échap)"
              >
                <X className="w-4 h-4 text-slate-600" />
                <span>✕ Fermer</span>
              </button>
            </div>

            {/* CORPS DE LA FICHE DÉFILABLE SANS SORTIR DE L'ÉCRAN */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 flex-1 text-xs">
              {(() => {
                const parsedDetails = parseServiceDetails(selectedBookingDetails.service_details);
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Service principal :</span>
                      <span className="font-bold text-slate-900">{selectedBookingDetails.service_type}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-start justify-between gap-3">
                      <span className="text-slate-500 font-medium shrink-0">Formule demandée :</span>
                      <span className="font-bold text-slate-800 text-right">
                        {parsedDetails.plan || selectedBookingDetails.service_details}
                      </span>
                    </div>

                    {parsedDetails.time && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Créneau d'intervention :</span>
                        <span className="font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                          {parsedDetails.time}
                        </span>
                      </div>
                    )}

                    {parsedDetails.dates && parsedDetails.dates.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                          <span>Dates retenues des 4 passages :</span>
                          <span className="text-[10px] text-[#0D5C3A] font-bold">{parsedDetails.dates.length}/4 dates</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                          {parsedDetails.dates.map((d, i) => (
                            <div key={i} className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0D5C3A] text-center font-['Outfit'] font-bold text-[11px]">
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Montant convenu :</span>
                      <span className="font-['Outfit'] font-black text-base text-[#0D5C3A] tabular-nums">
                        {formatPrice(selectedBookingDetails.estimated_price_fcfa)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ENCADRÉ SPÉCIFIQUE SI C'EST UN ABONNEMENT */}
              {isAbonnementBooking(selectedBookingDetails) && (() => {
                const sub = findSubscriptionForBooking(selectedBookingDetails);
                const done = sub ? [1, 2, 3, 4].filter(n => sub[`passage_${n}_status`] === 'effectue').length : 0;
                const isClosed = sub?.is_closed || sub?.status === 'complete';
                const isDisabled = isClosed;

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#0D5C3A] text-white flex items-center justify-center shadow-xs">
                          <Repeat className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-['Outfit'] font-black text-slate-900 text-xs">Formule Abonnement Mensuel</div>
                          <div className="text-[10px] text-slate-500 font-medium">Contrat récurrent 4 passages / mois</div>
                        </div>
                      </div>
                      {sub && (
                        <span className={`font-['Outfit'] font-black text-xs px-2.5 py-0.5 rounded-full border ${
                          isClosed
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : done === 4
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : done > 0
                            ? 'bg-emerald-100 text-[#0D5C3A] border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isClosed ? '✓ Mois Clôturé (4/4)' : `${done}/4 Validés`}
                        </span>
                      )}
                    </div>

                    {sub ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map(num => {
                            const isDone = sub[`passage_${num}_status`] === 'effectue';
                            const label = sub[`passage_${num}_date`] || `P${num}`;
                            return (
                              <button
                                key={num}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => !isDisabled && handleTogglePassageStatus(sub.id, num, sub[`passage_${num}_status`])}
                                className={`p-2 rounded-xl text-center text-xs font-['Outfit'] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                                  isDisabled ? 'cursor-not-allowed opacity-75 pointer-events-none select-none' : 'cursor-pointer'
                                } ${
                                  isDone
                                    ? 'bg-emerald-100 text-[#0D5C3A] border-emerald-300 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                                title={isDisabled ? "Abonnement clôturé (verrouillé)" : "Cliquer pour valider/annuler"}
                              >
                                <div className="flex items-center gap-1">
                                  {isDone ? <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> : <Circle className="w-3 h-3 text-slate-400" />}
                                  <span>P{num}</span>
                                </div>
                                <span className="text-[9px] text-slate-500 truncate max-w-full font-medium">
                                  {label.replace(/Passage \d/, '').trim()}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* BOUTON CLÔTURE DÉFINITIVE DU MOIS SI 4/4 ATTEINTS */}
                        {done === 4 && !isClosed && (
                          <button
                            type="button"
                            onClick={() => handleConfirmCloseSubscription(sub.id)}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#0D5C3A] hover:from-emerald-700 hover:to-[#094129] text-white font-['Outfit'] font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all animate-pulse"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>🔒 Valider & Clôturer Définitivement le Mois (4/4 Passages)</span>
                          </button>
                        )}

                        {isClosed && (
                          <div className="py-2 px-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-[#0D5C3A] text-center font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                            <span>Ce mois d'abonnement est 100% complété et clôturé</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleGoToSubscription(selectedBookingDetails.client_name)}
                          className="w-full h-8 px-3 rounded-xl bg-white hover:bg-[#0D5C3A] hover:text-white border border-emerald-300 text-[#0D5C3A] font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Ouvrir la fiche dans l'onglet Abonnements ➔</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGoToSubscription(selectedBookingDetails.client_name)}
                        className="w-full h-8 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Créer la fiche de suivi dans Abonnements</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Quartier & Adresse :</span>
                  <span className="font-bold text-slate-900">{selectedBookingDetails.quarter}</span>
                </div>
                {selectedBookingDetails.notes && (
                  <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Précisions :</span>
                    <span className="text-slate-700 italic">{selectedBookingDetails.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Date & Heure :</span>
                  <span className="font-semibold text-slate-900">
                    {selectedBookingDetails.intervention_date || 'À caler'} {selectedBookingDetails.intervention_time ? `• ${selectedBookingDetails.intervention_time}` : ''}
                  </span>
                </div>
              </div>

              {/* TRAÇABILITÉ & GESTION OPÉRATEUR AUDITÉE */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <UserCheck className="w-4 h-4 text-[#0D5C3A]" />
                    <span>Statut de prise en charge :</span>
                  </div>
                  <span className={`font-['Outfit'] font-bold ${selectedBookingDetails.processed_by_name ? 'text-[#0D5C3A]' : 'text-amber-700'}`}>
                    {selectedBookingDetails.processed_by_name ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>Pris en charge par {selectedBookingDetails.processed_by_name}</span>
                      </span>
                    ) : (
                      selectedBookingDetails.status === 'en_attente' ? 'En attente d\'attribution' : 'Équipe TAARU SET'
                    )}
                  </span>
                </div>

                {selectedBookingDetails.processed_at && (
                  <div className="text-[11px] text-slate-500 font-medium">
                    Horodatage : {new Date(selectedBookingDetails.processed_at).toLocaleDateString('fr-FR')} à {new Date(selectedBookingDetails.processed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {/* RÈGLE LOGIQUE STRICTE : Bouton Prendre en charge uniquement si en_attente et non assigné */}
                {selectedBookingDetails.status === 'en_attente' && !selectedBookingDetails.processed_by_name && (
                  <button
                    type="button"
                    onClick={() => handleTakeOverBooking(selectedBookingDetails.id)}
                    className="w-full h-9 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1 transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                    <span>Accepter & Prendre en charge cette intervention</span>
                  </button>
                )}

                {/* RÉASSIGNATION PROPRE RÉSERVÉE AU SUPER ADMIN SI DÉJÀ PRIS EN CHARGE */}
                {isSuperAdmin && selectedBookingDetails.processed_by_name && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <UserCog className="w-3.5 h-3.5 text-slate-400" />
                      <span>Réassigner à un autre membre :</span>
                    </span>
                    <select
                      onChange={(e) => {
                        const selectedMember = teamMembers.find(m => m.id === e.target.value);
                        if (selectedMember) {
                          handleReassignBooking(selectedBookingDetails.id, selectedMember.full_name, selectedMember.email);
                        }
                      }}
                      className="text-[11px] font-['Outfit'] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Changer de collaborateur...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* STATUT DE L'INTERVENTION */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <span className="text-xs font-['Outfit'] font-bold text-slate-700">Statut de la réservation :</span>
                {selectedBookingDetails.status === 'terminee' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-['Outfit'] font-bold text-xs border border-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Terminée & Clôturée (Verrouillée)</span>
                  </div>
                ) : (
                  <select
                    value={selectedBookingDetails.status}
                    onChange={(e) => handleUpdateStatus(selectedBookingDetails.id, e.target.value)}
                    className={`text-xs font-['Outfit'] font-bold py-2 px-3 rounded-xl border cursor-pointer ${getStatusBadge(selectedBookingDetails.status)}`}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="en_cours">En cours</option>
                    <option value="terminee">Terminée (Clôturer définitivement)</option>
                    <option value="annulee">Annulée</option>
                  </select>
                )}
              </div>

              {/* BLOC DEMANDE D'AVIS CLIENT VÉRIFIÉ (WHATSAPP 1-CLIC - Demandé par Mamadou) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="font-['Outfit'] font-bold text-xs text-amber-950">Avis Client Vérifié & Notation</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">1-Clic WhatsApp</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Envoyez au client son lien d'avis personnalisé sur WhatsApp. Il clique, note de 1 à 5 étoiles en 15 secondes, et son avis s'enregistre automatiquement dans la base et sur le site.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={getReviewWhatsAppUrl(selectedBookingDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-['Outfit'] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Demander avis sur WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>

            {/* PIED DE PAGE FIXE STICKY AVEC GRAND BOUTON SORTIE EN TOUTE CIRCONSTANCE */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white shrink-0 space-y-2.5 z-20 font-['Outfit'] shadow-md">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPhone(selectedBookingDetails.client_phone, 'modal')}
                  className="h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  {copiedId === 'modal' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copier N°</span>
                    </>
                  )}
                </button>

                <a
                  href={`tel:${selectedBookingDetails.client_phone?.replace(/\s+/g, '')}`}
                  className="h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0D5C3A]" />
                  <span>Appeler</span>
                </a>

                <a
                  href={`https://wa.me/${selectedBookingDetails.client_phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${selectedBookingDetails.client_name}, nous confirmons votre intervention TAARU SET pour ${selectedBookingDetails.service_type} à ${selectedBookingDetails.quarter}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* BOUTON FERMER LA FICHE MAJEUR */}
              <button
                type="button"
                onClick={() => setSelectedBookingDetails(null)}
                className="w-full h-10 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <X className="w-4 h-4 text-slate-600" />
                <span>Fermer la fiche & Retourner au Planning (Échap)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALE NOUVELLE RÉSERVATION MANUELLE                                    */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsManualModalOpen(false); }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-['Outfit'] font-black text-slate-900">Enregistrer une intervention</h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
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
                  placeholder="Ex: Awa Ndiaye"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Téléphone WhatsApp direct</label>
                <input
                  type="text"
                  required
                  placeholder="+221 77 000 00 00"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Formule / Prestation</label>
                <select
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A] font-['Outfit'] font-bold"
                >
                  <option value="Nettoyage Canapés & Salons Kärcher">Nettoyage Canapés & Salons Kärcher</option>
                  <option value="Lavage Auto Mobile à Domicile">Lavage Auto Mobile à Domicile</option>
                  <option value="Nettoyage Fin de Chantier & Rénovation">Nettoyage Fin de Chantier & Rénovation</option>
                  <option value="Entretien Matelas & Tapis">Entretien Matelas & Tapis</option>
                  <option value="Abonnement Mensuel Sérénité">Abonnement Mensuel Sérénité</option>
                </select>
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Précisions (ex: 4x4, Canapé 5 places velours...)</label>
                <input
                  type="text"
                  placeholder="Détails du véhicule ou mobilier"
                  value={manualDetails}
                  onChange={(e) => setManualDetails(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Quartier à Dakar</label>
                  <input
                    type="text"
                    required
                    placeholder="Almadies, Mermoz..."
                    value={manualQuarter}
                    onChange={(e) => setManualQuarter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                  />
                </div>
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Prix convenu (FCFA)</label>
                  <input
                    type="number"
                    required
                    placeholder="35000"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A] font-['Outfit'] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Date et heure souhaitées</label>
                <input
                  type="text"
                  placeholder="Ex: Samedi 10h00"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs shadow-md shadow-[#0D5C3A]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Valider et Enregistrer l'Intervention</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALE NOUVEL ABONNEMENT (4 PASSAGES DU MOIS)                          */}
      {/* ========================================================================= */}
      {isNewSubModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewSubModalOpen(false); }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-['Outfit'] font-bold text-[#0D5C3A] uppercase tracking-wider">Formule Récurrente</span>
                <h3 className="text-lg font-['Outfit'] font-black text-slate-900">Nouvel Abonnement (4 passages / mois)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSubModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Nom du client</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Babacar Diop"
                    value={subClientName}
                    onChange={(e) => setSubClientName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                  />
                </div>

                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Téléphone WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="+221 77 ..."
                    value={subClientPhone}
                    onChange={(e) => setSubClientPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0D5C3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Formule choisie</label>
                  <select
                    value={subPlanName}
                    onChange={(e) => setSubPlanName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-['Outfit'] font-bold"
                  >
                    <option value="Pack Auto Mensuel Sérénité (4x4 / SUV)">Pack Auto Mensuel 4x4 (4 lavages)</option>
                    <option value="Pack Auto Mensuel Citadine (4 lavages)">Pack Auto Citadine (4 lavages)</option>
                    <option value="Pack Résidence Sérénité (4 passages / mois)">Pack Résidence & Canapés (4 passages)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Tarif mensuel (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={subPrice}
                    onChange={(e) => setSubPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-['Outfit'] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Quartier</label>
                  <input
                    type="text"
                    required
                    placeholder="Almadies, Fann Résidence..."
                    value={subQuarter}
                    onChange={(e) => setSubQuarter(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Adresse / Villa</label>
                  <input
                    type="text"
                    placeholder="Ex: Villa 12 Rue des Almadies"
                    value={subAddress}
                    onChange={(e) => setSubAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="font-['Outfit'] font-bold text-slate-800 block text-xs">Dates prévues des 4 passages du mois :</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Passage 1 :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 07 Nov"
                      value={subP1Date}
                      onChange={(e) => setSubP1Date(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Passage 2 :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 14 Nov"
                      value={subP2Date}
                      onChange={(e) => setSubP2Date(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Passage 3 :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 21 Nov"
                      value={subP3Date}
                      onChange={(e) => setSubP3Date(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Passage 4 :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 28 Nov"
                      value={subP4Date}
                      onChange={(e) => setSubP4Date(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-['Outfit'] font-bold text-slate-700 mb-1">Notes / Instructions particulières</label>
                <input
                  type="text"
                  placeholder="Ex: Paiement Wave, voiture garée devant"
                  value={subNotes}
                  onChange={(e) => setSubNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#0D5C3A] hover:bg-[#0A482E] text-white font-['Outfit'] font-bold text-xs shadow-md shadow-[#0D5C3A]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer l'Abonnement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BOTTOM NAVIGATION FIXE SUR MOBILE (< md)                                */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/90 z-40 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] font-['Outfit']">
        
        {/* Planning */}
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
            activeTab === 'bookings' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            {bookings.filter(b => b.status === 'en_attente').length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#16A34A] text-white text-[9px] font-black flex items-center justify-center">
                {bookings.filter(b => b.status === 'en_attente').length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Planning</span>
        </button>

        {/* Suivi Abonnements */}
        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
            activeTab === 'subscriptions' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Repeat className="w-5 h-5" />
            {subscriptions.length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-[#0D5C3A] text-white text-[8px] font-bold flex items-center justify-center">
                {subscriptions.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Abonnements</span>
        </button>

        {/* Clients CRM */}
        {canViewCRM && (
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
              activeTab === 'clients' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Clients</span>
          </button>
        )}

        {/* Bilan */}
        {canViewStats && (
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
              activeTab === 'stats' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Bilan</span>
          </button>
        )}

        {/* Équipe */}
        {canManageTeam && (
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
              activeTab === 'team' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[10px] font-bold">Équipe</span>
          </button>
        )}

        {/* Avis & Notations */}
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-colors ${
            activeTab === 'reviews' ? 'text-[#0D5C3A]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            {reviewsList.length > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center">
                {reviewsList.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Avis</span>
        </button>

        {/* Menu */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl text-slate-400 hover:text-slate-700"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

    </div>
  );
}
