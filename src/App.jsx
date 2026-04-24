import { useState, useEffect, useCallback, useRef } from "react";
import {
  Swords, Users, Target, Flame, Zap,
  ChevronDown, ChevronUp, ArrowRight,
  X, ChevronLeft, ChevronRight,
  ImageOff, Sun, Moon, Plus,
  Loader2, CheckCircle2, Send,
  Search, Clock, Home, Users2,
  Trophy, BookOpen, Image, Share2, Copy, Check,
} from "lucide-react";
import "./App.css";
import {
  useMembers, useGallery, useTestimonials,
  useAnnouncement, useNextEvent, submitRegistration,
  useLeaderboard, useTimeline, useRules,
} from "./hooks/useSupabase";

// ============================================================
const CONFIG = {
  siteUrl:      "https://tmj-community.com",
  discordLink:  "https://discord.gg/FCFKZRKnP2",
  whatsappLink: "https://chat.whatsapp.com/F372r0xbKdS51qvzn3xEaY",
  logoText:     "TMJ",
  LogoIcon:     Swords,
  heroBg:       null,
  heroVideo:    null,

  stats: [
    { val: "500+", label: "Anggota Aktif" },
    { val: "50+",  label: "Event per Bulan" },
    { val: "24/7", label: "Server Online" },
  ],

  features: [
    { icon: Users,  title: "Komunitas Solid",  desc: "Ratusan gamer aktif yang saling mendukung dan berkembang bersama setiap hari.",     color: "#6366f1" },
    { icon: Target, title: "Berbagi Strategi", desc: "Diskusi meta, tips, dan trik dari trainer berpengalaman di channel khusus.",         color: "#8b5cf6" },
    { icon: Flame,  title: "Mabar Kompetitif", desc: "Jadwal mabar rutin, turnamen internal, dan event seru setiap minggu.",              color: "#f97316" },
    { icon: Zap,    title: "Respons Cepat",    desc: "Server aktif 24/7 — temukan teman main kapan saja, di mana saja.",                 color: "#0ea5e9" },
  ],

  faqs: [
    { q: "Bagaimana cara bergabung dengan komunitas TMJ?",  a: "Klik tombol 'Gabung Discord' atau 'Join WhatsApp' di halaman ini, lalu ikuti instruksi yang ada di server. Bergabung 100% gratis!" },
    { q: "Apakah ada syarat khusus untuk bergabung?",      a: "Tidak ada syarat khusus. Semua gamer dari berbagai level dan game welcome di TMJ. Yang penting semangat bermain dan menghargai sesama anggota." },
    { q: "Game apa saja yang dimainkan di TMJ?",           a: "TMJ tidak terbatas pada satu game. Anggota kami bermain berbagai genre mulai dari MOBA, FPS, RPG, hingga mobile games." },
    { q: "Seberapa sering event mabar diadakan?",          a: "Event mabar diadakan minimal 2-3 kali per minggu. Selain itu ada turnamen internal bulanan dan event khusus di hari-hari tertentu." },
    { q: "Bagaimana cara naik pangkat di komunitas TMJ?",  a: "Pangkat diberikan berdasarkan keaktifan di server, kontribusi positif, dan partisipasi dalam event komunitas." },
    { q: "Apakah ada aturan yang harus ditaati?",         a: "Ya, kami punya aturan dasar: no toxic, no spam, saling menghargai. Detail lengkap ada di channel #rules di Discord." },
  ],

  galleryCategories:     ["Semua", "Event", "Mabar", "Turnamen", "Gathering"],
  leaderboardCategories: ["Semua", "Turnamen", "Mabar", "Komunitas"],
  rulesCategories:       ["Semua", "Umum", "Mabar", "Sanksi"],

  loadingScreen: { active: true, duration: 1600 },
  customCursor:  { active: true },
};
// ============================================================

