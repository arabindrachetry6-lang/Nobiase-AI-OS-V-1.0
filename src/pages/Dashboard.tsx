import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { db } from '../firebase';
import { collection, query, onSnapshot, limit, orderBy, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="ml-1">{Math.abs(change)}%</span>
      </div>
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold mt-1">{value}</h3>
  </motion.div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    newCustomers: 0,
    inventoryItems: 0,
    activeCampaigns: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const orgId = profile.orgId;

    // Fetch Sales Stats
    const unsubSales = onSnapshot(collection(db, `organizations/${orgId}/sales`), (snap) => {
      const total = snap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
      setStats(prev => ({ ...prev, totalSales: total }));
      
      // Process chart data (simple aggregation by day)
      const dailySales: { [key: string]: number } = {};
      snap.docs.forEach(doc => {
        const date = new Date(doc.data().date).toLocaleDateString('en-US', { weekday: 'short' });
        dailySales[date] = (dailySales[date] || 0) + (doc.data().total || 0);
      });
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setChartData(days.map(day => ({ name: day, sales: dailySales[day] || 0 })));
    });

    // Fetch Customers
    const unsubCustomers = onSnapshot(collection(db, `organizations/${orgId}/contacts`), (snap) => {
      setStats(prev => ({ ...prev, newCustomers: snap.size }));
    });

    // Fetch Inventory
    const unsubInventory = onSnapshot(collection(db, `organizations/${orgId}/inventory`), (snap) => {
      setStats(prev => ({ ...prev, inventoryItems: snap.size }));
    });

    // Fetch Recent Activity (Combining from multiple sources for demo)
    const unsubActivity = onSnapshot(query(collection(db, `organizations/${orgId}/sales`), orderBy('date', 'desc'), limit(5)), (snap) => {
      const activities = snap.docs.map(doc => ({
        user: doc.data().customerName || 'Customer',
        action: `purchased items for $${doc.data().total}`,
        time: 'Just now',
        icon: DollarSign,
        color: 'bg-emerald-100 text-emerald-600'
      }));
      setRecentActivity(activities);
    });

    return () => {
      unsubSales();
      unsubCustomers();
      unsubInventory();
      unsubActivity();
    };
  }, [profile?.orgId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Welcome back, {profile?.displayName}! Here's what's happening at {profile?.businessName}.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto">
          <Calendar size={18} />
          <span>Schedule Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Sales" value={`$${stats.totalSales.toLocaleString()}`} change={12} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Total Customers" value={stats.newCustomers.toString()} change={8} icon={Users} color="bg-emerald-500" />
        <StatCard title="Inventory Items" value={stats.inventoryItems.toString()} change={-2} icon={Package} color="bg-amber-500" />
        <StatCard title="Active Campaigns" value="12" change={24} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Sales Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [
                { name: 'Mon', sales: 0 }, { name: 'Tue', sales: 0 }, { name: 'Wed', sales: 0 },
                { name: 'Thu', sales: 0 }, { name: 'Fri', sales: 0 }, { name: 'Sat', sales: 0 }, { name: 'Sun', sales: 0 }
              ]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((item, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {item.user} <span className="font-normal text-slate-500">{item.action}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-sm italic">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
