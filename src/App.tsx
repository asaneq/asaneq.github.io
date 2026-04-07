/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Skull, ZapOff, Database, Plus, Calendar, Trash2, ExternalLink, RefreshCw, Languages, Radio, Home, BookOpen, Activity, Phone, Terminal, ShieldCheck, Instagram, MessageSquare, Send, ChevronUp, ChevronDown } from 'lucide-react';

// --- Types & Context ---

type Language = 'en' | 'ru';

interface GhostLink {
  id: string;
  url: string;
  title: string;
  description: string;
  addedAt: number;
  lastAccessed: number;
  addedBy?: string;
}

interface User {
  username: string;
}

interface GhostContextType {
  links: GhostLink[];
  lang: Language;
  setLang: (l: Language) => void;
  addLink: (url: string) => Promise<void>;
  removeLink: (id: string) => void;
  reviveLink: (id: string) => void;
  deepScan: () => Promise<void>;
  isScanning: boolean;
  isChatOpen: boolean;
  setIsChatOpen: (o: boolean) => void;
  hasNewMessage: boolean;
  setHasNewMessage: (h: boolean) => void;
  user: User | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  t: any;
}

const GhostContext = createContext<GhostContextType | null>(null);

const useGhost = () => {
  const context = useContext(GhostContext);
  if (!context) throw new Error('useGhost must be used within GhostProvider');
  return context;
};

// --- Translations ---

const TRANSLATIONS = {
  en: {
    nav: { outskirts: "OUTSKIRTS", ritual: "RITUAL", morgue: "MORGUE", echoes: "ECHOES", maintainers: "MAINTAINERS" },
    outskirts: { title: "THE OUTSKIRTS", subtitle: "A graveyard of digital remnants. Some are fading..." },
    ritual: { title: "THE RITUAL", subtitle: "Exhume a soul from the void.", placeholder: "ENTER URL...", btn: "BEGIN RITUAL", scanning: "SEARCHING FOR SOUL REMNANTS...", archiving: "ARCHIVING GHOST FRAGMENTS..." },
    morgue: { title: "THE MORGUE", subtitle: "These souls have been silent for too long.", revive: "TRY TO REVIVE", empty: "NO CORPSES FOUND YET." },
    echoes: { title: "THE ECHOES", manifesto: "The internet has become too fast. Too forgetful. We build monuments to the discarded. Every link is a ghost of a thought once held. We are the digital archaeologists of the void. Do not let them disappear entirely. Memory is the only resistance against the entropy of the network.", authors: "AUTHORS: ASANALI REZUANOV & ALISHER AKIMOV" },
    maintainers: { title: "THE MAINTAINERS", subtitle: "Encrypted communication channel. Accessing dossier...", socialsBtn: "OUR SOCIALS" },
    intercept: { title: "SIGNAL_INTERCEPT", scan: "SCAN_FOR_ECHOES", type: "TYPE MESSAGE...", empty: "NO SIGNALS INTERCEPTED YET." },
    chat: { status: "SYSTEM_STATUS: OPEN_CHANNEL", incoming: "INCOMING_SIGNAL", broadcast: "GLOBAL_BROADCAST", prompt: "ADMIN@GHOST_TOWN:~/chat$" },
    scan: { btn: "DEEP_SCAN", scanning: "SCANNING_SECTOR_7...", recovering: "RECOVERING_FRAGMENT..." },
    card: { exhumed: "EXHUMED", status: "STATUS", stable: "STABLE", fading: "FADING", decayed: "DECAYED", by: "BY" },
    auth: { 
      login: "LOG_IN", 
      signup: "SIGN_UP", 
      logout: "DISCONNECT", 
      username: "USERNAME", 
      password: "PASSWORD", 
      enter: "ENTER SYSTEM", 
      create: "CREATE IDENTITY", 
      cancel: "ABORT",
      required: "AUTHENTICATION REQUIRED TO PERFORM RITUAL"
    }
  },
  ru: {
    nav: { outskirts: "ОКРАИНЫ", ritual: "РИТУАЛ", morgue: "МОРГ", echoes: "ЭХО", maintainers: "ПОДДЕРЖКА" },
    outskirts: { title: "ОКРАИНЫ", subtitle: "Кладбище цифровых останков. Некоторые увядают..." },
    ritual: { title: "РИТУАЛ", subtitle: "Извлеките душу из пустоты.", placeholder: "ВВЕДИТЕ URL...", btn: "НАЧАТЬ РИТУАЛ", scanning: "ПОИСК ОСТАТКОВ ДУШИ...", archiving: "АРХИВАЦИЯ ФРАГМЕНТОВ ПРИЗРАКА..." },
    morgue: { title: "МОРГ", subtitle: "Эти души слишком долго молчали.", revive: "ПОПРОБОВАТЬ ОЖИВИТЬ", empty: "ТРУПОВ ПОКА НЕ ОБНАРУЖЕНО." },
    echoes: { title: "ЭХО", manifesto: "Интернет стал слишком быстрым. Слишком забывчивым. Мы строим памятники выброшенному. Каждая ссылка — это призрак когда-то возникшей мысли. Мы — цифровые археологи пустоты. Не позволяйте им исчезнуть совсем. Память — единственное сопротивление энтропии сети.", authors: "АВТОРЫ: АСАНАЛИ РЕЗУАНОВ & АЛИШЕР АКИМОВ" },
    maintainers: { title: "ПОДДЕРЖКА", subtitle: "Зашифрованный канал связи. Доступ к досье...", socialsBtn: "НАШИ СОЦСЕТИ" },
    intercept: { title: "ПЕРЕХВАТ_СИГНАЛА", scan: "ПОИСК_ЭХО", type: "ВВЕДИТЕ СООБЩЕНИЕ...", empty: "СИГНАЛОВ ПОКА НЕ ПЕРЕХВАЧЕНО." },
    chat: { status: "СТАТУС_СИСТЕМЫ: КАНАЛ_ОТКРЫТ", incoming: "ВХОДЯЩИЙ_СИГНАЛ", broadcast: "ГЛОБАЛЬНОЕ_ВЕЩАНИЕ", prompt: "ADMIN@GHOST_TOWN:~/chat$" },
    scan: { btn: "ГЛУБОКОЕ_СКАНИРОВАНИЕ", scanning: "СКАНИРОВАНИЕ_СЕКТОРА_7...", recovering: "ВОССТАНОВЛЕНИЕ_ФРАГМЕНТА..." },
    card: { exhumed: "ЭКСГУМИРОВАНО", status: "СТАТУС", stable: "СТАБИЛЬНО", fading: "УВЯДАЕТ", разложено: "РАЗЛОЖЕНО", by: "ОТ" },
    auth: { 
      login: "ВХОД", 
      signup: "РЕГИСТРАЦИЯ", 
      logout: "ОТКЛЮЧИТЬСЯ", 
      username: "ИМЯ_ПОЛЬЗОВАТЕЛЯ", 
      password: "ПАРОЛЬ", 
      enter: "ВОЙТИ В СИСТЕМУ", 
      create: "СОЗДАТЬ ЛИЧНОСТЬ", 
      cancel: "ОТМЕНА",
      required: "ДЛЯ ПРОВЕДЕНИЯ РИТУАЛА ТРЕБУЕТСЯ АВТОРИЗАЦИЯ"
    }
  }
};

