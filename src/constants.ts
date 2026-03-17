import { 
  Globe, 
  TrendingUp, 
  Megaphone, 
  DollarSign, 
  Package, 
  Users, 
  Briefcase,
  LayoutDashboard,
  Settings,
  Users2
} from 'lucide-react';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'bn', name: 'Bangla (বাংলা)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'de', name: 'German (Deutsch)' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['owner', 'manager', 'staff'] },
  { id: 'website', label: 'Website', icon: Globe, path: '/website', roles: ['owner', 'manager'] },
  { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/sales', roles: ['owner', 'manager', 'staff'] },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing', roles: ['owner', 'manager'] },
  { id: 'finance', label: 'Finance', icon: DollarSign, path: '/finance', roles: ['owner'] },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', roles: ['owner', 'manager', 'staff'] },
  { id: 'hrm', label: 'HRM', icon: Users, path: '/hrm', roles: ['owner'] },
  { id: 'services', label: 'Services', icon: Briefcase, path: '/services', roles: ['owner', 'manager'] },
  { id: 'team', label: 'Team', icon: Users2, path: '/team', roles: ['owner'] },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', roles: ['owner', 'manager', 'staff'] },
];

export const TRANSLATIONS: Record<string, any> = {
  en: {
    welcome: "Welcome to BizOS AI",
    dashboard: "Dashboard",
    website: "Website",
    sales: "Sales",
    marketing: "Marketing",
    finance: "Finance",
    inventory: "Inventory",
    hrm: "HRM",
    services: "Services",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
    signup: "Sign Up",
    aiAssistant: "AI Assistant",
    typeMessage: "Type a message...",
    // Add more translations as needed
  },
  hi: {
    welcome: "BizOS AI à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¤¾ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤¹à¥ˆ",
    dashboard: "à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡",
    website: "à¤µà¥‡à¤¬à¤¸à¤¾à¤‡à¤Ÿ",
    sales: "à¤¬à¤¿à¤•à¥à¤°à¥€",
    marketing: "à¤µà¤¿à¤ªà¤£à¤¨",
    finance: "à¤µà¤¿à¤¤à¥à¤¤",
    inventory: "à¤‡à¤¨à¥à¤µà¥‡à¤¨à¥à¤Ÿà¥à¤°à¥€",
    hrm: "à¤®à¤¾à¤¨à¤µ à¤¸à¤‚à¤¸à¤¾à¤§à¤¨",
    services: "à¤¸à¥‡à¤µà¤¾à¤à¤‚",
    settings: "à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—à¥à¤¸",
    logout: "à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ",
    login: "à¤²à¥‰à¤—à¤¿à¤¨",
    signup: "à¤¸à¤¾à¤‡à¤¨ à¤…à¤ª",
    aiAssistant: "AI à¤¸à¤¹à¤¾à¤¯à¤•",
    typeMessage: "à¤¸à¤‚à¤¦à¥‡à¤¶ à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¥‡à¤‚...",
  },
  // Add other languages...
};
