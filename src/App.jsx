// Audio Haptic Micro-Interaction (Web Audio API - 0 latence, 0 fichier externe)
function playHapticClickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Ignorer si audio bloqué par le navigateur
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, Phone, MessageSquare, Clock, ShieldCheck, 
  MapPin, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Check, Star, Wrench, Droplets, 
  Car, Home, Sofa, RefreshCw, Calculator, Send, Zap, Award, ThumbsUp, X, Calendar, User, Navigation,
  Building2, Truck, FileText, Menu, ExternalLink, HelpCircle
} from 'lucide-react';

// Vraie Photo officielle HD de Mamadou et équipe TAARU SET (Sans stickers TikTok)
import teamCleanHdImg from './assets/team_clean_hd.jpg';
// Logo officiel TAARU SET
import logoOfficialSq from './assets/logo_official_sq.jpg';
// Portrait officiel Mamadou (Fondateur & Égérie réseaux sociaux)
import mamadouFounderImg from './assets/mamadou_founder.jpg';
// Vraies photos locales haute performance pour le comparateur Avant / Après (100% cohérentes même cadrage)
import dirtyCarBeforeImg from './assets/dirty_car_before.jpg';
import cleanCarAfterImg from './assets/clean_car_after.jpg';
import chantierBeforeImg from './assets/chantier_before.jpg';
import chantierAfterImg from './assets/chantier_after.jpg';
import sofaBeforeImg from './assets/sofa_before.jpg';
import cleanSofaAfterImg from './assets/clean_sofa_after.jpg';