// --- Components ---

const MemoryLeakOverlay = () => {
  const { t } = useGhost();
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 white-noise opacity-40 mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <RefreshCw className="w-12 h-12 text-ghost-amber animate-spin" />
        <div className="space-y-2 text-center">
          <p className="text-ghost-amber font-mono text-sm tracking-[0.3em] animate-pulse uppercase">
            {t.scan.scanning}
          </p>
          <p className="text-ghost-rust font-mono text-[10px] tracking-widest uppercase opacity-60">
            {t.scan.recovering}
          </p>
        </div>
      </div>

      {/* Static interference lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div 
            key={i}
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ 
              duration: Math.random() * 0.5 + 0.2, 
              repeat: Infinity, 
              delay: Math.random() * 2 
            }}
            className="absolute left-0 w-full h-[1px] bg-white/10 blur-sm"
          />
        ))}
      </div>
    </motion.div>
  );
};

const Header = () => {
  const { user, logout, t } = useGhost();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<'login' | 'signup' | null>(null);

  return (
    <header className="fixed top-0 left-0 w-full z-[120] p-4 md:p-6 pointer-events-none">
      <div className="max-w-7xl mx-auto flex justify-end">
        <div className="pointer-events-auto bg-ghost-black/80 backdrop-blur-sm border border-ghost-rust/30 p-2 flex items-center gap-4 font-mono text-[10px]">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-ghost-green animate-pulse">
                <Activity className="w-3 h-3" />
                <span className="tracking-tighter uppercase">USER::{user.username}</span>
              </div>
              <button 
                onClick={logout}
                className="border border-ghost-rust px-2 py-1 hover:bg-ghost-rust hover:text-black transition-all"
              >
                [{t.auth.logout}]
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsAuthModalOpen('login')}
                className="border border-ghost-green/30 px-2 py-1 hover:border-ghost-green hover:text-ghost-green transition-all"
              >
                [{t.auth.login}]
              </button>
              <button 
                onClick={() => setIsAuthModalOpen('signup')}
                className="border border-ghost-amber/30 px-2 py-1 hover:border-ghost-amber hover:text-ghost-amber transition-all"
              >
                [{t.auth.signup}]
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            type={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(null)} 
          />
        )}
      </AnimatePresence>
    </header>
  );
};

const AuthModal = ({ type, onClose }: { type: 'login' | 'signup', onClose: () => void }) => {
  const { login, t } = useGhost();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = type === 'login' ? '/api/login' : '/api/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Auth failed');

      if (type === 'login') {
        login(data.token, data.username);
        onClose();
      } else {
        // After register, auto login or just show success
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();
        login(loginData.token, loginData.username);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20, filter: 'blur(10px)' }}
        animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ scale: 0.9, y: 20, filter: 'blur(10px)' }}
        className="w-full max-w-md bg-ghost-black border-2 border-ghost-rust p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-ghost-rust animate-pulse" />
        
        <h2 className="text-2xl font-bold text-ghost-amber mb-6 tracking-tighter uppercase glitch-text" data-text={type === 'login' ? t.auth.login : t.auth.signup}>
          {type === 'login' ? t.auth.login : t.auth.signup}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-ghost-rust uppercase font-bold">{t.auth.username}</label>
            <input 
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-transparent border border-ghost-green/30 p-3 text-ghost-green focus:outline-none focus:border-ghost-green transition-all font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-ghost-rust uppercase font-bold">{t.auth.password}</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border border-ghost-green/30 p-3 text-ghost-green focus:outline-none focus:border-ghost-green transition-all font-mono"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] uppercase font-bold animate-pulse">
              {">"} ERROR: {error}
            </p>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-ghost-rust text-black font-bold py-3 hover:bg-ghost-amber transition-all uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {loading ? '...' : (type === 'login' ? t.auth.enter : t.auth.create)}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 border border-ghost-rust/30 text-ghost-rust hover:border-ghost-rust transition-all uppercase text-[10px]"
            >
              {t.auth.cancel}
            </button>
          </div>
        </form>

        <motion.div 
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="absolute inset-0 bg-ghost-amber/5 pointer-events-none"
        />
      </motion.div>
    </motion.div>
  );
};
const GlobalChat = () => {
  const { t, user, isChatOpen: isOpen, setIsChatOpen: setIsOpen, hasNewMessage: hasNew, setHasNewMessage: setHasNew } = useGhost();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat/global');
      if (res.ok) {
        const data = await res.json();
        if (data.length > messages.length && !isOpen) {
          setHasNew(true);
        }
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const token = localStorage.getItem('ghost-town-token');
    try {
      const res = await fetch('/api/chat/global', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-32 left-0 w-full z-[140] pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 md:px-6 pointer-events-auto">
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '400px', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-ghost-black/95 border border-ghost-rust/30 flex flex-col overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(183,65,14,0.2)]"
            >
              {/* Header */}
              <header className="h-8 flex items-center justify-between px-4 bg-ghost-rust/10 border-b border-ghost-rust/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ghost-green" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-ghost-rust">
                    {t.chat.broadcast}
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] text-ghost-rust hover:text-ghost-amber transition-colors"
                >
                  [CLOSE_CHANNEL]
                </button>
              </header>

              {/* Chat Content */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] scrollbar-custom"
            >
              {messages.map((m, i) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 group"
                >
                  <span className="text-ghost-rust/40">[{new Date(m.created_at).toLocaleTimeString([], { hour12: false })}]</span>
                  <span className="text-ghost-amber font-bold uppercase">{m.username}{">"}</span>
                  <span className="text-ghost-green/80 break-all">{m.message}</span>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            {user ? (
              <form onSubmit={handleSubmit} className="p-3 border-t border-ghost-rust/20 bg-ghost-rust/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ghost-rust font-bold whitespace-nowrap">{t.chat.prompt}</span>
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-ghost-green font-mono text-[10px] p-0"
                    autoFocus={isOpen}
                  />
                  <button type="submit" className="text-ghost-rust hover:text-ghost-amber transition-colors">
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 border-t border-ghost-rust/20 bg-ghost-rust/5 text-center">
                <span className="text-[8px] text-ghost-rust/40 uppercase tracking-widest">{t.auth.required}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )}
</AnimatePresence>
  );
};

