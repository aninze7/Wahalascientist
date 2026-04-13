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
  Bug
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

// --- DATA: INTERACTIVE STORIES ---
const STORY_DATA: Record<string, any> = {
  cascade: {
    id: 'cascade',
    title: "Memoirs of the Coagulation Cascade",
    subtitle: "THE CLOT CHRONICLES",
    accent: "#ff3e00",
    steps: [
      {
        title: "The Breach",
        label: "VASCULAR INJURY",
        desc: "A cut, a tear, a breach. The vessel wall is broken and the 'fuel' starts leaking out.",
        pidgin: "Body don get leakage! Emergency protocol activated.",
        visual: (
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <rect x="0" y="30" width="200" height="40" fill="#333" opacity="0.2" />
            <path d="M0 30 L80 30 L90 20 L100 30 L200 30" stroke="#ff3e00" strokeWidth="4" fill="none" />
            <path d="M0 70 L200 70" stroke="#ff3e00" strokeWidth="4" fill="none" />
            <motion.circle animate={{ y: [0, 50], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1 }} cx="95" cy="25" r="3" fill="#ff3e00" />
          </svg>
        )
      },
      {
        title: "Platelet Party",
        label: "PRIMARY HEMOSTASIS",
        desc: "Platelets arrive like street bouncers. They change shape and stick to form a soft plug.",
        pidgin: "Bouncers don block the door! Soft work, but we need more muscle.",
        visual: (
          <div className="flex justify-center items-center h-full gap-2">
            {[1,2,3].map(i => (
              <motion.div key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }} className="w-10 h-10 bg-[#f4f1ea] rounded-full border-4 border-[#ff3e00] flex items-center justify-center font-bold text-[#0a0a0a]">P</motion.div>
            ))}
          </div>
        )
      },
      {
        title: "The Seal",
        label: "CLOT RETRACTION",
        desc: "The Fibrin mesh tightens, pulling the wound edges together. The leak is fully sealed.",
        pidgin: "Everything set! Road block successful.",
        visual: <div className="flex items-center justify-center h-full"><ShieldCheck className="text-[#00f2ff] w-24 h-24" /></div>
      }
    ]
  },
  superbug: {
    id: 'superbug',
    title: "The Superbug Standoff",
    subtitle: "THE ODESHI EFFECT",
    accent: "#00ff66",
    steps: [
      {
        title: "The Invasion",
        label: "INFECTION BEGINS",
        desc: "Weak bacteria and strong bacteria start taking over your territory. You feel sick, feverish, and tired.",
        pidgin: "The enemies don enter your yard. They de cause standard confusion.",
        visual: (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.1 }} className={cn("w-8 h-8 rounded-full blur-sm", i % 3 === 0 ? 'bg-[#ff3e00]' : 'bg-[#00ff66]')} />
            ))}
          </div>
        )
      },
      {
        title: "The Magic Bullet",
        label: "ANTIBIOTIC INTERVENTION",
        desc: "You start your 7-day dose. Day 1-3: The antibiotics kill the weak bacteria. You start feeling better.",
        pidgin: "The bullets de fly! The weak ones don de fall.",
        visual: (
          <div className="flex flex-col items-center gap-4">
             <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} className="bg-white px-4 py-2 rounded-full font-bold text-[#0a0a0a]">PILL 💊</motion.div>
             <div className="flex gap-2">
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1 }} className="w-4 h-4 bg-[#00ff66] rounded-full" />
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.5 }} className="w-4 h-4 bg-[#00ff66] rounded-full" />
             </div>
          </div>
        )
      },
      {
        title: "Premature Stop",
        label: "THE BIG MISTAKE",
        desc: "You stop taking the meds on Day 4 because 'I don fine.' But the tough bacteria are still hiding in the corners.",
        pidgin: "You drop weapon early! You think say war don finish, but the hard-core ones still de hide.",
        visual: <Skull className="w-24 h-24 text-[#ff3e00] animate-pulse" />
      },
      {
        title: "The Survivors",
        label: "THE ODESHI EVOLUTION",
        desc: "The survivors learn your antibiotics' secret. They mutate. They become immune. They become 'Odeshi'.",
        pidgin: "The enemies don study your move. Now they don get Odeshi—next time, your bullet no go touch them.",
        visual: (
          <div className="flex justify-center">
            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-24 h-24 bg-[#ff3e00] rounded-lg border-4 border-[#00ff66] flex items-center justify-center font-bold text-xs text-center p-2">
              RESISTANT BACTERIA
            </motion.div>
          </div>
        )
      }
    ]
  },
  malaria: {
    id: 'malaria',
    title: "Malaria: The Blood War",
    subtitle: "TACTICAL INVASION",
    accent: "#ffcc00",
    steps: [
      {
        title: "The Ambush",
        label: "THE BITE",
        desc: "An infected mosquito drops the 'parasite commandoes' into your skin while it drinks.",
        pidgin: "The small plane don land. Commandos don jump out into your blood stream.",
        visual: <Bug className="w-32 h-32 text-[#ffcc00]" />
      },
      {
        title: "The Hideout",
        label: "LIVER PHASE",
        desc: "The parasites rush to your liver to hide and multiply by the thousands. No symptoms yet—they are building an army.",
        pidgin: "They de camp for your liver. Recruiting more boys for the final attack.",
        visual: (
          <div className="flex flex-wrap gap-1 w-32">
            {[...Array(20)].map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} className="w-2 h-2 bg-[#ffcc00] rounded-full" />
            ))}
          </div>
        )
      },
      {
        title: "The Raid",
        label: "BLOOD CELL ATTACK",
        desc: "The army bursts out and invades your Red Blood Cells. They hijack your oxygen carriers to reproduce further.",
        pidgin: "War don start for blood! They de scatter your cells like playground.",
        visual: (
          <div className="relative w-32 h-32">
             <div className="w-full h-full bg-[#ff3e00]/20 rounded-full border-2 border-[#ff3e00] flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.5, 0], opacity: [1, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-4 h-4 bg-[#ffcc00] rounded-full" />
             </div>
          </div>
        )
      }
    ]
  }
};

