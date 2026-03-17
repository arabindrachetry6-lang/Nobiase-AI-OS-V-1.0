import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  Search,
  User,
  ChevronRight,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { NAV_ITEMS, LANGUAGES, TRANSLATIONS } from '../constants';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children, profile: initialProfile }: { children: React.ReactNode, profile: UserProfile | null }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [orgName, setOrgName] = useState('My Business');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const fetchOrg = async () => {
      if (profile?.orgId) {
        const docRef = doc(db, 'organizations', profile.orgId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrgName(docSnap.data().name);
        }
      }
    };
    fetchOrg();
  }, [profile?.orgId]);

  const handleLanguageChange = async (lang: string) => {
    if (auth.currentUser && profile) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { language: lang });
      setProfile({ ...profile, language: lang as any });
      setIsLangMenuOpen(false);
    }
  };

  const handleThemeToggle = async () => {
    if (auth.currentUser && profile) {
      const newTheme = profile.theme === 'light' ? 'dark' : 'light';
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { theme: newTheme });
      setProfile({ ...profile, theme: newTheme as any });
    }
  };

  const currentLang = profile?.language || 'en';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  useEffect(() => {
    const handleNavigation = (event: any) => {
      const { target, tab, prefill } = event.detail;
      if (target === 'marketing') {
        navigate('/marketing', { state: { tab, prefill } });
      } else if (target === 'finance') {
        navigate('/finance', { state: { tab, prefill } });
      } else if (target === 'inventory') {
        navigate('/inventory', { state: { tab, prefill } });
      } else if (target === 'hrm') {
        navigate('/hrm', { state: { tab, prefill } });
      }
    };
    window.addEventListener('bizos-navigation', handleNavigation);
    return () => window.removeEventListener('bizos-navigation', handleNavigation);
  }, [navigate]);

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        {(isSidebarOpen || isMobileMenuOpen) && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent"
          >
            BizOS AI
          </motion.span>
        )}
        <button 
          onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:block hidden"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:hidden block"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="mt-6 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {NAV_ITEMS.filter(item => !item.roles || (profile?.role && item.roles.includes(profile.role))).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center p-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              )}
            >
              <item.icon size={22} />
              {(isSidebarOpen || isMobileMenuOpen) && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-4 font-medium"
                >
                  {t[item.id] || item.label}
                </motion.span>
              )}
              {(isSidebarOpen || isMobileMenuOpen) && isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto"
                >
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-8 left-0 w-full px-4">
        <button 
          onClick={() => auth.signOut()}
          className={cn(
            "flex items-center w-full p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all",
            (!isSidebarOpen && !isMobileMenuOpen) && "justify-center"
          )}
        >
          <LogOut size={22} />
          {(isSidebarOpen || isMobileMenuOpen) && <span className="ml-4 font-medium">{t.logout}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      profile?.theme === 'dark' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className={cn(
          "fixed left-0 top-0 h-full z-50 border-r transition-colors duration-300 lg:block hidden",
          profile?.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden block backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className={cn(
                "fixed left-0 top-0 h-full w-[280px] z-[70] border-r lg:hidden block shadow-2xl",
                profile?.theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-[80px]",
        "ml-0"
      )}>
        {/* Top Bar */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 backdrop-blur-md",
          profile?.theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
        )}>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg lg:hidden block"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-xl w-40 sm:w-64 md:w-96">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:ring-0 ml-2 sm:ml-3 w-full text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            <button 
              onClick={handleThemeToggle}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors sm:block hidden"
            >
              {profile?.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Languages size={18} />
                <span className="text-xs sm:text-sm font-medium uppercase">{currentLang}</span>
              </button>
              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-40 sm:w-48 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative sm:block hidden">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3 sm:pl-4 md:pl-6 sm:border-l dark:border-slate-800">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold truncate max-w-[100px]">{profile?.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate max-w-[100px]">{orgName}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

