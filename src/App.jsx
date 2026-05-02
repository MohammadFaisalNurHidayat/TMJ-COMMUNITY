import { Fragment, useState, useEffect, useCallback, useRef } from "react";
import {
  Swords, Users, Target, Flame, Zap,
  ChevronDown, ChevronUp, ArrowRight,
  X, ChevronLeft, ChevronRight,
  ImageOff, Sun, Moon, Plus,
  Loader2, CheckCircle2, Send,
  Search, Clock, Home, Users2,
  Trophy, BookOpen, Image, Share2, Check,
  MessageSquare, Send as SendIcon,
  BookMarked, BarChart2, Calendar, Menu
} from "lucide-react";
import "./App.css";
import {
  useMembers, useGallery, useTestimonials,
  useAnnouncement, useNextEvent, submitRegistration,
  useLeaderboard, useTimeline, useSiteSettings,
  useDiscordMembers, useShoutbox, sendShoutbox,
  useActivePoll, usePosts,
  useAchievements, useGlobalSearch,
} from "./hooks/useSupabase";

// ============================================================
const CONFIG = {
  discordGuildId: "1411379914392993863",
  siteUrl:        "https://tmj-community.com",
  discordLink:    "https://discord.com/invite/FCFKZRKnP2",
  whatsappLink:   "https://chat.whatsapp.com/F372r0xbKdS51qvzn3xEaY",
  logoText:       "TMJxTA",
  LogoIcon:       Swords,
  heroBg:         null,
  heroVideo:      null, 

  stats: [
    { val: "47", label: "Anggota Aktif" },
    { val: "50+",  label: "Sesi Mabar per Bulan" },
    { val: "24/7", label: "Komunitas Aktif" },
  ],

  features: [
    { icon: Users,  title: "Komunitas Solid",  desc: "Tempat kumpul gamer dengan vibe santai, aktif, dan suportif.", color: "#6366f1" },
    { icon: Target, title: "Diskusi Strategi", desc: "Bahas meta, role, build, dan tips main dengan anggota lain.", color: "#8b5cf6" },
    { icon: Flame,  title: "Event & Mabar", desc: "Ada agenda mabar, fun match, sampai event komunitas yang rutin jalan.", color: "#f97316" },
    { icon: Zap,    title: "Respon Cepat", desc: "Channel komunitas aktif hampir setiap hari untuk ngobrol atau cari party.", color: "#0ea5e9" },
  ],

  faqs: [
    { q: "Bagaimana cara bergabung dengan komunitas TMJ?",  a: "Klik tombol Gabung Discord atau WhatsApp di halaman ini, lalu ikuti alur onboarding yang tersedia." },
    { q: "Apakah ada syarat khusus untuk bergabung?",      a: "Tidak ada syarat khusus. Siapa pun yang suka bermain, berdiskusi, dan menjaga suasana tetap nyaman dipersilakan bergabung." },
    { q: "Game apa saja yang dimainkan di TMJ?",           a: "TMJ tidak terbatas pada satu game. Anggota kami bermain berbagai genre mulai dari MOBA, FPS, RPG, hingga mobile games." },
    { q: "Seberapa sering event dan mabar bareng diadakan?", a: "Jadwalnya fleksibel, tapi komunitas aktif mengadakan sesi mabar dan agenda khusus secara berkala." },
    { q: "Bagaimana cara naik pangkat di komunitas TMJ?",  a: "Biasanya melalui kontribusi aktif, interaksi yang sehat, dan keterlibatan di event atau channel komunitas." },
    { q: "Apakah ada aturan yang harus ditaati?",         a: "Ada. Intinya hormati anggota lain, hindari spam, dan jaga suasana komunitas tetap nyaman untuk semua." },
  ],

  galleryCategories:     ["Semua", "Event", "Mabar", "Turnamen", "Gathering"],
  leaderboardCategories: ["Semua", "Turnamen", "Mabar", "Komunitas"],

  // Durasi loading screen — 800ms cukup
  loadingScreen: { active: true, duration: 800 },
};
// ============================================================

/* ── Discord Webhook ── */
async function notifyDiscord(formData) {
  void formData;
  return true;
}

