import React, { Component, useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useSpring 
} from 'motion/react';
import { 
  Menu, 
  X, 
  ArrowRight, 
  Send, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Maximize2,
  Home,
  Skull,
  Bug,
  Search,
  Share2
} from 'lucide-react';

// Firebase Imports
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId, handleFirestoreError, OperationType } from './firebase';

// Services
import { generateWahalaContent } from './services/geminiService';

// Utilities
import { cn } from './lib/utils';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const { children } = (this as any).props;
    if ((this as any).state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse((this as any).state.error.message);
        if (parsed.error && parsed.operationType) {
          displayMessage = `Firestore Error: ${parsed.operationType} failed. ${parsed.error}`;
        }
      } catch (e) {
        displayMessage = (this as any).state.error.message || displayMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea] p-6 text-center">
          <div className="max-w-md space-y-6">
            <AlertCircle className="w-16 h-16 text-[#ff3e00] mx-auto" />
            <h1 className="text-3xl font-bold tracking-tighter">SYSTEM ERROR</h1>
            <p className="text-[#0a0a0a]/70 font-mono text-sm">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#0a0a0a] text-[#f4f1ea] px-8 py-3 font-bold hover:bg-[#ff3e00] transition-colors"
            >
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

// --- DATA: USER STORIES ---
const USER_STORIES = [
  { 
    title: "Memoirs of the coagulation cascade", 
    desc: "A biological drama exploring how your body stops the leaks.", 
    img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800", 
    tag: "Human Original", 
    url: "https://drive.google.com/file/d/1mdWupCYpqcCO1fWsIUnAPH5vAsmAxOrw/view?usp=sharing" 
  },
  { 
    title: "Antimicrobial Resistance in Nigeria", 
    desc: "The silent battle on Nigerian streets. Why common drugs are failing.", 
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800", 
    tag: "Human Original", 
    url: "https://drive.google.com/file/d/1IyqoYRD028nwcvWiDtgxwfiQ-nj9n-Ov/view?usp=sharing" 
  },
  { 
    title: "The Visual Abstract", 
    desc: "Transforming complex scientific arts into simple, actionable visual data.", 
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800", 
    tag: "Human Original", 
    url: "https://drive.google.com/file/d/1t4FdTqMFZdYLncMDUvbA6frBKpd5P70e/view?usp=sharing" 
  }
];