// ============================================================================
// COMPOSANT COMPARATEUR AVANT / APRÈS (AUTONOME & GPU ACCÉLÉRÉ • 0 RE-RENDER APP)
// ============================================================================
function BeforeAfterSection({ handleOpenDrawer }) {
  // Thèmes : 'video' (Démo réelle Dakar), 'auto' (Range Rover), 'sofa' (Canapé velours), 'chantier' (Villa)
  const [sliderTheme, setSliderTheme] = useState('video');
  const [activeVideo, setActiveVideo] = useState(1); // 1: Vue d'ensemble, 2: Gros plan buse
  const [sliderPos, setSliderPos] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  // Animation sinusoïdale fluide au repos pour les photos
  useEffect(() => {
    if (sliderTheme === 'video') return;
    let animId;
    let startTimestamp = null;

    const animateLoop = (timestamp) => {
      if (!isHovered) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = (timestamp - startTimestamp) / 1000;
        const pos = 50 + 26 * Math.sin(elapsed * 1.35);
        setSliderPos(Number(pos.toFixed(1)));
      } else {
        startTimestamp = null;
      }
      animId = requestAnimationFrame(animateLoop);
    };

    animId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isHovered, sliderTheme]);

  // Rotation des thèmes UNIQUEMENT pour les photos (la vidéo reste fixe pour que le client puisse la regarder sans coupure)
  useEffect(() => {
    if (isHovered || sliderTheme === 'video') return;
    const interval = setInterval(() => {
      setSliderTheme((prev) => {
        if (prev === 'auto') return 'sofa';
        if (prev === 'sofa') return 'chantier';
        return 'auto';
      });
    }, 7500);
    return () => clearInterval(interval);
  }, [isHovered, sliderTheme]);

  return (
    <section id="avant-apres" className="py-12 sm:py-16 bg-[#FAFAF8] relative z-10 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0D5C3A] text-xs font-bold tracking-wider uppercase mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>RÉSULTATS OBSERVÉS • PHOTOS SANS FILTRE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Résultats Avant & Après Intervention
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto font-normal">
            Glissez le séparateur pour observer le décapage de la poussière dakaroise, des taches de tissu et des résidus de chantier. Même véhicule, même canapé, même pièce.
          </p>
        </div>

        {/* Sélecteur de Thème avec Vidéo en direct */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-slate-200/90 p-1.5 rounded-2xl flex items-center gap-1 sm:gap-1.5 shadow-inner max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setSliderTheme('video')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                sliderTheme === 'video'
                  ? 'bg-[#0D5C3A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>🎥 Vidéo en Direct Dakar</span>
            </button>
            <button
              type="button"
              onClick={() => setSliderTheme('auto')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                sliderTheme === 'auto'
                  ? 'bg-[#0D5C3A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Rénovation Auto (Range)</span>
            </button>
            <button
              type="button"
              onClick={() => setSliderTheme('sofa')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                sliderTheme === 'sofa'
                  ? 'bg-[#0D5C3A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sofa className="w-4 h-4" />
              <span>Canapés & Salons</span>
            </button>
            <button
              type="button"
              onClick={() => setSliderTheme('chantier')}
              className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                sliderTheme === 'chantier'
                  ? 'bg-[#0D5C3A] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Fin de Chantier</span>
            </button>
          </div>
        </div>

        {/* Affichage Conditionnel : 2 Vidéos Réelles Dakar OU Comparateur Avant / Après */}
        {sliderTheme === 'video' ? (
          <div 
            className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-emerald-600/40 aspect-[16/9] bg-slate-950 flex items-center justify-center group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Lecteur Vidéo Dynamique (Démo 1 ou Démo 2) */}
            <video
              key={activeVideo}
              src={activeVideo === 1 ? "./taaru_cleaning_demo.mp4" : "./taaru_cleaning_demo2.mp4"}
              poster={activeVideo === 1 ? "./taaru_cleaning_poster.jpg" : "./taaru_cleaning_poster2.jpg"}
              autoPlay
              loop
              muted
              defaultMuted
              playsInline
              controls
              preload="metadata"
              className="w-full h-full object-cover"
              title={activeVideo === 1 ? "Démo 1 : Intervention Équipe TAARU SET" : "Démo 2 : Aspiration buse en direct"}
            >
              <source src={activeVideo === 1 ? "./taaru_cleaning_demo.mp4" : "./taaru_cleaning_demo2.mp4"} type="video/mp4" />
              <source src={activeVideo === 1 ? "/taaru_cleaning_demo.mp4" : "/taaru_cleaning_demo2.mp4"} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            {/* Sélecteur de Vidéo Flottant */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setActiveVideo(1);
                  playHapticClickSound();
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeVideo === 1 
                    ? 'bg-[#16A34A] text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>📹 Démo 1 (Équipe)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveVideo(2);
                  playHapticClickSound();
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeVideo === 2 
                    ? 'bg-[#16A34A] text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🔍 Démo 2 (Gros Plan Buse)</span>
              </button>
            </div>

            {/* Badge Équipe Réelle en Direct */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-black tracking-wider uppercase border border-white/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeVideo === 1 ? "ÉQUIPE EN ACTION • VUE GLOBALE" : "ASPIRATION INJECTEUR • GROS PLAN"}</span>
              </span>
            </div>
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-none hidden sm:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Polo officiel TAARU SET & Machine RUSTGO</span>
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="@container relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-slate-200 aspect-[16/9] select-none cursor-ew-resize group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            {/* Badge Gauche Fixe : AVANT INTERVENTION */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-black tracking-wider uppercase border border-white/20 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>AVANT INTERVENTION</span>
              </span>
            </div>

            {/* Badge Droite Fixe : RÉSULTAT NETTOYÉ */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-950/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-black tracking-wider uppercase border border-emerald-400/30 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>RÉSULTAT NETTOYÉ</span>
              </span>
            </div>

          {/* 1. AUTO (MÊME VÉHICULE AVANT / APRÈS) */}
          {sliderTheme === 'auto' && (
            <>
              <img 
                src={cleanCarAfterImg} 
                alt="Carrosserie brillante et pneus rénovés par TAARU SET" 
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                decoding="sync"
              />
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: `${sliderPos}%` }}
              >
                <img 
                  src={dirtyCarBeforeImg} 
                  alt="Véhicule avant intervention recouvert de poussière dakaroise et boue" 
                  className="absolute top-0 left-0 h-full w-[100cqw] max-w-none object-cover object-center"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            </>
          )}

          {/* 2. CANAPÉ (MÊME CANAPÉ AVANT / APRÈS AVEC TACHES NETTES) */}
          {sliderTheme === 'sofa' && (
            <>
              <img 
                src={cleanSofaAfterImg} 
                alt="Canapé velours régénéré et purifié par injecteur Kärcher" 
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                decoding="sync"
              />
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: `${sliderPos}%` }}
              >
                <img 
                  src={sofaBeforeImg} 
                  alt="Canapé avant intervention avec auréoles de transpiration, taches et poussière" 
                  className="absolute top-0 left-0 h-full w-[100cqw] max-w-none object-cover object-center"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            </>
          )}

          {/* 3. FIN DE CHANTIER (VRAIE PHOTO AVANT & VRAIE PHOTO APRÈS) */}
          {sliderTheme === 'chantier' && (
            <>
              <img 
                src={chantierAfterImg} 
                alt="Villa étincelante et prête à emménager TAARU SET" 
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                decoding="sync"
              />
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: `${sliderPos}%` }}
              >
                <img 
                  src={chantierBeforeImg} 
                  alt="Chantier brut avant décapage avec poussière, peinture et gravats" 
                  className="absolute top-0 left-0 h-full w-[100cqw] max-w-none object-cover object-center"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            </>
          )}

          {/* Poignée centrale */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#0D5C3A] font-extrabold text-xs flex items-center justify-center shadow-md">
              ↔
            </div>
          </div>

          <input 
            type="range" 
            min="5" 
            max="95" 
            value={sliderPos} 
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Séparateur avant et après intervention"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>
        )}

        {/* Légende Dynamique du Résultat */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center shrink-0">
              {sliderTheme === 'video' ? <Sparkles className="w-5 h-5 text-amber-500" /> : sliderTheme === 'auto' ? <Car className="w-5 h-5" /> : sliderTheme === 'sofa' ? <Sofa className="w-5 h-5" /> : <Home className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                {sliderTheme === 'video' && 'Démonstration Réelle Dakar : Décapage d\'un fauteuil à l\'injecteur-extracteur RUSTGO par notre technicien'}
                {sliderTheme === 'auto' && 'Rénovation Carrosserie & Habitacle : Décapage du film routier et poussière dakaroise sur Range Rover'}
                {sliderTheme === 'sofa' && 'Shampouinage & Injection : Élimination des auréoles et poussière sur velours'}
                {sliderTheme === 'chantier' && 'Remise à Neuf Clé en Main : Décapage ciment, colle, vitres et faïences'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Résultat garanti par l'équipe TAARU SET avec matériel professionnel Kärcher.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenDrawer(sliderTheme === 'chantier' ? 'chantier' : sliderTheme === 'sofa' ? 'textile' : 'auto')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D5C3A] text-white text-xs font-bold hover:bg-[#16A34A] transition-colors shrink-0 cursor-pointer"
          >
            <span>Réserver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL APPLICATION
// ============================================================================
export default function App() {
  // Navigation mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [stepHovered, setStepHovered] = useState(false);

  // Animation séquentielle fluide des 3 étapes "Comment ça marche"
  useEffect(() => {
    if (stepHovered) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [stepHovered]);

  // Modale Mentions Légales
  const [legalModalOpen, setLegalModalOpen] = useState(false);

  // --- ÉTATS DU VOLET GLISSANT DE RÉSERVATION (Demandé par Mamadou) ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerService, setDrawerService] = useState('auto'); // 'auto', 'textile', 'chantier'
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedDay, setSelectedDay] = useState(''); // Sans présélection (choix obligatoire)
  const [recurringDay, setRecurringDay] = useState('Tous les Samedis (4 passages)');
  const [customPassageDates, setCustomPassageDates] = useState(['', '', '', '']);
  const [subscriptionNotes, setSubscriptionNotes] = useState('');
  const [selectedTime, setSelectedTime] = useState(''); // Sans présélection (choix obligatoire)
  const [clientQuarter, setClientQuarter] = useState('Almadies');
  const [customQuarter, setCustomQuarter] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [reservationSummary, setReservationSummary] = useState(null); // Modale de Récapitulatif

  // --- AUTRES ÉTATS ---
  const [faqOpen, setFaqOpen] = useState(null);

  // --- TILT 3D DE LA CARTE HERO ---
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMoveHero = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - card.left) / card.width - 0.5) * 10;
    const y = ((e.clientY - card.top) / card.height - 0.5) * -10;
    setTilt({ x, y });
  };
  const handleMouseLeaveHero = () => setTilt({ x: 0, y: 0 });

  // --- CANVAS DYNAMIQUE PARTICULES PROPRETÉ (OPTIMISÉ & SANS LATENCE) ---
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 14 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speedY: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.2 + 0.08
    }));

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(22, 163, 74, ${p.opacity})`;
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Formatage des montants FCFA
  const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

  // Validation du téléphone en direct
  const handlePhoneChange = (val) => {
    setClientPhone(val);
    const cleaned = val.replace(/[\\s.-]/g, '');
    if (cleaned && !/^(?:\\+?221)?[7][05678]\\d{7}$/.test(cleaned)) {
      setPhoneError('Numéro mobile sénégalais recommandé (ex: 77 154 86 10)');
    } else {
      setPhoneError('');
    }
  };

  // Jours rapides
  const nextDays = [
    { id: 'Aujourd\'hui (Urgence)', short: 'Aujourd\'hui', dateNum: 'Dès que possible' },
    { id: 'Demain', short: 'Demain', dateNum: 'Créneau garanti' },
    { id: 'Ce Samedi', short: 'Samedi', dateNum: 'Week-end' },
    { id: 'Ce Dimanche', short: 'Dimanche', dateNum: 'Week-end' }
  ];

  // Créneaux horaires
  const timeSlots = [
    { id: 'Matinée (08h30 - 11h30)', period: 'Matin' },
    { id: 'Midi (11h30 - 14h00)', period: 'Midi' },
    { id: 'Après-midi (14h00 - 16h30)', period: 'Après-midi' },
    { id: 'Fin de journée (16h30 - 19h00)', period: 'Soir' }
  ];

  // 17 Quartiers de Dakar & banlieue + option Autre
  const dakarQuarters = [
    'Almadies', 'Ngor / Virage', 'Yoff', 'Ouakam', 'Mermoz', 'Point E', 'Fann Résidence', 
    'Plateau', 'Sacré-Cœur', 'Maristes', 'Liberté 1 à 6', 'Hann Bel-Air', 
    'Parcelles Assainies', 'Pikine', 'Guédiawaye', 'Keur Massar', 'Rufisque / Diamniadio', 'Autre quartier'
  ];

  // Données des 3 pôles TAARU SET
  const servicesConfig = {
    auto: {
      id: 'auto',
      title: 'Lavage Auto Mobile',
      subtitle: 'À votre domicile ou bureau sans déplacer votre véhicule',
      icon: Car,
      tag: 'Le plus pratique',
      startingPrice: 'Dès 3 000 FCFA',
      description: 'Nous venons directement avec notre matériel autonome, nettoyeur haute pression et produits d’entretien professionnels.',
      packs: [
        { name: 'Citadine / Berline (Extérieur Express)', price: 3000, detail: 'Lavage carrosserie, vitres, jantes & brillance pneus' },
        { name: 'Citadine (Extérieur + Profond Intérieur)', price: 15000, detail: 'Aspiration totale, shampouinage sièges, plastiques & coffre' },
        { name: 'SUV / 4x4 (Extérieur Express)', price: 5000, detail: 'Finition brillante sans rayures, passage de roues & vitres' },
        { name: 'SUV / 4x4 (Extérieur + Profond Intérieur)', price: 20000, detail: 'Nettoyage VIP complet à domicile, désinfection habitacle' },
        { name: 'Pick-up / Minivan (Profond Intérieur & Ext.)', price: 30000, detail: 'Traitement gros gabarit, shampouinage complet' },
        { 
          name: 'Pack Mensuel Sérénité (4 lavages / mois)', 
          price: 30000, 
          isSubscription: true, 
          detail: '4 passages programmés (1/semaine) à domicile ou bureau • Le plus économique (-30%)' 
        }
      ]
    },
    textile: {
      id: 'textile',
      title: 'Canapés, Matelas & Tapis',
      subtitle: 'Shampouinage en profondeur à l’injecteur-extracteur Kärcher',
      icon: Sofa,
      tag: 'Spécialité Maison',
      startingPrice: 'Dès 3 500 FCFA',
      description: 'Élimination des taches rebelles, désinfection anti-acariens et désodorisation fraîche. Tissu quasi-sec en 3h.',
      packs: [
        { name: 'Fauteuil 1 place / Pouf', price: 3500, detail: 'Nettoyage vapeur & injection-extraction' },
        { name: 'Canapé 2 places', price: 7000, detail: 'Dépoussiérage et élimination des auréoles' },
        { name: 'Canapé 3 places', price: 12000, detail: 'Shampouinage en profondeur assises & dossiers' },
        { name: 'Canapé d’Angle (5 à 6 places)', price: 22000, detail: 'Restauration complète des fibres et assises' },
        { name: 'Matelas 2 Places', price: 12000, detail: 'Désinfection anti-acariens, transpiration & taches' },
        { name: 'Pack Salon Complet (-10%)', price: 18000, detail: 'Canapé 3 places + 2 fauteuils + grand tapis' }
      ]
    },
    chantier: {
      id: 'chantier',
      title: 'Remise en État & Fin de Chantier',
      subtitle: 'Nettoyage complet après travaux, rénovation ou avant emménagement',
      icon: Home,
      tag: 'Gros Volume',
      startingPrice: 'Dès 45 000 FCFA',
      description: 'Décapage des résidus de peinture, ciment, colle, vitres, menuiseries, dépoussiérage et désinfection totale.',
      packs: [
        { name: 'Studio / Appartement F1 (9 à 35 m²)', price: 45000, detail: 'Sols, vitres, sanitaires, cuisine décapés à neuf' },
        { name: 'Appartement F2 – F3 (36 à 80 m²)', price: 125000, detail: 'Équipe complète de 2-3 techniciens équipés' },
        { name: 'Villa Individuelle (81 à 200 m²)', price: 260000, detail: 'Traitement intérieur complet + cours et terrasses' },
        { name: 'Grande Villa R+1 (201 à 300 m²)', price: 390000, detail: 'Décapage complet haute puissance de tous les niveaux' }
      ]
    }
  };

  // Ouverture du tiroir
  const handleOpenDrawer = (serviceKey) => {
    setDrawerService(serviceKey);
    setSelectedPack(servicesConfig[serviceKey].packs[0]);
    setSelectedDay('');
    setSelectedTime('');
    setValidationError('');
    setIsDrawerOpen(true);
  };

  // Confirmation et envoi WhatsApp
  const handleConfirmReservation = () => {
    if (!selectedPack) {
      setValidationError('Veuillez sélectionner une formule.');
      return;
    }
    if (!selectedPack.isSubscription && !selectedDay) {
      setValidationError('Veuillez choisir un jour d\'intervention (ex: Demain, Aujourd\'hui ou sur calendrier).');
      return;
    }
    if (!selectedTime) {
      setValidationError('Veuillez choisir votre créneau horaire souhaité.');
      return;
    }

    setValidationError('');

    const currentService = servicesConfig[drawerService];
    const isSub = selectedPack.isSubscription;

    let subDetail = recurringDay;
    if (isSub && (recurringDay.includes('libres') || recurringDay.includes('personnalisées'))) {
      const datesList = customPassageDates
        .map((d, i) => {
          if (!d) return null;
          const p = d.split('-');
          return `P${i + 1}: ${p[2]}/${p[1]}`;
        })
        .filter(Boolean)
        .join(', ');

      const datesText = datesList ? `Dates: ${datesList}` : 'Dates à caler';
      const notesText = subscriptionNotes ? ` (${subscriptionNotes})` : '';
      subDetail = `4 dates libres [${datesText}${notesText}]`;
    }

    const quarterFinal = clientQuarter === 'Autre quartier' && customQuarter.trim() 
      ? `Autre quartier: ${customQuarter.trim()}` 
      : clientQuarter;

    const message = 
`Bonjour Mamadou (TAARU SET), je souhaite réserver une prestation :