/* ── Toast ── */
let toastId = 0;
const toastListeners = new Set();
export function showToast(msg, type = "default", duration = 3000) {
  const id = ++toastId;
  toastListeners.forEach(fn => fn({ id, message: msg, type, duration }));
}
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = t => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), t.duration);
    };
    toastListeners.add(handler);
    return () => toastListeners.delete(handler);
  }, []);
  const icons = { success:<CheckCircle2 size={16}/>, error:<X size={16}/>, info:"ℹ", default:"•" };
  const typeClasses = {
    success: "bg-gaming-card text-[#10b981] shadow-neon-green border border-[#10b981]/50",
    error: "bg-gaming-card text-gaming-red shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-gaming-red/50",
    default: "bg-gaming-card text-gaming-text border border-gaming-border shadow-lg"
  };
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm pointer-events-auto animate-[toastIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] backdrop-blur-md ${typeClasses[t.type] || typeClasses.default}`}>
          <span>{icons[t.type]||"•"}</span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn { from { transform: translateY(100%) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

/* ── Ripple ── */
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const r = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  r.className = "ripple";
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

/* ── Hooks ── */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("tmj-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tmj-theme", theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => t==="light"?"dark":"light"), []);
  return [theme, toggle];
}

function useScrollReveal() {
  useEffect(() => {
    let observer;

    const makeVisible = (el) => {
      el.classList.add("visible");
      if (observer) observer.unobserve(el);
    };

    // Cek elemen yang sudah di dalam viewport — langsung tampilkan
    const checkViewport = () => {
      document.querySelectorAll(".reveal:not(.visible), .stagger-item:not(.visible)").forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
          makeVisible(el);
        }
      });
    };

    const setup = () => {
      if (observer) observer.disconnect();

      observer = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) makeVisible(e.target);
        }),
        { threshold: 0.04, rootMargin: "0px 0px -10px 0px" }
      );

      document.querySelectorAll(".reveal:not(.visible), .stagger-item:not(.visible)").forEach(el => {
        observer.observe(el);
      });

      // Langsung cek yang sudah kelihatan
      checkViewport();
    };

    setup();

    // Retry beberapa kali untuk data yang load dari Supabase
    const timers = [
      setTimeout(() => { setup(); }, 300),
      setTimeout(() => { setup(); }, 800),
      setTimeout(() => { setup(); }, 1500),
      setTimeout(() => { setup(); }, 3000),
    ];

    // MutationObserver untuk elemen baru
    const mo = new MutationObserver(() => {
      clearTimeout(mo._t);
      mo._t = setTimeout(() => { setup(); }, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Cek saat scroll juga
    window.addEventListener("scroll", checkViewport, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      mo.disconnect();
      timers.forEach(clearTimeout);
      window.removeEventListener("scroll", checkViewport);
    };
  }, []);
}

function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if(e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin:"-40% 0px -55% 0px" }
    );
    ids.forEach(id => { const el=document.getElementById(id); if(el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return activeId;
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setP(total > 0 ? (scrolled/total)*100 : 0);
    };
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return p;
}

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return { days:0,hours:0,minutes:0,seconds:0,done:true };
    const diff = new Date(targetDate) - new Date();
    if (diff<=0) return { days:0,hours:0,minutes:0,seconds:0,done:true };
    return {
      days:    Math.floor(diff/(1000*60*60*24)),
      hours:   Math.floor((diff/(1000*60*60))%24),
      minutes: Math.floor((diff/(1000*60))%60),
      seconds: Math.floor((diff/1000)%60),
      done: false,
    };
  }, [targetDate]);
  const [time, setTime] = useState(calc);
  useEffect(() => { const id=setInterval(()=>setTime(calc()),1000); return ()=>clearInterval(id); }, [calc]);
  return time;
}

function useLoadingScreen() {
  const [visible, setVisible] = useState(CONFIG.loadingScreen.active);
  useEffect(() => {
    if (!CONFIG.loadingScreen.active) return;
    const t = setTimeout(() => setVisible(false), CONFIG.loadingScreen.duration);
    return () => clearTimeout(t);
  }, []);
  return visible;
}

function useBackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY>500);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const scrollTop = useCallback(() => window.scrollTo({top:0,behavior:"smooth"}), []);
  return [visible, scrollTop];
}

function useCardGlow() {
  useEffect(() => {
    const cards = document.querySelectorAll(".member-card,.testi-card,.lb-card");
    const onMove = e => {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--mouse-x", `${e.clientX-rect.left}px`);
      e.currentTarget.style.setProperty("--mouse-y", `${e.clientY-rect.top}px`);
    };
    cards.forEach(c => c.addEventListener("mousemove", onMove));
    return () => cards.forEach(c => c.removeEventListener("mousemove", onMove));
  }, []);
}

/* ── Icons ── */
const DiscordIcon = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.053a19.963 19.963 0 0 0 6.07 3.07.077.077 0 0 0 .083-.026A14.09 14.09 0 0 0 8.4 19.08a.076.076 0 0 0-.041-.106 13.16 13.16 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.073-3.07.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
const WAIcon = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

/* ── Skeleton ── */
function Skeleton({ width="100%", height=20, radius=8, style={} }) {
  return <div className="animate-pulse bg-gaming-border/50 backdrop-blur-sm" style={{ width, height, borderRadius:radius, flexShrink:0, ...style }}/>;
}

/* ── Loading Screen ── */
function LoadingScreen({ visible }) {
  const { LogoIcon } = CONFIG;
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-700 overflow-hidden ${visible ? "opacity-100 visible" : "opacity-0 invisible"}`} style={{background:"#080b14"}} aria-hidden={!visible}>
      {/* Ambient orbs */}
      <div className="orb w-72 h-72 animate-orb1" style={{background:"radial-gradient(circle,rgba(99,102,241,0.6),transparent 70%)",top:"10%",left:"15%"}}/>
      <div className="orb w-64 h-64 animate-orb2" style={{background:"radial-gradient(circle,rgba(56,189,248,0.4),transparent 70%)",bottom:"15%",right:"10%"}}/>
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-2xl animate-pulse" style={{background:"rgba(99,102,241,0.4)",filter:"blur(16px)",transform:"scale(1.3)"}}/>
          <div className="w-20 h-20 rounded-2xl bg-gaming-accent flex items-center justify-center relative shadow-glow-accent">
            <LogoIcon size={36} color="white"/>
          </div>
        </div>
        <div className="font-sans font-black text-2xl tracking-[6px] text-white mb-1 uppercase">{CONFIG.logoText}</div>
        <div className="text-[10px] text-[#818cf8] tracking-[4px] uppercase mb-8 font-semibold">Community Hub</div>
        <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.1)"}}>
          <div className="h-full rounded-full animate-[loadAnim_1.2s_ease-in-out_infinite]" style={{width:"40%",background:"linear-gradient(to right,#6366f1,#38bdf8)"}}/>
        </div>
      </div>
      <style>{`@keyframes loadAnim { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}</style>
    </div>
  );
}

/* ── Maintenance Page ── */
function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gaming-bg bg-grid-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none"></div>
      <div className="text-6xl mb-6 animate-float relative z-10">⚠️</div>
      <div className="font-display font-black text-4xl md:text-5xl text-gaming-red mb-3 relative z-10 tracking-wider uppercase">System Offline</div>
      <div className="text-gaming-muted max-w-md leading-relaxed mb-8 relative z-10 text-sm md:text-base">{message || "Sistem sedang dalam perbaikan. Server akan segera online kembali!"}</div>
      <div className="flex gap-4 flex-wrap justify-center relative z-10">
        <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-[#5865f2]/20 border border-[#5865f2] text-white font-bold rounded-xl text-sm hover:-translate-y-1 hover:bg-[#5865f2] transition-all">
          <DiscordIcon size={18}/> Gabung Server
        </a>
        <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-2 px-6 py-3 bg-[#25d366]/20 border border-[#25d366] text-white font-bold rounded-xl text-sm hover:-translate-y-1 hover:bg-[#25d366] transition-all">
          <WAIcon size={18}/> WhatsApp Intel
        </a>
      </div>
    </div>
  );
}

/* ── HeroBg ── */
function HeroBg({ imageUrl }) {
  const videoRef = useRef(null);
  useEffect(() => { videoRef.current?.play().catch(()=>{}); }, []);
  if (CONFIG.heroVideo) return <div className="absolute inset-0 z-0 opacity-40"><video ref={videoRef} src={CONFIG.heroVideo} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata"/><div className="absolute inset-0" style={{background:"linear-gradient(to bottom,transparent 40%,#080b14 100%)"}}/></div>;
  if (imageUrl || CONFIG.heroBg) return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage:`url(${imageUrl || CONFIG.heroBg})` }}/>
      <div className="absolute inset-0" style={{background:"linear-gradient(to bottom,transparent 30%,#080b14 100%)"}}/>
    </div>
  );
  // No image — cinematic orb background
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="orb w-[600px] h-[600px] animate-orb1" style={{background:"radial-gradient(circle,rgba(99,102,241,0.5),transparent 70%)",top:"-15%",left:"-5%"}}/>
      <div className="orb w-[500px] h-[500px] animate-orb2" style={{background:"radial-gradient(circle,rgba(56,189,248,0.35),transparent 70%)",bottom:"-10%",right:"-8%"}}/>
      <div className="orb w-80 h-80" style={{background:"radial-gradient(circle,rgba(139,92,246,0.3),transparent 70%)",top:"40%",left:"40%",animationDelay:"4s",animationDuration:"10s"}} />
      <div className="absolute inset-0 bg-grid-pattern" style={{opacity:0.4}}/>
      <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 50% at 50% 30%,transparent,rgba(8,11,20,0.6))"}}/>
    </div>
  );
}

/* ── Announcement Bar ── */
function AnnouncementBar({ annVisible, onClose }) {
  const { data } = useAnnouncement();
  const ann = data?.[0];
  if (!ann || !annVisible) return null;
  return (
    <div className={`fixed top-0 left-0 right-0 z-[300] bg-gaming-accent backdrop-blur-md px-4 py-2 flex items-center justify-center gap-3 text-xs font-semibold text-white border-b border-white/10 transition-transform duration-300 ${annVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <span className="uppercase text-[9px] bg-white/20 px-2 py-0.5 rounded font-bold tracking-wider">Pengumuman</span>
      <span className="truncate max-w-md">{ann.text}</span>
      {ann.cta && <a href={ann.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/70 transition-colors ml-1 shrink-0">{ann.cta}</a>}
      <button className="absolute right-4 text-white/70 hover:text-white transition-all p-1" onClick={onClose}><X size={14}/></button>
    </div>
  );
}

/* ── Countdown ── */
function CountdownTimer() {
  const { data: event, loading } = useNextEvent();
  const time = useCountdown(event?.event_date);
  if (loading) return <div className="mb-12 flex justify-center"><Skeleton width={320} height={80} radius={16}/></div>;
  if (!event) return null;
  const pad = n => String(n).padStart(2,"0");
  const cells = [
    {val:pad(time.days),label:"Hari"},{val:pad(time.hours),label:"Jam"},
    {val:pad(time.minutes),label:"Menit"},{val:pad(time.seconds),label:"Detik"},
  ];
  return (
    <div className="mb-12 flex flex-col items-center fu d3">
      <div className="text-xs font-semibold text-gaming-accent uppercase tracking-widest mb-3 bg-gaming-accent/10 px-3 py-1 rounded-full border border-gaming-accent/20">{event.title}</div>
      {time.done ? (
        <div className="text-gaming-cyan font-bold uppercase tracking-wider animate-pulse">🎉 Event sudah dimulai!</div>
      ) : (
        <div className="flex items-center gap-2 md:gap-4 p-4 bg-gaming-card/80 backdrop-blur-md border border-gaming-border rounded-2xl shadow-sm">
          {cells.map((c,i) => (
            <Fragment key={c.label}>
              <div key={c.label} className="flex flex-col items-center justify-center w-14 h-16 md:w-20 md:h-20 bg-gaming-bg rounded-xl border border-gaming-border relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-gaming-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="font-bold text-2xl md:text-4xl text-gaming-text z-10">{c.val}</div>
                <div className="text-[9px] md:text-[11px] font-semibold text-gaming-muted uppercase tracking-widest mt-1 z-10">{c.label}</div>
              </div>
              {i<3 && <div key={`s${i}`} className="font-bold text-xl text-gaming-muted pb-4">:</div>}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityPulseBar() {
  const { data: event } = useNextEvent();
  const { online, loaded } = useDiscordMembers(CONFIG.discordGuildId);
  const eventLabel = event?.event_date
    ? new Date(event.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : "Segera";

  return (
    <div className="flex items-center gap-4 py-1.5 px-4 bg-gaming-bg/50 border border-gaming-border rounded-full backdrop-blur-sm" aria-label="Ringkasan komunitas">
      <div className="flex items-center gap-2 px-2.5 py-1 bg-[#5865f2]/10 border border-[#5865f2]/30 rounded-full text-[10px] font-bold text-[#5865f2] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5865f2] animate-pulse"/>
        <span>{loaded ? `${online} online` : "Discord live"}</span>
      </div>
      <div className="flex flex-col hidden sm:flex">
        <div className="text-xs font-bold text-gaming-text leading-tight">{event?.title || "Komunitas TMJ aktif"}</div>
        <div className="text-[10px] text-gaming-muted leading-tight">
          {event ? `Next: ${eventLabel}` : "Pantau update & party"}
        </div>
      </div>
    </div>
  );
}

function CommunityHubSection({ go }) {
  const { data: event } = useNextEvent();
  const { data: announcement } = useAnnouncement();
  const { online, loaded } = useDiscordMembers(CONFIG.discordGuildId);
  const activeAnnouncement = announcement?.[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-24">
      <div className="flex flex-col justify-center p-8 bg-gradient-to-br from-gaming-accent/20 to-gaming-bg border border-gaming-accent/40 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
          <DiscordIcon size={120}/>
        </div>
        <div className="relative z-10">
          <div className="inline-block text-[10px] font-black text-gaming-accent uppercase tracking-widest mb-4 bg-gaming-accent/10 px-3 py-1 rounded border border-gaming-accent/20">Live Community</div>
          <div className="font-display font-black text-2xl md:text-3xl text-gaming-text mb-3 uppercase text-glow">{loaded ? `${online} member sedang online` : "Discord TMJ selalu aktif"}</div>
          <p className="text-sm text-gaming-muted mb-6 max-w-sm">Masuk untuk cari teman mabar, baca update, atau langsung ikut obrolan realtime bersama member lain.</p>
          <div className="flex flex-wrap gap-3">
            <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-[#5865f2] text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#4752c4] transition-colors shadow-[0_0_15px_rgba(88,101,242,0.4)]">
              <DiscordIcon size={16}/> Gabung Discord
            </a>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gaming-card/80 border border-gaming-border text-gaming-text font-bold text-xs uppercase tracking-wider rounded-lg hover:border-gaming-neon/50 hover:text-gaming-neon transition-colors" onClick={() => go("community")}>
              Buka Live Chat
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:gap-6">
        <button className="flex-1 text-left p-6 bg-gaming-card/40 border border-gaming-border rounded-2xl hover:border-gaming-neon/50 hover:bg-gaming-card transition-all group flex flex-col justify-center" onClick={() => go("timeline")}>
          <div className="flex items-center gap-2 text-[10px] font-black text-gaming-neon uppercase tracking-widest mb-3">
            <Calendar size={14}/> Agenda Berikutnya
          </div>
          <div className="font-display font-bold text-xl text-gaming-text mb-2 group-hover:text-gaming-neon transition-colors">{event?.title || "Belum ada event aktif"}</div>
          <p className="text-xs text-gaming-muted">{event?.event_date ? new Date(event.event_date).toLocaleString("id-ID", { day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" }) : "Pantau timeline untuk jadwal event dan turnamen baru."}</p>
        </button>
        <a className="flex-1 p-6 bg-gaming-card/40 border border-gaming-border rounded-2xl hover:border-gaming-cyan/50 hover:bg-gaming-card transition-all group flex flex-col justify-center" href={activeAnnouncement?.link || CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer">
          <div className="flex items-center gap-2 text-[10px] font-black text-gaming-cyan uppercase tracking-widest mb-3">
            <MessageSquare size={14}/> Pengumuman
          </div>
          <div className="font-display font-bold text-xl text-gaming-text mb-2 group-hover:text-gaming-cyan transition-colors">{activeAnnouncement?.cta || "Update komunitas terbaru"}</div>
          <p className="text-xs text-gaming-muted">{activeAnnouncement?.text || "Masuk grup WhatsApp atau Discord untuk pengumuman cepat dari admin."}</p>
        </a>
      </div>
    </div>
  );
}

/* ── Member Grid ── */
function roleTone(role = "") {
  const value = role.toLowerCase();
  if (value.includes("admin") || value.includes("leader")) return "text-[#e11d48] border-[#e11d48]/50 bg-[#e11d48]/10";
  if (value.includes("mod")) return "text-gaming-cyan border-gaming-cyan/50 bg-gaming-cyan/10";
  if (value.includes("coach") || value.includes("trainer")) return "text-[#f59e0b] border-[#f59e0b]/50 bg-[#f59e0b]/10";
  return "text-gaming-neon border-gaming-neon/50 bg-gaming-neon/10";
}

function MemberDetailModal({ member, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-gaming-bg/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-gaming-card border border-gaming-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-[scaleUp_0.2s_ease] relative" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none" style={{background:`linear-gradient(to bottom, ${member.color}, transparent)`}}></div>
        <button className="absolute top-4 right-4 text-gaming-muted hover:text-gaming-text hover:bg-gaming-bg p-2 rounded-full transition-colors z-10" onClick={onClose} aria-label="Tutup detail anggota">
          <X size={18}/>
        </button>
        <div className="p-6">
          <div className="flex gap-4 items-center mb-6 relative z-10">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{background:`${member.color}20`,border:`1px solid ${member.color}40`}}>
              <span className="font-display font-black text-3xl" style={{color:member.color}}>{member.avatar}</span>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-gaming-text leading-none mb-2">{member.name}</div>
              <div className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${roleTone(member.role)}`}>{member.role}</div>
            </div>
          </div>
          <p className="text-sm text-gaming-muted leading-relaxed mb-8">{member.description}</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-gaming-bg/50 border border-gaming-border rounded-lg">
              <span className="text-xs font-bold text-gaming-muted uppercase tracking-wider">Peran</span>
              <strong className="text-sm text-gaming-text">{member.role}</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-gaming-bg/50 border border-gaming-border rounded-lg">
              <span className="text-xs font-bold text-gaming-muted uppercase tracking-wider">Komunitas</span>
              <strong className="text-sm text-gaming-text">TMJ Active Crew</strong>
            </div>
            <div className="flex items-center justify-between p-3 bg-gaming-bg/50 border border-gaming-border rounded-lg">
              <span className="text-xs font-bold text-gaming-muted uppercase tracking-wider">Aktivitas</span>
              <strong className="text-sm text-gaming-text">Diskusi, mabar, event</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberGrid() {
  const { data: members, loading, error } = useMembers();
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState("Semua");
  const [selectedMember, setSelectedMember] = useState(null);
  const roles = ["Semua", ...(members ? Array.from(new Set(members.map((m) => m.role))) : [])];
  const filteredMembers = members?.filter((member) => {
    const matchRole = activeRole === "Semua" || member.role === activeRole;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || member.name?.toLowerCase().includes(q) || member.role?.toLowerCase().includes(q) || member.description?.toLowerCase().includes(q);
    return matchRole && matchQuery;
  });
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1,2,3,4].map(i=>(
        <div key={i} className="bg-gaming-card border border-gaming-border p-5 rounded-2xl">
          <Skeleton width={50} height={50} radius={14} style={{marginBottom:14}}/>
          <Skeleton width="60%" height={18} style={{marginBottom:8}}/>
          <Skeleton width="40%" height={14} style={{marginBottom:14}}/>
          <Skeleton width="100%" height={1} style={{marginBottom:12}}/>
          <Skeleton width="100%" height={40} radius={8}/>
        </div>
      ))}
    </div>
  );
  if (error) return <p className="text-gaming-muted text-center">Gagal memuat data anggota.</p>;
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 p-4 bg-gaming-card/40 border border-gaming-border rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gaming-muted"/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau role..." className="w-full bg-gaming-bg border border-gaming-border pl-9 pr-4 py-2 rounded-xl text-sm text-gaming-text placeholder:text-gaming-muted/50 focus:border-gaming-neon outline-none transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {roles.map((role) => (
            <button key={role} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${activeRole===role?"bg-gaming-text text-gaming-bg border-gaming-text":"bg-gaming-bg text-gaming-muted border-gaming-border hover:border-gaming-neon hover:text-gaming-neon"}`} onClick={() => setActiveRole(role)}>
              {role}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs font-bold text-gaming-muted uppercase tracking-widest mb-6">Menampilkan {filteredMembers?.length || 0} dari {members?.length || 0} anggota inti</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredMembers?.map((m,i)=>(
        <button key={m.id} className="group text-left bg-gaming-card border border-gaming-border p-5 rounded-2xl hover:border-gaming-neon/50 hover:bg-gaming-card/80 transition-all shadow-lg flex flex-col" style={{transitionDelay:`${i*0.05}s`}} onClick={() => setSelectedMember(m)}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{background:`${m.color}20`,border:`1px solid ${m.color}40`}}>
            <span className="font-display font-black text-xl" style={{color:m.color}}>{m.avatar}</span>
          </div>
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="font-display font-bold text-lg text-gaming-text leading-tight group-hover:text-gaming-neon transition-colors truncate">{m.name}</div>
            <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border shrink-0 ${roleTone(m.role)}`}>{m.role}</div>
          </div>
          <div className="w-full h-px bg-gaming-border mb-3 opacity-50"/>
          <div className="text-xs text-gaming-muted line-clamp-2 mb-4 flex-1">{m.description}</div>
          <div className="flex items-center justify-between text-[10px] font-bold text-gaming-cyan uppercase tracking-widest mt-auto group-hover:translate-x-1 transition-transform">
            Lihat profil <ArrowRight size={14}/>
          </div>
        </button>
      ))}
      </div>
      {!filteredMembers?.length && (
        <div className="flex flex-col items-center justify-center py-12 text-gaming-muted border border-dashed border-gaming-border rounded-2xl mt-4">
          <Users size={32} className="mb-3 opacity-50"/>
          <span className="text-sm">Tidak ada anggota yang cocok dengan pencarian.</span>
        </div>
      )}
      <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </>
  );
}

/* ── Testimonials ── */
function Testimonials() {
  const { data: items, loading } = useTestimonials();
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3,4].map(i=>(
        <div key={i} className="bg-gaming-card border border-gaming-border p-6 rounded-2xl">
          <Skeleton width={32} height={32} radius={4} style={{marginBottom:12}}/>
          <Skeleton width="100%" height={80} radius={6} style={{marginBottom:12}}/>
          <Skeleton width="30%" height={14} style={{marginBottom:16}}/>
          <Skeleton width="100%" height={1}/>
          <div className="flex gap-3 mt-4">
            <Skeleton width={38} height={38} radius={10}/>
            <div className="flex-1"><Skeleton width="60%" height={14} style={{marginBottom:6}}/><Skeleton width="40%" height={12}/></div>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items?.map((t,i)=>(
        <div key={t.id} className="group bg-gaming-card/40 backdrop-blur-sm border border-gaming-border p-6 rounded-2xl hover:bg-gaming-card hover:border-gaming-neon/50 transition-all shadow-lg flex flex-col" style={{transitionDelay:`${i*0.08}s`}}>
          <div className="font-display font-black text-6xl text-gaming-neon/20 leading-none mb-[-20px]">"</div>
          <p className="text-sm text-gaming-text leading-relaxed flex-1 italic relative z-10 mb-4">{t.text}</p>
          <div className="flex gap-1 mb-4">{Array.from({length:t.stars}).map((_,j)=><span key={j} className="text-[#f59e0b] text-sm drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">★</span>)}</div>
          <div className="w-full h-px bg-gaming-border mb-4 opacity-50"/>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{background:`${t.color}15`,border:`1px solid ${t.color}30`}}>
              <span className="font-display font-black text-lg" style={{color:t.color}}>{t.avatar}</span>
            </div>
            <div>
              <div className="font-display font-bold text-gaming-text leading-tight group-hover:text-gaming-cyan transition-colors">{t.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gaming-muted">{t.role}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Gallery ── */
function Gallery({ onOpen }) {
  const { data: items, loading } = useGallery();
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const filtered = items?.filter(g => {
    const matchCat = activeFilter==="Semua" || g.category===activeFilter;
    const matchSearch = !search || g.caption?.toLowerCase().includes(search.toLowerCase()) || g.category?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1,2,3,4,5,6].map(i=><Skeleton key={i} width="100%" height={220} radius={20}/>)}
    </div>
  );
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8 p-4 bg-gaming-card/40 border border-gaming-border rounded-2xl backdrop-blur-sm">
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gaming-muted"/>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari foto..." className="w-full bg-gaming-bg border border-gaming-border pl-9 pr-8 py-2 rounded-xl text-sm text-gaming-text placeholder:text-gaming-muted/50 focus:border-gaming-neon outline-none transition-colors" />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gaming-muted hover:text-gaming-text" onClick={()=>setSearch("")}><X size={14}/></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {CONFIG.galleryCategories.map(cat=>(
            <button key={cat} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${activeFilter===cat?"bg-gaming-text text-gaming-bg border-gaming-text":"bg-gaming-bg text-gaming-muted border-gaming-border hover:border-gaming-neon hover:text-gaming-neon"}`} onClick={()=>setActiveFilter(cat)} onMouseDown={addRipple}>{cat}</button>
          ))}
        </div>
      </div>
      {(search||activeFilter!=="Semua") && (
        <div className="text-xs font-bold text-gaming-muted uppercase tracking-widest mb-6">Menampilkan {filtered?.length||0} dari {items?.length||0} foto</div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
        {!filtered?.length ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gaming-muted border border-dashed border-gaming-border rounded-2xl">
            <ImageOff size={32} className="mb-3 opacity-50"/>
            <p className="text-sm">{search?`Tidak ada foto cocok dengan "${search}"`:"Belum ada foto di kategori ini."}</p>
          </div>
        ) : filtered.map((item,i)=>{
          const originalIdx = items.indexOf(item);
          return (
            <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-gaming-border cursor-pointer hover:border-gaming-neon/80 transition-all shadow-lg bg-gaming-card" style={{transitionDelay:`${i*0.06}s`}}
              onClick={()=>onOpen(originalIdx)} role="button" tabIndex={0}
              aria-label={item.caption||"Lihat foto"}
              onKeyDown={e=>e.key==="Enter"&&onOpen(originalIdx)}
            >
              {item.src
                ? <>
                    <img src={item.src} alt={item.caption} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-gaming-bg/90 via-gaming-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                    <div className="absolute top-3 left-3 px-2 py-1 bg-gaming-bg/80 backdrop-blur-md border border-gaming-border rounded text-[9px] font-bold uppercase tracking-widest text-gaming-cyan">{item.category}</div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-xs font-medium text-white truncate drop-shadow-md">{item.caption}</div>
                    </div>
                  </>
                : <div className="w-full h-full flex flex-col items-center justify-center text-gaming-muted"><ImageOff size={26} className="mb-2 opacity-50"/><span className="text-xs text-center px-4">{item.caption||"Foto belum ditambahkan"}</span></div>
              }
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── Leaderboard ── */
function LeaderboardSection() {
  const { data: items, loading } = useLeaderboard();
  const [activeTab, setActiveTab] = useState("Semua");
  const filtered = activeTab==="Semua" ? items : items?.filter(i=>i.category===activeTab);
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CONFIG.leaderboardCategories.map(cat=>(
          <button key={cat} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex-1 ${activeTab===cat?"bg-gaming-text text-gaming-bg border-gaming-text shadow-glow-accent":"bg-gaming-card/50 text-gaming-muted border-gaming-border hover:border-gaming-neon/50 hover:text-gaming-neon backdrop-blur-sm"}`} onClick={()=>setActiveTab(cat)} onMouseDown={addRipple}>{cat}</button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} className="bg-gaming-card border border-gaming-border p-6 rounded-2xl">
              <Skeleton width={52} height={52} radius={14} style={{marginBottom:14}}/>
              <Skeleton width="60%" height={18} style={{marginBottom:8}}/>
              <Skeleton width="40%" height={14} style={{marginBottom:14}}/>
              <Skeleton width="100%" height={1} style={{marginBottom:10}}/>
              <Skeleton width="100%" height={48} radius={6}/>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((item,i)=>(
            <div key={item.id} className="relative group bg-gaming-card/40 backdrop-blur-sm border border-gaming-border p-6 rounded-2xl hover:bg-gaming-card transition-all shadow-lg flex flex-col mt-4" style={{borderTop:`3px solid ${item.color}`,transitionDelay:`${i*0.08}s`}}>
              <div className="absolute -top-5 right-4 w-10 h-10 bg-gaming-bg border border-gaming-border rounded-full flex items-center justify-center font-display font-black text-lg shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-10" style={{color:item.color}}>{item.badge}</div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform" style={{background:`${item.color}15`,border:`1px solid ${item.color}30`}}>
                <span className="font-display font-black text-2xl" style={{color:item.color}}>{item.avatar}</span>
              </div>
              <div className="font-display font-bold text-xl text-gaming-text mb-2 group-hover:text-gaming-neon transition-colors">{item.name}</div>
              <div className="inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border w-fit mb-3" style={{background:`${item.color}10`,color:item.color,borderColor:`${item.color}30`}}>{item.title}</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gaming-muted uppercase tracking-wider mb-4"><Clock size={12} className="text-gaming-neon"/>{item.season}</div>
              <div className="w-full h-px bg-gaming-border mb-4 opacity-50"/>
              <div className="text-xs text-gaming-muted leading-relaxed flex-1">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Timeline ── */
function TimelineSection() {
  const { data: items, loading } = useTimeline();
  if (loading) return (
    <div className="flex flex-col gap-6 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-gaming-border ml-2">
      {[1,2,3,4].map(i=>(
        <div key={i} className="flex gap-6 relative z-10">
          <Skeleton width={40} height={40} radius={10} style={{flexShrink:0}}/>
          <div className="flex-1 pb-8"><Skeleton width="30%" height={12} style={{marginBottom:8}}/><Skeleton width="70%" height={18} style={{marginBottom:8}}/><Skeleton width="100%" height={40} radius={6}/></div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-8 relative before:absolute before:inset-y-0 before:left-[23px] before:w-0.5 before:bg-gradient-to-b before:from-gaming-neon before:via-gaming-cyan before:to-gaming-accent before:opacity-30 ml-2">
      {items?.map((item,i)=>(
        <div key={item.id} className="flex gap-6 relative z-10 group" style={{transitionDelay:`${i*0.1}s`}}>
          <div className="absolute left-[18px] top-4 w-3 h-3 rounded-full bg-gaming-bg border-[3px] shadow-[0_0_10px_currentColor] group-hover:scale-150 transition-transform duration-300" style={{borderColor:item.color, color:item.color}}/>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:-translate-y-1 transition-transform" style={{background:`${item.color}15`,border:`1px solid ${item.color}30`}}>
            <span className="text-xl drop-shadow-[0_0_8px_currentColor]" style={{color:item.color}}>{item.icon}</span>
          </div>
          <div className="flex-1 bg-gaming-card/40 backdrop-blur-sm border border-gaming-border p-5 rounded-2xl hover:bg-gaming-card hover:border-gaming-neon/50 transition-all shadow-lg">
            <div className="text-[10px] font-bold text-gaming-muted uppercase tracking-widest mb-1 group-hover:text-gaming-cyan transition-colors">{item.date}</div>
            <div className="font-display font-bold text-lg text-gaming-text mb-2 group-hover:text-gaming-neon transition-colors">{item.title}</div>
            <div className="text-sm text-gaming-muted leading-relaxed">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── FAQ ── */
function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="flex flex-col gap-3">
      {CONFIG.faqs.map((faq,i)=>(
        <div key={i} className={`bg-gaming-card/40 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${openIdx===i?"border-gaming-neon shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-gaming-card":"border-gaming-border hover:border-gaming-neon/50"}`}>
          <button className="w-full flex items-center justify-between p-5 text-left group" onClick={()=>setOpenIdx(p=>p===i?null:i)} aria-expanded={openIdx===i}>
            <span className={`font-bold text-sm md:text-base pr-4 transition-colors ${openIdx===i?"text-gaming-neon":"text-gaming-text group-hover:text-gaming-cyan"}`}>{faq.q}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openIdx===i?"bg-gaming-neon text-gaming-bg rotate-45":"bg-gaming-bg border border-gaming-border text-gaming-muted group-hover:border-gaming-neon/50 group-hover:text-gaming-neon"}`}><Plus size={16}/></div>
          </button>
          <div className={`grid transition-all duration-300 ${openIdx===i?"grid-rows-[1fr] opacity-100":"grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="p-5 pt-0 border-t border-gaming-border/50 mt-2 text-sm text-gaming-muted leading-relaxed">
                {faq.a}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Registration Form ── */
function RegistrationForm() {
  const [form, setForm] = useState({full_name:"",discord_username:"",whatsapp:"",game_interest:"",message:""});
  const [status, setStatus] = useState(null);
  const handle = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const submit = async e => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setStatus("loading");
    try {
      await submitRegistration(form);
      await notifyDiscord(form);
      setStatus("success");
      setForm({full_name:"",discord_username:"",whatsapp:"",game_interest:"",message:""});
      showToast("Pendaftaran berhasil dikirim! 🎉","success");
    } catch {
      setStatus("error");
      showToast("Gagal mengirim. Coba lagi.","error");
    }
  };
  const inputClass = "w-full px-4 py-3 bg-gaming-bg/50 border border-gaming-border rounded-xl text-sm text-gaming-text placeholder:text-gaming-muted focus:border-gaming-neon focus:ring-1 focus:ring-gaming-neon outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gaming-muted uppercase tracking-wider mb-2";
  
  if (status==="success") return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gaming-card/40 border border-gaming-border rounded-2xl backdrop-blur-sm">
      <div className="w-20 h-20 rounded-full bg-gaming-neon/10 border border-gaming-neon/30 flex items-center justify-center text-gaming-neon mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        <CheckCircle2 size={40}/>
      </div>
      <h3 className="font-display font-black text-2xl text-gaming-text mb-3 uppercase text-glow">Pendaftaran Terkirim!</h3>
      <p className="text-sm text-gaming-muted max-w-sm mb-8">Data kamu sudah masuk sistem kami. Tim TMJ akan menghubungimu melalui Discord atau WhatsApp secepatnya.</p>
      <button onClick={()=>setStatus(null)} className="px-6 py-3 bg-gaming-accent text-white font-bold text-sm uppercase tracking-wider clip-angle-button hover:bg-gaming-neon transition-all shadow-glow-accent">Daftar Lagi</button>
    </div>
  );
  
  return (
    <form onSubmit={submit} className="flex flex-col gap-6 bg-gaming-card/40 backdrop-blur-sm border border-gaming-border p-6 md:p-8 rounded-2xl shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className={labelClass}>Nama Lengkap <span className="text-[#e11d48]">*</span></label><input name="full_name" value={form.full_name} onChange={handle} placeholder="Nama kamu" className={inputClass} required/></div>
        <div><label className={labelClass}>Username Discord</label><input name="discord_username" value={form.discord_username} onChange={handle} placeholder="username" className={inputClass}/></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label className={labelClass}>Nomor WhatsApp</label><input name="whatsapp" value={form.whatsapp} onChange={handle} placeholder="08xxxxxxxxxx" className={inputClass}/></div>
        <div><label className={labelClass}>Game Favorit</label><input name="game_interest" value={form.game_interest} onChange={handle} placeholder="Mobile Legends, PUBG..." className={inputClass}/></div>
      </div>
      <div><label className={labelClass}>Pesan / Alasan Bergabung</label><textarea name="message" value={form.message} onChange={handle} rows={4} placeholder="Ceritakan sedikit tentang kamu..." className={`${inputClass} resize-y min-h-[120px]`}/></div>
      <button type="submit" disabled={status==="loading"} className="mt-2 flex items-center justify-center gap-2 px-8 py-4 bg-gaming-accent text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gaming-neon transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-70 disabled:cursor-not-allowed">
        {status==="loading"?<><Loader2 size={18} className="animate-spin"/> Mengirim...</>:<><Send size={18}/> Kirim Pendaftaran</>}
      </button>
    </form>
  );
}

/* ── Discord Counter ── */
function DiscordCounter() {
  const { online, loaded } = useDiscordMembers(CONFIG.discordGuildId);
  return (
    <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-4 py-2 bg-[#5865f2]/10 border border-[#5865f2]/30 rounded-full hover:bg-[#5865f2]/20 transition-colors">
      <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"/>
      <span className="text-sm font-medium text-[#5865f2]">{loaded ? <><strong className="font-bold text-gaming-text">{online}</strong> online sekarang</> : "Cek Discord"}</span>
      <DiscordIcon size={16} className="text-[#5865f2]"/>
    </a>
  );
}

/* ── Shoutbox ── */
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#f59e0b","#10b981","#f97316","#0ea5e9","#e11d48","#14b8a6"];
const getColor = name => AVATAR_COLORS[name.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%AVATAR_COLORS.length];
const getInitials = name => name.trim().slice(0,2).toUpperCase();
const formatTime = dateStr => new Date(dateStr).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});

function ShoutboxSection() {
  const { messages, loading } = useShoutbox();
  const [name, setName]   = useState(()=>localStorage.getItem("tmj-shout-name")||"");
  const [msg, setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  useEffect(()=>{
    if(cooldown<=0) return;
    const id=setInterval(()=>setCooldown(c=>Math.max(0,c-1)),1000);
    return ()=>clearInterval(id);
  },[cooldown]);

  const send = async e => {
    e.preventDefault();
    if(!name.trim()||!msg.trim()||sending||cooldown>0) return;
    setSending(true);
    try {
      const color = getColor(name.trim());
      await sendShoutbox(name.trim(),msg.trim(),color);
      localStorage.setItem("tmj-shout-name",name.trim());
      setMsg(""); setCooldown(15);
      showToast("Pesan terkirim! 💬","success",2000);
    } catch { showToast("Gagal kirim pesan.","error"); }
    finally { setSending(false); }
  };

  return (
    <div className="bg-gaming-card/40 backdrop-blur-md border border-gaming-border rounded-2xl shadow-lg flex flex-col h-[500px]">
      <div className="p-4 border-b border-gaming-border bg-gaming-card/60 flex items-center justify-between rounded-t-2xl">
        <div className="font-display font-bold text-gaming-text text-lg flex items-center gap-2"><MessageSquare size={18} className="text-gaming-neon"/> Shoutbox</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gaming-cyan bg-gaming-cyan/10 px-2 py-1 rounded">{messages.length} pesan</div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gaming-border scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gaming-muted"><Skeleton width={200} height={14} style={{marginBottom:8}}/><Skeleton width={160} height={14}/></div>
        ) : messages.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gaming-muted">
            <div className="text-4xl mb-2 opacity-50">💭</div>
            <p className="text-sm">Belum ada pesan. Jadilah yang pertama!</p>
          </div>
        ) : messages.map(m=>(
          <div key={m.id} className="flex items-start gap-3 group animate-[fadeIn_0.3s_ease]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-sm" style={{background:`${m.avatar_color}18`,border:`1px solid ${m.avatar_color}30`,color:m.avatar_color}}>
              {getInitials(m.name)}
            </div>
            <div className="flex-1 bg-gaming-bg/50 border border-gaming-border/50 p-3 rounded-2xl rounded-tl-sm group-hover:border-gaming-neon/30 transition-colors">
              <div className="flex items-end justify-between mb-1">
                <div className="font-bold text-sm text-gaming-text">{m.name}</div>
                <div className="text-[10px] text-gaming-muted">{formatTime(m.created_at)}</div>
              </div>
              <div className="text-sm text-gaming-muted leading-relaxed break-words">{m.message}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="p-4 border-t border-gaming-border bg-gaming-card/60 rounded-b-2xl">
        <form onSubmit={send}>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="sm:w-1/3 px-4 py-2 bg-gaming-bg/80 border border-gaming-border rounded-xl text-sm text-gaming-text placeholder:text-gaming-muted focus:border-gaming-neon outline-none" placeholder="Nama kamu" value={name} onChange={e=>setName(e.target.value)} maxLength={30} required/>
            <input className="flex-1 px-4 py-2 bg-gaming-bg/80 border border-gaming-border rounded-xl text-sm text-gaming-text placeholder:text-gaming-muted focus:border-gaming-neon outline-none" placeholder="Tulis pesan..." value={msg} onChange={e=>setMsg(e.target.value)} maxLength={200} required/>
            <button type="submit" className="px-6 py-2 bg-gaming-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gaming-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2" disabled={sending||cooldown>0||!name.trim()||!msg.trim()}>
              {cooldown>0?`${cooldown}s`:sending?"...":<><SendIcon size={14}/>Kirim</>}
            </button>
          </div>
          {cooldown>0 && <div className="text-[10px] text-gaming-red mt-2 text-center uppercase tracking-wider font-bold">Tunggu {cooldown} detik sebelum kirim lagi</div>}
        </form>
      </div>
    </div>
  );
}

/* ── Poll ── */
function PollSection() {
  const { poll, options, loading, hasVoted, vote, totalVotes } = useActivePoll();
  const [justVoted, setJustVoted] = useState(false);
  const maxVotes = Math.max(...options.map(o=>o.votes||0),1);
  const winner   = options.reduce((a,b)=>(b.votes||0)>(a.votes||0)?b:a, options[0]);
  const formatEnds = dateStr => dateStr ? new Date(dateStr).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : null;

  const handleVote = (id) => {
    if (!hasVoted) {
      vote(id);
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 3000);
    }
  };

  if (loading) return (
    <div className="bg-gaming-card/40 border border-gaming-border p-8 rounded-2xl">
      <Skeleton width="80%" height={24} style={{marginBottom:20}}/>
      {[1,2,3,4].map(i=><Skeleton key={i} width="100%" height={48} radius={12} style={{marginBottom:10}}/>)}
    </div>
  );
  if (!poll) return (
    <div className="bg-gaming-card/40 border border-gaming-border p-12 text-center rounded-2xl flex flex-col items-center">
      <div className="text-5xl mb-4 opacity-50">🗳️</div>
      <p className="text-gaming-muted">Belum ada poll aktif saat ini.</p>
    </div>
  );

  return (
    <div className={`bg-gaming-card/40 backdrop-blur-md border border-gaming-border p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-500 ${justVoted ? "shadow-[0_0_30px_rgba(16,185,129,0.3)] border-[#10b981]/50 scale-[1.02]" : ""}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
      {justVoted && <div className="absolute inset-0 bg-[#10b981]/5 animate-[fadeOut_1s_ease_forwards] pointer-events-none z-20"></div>}
      
      <h3 className="font-display font-bold text-xl md:text-2xl text-gaming-text mb-2 relative z-10">{poll.question}</h3>
      {poll.ends_at && <div className="text-xs font-bold text-gaming-muted uppercase tracking-widest mb-6 relative z-10 flex items-center gap-1.5"><Clock size={12} className="text-[#10b981]"/> Berakhir {formatEnds(poll.ends_at)}</div>}
      
      <div className="flex flex-col gap-3 relative z-10">
      {options.map((opt, i)=>{
        const pct = totalVotes>0 ? Math.round((opt.votes||0)/totalVotes*100) : 0;
        const isWinner = hasVoted && opt.id===winner?.id;
        return (
          <button key={opt.id} className={`relative overflow-hidden w-full text-left rounded-xl transition-all duration-300 border group/poll ${isWinner?"border-[#10b981]/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]":"border-gaming-border"} ${hasVoted?"cursor-default bg-gaming-bg/50":"bg-gaming-bg hover:border-[#10b981]/50 cursor-pointer hover:-translate-y-1"}`}
            onClick={()=>handleVote(opt.id)} disabled={hasVoted} style={{transitionDelay: hasVoted ? `${i*0.1}s` : '0s'}}>
            {hasVoted && <div className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out" style={{width:`${pct}%`,background:isWinner?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.05)"}}/>}
            <div className="relative z-10 flex items-center justify-between p-4">
              <span className={`font-medium ${isWinner?"text-[#10b981]":"text-gaming-text group-hover/poll:text-gaming-neon transition-colors"}`}>{opt.label}</span>
              {hasVoted && <span className="font-bold text-sm text-gaming-text animate-[fadeIn_0.5s_ease_both]" style={{animationDelay: `${0.5 + (i*0.1)}s`}}>{pct}%</span>}
            </div>
          </button>
        );
      })}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-wider border-t border-gaming-border pt-4 relative z-10">
        <span className="text-gaming-muted">{totalVotes} total vote</span>
        {hasVoted && (
          <div className={`flex items-center gap-1 text-[#10b981] font-bold ${justVoted ? "animate-bounce" : ""}`}>
            <Check size={14}/> {justVoted ? "Terima kasih atas votemu!" : "Sudah vote!"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Blog ── */
function BlogSection() {
  const { data: posts, loading } = usePosts();
  const [selected, setSelected] = useState(null);
  const formatDate = dateStr => new Date(dateStr).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3].map(i=>(
        <div key={i} className="bg-gaming-card border border-gaming-border rounded-2xl overflow-hidden">
          <Skeleton width="100%" height={180} radius={0}/>
          <div className="p-6">
            <Skeleton width="40%" height={14} style={{marginBottom:10}}/>
            <Skeleton width="80%" height={20} style={{marginBottom:8}}/>
            <Skeleton width="100%" height={56} radius={6} style={{marginBottom:14}}/>
            <Skeleton width="100%" height={1} style={{marginBottom:12}}/>
            <div className="flex items-center gap-3">
              <Skeleton width={28} height={28} radius={8}/>
              <Skeleton width="40%" height={12}/>
              <Skeleton width="25%" height={12} style={{marginLeft:"auto"}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post,i)=>(
          <div key={post.id} className="group bg-gaming-card/40 border border-gaming-border rounded-2xl overflow-hidden cursor-pointer hover:border-gaming-neon/50 hover:bg-gaming-card transition-all shadow-lg flex flex-col" style={{transitionDelay:`${i*0.1}s`}}
            onClick={()=>setSelected(post)} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&setSelected(post)}>
            <div className="h-48 overflow-hidden bg-gaming-bg relative">
              <img
                src={post.cover_image || `https://picsum.photos/seed/${post.id || i}/600/300`}
                alt={post.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gaming-card to-transparent opacity-80"/>
            </div>
            <div className="p-6 flex-1 flex flex-col relative">
              <div className="absolute -top-4 right-4 bg-gaming-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">{post.category}</div>
              <div className="font-display font-bold text-xl text-gaming-text mb-3 group-hover:text-gaming-neon transition-colors leading-tight mt-2">{post.title}</div>
              <div className="text-sm text-gaming-muted leading-relaxed mb-6 flex-1">{post.excerpt}</div>
              <div className="w-full h-px bg-gaming-border mb-4 opacity-50"/>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-[10px]" style={{background:`${post.author_color}15`,border:`1px solid ${post.author_color}25`,color:post.author_color}}>
                  {post.author_avatar}
                </div>
                <span className="font-bold text-gaming-text">{post.author_name}</span>
                <span className="text-gaming-muted ml-auto flex items-center gap-1"><Calendar size={12}/>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-gaming-bg/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={()=>setSelected(null)}>
          <div className="bg-gaming-card border border-gaming-border w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[scaleUp_0.2s_ease] relative" onClick={e=>e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-white hover:text-gaming-neon bg-gaming-bg/50 hover:bg-gaming-bg p-2 rounded-full transition-colors z-20 backdrop-blur-md" onClick={()=>setSelected(null)}><X size={18}/></button>
            <div className="h-64 sm:h-80 relative shrink-0">
              {selected.cover_image ? <img src={selected.cover_image} alt={selected.title} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gaming-bg flex items-center justify-center text-6xl opacity-20">📝</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-gaming-card via-gaming-card/20 to-transparent"/>
            </div>
            <div className="p-6 sm:p-10 flex-1 overflow-y-auto relative z-10 -mt-20">
              <span className="inline-block px-3 py-1 bg-gaming-accent text-white text-[10px] font-bold uppercase tracking-widest rounded mb-4">{selected.category}</span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-gaming-text leading-tight mb-6">{selected.title}</h2>
              <div className="flex items-center gap-4 text-xs sm:text-sm mb-8 bg-gaming-bg/50 p-4 rounded-xl border border-gaming-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm" style={{background:`${selected.author_color}15`,border:`1px solid ${selected.author_color}25`,color:selected.author_color}}>
                  {selected.author_avatar}
                </div>
                <div>
                  <div className="font-bold text-gaming-text mb-0.5">{selected.author_name}</div>
                  <div className="text-gaming-muted flex items-center gap-1.5"><Calendar size={14}/> {formatDate(selected.created_at)}</div>
                </div>
              </div>
              <div className="prose prose-invert prose-gaming max-w-none">
                {selected.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Achievements ── */
const ACH_CATEGORIES = ["Semua","Special","Turnamen","Mabar","Komunitas","Milestone"];
function AchievementsSection() {
  const { data: items, loading } = useAchievements();
  const [activeTab, setActiveTab] = useState("Semua");
  const filtered = activeTab==="Semua" ? items : items?.filter(a=>a.category===activeTab);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {ACH_CATEGORIES.map(cat=>(
          <button key={cat} className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border flex-1 ${activeTab===cat?"bg-gaming-text text-gaming-bg border-gaming-text shadow-glow-accent":"bg-gaming-card/50 text-gaming-muted border-gaming-border hover:border-gaming-neon/50 hover:text-gaming-neon backdrop-blur-sm"}`} onClick={()=>setActiveTab(cat)} onMouseDown={addRipple}>{cat}</button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4].map(i=>(
            <div key={i} className="bg-gaming-card border border-gaming-border p-6 rounded-2xl">
              <div className="flex gap-3 mb-4">
                <Skeleton width={40} height={40} radius={11}/>
                <div className="flex-1"><Skeleton width="60%" height={16} style={{marginBottom:6}}/><Skeleton width="40%" height={11}/></div>
              </div>
              <Skeleton width="100%" height={1} style={{marginBottom:14}}/>
              <div className="flex gap-3">
                <Skeleton width={48} height={48} radius={14}/>
                <div className="flex-1"><Skeleton width="70%" height={15} style={{marginBottom:6}}/><Skeleton width="100%" height={36} radius={6}/></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((a,i)=>(
            <div key={a.id} className="relative group bg-gaming-card/40 backdrop-blur-sm border border-gaming-border p-6 rounded-2xl hover:bg-gaming-card hover:border-gaming-neon/50 transition-all shadow-lg flex flex-col" style={{transitionDelay:`${i*0.07}s`}}>
              <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{background:`${a.badge_color}15`,color:a.badge_color,border:`1px solid ${a.badge_color}25`}}>{a.category}</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-lg shadow-md" style={{background:`${a.member_color}12`,border:`1px solid ${a.member_color}22`}}>
                  <span style={{color:a.member_color}}>{a.member_avatar}</span>
                </div>
                <div>
                  <div className="font-bold text-gaming-text group-hover:text-gaming-cyan transition-colors">{a.member_name}</div>
                  {a.earned_at && <div className="text-[10px] font-bold uppercase tracking-widest text-gaming-muted mt-0.5">🗓 {a.earned_at}</div>}
                </div>
              </div>
              <div className="w-full h-px bg-gaming-border mb-4 opacity-50"/>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-2xl shrink-0 group-hover:scale-110 transition-transform shadow-lg" style={{background:`${a.badge_color}12`,border:`1px solid ${a.badge_color}22`}}>{a.badge_icon}</div>
                <div className="flex-1">
                  <div className="font-display font-bold text-lg text-gaming-text mb-1 group-hover:text-gaming-neon transition-colors leading-tight">{a.badge_name}</div>
                  <div className="text-xs text-gaming-muted leading-relaxed">{a.badge_desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Global Search ── */
function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const { results, loading, total } = useGlobalSearch(query);
  const inputRef = useRef(null);

  useEffect(()=>{ if(isOpen){ setTimeout(()=>inputRef.current?.focus(),50); setQuery(""); } },[isOpen]);
  useEffect(()=>{
    const fn = e => { if(e.key==="Escape"&&isOpen) onClose(); };
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[isOpen,onClose]);

  if (!isOpen) return null;
  const hasResults = query.length>=2;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20 px-4 bg-gaming-bg/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-gaming-card border border-gaming-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[scaleUp_0.2s_ease]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center px-4 py-4 border-b border-gaming-border relative">
          <Search size={20} className="text-gaming-muted mr-3"/>
          <input ref={inputRef} className="flex-1 bg-transparent border-none outline-none text-gaming-text text-lg placeholder:text-gaming-muted" placeholder="Cari anggota, artikel, galeri..." value={query} onChange={e=>setQuery(e.target.value)} autoComplete="off"/>
          {loading && <Loader2 size={18} className="animate-spin text-gaming-muted mx-3"/>}
          <button className="p-1 text-gaming-muted hover:text-gaming-text hover:bg-gaming-bg rounded" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gaming-border scrollbar-track-transparent">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center py-12 text-gaming-muted"><div className="text-4xl mb-4 opacity-50">🔍</div><p className="text-sm">Ketik minimal 2 karakter untuk mulai mencari</p></div>
          ) : total===0&&!loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gaming-muted"><div className="text-4xl mb-4 opacity-50">😕</div><p className="text-sm">Tidak ada hasil untuk <strong>"{query}"</strong></p></div>
          ) : (
            <div className="space-y-6">
              {results.members.length>0 && (
                <div>
                  <div className="text-[10px] font-bold text-gaming-cyan uppercase tracking-widest mb-3 px-2">👥 Anggota</div>
                  <div className="flex flex-col gap-1">
                  {results.members.map(m=>(
                    <button key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gaming-bg transition-colors text-left" onClick={onClose}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{background:`${m.color}15`}}><span style={{color:m.color,fontWeight:800,fontSize:14}}>{m.avatar}</span></div>
                      <div><div className="font-bold text-gaming-text text-sm">{m.name}</div><div className="text-xs text-gaming-muted">{m.role}</div></div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
              {results.posts.length>0 && (
                <div>
                  <div className="text-[10px] font-bold text-gaming-accent uppercase tracking-widest mb-3 px-2">📝 Artikel</div>
                  <div className="flex flex-col gap-1">
                  {results.posts.map(p=>(
                    <button key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gaming-bg transition-colors text-left" onClick={onClose}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xl bg-gaming-accent/10 text-gaming-accent">📄</div>
                      <div><div className="font-bold text-gaming-text text-sm">{p.title}</div><div className="text-xs text-gaming-muted">{p.category} · {p.author_name}</div></div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
              {results.gallery.length>0 && (
                <div>
                  <div className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3 px-2">🖼 Galeri</div>
                  <div className="flex flex-col gap-1">
                  {results.gallery.map(g=>(
                    <button key={g.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gaming-bg transition-colors text-left" onClick={onClose}>
                      <div className="w-10 h-10 shrink-0">{g.src?<img src={g.src} alt={g.caption} className="w-full h-full object-cover rounded-lg"/>:<div className="w-full h-full rounded-lg flex items-center justify-center bg-[#f59e0b]/10 text-xl">📷</div>}</div>
                      <div><div className="font-bold text-gaming-text text-sm line-clamp-1">{g.caption||"Foto tanpa keterangan"}</div><div className="text-xs text-gaming-muted">{g.category}</div></div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
              {results.achievements.length>0 && (
                <div>
                  <div className="text-[10px] font-bold text-[#e11d48] uppercase tracking-widest mb-3 px-2">🏅 Pencapaian</div>
                  <div className="flex flex-col gap-1">
                  {results.achievements.map(a=>(
                    <button key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gaming-bg transition-colors text-left" onClick={onClose}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-2xl" style={{background:`${a.badge_color}15`}}>{a.badge_icon}</div>
                      <div><div className="font-bold text-gaming-text text-sm">{a.badge_name}</div><div className="text-xs text-gaming-muted">{a.member_name} · {a.category}</div></div>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gaming-border bg-gaming-bg/50 text-[10px] font-bold text-gaming-muted uppercase tracking-widest flex items-center justify-end gap-2">
          <span className="px-1.5 py-0.5 bg-gaming-card border border-gaming-border rounded">Esc</span> tutup
          <span className="text-gaming-border mx-1">|</span>
          <span className="px-1.5 py-0.5 bg-gaming-card border border-gaming-border rounded">Ctrl</span> + <span className="px-1.5 py-0.5 bg-gaming-card border border-gaming-border rounded">K</span> buka
        </div>
      </div>
    </div>
  );
}

/* ── Lightbox ── */
function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const [copied, setCopied] = useState(false);
  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")onClose();if(e.key==="ArrowLeft")onPrev();if(e.key==="ArrowRight")onNext();};
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[onClose,onPrev,onNext]);
  const item=items?.[index];
  if(!item) return null;
  const handleShare=async()=>{
    const text=`${item.caption||"Foto TMJ Community"} — ${window.location.href}`;
    if(navigator.share){try{await navigator.share({title:"TMJ Community",text:item.caption,url:window.location.href});}catch{}}
    else{await navigator.clipboard.writeText(text);setCopied(true);showToast("Link disalin!","success");setTimeout(()=>setCopied(false),2000);}
  };
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="relative flex flex-col items-center max-w-[90vw] max-h-[90vh]" onClick={e=>e.stopPropagation()}>
        {item.src?<img src={item.src} alt={item.caption} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"/>:
          <div className="w-[480px] max-w-[80vw] h-[320px] bg-gaming-card rounded-2xl flex flex-col items-center justify-center gap-3 text-gaming-muted shadow-2xl">
            <ImageOff size={48} className="opacity-50"/><span className="text-sm">Foto belum ditambahkan</span>
          </div>
        }
        {item.caption&&<div className="mt-4 px-6 py-2 bg-gaming-card/80 backdrop-blur-md text-gaming-text rounded-full text-sm font-medium shadow-lg max-w-full truncate">{item.caption}</div>}
        <div className="text-xs font-bold uppercase tracking-widest text-gaming-muted mt-2">{index+1} / {items.length}</div>
      </div>
      <div className="absolute top-6 right-20" onClick={e=>e.stopPropagation()}>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-colors ${copied?"bg-[#10b981] text-white":"bg-gaming-card/80 text-gaming-text hover:bg-gaming-card hover:text-gaming-neon backdrop-blur-md"}`} onClick={handleShare}>
          {copied?<><Check size={14}/>Disalin!</>:<><Share2 size={14}/>Bagikan</>}
        </button>
      </div>
      <button className="absolute top-6 right-6 p-2 bg-gaming-card/80 hover:bg-gaming-red text-gaming-text hover:text-white rounded-full backdrop-blur-md transition-colors" onClick={onClose}><X size={20}/></button>
      <button className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-gaming-card/50 hover:bg-gaming-card text-gaming-text hover:text-gaming-neon rounded-full backdrop-blur-md transition-all hover:scale-110" onClick={e=>{e.stopPropagation();onPrev();}}><ChevronLeft size={24}/></button>
      <button className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-gaming-card/50 hover:bg-gaming-card text-gaming-text hover:text-gaming-neon rounded-full backdrop-blur-md transition-all hover:scale-110" onClick={e=>{e.stopPropagation();onNext();}}><ChevronRight size={24}/></button>
    </div>
  );
}

/* ── 404 ── */
function NotFound({ onGoHome }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-screen bg-gaming-bg">
      <div className="text-8xl mb-6 animate-bounce">⚔️</div>
      <div className="font-display font-black text-8xl md:text-9xl text-gaming-neon mb-2">404</div>
      <div className="font-display font-bold text-2xl md:text-3xl text-gaming-text uppercase tracking-widest mb-4">Halaman Tidak Ditemukan</div>
      <p className="text-sm md:text-base text-gaming-muted max-w-md mb-10 leading-relaxed">Sepertinya halaman yang kamu cari tidak ada. Kembali ke base, trainer!</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={onGoHome} className="flex items-center justify-center gap-2 px-8 py-4 bg-gaming-accent text-white font-bold text-sm uppercase tracking-wider clip-angle-button hover:bg-gaming-neon transition-all shadow-glow-accent">
          <Home size={18}/>Kembali ke Home
        </button>
        <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 bg-[#5865f2] text-white font-bold text-sm uppercase tracking-wider clip-angle-button hover:bg-[#4752c4] transition-colors">
          <DiscordIcon size={18}/>Join Discord
        </a>
      </div>
    </div>
  );
}

/* ── Constants ── */
const SECTION_IDS = ["home","worlds","about","members","leaderboard","timeline","community","poll","blog","achievements","register","testimonials","faq","gallery"];
const NAV_ITEMS   = [
  ["home","Home"],["worlds","Worlds"],["about","Tentang"],["members","Anggota"],
  ["leaderboard","Hall of Fame"],["timeline","Sejarah"],
  ["community","Live"],["poll","Poll"],["blog","Artikel"],
  ["achievements","Badges"],["register","Daftar"],
  ["testimonials","Testimoni"],["faq","FAQ"],["gallery","Galeri"],
];
const MOB_NAV = [
  { id:"home",    label:"Home",    icon:<Home size={20}/> },
  { id:"worlds",  label:"Worlds",  icon:<Flame size={20}/> },
  { id:"community", label:"Live",  icon:<MessageSquare size={20}/> },
  { id:"gallery", label:"Galeri",  icon:<Image size={20}/> },
  { id:"register",label:"Daftar",  icon:<Trophy size={20}/> },
  { id:"faq",     label:"FAQ",     icon:<BookOpen size={20}/> },
];
const DESKTOP_SIDEBAR = [
  { id:"home", label:"Beranda", icon:<Home size={18}/> },
  { id:"worlds", label:"Worlds", icon:<Flame size={18}/> },
  { id:"community", label:"Live Chat", icon:<MessageSquare size={18}/> },
  { id:"members", label:"Anggota", icon:<Users2 size={18}/> },
  { id:"leaderboard", label:"Hall of Fame", icon:<BarChart2 size={18}/> },
  { id:"blog", label:"Update", icon:<BookMarked size={18}/> },
  { id:"gallery", label:"Galeri", icon:<Image size={18}/> },
  { id:"register", label:"Gabung", icon:<Calendar size={18}/> },
];
const HERO_SPOTLIGHTS = [
  {
    id: "worlds",
    eyebrow: "Universe Menu",
    title: "Pilih game yang sedang jadi fokus dan tampilkan masing-masing seperti dunia yang berbeda.",
    caption: "Buka Worlds TMJ",
    tone: "crimson",
    icon: <Flame size={18}/>,
  },
  {
    id: "leaderboard",
    eyebrow: "Featured Members",
    title: "Lihat siapa yang paling aktif, paling jago, dan paling sering bikin rame.",
    caption: "Buka Hall of Fame TMJ",
    tone: "electric",
    icon: <Trophy size={18}/>,
  },
];
const GAME_WORLDS = [
  {
    id: "umamusume",
    label: "Uma Musume",
    title: "Derby Ambition",
    desc: "Balapan, build support, dan diskusi menarik TAMA STAMINA.",
    meta: "Racing / Gacha / Theorycraft",
    accent: "#f4a0c0",
    image: "/bg_uma.png",
    character: "/worlds/tamamo-cross.png",
    emoji: "🏇",
  },
  {
    id: "mlbb",
    label: "Mobile Legends",
    title: "Land of Dawn",
    desc: "Buat mabar ranked, bahas meta hero, scrim kecil, dan cari party yang siap push bareng.",
    meta: "MOBA / Party Queue / Meta",
    accent: "#6fb6ff",
    image: "/worlds/layla-miss-hikari-art.jpg",
    character: null,
    emoji: "⚔️",
  },
  {
    id: "deltaforce",
    label: "Delta Force",
    title: "Frontline Operations",
    desc: "Untuk player yang suka callout cepat, rotasi taktis, dan update squad yang lebih intens.",
    meta: "FPS / Tactics / Squad",
    accent: "#73c6a1",
    image: "/bg_delta.png",
    character: "/worlds/tempest.png",
    emoji: "🎯",
  },
  {
    id: "hsr",
    label: "Honkai: Star Rail",
    title: "Astral Strategy Route",
    desc: "Bahas build relic, memory stages, banner planning, dan cerita yang lagi ramai di komunitas.",
    meta: "Turn-based RPG / Story / Builds",
    accent: "#d8bc84",
    image: "/bg_hsr.png",
    character: "/char_hsr.webp",
    emoji: "⭐",
  },
  {
    id: "freefire",
    label: "Free Fire",
    title: "Survival Drop Zone",
    desc: "Tempat cari squad cepat, custom room, dan sesi push yang santai tapi tetap kompetitif.",
    meta: "Battle Royale / Squad / Customs",
    accent: "#f29b6a",
    image: "/bg_ff.png",
    character: "/worlds/free-fire-alok.png",
    emoji: "🔥",
  },
];
const QUICK_START_STEPS = [
  {
    id: "discord",
    title: "Masuk Discord",
    desc: "Tempat utama buat cari party, update event, dan ngobrol harian.",
    cta: "Gabung Discord",
    href: CONFIG.discordLink,
    icon: <DiscordIcon size={18} />,
  },
  {
    id: "register",
    title: "Lengkapi Pendaftaran",
    desc: "Biar admin lebih gampang kenal kamu dan masukin ke circle yang cocok.",
    cta: "Isi Form",
    action: "register",
    icon: <CheckCircle2 size={18} />,
  },
  {
    id: "event",
    title: "Pantau Event",
    desc: "Cek jadwal mabar, turnamen, atau agenda komunitas yang lagi aktif.",
    cta: "Lihat Timeline",
    action: "timeline",
    icon: <Calendar size={18} />,
  },
];
const COMMUNITY_GUIDE = [
  {
    title: "Masuk dan perkenalan",
    desc: "Join Discord atau WhatsApp, lalu kasih intro singkat biar member lain gampang nyapa.",
    icon: <Users size={18} />,
  },
  {
    title: "Pilih circle dan game",
    desc: "Sebut game utama, jam main, dan role kamu supaya cepat ketemu party yang cocok.",
    icon: <Target size={18} />,
  },
  {
    title: "Ikut event atau mabar",
    desc: "Pantau timeline, voting, dan shoutbox. Biasanya koneksi paling cepat kebangun dari sini.",
    icon: <Trophy size={18} />,
  },
];
const COMMUNITY_RULES = [
  "Ada Ragnamok wajib join ygy bagi yang suka keributan.",
  "Kalau mau promosi, spam, atau share link sensitif, minta izin dulu.",
  "Masuk DC atau party kalo lagi ngumpul karena ada ilmu mahal dan ragnamok.",
];

/* ── MAIN APP ── */
function QuickStartSection({ go }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      {QUICK_START_STEPS.map((step, idx) => {
        const content = (
          <>
            <div className="w-12 h-12 rounded-xl bg-gaming-accent/20 border border-gaming-accent/50 flex items-center justify-center text-gaming-neon mb-4 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>
            <div className="font-display font-bold text-lg text-gaming-text mb-2 group-hover:text-gaming-cyan transition-colors">{step.title}</div>
            <p className="text-sm text-gaming-muted mb-6 flex-1">{step.desc}</p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gaming-neon group-hover:translate-x-2 transition-transform mt-auto">
              <span>{step.cta}</span>
              <ArrowRight size={15}/>
            </div>
          </>
        );

        const cardClass = "group flex flex-col p-6 bg-gaming-card/50 backdrop-blur-sm border border-gaming-border rounded-2xl hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] hover:border-gaming-neon/50 hover:bg-gaming-card transition-all duration-300 text-left reveal";

        if (step.href) {
          return (
            <a key={step.id} href={step.href} target="_blank" rel="noopener noreferrer" className={cardClass} style={{transitionDelay:`${idx*0.1}s`}}>
              {content}
            </a>
          );
        }

        return (
          <button key={step.id} className={cardClass} onClick={() => go(step.action)} style={{transitionDelay:`${idx*0.1}s`}}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

function CommunityGuideSection({ go }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-24">
      <div className="flex-1 flex flex-col justify-center">
        <div className="inline-block text-[10px] font-black text-gaming-cyan uppercase tracking-widest mb-4 bg-gaming-cyan/10 px-3 py-1 rounded border border-gaming-cyan/20 w-fit">Panduan Member Baru</div>
        <h3 className="font-display font-black text-3xl md:text-4xl text-gaming-text mb-6 uppercase text-glow">Mulai dari sini biar cepat nyambung ke komunitas.</h3>
        <p className="text-gaming-muted text-sm md:text-base leading-relaxed mb-8">Web ini sekarang bukan cuma etalase, tapi titik masuk komunitas. Jadi alurnya kami bikin sejelas mungkin untuk member baru.</p>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-gaming-accent text-white font-bold text-sm uppercase tracking-wider clip-angle-button hover:bg-gaming-neon transition-all shadow-glow-accent flex items-center gap-2" onClick={() => go("register")}><Trophy size={16}/> Mulai Daftar</button>
          <button className="px-6 py-3 bg-gaming-card/80 border border-gaming-border text-gaming-text font-bold text-sm uppercase tracking-wider hover:border-gaming-neon/50 hover:text-gaming-neon transition-all flex items-center gap-2" onClick={() => go("faq")}><BookOpen size={16}/> Baca FAQ</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {COMMUNITY_GUIDE.map((item, index) => (
            <div key={item.title} className="flex gap-4 p-4 bg-gaming-card/40 border border-gaming-border rounded-xl hover:border-gaming-neon/30 transition-colors">
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-gaming-muted mb-1">0{index + 1}</div>
                <div className="w-8 h-8 rounded-full bg-gaming-bg flex items-center justify-center text-gaming-cyan border border-gaming-border shadow-[0_0_10px_rgba(6,182,212,0.2)]">{item.icon}</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-gaming-text text-sm mb-1">{item.title}</div>
                <p className="text-xs text-gaming-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 bg-[#e11d48]/10 border border-[#e11d48]/30 rounded-xl">
          <div className="flex items-center gap-2 text-[#e11d48] font-bold text-sm uppercase tracking-wider mb-4">
            <BookOpen size={17}/>
            <span>Etika Cepat di TMJ</span>
          </div>
          <div className="flex flex-col gap-2">
            {COMMUNITY_RULES.map((rule) => (
              <div key={rule} className="flex items-start gap-2 text-xs text-gaming-text">
                <Check size={14} className="text-[#e11d48] shrink-0 mt-0.5"/>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorldsSection({ go, activeWorld, setActiveWorld }) {
  const current = GAME_WORLDS.find(world => world.id === activeWorld) || GAME_WORLDS[0];
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section id="worlds" className="py-24 bg-gaming-bg relative overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block text-[10px] font-semibold text-gaming-accent uppercase tracking-widest mb-3 bg-gaming-accent/10 px-3 py-1 rounded-full border border-gaming-accent/20">Game Worlds</div>
          <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text mb-4 leading-tight">
            Satu hub, banyak <span style={{color: current.accent}}>semesta game.</span>
          </h2>
          <p className="text-gaming-muted text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Tiap game punya komunitasnya sendiri, tapi semuanya terhubung dalam satu ekosistem TMJ.
          </p>
        </div>

        {/* World Card Preview — big image + info */}
        <div 
          className="relative rounded-2xl overflow-hidden shadow-2xl mb-10 parallax-container group/world" 
          style={{minHeight: 480, backgroundColor: '#080b14'}}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Layer (bergerak berlawanan arah dengan mouse) */}
          <div 
            className="absolute inset-[-2%] w-[104%] h-[104%] parallax-layer"
            style={{
              transform: `translate(${mousePos.x * -12}px, ${mousePos.y * -12}px) scale(1.01)`,
            }}
          >
            <img
              key={`bg-${current.id}`}
              src={current.image}
              alt={current.label}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 animate-[fadeIn_0.5s_ease_both]"
              style={{filter: "brightness(0.72) saturate(1.16) contrast(1.08)"}}
              onError={(e) => {
                e.currentTarget.src = "/WAHYU.jpg";
              }}
            />
          </div>
          
          {/* Accent tint overlay */}
          <div className="absolute inset-0 transition-all duration-700 pointer-events-none" style={{background: `linear-gradient(135deg, ${current.accent}22 0%, transparent 60%)`}}/>
          
          {/* Character Layer (bergerak searah dengan mouse & floating) */}
          {current.character && (
            <div 
              className={`world-character world-character-${current.id} parallax-layer`}
              style={{
                transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 30}px) scale(1)`,
              }}
            >
               <img 
                 key={`char-${current.id}`}
                 src={current.character} 
                 alt={`${current.label} character`}
                 className="world-character-img animate-[float-character_6s_ease-in-out_infinite] animate-[fadeIn_0.8s_ease_both]"
                 onError={(e) => {
                   e.currentTarget.style.display = "none";
                 }}
               />
            </div>
          )}

          {/* Dark gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-[6]"/>

          {/* Content overlay */}
          <div className="relative z-[10] flex flex-col justify-end p-8 md:p-12 pointer-events-none" style={{minHeight: 480}}>
            <div className="flex items-center gap-3 mb-3 pointer-events-auto">
              <span className="text-3xl">{current.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 border border-white/20 px-2 py-0.5 rounded-full">{current.label}</span>
            </div>
            <h3 className="font-display font-black text-3xl md:text-5xl text-white mb-3 leading-tight pointer-events-auto drop-shadow-lg">{current.title}</h3>
            <p className="text-white/80 text-sm md:text-base max-w-md md:max-w-xl mb-6 leading-relaxed pointer-events-auto drop-shadow-md backdrop-blur-[2px]">{current.desc}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pointer-events-auto">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{current.meta}</span>
              <button
                className="sm:ml-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold text-sm rounded-xl transition-transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                onClick={() => go("register")}
              >
                Masuk ke TMJ →
              </button>
            </div>
          </div>
        </div>

        {/* World selector pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {GAME_WORLDS.map((world, index) => (
            <button
              key={world.id}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all border ${
                activeWorld === world.id
                  ? "text-white border-transparent scale-105 shadow-lg"
                  : "bg-gaming-card border-gaming-border text-gaming-muted hover:text-gaming-text hover:border-gaming-accent/50"
              }`}
              style={activeWorld === world.id ? {backgroundColor: world.accent, borderColor: world.accent, boxShadow: `0 4px 20px ${world.accent}40`} : {}}
              onClick={() => setActiveWorld(world.id)}
            >
              <span className="text-lg">{world.emoji}</span>
              <span>{world.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [menu, setMenu]             = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [lbIdx, setLbIdx]           = useState(null);
  const [theme, toggleTheme]        = useTheme();
  const [annVisible, setAnnVisible] = useState(true);
  const [is404, setIs404]           = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeWorld, setActiveWorld] = useState(GAME_WORLDS[0].id);
  const [backTopVisible, scrollTop] = useBackToTop();
  const loadingVisible              = useLoadingScreen();
  const { data: galleryData }       = useGallery();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const activeSection               = useScrollSpy(SECTION_IDS);
  const scrollProgress              = useScrollProgress();
  const currentWorld                = GAME_WORLDS.find(world => world.id === activeWorld) || GAME_WORLDS[0];
  const worldVisual                 = galleryData?.find(item => {
    const bucket = `${item?.category || ""} ${item?.caption || ""}`.toLowerCase();
    return bucket.includes(currentWorld.id) || bucket.includes(currentWorld.label.toLowerCase());
  });
  const heroVisual                  = settings.hero_image_url || worldVisual?.image_url || worldVisual?.image || galleryData?.[0]?.image_url || galleryData?.[0]?.image || CONFIG.heroBg || "/WAHYU.jpg";

  useScrollReveal();
  useCardGlow();

  const { LogoIcon } = CONFIG;
  const annHeight = annVisible ? 36 : 0;

  // Maintenance — tunggu settings load, default false
  const isMaintenance = !settingsLoading && settings.maintenance_mode === "true";

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>20);
    window.addEventListener("scroll",fn,{passive:true});
    return ()=>window.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    document.body.style.overflow = lbIdx!==null||searchOpen ? "hidden" : "";
    return ()=>{ document.body.style.overflow=""; };
  },[lbIdx,searchOpen]);

  // Shortcut Ctrl+K
  useEffect(()=>{
    const fn=e=>{if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setSearchOpen(p=>!p);}};
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[]);

  const go = useCallback((id)=>{
    setMenu(false);
    const el=document.getElementById(id);
    if(!el) return;
    window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-(60+annHeight),behavior:"smooth"});
  },[annHeight]);

  const closeAnn = useCallback(()=>{
    setAnnVisible(false);
    sessionStorage.setItem("tmj-ann-closed","1");
  },[]);

  const prevLb = useCallback(()=>setLbIdx(i=>(i-1+galleryData?.length)%galleryData?.length),[galleryData]);
  const nextLb = useCallback(()=>setLbIdx(i=>(i+1)%galleryData?.length),[galleryData]);

  // Render maintenance SETELAH loading screen selesai
  if (isMaintenance) return <MaintenancePage message={settings.maintenance_message}/>;
  if (is404) return <NotFound onGoHome={()=>setIs404(false)}/>;

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-gaming-accent focus:text-white focus:px-4 focus:py-2 focus:z-[9999] focus:rounded">Skip ke konten</a>
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-gaming-neon to-gaming-cyan z-[9999] transition-all duration-100" style={{width:`${scrollProgress}%`}}/>

      {/* Loading screen — render duluan, tidak block halaman */}
      <LoadingScreen visible={loadingVisible}/>

      <ToastContainer/>
      <AnnouncementBar annVisible={annVisible} onClose={closeAnn}/>

      <div className="flex w-full min-h-screen overflow-hidden">
        <aside className={`hidden lg:flex flex-col bg-gaming-card border-r border-gaming-border fixed top-0 left-0 bottom-0 z-40 shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-72"}`}>
          <div className="flex items-center gap-3 px-5 py-6 border-b border-gaming-border/50 cursor-pointer hover:bg-gaming-bg/50 transition-colors" onClick={()=>go("home")} role="button" tabIndex={0}>
            <div className="w-10 h-10 rounded-xl bg-gaming-accent flex items-center justify-center shrink-0"><LogoIcon size={18} color="white"/></div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <div className="font-display font-black text-xl tracking-wider text-gaming-text uppercase leading-none">{CONFIG.logoText}</div>
                <div className="text-[10px] font-bold text-gaming-cyan uppercase tracking-widest mt-1">Community hub</div>
              </div>
            )}
          </div>

          <button className={`flex items-center gap-3 py-3 mx-4 mt-6 bg-gaming-bg/50 border border-gaming-border rounded-xl text-sm text-gaming-muted hover:border-gaming-accent/50 hover:text-gaming-text transition-all ${sidebarCollapsed ? "px-0 justify-center" : "px-4"}`} onClick={()=>setSearchOpen(true)} aria-label="Cari" title="Cari (Ctrl+K)">
            <Search size={16}/>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Cari...</span>
                <span className="text-[10px] border border-gaming-border px-1.5 py-0.5 rounded font-bold">Ctrl K</span>
              </>
            )}
          </button>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-thin scrollbar-thumb-gaming-border scrollbar-track-transparent">
            {DESKTOP_SIDEBAR.map(item=>(
              <button
                key={item.id}
                title={sidebarCollapsed ? item.label : undefined}
                className={`group w-full flex items-center gap-3 py-3 rounded-xl transition-all relative overflow-hidden ${sidebarCollapsed ? "px-0 justify-center" : "px-4"} ${activeSection===item.id?"bg-gaming-accent/10 text-gaming-accent border border-gaming-accent/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]":"text-gaming-muted hover:bg-gaming-bg hover:text-gaming-text border border-transparent"}`}
                onClick={()=>go(item.id)}
              >
                {activeSection===item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gaming-accent shadow-glow-accent animate-pulse"/>}
                <span className={`relative z-10 transition-transform group-hover:scale-110 ${activeSection===item.id?"text-gaming-accent":"text-gaming-muted"}`}>{item.icon}</span>
                {!sidebarCollapsed && <span className="relative z-10 font-bold text-xs uppercase tracking-wider whitespace-nowrap">{item.label}</span>}
              </button>
            ))}
          </div>

          <div className={`p-4 border-t border-gaming-border bg-gaming-card/50 ${sidebarCollapsed ? "flex flex-col items-center" : ""}`}>
            {!sidebarCollapsed && (
              <>
                <div className="text-[10px] font-bold text-gaming-accent uppercase tracking-widest mb-2">Open in TMJ</div>
                <p className="text-xs text-gaming-muted leading-relaxed mb-4">Masuk Discord untuk chat cepat, update event, dan mabar spontan.</p>
              </>
            )}
            <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" title={sidebarCollapsed ? "Join Discord" : undefined} className={`flex items-center justify-center gap-2 w-full py-3 bg-[#5865f2] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#4752c4] transition-colors ${sidebarCollapsed ? "px-0" : ""}`}>
              <DiscordIcon size={sidebarCollapsed ? 20 : 16}/>
              {!sidebarCollapsed && <span>Join Discord</span>}
            </a>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 w-full overflow-x-hidden ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
          {/* NAVBAR */}
          <nav className={`fixed top-0 left-0 right-0 z-50 h-16 px-6 lg:px-10 flex items-center justify-between transition-all duration-300 ${scrolled ? "bg-gaming-card/80 backdrop-blur-lg border-b border-gaming-border shadow-sm" : "bg-transparent"} ${sidebarCollapsed ? "lg:left-20" : "lg:left-72"}`} style={{top:annHeight}}>
            <div className="flex items-center gap-4">
              <button className="hidden lg:flex items-center justify-center p-2 text-gaming-muted hover:text-gaming-text hover:bg-gaming-bg rounded-lg transition-colors" onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} aria-label="Toggle Sidebar">
                <Menu size={20}/>
              </button>
              <div className="flex items-center gap-3 cursor-pointer group" onClick={()=>go("home")} role="button" tabIndex={0}>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gaming-accent flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-glow-accent"><LogoIcon size={18} color="white"/></div>
                <span className="font-display font-black text-lg lg:text-2xl tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-gaming-neon via-gaming-cyan to-gaming-accent group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all">{CONFIG.logoText}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <CommunityPulseBar/>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gaming-muted hover:text-gaming-cyan transition-colors" onClick={()=>setSearchOpen(true)} aria-label="Cari" title="Cari (Ctrl+K)">
                <Search size={18}/>
              </button>
              <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/50 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#25d366] hover:text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all"><WAIcon size={14}/>WhatsApp</a>
              <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/50 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#5865f2] hover:text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(88,101,242,0.4)] transition-all"><DiscordIcon size={14}/>Discord</a>
              <button
                className="relative w-10 h-10 rounded-xl bg-gaming-card border border-gaming-border flex items-center justify-center text-gaming-muted hover:text-gaming-accent hover:border-gaming-accent/50 hover:shadow-glow-accent transition-all overflow-hidden group/theme"
                onClick={toggleTheme}
                aria-label="Toggle tema"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <div className="absolute inset-0 bg-gaming-accent/10 opacity-0 group-hover/theme:opacity-100 transition-opacity"/>
                {theme === "dark" ? <Sun size={18} className="relative z-10 group-hover/theme:rotate-90 transition-transform duration-500"/> : <Moon size={18} className="relative z-10 group-hover/theme:-rotate-12 transition-transform duration-500"/>}
              </button>
            </div>
            <button className="md:hidden flex flex-col gap-1.5 p-2 text-gaming-text" onClick={()=>setMenu(!menu)} aria-label="Menu">
              <div className={`w-6 h-0.5 bg-current rounded-full transition-transform ${menu?"rotate-45 translate-y-2":""}`}/>
              <div className={`w-6 h-0.5 bg-current rounded-full transition-opacity ${menu?"opacity-0":""}`}/>
              <div className={`w-6 h-0.5 bg-current rounded-full transition-transform ${menu?"-rotate-45 -translate-y-2":""}`}/>
            </button>
          </nav>

          {menu && (
            <div className="fixed left-0 right-0 z-40 bg-gaming-card/95 backdrop-blur-xl border-b border-gaming-border p-6 flex flex-col gap-2 shadow-sm animate-[fadeIn_0.2s_ease]" style={{top:64+annHeight}}>
              {NAV_ITEMS.map(([id,l])=>(
                <button key={id} className={`text-left text-lg font-bold uppercase tracking-wider py-3 border-b border-gaming-border/50 ${activeSection===id?"text-gaming-neon":"text-gaming-muted hover:text-gaming-text"} transition-colors`} onClick={()=>go(id)}>{l}</button>
              ))}
              <div className="flex gap-4 mt-4">
                <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25d366]/20 text-[#25d366] border border-[#25d366]/50 rounded-lg text-sm font-bold uppercase transition-transform hover:scale-105"><WAIcon size={16}/>WhatsApp</a>
                <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/50 rounded-lg text-sm font-bold uppercase transition-transform hover:scale-105"><DiscordIcon size={16}/>Discord</a>
              </div>
            </div>
          )}

          <main id="main-content" className="flex-1 w-full flex flex-col relative">
        {/* HERO */}
        <section id="home" className="min-h-screen relative flex flex-col items-center justify-center text-center p-6 md:p-12 lg:p-24 overflow-hidden" style={{background:"#080b14",paddingTop:`${120+annHeight}px`}}>
          <HeroBg imageUrl={heroVisual}/>

          {/* Cinematic bottom fade into content */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{background:"linear-gradient(to bottom,transparent,#080b14)",zIndex:5}}/>

          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass-dark text-xs font-bold text-white/90 uppercase tracking-widest mb-10 animate-[fadeUp_0.5s_ease_both] shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{background:currentWorld.accent}}/>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{background:currentWorld.accent}}/>
              </span>
              {currentWorld.label} Universe Active
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-5xl sm:text-7xl md:text-[88px] text-white mb-6 leading-[0.9] tracking-tight uppercase drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)] animate-[fadeUp_0.6s_0.1s_ease_both]">
              <span className="block">Satu Komunitas.</span>
              <span className="block mt-2" style={{color: currentWorld.accent || "#818cf8", textShadow:`0 0 60px ${currentWorld.accent}60`}}>Banyak Dunia Game.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed mb-10 font-medium animate-[fadeUp_0.6s_0.2s_ease_both]">
              TMJ adalah hub utama para gamer — cari party, build strategi, ikuti raid, dan jadilah yang terbaik di leaderboard.
            </p>

            <CountdownTimer/>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-12 animate-[fadeUp_0.6s_0.3s_ease_both]">
              <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-7 py-3.5 bg-gaming-accent text-white font-bold text-sm rounded-xl transition-all duration-300 hover:scale-105 overflow-hidden"
                style={{boxShadow:"0 0 30px rgba(99,102,241,0.4), 0 4px 16px rgba(99,102,241,0.3)"}}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{background:"linear-gradient(135deg,rgba(255,255,255,0.15),transparent)"}}/>
                <DiscordIcon size={18}/> Buka Comms <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </a>
              <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-2 px-7 py-3.5 font-bold text-sm rounded-xl transition-all duration-300 hover:scale-105"
                style={{background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.4)",color:"#4ade80"}}>
                <WAIcon size={18}/> Masuk Intel
              </a>
            </div>

            {/* World switcher pills */}
            <div className="flex flex-wrap justify-center gap-2 animate-[fadeUp_0.6s_0.4s_ease_both]">
              {GAME_WORLDS.map(world => (
                <button
                  key={world.id}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 border ${
                    activeWorld===world.id
                      ? "text-white scale-105 shadow-lg"
                      : "text-white/60 border-white/15 hover:border-white/40 hover:text-white/90"
                  }`}
                  style={activeWorld===world.id
                    ? {backgroundColor:world.accent, borderColor:"transparent", boxShadow:`0 4px 20px ${world.accent}50`}
                    : {background:"rgba(255,255,255,0.06)"}}
                  onClick={() => setActiveWorld(world.id)}
                >
                  {world.emoji} {world.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <button className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 group" onClick={()=>go("about")} aria-label="Scroll down">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold group-hover:text-white/60 transition-colors">Scroll</span>
            <ChevronDown size={20} className="text-white/30 animate-bounce group-hover:text-white/60 transition-colors"/>
          </button>
        </section>

        <div className="sep w-full"/>

        <WorldsSection go={go} activeWorld={activeWorld} setActiveWorld={setActiveWorld}/>

        {/* ABOUT */}
        <section id="about" className="py-24 bg-gaming-bg relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <QuickStartSection go={go}/>
            <CommunityHubSection go={go}/>
            <CommunityGuideSection go={go}/>
            <div className="flex flex-col lg:flex-row gap-12 items-center mb-16">
              <div className="flex-1">
                <div className="inline-block text-[10px] font-black text-gaming-accent uppercase tracking-widest mb-4 bg-gaming-accent/10 px-3 py-1 rounded border border-gaming-accent/20 w-fit">Tentang Kami</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Bukan sekadar<br/><span style={{color:"var(--c-neon)"}}>komunitas game.</span></h2>
              </div>
              <div className="flex-1">
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed mb-4">TMJ adalah wadah berkumpulnya para gamer yang ingin berkembang bersama, membangun circle, dan menikmati mabar yang sehat.</p>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed">Dari mabar santai hingga turnamen kompetitif — semuanya ada di TMJ.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CONFIG.features.map((f,i)=>{ const Icon=f.icon; return (
                <div key={f.title} className="p-6 bg-gaming-card/40 border border-gaming-border rounded-2xl hover:bg-gaming-card hover:border-gaming-neon/50 transition-all shadow-lg group flex flex-col" style={{transitionDelay:`${i*0.1}s`}}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style={{background:`${f.color}20`,border:`1px solid ${f.color}40`}}><Icon size={24} style={{color:f.color}}/></div>
                  <div className="font-display font-bold text-lg text-gaming-text mb-3 group-hover:text-gaming-neon transition-colors">{f.title}</div>
                  <div className="text-sm text-gaming-muted leading-relaxed flex-1">{f.desc}</div>
                </div>
              ); })}
            </div>
          </div>
        </section>

        <div className="hr"/>

        {/* MEMBERS */}
        <section id="members" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="inline-block text-[10px] font-black text-gaming-cyan uppercase tracking-widest mb-4 bg-gaming-cyan/10 px-3 py-1 rounded border border-gaming-cyan/20 w-fit">Susunan Anggota</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Orang-orang di<br/><span style={{color:"var(--c-cyan)"}}>balik TMJ.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">Kenali tim yang menjaga komunitas ini tetap hidup setiap harinya.</p>
            </div>
            <MemberGrid/>
          </div>
        </section>

        <div className="hr"/>

        {/* LEADERBOARD */}
        <section id="leaderboard" className="py-24 bg-gaming-bg relative">
          <div className="section-soft-surface"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-12 text-center flex flex-col items-center">
              <div className="inline-block text-[10px] font-black text-[#f59e0b] uppercase tracking-widest mb-4 bg-[#f59e0b]/10 px-3 py-1 rounded border border-[#f59e0b]/20 w-fit">Hall of Fame</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Yang terbaik<br/><span style={{color:"#f59e0b"}}>di TMJ.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">Anggota dan juara terbaik yang telah menorehkan prestasi untuk komunitas TMJ.</p>
            </div>
            <LeaderboardSection/>
          </div>
        </section>

        <div className="hr"/>

        {/* TIMELINE */}
        <section id="timeline" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
              <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
                <div className="inline-block text-[10px] font-black text-gaming-accent uppercase tracking-widest mb-4 bg-gaming-accent/10 px-3 py-1 rounded border border-gaming-accent/20 w-fit">Sejarah Komunitas</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Perjalanan<br/><span style={{color:"var(--c-neon)"}}>TMJ.</span></h2>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed">Dari nol hingga komunitas gaming yang solid — jejak langkah TMJ dari hari pertama.</p>
              </div>
              <div className="lg:w-2/3">
                <TimelineSection/>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* COMMUNITY (Shoutbox + Counter) */}
        <section id="community" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
                <div className="inline-block text-[10px] font-black text-gaming-neon uppercase tracking-widest mb-4 bg-gaming-neon/10 px-3 py-1 rounded border border-gaming-neon/20 w-fit">Komunitas Live</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Ngobrol<br/><span style={{color:"var(--c-cyan)"}}>bareng TMJ.</span></h2>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed mb-8">Tinggalkan pesan, sapa anggota lain, atau sekadar bilang hai! Shoutbox ini real-time.</p>
                <div className="mb-4"><DiscordCounter/></div>
                <p className="text-xs text-gaming-muted/70 leading-relaxed">Angka di atas menunjukkan member Discord yang sedang online sekarang.</p>
              </div>
              <div className="lg:w-2/3">
                <ShoutboxSection/>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* POLL */}
        <section id="poll" className="py-24 bg-gaming-bg relative">
          <div className="section-soft-surface"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
                <div className="inline-block text-[10px] font-black text-[#10b981] uppercase tracking-widest mb-4 bg-[#10b981]/10 px-3 py-1 rounded border border-[#10b981]/20 w-fit">Suara Komunitas</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Pendapat<br/><span style={{color:"#10b981"}}>kamu penting.</span></h2>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed mb-6">Vote di poll yang sedang aktif dan lihat apa yang komunitas TMJ inginkan.</p>
                <p className="text-xs text-gaming-muted/70 leading-relaxed">Poll baru dibuat oleh admin TMJ secara berkala. Pantau terus untuk ikut vote!</p>
              </div>
              <div className="lg:w-2/3">
                <PollSection/>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* BLOG */}
        <section id="blog" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="inline-block text-[10px] font-black text-gaming-accent uppercase tracking-widest mb-4 bg-gaming-accent/10 px-3 py-1 rounded border border-gaming-accent/20 w-fit">Artikel & Update</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Berita dari<br/><span style={{color:"var(--c-accent)"}}>komunitas TMJ.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">Tips gaming, announcement event, dan update terbaru komunitas TMJ.</p>
            </div>
            <BlogSection/>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* ACHIEVEMENTS */}
        <section id="achievements" className="py-24 bg-gaming-bg relative">
          <div className="section-soft-surface"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-12 text-center flex flex-col items-center">
              <div className="inline-block text-[10px] font-black text-[#f59e0b] uppercase tracking-widest mb-4 bg-[#f59e0b]/10 px-3 py-1 rounded border border-[#f59e0b]/20 w-fit">Pencapaian</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Badge &<br/><span style={{color:"#f59e0b"}}>penghargaan.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">Rekam jejak pencapaian anggota TMJ. Setiap badge adalah bukti kontribusi nyata untuk komunitas.</p>
            </div>
            <AchievementsSection/>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* REGISTRATION */}
        <section id="register" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
                <div className="inline-block text-[10px] font-black text-gaming-cyan uppercase tracking-widest mb-4 bg-gaming-cyan/10 px-3 py-1 rounded border border-gaming-cyan/20 w-fit">Bergabung</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Daftar jadi<br/><span style={{color:"var(--c-cyan)"}}>anggota TMJ.</span></h2>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed mb-8">Isi form untuk mendaftar secara resmi. Tim kami akan menghubungimu setelah pendaftaran diterima.</p>
                <div className="flex gap-4 flex-wrap">
                  <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#5865f2] text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#4752c4] transition-colors"><DiscordIcon size={14}/>Discord</a>
                  <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#128C7E] transition-colors"><WAIcon size={14}/>WhatsApp</a>
                </div>
              </div>
              <div className="lg:w-2/3">
                <RegistrationForm/>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-24 bg-gaming-bg relative">
          <div className="section-soft-surface"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-12 text-center flex flex-col items-center">
              <div className="inline-block text-[10px] font-black text-gaming-neon uppercase tracking-widest mb-4 bg-gaming-neon/10 px-3 py-1 rounded border border-gaming-neon/20 w-fit">Testimoni</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Apa kata<br/><span style={{color:"var(--c-neon)"}}>anggota kami.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">Cerita nyata dari para gamer yang sudah bergabung bersama TMJ.</p>
            </div>
            <Testimonials/>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
              <div className="lg:w-1/3 lg:sticky lg:top-24 h-fit">
                <div className="inline-block text-[10px] font-black text-gaming-accent uppercase tracking-widest mb-4 bg-gaming-accent/10 px-3 py-1 rounded border border-gaming-accent/20 w-fit">FAQ</div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Ada<br/><span style={{color:"var(--c-accent)"}}>pertanyaan?</span></h2>
                <p className="text-sm md:text-base text-gaming-muted leading-relaxed mb-8">Pertanyaan yang paling sering ditanyakan oleh calon anggota baru TMJ.</p>
                <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gaming-card border border-[#5865f2]/50 text-[#5865f2] hover:bg-[#5865f2] hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors">
                  <DiscordIcon size={16}/>Tanya di Discord
                </a>
              </div>
              <div className="lg:w-2/3">
                <FAQAccordion/>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent w-full opacity-50"/>

        {/* GALLERY */}
        <section id="gallery" className="py-24 bg-gaming-bg">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="inline-block text-[10px] font-black text-gaming-cyan uppercase tracking-widest mb-4 bg-gaming-cyan/10 px-3 py-1 rounded border border-gaming-cyan/20 w-fit">Galeri Komunitas</div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-gaming-text uppercase leading-tight mb-4">Momen-momen<br/><span style={{color:"var(--c-cyan)"}}>bersama TMJ.</span></h2>
              <p className="text-sm md:text-base text-gaming-muted leading-relaxed max-w-2xl">YANG MAU MASUK SILAHKAN FACE REVEAL DULU.</p>
            </div>
            <Gallery onOpen={setLbIdx}/>
          </div>
        </section>

        {lbIdx!==null && galleryData && (
          <Lightbox items={galleryData} index={lbIdx} onClose={()=>setLbIdx(null)} onPrev={prevLb} onNext={nextLb}/>
        )}

        {/* CTA */}
        <div className="max-w-7xl mx-auto px-6" style={{paddingBottom:"clamp(80px,9vw,128px)"}}>
          <div className="relative p-10 md:p-16 rounded-3xl overflow-hidden bg-gaming-card/50 border border-gaming-border text-center shadow-[0_0_40px_rgba(139,92,246,0.15)] flex flex-col items-center group">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gaming-accent/20 via-transparent to-gaming-neon/20 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)] animate-pulse-fast pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-[10px] font-black uppercase tracking-widest mb-6 px-3 py-1.5 bg-gaming-bg rounded border border-gaming-border text-gaming-muted inline-block">Bergabung Sekarang</div>
              <h2 className="font-display font-black text-4xl md:text-6xl text-gaming-text uppercase mb-6 leading-tight">Siap jadi bagian<br/>dari <span style={{color:"var(--c-accent)"}}>TMJ?</span></h2>
              <p className="text-gaming-muted text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed">Mulai perjalananmu hari ini. Masuk ke Discord untuk chat, atau gabung grup WhatsApp untuk info turnamen terupdate.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-8 py-4 bg-[#5865f2] text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#4752c4] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(88,101,242,0.6)] group/btn">
                  <DiscordIcon size={18} className="group-hover/btn:animate-[spin-slow_3s_linear_infinite]" /> Join Discord <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform"/>
                </a>
                <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-8 py-4 bg-gaming-card border border-gaming-border text-gaming-text font-bold text-sm uppercase tracking-wider rounded-xl hover:border-[#25D366]/50 hover:text-[#25D366] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(37,211,102,0.2)] group/btn">
                  <WAIcon size={18} className="group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 transition-transform" /> Join WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gaming-border bg-gaming-bg mt-auto py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-8 text-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gaming-accent flex items-center justify-center shadow-glow-accent">
              <LogoIcon size={20} color="white"/>
            </div>
            <span className="font-display font-black text-2xl text-gaming-text tracking-widest">{CONFIG.logoText}</span>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gaming-card/50 border border-gaming-border text-gaming-muted hover:text-[#5865f2] hover:border-[#5865f2]/50 transition-colors">
                <DiscordIcon size={20}/>
              </a>
              <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-gaming-card/50 border border-gaming-border text-gaming-muted hover:text-[#25D366] hover:border-[#25D366]/50 transition-colors">
                <WAIcon size={20}/>
              </a>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
              {NAV_ITEMS.map(([id,l])=>(
                <button key={id} onClick={()=>go(id)} className="text-xs font-bold uppercase tracking-wider text-gaming-muted hover:text-gaming-cyan transition-colors">{l}</button>
              ))}
            </div>
          </div>
          <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gaming-border to-transparent opacity-50"/>
          <span className="text-xs text-gaming-muted/60 font-medium">© 2026 {CONFIG.logoText} Community. All rights reserved.</span>
        </div>
      </footer>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[200] bg-gaming-bg/90 backdrop-blur-xl border-t border-gaming-border lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 px-2">
          {MOB_NAV.map(item=>(
            <button key={item.id} className={`flex flex-col items-center justify-center w-14 h-full relative transition-colors ${activeSection===item.id?"text-gaming-neon":"text-gaming-muted hover:text-gaming-text"}`} onClick={()=>go(item.id)}>
              {activeSection===item.id && <div className="absolute top-0 w-8 h-1 rounded-b bg-gaming-neon shadow-glow-accent"/>}
              <span className={`mb-1 transition-transform ${activeSection===item.id?"-translate-y-1":""}`}>{item.icon}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity ${activeSection===item.id?"opacity-100":"opacity-50"}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <button className={`fixed right-6 bottom-[88px] lg:bottom-6 w-12 h-12 rounded-xl bg-gaming-accent/90 backdrop-blur text-white flex items-center justify-center shadow-glow-accent border border-gaming-accent/50 transition-all z-[200] ${backTopVisible?"translate-y-0 opacity-100":"translate-y-10 opacity-0 pointer-events-none hover:scale-110"}`} onClick={scrollTop} aria-label="Kembali ke atas">
        <ChevronUp size={24}/>
      </button>

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={()=>setSearchOpen(false)}/>
    </>
  );
}
