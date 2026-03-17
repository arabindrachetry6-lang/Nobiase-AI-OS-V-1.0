import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Plus, 
  MoreVertical, 
  Search, 
  QrCode, 
  CreditCard, 
  Receipt,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { Contact, Deal } from '../types';
import { geminiService } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';

export default function Sales() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('crm');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '' });
  
  // CRM Intelligence State
  const [rawCRMData, setRawCRMData] = useState('');
  const [isProcessingCRM, setIsProcessingCRM] = useState(false);
  const [crmIntelligence, setCrmIntelligence] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (!profile?.orgId) return;
    const q = query(collection(db, `organizations/${profile.orgId}/inventory`), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [profile?.orgId]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const q = query(collection(db, `organizations/${profile.orgId}/contacts`), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    });
    return unsubscribe;
  }, [profile?.orgId]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;
    try {
      const scoreResult = await geminiService.scoreLead(`${newContact.name} from ${newContact.company}`);
      await addDoc(collection(db, `organizations/${profile.orgId}/contacts`), {
        ...newContact,
        orgId: profile.orgId,
        status: 'lead',
        aiScore: scoreResult.score,
        lastContacted: new Date().toISOString()
      });
      setIsAddingContact(false);
      setNewContact({ name: '', email: '', company: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessCRMData = async () => {
    if (!rawCRMData.trim()) return;
    setIsProcessingCRM(true);
    try {
      const result = await geminiService.processCRMData(rawCRMData);
      setCrmIntelligence(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingCRM(false);
    }
  };

  const saveIntelligenceToContact = async () => {
    if (!crmIntelligence || !profile?.orgId) return;
    try {
      await addDoc(collection(db, `organizations/${profile.orgId}/contacts`), {
        orgId: profile.orgId,
        name: crmIntelligence.name,
        company: crmIntelligence.company,
        email: 'Unknown',
        status: 'lead',
        aiScore: crmIntelligence.leadScore,
        lastContacted: new Date().toISOString(),
        notes: `AI Recommended Action: ${crmIntelligence.recommendedAction}. Sentiment: ${crmIntelligence.sentiment}. Deal Value: ${crmIntelligence.dealValue}`
      });
      setCrmIntelligence(null);
      setRawCRMData('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!selectedItem || !profile?.orgId) return;
    
    try {
      // Decrement Inventory
      const itemRef = doc(db, `organizations/${profile.orgId}/inventory`, selectedItem.id);
      await updateDoc(itemRef, {
        stock: increment(-1)
      });

      // Record Transaction
      await addDoc(collection(db, `organizations/${profile.orgId}/transactions`), {
        orgId: profile.orgId,
        amount: selectedItem.price,
        items: [selectedItem.name],
        timestamp: new Date().toISOString(),
        paymentMethod: 'Card'
      });

      setSelectedItem(null);
      alert('Transaction Complete! Inventory updated.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sales</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your CRM, deals, and POS system.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'crm' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            CRM
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pos' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            POS
          </button>
        </div>
      </div>

      {activeTab === 'crm' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contacts List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">Contacts</h3>
                <button 
                  onClick={() => setIsAddingContact(true)}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right">
                        <div className="flex items-center text-xs font-bold text-emerald-500">
                          <Sparkles size={12} className="mr-1" />
                          <span>AI Score: {contact.aiScore}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{contact.status}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deal Pipeline Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold">AI CRM Intelligence</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">Paste raw emails or meeting transcripts to extract structured business intelligence.</p>
              
              <textarea
                value={rawCRMData}
                onChange={(e) => setRawCRMData(e.target.value)}
                placeholder="Paste raw data here..."
                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none mb-4"
              />
              
              <button
                onClick={handleProcessCRMData}
                disabled={isProcessingCRM || !rawCRMData.trim()}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessingCRM ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <TrendingUp size={18} />
                    <span>Process Data</span>
                  </>
                )}
              </button>

              {crmIntelligence && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Name</p>
                      <p className="text-sm font-bold">{crmIntelligence.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Company</p>
                      <p className="text-sm font-bold">{crmIntelligence.company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Deal Value</p>
                      <p className="text-sm font-bold text-emerald-500">{crmIntelligence.dealValue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Lead Score</p>
                      <p className="text-sm font-bold text-blue-500">{crmIntelligence.leadScore}/100</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Recommended Action</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{crmIntelligence.recommendedAction}</p>
                  </div>

                  <button
                    onClick={saveIntelligenceToContact}
                    className="w-full py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all"
                  >
                    Save to Contacts
                  </button>
                </motion.div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Deal Pipeline</h3>
              <div className="space-y-4">
                {[
                  { stage: 'Prospecting', count: 12, value: '$45,000', color: 'bg-blue-500' },
                  { stage: 'Negotiation', count: 5, value: '$28,000', color: 'bg-amber-500' },
                  { stage: 'Closed Won', count: 24, value: '$142,000', color: 'bg-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">{item.stage}</span>
                      <span className="text-xs text-slate-500">{item.count} deals</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{item.value}</span>
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all font-semibold">
                View Kanban Board
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* POS Interface */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">New Sale</h3>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase">Select Product</label>
                <select 
                  onChange={(e) => setSelectedItem(inventoryItems.find(i => i.id === e.target.value))}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an item...</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                      {item.name} (${item.price}) - {item.stock > 0 ? `${item.stock} in stock` : 'OUT OF STOCK'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900">
                <div>
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-4xl font-bold mt-1">${selectedItem?.price || '0.00'}</p>
                </div>
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                  <Receipt size={24} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center space-y-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                  <QrCode size={32} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="font-bold text-xs">Scan QR</span>
                </button>
                <button 
                  onClick={() => window.open('upi://pay?pa=bizos@upi&pn=BizOS%20AI&am=0&cu=INR', '_blank')}
                  className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center space-y-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-[10px]">UPI</div>
                  <span className="font-bold text-xs">UPI Link</span>
                </button>
                <button className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center space-y-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                  <CreditCard size={32} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="font-bold text-xs">Card</span>
                </button>
              </div>

              <button 
                onClick={handleCompleteTransaction}
                disabled={!selectedItem}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <DollarSign size={20} />
                <span>Complete Transaction</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {[
                { id: '#TRX-9402', amount: '$124.50', status: 'Success', time: '10 mins ago' },
                { id: '#TRX-9401', amount: '$45.00', status: 'Success', time: '45 mins ago' },
                { id: '#TRX-9400', amount: '$2,400.00', status: 'Pending', time: '2 hours ago' },
              ].map((trx, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                      <Receipt size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold">{trx.id}</p>
                      <p className="text-xs text-slate-500">{trx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{trx.amount}</p>
                    <p className={`text-xs font-bold ${trx.status === 'Success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {trx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Add New Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Company"
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
