import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, Phone, MessageSquare, Clock, ShieldCheck, 
  MapPin, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Check, Star, Wrench, Droplets, 
  Car, Home, Sofa, RefreshCw, Calculator, Send, Zap, Award, ThumbsUp
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Vraie Photo officielle de Mamadou et équipe TAARU SET (Vite Bundler)
import teamLobbyImg from './assets/team_lobby.jpg';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // --- ÉTATS INTERACTIFS ---
  const [activeTab, setActiveTab] = useState('textile');
  const [selectedItem, setSelectedItem] = useState({ name: 'Fauteuil 1 place', price: 3500 });
  const [options, setOptions] = useState({
    antiAcariens: false,
    tachesTenaces: false
  });
  const [sliderPos, setSliderPos] = useState(50);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);
  const [activeServiceZoom, setActiveServiceZoom] = useState(null);

  // Références d'animation
  const heroRef = useRef(null);
  const statsRef = useRef(null);

  // --- 1. DÉPLACEMENT AUTOMATIQUE ET AUTONOME DU SLIDER AVANT/APRÈS ---
  useEffect(() => {
    let animId;
    let startTimestamp = null;

    const animateLoop = (timestamp) => {
      if (!isSliderHovered) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = (timestamp - startTimestamp) / 1000;
        // Oscille de façon fluide et naturelle entre 22% et 78% (vitesse optimale)
        const pos = 50 + 26 * Math.sin(elapsed * 1.6);
        setSliderPos(Number(pos.toFixed(1)));
      } else {
        startTimestamp = null;
      }
      animId = requestAnimationFrame(animateLoop);
    };

    animId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isSliderHovered]);

  // --- 2. SÉCURISATION VISUELLE DES TARIFS (PAS DE SAUT D'OPACITÉ GSAP) ---
  useEffect(() => {
    // Les cartes de tarifs restent 100% visibles immédiatement sans risque d'écran blanc
  }, []);

  // --- CARROUSEL AUTOMATIQUE DES TÉMOIGNAGES ---
  useEffect(() => {
    if (isTestimonialPaused) return;
    const interval = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % testimonialsList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isTestimonialPaused]);

  // --- DONNÉES DES 6 TÉMOIGNAGES CLIENTS VÉRIFIÉS DAKAR ---
  const testimonialsList = [
    {
      initials: 'FD',
      name: 'Fadel D.',
      location: 'Villa aux Almadies • Fin de Chantier',
      rating: 5,
      text: '« Après 6 mois de travaux dans ma villa aux Almadies, la poussière et les traces de ciment semblaient irrécupérables. TAARU SET a rendu la maison impeccable en une seule journée. Ponctuels et équipés comme des pros. »'
    },
    {
      initials: 'AS',
      name: 'Aïcha S.',
      location: 'Appartement F4 à Mermoz • Canapés',
      rating: 5,
      text: '« Mon canapé d\'angle beige avait des taches d\'eau et de soda faites par les enfants. Mamadou l\'a complètement restauré ! Aucune odeur chimique désagréable et tissu sec le soir même. »'
    },
    {
      initials: 'CT',
      name: 'Cheikh T.',
      location: 'Cadre d\'entreprise • Pack Auto Mensuel (Point E)',
      rating: 5,
      text: '« Le pack mensuel de lavage auto au bureau à Point E me fait gagner un temps précieux. Ils viennent avec leur matériel autonome, lavent sans dégâts et je règle par Wave en 10 secondes. »'
    },
    {
      initials: 'MB',
      name: 'Mariama B.',
      location: 'Résidence à Fann • Canapé Velours & Tapis',
      rating: 5,
      text: '« Très impressionnée par le respect des matières délicates. Mon grand tapis persan et mon canapé en velours ont retrouvé leurs couleurs d\'origine sans aucune décoloration. Un travail d\'orfèvre ! »'
    },
    {
      initials: 'ON',
      name: 'Ousmane N.',
      location: 'Plateau • Moquette de Bureaux 120m²',
      rating: 5,
      text: '« Intervention programmée un samedi pour ne pas perturber nos équipes au Plateau. Le lundi matin à 8h, les moquettes étaient sèches, désinfectées et sentaient le frais. De vrais pros fiables. »'
    },
    {
      initials: 'KD',
      name: 'Khady D.',
      location: 'Villa R+1 à Ngor • Remise en état avant location',
      rating: 5,
      text: '« Les locataires précédents avaient laissé les vitres et sanitaires dans un état critique. L\'équipe TAARU SET a tout décapé à la vapeur Kärcher. Le nouveau locataire a signé dès la première visite ! »'
    }
  ];

  // --- DONNÉES EXACTES DES AFFICHES TAARU SET ---
  const servicesData = {
    chantier: [
      { name: 'Studio / F1', detail: 'Surface 9 à 35 m²', price: 45000, tag: 'Éco' },
      { name: 'Appartement F2 – F3', detail: 'Surface 36 à 80 m²', price: 125000, tag: 'Standard' },
      { name: 'Villa Individuelle', detail: 'Surface 81 à 200 m²', price: 260000, tag: 'Recommandé' },
      { name: 'Grande Villa R+1', detail: 'Surface 201 à 300 m²', price: 390000, tag: 'Prestige' },
    ],
    textile: [
      { name: 'Fauteuil 1 place / Pouf', detail: 'Nettoyage vapeur & injection', price: 3500, tag: 'Essentiel' },
      { name: 'Canapé 2 places', detail: 'Dépoussiérage et désinfection', price: 7000, tag: 'Populaire' },
      { name: 'Canapé 3 places', detail: 'Shampouinage en profondeur', price: 12000, tag: 'Top Vente' },
      { name: 'Canapé d\'Angle (5-6 pl.)', detail: 'Restauration complète des fibres', price: 22000, tag: 'Grand Format' },
      { name: 'Matelas 2 Places', detail: 'Traitement acariens & auréoles', price: 12000, tag: 'Santé' },
      { name: 'Pack Salon Complet (-10%)', detail: 'Canapé 3 pl. + 2 fauteuils + tapis', price: 18000, tag: 'Offre Spéciale' },
    ],
    auto: [
      { name: 'Citadine / Berline (Extérieur)', detail: 'Carrosserie, vitres, jantes & pneus', price: 3000, tag: 'Express' },
      { name: 'Citadine (Extérieur + Profond)', detail: 'Aspiration totale, sièges & plastiques', price: 15000, tag: 'Complet' },
      { name: 'SUV / 4x4 (Extérieur)', detail: 'Finition brillante sans rayures', price: 5000, tag: '4x4' },
      { name: 'SUV / 4x4 (Extérieur + Profond)', detail: 'Nettoyage VIP à domicile ou bureau', price: 20000, tag: 'VIP' },
      { name: 'Pick-up / Minivan (Profond)', detail: 'Traitement complet gros volume', price: 30000, tag: 'Maxi' },
      { name: 'Pack Mensuel Sérénité (4x/mois)', detail: '2 simples + 2 profonds dans le mois', price: 30000, tag: '-17% Réduction' },
    ]
  };

  // Calcul du Total
  const calculateTotal = () => {
    let base = selectedItem.price || 0;
    let opt = 0;
    if (options.antiAcariens) opt += 3000;
    if (options.tachesTenaces) opt += 4000;
    return base + opt;
  };

  const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(val) + " FCFA";

  // Envoi WhatsApp avec Devis Pré-rempli
  const handleSendWhatsApp = () => {
    let optStr = '';
    if (options.antiAcariens) optStr += '%0A- Traitement anti-acariens & désodorisation (+3 000 FCFA)';
    if (options.tachesTenaces) optStr += '%0A- Détachage taches tenaces (+4 000 FCFA)';

    const total = calculateTotal();
    const msg = `Bonjour Mamadou (TAARU SET), je souhaite réserver une prestation :%0A%0A*Prestation :* ${selectedItem.name} (${formatPrice(selectedItem.price)})${optStr}%0A%0A*TOTAL ESTIMÉ :* ${formatPrice(total)}%0A%0AMerci de me confirmer la disponibilité d'une équipe chez moi à Dakar !`;

    window.open(`https://wa.me/221771548610?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-800 relative selection:bg-[#15803D] selection:text-white">

      {/* ========================================================================= */}
      {/* 1. NAVBAR ÉPURÉE SANS SLOGAN ENCOMBRANT (Correction Demandée)             */}
      {/* ========================================================================= */}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
        <nav className="w-full max-w-6xl bg-white/95 backdrop-blur-md border border-emerald-900/10 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-[0_12px_35px_-8px_rgba(13,92,58,0.15)] flex items-center justify-between pointer-events-auto">
          
          {/* Logo Net & Nettoyé (Sans la phrase en bas qui dérangeait) */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#0D5C3A] to-[#092B17] flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-base tracking-tighter">T</span>
              <Sparkles className="w-3.5 h-3.5 text-lime-400 -ml-1 -mt-2" />
            </div>
            <div className="flex items-center gap-1 font-black text-base sm:text-lg tracking-tight text-slate-900 leading-none">
              <span>TAARU</span>
              <span className="text-[#15803D]">SET</span>
            </div>
          </a>

          {/* Menu Liens (Desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#services" className="hover:text-[#15803D] transition-colors">Prestations & Tarifs</a>
            <a href="#chantier" className="hover:text-[#15803D] transition-colors">Fin de Chantier</a>
            <a href="#textile" className="hover:text-[#15803D] transition-colors">Canapés & Tapis</a>
            <a href="#auto" className="hover:text-[#15803D] transition-colors">Lavage Auto</a>
            <a href="#temoignages" className="hover:text-[#15803D] transition-colors">Avis Clients</a>
            <a href="#calculateur" className="text-[#0D5C3A] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 font-extrabold">
              <Calculator className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Calculateur Devis</span>
            </a>
          </div>

          {/* Bouton CTA Devis WhatsApp (Pill Dakar 7j/7 retiré selon demande) */}
          <div className="flex items-center">
            <a 
              href="https://wa.me/221771548610?text=Bonjour%20TAARU%20SET%2C%20je%20souhaite%20un%20devis."
              target="_blank"
              rel="noreferrer"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0D5C3A] to-[#15803D] hover:from-[#15803D] hover:to-[#16A34A] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-900/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Devis WhatsApp</span>
            </a>
          </div>

        </nav>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION : L'INSTRUMENT DIGITAL                                    */}
      {/* ========================================================================= */}
      <section ref={heroRef} className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-[#F8FAF7] to-white bg-grid-subtle">
        
        {/* Lueurs d'ambiance */}
        <div className="absolute top-1/4 -left-40 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-lime-300/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Colonne Texte (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col items-start">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200/80 shadow-xs mb-5">
                <span className="flex text-amber-400 text-xs">★★★★★</span>
                <span className="text-xs font-extrabold text-emerald-950">N°1 du Nettoyage Vapeur & Haute Pression</span>
                <span className="text-[10px] bg-emerald-100 text-[#092B17] font-black px-2 py-0.5 rounded-full">KÄRCHER PRO</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-5">
                L'Excellence du Propre,
                <span className="font-serif italic font-normal text-[#0D5C3A] block mt-1 sm:mt-2">
                  directement chez vous.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl mb-7">
                <strong className="text-slate-900 font-bold">« On vient chez vous. Vous profitez du propre. »</strong><br />
                Nettoyage complet fin de chantier après travaux, shampouinage en profondeur de canapés, matelas, tapis, et lavage auto mobile à domicile ou au bureau partout à Dakar.
              </p>

              {/* 3 Piliers de Confiance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-8">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold text-sm">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Matériel Kärcher</div>
                    <div className="text-[10px] text-slate-500">Injection-extraction pro</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Éco-Certifié</div>
                    <div className="text-[10px] text-slate-500">Sans danger bébés/animaux</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold text-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Délai 45 min</div>
                    <div className="text-[10px] text-slate-500">Équipe rapide sur Dakar</div>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                <a 
                  href="#calculateur"
                  className="px-7 py-3.5 rounded-2xl bg-[#0D5C3A] hover:bg-[#15803D] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/20 hover:scale-[1.03] active:scale-95 transition-all text-center flex items-center justify-center gap-2.5"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Estimer mon tarif immédiat</span>
                  <ArrowRight className="w-4 h-4 text-lime-400" />
                </a>

                <a 
                  href="tel:+221787620564"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-800 font-bold text-sm sm:text-base border border-emerald-200 shadow-xs hover:border-emerald-400 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#0D5C3A]" />
                  <span>+221 78 762 05 64</span>
                </a>
              </div>

              {/* Mentions de Paiement */}
              <div className="flex items-center gap-3 mt-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Paiement après travail validé</span>
                </div>
                <span>•</span>
                <span className="font-bold text-sky-600">Wave</span>
                <span>/</span>
                <span className="font-bold text-orange-600">Orange Money</span>
                <span>/</span>
                <span>Espèces</span>
              </div>

            </div>

            {/* Colonne Droite : Vraie Photo Mamadou & Kärcher (Chemin relatif robuste) */}
            <div className="lg:col-span-5 relative flex justify-center">
              
              <div className="tilt-card w-full max-w-md bg-white p-3.5 sm:p-4 rounded-[2.2rem] shadow-[0_20px_60px_-15px_rgba(13,92,58,0.22)] border border-emerald-200/90 relative">
                
                <div className="relative rounded-[1.8rem] overflow-hidden bg-slate-100 aspect-[4/5] shadow-inner">
                  <img 
                    src={teamLobbyImg} 
                    alt="Mamadou et l'équipe officielle TAARU SET avec aspirateur Kärcher professionnel" 
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" 
                  />

                  {/* Gradient inférieur */}
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent"></div>

                  <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-lime-400">ÉQUIPE OFFICIELLE</div>
                      <div className="text-sm font-extrabold">Mamadou & Les Experts TAARU SET</div>
                    </div>
                    <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-mono font-bold border border-white/30">
                      DAKAR 🇸🇳
                    </div>
                  </div>
                </div>

                {/* Badges Flottants */}
                <div className="absolute -bottom-5 -left-4 sm:-left-5 bg-white p-3 rounded-2xl shadow-lg border border-emerald-100 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                    ★
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">+500 Clients Ravis</div>
                    <div className="text-[10px] text-slate-500">Almadies, Mermoz, Plateau...</div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-[#0D5C3A] text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
                  <span className="text-[10px] font-bold font-mono">DÉPLACEMENT INCLUS</span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TÉLÉMÉTRIE D'AUTORITÉ                                                  */}
      {/* ========================================================================= */}
      <section id="stats" ref={statsRef} className="py-10 bg-white border-y border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="stat-box flex flex-col items-center">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0D5C3A] mb-0.5">+500</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">Interventions Réussies</span>
              <span className="text-[10px] text-slate-500">Maisons, villas, bureaux à Dakar</span>
            </div>

            <div className="stat-box flex flex-col items-center">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0D5C3A] mb-0.5">100%</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">Kärcher Injection Pro</span>
              <span className="text-[10px] text-slate-500">Aspiration haute puissance</span>
            </div>

            <div className="stat-box flex flex-col items-center">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0D5C3A] mb-0.5">0 FCFA</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">De Frais Cachés</span>
              <span className="text-[10px] text-slate-500">Prix clair annoncé avant intervention</span>
            </div>

            <div className="stat-box flex flex-col items-center">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#0D5C3A] mb-0.5">3 à 5h</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">Temps de Séchage</span>
              <span className="text-[10px] text-slate-500">Extraction quasi-totale de l'eau</span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LES 3 PÔLES & TARIFS AVEC EFFETS DE ZOOM TACTILES DYNAMIQUES           */}
      {/* ========================================================================= */}
      <section id="services" className="py-20 bg-[#F8FAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full">
              NOS 3 DOMAINES D'EXPERTISE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Des Tarifs Fixés en FCFA,
              <span className="font-serif italic font-normal text-[#0D5C3A] block">
                une propreté sans compromis.
              </span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              Cliquez sur une formule pour l'examiner et zoomer dessus sans quitter votre écran.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
            
            {/* PÔLE 1 : FIN DE CHANTIER (Avec Zoom Réactif au Clic) */}
            <div 
              id="chantier" 
              onClick={() => setActiveServiceZoom(activeServiceZoom === 'chantier' ? null : 'chantier')}
              className={`service-card bg-white rounded-[2.2rem] p-6 sm:p-7 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative ${
                activeServiceZoom === 'chantier' 
                  ? 'scale-[1.03] shadow-2xl border-[#15803D] ring-4 ring-emerald-500/20' 
                  : 'border-emerald-200/90 shadow-lg hover:scale-[1.015]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-[#092B17] text-[11px] font-black uppercase tracking-wider">PÔLE 01</span>
                  <span className="text-xs font-mono font-bold text-slate-400">Dès 45 000 FCFA</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">Fin de Chantier</h3>
                <p className="text-xs text-slate-500 mb-5">Remise en état complète de logements après travaux, rénovation ou avant emménagement.</p>

                {/* Grille Tarifs Réels Affiche */}
                <div className="space-y-2.5 mb-6">
                  {servicesData.chantier.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('chantier');
                        setSelectedItem(item);
                        document.getElementById('calculateur')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.03] hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.detail}</div>
                      </div>
                      <div className="font-mono text-sm font-black text-[#0D5C3A]">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-slate-700 space-y-1 mb-6">
                  <div className="font-bold text-slate-900">Inclus dans la prestation :</div>
                  <div className="text-[11px] text-slate-600">✓ Traces de ciment, colle, résidus de peinture</div>
                  <div className="text-[11px] text-slate-600">✓ Vitres, menuiseries, dépoussiérage des murs</div>
                  <div className="text-[11px] text-slate-600">✓ Désinfection complète sanitaires & cuisine</div>
                </div>
              </div>

              <a 
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20un%20devis%20Fin%20de%20Chantier." 
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#0D5C3A] hover:bg-[#15803D] text-white font-bold text-xs text-center shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Réserver Fin de Chantier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* PÔLE 2 : TEXTILES & SALONS (Avec Zoom Réactif au Clic) */}
            <div 
              id="textile" 
              onClick={() => setActiveServiceZoom(activeServiceZoom === 'textile' ? null : 'textile')}
              className={`service-card bg-white rounded-[2.2rem] p-6 sm:p-7 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between relative lg:-translate-y-2 ${
                activeServiceZoom === 'textile'
                  ? 'scale-[1.04] shadow-2xl border-[#16A34A] ring-4 ring-emerald-500/30'
                  : 'border-[#16A34A] shadow-xl hover:scale-[1.02]'
              }`}
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                LE PLUS POPULAIRE
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-[#092B17] text-[11px] font-black uppercase tracking-wider">PÔLE 02</span>
                  <span className="text-xs font-mono font-bold text-[#15803D]">Dès 2 000 FCFA</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">Canapés, Matelas & Tapis</h3>
                <p className="text-xs text-slate-500 mb-5">Shampouinage en profondeur et désinfection complète de tous vos textiles d'ameublement.</p>

                <div className="space-y-2.5 mb-6">
                  {servicesData.textile.slice(0, 4).map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('textile');
                        setSelectedItem(item);
                        document.getElementById('calculateur')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.03] hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.detail}</div>
                      </div>
                      <div className="font-mono text-sm font-black text-[#0D5C3A]">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>

                {/* Forfait Salon -10% */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#0D5C3A] text-white text-xs mb-6 shadow-md hover:scale-[1.02] transition-transform">
                  <div className="flex items-center justify-between font-black mb-1">
                    <span>🎁 FORFAIT SALON COMPLET</span>
                    <span className="bg-lime-400 text-slate-900 px-2 py-0.5 rounded-full font-mono text-[10px]">-10%</span>
                  </div>
                  <p className="text-emerald-100 text-[11px]">Canapé 3 places + 2 fauteuils + grand tapis. Séchage rapide en quelques heures.</p>
                </div>
              </div>

              <a 
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20un%20nettoyage%20de%20Canap%C3%A9%20ou%20Salon." 
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:from-[#15803D] hover:to-[#22C55E] text-white font-extrabold text-xs text-center shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Commander Nettoyage Salon</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* PÔLE 3 : LAVAGE AUTO MOBILE (Avec Zoom Réactif au Clic) */}
            <div 
              id="auto" 
              onClick={() => setActiveServiceZoom(activeServiceZoom === 'auto' ? null : 'auto')}
              className={`service-card bg-white rounded-[2.2rem] p-6 sm:p-7 border transition-all duration-300 cursor-pointer flex flex-col justify-between relative ${
                activeServiceZoom === 'auto'
                  ? 'scale-[1.03] shadow-2xl border-[#15803D] ring-4 ring-emerald-500/20'
                  : 'border-emerald-200/90 shadow-lg hover:scale-[1.015]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-[#092B17] text-[11px] font-black uppercase tracking-wider">PÔLE 03</span>
                  <span className="text-xs font-mono font-bold text-slate-400">Dès 3 000 FCFA</span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">Lavage Auto Mobile</h3>
                <p className="text-xs text-slate-500 mb-5">À domicile ou au bureau. Nous apportons notre eau et notre équipement sans déranger.</p>

                <div className="space-y-2.5 mb-6">
                  {servicesData.auto.slice(0, 4).map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('auto');
                        setSelectedItem(item);
                        document.getElementById('calculateur')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.03] hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.detail}</div>
                      </div>
                      <div className="font-mono text-sm font-black text-[#0D5C3A]">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-slate-700 space-y-1 mb-6">
                  <div className="font-bold text-slate-900">Le soin auto TAARU SET :</div>
                  <div className="text-[11px] text-slate-600">✓ Peu d'eau utilisée, aucune flaque devant chez vous</div>
                  <div className="text-[11px] text-slate-600">✓ Rénovation des plastiques et vitres sans traces</div>
                  <div className="text-[11px] text-slate-600">✓ Packs mensuels économiques dès 30 000 FCFA</div>
                </div>
              </div>

              <a 
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20r%C3%A9server%20un%20lavage%20auto%20%C3%A0%20domicile." 
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#0D5C3A] hover:bg-[#15803D] text-white font-bold text-xs text-center shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Réserver Lavage Auto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ARTEFACT INTERACTIF N°1 : CALCULATEUR DE DEVIS EN TEMPS RÉEL           */}
      {/* ========================================================================= */}
      <section id="calculateur" className="py-20 bg-white border-t border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full">
              INSTRUMENT DIGITAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Calculez Votre Tarif
              <span className="font-serif italic font-normal text-[#0D5C3A] block">
                en temps réel.
              </span>
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              Cliquez pour choisir un élément : le montant exact en FCFA s'ajuste instantanément.
            </p>
          </div>

          <div className="bg-[#F8FAF7] rounded-[2.2rem] p-5 sm:p-9 border border-emerald-200 shadow-xl">
            
            {/* Onglets 3 Pôles */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 p-1.5 bg-white rounded-2xl border border-emerald-200 mb-7">
              <button
                onClick={() => {
                  setActiveTab('textile');
                  setSelectedItem(servicesData.textile[0]);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'textile' 
                    ? 'bg-[#0D5C3A] text-white shadow-sm scale-[1.01]' 
                    : 'text-slate-600 hover:text-[#0D5C3A] hover:bg-emerald-50'
                }`}
              >
                <Sofa className="w-4 h-4" />
                <span>Canapés & Textiles</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('chantier');
                  setSelectedItem(servicesData.chantier[0]);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'chantier' 
                    ? 'bg-[#0D5C3A] text-white shadow-sm scale-[1.01]' 
                    : 'text-slate-600 hover:text-[#0D5C3A] hover:bg-emerald-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Fin de Chantier</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('auto');
                  setSelectedItem(servicesData.auto[0]);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'auto' 
                    ? 'bg-[#0D5C3A] text-white shadow-sm scale-[1.01]' 
                    : 'text-slate-600 hover:text-[#0D5C3A] hover:bg-emerald-50'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Lavage Auto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
              
              {/* Choix des éléments (7 Cols avec micro-zoom tactile au clic) */}
              <div className="md:col-span-7 space-y-5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sélectionnez l'élément à traiter :
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {servicesData[activeTab].map((item, idx) => {
                    const isSelected = selectedItem.name === item.name;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedItem(item)}
                        className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/90 border-[#16A34A] ring-2 ring-[#16A34A]/30 shadow-md scale-[1.03]'
                            : 'bg-white border-emerald-100 hover:border-emerald-300 hover:scale-[1.015]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold text-slate-900">{item.name}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#16A34A] animate-bounce" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mb-1.5">{item.detail}</div>
                        <div className="font-mono text-xs font-black text-[#0D5C3A]">{formatPrice(item.price)}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Options complémentaires */}
                <div className="pt-4 border-t border-emerald-200/80">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Options & Soins experts :
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/50 hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={options.antiAcariens}
                          onChange={(e) => setOptions({ ...options, antiAcariens: e.target.checked })}
                          className="w-4 h-4 accent-[#15803D] rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">Anti-acariens & désodorisation parfum frais</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#0D5C3A]">+3 000 FCFA</span>
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/50 hover:scale-[1.01] transition-all">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={options.tachesTenaces}
                          onChange={(e) => setOptions({ ...options, tachesTenaces: e.target.checked })}
                          className="w-4 h-4 accent-[#15803D] rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">Détachage intensif (taches de café, huile, graisse)</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#0D5C3A]">+4 000 FCFA</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Résumé Devis (5 Cols) */}
              <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-[1.8rem] border border-emerald-200 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">RÉCAPITULATIF</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">VALIDITÉ 24H</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 mb-5">
                    <div className="flex justify-between">
                      <span>Élément sélectionné :</span>
                      <span className="font-bold text-slate-900">{selectedItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix de base :</span>
                      <span className="font-mono font-bold text-slate-900">{formatPrice(selectedItem.price)}</span>
                    </div>
                    {options.antiAcariens && (
                      <div className="flex justify-between text-emerald-800">
                        <span>Anti-acariens :</span>
                        <span className="font-mono font-bold">+3 000 FCFA</span>
                      </div>
                    )}
                    {options.tachesTenaces && (
                      <div className="flex justify-between text-emerald-800">
                        <span>Détachage intensif :</span>
                        <span className="font-mono font-bold">+4 000 FCFA</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span>Déplacement Dakar :</span>
                      <span className="font-mono font-bold text-emerald-700 uppercase">INCLUS (0 F)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#092B17] to-[#0D5C3A] text-white text-center mb-5 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-lime-400 mb-0.5">MONTANT ESTIMÉ TOTAL</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono">
                      {formatPrice(calculateTotal())}
                    </div>
                    <div className="text-[10px] text-emerald-200/80 mt-1">Paiement après travail validé</div>
                  </div>
                </div>

                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#15803D] to-[#16A34A] hover:from-[#16A34A] hover:to-[#22C55E] text-white font-extrabold text-xs sm:text-sm text-center shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer ce Devis sur WhatsApp</span>
                </button>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SLIDER COMPARATIF AVANT / APRÈS INTERACTIF                             */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#F8FAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full">
              RÉSULTAT CHIRURGICAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Glissez pour Découvrir
              <span className="font-serif italic font-normal text-[#0D5C3A] block">
                l'effet avant / après.
              </span>
            </h2>
          </div>

          <div 
            className="relative rounded-[2rem] overflow-hidden shadow-2xl border-2 border-emerald-200 aspect-[16/9] select-none cursor-ew-resize group"
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
            onTouchStart={() => setIsSliderHovered(true)}
            onTouchEnd={() => setIsSliderHovered(false)}
          >
            {/* Badge indicateur d'animation automatique */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20 shadow-lg pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
              <span>Défilement automatique • Glissez à tout moment pour comparer</span>
            </div>
            
            {/* Image APRÈS (Fond) */}
            <img 
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" 
              alt="Canapé immaculé après passage TAARU SET" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-emerald-700/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
              APRÈS : Propre & Purifié ✨
            </div>

            {/* Image AVANT (Superposition masquée) */}
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${sliderPos}%` }}
            >
              <img 
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" 
                alt="Canapé avant passage" 
                className="absolute inset-0 w-full h-full object-cover filter contrast-125 sepia-[0.35] brightness-75"
                style={{ width: '100%', minWidth: '100%', height: '100%' }}
              />
              <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                AVANT : Poussière & Taches ❌
              </div>
            </div>

            {/* Poignée de Glissement */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-[#0D5C3A] font-black text-xs flex items-center justify-center shadow-md">
                ↔
              </div>
            </div>

            {/* Curseur Tactile / Souris */}
            <input 
              type="range" 
              min="5" 
              max="95" 
              value={sliderPos} 
              onChange={(e) => setSliderPos(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. LE PROTOCOLE EN 4 ÉTAPES TAARU SET                                     */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full">
              MÉTHODE PROFESSIONNELLE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Notre Protocole
              <span className="font-serif italic font-normal text-[#0D5C3A] block">
                en 4 étapes simples.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-3xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] font-mono font-black text-lg flex items-center justify-center mb-3">
                01
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1.5">Diagnostic WhatsApp</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Envoyez une photo de votre meuble ou chantier. Devis ferme fixé en 5 minutes chrono.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] font-mono font-black text-lg flex items-center justify-center mb-3">
                02
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1.5">Arrivée Équipée</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mamadou et son équipe arrivent à l'heure exacte avec injecteurs-extracteurs Kärcher et produits pros.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0D5C3A] font-mono font-black text-lg flex items-center justify-center mb-3">
                03
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1.5">Extraction en Profondeur</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Détachage intensif, élimination des acariens et bactéries, parfum frais sans odeur chimique.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#F8FAF7] border border-emerald-100 hover:scale-[1.02] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#092B17] font-mono font-black text-lg flex items-center justify-center mb-3">
                04
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1.5">Validation & Sourire</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vous contrôlez le résultat. Une fois satisfait à 100%, vous réglez par Wave, Orange Money ou espèces.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TÉMOIGNAGES ANIMÉS DÉFILANTS SANS GÊNE UTILISATEUR                     */}
      {/* ========================================================================= */}
      <section 
        id="temoignages" 
        className="py-20 bg-[#F8FAF7] border-t border-emerald-100 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>AVIS CLIENTS EN DIRECT • DÉFILEMENT CONTINU</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Ce que disent nos clients
                <span className="font-serif italic font-normal text-[#0D5C3A] block">
                  à Almadies, Mermoz, Plateau et Dakar.
                </span>
              </h2>
            </div>

            <div className="mt-4 md:mt-0 text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-full border border-emerald-100 shadow-2xs inline-flex items-center gap-2">
              <span className="text-emerald-600">ℹ️</span>
              <span>Passez votre curseur pour figer le défilement et lire</span>
            </div>
          </div>
        </div>

        {/* Ruban de Défilement Continu Ultra-Fluide (Marquee Infini sans saccade) */}
        <div className="relative w-full mask-fade-horizontal py-4">
          <div className="animate-marquee-smooth flex gap-6 px-4">
            {testimonialsList.concat(testimonialsList).map((item, idx) => (
              <div 
                key={idx}
                className="w-[320px] sm:w-[380px] shrink-0 bg-white p-6 sm:p-7 rounded-[2.2rem] border border-emerald-200/90 shadow-md flex flex-col justify-between hover:scale-[1.03] hover:border-[#16A34A] hover:shadow-2xl transition-all duration-300 cursor-pointer select-none group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400 text-xs tracking-wider">★★★★★</div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Vérifié Dakar
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-6 font-medium group-hover:text-slate-900 transition-colors">
                    {item.text}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D5C3A] to-[#16A34A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">{item.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ ACCORDÉON                                                          */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-t border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase font-black tracking-widest text-[#15803D] bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full">
              QUESTIONS FRÉQUENTES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Tout savoir avant de réserver.
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Combien de temps faut-il pour que mon canapé ou matelas sèche ?",
                a: "Grâce à la puissance d'aspiration de nos extracteurs professionnels Kärcher, 85% de l'humidité est aspirée immédiatement. Le tissu sèche complètement en 3 à 5 heures selon l'aération de la pièce."
              },
              {
                q: "Quelles zones de Dakar desservez-vous ? Y a-t-il des frais de déplacement ?",
                a: "Nous couvrons l'ensemble de Dakar : Almadies, Ngor, Ouakam, Mermoz, Fann, Point E, Plateau, Maristes, Sacré-Cœur, Yoff, Parcelles, Guédiawaye, Keur Massar et Diamniadio. Le déplacement est inclus dans la zone principale."
              },
              {
                q: "Quels sont les modes de paiement acceptés ?",
                a: "Nous acceptons Wave, Orange Money et les espèces. Le paiement s'effectue uniquement à la fin du travail une fois que vous avez validé le résultat."
              },
              {
                q: "Vos produits sont-ils dangereux pour les enfants ou les animaux ?",
                a: "Non, absolument pas. Nous utilisons des shampooings et détergents certifiés éco-responsables et biodégradables, sans danger pour la santé."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[#F8FAF7] border border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors"
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="flex justify-between items-center font-bold text-slate-900 text-xs sm:text-sm">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#0D5C3A] transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`} />
                </div>
                {faqOpen === idx && (
                  <p className="text-slate-600 text-xs mt-2.5 leading-relaxed pt-2 border-t border-emerald-100/60">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER PRESTIGE & RÉSERVATION FINALE                                  */}
      {/* ========================================================================= */}
      <footer className="bg-[#092B17] text-white pt-16 pb-10 border-t-4 border-[#16A34A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="bg-gradient-to-r from-[#0D5C3A] to-[#15803D] p-6 sm:p-10 rounded-[2rem] border border-emerald-700/60 shadow-xl mb-14 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-lime-400">RÉSERVATION IMMÉDIATE</span>
              <h3 className="text-xl sm:text-3xl font-black text-white mt-1">Prêt à retrouver un espace immaculé ?</h3>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md">Mamadou et son équipe sont disponibles dès aujourd'hui. Devis gratuit sans aucun engagement.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <a 
                href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20r%C3%A9server%20une%20intervention%20aujourd%27hui."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-900 font-black text-xs sm:text-sm shadow-md text-center flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Écrire sur WhatsApp</span>
              </a>

              <a 
                href="tel:+221787620564"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 text-center"
              >
                Appeler directement
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/60 text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-black text-sm">T</div>
                <span className="text-lg font-black tracking-tight">TAARU <span className="text-lime-400">SET</span></span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Nettoyage professionnel de fin de chantier, assainissement textile et lavage auto mobile à domicile partout à Dakar.
              </p>
              <div className="text-slate-400 text-[11px]">
                <strong>TikTok :</strong> <a href="https://www.tiktok.com/@mamad1436" target="_blank" rel="noreferrer" className="text-lime-400 hover:underline">@mamad1436</a>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-3">Prestations Clés</h5>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li>Nettoyage Fin de Chantier</li>
                <li>Canapés & Fauteuils</li>
                <li>Matelas & Désinfection</li>
                <li>Tapis & Moquettes au m²</li>
                <li>Lavage Auto Mobile</li>
                <li>Packs Mensuels VIP</li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-3">Zones Couvertes</h5>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li>• Almadies, Ngor, Ouakam</li>
                <li>• Mermoz, Fann, Point E</li>
                <li>• Plateau, Médina</li>
                <li>• Maristes, Sacré-Cœur</li>
                <li>• Yoff, Parcelles, Guédiawaye</li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-3">Contacts Directs</h5>
              <div className="space-y-2 text-slate-300 text-[11px]">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase">Téléphone 1 (Appels & WhatsApp)</div>
                  <a href="tel:+221787620564" className="font-mono font-bold text-white hover:text-lime-400">+221 78 762 05 64</a>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase">Téléphone 2 (WhatsApp)</div>
                  <a href="tel:+221771548610" className="font-mono font-bold text-white hover:text-lime-400">+221 77 154 86 10</a>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase">Email Officiel</div>
                  <a href="mailto:taaru.set@gmail.com" className="font-mono text-white hover:text-lime-400">taaru.set@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © 2026 TAARU SET. Tous droits réservés.
            </div>
            <div className="flex items-center gap-1.5">
              <span>Conçu avec excellence par</span>
              <span className="font-black text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">DARO TECH ⚡</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 11. BOUTON WHATSAPP FLOTTANT VIVANT                                       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5">
        <div className="hidden sm:block bg-white text-slate-900 px-3 py-1.5 rounded-2xl shadow-lg text-xs font-bold border border-emerald-100 pointer-events-none">
          💬 Mamadou en ligne
        </div>
        <a 
          href="https://wa.me/221771548610?text=Bonjour%20TAARU%20SET%2C%20je%20souhaite%20un%20devis."
          target="_blank"
          rel="noreferrer"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-xl whatsapp-float-btn hover:scale-110 active:scale-95 transition-all"
        >
          <MessageSquare className="w-6 h-6" />
        </a>
      </div>

    </div>
  );
}