*Service :* ${currentService.title}
*Formule :* ${selectedPack.name} (${formatPrice(selectedPack.price)})
${isSub ? `*Formule Abonnement :* 4 passages programmés\\n*Planning :* ${subDetail}` : `*Date souhaitée :* ${selectedDay || 'Premier créneau disponible'}`}
*Créneau horaire :* ${selectedTime}
*Quartier :* ${quarterFinal}
*Adresse :* ${clientAddress || 'Précisée sur WhatsApp'}
*Client :* ${clientName || 'Client Dakar'}
${clientPhone ? `*Téléphone :* ${clientPhone}` : ''}

Merci de me confirmer la réservation et le déplacement de l'équipe TAARU SET.`;

    // Envoi direct WhatsApp Mamadou (+221 77 154 86 10)
    window.open(`https://wa.me/221771548610?text=${encodeURIComponent(message)}`, '_blank');

    setReservationSummary({
      service: currentService.title,
      pack: selectedPack.name,
      price: formatPrice(selectedPack.price),
      isSub: isSub,
      dateInfo: isSub ? `Abonnement : ${subDetail}` : (selectedDay || 'Prochain jour ouvré'),
      time: selectedTime,
      quarter: quarterFinal,
      address: clientAddress || 'Précisée sur WhatsApp',
      name: clientName || 'Client Dakar',
      phone: clientPhone || 'Précisé sur WhatsApp'
    });

    setIsDrawerOpen(false);
  };

  // Témoignages clients authentifiés Dakar
  const testimonialsList = [
    {
      initials: 'AD',
      name: 'Aïssatou Diop',
      location: 'Almadies • Canapé Velours d\'Angle',
      text: '« Mon canapé d’angle beige avait des taches de soda et d\'eau après l\'anniversaire de mon fils. Mamadou est venu avec son injecteur Kärcher. Le velours est redevenu impeccable, sec le soir même sans odeur. »'
    },
    {
      initials: 'CS',
      name: 'Cheikh Tidiane Sy',
      location: 'Maristes • Pack Auto Mensuel 4x4',
      text: '« Le lavage auto à mon bureau me fait gagner un temps précieux chaque semaine. Finition soignée, jantes brillantes sans rayures et paiement direct par Wave. Équipe très polie. »'
    },
    {
      initials: 'OF',
      name: 'Dr. Ousmane Fall',
      location: 'Point E • Cabinet Dentaire (12 fauteuils)',
      text: '« Désinfection et shampouinage complet des banquettes et fauteuils de ma salle d\'attente. Intervention un samedi après-midi pour ne pas perturber les consultations. Facture conforme reçue. »'
    },
    {
      initials: 'MB',
      name: 'Marième Ba',
      location: 'Ngor Virage • Villa Fin de Chantier R+2',
      text: '« Après 8 mois de travaux, le ciment séché sur les carreaux et les baies vitrées semblait indélébile. TAARU SET a remis la villa à neuf en une seule journée avant l\'emménagement. »'
    },
    {
      initials: 'KD',
      name: 'Khady Diallo',
      location: 'Fann Résidence • Grand Tapis & Matelas',
      text: '« Respect parfait des matières délicates. Mon grand tapis en laine a retrouvé son éclat et la désinfection du matelas donne une vraie sensation de fraîcheur. »'
    },
    {
      initials: 'SI',
      name: 'Cabinet SENE-IMMO',
      location: 'Plateau • Moquettes Bureaux 140 m²',
      text: '« Contrat régulier pour l\'entretien de nos moquettes d\'entreprise. Ponctualité exemplaire et matériel professionnel Kärcher. Nous recommandons vivement. »'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-800 font-sans antialiased selection:bg-[#16A34A] selection:text-white relative overflow-x-hidden">

      {/* Canvas Particules Propreté en Arrière-plan */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0 opacity-40" 
      />

      {/* ========================================================================= */}
      {/* 1. NAVBAR : RESPONSIVE AVEC LOGO VECTORIEL & NAVIGATION MOBILE ÉLÉGANTE   */}
      {/* ========================================================================= */}
      <header className="fixed top-2.5 sm:top-5 inset-x-3 sm:inset-x-6 z-40 flex justify-center pointer-events-none">
        <nav className="w-full max-w-5xl bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3.5 sm:px-6 py-2 sm:py-3 shadow-[0_10px_30px_-10px_rgba(13,92,58,0.12)] flex items-center justify-between gap-2 pointer-events-auto">
          
          {/* Logo Officiel TAARU SET (Vectoriel Ultra-Léger & Net) */}
          <a href="#" className="flex items-center gap-2.5 group shrink-0" aria-label="Accueil TAARU SET">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#0D5C3A] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-6 h-6">
                <path d="M 22 24 L 78 24 L 74 33 L 53 33 L 42 77 L 31 77 L 42 33 L 26 33 Z" fill="#FFFFFF" />
                <path d="M 52 48 C 65 42 72 58 70 70 C 58 72 46 62 52 48 Z" fill="#4ADE80" />
                <path d="M 28 69 C 34 50 50 36 71 36 C 58 40 40 50 34 71 Z" fill="#FFFFFF" opacity="0.9" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-extrabold text-sm sm:text-base tracking-tight text-slate-900 leading-none">
                <span>TAARU</span>
                <span className="text-[#16A34A]">SET</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 tracking-tight leading-none mt-0.5">
                Le charme de la propreté
              </span>
            </div>
          </a>

          {/* Liens Desktop rapides */}
          <div className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-600">
            <a href="#services" className="hover:text-[#16A34A] transition-colors">Formules</a>
            <a href="#comment-ca-marche" className="hover:text-[#16A34A] transition-colors">Comment ça marche</a>
            <a href="#avant-apres" className="hover:text-[#16A34A] transition-colors">Avant / Après</a>
            <a href="#entreprises" className="hover:text-[#16A34A] transition-colors">Entreprises</a>
            <a href="#temoignages" className="hover:text-[#16A34A] transition-colors">Avis</a>
          </div>

          {/* Actions : Burger Mobile + Bouton Réserver */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bouton Burger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Ouvrir le menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button 
              type="button"
              onClick={() => handleOpenDrawer('auto')}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/15 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="font-extrabold">Réserver</span>
            </button>
          </div>

        </nav>

        {/* Menu Déroulant Mobile Élégant */}
        {mobileMenuOpen && (
          <div className="absolute top-16 inset-x-4 bg-white/98 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-sm font-extrabold text-slate-800 pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200 lg:hidden">
            <a 
              href="#services" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Nos 3 Formules</span>
              <ArrowRight className="w-4 h-4 text-[#16A34A]" />
            </a>
            <a 
              href="#comment-ca-marche" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Comment ça marche</span>
              <ArrowRight className="w-4 h-4 text-[#16A34A]" />
            </a>
            <a 
              href="#avant-apres" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Résultats Avant / Après</span>
              <ArrowRight className="w-4 h-4 text-[#16A34A]" />
            </a>
            <a 
              href="#entreprises" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between text-emerald-800 bg-emerald-50"
            >
              <span>Offre Entreprises & Bureaux</span>
              <ArrowRight className="w-4 h-4 text-[#16A34A]" />
            </a>
            <a 
              href="#temoignages" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Avis Clients Vérifiés</span>
              <ArrowRight className="w-4 h-4 text-[#16A34A]" />
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between text-slate-500"
            >
              <span>Questions Fréquentes</span>
              <HelpCircle className="w-4 h-4" />
            </a>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO : RESPIRANT, CHALEUREUX & ÉPURÉ                                   */}
      {/* ========================================================================= */}
      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Colonne Gauche : Titre clair, bénéfice direct */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wide mb-3.5 shadow-sm border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-medium">DISPONIBLE AUJOURD'HUI • DAKAR & ENVIRONS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3.5">
              <span className="block">On vient chez vous</span>
              <span className="block text-[#16A34A] whitespace-nowrap">
                Vous profitez du propre
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mb-5 font-normal">
              Confiez vos canapés, matelas, chantiers et véhicules à notre équipe équipée de machines professionnelles <strong className="text-slate-900 font-semibold">Kärcher</strong>. Choisissez votre service, fixez votre date et nous nous occupons du reste.
            </p>

            {/* Boutons d'Action Rapide */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-5">
              <a 
                href="#services"
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-[#0D5C3A] hover:bg-[#16A34A] text-white font-bold text-xs sm:text-sm text-center shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Choisir une formule</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a 
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%20(TAARU%20SET)%2C%20je%20souhaite%20un%20renseignement."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-xs sm:text-sm text-center shadow-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-[#16A34A]" />
                <span>Discuter sur WhatsApp</span>
              </a>
            </div>

            {/* Réassurances Minimalistes */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Paiement après travail vérifié</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Wave & Orange Money acceptés</span>
              </div>
            </div>

          </div>

          {/* Colonne Droite : Photo Réelle Mamadou avec Tilt 3D */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div 
              onMouseMove={handleMouseMoveHero}
              onMouseLeave={handleMouseLeaveHero}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full max-w-sm sm:max-w-md bg-white p-3 sm:p-3.5 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(13,92,58,0.18)] border border-slate-200/90 relative"
            >
              <div className="relative rounded-[2rem] overflow-hidden bg-slate-100 aspect-[4/5] shadow-inner">
                <img 
                  src={teamCleanHdImg} 
                  alt="Mamadou et l'équipe TAARU SET avec aspirateur Kärcher professionnel" 
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" 
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                />
                
                {/* Badge Discret Propre en Haut à Droite */}
                <div className="absolute top-3.5 right-3.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-800 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Dakar 🇸🇳</span>
                </div>
              </div>



              {/* Badge Flottant Confiance Rénové avec Note Réelle */}
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-200/60">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">4.9 / 5 sur Google & WhatsApp</div>
                  <div className="text-[10px] text-slate-500">148 avis vérifiés à Dakar</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LES 3 OFFRES CLÉS (CLIC ➔ OUVRE LE TIROIR GLISSANT DE RÉSERVATION)       */}
      {/* ========================================================================= */}
      <section id="services" className="py-12 sm:py-16 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              CHOISISSEZ VOTRE BESOIN
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              Nos 3 Services Phares
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
              Cliquez sur le service de votre choix pour voir les détails, choisir votre créneau et réserver en 1 minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            
            {/* CARTE 1 : LAVAGE AUTO MOBILE */}
            <div 
              onClick={() => handleOpenDrawer('auto')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-5 sm:p-6 border border-slate-200 hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col justify-between relative h-full"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 3 000 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Lavage Auto Mobile</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                  À votre domicile ou bureau à Dakar. Finition soignée sans rayures, aspiration totale et shampouinage habitacle.
                </p>

                {/* Encadré Sombre Abonnement */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white border border-emerald-500/50 shadow-lg">
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase font-black tracking-wide text-lime-400 bg-lime-400/15 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      <Zap className="w-3 h-3 shrink-0" />
                      <span>FORMULE ABONNEMENT (-30%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0"></span>
                        <span>4 lavages programmés</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5">
                        1 passage par semaine garanti
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-lime-400 whitespace-nowrap">
                        30 000 F / mois
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">Sans réengager</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A] mt-5">
                <span>Voir les packs & Réserver</span>
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* CARTE 2 : TEXTILES & CANAPÉS */}
            <div 
              onClick={() => handleOpenDrawer('textile')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-5 sm:p-6 border-2 border-emerald-400/90 shadow-md hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col justify-between relative h-full"
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                LE PLUS DEMANDÉ
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-emerald-900/20">
                  <Sofa className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 3 500 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Canapés, Matelas & Tapis</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                  Shampouinage à l'injecteur Kärcher. Élimine les taches rebelles, odeurs et acariens. Tissu quasi-sec en 3 à 5h.
                </p>

                {/* Encadré Forfait Salon Complet */}
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 text-slate-900 border border-emerald-200 shadow-sm">
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase font-black tracking-wide text-emerald-800 bg-emerald-200/60 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      <span>FORFAIT SALON COMPLET (-10%)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200/80">
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                        <span>Canapé + Fauteuils + Tapis</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5">
                        Séchage express 3 à 5h
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-[#0D5C3A] whitespace-nowrap">
                        Dès 18 000 F
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium">Tout compris</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A] mt-5">
                <span>Voir les formules & Réserver</span>
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* CARTE 3 : FIN DE CHANTIER */}
            <div 
              onClick={() => handleOpenDrawer('chantier')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-5 sm:p-6 border border-slate-200 hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer flex flex-col justify-between relative h-full"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 45 000 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Fin de Chantier & Villas</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                  Remise à neuf complète après travaux ou avant emménagement. Décapage ciment, colle, vitres et désinfection totale.
                </p>

                {/* Encadré Devis Express */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 shadow-sm">
                  <div className="mb-2">
                    <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-wide text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      SUR MESURE • TOUTES SUPERFICIES
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    Studios, Appartements F3/F4 & Villas R+1/R+2
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Équipe complète de techniciens + matériel lourd Kärcher
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A] mt-5">
                <span>Voir les superficies & Réserver</span>
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMMENT ÇA MARCHE : PARCOURS CLAIR EN 3 ÉTAPES (NOUVELLE SECTION)       */}
      {/* ========================================================================= */}
      <section id="comment-ca-marche" className="py-12 sm:py-16 bg-[#FAFAF8] border-b border-slate-200/60 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              SIMPLICITÉ & TRANSPARENCE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              Comment ça se passe ?
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-normal">
              Un déroulement sans surprise, avec paiement uniquement après contrôle du travail.
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 relative"
            onMouseEnter={() => setStepHovered(true)}
            onMouseLeave={() => setStepHovered(false)}
          >
            {/* Étape 1 */}
            <div 
              onClick={() => {
                setActiveStep(1);
                playHapticClickSound();
              }}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 relative flex flex-col items-start cursor-pointer select-none ${
                activeStep === 1 
                  ? 'border-[#16A34A] ring-3 ring-emerald-500/20 shadow-xl scale-[1.02] bg-emerald-50/30' 
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl font-extrabold text-lg flex items-center justify-center shadow-sm transition-all duration-300 ${
                  activeStep === 1 
                    ? 'bg-[#0D5C3A] text-white scale-110 shadow-md shadow-emerald-900/20' 
                    : 'bg-emerald-100 text-[#0D5C3A]'
                }`}>
                  1
                </div>
                {activeStep === 1 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-bold animate-pulse">
                    <span>En cours</span>
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">
                Vous réservez en 1 minute
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Choisissez votre prestation, votre date et votre quartier à Dakar en ligne ou directement par WhatsApp. Aucun acompte préalable n'est demandé.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-[#16A34A]">
                <span>Prestation au choix</span>
                <span className="text-[10px] text-slate-400">Étape 1/3</span>
              </div>
            </div>

            {/* Étape 2 */}
            <div 
              onClick={() => {
                setActiveStep(2);
                playHapticClickSound();
              }}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 relative flex flex-col items-start cursor-pointer select-none ${
                activeStep === 2 
                  ? 'border-[#16A34A] ring-3 ring-emerald-500/20 shadow-xl scale-[1.02] bg-emerald-50/30' 
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl font-extrabold text-lg flex items-center justify-center shadow-sm transition-all duration-300 ${
                  activeStep === 2 
                    ? 'bg-[#0D5C3A] text-white scale-110 shadow-md shadow-emerald-900/20' 
                    : 'bg-emerald-100 text-[#0D5C3A]'
                }`}>
                  2
                </div>
                {activeStep === 2 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-bold animate-pulse">
                    <span>En cours</span>
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">
                L'équipe arrive équipée
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Mamadou et ses techniciens se déplacent chez vous avec machines professionnelles Kärcher & RUSTGO, rallonges de 25m et produits inoffensifs pour enfants et animaux.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-[#16A34A]">
                <span>Intervention à domicile</span>
                <span className="text-[10px] text-slate-400">Étape 2/3</span>
              </div>
            </div>

            {/* Étape 3 */}
            <div 
              onClick={() => {
                setActiveStep(3);
                playHapticClickSound();
              }}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 relative flex flex-col items-start cursor-pointer select-none ${
                activeStep === 3 
                  ? 'border-[#16A34A] ring-3 ring-emerald-500/20 shadow-xl scale-[1.02] bg-emerald-50/30' 
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="w-full flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl font-extrabold text-lg flex items-center justify-center shadow-sm transition-all duration-300 ${
                  activeStep === 3 
                    ? 'bg-[#0D5C3A] text-white scale-110 shadow-md shadow-emerald-900/20' 
                    : 'bg-emerald-100 text-[#0D5C3A]'
                }`}>
                  3
                </div>
                {activeStep === 3 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-bold animate-pulse">
                    <span>En cours</span>
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">
                Vous vérifiez et vous payez
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Vous inspectez minutieusement le résultat avec notre chef d'équipe. Vous ne réglez qu'une fois 100% satisfait, par Wave, Orange Money ou en espèces.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-[#16A34A]">
                <span>Paiement après résultat</span>
                <span className="text-[10px] text-slate-400">Étape 3/3</span>
              </div>
            </div>
          </div>

          {/* Carte Fondateur & Égérie Réseaux Sociaux (Mamadou - Format soigné et non encombrant) */}
          <div className="mt-10 max-w-3xl mx-auto bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative shrink-0">
              <img 
                src={mamadouFounderImg} 
                alt="Mamadou — Fondateur & Égérie TAARU SET" 
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#0D5C3A]/20 shadow-md"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#16A34A] rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h4 className="font-extrabold text-[#0D5C3A] text-lg">Mamadou</h4>
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Fondateur & Égérie TAARU SET
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
                « Retrouvez-moi sur les réseaux sociaux : TAARU SET est né de ma volonté de professionnaliser le nettoyage à domicile à Dakar. Nos techniciens interviennent chez vous avec un matériel adapté, dans le respect de votre intimité et avec un souci maniaque du résultat. »
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-semibold text-slate-600">
                <a 
                  href="https://wa.me/221771548610?text=Bonjour%20Mamadou%20(TAARU%20SET)%2C%20je%20vous%20contacte%20directement." 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#16A34A] hover:text-[#0D5C3A] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Échanger directement avec Mamadou</span>
                </a>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Supervision directe de l'équipe</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION AVANT / APRÈS (AVEC PHOTOS 100% COHÉRENTES MÊME OBJET)         */}
      {/* ========================================================================= */}
      <BeforeAfterSection handleOpenDrawer={handleOpenDrawer} />

      {/* ========================================================================= */}
      {/* 6. OFFRE ENTREPRISES, BUREAUX & SYNDICS (NOUVELLE SECTION B2B)            */}
      {/* ========================================================================= */}
      <section id="entreprises" className="py-12 sm:py-16 bg-slate-900 text-white relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7">
              <span className="text-[11px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full inline-block mb-3.5">
                B2B • CONTRATS ENTREPRISES & SYNDICS
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Une hygiène irréprochable pour vos bureaux et résidences
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal max-w-xl">
                Cabinets médicaux, sièges de sociétés, agences, showrooms ou copropriétés à Dakar : nous assurons l'entretien de vos moquettes, fauteuils de réunion, salles d'attente et parties communes avec facturation conforme et facilités de règlement.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Contrats mensuels ou passages ponctuels</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Factures officielles avec TVA</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Horaires décalés (soirs/weekends)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Devis sur-mesure gratuit sous 24h</span>
                </div>
              </div>

              <a
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%20(TAARU%20SET)%2C%20je%20vous%20contacte%20pour%20un%20devis%20de%20nettoyage%20r%C3%A9gulier%20pour%20notre%20entreprise%20%2F%20bureau."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#16A34A] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Demander un devis entreprise sur WhatsApp</span>
              </a>
            </div>

            <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-7 backdrop-blur-sm">
              <h3 className="text-base font-bold text-white mb-3">Prestations professionnelles dédiées</h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="pb-3 border-b border-slate-700/60">
                  <strong className="text-emerald-400 block font-bold mb-0.5">Salles d'attente & cabinets médicaux</strong>
                  Désinfection antibactérienne Kärcher et shampouinage régulier des fauteuils patients.
                </li>
                <li className="pb-3 border-b border-slate-700/60">
                  <strong className="text-emerald-400 block font-bold mb-0.5">Moquettes de bureaux & open spaces</strong>
                  Extraction de la poussière incrustée et neutralisation des odeurs sans bloquer votre activité.
                </li>
                <li>
                  <strong className="text-emerald-400 block font-bold mb-0.5">Syndics de copropriété & résidences</strong>
                  Remise en état des halls d'entrée, parkings, vitres en hauteur et paliers d'étage.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TÉMOIGNAGES CLIENTS EN RUBAN DÉFILANT CONTINU (AVIS VÉRIFIÉS DAKAR)    */}
      {/* ========================================================================= */}
      <section id="temoignages" className="py-12 sm:py-16 bg-[#FAFAF8] relative z-10 overflow-hidden border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-7 sm:mb-9">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-bold mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>NOTE GOOGLE & WHATSAPP : 4.9 / 5 (148 AVIS DAKAR)</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Ils nous font confiance à Dakar
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Avis collectés auprès de clients résidant à Dakar
            </div>
          </div>
        </div>

        {/* Ruban Défilant Continu */}
        <div className="marquee-wrapper w-full overflow-hidden flex relative select-none">
          <div className="marquee-track animate-marquee-smooth flex gap-4 sm:gap-6 py-2 hover:[animation-play-state:paused]">
            {[...testimonialsList, ...testimonialsList].map((t, idx) => (
              <div 
                key={idx}
                className="w-80 sm:w-96 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between shrink-0 hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#16A34A]" />
                      <span>Intervention vérifiée</span>
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 font-normal">
                    {t.text}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#0D5C3A] font-extrabold text-xs flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{t.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FAQ COMPLÈTE EN ACCORDÉON (7 QUESTIONS CRUCIALES POUR RASSURER)        */}
      {/* ========================================================================= */}
      <section id="faq" className="py-12 sm:py-16 bg-white relative z-10 border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              TOUT EST TRANSPARENT
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
              Questions Fréquentes
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-normal">
              Les réponses à toutes vos interrogations avant de réserver votre intervention.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Les produits utilisés sont-ils sans danger pour les enfants et les animaux ?",
                a: "Oui, à 100%. Nous utilisons exclusivement des shampoings et détachants professionnels certifiés biodégradables, hypoallergéniques et sans résidus chimiques agressifs. Vos enfants et animaux de compagnie peuvent réutiliser le canapé ou les pièces dès séchage en toute sécurité."
              },
              {
                q: "Combien de temps faut-il pour que le canapé ou le matelas sèche complètement ?",
                a: "Grâce à la forte puissance d'aspiration de nos injecteurs-extracteurs Kärcher, environ 80% de l'humidité est aspirée sur le coup. Le séchage complet s'effectue en 3 à 5 heures à température ambiante, fenêtres ouvertes ou avec un ventilateur."
              },
              {
                q: "De quoi avez-vous besoin chez moi lors de votre arrivée ?",
                a: "Nous arrivons totalement équipés avec nos machines, aspirateurs, produits de décapage et rallonges électriques de 25 mètres. Nous avons uniquement besoin d'un accès à une prise électrique standard et à un point d'eau (robinet extérieur, salle de bain ou cour)."
              },
              {
                q: "Faites-vous des factures pour les entreprises et les syndics de copropriété ?",
                a: "Oui, absolument. Nous émettons des factures professionnelles en bonne et due forme avec TVA pour les sociétés, cabinets médicaux, boutiques et syndics de copropriété. Le règlement peut s'effectuer par virement bancaire, chèque, Wave ou Orange Money."
              },
              {
                q: "Que se passe-t-il si j'ai un empêchement et que je dois annuler ou reporter ?",
                a: "L'annulation et le report sont 100% gratuits. Prévenez simplement Mamadou par message WhatsApp ou appel au moins 2 heures avant le créneau initialement convenu, et nous reprogrammerons sans aucun frais."
              },
              {
                q: "Quelle est votre garantie si une tache ancienne et rebelle persiste ?",
                a: "Nous faisons un diagnostic honnête à notre arrivée. Dans l'immense majorité des cas, nos produits Kärcher éliminent totalement la saleté. Si une tache traitable subsistait après séchage, nous repassons sans frais pour un second traitement ciblé."
              },
              {
                q: "Quels sont les modes de paiement acceptés ?",
                a: "Vous ne réglez qu'après inspection complète du travail avec le chef d'équipe. Vous pouvez payer instantanément par Wave, Orange Money ou en espèces."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-[#FAFAF8] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60"
                  aria-expanded={faqOpen === idx}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${faqOpen === idx ? 'rotate-180 text-[#16A34A]' : ''}`} />
                </button>
                {faqOpen === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. PIED DE PAGE COMPLET : HORAIRES, RÉSEAUX, CONTACT & MENTIONS LÉGALES   */}
      {/* ========================================================================= */}
      

      <footer className="bg-slate-950 text-white py-12 sm:py-14 border-t border-slate-800 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-800">
            
            {/* Colonne 1 : Marque & Slogan */}
            <div className="md:col-span-4 flex flex-col items-start">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#0D5C3A] flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-5 h-5">
                    <path d="M 22 24 L 78 24 L 74 33 L 53 33 L 42 77 L 31 77 L 42 33 L 26 33 Z" fill="#FFFFFF" />
                    <path d="M 52 48 C 65 42 72 58 70 70 C 58 72 46 62 52 48 Z" fill="#4ADE80" />
                  </svg>
                </div>
                <span className="font-extrabold text-base tracking-tight">TAARU SET DAKAR</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-sm font-normal">
                Service professionnel de nettoyage à domicile et en entreprise à Dakar. Lavage auto mobile, canapés Kärcher et remise à neuf fin de chantier.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Intervention 7j/7 • 08h00 à 19h00</span>
              </div>
            </div>

            {/* Colonne 2 : Liens Rapides */}
            <div className="md:col-span-4 flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><a href="#services" className="hover:text-emerald-400 transition-colors">Nos 3 Formules Clés</a></li>
                <li><a href="#comment-ca-marche" className="hover:text-emerald-400 transition-colors">Comment ça marche (3 étapes)</a></li>
                <li><a href="#avant-apres" className="hover:text-emerald-400 transition-colors">Comparateur Avant / Après</a></li>
                <li><a href="#entreprises" className="hover:text-emerald-400 transition-colors">Contrats Entreprises & Syndics</a></li>
                <li><a href="#temoignages" className="hover:text-emerald-400 transition-colors">Avis Clients Dakar</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition-colors">Questions Fréquentes</a></li>
              </ul>
            </div>

            {/* Colonne 3 : Contact Direct & Zone */}
            <div className="md:col-span-4 flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Contact & Zone d'Intervention</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>+221 77 154 86 10 / +221 78 762 05 64</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dakar & toute la banlieue sénégalaise</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Paiements acceptés : Wave, Orange Money, Cash</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <a 
                  href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20un%20renseignement."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Écrire à Mamadou sur WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* Ligne Inférieure : Droits & Modales */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 TAARU SET. Tous droits réservés. Dakar, Sénégal.
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLegalModalOpen(true)}
                className="hover:text-slate-300 underline cursor-pointer"
              >
                Mentions Légales & Confidentialité
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 10. MODALE MENTIONS LÉGALES & CONFIDENTIALITÉ                              */}
      {/* ========================================================================= */}
      {legalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Mentions Légales & Confidentialité</h3>
              <button 
                type="button" 
                onClick={() => setLegalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Éditeur du service :</strong> TAARU SET Dakar, entreprise de nettoyage professionnel et rénovation à domicile, dirigée par Mamadou (+221 77 154 86 10).
              </p>
              <p>
                <strong>Données personnelles & Réservations :</strong> Les coordonnées renseignées dans le formulaire (nom, numéro de téléphone, quartier) sont utilisées exclusivement pour vous recontacter sur WhatsApp afin de confirmer votre prestation. Aucune donnée n'est revendue à des tiers.
              </p>
              <p>
                <strong>Paiements :</strong> Les paiements s'effectuent de gré à gré après constatation des travaux par Wave, Orange Money ou espèces. Aucun numéro de carte bancaire n'est requis sur ce site.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. TIROIR GLISSANT DE RÉSERVATION (ACCESSIBLE ROLE=DIALOG)                */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Backdrop sombre flouté */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
          ></div>

          {/* Panneau latéral coulissant */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between z-10 overflow-y-auto drawer-slide-in">
            
            {/* Header du tiroir */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold shrink-0">
                  {drawerService === 'auto' && <Car className="w-5 h-5" />}
                  {drawerService === 'textile' && <Sofa className="w-5 h-5" />}
                  {drawerService === 'chantier' && <Home className="w-5 h-5" />}
                </div>
                <div>
                  <h3 id="drawer-title" className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    {servicesConfig[drawerService].title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
                    Configurez votre intervention en 4 étapes simples
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fermer le tiroir"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du formulaire interactif */}
            <div className="p-5 sm:p-6 space-y-7">
              
              {/* Message d'erreur de validation si manquement */}
              {validationError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Onglets rapides pour changer de service directement dans le tiroir */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerService('auto');
                    setSelectedPack(servicesConfig.auto.packs[0]);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${drawerService === 'auto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Voiture
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerService('textile');
                    setSelectedPack(servicesConfig.textile.packs[0]);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${drawerService === 'textile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Canapé / Textile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawerService('chantier');
                    setSelectedPack(servicesConfig.chantier.packs[0]);
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${drawerService === 'chantier' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Chantier
                </button>
              </div>

              {/* ÉTAPE 1 : CHOISIR LA PROPOSITION / FORMULE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  1. Choisissez votre formule
                </label>
                <div className="space-y-2.5">
                  {servicesConfig[drawerService].packs.map((pack, idx) => {
                    const isSelected = selectedPack?.name === pack.name;
                    const isSub = pack.isSubscription;

                    if (isSub) {
                      return (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPack(pack)}
                          aria-pressed={isSelected}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md ${
                            isSelected 
                              ? 'border-lime-400 bg-slate-950 text-white ring-2 ring-lime-400/30' 
                              : 'border-slate-800 bg-slate-900 text-white hover:border-emerald-400'
                          }`}
                        >
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-lime-400/20 text-lime-400 text-[10px] font-black uppercase mb-1.5 whitespace-nowrap">
                              <Zap className="w-3 h-3" />
                              <span>FORMULE ABONNEMENT (-30%)</span>
                            </div>
                            <div className="text-sm font-black text-white">{pack.name}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">{pack.detail}</div>
                          </div>
                          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <div className="font-black text-sm sm:text-base text-lime-400 whitespace-nowrap">
                              {new Intl.NumberFormat('fr-FR').format(pack.price)} F / mois
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium">4 passages programmés</div>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPack(pack)}
                        aria-pressed={isSelected}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'border-[#16A34A] bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="text-sm font-bold text-slate-900">{pack.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{pack.detail}</div>
                        </div>
                        <div className="font-bold text-sm text-[#0D5C3A] shrink-0">
                          {new Intl.NumberFormat('fr-FR').format(pack.price)} F
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÉTAPE 2 : SÉLECTION DU JOUR (CHOIX OBLIGATOIRE SANS PRÉSÉLECTION) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    {selectedPack?.isSubscription ? "2. Planning de vos 4 passages" : "2. Choisissez le jour d'intervention"}
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${selectedDay ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedPack?.isSubscription 
                      ? ((recurringDay.includes('libres') || recurringDay.includes('personnalisées')) ? '4 dates au choix' : recurringDay.replace(' (4 passages)', '')) 
                      : (selectedDay || 'Choix requis *')}
                  </span>
                </div>

                {selectedPack?.isSubscription ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">
                      L'équipe passera 4 fois dans le mois. Choisissez un jour fixe par semaine OU 4 dates libres :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Tous les Samedis (4 passages)',
                        'Tous les Dimanches (4 passages)',
                        'Tous les Lundis (4 passages)',
                        'Tous les Mercredis (4 passages)',
                        'Tous les Vendredis (4 passages)',
                        '4 dates personnalisées dans le mois'
                      ].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setRecurringDay(item)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                            recurringDay === item
                              ? 'border-[#16A34A] bg-[#0D5C3A] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    {recurringDay === '4 dates personnalisées dans le mois' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0D5C3A]">
                          <Calendar className="w-4 h-4 text-[#16A34A]" />
                          <span>Choisissez vos 4 passages dans le mois :</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                              <label htmlFor={`passage-date-${idx}`} className="block text-[10px] font-extrabold uppercase tracking-wider text-[#0D5C3A] mb-1">
                                Passage #{idx + 1}
                              </label>
                              <input 
                                id={`passage-date-${idx}`}
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={customPassageDates[idx] || ''}
                                onChange={(e) => {
                                  const updated = [...customPassageDates];
                                  updated[idx] = e.target.value;
                                  setCustomPassageDates(updated);
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#16A34A]"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label htmlFor="sub-notes" className="block text-[11px] font-bold text-slate-700 mb-1">
                            Préférences ou rythme souhaité (optionnel) :
                          </label>
                          <input 
                            id="sub-notes"
                            type="text"
                            placeholder="Ex : 1er et 3ème samedi, 2ème et 4ème vendredi..."
                            value={subscriptionNotes}
                            onChange={(e) => setSubscriptionNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                      {nextDays.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSelectedDay(d.id);
                            setValidationError('');
                          }}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            selectedDay === d.id
                              ? 'border-[#16A34A] bg-[#0D5C3A] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <div className="text-[11px] font-bold">{d.short}</div>
                          <div className="text-xs font-semibold opacity-90">{d.dateNum}</div>
                        </button>
                      ))}
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Calendar className="w-4 h-4 text-[#16A34A]" />
                        <label htmlFor="custom-date-input">Ou autre date sur calendrier :</label>
                      </div>
                      <input 
                        id="custom-date-input"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const parts = e.target.value.split('-');
                            setSelectedDay(`Date du ${parts[2]}/${parts[1]}/${parts[0]}`);
                            setValidationError('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#16A34A]"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* ÉTAPE 3 : SÉLECTION DE L'HEURE (CHOIX OBLIGATOIRE SANS PRÉSÉLECTION) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    3. Choisissez votre créneau horaire
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${selectedTime ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedTime || 'Choix requis *'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot.id);
                        setValidationError('');
                      }}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        selectedTime === slot.id
                          ? 'border-[#16A34A] bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <span>{slot.id}</span>
                      {selectedTime === slot.id && <Check className="w-4 h-4 text-[#16A34A]" />}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-[#16A34A]" />
                    <label htmlFor="custom-time-input">Ou fixer une heure exacte :</label>
                  </div>
                  <input 
                    id="custom-time-input"
                    type="time"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedTime(`Heure exacte : ${e.target.value}`);
                        setValidationError('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* ÉTAPE 4 : LIEU & ADRESSE À DAKAR (ÉLARGI AVEC AUTRE QUARTIER) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  4. Quartier & Coordonnées à Dakar
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Déplacement inclus partout à Dakar et dans la région :
                </p>
                
                {/* Sélecteur de quartier complet (17 quartiers) */}
                <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200/60">
                  {dakarQuarters.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setClientQuarter(q)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        clientQuarter === q 
                          ? 'bg-[#0D5C3A] text-white shadow-xs' 
                          : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200/60'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Champ quartier libre si "Autre quartier" */}
                {clientQuarter === 'Autre quartier' && (
                  <div className="mb-3">
                    <label htmlFor="custom-quarter-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                      Précisez votre quartier ou ville :
                    </label>
                    <input 
                      id="custom-quarter-input"
                      type="text" 
                      placeholder="Ex : Yeumbeul, Sébikotane, Bargny, Cambérène..." 
                      value={customQuarter}
                      onChange={(e) => setCustomQuarter(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label htmlFor="client-address" className="block text-[11px] font-bold text-slate-700 mb-1">
                      Adresse précise ou repère :
                    </label>
                    <input 
                      id="client-address"
                      type="text" 
                      placeholder="Ex: En face Pharmacie du Golf, Villa n°12..." 
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="client-name" className="block text-[11px] font-bold text-slate-700 mb-1">
                        Votre nom complet :
                      </label>
                      <input 
                        id="client-name"
                        type="text" 
                        placeholder="Ex: Cheikh Diop" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="client-phone" className="block text-[11px] font-bold text-slate-700 mb-1">
                        Numéro WhatsApp :
                      </label>
                      <input 
                        id="client-phone"
                        type="tel" 
                        placeholder="Ex: 77 154 86 10" 
                        value={clientPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                      />
                      {phoneError && (
                        <p className="text-[10px] text-amber-600 mt-1 font-semibold">{phoneError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Pied du tiroir : Récapitulatif et validation WhatsApp */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 sm:p-6 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total de votre prestation :</div>
                  <div className="text-xl font-extrabold text-[#0D5C3A]">
                    {selectedPack ? new Intl.NumberFormat('fr-FR').format(selectedPack.price) : 0} FCFA
                  </div>
                </div>
                
            {/* Reassurance Mamadou dans le Drawer */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 mb-3">
              <img 
                src={mamadouFounderImg} 
                alt="Mamadou" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-[#0D5C3A] shrink-0 shadow-xs"
              />
              <div className="text-left">
                <div className="text-xs font-extrabold text-[#0D5C3A]">Mamadou traite personnellement votre demande</div>
                <div className="text-[11px] text-slate-600">Confirmation immédiate de l'horaire et de l'équipe sur WhatsApp</div>
              </div>
            </div>
<div className="text-[11px] text-right text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Déplacement inclus à Dakar
                </div>
              </div>

              <button 
                type="button"
                onClick={handleConfirmReservation}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer ma demande à Mamadou sur WhatsApp</span>
              </button>

              <div className="text-[11px] text-center text-slate-400">
                Paiement après travail vérifié • Wave & Orange Money acceptés
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODALE DE RÉCAPITULATIF & CONFIRMATION DE DEMANDE                      */}
      {/* ========================================================================= */}
      {reservationSummary && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <span className="text-[11px] uppercase font-black tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
              DEMANDE TRANSMISE SUR WHATSAPP
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Votre demande a bien été envoyée !
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal max-w-md">
              Mamadou et l'équipe <strong className="text-slate-900">TAARU SET</strong> ont reçu votre récapitulatif sur WhatsApp. Nous vous contactons pour confirmer l'horaire précis et le déplacement de l'équipe.
            </p>

            <div className="w-full bg-[#FAFAF8] rounded-2xl p-4 sm:p-5 border border-slate-200/80 text-left space-y-2.5 text-xs mb-6 font-medium">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Service :</span>
                <span className="font-bold text-slate-900">{reservationSummary.service}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Formule :</span>
                <span className="font-bold text-slate-900">{reservationSummary.pack}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Tarif total :</span>
                <span className="font-black text-[#0D5C3A] text-sm">{reservationSummary.price}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Date :</span>
                <span className="font-bold text-slate-900">{reservationSummary.dateInfo}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Créneau horaire :</span>
                <span className="font-bold text-slate-900">{reservationSummary.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lieu d'intervention :</span>
                <span className="font-bold text-slate-900 text-right">{reservationSummary.quarter} • {reservationSummary.address}</span>
              </div>
            </div>

            <div className="w-full mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Délai moyen de confirmation : 15 minutes</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setReservationSummary(null)}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <a
                href="https://wa.me/221771548610"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Rouvrir la discussion WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. BOUTON FLOTTANT WHATSAPP DIRECT (AVEC ARIA-LABEL CONFORME A11Y)       */}
      {/* ========================================================================= */}
      <a 
        href="https://wa.me/221771548610?text=Bonjour%20Mamadou%20(TAARU%20SET)%2C%20je%20souhaite%20un%20renseignement."
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn fixed bottom-5 right-5 z-40 bg-[#16A34A] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        aria-label="Contacter Mamadou sur WhatsApp au +221 77 154 86 10"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold pr-1">Mamadou en direct</span>
      </a>

    </div>
  );
}