// --- INTERACTIVE STORY CANVAS COMPONENT ---
const InteractiveStoryCanvas = ({ storyId, onClose }: { storyId: string, onClose: () => void }) => {
  const [activeStep, setActiveStep] = useState(0);
  const story = STORY_DATA[storyId];
  
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
          <Home size={16} /> Close Canvas
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
                  Chapter {activeStep + 1} // {story.steps[activeStep].label}
                </div>
                <h2 className="text-4xl md:text-7xl font-bold tracking-tighter leading-none">{story.steps[activeStep].title}</h2>
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
                className="flex-1 text-[#0a0a0a] py-5 font-bold text-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all"
                style={{ backgroundColor: story.accent }}
              >
                {activeStep === story.steps.length - 1 ? "FINISH STORY" : "NEXT CHAPTER"} <ArrowRight size={24} />
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
const Navbar = ({ activeSection, onNavigate }: { activeSection: string, onNavigate: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [{ id: 'health4u', label: 'Stories' }, { id: 'wahala', label: 'Wahala Loop' }, { id: 'about', label: 'About' }];
  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-[#f4f1ea]/90 backdrop-blur-md border-b border-[#0a0a0a]/5">
      <div className="text-2xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('hero')}>
        <span className="bg-[#0a0a0a] text-[#f4f1ea] px-2 py-1">WAHALA</span>
        <span className="text-[#0a0a0a]">SCIENTIST</span>
      </div>
      <div className="hidden md:flex gap-8">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("font-mono text-xs uppercase tracking-widest transition-all hover:text-[#ff3e00] py-1", activeSection === item.id ? "text-[#ff3e00]" : "text-[#0a0a0a]/60")}>
            {item.label}
          </button>
        ))}
      </div>
      <button className="md:hidden p-2 bg-[#0a0a0a] text-[#f4f1ea] rounded-full" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </nav>
  );
};

const Hero = ({ onNavigate }: { onNavigate: (id: string) => void }) => (
  <section id="hero" className="min-h-screen flex flex-col justify-center items-start px-6 md:px-24 pt-32 bg-[#f4f1ea]">
    <div className="max-w-5xl">
      <p className="font-mono text-[#ff3e00] mb-4 uppercase tracking-[0.3em] text-sm font-bold">Systems-Level Intervention</p>
      <h1 className="text-6xl md:text-9xl font-bold leading-[0.85] tracking-tighter mb-8 text-[#0a0a0a]">
        SCIENCE <br /> <span className="text-[#ff3e00] italic">FOR THE</span> <br /> STREETS.
      </h1>
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => onNavigate('health4u')} className="bg-[#0a0a0a] text-[#f4f1ea] px-8 py-4 font-bold flex items-center justify-center gap-2 hover:bg-[#ff3e00] transition-colors">EXPLORE STORIES <ArrowRight size={20} /></button>
        <button onClick={() => onNavigate('wahala')} className="border-2 border-[#0a0a0a] text-[#0a0a0a] px-8 py-4 font-bold hover:bg-[#0a0a0a] hover:text-[#f4f1ea] transition-all">REPORT WAHALA</button>
      </div>
    </div>
  </section>
);

