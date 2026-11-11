import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, CheckCircle2, Phone, MessageSquare, Clock, ShieldCheck, 
  MapPin, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Check, Star, Wrench, Droplets, 
  Car, Home, Sofa, RefreshCw, Calculator, Send, Zap, Award, ThumbsUp, X, Calendar, User, Navigation
} from 'lucide-react';

// Vraie Photo officielle HD de Mamadou et équipe TAARU SET (Sans stickers TikTok)
import teamCleanHdImg from './assets/team_clean_hd.jpg';
// Logo officiel TAARU SET
import logoOfficialSq from './assets/logo_official_sq.jpg';

export default function App() {
  // --- ÉTATS DU VOLET GLISSANT DE RÉSERVATION (Demandé par Mamadou) ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerService, setDrawerService] = useState('auto'); // 'auto', 'textile', 'chantier'
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('14h00 - 16h00');
  const [clientQuarter, setClientQuarter] = useState('Almadies');
  const [clientAddress, setClientAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // --- AUTRES ÉTATS ---
  const [sliderPos, setSliderPos] = useState(50);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  // --- TILT 3D DE LA CARTE HERO ---
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMoveHero = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - card.left) / card.width - 0.5) * 12;
    const y = ((e.clientY - card.top) / card.height - 0.5) * -12;
    setTilt({ x, y });
  };
  const handleMouseLeaveHero = () => setTilt({ x: 0, y: 0 });

  // --- CANVAS DYNAMIQUE PARTICULES PROPRETÉ ---
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

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.4 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
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
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- LISTE DES JOURS DYNAMIQUES (Prochains 7 jours) ---
  const getNextDays = () => {
    const days = [];
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const name = i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : dayNames[d.getDay()];
      const label = `${name} (${d.getDate()} ${monthNames[d.getMonth()]})`;
      days.push({ id: label, short: name, dateNum: `${d.getDate()} ${monthNames[d.getMonth()]}` });
    }
    return days;
  };

  const nextDays = getNextDays();

  useEffect(() => {
    if (nextDays.length > 0 && !selectedDay) {
      setSelectedDay(nextDays[1].id); // Demain par défaut
    }
  }, []);

  // --- CRÉNEAUX HORAIRES ---
  const timeSlots = [
    { id: '08h30 - 10h30', label: '08h30 - 10h30 (Matin)' },
    { id: '11h00 - 13h00', label: '11h00 - 13h00 (Midi)' },
    { id: '14h00 - 16h00', label: '14h00 - 16h00 (Après-midi)' },
    { id: '16h30 - 18h30', label: '16h30 - 18h30 (Fin de journée)' }
  ];

  // --- QUARTIERS FRÉQUENTS DAKAR ---
  const dakarQuarters = [
    'Almadies', 'Mermoz', 'Ngor / Virage', 'Ouakam', 'Point E', 
    'Fann Résidence', 'Plateau', 'Sacré-Cœur', 'Yoff', 'Maristes', 
    'Liberté 6', 'Grand Dakar', 'Guédiawaye', 'Autre zone'
  ];

  // --- DONNÉES DES 3 PÔLES TAARU SET ---
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
        { name: 'Pack Mensuel Sérénité (4 lavages / mois)', price: 30000, detail: '2 lavages simples + 2 lavages approfondis dans le mois' }
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

  // --- OUVERTURE DU TIROIR GLISSANT ---
  const handleOpenDrawer = (serviceKey) => {
    setDrawerService(serviceKey);
    const service = servicesConfig[serviceKey];
    if (service && service.packs.length > 0) {
      setSelectedPack(service.packs[0]);
    }
    setIsDrawerOpen(true);
  };

  // --- ENVOI WHATSAPP ---
  const handleConfirmReservation = () => {
    if (!selectedPack) return;

    const currentService = servicesConfig[drawerService];
    const formatPrice = (val) => new Intl.NumberFormat('fr-FR').format(val) + " FCFA";

    const message = 
`Bonjour Mamadou (TAARU SET), je souhaite réserver une intervention :

🛠️ *Service :* ${currentService.title}
📦 *Formule :* ${selectedPack.name} (${formatPrice(selectedPack.price)})
📅 *Date souhaitée :* ${selectedDay}
⏰ *Créneau / Heure :* ${selectedTime}
📍 *Quartier :* ${clientQuarter}
🏠 *Adresse / Repère :* ${clientAddress || 'À préciser sur WhatsApp'}
👤 *Nom du client :* ${clientName || 'Client Dakar'}
${clientPhone ? `📞 *Téléphone :* ${clientPhone}` : ''}

Merci de me confirmer la réservation et le déplacement de l'équipe !`;

    window.open(`https://wa.me/221771548610?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- ANIMATION AUTOMATIQUE DU SLIDER AVANT/APRÈS ---
  useEffect(() => {
    let animId;
    let startTimestamp = null;

    const animateLoop = (timestamp) => {
      if (!isSliderHovered) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = (timestamp - startTimestamp) / 1000;
        const pos = 50 + 26 * Math.sin(elapsed * 1.5);
        setSliderPos(Number(pos.toFixed(1)));
      } else {
        startTimestamp = null;
      }
      animId = requestAnimationFrame(animateLoop);
    };

    animId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isSliderHovered]);

  // --- TÉMOIGNAGES CLIENTS VÉRIFIÉS DAKAR ---
  const testimonialsList = [
    {
      initials: 'FD',
      name: 'Fadel D.',
      location: 'Villa aux Almadies • Fin de Chantier',
      text: '« Après 6 mois de travaux dans ma villa, la poussière et les traces de ciment semblaient impossibles à enlever. TAARU SET a rendu la maison impeccable en une journée. Équipe ponctuelle et machines professionnelles. »'
    },
    {
      initials: 'AS',
      name: 'Aïcha S.',
      location: 'Appartement F4 à Mermoz • Canapés',
      text: '« Mon canapé d’angle beige avait des taches d’eau et de soda faites par les enfants. Mamadou l’a complètement rénové ! Tissu sec le soir même sans odeur chimique. »'
    },
    {
      initials: 'CT',
      name: 'Cheikh T.',
      location: 'Cadre d’entreprise • Pack Auto Mensuel (Point E)',
      text: '« Le pack mensuel de lavage auto à mon bureau me fait gagner un temps précieux. Ils viennent avec leur matériel autonome, lavent proprement et je règle par Wave. »'
    },
    {
      initials: 'MB',
      name: 'Mariama B.',
      location: 'Résidence à Fann • Canapé Velours & Tapis',
      text: '« Très impressionnée par le respect des matières délicates. Mon grand tapis et mon canapé en velours ont retrouvé leurs couleurs d’origine sans décoloration. »'
    },
    {
      initials: 'ON',
      name: 'Ousmane N.',
      location: 'Plateau • Moquette de Bureaux 120m²',
      text: '« Intervention programmée le samedi pour ne pas perturber nos bureaux. Le lundi matin à 8h, tout était propre, sec et sentait le frais. De vrais pros. »'
    },
    {
      initials: 'KD',
      name: 'Khady D.',
      location: 'Villa R+1 à Ngor • Avant Location',
      text: '« Les vitres et sanitaires ont été entièrement décapés à la vapeur Kärcher. Le nouveau locataire a validé la villa dès sa première visite ! »'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-800 font-sans antialiased selection:bg-[#16A34A] selection:text-white relative overflow-x-hidden">

      {/* Canvas Particules Propreté en Arrière-plan (Instrument Digital Vivant) */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0 opacity-40" 
      />

      {/* ========================================================================= */}
      {/* 1. NAVBAR PARFAITEMENT ÉQUILIBRÉE SUR MOBILE ET DESKTOP (ZÉRO COLLISION) */}
      {/* ========================================================================= */}
      <header className="fixed top-2.5 sm:top-5 inset-x-3 sm:inset-x-6 z-40 flex justify-center pointer-events-none">
        <nav className="w-full max-w-5xl bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3 sm:px-6 py-2 sm:py-3 shadow-[0_10px_30px_-10px_rgba(13,92,58,0.12)] flex items-center justify-between gap-2 pointer-events-auto">
          
          {/* Logo Officiel TAARU SET (Monogramme + Typographie + Slogan) */}
          <a href="#" className="flex items-center gap-2.5 group shrink-0">
            <img 
              src={logoOfficialSq} 
              alt="TAARU SET Logo Officiel" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
            />
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
          <div className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-semibold text-slate-600">
            <a href="#services" className="hover:text-[#16A34A] transition-colors">Nos Formules</a>
            <a href="#avant-apres" className="hover:text-[#16A34A] transition-colors">Avant / Après</a>
            <a href="#temoignages" className="hover:text-[#16A34A] transition-colors">Avis Clients</a>
          </div>

          {/* CTA Principal : Concis et parfaitement dimensionné sur mobile */}
          <div className="flex items-center shrink-0">
            <button 
              onClick={() => handleOpenDrawer('auto')}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/15 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden font-extrabold text-xs">Réserver</span>
              <span className="hidden sm:inline font-extrabold">Réserver une intervention</span>
            </button>
          </div>

        </nav>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO : RESPIRANT, CHALEUREUX & ÉPURÉ (Zéro effet surchargé)             */}
      {/* ========================================================================= */}
      <section className="relative pt-28 sm:pt-40 pb-14 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Colonne Gauche : Titre clair, bénéfice direct */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#0D5C3A] text-xs font-bold mb-5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>TAARU SET • Le charme de la propreté à Dakar</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.14] mb-5">
              On vient chez vous. <br />
              <span className="text-[#16A34A]">
                Vous profitez du propre.
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mb-7 font-normal">
              Confiez vos canapés, matelas, chantiers et véhicules à notre équipe équipée de machines professionnelles <strong className="text-slate-900 font-semibold">Kärcher</strong>. Choisissez votre service, fixez votre date et nous nous occupons du reste.
            </p>

            {/* Boutons d'Action Rapide */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-7">
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
                />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-lime-400">ÉQUIPE OFFICIELLE</div>
                    <div className="text-sm font-bold">Mamadou & Les Techniciens TAARU SET</div>
                    <div className="text-[11px] text-lime-200 font-semibold italic mt-0.5">« Le charme de la propreté »</div>
                  </div>
                  <div className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold border border-white/30 shrink-0">
                    DAKAR 🇸🇳
                  </div>
                </div>
              </div>

              {/* Badge Flottant Confiance */}
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center font-bold text-sm">
                  ★
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">+500 Clients Satisfaits</div>
                  <div className="text-[10px] text-slate-500">Almadies, Mermoz, Plateau...</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LES 3 OFFRES CLÉS (CLIC ➔ OUVRE LE TIROIR GLISSANT DE RÉSERVATION)       */}
      {/* ========================================================================= */}
      <section id="services" className="py-16 sm:py-20 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-14">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              CHOISISSEZ VOTRE BESOIN
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Nos 3 Services Phares
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2">
              Cliquez sur le service de votre choix pour faire glisser les propositions, choisir votre jour et réserver.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
            
            {/* CARTE 1 : LAVAGE AUTO MOBILE */}
            <div 
              onClick={() => handleOpenDrawer('auto')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-6 sm:p-7 border border-slate-200 hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col justify-between relative"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 3 000 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Lavage Auto Mobile</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  À votre domicile ou bureau à Dakar. Finition soignée sans rayures, aspiration totale et shampouinage habitacle.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A]">
                <span>Voir les packs & Réserver</span>
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* CARTE 2 : TEXTILES & CANAPÉS */}
            <div 
              onClick={() => handleOpenDrawer('textile')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-6 sm:p-7 border-2 border-emerald-400/90 shadow-md hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col justify-between relative"
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                LE PLUS DEMANDÉ
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-900/20">
                  <Sofa className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 3 500 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Canapés, Matelas & Tapis</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  Shampouinage à l'injecteur Kärcher. Élimine les taches rebelles, odeurs et acariens. Tissu quasi-sec en 3 à 5h.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A]">
                <span>Voir les formules & Réserver</span>
                <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>

            {/* CARTE 3 : FIN DE CHANTIER */}
            <div 
              onClick={() => handleOpenDrawer('chantier')}
              className="group bg-[#FAFAF8] hover:bg-white rounded-[2.2rem] p-6 sm:p-7 border border-slate-200 hover:border-[#16A34A] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col justify-between relative"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0D5C3A] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#0D5C3A] text-xs font-bold mb-2">
                  Dès 45 000 FCFA
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Fin de Chantier & Villas</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                  Remise à neuf complète après travaux ou avant emménagement. Décapage ciment, colle, vitres et désinfection totale.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0D5C3A] group-hover:text-[#16A34A]">
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
      {/* 4. LE PAVÉ GLISSANT (DRAWER MODAL COULISSANT) DEMANDÉ PAR MAMADOU         */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          
          {/* Backdrop sombre flouté */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
          ></div>

          {/* Panneau latéral coulissant (Pavé glissant avec inertie physique) */}
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
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    {servicesConfig[drawerService].title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Configurez votre intervention en 4 étapes simples
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du formulaire interactif */}
            <div className="p-5 sm:p-6 space-y-7">
              
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  1. Choisissez votre formule
                </label>
                <div className="space-y-2.5">
                  {servicesConfig[drawerService].packs.map((pack, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedPack?.name === pack.name 
                          ? 'border-[#16A34A] bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="pr-2">
                        <div className="text-sm font-bold text-slate-900">{pack.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{pack.detail}</div>
                      </div>
                      <div className="font-bold text-sm text-[#0D5C3A] shrink-0 font-mono">
                        {new Intl.NumberFormat('fr-FR').format(pack.price)} F
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ÉTAPE 2 : SÉLECTION DU JOUR (RAPIDE + DATE SUR-MESURE) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Choisissez le jour d'intervention
                  </label>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Choisi : {selectedDay}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                  {nextDays.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDay(d.id)}
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

                {/* Option Date Libre / Calendrier */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-[#16A34A]" />
                    <span>Autre date spécifique sur calendrier :</span>
                  </div>
                  <input 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const parts = e.target.value.split('-');
                        setSelectedDay(`Date sur-mesure : ${parts[2]}/${parts[1]}/${parts[0]}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* ÉTAPE 3 : SÉLECTION DE L'HEURE (CRÉNEAUX + HEURE LIBRE) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Choisissez votre heure
                  </label>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedTime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTime(slot.id)}
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

                {/* Option Heure Personnalisée Libre */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-[#16A34A]" />
                    <span>Fixer votre heure exacte :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time"
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedTime(`Heure exacte souhaitée : ${e.target.value}`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    />
                    <input 
                      type="text"
                      placeholder="ou ex: 07h00, 19h30..."
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          setSelectedTime(`Heure souhaitée : ${e.target.value.trim()}`);
                        }
                      }}
                      className="w-36 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>
              </div>

              {/* ÉTAPE 4 : LIEU & ADRESSE À DAKAR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  4. Quartier & Coordonnées à Dakar
                </label>
                
                {/* Sélecteur de quartier */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {dakarQuarters.slice(0, 8).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setClientQuarter(q)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        clientQuarter === q 
                          ? 'bg-[#0D5C3A] text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <input 
                    type="text" 
                    placeholder="Adresse précise ou repère (ex: en face Pharmacie du Golf, Villa 12)" 
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Votre nom complet" 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                    />
                    <input 
                      type="tel" 
                      placeholder="Téléphone / WhatsApp" 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Pied du tiroir : Récapitulatif et validation WhatsApp */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 sm:p-6 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total de votre prestation :</div>
                  <div className="text-xl font-extrabold text-[#0D5C3A] font-mono">
                    {selectedPack ? new Intl.NumberFormat('fr-FR').format(selectedPack.price) : 0} FCFA
                  </div>
                </div>
                <div className="text-[11px] text-right text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Déplacement inclus à Dakar
                </div>
              </div>

              <button 
                type="button"
                onClick={handleConfirmReservation}
                className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#0D5C3A] to-[#16A34A] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Confirmer et Envoyer sur WhatsApp</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SLIDER AVANT / APRÈS (ANIMATION DOUCE AUTONOME)                         */}
      {/* ========================================================================= */}
      <section id="avant-apres" className="py-16 sm:py-20 bg-[#FAFAF8] relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              RÉSULTAT VISIBLE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              L'Effet Avant / Après
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Observez la puissance du décapage et du shampouinage vapeur Kärcher.
            </p>
          </div>

          <div 
            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-slate-200 aspect-[16/9] select-none cursor-ew-resize group"
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
            onTouchStart={() => setIsSliderHovered(true)}
            onTouchEnd={() => setIsSliderHovered(false)}
          >
            {/* Image APRÈS */}
            <img 
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80" 
              alt="Canapé immaculé après passage TAARU SET" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-emerald-800/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
              APRÈS : Propre & Rénové ✨
            </div>

            {/* Image AVANT */}
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

            {/* Poignée centrale */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-[#0D5C3A] font-extrabold text-xs flex items-center justify-center shadow-md">
                ↔
              </div>
            </div>

            {/* Message de survol */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-lg pointer-events-none">
              Glissez pour comparer à tout moment
            </div>

            <input 
              type="range" 
              min="5" 
              max="95" 
              value={sliderPos} 
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TÉMOIGNAGES CLIENTS EN RUBAN DÉFILANT CONTINU                          */}
      {/* ========================================================================= */}
      <section id="temoignages" className="py-16 sm:py-20 bg-white border-t border-slate-100 overflow-hidden relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#16A34A] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
                CONFIANCE CLIENT
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Ils nous font confiance à Dakar
              </h2>
            </div>
            <div className="text-xs text-slate-500 mt-2 sm:mt-0 font-medium">
              Survolez un avis pour stopper le défilement
            </div>
          </div>
        </div>

        {/* Marquee continu */}
        <div className="relative w-full mask-fade-horizontal py-2">
          <div className="animate-marquee-smooth flex gap-6 px-4">
            {testimonialsList.concat(testimonialsList).map((item, idx) => (
              <div 
                key={idx}
                className="w-[310px] sm:w-[360px] shrink-0 bg-[#FAFAF8] p-6 rounded-[2rem] border border-slate-200/90 shadow-xs flex flex-col justify-between hover:bg-white hover:border-[#16A34A] hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400 text-xs">★★★★★</div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Vérifié
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                    {item.text}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-200/60">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D5C3A] to-[#16A34A] text-white font-bold text-xs flex items-center justify-center">
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ ÉPURÉE (4 QUESTIONS ESSENTIELLES)                                   */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#FAFAF8] border-t border-slate-100 relative z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Questions Fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Combien de temps faut-il pour que mon canapé ou matelas sèche ?",
                a: "Grâce à la forte puissance d'aspiration de nos extracteurs Kärcher, plus de 80% de l'eau est retirée sur place. Le tissu sèche complètement en 3 à 5 heures selon l'aération."
              },
              {
                q: "Y a-t-il des frais de déplacement à Dakar ?",
                a: "Non, le déplacement est inclus sur l'ensemble de la presqu'île de Dakar (Almadies, Mermoz, Plateau, Point E, Maristes, Yoff, etc.)."
              },
              {
                q: "Comment se passe le règlement ?",
                a: "Vous ne réglez qu'une fois le travail terminé et vérifié par vos soins, via Wave, Orange Money ou en espèces."
              },
              {
                q: "Dois-je fournir de l'eau ou de l'électricité pour le lavage auto ?",
                a: "Pour le lavage auto à domicile ou au bureau, nous avons seulement besoin d'un accès à un point d'eau ou d'une prise selon l'intervention. Tout le reste du matériel spécialisé est fourni."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${faqOpen === idx ? 'rotate-180 text-[#16A34A]' : ''}`} />
                </button>
                {faqOpen === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER STATUTAIRE ÉPURÉ                                                */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src={logoOfficialSq} 
              alt="TAARU SET Logo" 
              className="w-10 h-10 rounded-2xl object-cover shadow-sm" 
            />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight">TAARU SET DAKAR</span>
              <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">Le charme de la propreté</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-center sm:text-left">
            Service de Nettoyage & Lavage Mobile • Téléphone / WhatsApp : +221 77 154 86 10 / +221 78 762 05 64
          </div>

          <a 
            href="https://wa.me/221771548610?text=Bonjour%20Mamadou%2C%20je%20souhaite%20un%20devis."
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contacter Mamadou</span>
          </a>
        </div>
      </footer>

      {/* BOUTON FLOTTANT WHATSAPP DIRECT */}
      <a 
        href="https://wa.me/221771548610?text=Bonjour%20Mamadou%20(TAARU%20SET)%2C%20je%20souhaite%20un%20devis."
        target="_blank"
        rel="noreferrer"
        className="whatsapp-float-btn fixed bottom-5 right-5 z-40 bg-[#16A34A] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        aria-label="Contacter sur WhatsApp"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold pr-1">Mamadou en direct</span>
      </a>

    </div>
  );
}