// --- DATA: AI STORIES ---
const AI_STORY_DATA: Record<string, any> = {
  ai_malaria_cartoon: {
    id: 'ai_malaria_cartoon',
    title: "Malaria: The Mosquito Menace",
    subtitle: "CARTOON BATTLE",
    accent: "#ff3e00",
    img: "https://images.unsplash.com/photo-1576086213369-97a306dca665?auto=format&fit=crop&q=80&w=800",
    steps: [
      {
        title: "The Midnight Scout",
        label: "THE INVASION",
        desc: "Meet Squito, the hungry invader. He's looking for a warm place to drop his team of sneaky parasites.",
        pidgin: "Squito de fly up and down. E de find where e go drop his boys for your body.",
        visual: (
          <motion.div animate={{ x: [-20, 20, -20], y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="text-8xl">🦟</div>
          </motion.div>
        )
      },
      {
        title: "The Liver Party",
        label: "PARASITE DISCO",
        desc: "The parasites don't fight yet. They head to your liver for a massive party, multiplying into thousands of soldiers.",
        pidgin: "They don go liver branch. They de do training and recruitment for there.",
        visual: (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ delay: i * 0.1, repeat: Infinity }} className="text-3xl font-bold">🦠</motion.div>
            ))}
          </div>
        )
      },
      {
        title: "Red Cell Raid",
        label: "THE ATTACK",
        desc: "Thousands of parasites burst out, hijacking your red blood cells. Now the real wahala starts—fever, chills, and weakness.",
        pidgin: "The army don ready. They de scatter your blood cells like toys. Body don start to vibrate.",
        visual: (
          <div className="relative flex items-center justify-center">
            <div className="text-8xl text-red-600 opacity-50">🔴</div>
            <motion.div 
              animate={{ 
                x: [0, 40, 0],
                rotate: [0, 360],
                opacity: [1, 0.5, 1]
              }} 
              transition={{ repeat: Infinity, duration: 2 }} 
              className="absolute text-5xl"
            >
              ⚔️
            </motion.div>
          </div>
        )
      }
    ]
  },
  ai_vaccine_shield: {
    id: 'ai_vaccine_shield',
    title: "Mission: Vaccine Shield",
    subtitle: "CARTOON DEFENSE",
    accent: "#00f2ff",
    img: "https://images.unsplash.com/photo-1618961734760-466979ce35b0?auto=format&fit=crop&q=80&w=800",
    steps: [
      {
        title: "The Training Camp",
        label: "THE JAB",
        desc: "The vaccine is like a training camp for your immune system. It shows your soldiers exactly what Squito's team looks like.",
        pidgin: "Vaccine na like drill sergeant. E de show your body army how to finish the enemy before they even reach.",
        visual: (
          <div className="flex items-center gap-6">
            <motion.div animate={{ rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-8xl">💉</motion.div>
            <ArrowRight size={48} className="text-white/20" />
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-8xl">🛡️</motion.div>
          </div>
        )
      },
      {
        title: "The Shield Wall",
        label: "IMMUNITY LOADED",
        desc: "When a real malaria parasite tries to enter, your soldiers recognize them instantly. The shield wall goes up! MISSION SUCCESSFUL.",
        pidgin: "Parasite show face, body army say 'I know you!'. They finish am one-time. Shield wall don block road.",
        visual: (
          <div className="relative flex justify-center items-center">
            <ShieldCheck size={160} className="text-[#00f2ff] opacity-20" />
            <div className="absolute text-7xl">🧒</div>
            <motion.div 
              initial={{ x: 100, opacity: 0 }} 
              animate={{ x: 0, opacity: [0, 1, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }} 
              className="absolute text-5xl"
            >
              🦠
            </motion.div>
          </div>
        )
      }
    ]
  }
};

// --- INTERACTIVE STORY CANVAS COMPONENT ---
const InteractiveStoryCanvas = ({ storyId, onClose }: { storyId: string, onClose: () => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  const story = AI_STORY_DATA[storyId];
  
  if (!story) return null;

  const next = () => activeStep < story.steps.length - 1 && setActiveStep(activeStep + 1);
  const prev = () => activeStep > 0 && setActiveStep(activeStep - 1);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] text-[#f4f1ea] flex flex-col h-screen"
    >
      <div className="p-4 md:p-6 flex justify-between items-center border-b border-white/10 shrink-0">
        <div className="font-bold tracking-tighter text-lg md:text-xl uppercase">
          <span style={{ color: story.accent }}>{story.subtitle}:</span> {story.title}
        </div>
        <button onClick={onClose} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-[#ff3e00] hover:text-[#0a0a0a] transition-all font-bold text-xs uppercase">
          <Home size={16} /> Close
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 h-[40%] md:h-full bg-black/50 border-b md:border-b-0 md:border-l border-white/10 flex items-center justify-center p-6 md:p-12 relative order-1 md:order-2">
           <AnimatePresence mode="wait">
            <motion.div key={activeStep} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="w-full h-full max-w-md flex items-center justify-center">
              {story.steps[activeStep].visual}
            </motion.div>
           </AnimatePresence>
        </div>

        <div className="w-full md:w-1/2 flex flex-col order-2 md:order-1 h-[60%] md:h-full">
          <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div key={activeStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase inline-block px-2 py-1" style={{ backgroundColor: `${story.accent}20`, color: story.accent }}>
                  Section {activeStep + 1} // {story.steps[activeStep].label}
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-none">{story.steps[activeStep].title}</h2>
                <p className="text-lg md:text-2xl text-white/70 font-light leading-relaxed max-w-lg">{story.steps[activeStep].desc}</p>
                <div className="bg-white/5 p-6 border-l-4 text-lg md:text-xl italic font-medium" style={{ borderColor: story.accent }}>
                  "{story.steps[activeStep].pidgin}"
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-8 md:p-16 pt-0 shrink-0 border-t border-white/5 bg-[#0a0a0a]">
            <div className="flex gap-4">
              <button onClick={prev} disabled={activeStep === 0} className="p-5 border border-white/20 disabled:opacity-10 hover:bg-white/10 transition-colors">
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={activeStep === story.steps.length - 1 ? onClose : next}
                className="flex-1 text-[#0a0a0a] py-5 font-bold text-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all font-sans uppercase"
                style={{ backgroundColor: story.accent }}
              >
                {activeStep === story.steps.length - 1 ? "FINISH STORY" : "CONTINUE READING"} <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-1 bg-white/5 flex gap-1 shrink-0">
        {story.steps.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 transition-all duration-700" style={{ backgroundColor: i <= activeStep ? story.accent : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    </motion.div>
  );
};


// --- Navbar Component ---
const Navbar = ({ activeSection, onNavigate, searchQuery, onSearchChange }: { 
  activeSection: string, 
  onNavigate: (id: string) => void,
  searchQuery: string,
  onSearchChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{ id: 'health4u', label: 'Health4U' }, { id: 'wahala', label: 'Wahala Loop' }, { id: 'about', label: 'About' }];
  
  const logoUrl = "https://lh3.googleusercontent.com/d/1SFmkRfdZdSzB6xEOsPpVsTremDrt8quI=w800";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center bg-[#f4f1ea]/90 backdrop-blur-md border-b border-[#0a0a0a]/5 h-20">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        <div className="flex items-center cursor-pointer shrink-0 group" onClick={() => onNavigate('hero')}>
          <span className="font-sans font-bold text-xl md:text-2xl tracking-tighter uppercase">WahalaScientist</span>
        </div>
        
        <div className="relative max-w-xs w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/40" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stories..." 
            className="w-full bg-[#0a0a0a]/5 border-none rounded-full py-2 pl-10 pr-4 text-xs font-mono focus:ring-1 focus:ring-[#ff3e00] outline-none transition-all"
          />
        </div>
      </div>

      <div className="hidden md:flex gap-8 items-center px-6">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("font-mono text-[10px] lg:text-xs uppercase tracking-widest transition-all hover:text-[#ff3e00] py-1", activeSection === item.id ? "text-[#ff3e00]" : "text-[#0a0a0a]/60")}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="sm:hidden">
          <button className="p-2 text-[#0a0a0a]/60" onClick={() => setIsOpen(!isOpen)}>
            <Search size={20} />
          </button>
        </div>
        <button className="md:hidden p-2 bg-[#0a0a0a] text-[#f4f1ea] rounded-full" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Search Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-[#f4f1ea] p-4 border-b border-[#0a0a0a]/10 md:hidden animate-in slide-in-from-top duration-300">
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/40" size={16} />
            <input 
              type="text" 
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search stories..." 
              className="w-full bg-[#0a0a0a]/5 border-none rounded-full py-3 pl-10 pr-4 text-sm font-mono focus:ring-1 focus:ring-[#ff3e00] outline-none"
            />
          </div>
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => { onNavigate(item.id); setIsOpen(false); }} 
                className="font-mono text-xs uppercase tracking-widest text-left p-2"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Hero = ({ onNavigate }: { onNavigate: (id: string) => void }) => {
  const logoUrl = "https://lh3.googleusercontent.com/d/1SFmkRfdZdSzB6xEOsPpVsTremDrt8quI=w800";
  
  return (
    <section id="hero" className="min-h-screen flex flex-col justify-center items-start px-8 md:px-32 py-40 bg-[#f4f1ea] relative overflow-hidden">
      {/* subtle watermark icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.02] pointer-events-none select-none">
        <img src={logoUrl} alt="" className="w-[120vw] md:w-[60vw]" referrerPolicy="no-referrer" />
      </div>

      <div className="max-w-6xl relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px w-12 bg-[#ff3e00]" />
            <p className="font-mono text-[#ff3e00] uppercase tracking-[0.4em] text-xs font-bold whitespace-nowrap">Issue No. 01 // Systems Intervention</p>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-8 mb-12">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="shrink-0 relative group"
            >
              <img 
                src={logoUrl} 
                alt="WAHALASCIENTIST Logo" 
                className="h-32 md:h-48 w-auto object-contain drop-shadow-[10px_10px_0px_rgba(255,62,0,1)] group-hover:drop-shadow-[15px_15px_0px_rgba(255,62,0,1)] transition-all cursor-pointer" 
                referrerPolicy="no-referrer" 
              />
            </motion.div>
            
            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-bold leading-[0.8] tracking-tighter text-[#0a0a0a] uppercase mix-blend-multiply">
              SCIENCE <br /> 
              <span className="text-[#ff3e00] relative italic">
                FOR THE 
                <span className="absolute -bottom-2 left-0 w-full h-[0.05em] bg-[#0a0a0a]" />
              </span> <br /> 
              STREETS.
            </h1>
          </div>
          
          <div className="max-w-2xl mb-12 border-l-4 border-[#ff3e00] pl-8">
            <p className="text-xl md:text-3xl font-medium leading-tight text-[#0a0a0a]/90 tracking-tight">
              Transforming complex journals into visual ammunition. Street-smart advocacy for health equity.
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={() => onNavigate('health4u')} 
            className="group relative bg-[#0a0a0a] text-[#f4f1ea] px-12 py-6 font-bold flex items-center justify-center gap-3 overflow-hidden transition-transform hover:scale-[1.02] active:scale-95"
          >
            <span className="relative z-10">EXPLORE ARCHIVE</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            <div className="absolute inset-0 bg-[#ff3e00] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
          <button 
            onClick={() => onNavigate('wahala')} 
            className="px-12 py-6 font-bold border-4 border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#f4f1ea] transition-all uppercase tracking-tight active:scale-95"
          >
            File a Report
          </button>
        </div>
      </div>
      
      {/* Side metadata common in journals */}
      <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-end gap-2 text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">
        <span className="bg-[#0a0a0a] text-[#f4f1ea] px-2 py-0.5">EST. 2024</span>
        <span>LAT: 6.5244° N, LONG: 3.3792° E</span>
        <span>LAGOS // NIGERIA</span>
      </div>
    </section>
  );
};

const HealthStories = ({ onOpenStory, searchQuery }: { onOpenStory: (id: string) => void, searchQuery: string }) => {
  const filteredHuman = USER_STORIES.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAI = Object.values(AI_STORY_DATA).filter((s: any) => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = async (e: React.MouseEvent, story: { title: string, url?: string }) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = story.url || window.location.href;
    const shareData = {
      title: story.title,
      text: `Check out this health story from WAHALASCIENTIST: ${story.title}`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Shared failed", err);
    }
  };

  if (filteredHuman.length === 0 && filteredAI.length === 0) {
    return (
      <section id="health4u" className="px-6 md:px-24 bg-[#0a0a0a] text-[#f4f1ea] py-32 text-center">
        <h2 className="text-4xl font-bold mb-4 opacity-40">NO STORIES FOUND</h2>
        <p className="font-mono text-xs uppercase opacity-20">Try searching for something else, like "Malaria" or "Drugs".</p>
      </section>
    );
  }

  return (
    <section id="health4u" className="px-6 md:px-24 bg-[#0a0a0a] text-[#f4f1ea] py-32 space-y-32">
      {filteredHuman.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-8">
             <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none text-[#ff3e00]">Health4U <br /> Stories</h2>
             <p className="font-mono text-xs uppercase opacity-40 max-w-[200px] text-right hidden md:block">Deep dives crafted by the WAHALASCIENTIST team.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredHuman.map((story, i) => (
              <div key={i} className="group block h-full">
                <motion.div whileHover={{ y: -10 }} className="cursor-pointer h-full flex flex-col">
                  <a href={story.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <div className="aspect-[4/5] bg-white/10 mb-6 overflow-hidden relative border border-white/10">
                      <img src={story.img} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
                      <div className="absolute top-4 left-4 bg-[#ff3e00] text-[#0a0a0a] text-[10px] font-bold px-2 py-1 uppercase font-mono">{story.tag}</div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-[#ff3e00] p-4 rounded-full">
                          <Maximize2 size={32} className="text-[#0a0a0a]" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#ff3e00] transition-colors leading-tight">{story.title}</h3>
                    <p className="text-[#f4f1ea]/60 text-xs leading-relaxed mb-6 font-mono">{story.desc}</p>
                  </a>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                    <a href={story.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#ff3e00] text-[10px] font-bold uppercase tracking-widest group-hover:opacity-70">
                      Read Document <ArrowRight size={14} />
                    </a>
                    <button onClick={(e) => handleShare(e, story)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#ff3e00]">
                      <Share2 size={16} />
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredAI.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-8">
             <h2 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none text-[#00f2ff]">AI <br /> Comics</h2>
             <p className="font-mono text-xs uppercase opacity-40 max-w-[200px] text-right hidden md:block">Interactive cartoon explanations on health essentials.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {filteredAI.map((story: any) => (
              <motion.div key={story.id} whileHover={{ y: -10 }} onClick={() => onOpenStory(story.id)} className="group cursor-pointer flex flex-col">
                <div className="aspect-video bg-white/10 mb-6 overflow-hidden relative border border-white/10">
                  <img src={story.img} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
                  <div className="absolute top-4 left-4 bg-[#00f2ff] text-[#0a0a0a] text-[10px] font-bold px-2 py-1 uppercase font-mono">AI Visuals</div>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#00f2ff] p-4 rounded-full">
                      <Maximize2 size={32} className="text-[#0a0a0a]" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-[#00f2ff] transition-colors leading-tight uppercase tracking-tighter">{story.title}</h3>
                  <p className="text-[#f4f1ea]/60 text-sm leading-relaxed mb-6 font-mono">{story.subtitle}</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-[#00f2ff] text-[10px] font-bold uppercase tracking-widest group-hover:opacity-75">
                    Start Comic <ArrowRight size={14} />
                  </div>
                  <button onClick={(e) => handleShare(e, story)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#00f2ff]">
                    <Share2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};


// --- Error Logging Helper for Wahala Loop ---
const logWahalaError = (operation: string, error: unknown, extra?: any) => {
  const errorData = {
    operation,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    network: {
      online: navigator.onLine,
    },
    ...extra
  };
  console.error(`[Wahala Loop Error] ${operation}:`, JSON.stringify(errorData, null, 2));
  return errorData;
};

const WahalaLoop = ({ user, setUser }: { user: User | null, setUser: (user: User | null) => void }) => {
  const [complaint, setComplaint] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shortResponse, setShortResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Wahala Loop: Submit triggered", { hasComplaint: !!complaint, hasEmail: !!email, hasUser: !!user });
    
    if (!complaint || !email) {
      setError("Abeg fill all the fields.");
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      // Attempt to ensure user is authenticated, but don't block if it fails
      let currentUser = user;
      if (!currentUser) {
        console.log("Wahala Loop: No user found, attempting anonymous sign-in...");
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          setUser(currentUser);
          console.log("Wahala Loop: Anonymous sign-in successful", currentUser.uid);
        } catch (authErr) {
          logWahalaError('anonymous_auth', authErr);
          console.warn("Wahala Loop: Auth failed or disabled. Proceeding without saving to database.");
        }
      }

      console.log("Wahala Loop: Generating AI content...");
      let data;
      try {
        data = await generateWahalaContent(complaint);
      } catch (aiErr: any) {
        logWahalaError('ai_generation', aiErr, { complaintLength: complaint.length });
        setError(`Wahala catch us small: ${aiErr.message || "Something went wrong with the AI"}. Abeg check your internet or your GEMINI_API_KEY. We dey for you!`);
        setStatus('error');
        return; 
      }
      console.log("Wahala Loop: AI content generated successfully");
      
      // 1. Save to Firestore (only if authenticated)
      if (currentUser) {
        console.log("Wahala Loop: Saving to Firestore...");
        const path = `artifacts/${appId}/public/data/wahala_reports`;
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wahala_reports'), {
            userEmail: email, 
            userComplaint: complaint, 
            aiGeneratedScript: data.script, 
            aiShortResponse: data.shortResponse, 
            timestamp: serverTimestamp(), 
            userId: currentUser.uid
          });
          console.log("Wahala Loop: Saved to Firestore successfully");
        } catch (dbErr) {
          logWahalaError('firestore_save', dbErr, { path });
        }
      }

      // 2. Send to Admin via Backend API (always attempt)
      console.log("Wahala Loop: Sending to admin...");
      try {
        const apiResponse = await fetch('/api/send-wahala', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email,
            userComplaint: complaint,
            aiShortResponse: data.shortResponse,
            aiGeneratedScript: data.script
          })
        });
        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }
        console.log("Wahala Loop: Admin notification successful");
      } catch (apiErr) {
        logWahalaError('admin_notification', apiErr);
      }

      setShortResponse(data.shortResponse);
      setStatus('success');
      setComplaint(''); setEmail('');
    } catch (err: any) {
      logWahalaError('overall_submission', err);
      setError(err.message || "Network dey give us small wahala. Abeg try again.");
      setStatus('error');
    }
  };

  return (
    <section id="wahala" className="px-6 md:px-24 py-32 bg-[#f4f1ea]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-[#0a0a0a]">WAHALA <br /> LOOP</h2>
          <p className="font-mono text-[#ff3e00] mb-8 uppercase tracking-widest text-xs font-bold">Direct Citizen Reporting</p>
          <p className="text-[#0a0a0a]/70 text-lg leading-relaxed mb-8 max-w-md">Report health system failures. We turn your 'wahala' into visual pressure for accountability.</p>
        </div>
        <div className="bg-[#0a0a0a] text-[#f4f1ea] p-8 md:p-12 shadow-2xl min-h-[500px] flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'error' ? (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-8">
                {error && <div className="bg-[#ff3e00]/20 text-[#ff3e00] p-4 text-xs font-bold flex gap-2"><AlertCircle size={16}/> {error}</div>}
                <textarea required value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="What happen for the hospital?" className="w-full bg-white/5 border-b border-white/20 p-4 focus:border-[#00f2ff] outline-none min-h-[160px] text-xl font-light resize-none placeholder:opacity-30" />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full bg-white/5 border-b border-white/20 p-4 focus:border-[#00f2ff] outline-none text-xl font-light placeholder:opacity-30" />
                <button type="submit" className="w-full bg-[#00f2ff] text-[#0a0a0a] py-6 font-bold text-xl hover:bg-white transition-colors flex items-center justify-center gap-3">SEND TO THE SCIENTIST <Send size={20} /></button>
              </motion.form>
            ) : null}
            {status === 'loading' && (
              <div className="flex flex-col items-center py-20 text-center"><Loader2 className="animate-spin text-[#00f2ff] mb-6" size={64} /><h3 className="text-2xl font-bold mb-2">Processing Wahala...</h3></div>
            )}
            {status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="flex items-center gap-4 text-[#00f2ff]"><CheckCircle2 size={40} /><h3 className="text-3xl font-bold tracking-tighter">VOICE HEARD!</h3></div>
                <div className="bg-[#f4f1ea]/5 p-8 border-l-4 border-[#00f2ff] text-xl leading-relaxed font-medium italic">"{shortResponse}"</div>
                <p className="text-[#00f2ff] font-bold text-lg md:text-xl">Relax my person, you will be the first to get the visuals. We de man better with hashtags.</p>
                <button onClick={() => setStatus('idle')} className="w-full border border-white/20 py-4 font-mono text-xs font-bold hover:bg-white/10 tracking-widest">REPORT ANOTHER ISSUE</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const About = () => (
  <section id="about" className="px-6 md:px-24 bg-[#ff3e00] text-[#0a0a0a] py-32">
    <div className="max-w-5xl uppercase">
      <h2 className="text-6xl md:text-9xl font-bold tracking-tighter mb-12 leading-none">Science <br /> Demystified.</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 normal-case">
        <div className="space-y-8">
          <p className="text-2xl md:text-3xl font-bold leading-tight">We transform journals, research articles, and clinical data into visual ammunition.</p>
          <p className="text-xl md:text-2xl font-medium leading-relaxed opacity-90">Our mission: make everyone informed, taking charge of their body, and active in their own health journey.</p>
        </div>
        <div className="space-y-8"><div className="p-6 bg-[#0a0a0a] text-[#f4f1ea] border-l-8 border-white italic">"If the public can't read the data, we make sure they can see the story."</div><p className="text-lg font-medium">WAHALASCIENTIST isn't just a platform; it's a systems-level intervention using storytelling as a weapon for accountability.</p></div>
      </div>
    </div>
  </section>
);

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [user, setUser] = useState<User | null>(null);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    console.log("WAHALASCIENTIST: App initialized");
    const initAuth = async () => {
      try {
        console.log("WAHALASCIENTIST: Initializing anonymous auth...");
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
        console.log("WAHALASCIENTIST: Auth ready", cred.user.uid);
      } catch (err: any) { 
        console.error("WAHALASCIENTIST: Initial auth failed", err);
        
        // Handle the specific block error (Identity Toolkit)
        const isBlocked = err.message?.includes('signup-are-blocked');
        const isNotAllowed = err.code === 'auth/operation-not-allowed';
        const isAdminRestricted = err.code === 'auth/admin-restricted-operation';

        if (isBlocked || isNotAllowed || isAdminRestricted) {
          const authErrorInfo = {
            error: "Authentication Missing: Anonymous login is not enabled.",
            operationType: "Authentication",
            path: "auth/anonymous",
            authInfo: {
              userId: null,
              suggestion: "Please go to Firebase Console > Authentication > Sign-in method and ENABLE 'Anonymous'."
            }
          };
          throw new Error(JSON.stringify(authErrorInfo));
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const navigateTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <ErrorBoundary>
      <div className="relative font-sans text-[#0a0a0a] bg-[#f4f1ea]">
        <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#ff3e00] z-[100] origin-left" style={{ scaleX }} />
        <Navbar 
          activeSection={activeSection} 
          onNavigate={navigateTo} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main>
          <Hero onNavigate={navigateTo} />
          <HealthStories onOpenStory={setActiveStory} searchQuery={searchQuery} />
          <WahalaLoop user={user} setUser={setUser} />
          <About />
        </main>
        <AnimatePresence>
          {activeStory && <InteractiveStoryCanvas storyId={activeStory} onClose={() => setActiveStory(null)} />}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