const RadioNav = () => {
  const { lang, setLang, t, deepScan } = useGhost();
  const location = useLocation();

  const navItems = [
    { path: '/', label: t.nav.outskirts, icon: Home },
    { path: '/ritual', label: t.nav.ritual, icon: Plus },
    { path: '/morgue', label: t.nav.morgue, icon: Skull },
    { path: '/echoes', label: t.nav.echoes, icon: BookOpen },
    { path: '/maintainers', label: t.nav.maintainers, icon: ShieldCheck },
  ];

  const { isChatOpen, setIsChatOpen, hasNewMessage } = useGhost();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-[110] p-4 md:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-ghost-black border-4 border-ghost-rust p-4 shadow-[0_0_20px_rgba(183,65,14,0.3)] pointer-events-auto flex flex-wrap items-center justify-between gap-4">
        {/* Radio Dial Aesthetic */}
        <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 group transition-all ${location.pathname === item.path ? 'text-ghost-amber scale-110' : 'text-ghost-rust hover:text-ghost-green'}`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold tracking-tighter">{item.label}</span>
              {location.pathname === item.path && (
                <motion.div layoutId="nav-indicator" className="w-full h-0.5 bg-ghost-amber mt-1" />
              )}
            </Link>
          ))}
          
          {/* Global Chat Toggle */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex flex-col items-center gap-1 group transition-all ${isChatOpen ? 'text-ghost-amber scale-110' : 'text-ghost-rust hover:text-ghost-green'}`}
          >
            <div className="relative">
              <MessageSquare className={`w-5 h-5 ${isChatOpen ? 'animate-pulse' : ''}`} />
              {hasNewMessage && !isChatOpen && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tighter uppercase">{t.chat.broadcast}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 border-l-2 border-ghost-rust pl-4">
          <button 
            onClick={deepScan}
            className="flex flex-col items-center gap-1 group text-ghost-amber hover:text-white transition-all mr-2"
          >
            <ZapOff className="w-5 h-5 group-hover:animate-pulse" />
            <span className="text-[8px] font-bold tracking-tighter uppercase">{t.scan.btn}</span>
          </button>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-ghost-rust uppercase">Signal Strength</span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 h-3 ${i <= 4 ? 'bg-ghost-green' : 'bg-ghost-rust/20'}`} />
              ))}
            </div>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
            className="bg-ghost-rust text-black font-bold px-3 py-1 text-[10px] hover:bg-ghost-amber transition-colors"
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </div>
    </nav>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.main
    initial={{ opacity: 0, filter: 'blur(20px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(20px)' }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
    className="min-h-screen pt-8 pb-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10"
  >
    {children}
  </motion.main>
);

