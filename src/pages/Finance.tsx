import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  PieChart, 
  FileText, 
  Camera, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Download,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Save,
  Send,
  Eye,
  Languages,
  X,
  Smartphone,
  CreditCard,
  TrendingUp,
  Activity
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, where, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from 'recharts';
import { PDFViewer, Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useLocation } from 'react-router-dom';

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2563eb' },
  info: { fontSize: 10, color: '#64748b', marginTop: 4 },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  col1: { flex: 3, fontSize: 10 },
  col2: { flex: 1, fontSize: 10, textAlign: 'right' },
  col3: { flex: 1, fontSize: 10, textAlign: 'right' },
  total: { marginTop: 40, borderTopWidth: 2, borderTopColor: '#2563eb', paddingTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  totalLabel: { fontSize: 12, fontWeight: 'bold', marginRight: 20 },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' }
});

const InvoicePDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.info}>#{data.id || 'INV-000'}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>BizOS AI</Text>
          <Text style={styles.info}>123 Business Ave, Tech City</Text>
        </View>
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
        <Text style={{ fontSize: 10 }}>{data.client || 'Client Name'}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Price</Text>
        </View>
        {data.items?.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.description}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>${item.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.total}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalValue}>${data.total || '0.00'}</Text>
      </View>
    </Page>
  </Document>
);