/* ── Toast ── */
let toastId = 0;
const toastListeners = new Set();
export function showToast(message, type = "default", duration = 3000) {
  const id = ++toastId;
  toastListeners.forEach(fn => fn({ id, message, type, duration }));
}
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), toast.duration);
    };
    toastListeners.add(handler);
    return () => toastListeners.delete(handler);
  }, []);
  const icons = { success:"✓", error:"✕", info:"ℹ", default:"•" };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type !== "default" ? t.type : ""}`}>
          <span style={{ fontSize:16, lineHeight:1 }}>{icons[t.type]||"•"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
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
  const toggle = useCallback(() => setTheme(t => t === "light" ? "dark" : "light"), []);
  return [theme, toggle];
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Scroll Spy — track section aktif
function useScrollSpy(sectionIds) {
  const [activeId, setActiveId] = useState(sectionIds[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds]);
  return activeId;
}

// Scroll progress bar
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return progress;
}

function useCountdown(targetDate) {
  const calc = useCallback(() => {
    if (!targetDate) return { days:0, hours:0, minutes:0, seconds:0, done:true };
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days:0, hours:0, minutes:0, seconds:0, done:true };
    return {
      days:    Math.floor(diff / (1000*60*60*24)),
      hours:   Math.floor((diff / (1000*60*60)) % 24),
      minutes: Math.floor((diff / (1000*60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      done: false,
    };
  }, [targetDate]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
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

function useCustomCursor() {
  useEffect(() => {
    if (!CONFIG.customCursor.active) return;
    const ring = document.querySelector(".cursor-ring");
    const dot  = document.querySelector(".cursor-dot");
    if (!ring || !dot) return;
    let mx=0, my=0, rx=0, ry=0, raf;
    const onMove = e => { mx=e.clientX; my=e.clientY; dot.style.left=`${mx}px`; dot.style.top=`${my}px`; };
    const lerp = (a,b,t) => a+(b-a)*t;
    const animate = () => { rx=lerp(rx,mx,0.13); ry=lerp(ry,my,0.13); ring.style.left=`${rx}px`; ring.style.top=`${ry}px`; raf=requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    const onEnter = () => document.body.classList.add("cursor-hover");
    const onLeave = () => document.body.classList.remove("cursor-hover");
    const onDown  = () => document.body.classList.add("cursor-click");
    const onUp    = () => document.body.classList.remove("cursor-click");
    const targets = document.querySelectorAll("a,button,[role='button'],.gallery-tile,.member-card,.testi-card,.lb-card,.rule-card");
    targets.forEach(el => { el.addEventListener("mouseenter",onEnter); el.addEventListener("mouseleave",onLeave); });
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mousedown",onDown);
      window.removeEventListener("mouseup",onUp);
      targets.forEach(el => { el.removeEventListener("mouseenter",onEnter); el.removeEventListener("mouseleave",onLeave); });
    };
  }, []);
}

function useBackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const scrollTop = useCallback(() => window.scrollTo({ top:0, behavior:"smooth" }), []);
  return [visible, scrollTop];
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
  return <div className="img-loading" style={{ width, height, borderRadius:radius, flexShrink:0, ...style }}/>;
}

/* ── Sub-components ── */
function AnnouncementBar({ annVisible, onClose }) {
  const { data } = useAnnouncement();
  const ann = data?.[0];
  if (!ann || !annVisible) return null;
  return (
    <div className={`ann-bar ${annVisible?"":"hidden"}`}>
      <span>{ann.text}</span>
      {ann.cta && <a href={ann.link} target="_blank" rel="noopener noreferrer" className="ann-link">{ann.cta}</a>}
      <button className="ann-close" onClick={onClose}><X size={14}/></button>
    </div>
  );
}

function CountdownTimer() {
  const { data: event, loading } = useNextEvent();
  const time = useCountdown(event?.event_date);
  if (loading) return <div style={{ marginBottom:44, textAlign:"center" }}><Skeleton width={320} height={80} style={{ margin:"0 auto" }}/></div>;
  if (!event) return null;
  const pad = n => String(n).padStart(2,"0");
  const cells = [
    { val:pad(time.days), label:"Hari" },{ val:pad(time.hours), label:"Jam" },
    { val:pad(time.minutes), label:"Menit" },{ val:pad(time.seconds), label:"Detik" },
  ];
  return (
    <div className="fu d3" style={{ marginBottom:44 }}>
      <div className="cd-event-label">{event.title}</div>
      {time.done ? (
        <div style={{ textAlign:"center", fontSize:15, color:"var(--muted)", fontWeight:500 }}>🎉 Event sudah dimulai!</div>
      ) : (
        <div className="countdown-wrap">
          {cells.map((c,i) => (
            <>
              <div key={c.label} className="cd-cell">
                <div className="cd-num sora">{c.val}</div>
                <div className="cd-label">{c.label}</div>
              </div>
              {i < 3 && <div key={`sep-${i}`} className="cd-sep">:</div>}
            </>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberGrid() {
  const { data: members, loading, error } = useMembers();
  if (loading) return (
    <div className="member-grid">
      {[1,2,3,4].map(i => (
        <div key={i} className="member-card">
          <Skeleton width={50} height={50} radius={12} style={{ marginBottom:14 }}/>
          <Skeleton width="60%" height={18} style={{ marginBottom:8 }}/>
          <Skeleton width="40%" height={14} style={{ marginBottom:14 }}/>
          <Skeleton width="100%" height={1} style={{ marginBottom:12 }}/>
          <Skeleton width="100%" height={56} radius={6}/>
        </div>
      ))}
    </div>
  );
  if (error) return <p style={{ color:"var(--muted)", textAlign:"center" }}>Gagal memuat data anggota.</p>;
  return (
    <div className="member-grid">
      {members?.map((m,i) => (
        <div key={m.id} className={`member-card reveal rd${(i%4)+1}`}>
          <div className="m-avatar" style={{ background:`${m.color}12`, border:`1px solid ${m.color}22` }}>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, color:m.color }}>{m.avatar}</span>
          </div>
          <div className="m-name">{m.name}</div>
          <div className="m-role" style={{ background:`${m.color}10`, color:m.color, border:`1px solid ${m.color}25` }}>{m.role}</div>
          <div className="m-hr"/>
          <div className="m-desc">{m.description}</div>
        </div>
      ))}
    </div>
  );
}

function Testimonials() {
  const { data: items, loading } = useTestimonials();
  if (loading) return (
    <div className="testi-grid">
      {[1,2,3,4].map(i => (
        <div key={i} className="testi-card">
          <Skeleton width={32} height={32} radius={4} style={{ marginBottom:12 }}/>
          <Skeleton width="100%" height={80} radius={6} style={{ marginBottom:12 }}/>
          <Skeleton width="30%" height={14} style={{ marginBottom:16 }}/>
          <Skeleton width="100%" height={1}/>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <Skeleton width={38} height={38} radius={10}/>
            <div style={{ flex:1 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom:6 }}/>
              <Skeleton width="40%" height={12}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="testi-grid">
      {items?.map((t,i) => (
        <div key={t.id} className={`testi-card reveal rd${(i%4)+1}`}>
          <div className="testi-quote">"</div>
          <p className="testi-text">{t.text}</p>
          <div className="testi-stars">{Array.from({length:t.stars}).map((_,j) => <span key={j} className="testi-star">★</span>)}</div>
          <div className="testi-author">
            <div className="testi-avatar" style={{ background:`${t.color}14`, border:`1px solid ${t.color}25` }}>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:12, color:t.color }}>{t.avatar}</span>
            </div>
            <div>
              <div className="testi-name">{t.name}</div>
              <div className="testi-role">{t.role}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Gallery + Search + Filter
function Gallery({ onOpen }) {
  const { data: items, loading } = useGallery();
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const filtered = items?.filter(g => {
    const matchCat = activeFilter === "Semua" || g.category === activeFilter;
    const matchSearch = !search || g.caption?.toLowerCase().includes(search.toLowerCase()) || g.category?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  if (loading) return (
    <div className="gallery-grid-wrap">
      {[1,2,3,4,5,6].map(i => <Skeleton key={i} width="100%" height={220} radius={16}/>)}
    </div>
  );
  return (
    <>
      <div className="gallery-search-wrap">
        <Search size={16} className="gallery-search-icon"/>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari foto..." className="gallery-search"/>
        {search && <button className="gallery-search-clear" onClick={() => setSearch("")}><X size={14}/></button>}
      </div>
      <div className="gallery-filters">
        {CONFIG.galleryCategories.map(cat => (
          <button key={cat} className={`filter-btn ${activeFilter===cat?"active":""}`} onClick={() => setActiveFilter(cat)}>{cat}</button>
        ))}
      </div>
      {(search || activeFilter !== "Semua") && (
        <div className="gallery-count">Menampilkan {filtered?.length||0} dari {items?.length||0} foto</div>
      )}
      <div className="gallery-grid-wrap">
        {!filtered?.length ? (
          <div className="gallery-empty">
            <ImageOff size={32} style={{ margin:"0 auto 12px", opacity:.35 }}/>
            <p style={{ fontSize:14 }}>{search ? `Tidak ada foto cocok dengan "${search}"` : "Belum ada foto di kategori ini."}</p>
          </div>
        ) : filtered.map((item,i) => {
          const originalIdx = items.indexOf(item);
          return (
            <div key={item.id} className={`gallery-tile reveal rd${(i%6)+1}`}
              onClick={() => onOpen(originalIdx)}
              role="button" tabIndex={0} aria-label={item.caption||"Lihat foto"}
              onKeyDown={e => e.key==="Enter" && onOpen(originalIdx)}
            >
              {item.src
                ? <><img src={item.src} alt={item.caption} loading="lazy"/><div className="gallery-tile-tag">{item.category}</div><div className="gallery-tile-caption">{item.caption}</div></>
                : <div className="gallery-placeholder"><ImageOff size={26}/><span>{item.caption||"Foto belum ditambahkan"}</span></div>
              }
            </div>
          );
        })}
      </div>
    </>
  );
}

function LeaderboardSection() {
  const { data: items, loading } = useLeaderboard();
  const [activeTab, setActiveTab] = useState("Semua");
  const filtered = activeTab === "Semua" ? items : items?.filter(i => i.category === activeTab);
  return (
    <>
      <div className="lb-tabs">
        {CONFIG.leaderboardCategories.map(cat => (
          <button key={cat} className={`lb-tab ${activeTab===cat?"active":""}`} onClick={() => setActiveTab(cat)}>{cat}</button>
        ))}
      </div>
      {loading ? (
        <div className="lb-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="lb-card"><Skeleton width={52} height={52} radius={14} style={{ marginBottom:14 }}/><Skeleton width="60%" height={18} style={{ marginBottom:8 }}/><Skeleton width="40%" height={14} style={{ marginBottom:14 }}/><Skeleton width="100%" height={1} style={{ marginBottom:10 }}/><Skeleton width="100%" height={48} radius={6}/></div>)}</div>
      ) : (
        <div className="lb-grid">
          {filtered?.map((item,i) => (
            <div key={item.id} className={`lb-card reveal rd${(i%6)+1}`} style={{ borderTop:`3px solid ${item.color}` }}>
              <div className="lb-rank-badge">{item.badge}</div>
              <div className="lb-avatar" style={{ background:`${item.color}12`, border:`1px solid ${item.color}22` }}>
                <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:item.color }}>{item.avatar}</span>
              </div>
              <div className="lb-name">{item.name}</div>
              <div className="lb-title" style={{ background:`${item.color}10`, color:item.color, border:`1px solid ${item.color}25` }}>{item.title}</div>
              <div className="lb-season"><Clock size={11} style={{ display:"inline", marginRight:4, verticalAlign:"middle" }}/>{item.season}</div>
              <div className="lb-divider"/>
              <div className="lb-desc">{item.description}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function TimelineSection() {
  const { data: items, loading } = useTimeline();
  if (loading) return (
    <div className="timeline-wrap">
      {[1,2,3,4].map(i => (
        <div key={i} className="timeline-item" style={{ display:"flex", gap:16, paddingBottom:32 }}>
          <Skeleton width={40} height={40} radius={10} style={{ flexShrink:0 }}/>
          <div style={{ flex:1 }}><Skeleton width="30%" height={12} style={{ marginBottom:8 }}/><Skeleton width="70%" height={18} style={{ marginBottom:8 }}/><Skeleton width="100%" height={40} radius={6}/></div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="timeline-wrap">
      {items?.map((item,i) => (
        <div key={item.id} className={`timeline-item reveal rd${(i%6)+1}`}>
          <div className="timeline-dot" style={{ background:item.color, boxShadow:`0 0 0 2px ${item.color}` }}/>
          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div className="timeline-icon-wrap" style={{ background:`${item.color}12` }}><span>{item.icon}</span></div>
            <div style={{ flex:1 }}>
              <div className="timeline-date">{item.date}</div>
              <div className="timeline-title">{item.title}</div>
              <div className="timeline-desc">{item.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Peraturan dari Supabase
function RulesSection() {
  const { data: items, loading } = useRules();
  const [activeTab, setActiveTab] = useState("Semua");
  const filtered = activeTab === "Semua" ? items : items?.filter(r => r.category === activeTab);
  return (
    <>
      <div className="rules-tabs">
        {CONFIG.rulesCategories.map(cat => (
          <button key={cat} className={`rules-tab ${activeTab===cat?"active":""}`} onClick={() => setActiveTab(cat)}>{cat}</button>
        ))}
      </div>
      {loading ? (
        <div className="rules-grid">{[1,2,3,4].map(i => <div key={i} className="rule-card"><Skeleton width={42} height={42} radius={11} style={{ flexShrink:0 }}/><div style={{ flex:1 }}><Skeleton width="60%" height={16} style={{ marginBottom:8 }}/><Skeleton width="100%" height={48} radius={6}/></div></div>)}</div>
      ) : (
        <div className="rules-grid">
          {filtered?.map((rule,i) => (
            <div key={rule.id} className={`rule-card reveal rd${(i%4)+1}`}>
              <div className="rule-icon-wrap" style={{ background:`${rule.color}12` }}>
                <span>{rule.icon}</span>
              </div>
              <div style={{ flex:1 }}>
                <div className="rule-title">{rule.title}</div>
                <div className="rule-desc">{rule.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="faq-list">
      {CONFIG.faqs.map((faq,i) => (
        <div key={i} className="faq-item">
          <button className="faq-trigger" onClick={() => setOpenIdx(p=>p===i?null:i)} aria-expanded={openIdx===i}>
            <span className="faq-q">{faq.q}</span>
            <div className={`faq-icon ${openIdx===i?"open":""}`}><Plus size={14}/></div>
          </button>
          <div className={`faq-body ${openIdx===i?"open":""}`}>
            <p className="faq-answer">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RegistrationForm() {
  const [form, setForm] = useState({ full_name:"", discord_username:"", whatsapp:"", game_interest:"", message:"" });
  const [status, setStatus] = useState(null);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setStatus("loading");
    try {
      await submitRegistration(form);
      setStatus("success");
      setForm({ full_name:"", discord_username:"", whatsapp:"", game_interest:"", message:"" });
      showToast("Pendaftaran berhasil dikirim! 🎉", "success");
    } catch {
      setStatus("error");
      showToast("Gagal mengirim. Coba lagi.", "error");
    }
  };
  const inputStyle = { width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--bg)", color:"var(--text)", fontFamily:"'Inter',sans-serif", fontSize:14, outline:"none", transition:"border-color .2s, box-shadow .2s" };
  const labelStyle = { fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6, display:"block" };
  const onFocus = e => { e.target.style.borderColor="var(--accent)"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.1)"; };
  const onBlur  = e => { e.target.style.borderColor="var(--border2)"; e.target.style.boxShadow="none"; };
  if (status === "success") return (
    <div style={{ textAlign:"center", padding:"48px 24px" }}>
      <CheckCircle2 size={48} color="#10b981" style={{ margin:"0 auto 16px" }}/>
      <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:22, color:"var(--text)", marginBottom:8 }}>Pendaftaran Terkirim!</h3>
      <p style={{ color:"var(--muted)", fontSize:15, lineHeight:1.7 }}>Tim TMJ akan menghubungimu melalui Discord atau WhatsApp.</p>
      <button onClick={() => setStatus(null)} className="btn btn-primary" style={{ marginTop:24, padding:"11px 24px", borderRadius:999, fontSize:14, fontWeight:600 }}>Daftar Lagi</button>
    </div>
  );
  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div><label style={labelStyle}>Nama Lengkap <span style={{ color:"#ef4444" }}>*</span></label><input name="full_name" value={form.full_name} onChange={handle} placeholder="Nama kamu" style={inputStyle} required onFocus={onFocus} onBlur={onBlur}/></div>
        <div><label style={labelStyle}>Username Discord</label><input name="discord_username" value={form.discord_username} onChange={handle} placeholder="username" style={inputStyle} onFocus={onFocus} onBlur={onBlur}/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div><label style={labelStyle}>Nomor WhatsApp</label><input name="whatsapp" value={form.whatsapp} onChange={handle} placeholder="08xxxxxxxxxx" style={inputStyle} onFocus={onFocus} onBlur={onBlur}/></div>
        <div><label style={labelStyle}>Game Favorit</label><input name="game_interest" value={form.game_interest} onChange={handle} placeholder="Mobile Legends, PUBG..." style={inputStyle} onFocus={onFocus} onBlur={onBlur}/></div>
      </div>
      <div><label style={labelStyle}>Pesan / Alasan Bergabung</label><textarea name="message" value={form.message} onChange={handle} rows={4} placeholder="Ceritakan sedikit tentang kamu..." style={{ ...inputStyle, resize:"vertical", minHeight:100 }} onFocus={onFocus} onBlur={onBlur}/></div>
      <button type="submit" disabled={status==="loading"} className="btn btn-primary" style={{ padding:"13px 28px", fontSize:15, fontWeight:600, borderRadius:999, justifyContent:"center", opacity:status==="loading"?.7:1 }}>
        {status==="loading" ? <><Loader2 size={17} style={{ animation:"spin 1s linear infinite" }}/>Mengirim...</> : <><Send size={17}/>Kirim Pendaftaran</>}
      </button>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </form>
  );
}

function LoadingScreen({ visible }) {
  const LogoIcon = CONFIG.LogoIcon;
  return (
    <div className={`loader-wrap ${visible?"":"out"}`} aria-hidden={!visible}>
      <div className="loader-logo-box"><LogoIcon size={26} color="white"/></div>
      <div className="loader-text sora">{CONFIG.logoText}</div>
      <div className="loader-bar-wrap"><div className="loader-bar"/></div>
      <div className="loader-sub">Loading komunitas...</div>
    </div>
  );
}

function HeroBg() {
  const videoRef = useRef(null);
  useEffect(() => { videoRef.current?.play().catch(()=>{}); }, []);
  if (CONFIG.heroVideo) return <div className="hero-video"><video ref={videoRef} src={CONFIG.heroVideo} autoPlay muted loop playsInline preload="metadata"/></div>;
  if (CONFIG.heroBg)   return <div className="hero-photo" style={{ backgroundImage:`url(${CONFIG.heroBg})` }}/>;
  return <div className="hero-grid"/>;
}

// Lightbox + Share button
function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fn = e => {
      if (e.key==="Escape") onClose();
      if (e.key==="ArrowLeft") onPrev();
      if (e.key==="ArrowRight") onNext();
    };
    window.addEventListener("keydown",fn);
    return () => window.removeEventListener("keydown",fn);
  }, [onClose,onPrev,onNext]);

  const item = items?.[index];
  if (!item) return null;

  const handleShare = async () => {
    const text = `${item.caption || "Foto TMJ Community"} — ${window.location.href}`;
    if (navigator.share) {
      try { await navigator.share({ title:"TMJ Community", text: item.caption, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Link disalin ke clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lb-inner" onClick={e=>e.stopPropagation()}>
        {item.src
          ? <img src={item.src} alt={item.caption} className="lb-img"/>
          : <div style={{ width:480, maxWidth:"80vw", height:320, background:"var(--bg3)", borderRadius:"var(--radius)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"var(--muted)" }}><ImageOff size={36}/><span style={{ fontSize:14 }}>Foto belum ditambahkan</span></div>
        }
        {item.caption && <div className="lb-caption">{item.caption}</div>}
        <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{index+1} / {items.length}</div>
      </div>

      {/* Share button */}
      <div className="lb-share" onClick={e=>e.stopPropagation()}>
        <button className={`lb-share-btn ${copied?"copied":""}`} onClick={handleShare}>
          {copied ? <><Check size={14}/>Disalin!</> : <><Share2 size={14}/>Bagikan</>}
        </button>
      </div>

      <button className="lb-close" onClick={onClose}><X size={16}/></button>
      <button className="lb-arrow lb-prev" onClick={e=>{e.stopPropagation();onPrev();}}><ChevronLeft size={20}/></button>
      <button className="lb-arrow lb-next" onClick={e=>{e.stopPropagation();onNext();}}><ChevronRight size={20}/></button>
    </div>
  );
}

// 404 Page
function NotFound({ onGoHome }) {
  return (
    <div className="page-404">
      <div className="err-emoji">⚔️</div>
      <div className="err-code">404</div>
      <div className="err-title">Halaman Tidak Ditemukan</div>
      <div className="err-sub">
        Sepertinya halaman yang kamu cari sudah pindah server atau tidak pernah ada. Kembali ke base, trainer!
      </div>
      <div className="err-actions">
        <button onClick={onGoHome} className="btn btn-primary" style={{ padding:"13px 28px", fontSize:15, fontWeight:600, borderRadius:999 }}>
          <Home size={17}/>Kembali ke Home
        </button>
        <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ padding:"13px 28px", fontSize:15, borderRadius:999 }}>
          <DiscordIcon size={17}/>Join Discord
        </a>
      </div>
    </div>
  );
}

/* ── Main App ── */
const SECTION_IDS = ["home","about","members","leaderboard","timeline","rules","register","testimonials","faq","gallery"];
const NAV_ITEMS   = [
  ["home","Home"],["about","Tentang"],["members","Anggota"],
  ["leaderboard","Hall of Fame"],["timeline","Sejarah"],
  ["rules","Peraturan"],["register","Daftar"],
  ["testimonials","Testimoni"],["faq","FAQ"],["gallery","Galeri"],
];

// Bottom mobile nav items (max 5)
const MOB_NAV = [
  { id:"home",    label:"Home",    icon:<Home size={20}/> },
  { id:"members", label:"Anggota", icon:<Users2 size={20}/> },
  { id:"gallery", label:"Galeri",  icon:<Image size={20}/> },
  { id:"rules",   label:"Rules",   icon:<BookOpen size={20}/> },
  { id:"register",label:"Daftar",  icon:<Trophy size={20}/> },
];

export default function App() {
  const [menu, setMenu]             = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [lbIdx, setLbIdx]           = useState(null);
  const [theme, toggleTheme]        = useTheme();
  const [annVisible, setAnnVisible] = useState(true);
  const [is404, setIs404]           = useState(false);
  const [backTopVisible, scrollTop] = useBackToTop();
  const loadingVisible              = useLoadingScreen();
  const { data: galleryData }       = useGallery();
  const activeSection               = useScrollSpy(SECTION_IDS);
  const scrollProgress              = useScrollProgress();

  useScrollReveal();
  useCustomCursor();

  const { LogoIcon } = CONFIG;
  const annHeight = annVisible ? 36 : 0;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = lbIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lbIdx]);

  const go = useCallback((id) => {
    setMenu(false);
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (60+annHeight), behavior:"smooth" });
  }, [annHeight]);

  const closeAnn = useCallback(() => {
    setAnnVisible(false);
    sessionStorage.setItem("tmj-ann-closed","1");
  }, []);

  const prevLb = useCallback(() => setLbIdx(i => (i-1+galleryData?.length) % galleryData?.length), [galleryData]);
  const nextLb = useCallback(() => setLbIdx(i => (i+1) % galleryData?.length), [galleryData]);

  if (is404) return <NotFound onGoHome={() => setIs404(false)}/>;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip ke konten</a>

      {/* Scroll Progress Bar */}
      <div className="scroll-progress" style={{ width:`${scrollProgress}%` }}/>

      <LoadingScreen visible={loadingVisible}/>
      {CONFIG.customCursor.active && <><div className="cursor-ring"/><div className="cursor-dot"/></>}
      <ToastContainer/>
      <AnnouncementBar annVisible={annVisible} onClose={closeAnn}/>

      {/* NAVBAR */}
      <nav className={`nav ${scrolled?"scrolled":""}`} style={{ top:annHeight }}>
        <div className="nav-logo" onClick={() => go("home")} role="button" tabIndex={0}>
          <div className="nav-logo-box"><LogoIcon size={16} color="white"/></div>
          <span className="nav-logo-text">{CONFIG.logoText}</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map(([id,l]) => (
            <button key={id} className={`nav-link ${activeSection===id?"active":""}`} onClick={() => go(id)}>{l}</button>
          ))}
        </div>
        <div className="nav-cta" style={{ display:"flex", alignItems:"center", gap:8 }}>
          <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-wa"><WAIcon size={14}/>WhatsApp</a>
          <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="btn btn-discord"><DiscordIcon size={14}/>Discord</a>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle tema">
            {theme==="light" ? <Moon size={16}/> : <Sun size={16}/>}
          </button>
        </div>
        <button className="hamburger" onClick={() => setMenu(!menu)} aria-label="Menu">
          <div className="ham-line" style={{ transform:menu?"rotate(45deg) translate(4.5px,4.5px)":"none" }}/>
          <div className="ham-line" style={{ opacity:menu?0:1 }}/>
          <div className="ham-line" style={{ transform:menu?"rotate(-45deg) translate(4.5px,-4.5px)":"none" }}/>
        </button>
      </nav>

      {menu && (
        <div className="mobile-drawer" style={{ top:60+annHeight }}>
          {NAV_ITEMS.map(([id,l]) => (
            <button key={id} className={`drawer-link ${activeSection===id?"":""}` } onClick={() => go(id)}
              style={{ color: activeSection===id ? "var(--accent)" : undefined }}>{l}</button>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-wa" style={{ flex:1, justifyContent:"center" }}><WAIcon size={14}/>WhatsApp</a>
            <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ flex:1, justifyContent:"center" }}><DiscordIcon size={14}/>Discord</a>
          </div>
          <button onClick={toggleTheme} style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:14, fontFamily:"'Inter',sans-serif", padding:"8px 0" }}>
            {theme==="light" ? <><Moon size={16}/>Dark Mode</> : <><Sun size={16}/>Light Mode</>}
          </button>
        </div>
      )}

      <main id="main-content">
        {/* HERO */}
        <section id="home" className="hero" style={{ paddingTop:`${120+annHeight}px` }}>
          <HeroBg/>
          <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:720, margin:"0 auto" }}>
            <div className="fu d1" style={{ display:"flex", justifyContent:"center" }}>
              <div className="eyebrow"><span className="live-dot"/>Server Online · Gabung Sekarang</div>
            </div>
            <h1 className="hero-title fu d2">Komunitas<br/><span>Trainer Terbaik.</span></h1>
            <p className="hero-sub fu d3" style={{ marginBottom:32 }}>
              TMJ adalah rumah bagi para gamer yang ingin berkembang — berbagi strategi, mabar seru, dan membangun koneksi yang nyata.
            </p>
            <CountdownTimer/>
            <div className="hero-btns fu d4">
              <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding:"13px 28px", fontSize:15, fontWeight:600, borderRadius:999 }}>
                <DiscordIcon size={17}/>Gabung Discord<ArrowRight size={15}/>
              </a>
              <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding:"13px 28px", fontSize:15, borderRadius:999 }}>
                <WAIcon size={17}/>WhatsApp Group
              </a>
            </div>
            <div className="fu d5" style={{ display:"flex", justifyContent:"center" }}>
              <div className="stats-row">
                {CONFIG.stats.map(s => (
                  <div key={s.label} className="stat-cell">
                    <div className="stat-val sora">{s.val}</div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="caret" onClick={() => go("about")}><ChevronDown size={22}/></div>
        </section>

        {/* ABOUT */}
        <section id="about">
          <div className="wrap py">
            <div className="about-cols">
              <div className="reveal from-left">
                <div className="sec-tag">Tentang Kami</div>
                <h2 className="sec-title">Bukan sekadar<br/><span>komunitas game.</span></h2>
              </div>
              <div className="reveal from-right" style={{ paddingTop:6 }}>
                <p className="sec-body" style={{ marginBottom:16 }}>TMJ (Trainer Maxim Jomok) adalah wadah berkumpulnya para gamer passionate yang ingin berkembang bersama.</p>
                <p className="sec-body">Dari mabar santai hingga turnamen kompetitif — semuanya ada di TMJ.</p>
              </div>
            </div>
            <div className="feat-grid">
              {CONFIG.features.map((f,i) => { const Icon=f.icon; return (
                <div key={f.title} className={`feat-card reveal rd${i+1}`}>
                  <div className="feat-icon" style={{ background:`${f.color}12` }}><Icon size={19} color={f.color}/></div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              ); })}
            </div>
          </div>
        </section>

        <div className="hr"/>

        {/* MEMBERS */}
        <section id="members">
          <div className="wrap py">
            <div className="reveal" style={{ marginBottom:48 }}>
              <div className="sec-tag">Susunan Anggota</div>
              <h2 className="sec-title" style={{ marginBottom:14 }}>Orang-orang di<br/><span>balik TMJ.</span></h2>
              <p className="sec-body">Kenali tim yang menjaga komunitas ini tetap hidup setiap harinya.</p>
            </div>
            <MemberGrid/>
          </div>
        </section>

        <div className="hr"/>

        {/* LEADERBOARD */}
        <section id="leaderboard" className="sec-alt">
          <div className="wrap py">
            <div className="reveal" style={{ marginBottom:48 }}>
              <div className="sec-tag">Hall of Fame</div>
              <h2 className="sec-title" style={{ marginBottom:14 }}>Yang terbaik<br/><span>di TMJ.</span></h2>
              <p className="sec-body">Anggota dan juara terbaik yang telah menorehkan prestasi untuk komunitas TMJ.</p>
            </div>
            <LeaderboardSection/>
          </div>
        </section>

        <div className="hr"/>

        {/* TIMELINE */}
        <section id="timeline">
          <div className="wrap py">
            <div className="timeline-layout">
              <div className="reveal from-left" style={{ position:"sticky", top:96 }}>
                <div className="sec-tag">Sejarah Komunitas</div>
                <h2 className="sec-title" style={{ marginBottom:14 }}>Perjalanan<br/><span>TMJ.</span></h2>
                <p className="sec-body">Dari nol hingga komunitas gaming yang solid — jejak langkah TMJ dari hari pertama.</p>
              </div>
              <div className="reveal from-right"><TimelineSection/></div>
            </div>
          </div>
        </section>

        <div className="hr"/>

        {/* RULES */}
        <section id="rules" className="sec-alt">
          <div className="wrap py">
            <div className="reveal" style={{ marginBottom:48 }}>
              <div className="sec-tag">Peraturan Komunitas</div>
              <h2 className="sec-title" style={{ marginBottom:14 }}>Main seru,<br/><span>tetap fair.</span></h2>
              <p className="sec-body">
                Peraturan yang wajib dipatuhi oleh seluruh anggota TMJ demi menjaga komunitas tetap nyaman dan suportif.
              </p>
            </div>
            <RulesSection/>
          </div>
        </section>

        <div className="hr"/>

        {/* REGISTRATION */}
        <section id="register">
          <div className="wrap py">
            <div className="about-cols" style={{ alignItems:"start" }}>
              <div className="reveal from-left" style={{ position:"sticky", top:96 }}>
                <div className="sec-tag">Bergabung</div>
                <h2 className="sec-title" style={{ marginBottom:14 }}>Daftar jadi<br/><span>anggota TMJ.</span></h2>
                <p className="sec-body" style={{ marginBottom:20 }}>Isi form untuk mendaftar secara resmi. Tim kami akan menghubungimu setelah pendaftaran diterima.</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ padding:"10px 20px", fontSize:14, borderRadius:999 }}><DiscordIcon size={15}/>Discord</a>
                  <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-wa"      style={{ padding:"10px 20px", fontSize:14, borderRadius:999 }}><WAIcon size={15}/>WhatsApp</a>
                </div>
              </div>
              <div className="reveal from-right">
                <div style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius:20, padding:"32px 28px", boxShadow:"var(--shadow)" }}>
                  <RegistrationForm/>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="hr"/>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="sec-alt">
          <div className="wrap py">
            <div className="reveal" style={{ marginBottom:48 }}>
              <div className="sec-tag">Testimoni</div>
              <h2 className="sec-title" style={{ marginBottom:14 }}>Apa kata<br/><span>anggota kami.</span></h2>
              <p className="sec-body">Cerita nyata dari para gamer yang sudah bergabung bersama TMJ.</p>
            </div>
            <Testimonials/>
          </div>
        </section>

        <div className="hr"/>

        {/* FAQ */}
        <section id="faq">
          <div className="wrap py">
            <div className="faq-layout">
              <div className="reveal from-left" style={{ position:"sticky", top:96 }}>
                <div className="sec-tag">FAQ</div>
                <h2 className="sec-title" style={{ marginBottom:14 }}>Ada<br/><span>pertanyaan?</span></h2>
                <p className="sec-body" style={{ marginBottom:28 }}>Pertanyaan yang paling sering ditanyakan oleh calon anggota baru TMJ.</p>
                <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ padding:"12px 24px", fontSize:14, fontWeight:600, borderRadius:999 }}>
                  <DiscordIcon size={16}/>Tanya di Discord
                </a>
              </div>
              <div className="reveal from-right"><FAQAccordion/></div>
            </div>
          </div>
        </section>

        <div className="hr"/>

        {/* GALLERY */}
        <section id="gallery">
          <div className="wrap py">
            <div className="reveal" style={{ marginBottom:48 }}>
              <div className="sec-tag">Galeri Komunitas</div>
              <h2 className="sec-title" style={{ marginBottom:14 }}>Momen-momen<br/><span>bersama TMJ.</span></h2>
              <p className="sec-body">Tambah foto langsung dari dashboard Supabase — tanpa edit kode!</p>
            </div>
            <Gallery onOpen={setLbIdx}/>
          </div>
        </section>

        {lbIdx !== null && galleryData && (
          <Lightbox items={galleryData} index={lbIdx} onClose={() => setLbIdx(null)} onPrev={prevLb} onNext={nextLb}/>
        )}

        {/* CTA */}
        <div className="wrap" style={{ paddingBottom:"clamp(80px,9vw,128px)" }}>
          <div className="cta-banner reveal">
            <div className="sec-tag" style={{ color:"rgba(128,128,128,.45)", marginBottom:18 }}>Bergabung</div>
            <div className="cta-title">Siap jadi bagian<br/>dari TMJ?</div>
            <div className="cta-sub">Mulai perjalananmu hari ini di platform mana saja.</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={CONFIG.discordLink} target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ padding:"13px 28px", fontSize:15, fontWeight:600, borderRadius:999 }}>
                <DiscordIcon size={17}/>Join Discord<ArrowRight size={15}/>
              </a>
              <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding:"13px 28px", fontSize:15, borderRadius:999, background:"rgba(255,255,255,.07)", borderColor:"rgba(255,255,255,.18)", color:"var(--cta-text)" }}>
                <WAIcon size={17}/>Join WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div className="nav-logo-box"><LogoIcon size={15} color="white"/></div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:"var(--text)" }}>{CONFIG.logoText}</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ display:"flex", gap:8 }}>
            <a href={CONFIG.discordLink}  target="_blank" rel="noopener noreferrer" className="btn btn-discord" style={{ padding:"7px 16px", fontSize:13 }}><DiscordIcon size={13}/>Discord</a>
            <a href={CONFIG.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-wa"      style={{ padding:"7px 16px", fontSize:13 }}><WAIcon size={13}/>WhatsApp</a>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
            {NAV_ITEMS.map(([id,l]) => (
              <button key={id} onClick={() => go(id)} className="nav-link" style={{ fontSize:12 }}>{l}</button>
            ))}
          </div>
        </div>
        <span className="footer-copy">© 2026 {CONFIG.logoText} Community. All rights reserved.</span>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {MOB_NAV.map(item => (
            <button key={item.id} className={`mob-nav-item ${activeSection===item.id?"active":""}`} onClick={() => go(item.id)}>
              <span className="mob-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <button className={`back-top ${backTopVisible?"visible":""}`} onClick={scrollTop} aria-label="Kembali ke atas">
        <ChevronUp size={20}/>
      </button>
    </>
  );
}