const HealthStories = ({ onOpenStory }: { onOpenStory: (id: string) => void }) => {
  const stories = [
    { id: 'cascade', title: "Memoirs of the Coagulation Cascade", desc: "How your body stops the leaks. A biological drama in 5 interactive acts.", img: "https://images.unsplash.com/photo-1579154235602-3c2c3da094ba?auto=format&fit=crop&q=80&w=800", tag: "Interactive" },
    { id: 'superbug', title: "The Superbug Standoff", desc: "Antibiotic resistance explained. Why stopping your meds early creates 'Odeshi' bacteria.", img: "https://images.unsplash.com/photo-1583912267550-d44d7a125e7e?auto=format&fit=crop&q=80&w=800", tag: "Interactive" },
    { id: 'malaria', title: "Malaria: The Blood War", desc: "Inside the mosquito's ambush and the parasite's plan for your liver and blood.", img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800", tag: "Interactive" }
  ];

  return (
    <section id="health4u" className="px-6 md:px-24 bg-[#0a0a0a] text-[#f4f1ea] py-32">
      <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-16">HEALTH4U <br /> STORIES</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {stories.map((story, i) => (
          <motion.div key={i} whileHover={{ y: -10 }} onClick={() => onOpenStory(story.id)} className="group cursor-pointer">
            <div className="aspect-[4/5] bg-white/10 mb-6 overflow-hidden relative border border-white/10">
              <img src={story.img} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
              <div className="absolute top-4 left-4 bg-[#00f2ff] text-[#0a0a0a] text-[10px] font-bold px-2 py-1 uppercase font-mono">{story.tag}</div>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-[#ff3e00] p-4 rounded-full"><Maximize2 size={32}/></div></div>
            </div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-[#00f2ff] transition-colors">{story.title}</h3>
            <p className="text-[#f4f1ea]/60 text-sm leading-relaxed mb-6">{story.desc}</p>
            <div className="flex items-center gap-2 text-[#00f2ff] text-xs font-bold uppercase tracking-widest">Open Canvas <ArrowRight size={14} /></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
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
          console.warn("Wahala Loop: Auth failed or disabled. Proceeding without saving to database.", authErr);
        }
      }

      console.log("Wahala Loop: Generating AI content...");
      const data = await generateWahalaContent(complaint);
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
          handleFirestoreError(dbErr, OperationType.CREATE, path);
        }
      } else {
        console.log("Wahala Loop: Skipping Firestore save (not authenticated)");
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
        console.log("Wahala Loop: Admin notification status", apiResponse.status);
      } catch (apiErr) {
        console.error("Wahala Loop: Backend API Error (Email not sent):", apiErr);
      }

      setShortResponse(data.shortResponse);
      setStatus('success');
      setComplaint(''); setEmail('');
    } catch (err: any) {
      console.error("Wahala Loop Error:", err);
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
        <div className="space-y-8"><div className="p-6 bg-[#0a0a0a] text-[#f4f1ea] border-l-8 border-white italic">"If the public can't read the data, we make sure they can see the story."</div><p className="text-lg font-medium">The Wahala Scientist isn't just a platform; it's a systems-level intervention using storytelling as a weapon for accountability.</p></div>
      </div>
    </div>
  </section>
);

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [user, setUser] = useState<User | null>(null);
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    console.log("Wahala Scientist: App initialized");
    const initAuth = async () => {
      try {
        console.log("Wahala Scientist: Initializing anonymous auth...");
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
        console.log("Wahala Scientist: Auth ready", cred.user.uid);
      } catch (err: any) { 
        console.error("Wahala Scientist: Initial auth failed", err);
        if (err.code === 'auth/admin-restricted-operation') {
          // Throw a specific error that the ErrorBoundary can catch and display nicely
          const authErrorInfo = {
            error: "Anonymous Authentication is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.",
            operationType: "Authentication",
            path: "auth/anonymous"
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
        <Navbar activeSection={activeSection} onNavigate={navigateTo} />
        <main>
          <Hero onNavigate={navigateTo} />
          <HealthStories onOpenStory={setActiveStory} />
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