export default function Finance() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('accounting');
  const location = useLocation();

  // Accounting State
  const [ledger, setLedger] = useState<any[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [healthSummary, setHealthSummary] = useState('');
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);
  const [newEntry, setNewEntry] = useState({ description: '', amount: '', type: 'debit', category: '' });

  // Expense State
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [fraudAlert, setFraudAlert] = useState<{ isFraud: boolean, reason: string } | null>(null);

  // Invoice State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    client: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    status: 'Pending',
    total: 0
  });
  const [reminderDraft, setReminderDraft] = useState('');

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsub = onSnapshot(collection(db, `organizations/${profile.orgId}/transactions`), (snapshot) => {
      setLedger(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [profile?.orgId]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsub = onSnapshot(collection(db, `organizations/${profile.orgId}/expenses`), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [profile?.orgId]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsub = onSnapshot(collection(db, `organizations/${profile.orgId}/invoices`), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [profile?.orgId]);

  useEffect(() => {
    if (location.state) {
      const { tab, prefill } = location.state as any;
      if (tab) setActiveTab(tab);
      if (prefill) {
        if (tab === 'accounting' && prefill.description) {
          setNewEntry(prev => ({ ...prev, description: prefill.description }));
          handleAutoCategorize(prefill.description);
        }
        if (tab === 'expenses' && prefill.amount) {
          // Handle prefill for expenses
        }
        if (tab === 'invoices' && prefill.client) {
          setNewInvoice(prev => ({ ...prev, client: prefill.client }));
          setIsCreatingInvoice(true);
        }
      }
    }
  }, [location.state]);

  // Accounting Functions
  const handleAutoCategorize = async (desc: string) => {
    if (!desc) return;
    setIsCategorizing(true);
    try {
      const result = await geminiService.categorizeTransaction(desc);
      setNewEntry(prev => ({ ...prev, category: result.subCategory }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleFinancialHealth = async () => {
    setIsAnalyzingHealth(true);
    const mockPL = "Jan: $10k Rev, $4k Exp; Feb: $12k Rev, $5k Exp; Mar: $11k Rev, $4.5k Exp";
    try {
      const summary = await geminiService.analyzeFinancialHealth(mockPL);
      setHealthSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  // Expense Functions
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingReceipt(true);
    setFraudAlert(null);
    
    // In a real app, we'd upload to Firebase Storage and get a URL
    // For this demo, we simulate OCR with a mock image data
    setTimeout(async () => {
      try {
        const result = await geminiService.extractReceiptData("mock_base64_image");
        setReceiptResult(result);
        
        // Check for fraud
        const fraud = await geminiService.detectFraud(result, expenses);
        setFraudAlert(fraud);
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzingReceipt(false);
      }
    }, 2000);
  };

  // Invoice Functions
  const handleAddInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0 }]
    }));
  };

  const calculateTotal = () => {
    const total = newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    setNewInvoice(prev => ({ ...prev, total }));
  };

  const handleSendReminder = async (inv: any) => {
    try {
      const draft = await geminiService.generateInvoiceReminder(inv.client, parseFloat(inv.amount.replace('$', '')), inv.due, 'regular');
      setReminderDraft(draft);
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Feb', revenue: 3000, expenses: 1398 },
    { name: 'Mar', revenue: 2000, expenses: 9800 },
    { name: 'Apr', revenue: 2780, expenses: 3908 },
    { name: 'May', revenue: 1890, expenses: 4800 },
    { name: 'Jun', revenue: 2390, expenses: 3800 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Finance</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">AI-powered accounting, expenses, and invoicing.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'accounting', icon: Activity, label: 'Accounting' },
            { id: 'expenses', icon: CreditCard, label: 'Expenses' },
            { id: 'invoices', icon: FileText, label: 'Invoices' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'accounting' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ledger & Chart of Accounts */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold">General Ledger</h3>
                      <button className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    <div className="space-y-4 mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                          <input 
                            type="text" 
                            placeholder="Transaction Description..."
                            value={newEntry.description}
                            onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                            onBlur={() => handleAutoCategorize(newEntry.description)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          {isCategorizing && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
                        </div>
                        <input 
                          type="number" 
                          placeholder="Amount"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <select className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                          <option>{newEntry.category || 'Select Category'}</option>
                          <option>Software</option>
                          <option>Rent</option>
                          <option>Marketing</option>
                        </select>
                      </div>
                      <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2">
                        <Save size={18} />
                        <span>Post Entry</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <th className="pb-4">Date</th>
                            <th className="pb-4">Description</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4 text-right">Debit</th>
                            <th className="pb-4 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {[
                            { date: '2024-05-15', desc: 'AWS Monthly Billing', cat: 'Software', dr: '120.00', cr: '0.00' },
                            { date: '2024-05-14', desc: 'Client Payment - Acme', cat: 'Revenue', dr: '0.00', cr: '2500.00' },
                            { date: '2024-05-12', desc: 'Office Rent', cat: 'Rent', dr: '1500.00', cr: '0.00' },
                          ].map((row, i) => (
                            <tr key={i} className="text-sm">
                              <td className="py-4 text-slate-500">{row.date}</td>
                              <td className="py-4 font-bold">{row.desc}</td>
                              <td className="py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-bold uppercase">{row.cat}</span></td>
                              <td className="py-4 text-right text-red-500 font-mono">${row.dr}</td>
                              <td className="py-4 text-right text-emerald-500 font-mono">${row.cr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-8">Revenue vs Expenses</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Reports & Health */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Financial Health</h3>
                      <button 
                        onClick={handleFinancialHealth}
                        disabled={isAnalyzingHealth}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-all"
                      >
                        {isAnalyzingHealth ? <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={20} />}
                      </button>
                    </div>
                    {healthSummary ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30"
                      >
                        <p className="text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed italic">
                          "{healthSummary}"
                        </p>
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <TrendingUp size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Click the sparkles to analyze cash flow health</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Chart of Accounts</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Assets', count: 12, color: 'bg-blue-500' },
                        { label: 'Liabilities', count: 5, color: 'bg-red-500' },
                        { label: 'Equity', count: 3, color: 'bg-purple-500' },
                        { label: 'Revenue', count: 8, color: 'bg-emerald-500' },
                        { label: 'Expenses', count: 24, color: 'bg-amber-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer group">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                            <span className="text-sm font-bold">{item.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400 font-bold">{item.count}</span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Receipt Upload */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-xl font-bold mb-8">AI Expense Scanner</h3>
                <div className="space-y-6">
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-all">
                      {isAnalyzingReceipt ? (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-blue-600 font-bold animate-pulse">Gemini 1.5 Flash Extracting Data...</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl">
                            <Camera size={32} />
                          </div>
                          <div className="text-center">
                            <p className="font-bold">Snap or Upload Receipt</p>
                            <p className="text-xs text-slate-400 mt-1">Zero-entry expense reporting</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {fraudAlert && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-2xl flex items-start space-x-3 ${fraudAlert.isFraud ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}
                    >
                      {fraudAlert.isFraud ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      <div>
                        <p className="text-sm font-bold">{fraudAlert.isFraud ? 'Fraud Alert Detected' : 'Receipt Verified'}</p>
                        <p className="text-xs opacity-80 mt-1">{fraudAlert.reason}</p>
                      </div>
                    </motion.div>
                  )}

                  {receiptResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor</label>
                          <p className="font-bold">{receiptResult.vendor}</p>
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Total</label>
                          <p className="font-bold text-lg text-blue-600">{receiptResult.currency} {receiptResult.total_amount}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                          <p className="text-sm">{receiptResult.date}</p>
                        </div>
                        <div className="text-right">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                          <p className="text-sm font-bold text-purple-600">{receiptResult.category}</p>
                        </div>
                      </div>
                      <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30">
                        Verify & Save Expense
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Expense Feed */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Expense Feed</h3>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500"><Filter size={18} /></button>
                    <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500"><Search size={18} /></button>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { vendor: 'Starbucks', cat: 'Food', amount: '5.50', status: 'Approved', date: 'Today' },
                    { vendor: 'Amazon Web Services', cat: 'Software', amount: '124.99', status: 'Pending', date: 'Yesterday' },
                    { vendor: 'Uber Technologies', cat: 'Travel', amount: '22.00', status: 'Reimbursed', date: 'Oct 8' },
                  ].map((exp, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl group hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <CreditCard size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{exp.vendor}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{exp.cat} • {exp.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${exp.amount}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          exp.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice Builder */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Professional Invoice Builder</h3>
                    <div className="flex space-x-2">
                      <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><Languages size={20} /></button>
                      <button 
                        onClick={() => setIsCreatingInvoice(true)}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center space-x-2"
                      >
                        <Plus size={18} />
                        <span>New Invoice</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold mb-2">Client Name</label>
                        <input 
                          type="text" 
                          value={newInvoice.client}
                          onChange={(e) => setNewInvoice({...newInvoice, client: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold">Line Items</label>
                          <button onClick={handleAddInvoiceItem} className="text-blue-600 text-xs font-bold flex items-center space-x-1">
                            <Plus size={14} />
                            <span>Add Item</span>
                          </button>
                        </div>
                        {newInvoice.items.map((item, i) => (
                          <div key={i} className="grid grid-cols-12 gap-2">
                            <input 
                              className="col-span-6 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs"
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => {
                                const newItems = [...newInvoice.items];
                                newItems[i].description = e.target.value;
                                setNewInvoice({...newInvoice, items: newItems});
                              }}
                            />
                            <input 
                              type="number"
                              className="col-span-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...newInvoice.items];
                                newItems[i].quantity = parseInt(e.target.value);
                                setNewInvoice({...newInvoice, items: newItems});
                                calculateTotal();
                              }}
                            />
                            <input 
                              type="number"
                              className="col-span-3 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs"
                              placeholder="Price"
                              value={item.price}
                              onChange={(e) => {
                                const newItems = [...newInvoice.items];
                                newItems[i].price = parseFloat(e.target.value);
                                setNewInvoice({...newInvoice, items: newItems});
                                calculateTotal();
                              }}
                            />
                            <button className="col-span-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-6 border-t dark:border-slate-700 flex items-center justify-between">
                        <span className="text-lg font-bold">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">${newInvoice.total.toFixed(2)}</span>
                      </div>
                      <button className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2">
                        <Save size={20} />
                        <span>Generate & Save</span>
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[400px]">
                      <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl shadow-inner overflow-hidden flex flex-col">
                        <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live PDF Preview</span>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                          </div>
                        </div>
                        <div className="flex-1 p-8 space-y-6">
                          <div className="flex justify-between">
                            <div className="w-24 h-8 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                            <div className="w-16 h-4 bg-slate-100 dark:bg-slate-700 rounded"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="w-full h-4 bg-slate-50 dark:bg-slate-900 rounded"></div>
                            <div className="w-full h-4 bg-slate-50 dark:bg-slate-900 rounded"></div>
                            <div className="w-2/3 h-4 bg-slate-50 dark:bg-slate-900 rounded"></div>
                          </div>
                          <div className="mt-12 space-y-4">
                            <div className="flex justify-between border-b pb-2">
                              <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                              <div className="w-12 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                              <div className="w-1/2 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                              <div className="w-12 h-3 bg-slate-100 dark:bg-slate-700 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-[10px] text-slate-400">Powered by @react-pdf/renderer</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard & Reminders */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Invoice Dashboard</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Outstanding</p>
                        <p className="text-xl font-bold mt-1">$12,450</p>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-amber-600 uppercase">Avg. Pay Time</p>
                        <p className="text-xl font-bold mt-1">12 Days</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Smart Reminders</h3>
                    <div className="space-y-4">
                      {[
                        { client: 'Acme Corp', amount: '$1,200', due: '2 days ago', status: 'Overdue' },
                        { client: 'Global Tech', amount: '$4,500', due: 'Tomorrow', status: 'Pending' },
                      ].map((inv, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold">{inv.client}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{inv.amount} • Due {inv.due}</span>
                            <button 
                              onClick={() => handleSendReminder(inv)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {reminderDraft && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30"
                      >
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">AI Drafted Reminder</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{reminderDraft.substring(0, 100)}..."</p>
                        <button className="mt-3 w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Copy & Send</button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