// --- Pages ---

const Outskirts = () => {
  const { links, t, removeLink, reviveLink, lang } = useGhost();

  return (
    <PageWrapper>
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-bold crt-flicker glitch-text mb-4" data-text={t.outskirts.title}>
          {t.outskirts.title}
        </h1>
        <p className="text-ghost-rust uppercase tracking-widest text-xs md:text-sm">{t.outskirts.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {links.map((link, idx) => (
            <GhostCard 
              key={link.id} 
              link={link} 
              t={t} 
              lang={lang}
              onRemove={() => removeLink(link.id)} 
              onRevive={() => reviveLink(link.id)}
              delay={idx * 0.05}
            />
          ))}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

const Ritual = () => {
  const { t, addLink, user } = useGhost();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'archiving'>('idle');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setStatus('scanning');
    await new Promise(r => setTimeout(r, 2000));
    setStatus('archiving');
    await new Promise(r => setTimeout(r, 2000));
    
    await addLink(url);
    navigate('/');
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto mt-20">
        <header className="mb-12 border-b-2 border-ghost-rust pb-4">
          <h1 className="text-4xl font-bold text-ghost-rust tracking-tighter uppercase">{t.ritual.title}</h1>
          <p className="text-ghost-green/40 text-xs mt-2">{t.ritual.subtitle}</p>
        </header>

        {!user ? (
          <div className="border-2 border-dashed border-ghost-rust/30 p-12 text-center">
            <ZapOff className="w-12 h-12 text-ghost-rust/20 mx-auto mb-4" />
            <p className="text-ghost-rust font-mono text-sm uppercase tracking-widest animate-pulse">
              {t.auth.required}
            </p>
          </div>
        ) : status === 'idle' ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-ghost-rust/20 blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <input 
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={t.ritual.placeholder}
                className="relative w-full bg-black border-2 border-ghost-rust p-6 text-ghost-green focus:outline-none focus:border-ghost-amber transition-colors placeholder:text-ghost-rust/30"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-ghost-rust text-black font-bold py-4 hover:bg-ghost-amber transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(183,65,14,0.5)]"
            >
              {t.ritual.btn}
            </button>
          </form>
        ) : (
          <div className="space-y-4 font-mono text-sm md:text-base">
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-ghost-amber"
            >
              {">"} {status === 'scanning' ? t.ritual.scanning : t.ritual.archiving}
            </motion.p>
            <div className="w-full h-2 bg-ghost-rust/20 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-full bg-ghost-green shadow-[0_0_10px_#00ff41]"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                  className="h-4 bg-ghost-rust/10"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

const Morgue = () => {
  const { links, t, reviveLink } = useGhost();
  
  const deadLinks = useMemo(() => {
    const sixMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 30 * 6);
    return links.filter(l => l.lastAccessed < sixMonthsAgo);
  }, [links]);

  return (
    <PageWrapper>
      <header className="mb-16">
        <h1 className="text-4xl font-bold text-ghost-rust mb-2">{t.morgue.title}</h1>
        <p className="text-ghost-green/40 text-xs uppercase tracking-widest">{t.morgue.subtitle}</p>
      </header>

      <div className="space-y-12">
        {deadLinks.length > 0 ? (
          deadLinks.map((link) => (
            <div key={link.id} className="group border-l-2 border-ghost-rust/20 pl-6 py-2 hover:border-ghost-rust transition-colors">
              <h3 className="text-2xl font-bold text-ghost-green/80 group-hover:text-ghost-amber transition-colors crt-flicker">
                {link.title}
              </h3>
              <p className="text-xs text-ghost-rust/60 mt-1 uppercase">LAST SIGNAL: {new Date(link.lastAccessed).toLocaleDateString()}</p>
              <div className="mt-4 flex gap-4">
                <button 
                  onClick={() => reviveLink(link.id)}
                  className="text-[10px] font-bold bg-ghost-rust/10 text-ghost-rust px-4 py-2 hover:bg-ghost-rust hover:text-black transition-all"
                >
                  {t.morgue.revive}
                </button>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold border border-ghost-rust/20 text-ghost-rust/40 px-4 py-2 hover:border-ghost-rust hover:text-ghost-rust transition-all"
                >
                  VISIT VOID
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-ghost-rust/20">
            <Skull className="w-12 h-12 text-ghost-rust/20 mx-auto mb-4" />
            <p className="text-ghost-rust/40 text-xs uppercase tracking-widest">{t.morgue.empty}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

const Echoes = () => {
  const { t } = useGhost();

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto overflow-hidden h-[60vh] relative mt-10">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ghost-black to-transparent z-20" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ghost-black to-transparent z-20" />
        
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: "-150%" }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          className="space-y-20 text-center px-4 wave-distortion"
        >
          <h1 className="text-6xl font-bold text-ghost-rust crt-flicker">{t.echoes.title}</h1>
          <p className="text-xl md:text-2xl leading-relaxed text-ghost-green/80 font-bold uppercase tracking-tighter">
            {t.echoes.manifesto}
          </p>
          <div className="space-y-2">
            <p className="text-ghost-amber/60 text-sm font-bold tracking-widest uppercase">{t.echoes.authors}</p>
          </div>
          <div className="space-y-4">
            <Skull className="w-12 h-12 mx-auto text-ghost-rust" />
            <p className="text-ghost-rust/40 text-xs">END OF SIGNAL</p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

const Maintainers = () => {
  const { t } = useGhost();

  const developers = [
    { name: "ASAN", phone: "+7 705 900 00 04", instagram: "asrznv", status: "[STATUS: ONLINE]" },
    { name: "ALISH", phone: "+7 776 213 39 88", instagram: "aa.a.a_a.a.aa", status: "[SIGNAL: WEAK]" }
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto mt-10 space-y-12 animate-pulse-slow">
        <header className="border-b border-ghost-rust/30 pb-6">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-bold text-ghost-rust tracking-tighter uppercase glitch-text"
            data-text={t.maintainers.title}
          >
            {t.maintainers.title}
          </motion.h1>
          <p className="text-ghost-green/40 text-[10px] uppercase tracking-[0.3em] mt-2">
            {t.maintainers.subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {developers.map((dev, idx) => (
            <DeveloperCard key={idx} dev={dev} delay={idx * 0.2} />
          ))}
        </div>

        <div className="flex flex-col gap-8">
          <div className="p-6 border border-ghost-rust/10 bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-ghost-rust/40 text-[10px] font-mono">
              <Terminal className="w-4 h-4" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                SYSTEM_LOG: ENCRYPTED_CHANNEL_ESTABLISHED...
              </motion.span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(180, 63, 63, 0.1)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 border border-ghost-rust/30 text-ghost-rust font-bold tracking-[0.5em] uppercase text-xs hover:border-ghost-amber transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <Radio className="w-4 h-4 group-hover:animate-pulse" />
            {t.maintainers.socialsBtn}
          </motion.button>
        </div>
      </div>
    </PageWrapper>
  );
};

const DeveloperCard = ({ dev, delay }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSocials, setShowSocials] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSocials(true), 2000 + delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group p-8 border-2 border-ghost-rust/20 bg-black/60 hover:border-ghost-amber transition-all duration-500 overflow-hidden"
    >
      {/* Broken Glass Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/broken-noise.png')]"></div>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-ghost-rust" />
            <h2 className="text-2xl font-bold text-ghost-green tracking-tighter uppercase">
              {dev.name}
            </h2>
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[10px] font-bold text-ghost-amber animate-pulse glitch-text"
                data-text={dev.status}
              >
                {dev.status}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-ghost-rust/40 text-[10px] uppercase font-bold">
              <Phone className="w-3 h-3" />
              <span>COMMUNICATION_LINK</span>
            </div>
            
            <a 
              href={`tel:${dev.phone.replace(/\s/g, '')}`}
              className="block font-mono text-ghost-green hover:text-ghost-amber transition-colors text-sm md:text-base group/link"
            >
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: delay + 0.5 }}
                className="inline-block overflow-hidden whitespace-nowrap"
              >
                {">"} CALL {dev.phone}
              </motion.span>
              <div className="h-0.5 w-0 group-hover/link:w-full bg-ghost-amber transition-all duration-300" />
            </a>
          </div>

          <div className="space-y-3 min-h-[60px]">
            <div className="flex items-center gap-2 text-ghost-rust/40 text-[10px] uppercase font-bold">
              <Instagram className="w-3 h-3" />
              <span>COORDINATES_FREQ</span>
            </div>

            {!showSocials ? (
              <motion.div 
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[10px] font-mono text-ghost-rust/40 italic"
              >
                ESTABLISHING CONNECTION...
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                className="relative"
              >
                <a 
                  href={`https://instagram.com/${dev.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-ghost-rust/60 hover:text-ghost-green transition-all duration-300 text-sm group/insta cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-ghost-rust/40 group-hover/insta:text-ghost-green transition-colors" />
                    <span className="group-hover/insta:glitch-text-rgb">
                      INST_FREQ: @{dev.instagram}
                    </span>
                  </div>
                </a>
              </motion.div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-ghost-rust/10 flex justify-between items-center">
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1 h-1 bg-ghost-rust/30" />
            ))}
          </div>
          <span className="text-[8px] text-ghost-rust/20 uppercase">DOSSIER_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* Glitch Frame Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ghost-rust/40 group-hover:border-ghost-amber transition-colors" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ghost-rust/40 group-hover:border-ghost-amber transition-colors" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ghost-rust/40 group-hover:border-ghost-amber transition-colors" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ghost-rust/40 group-hover:border-ghost-amber transition-colors" />
    </motion.div>
  );
};

const SignalIntercept = ({ linkId, onClose }: { linkId: string, onClose: () => void }) => {
  const { t, user } = useGhost();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [scanning, setScanning] = useState(false);

  const fetchComments = async () => {
    setScanning(true);
    try {
      const res = await fetch(`/api/links/${linkId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setScanning(false);
      }, 1500);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [linkId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const token = localStorage.getItem('ghost-town-token');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ linkId, content: newComment })
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-3xl h-[80vh] bg-ghost-black border border-ghost-rust/30 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <header className="p-4 border-b border-ghost-rust/20 flex justify-between items-center bg-ghost-rust/5">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-ghost-amber animate-pulse" />
            <h2 className="text-sm font-bold tracking-[0.2em] text-ghost-amber uppercase">
              {t.intercept.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[10px] text-ghost-rust hover:text-ghost-amber transition-colors"
          >
            [CLOSE_CHANNEL]
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-[11px] scrollbar-hide">
          {scanning ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-8 h-8 text-ghost-rust animate-spin" />
              <p className="text-ghost-rust animate-pulse uppercase tracking-widest">
                {t.intercept.scan}...
              </p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((c, i) => (
              <motion.div 
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group border-l border-ghost-rust/10 pl-4 py-1 hover:border-ghost-amber/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-ghost-rust/40">[{new Date(c.created_at).toLocaleTimeString()}]</span>
                  <span className="text-ghost-green font-bold uppercase tracking-tighter">
                    {c.username}
                  </span>
                  <div className="w-4 h-4 bg-ghost-rust/10 flex items-center justify-center text-[8px] text-ghost-rust/40">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <p className="text-ghost-green/80 leading-relaxed group-hover:text-ghost-green transition-colors">
                  {c.content}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-ghost-rust/20 uppercase tracking-widest">
              {t.intercept.empty}
            </div>
          )}
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-ghost-rust/20 bg-ghost-rust/5">
            <div className="flex items-center gap-3">
              <span className="text-ghost-amber font-bold">{">"}</span>
              <input 
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={t.intercept.type}
                className="flex-1 bg-transparent border-none focus:ring-0 text-ghost-green placeholder:text-ghost-rust/20 font-mono text-xs"
                autoFocus
              />
              <button 
                type="submit"
                className="text-[10px] text-ghost-amber hover:text-ghost-green transition-colors font-bold"
              >
                [TRANSMIT]
              </button>
            </div>
          </form>
        )}

        <button 
          onClick={fetchComments}
          className="absolute bottom-20 right-6 p-2 bg-ghost-rust/10 border border-ghost-rust/20 text-ghost-rust hover:bg-ghost-rust hover:text-black transition-all text-[10px] font-bold uppercase tracking-tighter"
        >
          {t.intercept.scan}
        </button>
      </div>
    </motion.div>
  );
};

const GhostCard = ({ link, t, lang, onRemove, onRevive, delay }: any) => {
  const { user } = useGhost();
  const [isHovered, setIsHovered] = useState(false);
  const [showIntercepts, setShowIntercepts] = useState(false);

  const isAdmin = user && ['asan', 'alish'].includes(user.username.toLowerCase());

  const decay = useMemo(() => {
    const now = Date.now();
    const ageInDays = (now - link.lastAccessed) / (1000 * 60 * 60 * 24);
    const maxDecayDays = 30;
    const factor = Math.min(ageInDays / maxDecayDays, 1);
    
    let status = t.card.stable;
    if (ageInDays > 20) status = t.card.decayed;
    else if (ageInDays > 7) status = t.card.fading;

    return { factor, status, blur: factor * 6, grayscale: factor * 100, opacity: 1 - (factor * 0.6) };
  }, [link.lastAccessed, t]);

  return (
    <motion.div
      layout
      id={`ghost-${link.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
      transition={{ delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative aspect-square group"
    >
      <div 
        className="h-full bg-black border-2 border-ghost-rust/30 p-6 flex flex-col transition-all duration-700 relative overflow-hidden"
        style={{
          filter: isHovered ? 'none' : `grayscale(${decay.grayscale}%) blur(${decay.blur}px)`,
          opacity: isHovered ? 1 : decay.opacity,
          borderColor: isHovered ? 'var(--color-ghost-amber)' : 'rgba(183,65,14,0.3)'
        }}
      >
        <AnimatePresence>
          {showIntercepts && (
            <SignalIntercept 
              linkId={link.id} 
              onClose={() => setShowIntercepts(false)} 
            />
          )}
        </AnimatePresence>
        {/* Moss Overlay */}
        {!isHovered && (
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-ghost-rust/10">
            <Ghost className={`w-5 h-5 ${isHovered ? 'text-ghost-amber animate-pulse' : 'text-ghost-rust/40'}`} />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowIntercepts(true);
              }} 
              className="p-1 hover:text-ghost-amber text-ghost-rust/40 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={onRevive} className="p-1 hover:text-ghost-amber text-ghost-rust/40 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button onClick={onRemove} className="p-1 hover:text-red-500 text-ghost-rust/40 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className={`text-lg font-bold mb-2 break-all uppercase tracking-tighter leading-tight ${isHovered ? 'crt-flicker text-ghost-amber' : 'text-ghost-rust/60'}`}>
          {link.title}
        </h3>
        
        <div className="mt-auto space-y-2">
          {link.addedBy && (
            <div className="flex items-center gap-2 text-[8px] text-ghost-green/60 uppercase font-bold">
              <Radio className="w-3 h-3" />
              <span>{t.card.by}: {link.addedBy}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[8px] text-ghost-rust/40 uppercase font-bold">
            <Calendar className="w-3 h-3" />
            <span>{t.card.exhumed}: {new Date(link.addedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-[8px] font-bold px-2 py-0.5 border ${
              decay.status === t.card.decayed ? 'border-red-900 text-red-500' : 
              decay.status === t.card.fading ? 'border-ghost-amber/40 text-ghost-amber' : 
              'border-ghost-green/40 text-ghost-green'
            }`}>
              {decay.status}
            </span>
            
            <a 
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-ghost-amber hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
            transition={{ duration: 0.15, repeat: Infinity }}
            className="absolute inset-0 bg-ghost-amber/10 pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  );
};

// --- Main App & Provider ---

const INITIAL_LINKS: GhostLink[] = [
  { id: '1', url: 'https://geocities.restorativland.org', title: 'GeoCities Archive', description: '', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 200, lastAccessed: Date.now() - 1000 * 60 * 60 * 24 * 190 },
  { id: '2', url: 'https://theuselessweb.com', title: 'The Useless Web', description: '', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 30, lastAccessed: Date.now() - 1000 * 60 * 60 * 24 * 10 },
  { id: '3', url: 'https://archive.org', title: 'Wayback Machine', description: '', addedAt: Date.now() - 1000 * 60 * 60 * 24 * 5, lastAccessed: Date.now() - 1000 * 60 * 60 * 24 * 1 }
];

export default function App() {
  return (
    <BrowserRouter>
      <GhostProvider>
        <AppContent />
      </GhostProvider>
    </BrowserRouter>
  );
}

function GhostProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('ghost-town-lang');
    if (saved === 'en' || saved === 'ru') return saved;
    return navigator.language.startsWith('ru') ? 'ru' : 'en';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ghost-town-user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (token: string, username: string) => {
    localStorage.setItem('ghost-town-token', token);
    const userData = { username };
    localStorage.setItem('ghost-town-user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ghost-town-token');
    localStorage.removeItem('ghost-town-user');
    setUser(null);
  };

  const [isScanning, setIsScanning] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const deepScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/links/random');
      if (res.ok) {
        const { id } = await res.json();
        await new Promise(r => setTimeout(r, 1200));
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(`ghost-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-scan');
            setTimeout(() => el.classList.remove('highlight-scan'), 3000);
          }
        }, 500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsScanning(false), 1000);
    }
  };

  const [links, setLinks] = useState<GhostLink[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/api/links');
        if (response.ok) {
          const data = await response.json();
          setLinks(data);
        }
      } catch (err) {
        console.error('Failed to fetch links:', err);
      }
    };
    fetchLinks();
  }, []);

  useEffect(() => {
    localStorage.setItem('ghost-town-lang', lang);
  }, [lang]);

  const addLink = async (url: string) => {
    const token = localStorage.getItem('ghost-town-token');
    if (!token) return;

    const newLink: GhostLink = {
      id: Math.random().toString(36).substr(2, 9),
      url: url.startsWith('http') ? url : `https://${url}`,
      title: url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toUpperCase(),
      description: '',
      addedAt: Date.now(),
      lastAccessed: Date.now(),
    };
    
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLink)
      });
      if (response.ok) {
        setLinks([{ ...newLink, addedBy: user?.username }, ...links]);
      }
    } catch (err) {
      console.error('Failed to add link:', err);
    }
  };

  const removeLink = async (id: string) => {
    const token = localStorage.getItem('ghost-town-token');
    if (!token) return;

    try {
      const response = await fetch(`/api/links/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setLinks(links.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove link:', err);
    }
  };

  const reviveLink = async (id: string) => {
    try {
      const response = await fetch(`/api/links/${id}/revive`, { method: 'PATCH' });
      if (response.ok) {
        const { lastAccessed } = await response.json();
        setLinks(links.map(l => l.id === id ? { ...l, lastAccessed } : l));
      }
    } catch (err) {
      console.error('Failed to revive link:', err);
    }
  };

  const t = TRANSLATIONS[lang];

  return (
    <GhostContext.Provider value={{ links, lang, setLang, addLink, removeLink, reviveLink, deepScan, isScanning, isChatOpen, setIsChatOpen, hasNewMessage, setHasNewMessage, user, login, logout, t }}>
      {children}
    </GhostContext.Provider>
  );
}

function AppContent() {
  const { isScanning } = useGhost();
  return (
    <div className="relative min-h-screen bg-ghost-black selection:bg-ghost-amber selection:text-black">
      <AnimatePresence>
        {isScanning && <MemoryLeakOverlay />}
      </AnimatePresence>
      <div className="scanlines" />
      <div className="noise-overlay" />
      
      <Header />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Outskirts />} />
          <Route path="/ritual" element={<Ritual />} />
          <Route path="/morgue" element={<Morgue />} />
          <Route path="/echoes" element={<Echoes />} />
          <Route path="/maintainers" element={<Maintainers />} />
        </Routes>
      </AnimatePresence>

      <RadioNav />
      <GlobalChat />
    </div>
  );
}
