import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  BarChart3, 
  Scan, 
  MapPin, 
  TrendingUp, 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Lightbulb, 
  Rocket, 
  Trash2, 
  Save, 
  Send, 
  Globe, 
  ArrowRight,
  Box,
  Warehouse,
  Store,
  RefreshCw,
  MoreVertical,
  Download,
  Upload,
  X
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, where, Timestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Inventory() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('stock');
  const [location, setLocation] = useState('Warehouse A');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [plmProducts, setPlmProducts] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forecastResults, setForecastResults] = useState<any[]>([]);
  const [poDraft, setPoDraft] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPlmModalOpen, setIsPlmModalOpen] = useState(false);
  const [plmAnalysis, setPlmAnalysis] = useState<any>(null);
  const [plmCopy, setPlmCopy] = useState<string | null>(null);
  const [retirementAdvice, setRetirementAdvice] = useState<string | null>(null);

  const routeLocation = useLocation();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (routeLocation.state) {
      const { tab, prefill } = routeLocation.state as any;
      if (tab) setActiveTab(tab);
      if (prefill && prefill.productName) {
        // Handle prefill
      }
    }
  }, [routeLocation.state]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsub = onSnapshot(collection(db, `organizations/${profile.orgId}/inventory`), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
    });
    return () => unsub();
  }, [profile?.orgId]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsub = onSnapshot(collection(db, `organizations/${profile.orgId}/plm_products`), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlmProducts(items);
    });
    return () => unsub();
  }, [profile?.orgId]);

  useEffect(() => {
    if (isScannerOpen) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
        scannerRef.current = null;
      }
    }
  }, [isScannerOpen]);

  const onScanSuccess = async (decodedText: string) => {
    setScannedResult(decodedText);
    setIsScannerOpen(false);
    
    // Technical Implementation Detail: The "Scanner"
    if (!profile?.orgId) return;
    const invDoc = await getDoc(doc(db, `organizations/${profile.orgId}/inventory`, decodedText));
    if (invDoc.exists()) {
      setSelectedProduct({ id: invDoc.id, ...invDoc.data() });
    } else {
      // Open new product form in PLM
      setActiveTab('plm');
      setIsPlmModalOpen(true);
      setPlmAnalysis(null);
    }
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const handleAdjustStock = async (id: string, amount: number) => {
    if (!profile?.orgId) return;
    const itemRef = doc(db, `organizations/${profile.orgId}/inventory`, id);
    await updateDoc(itemRef, {
      stock: increment(amount)
    });
    
    // Check for low stock alert
    const updatedDoc = await getDoc(itemRef);
    const data = updatedDoc.data();
    if (data && data.stock <= data.threshold) {
      if (Notification.permission === "granted") {
        new Notification("Low Stock Alert", {
          body: `${data.name} is low on stock (${data.stock} remaining).`,
          icon: "/icon.png"
        });
      }
    }
  };

  const handleForecast = async () => {
    setIsAnalyzing(true);
    try {
      // Mock sales data
      const salesData = inventory.map(item => ({
        sku: item.id,
        sales: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10))
      }));
      const results = await geminiService.forecastDemand(salesData);
      setForecastResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftPO = async (items: any[]) => {
    setIsAnalyzing(true);
    try {
      const draft = await geminiService.draftPurchaseOrder(items);
      setPoDraft(draft);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlmAnalyze = async (desc: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await geminiService.analyzeProductIdea(desc);
      setPlmAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCopy = async (product: any) => {
    setIsAnalyzing(true);
    try {
      const copy = await geminiService.generateProductCopy(product.name, product.specs, ['EN', 'HI', 'DE']);
      setPlmCopy(copy);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetirementAdvice = async (product: any) => {
    setIsAnalyzing(true);
    try {
      const advice = await geminiService.adviseProductRetirement([{ name: product.name, sales: [10, 8, 5, 2, 1] }]);
      setRetirementAdvice(advice);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthColor = (stock: number, threshold: number) => {
    if (stock === 0) return 'text-red-600 bg-red-100';
    if (stock <= threshold) return 'text-amber-600 bg-amber-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  const getHealthIndicator = (stock: number, threshold: number) => {
    if (stock === 0) return 'bg-red-500';
    if (stock <= threshold) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Inventory & PLM</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Predictive stock management and product lifecycle incubator.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'stock', icon: Box, label: 'Stock' },
            { id: 'plm', icon: RefreshCw, label: 'PLM' }
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
          {activeTab === 'stock' && (
            <div className="space-y-8">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {['Warehouse A', 'Storefront B'].map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${location === loc ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center space-x-2"
                  >
                    <Scan size={20} />
                    <span className="text-sm font-bold">Scan to Adjust</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleForecast}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl font-bold text-sm flex items-center space-x-2 hover:bg-purple-200 transition-all"
                  >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                    <span>Demand Forecaster</span>
                  </button>
                  <button 
                    onClick={() => handleDraftPO(inventory.filter(i => i.stock <= i.threshold))}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl font-bold text-sm flex items-center space-x-2 hover:bg-emerald-200 transition-all"
                  >
                    <ShoppingCart size={16} />
                    <span>One-Click Restock</span>
                  </button>
                </div>
              </div>

              {/* Stock Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventory.map((item) => (
                  <motion.div 
                    key={item.id}
                    layoutId={item.id}
                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getHealthColor(item.stock, item.threshold)}`}>
                        <Box size={24} />
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getHealthIndicator(item.stock, item.threshold)} shadow-sm`}></div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-4">{item.sku}</p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Stock Level</p>
                        <p className="text-2xl font-bold">{item.stock} <span className="text-xs text-slate-400">/ {item.unit}</span></p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                        <p className="text-xs font-bold">{item.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAdjustStock(item.id, -1)}
                        className="flex-1 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-lg"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="flex-1 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-bold text-lg"
                      >
                        +
                      </button>
                    </div>

                    {forecastResults.find(f => f.sku === item.id) && (
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center space-x-2 text-purple-600 mb-1">
                          <TrendingUp size={14} />
                          <span className="text-[10px] font-bold uppercase">AI Prediction</span>
                        </div>
                        <p className="text-xs font-bold">Stock-out: <span className="text-purple-600">{forecastResults.find(f => f.sku === item.id).predictedStockOutDate}</span></p>
                      </div>
                    )}

                    {item.stock > 50 && (
                      <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center space-x-2 text-amber-600 mb-1">
                          <AlertTriangle size={14} />
                          <span className="text-[10px] font-bold uppercase">Slow Moving Stock</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">This item hasn't moved in 20 days.</p>
                        <button 
                          onClick={() => navigate('/marketing', { state: { tab: 'sms', prefill: { content: `Flash Sale! Get 20% off on ${item.name} for the next 24 hours. Use code SAVE20.` } } })}
                          className="w-full py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg"
                        >
                          Create Promo Campaign
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
                <button className="h-full min-h-[280px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center space-y-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Plus size={32} />
                  </div>
                  <p className="text-slate-500 font-bold">Add New Item</p>
                </button>
              </div>

              {/* PO Draft Modal */}
              {poDraft && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                          <ShoppingCart size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">Purchase Order Draft</h2>
                      </div>
                      <button onClick={() => setPoDraft(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="p-8">
                      <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl font-mono text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {poDraft}
                      </div>
                      <div className="mt-8 flex space-x-4">
                        <button className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2">
                          <Send size={20} />
                          <span>Send to Suppliers</span>
                        </button>
                        <button className="px-8 py-4 bg-slate-100 dark:bg-slate-700 font-bold rounded-2xl">
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Scanner Modal */}
              {isScannerOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
                      <h3 className="text-xl font-bold">Scan Barcode</h3>
                      <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="p-6">
                      <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
                      <p className="mt-4 text-center text-sm text-slate-500">Position the barcode within the frame to scan.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plm' && (
            <div className="space-y-8">
              {/* PLM Pipeline */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto">
                <div className="flex items-center justify-between min-w-[800px]">
                  {[
                    { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-amber-500' },
                    { id: 'research', label: 'Research', icon: Search, color: 'text-blue-500' },
                    { id: 'prototype', label: 'Prototype', icon: Box, color: 'text-purple-500' },
                    { id: 'launch', label: 'Launch', icon: Rocket, color: 'text-emerald-500' },
                    { id: 'mature', label: 'Mature', icon: CheckCircle2, color: 'text-slate-500' },
                    { id: 'retire', label: 'Retire', icon: Trash2, color: 'text-red-500' }
                  ].map((stage, i, arr) => (
                    <React.Fragment key={stage.id}>
                      <div className="flex flex-col items-center space-y-3 group cursor-pointer">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${stage.color} bg-slate-50 dark:bg-slate-900 group-hover:scale-110`}>
                          <stage.icon size={28} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">{stage.label}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 mx-4"></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Active Projects</h3>
                    <button 
                      onClick={() => {
                        setIsPlmModalOpen(true);
                        setPlmAnalysis(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>New Product</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plmProducts.map((product) => (
                      <div key={product.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400">
                            <Box size={24} />
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase">{product.stage}</span>
                        </div>
                        <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{product.description}</p>
                        
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200"></div>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400 font-bold">+4 contributors</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleGenerateCopy(product)}
                            className="py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                          >
                            Generate Copy
                          </button>
                          <button 
                            onClick={() => handleRetirementAdvice(product)}
                            className="py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            Retirement Advice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOM & Assets */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">BOM Manager</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Aluminum Frame', qty: 1, cost: '$45.00' },
                        { name: 'LED Module', qty: 4, cost: '$12.50' },
                        { name: 'Control Board', qty: 1, cost: '$28.00' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <Layers size={16} className="text-slate-400" />
                            <div>
                              <p className="text-sm font-bold">{item.name}</p>
                              <p className="text-[10px] text-slate-400">Qty: {item.qty}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{item.cost}</span>
                        </div>
                      ))}
                      <button className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 text-xs font-bold hover:border-blue-500 hover:text-blue-600 transition-all">
                        + Add Component
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Digital Asset Vault</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: 'Spec_Sheet.pdf', icon: FileText, color: 'text-red-500' },
                        { name: 'Design_3D.obj', icon: Box, color: 'text-blue-500' },
                        { name: 'Marketing_V1.png', icon: ImageIcon, color: 'text-emerald-500' },
                        { name: 'Patent_Doc.pdf', icon: FileText, color: 'text-amber-500' }
                      ].map((asset, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center space-y-2 group cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all">
                          <asset.icon size={24} className={asset.color} />
                          <span className="text-[10px] font-bold text-center truncate w-full">{asset.name}</span>
                        </div>
                      ))}
                      <button className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-400 hover:border-blue-500 hover:text-blue-600 transition-all">
                        <Upload size={20} />
                        <span className="text-[10px] font-bold">Upload</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PLM Modal */}
              {isPlmModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                          <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-bold">AI Product Incubator</h2>
                      </div>
                      <button onClick={() => setIsPlmModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1">
                      <div className="space-y-8">
                        <div>
                          <label className="block text-sm font-bold mb-4">Describe your product idea</label>
                          <textarea 
                            className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border-none rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="e.g. A smart water bottle that tracks hydration and syncs with fitness apps..."
                            onBlur={(e) => handlePlmAnalyze(e.target.value)}
                          ></textarea>
                        </div>

                        {isAnalyzing && (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-blue-600 font-bold">Gemini is strategizing your product...</p>
                          </div>
                        )}

                        {plmAnalysis && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                          >
                            <div className="space-y-6">
                              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                                <h4 className="font-bold text-emerald-600 mb-2 flex items-center space-x-2">
                                  <CheckCircle2 size={18} />
                                  <span>Market Fit Report</span>
                                </h4>
                                <p className="text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed">{plmAnalysis.marketFit}</p>
                              </div>
                              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="font-bold text-blue-600 mb-2 flex items-center space-x-2">
                                  <TrendingUp size={18} />
                                  <span>Suggested Pricing</span>
                                </h4>
                                <p className="text-2xl font-bold text-blue-600">{plmAnalysis.suggestedPricing}</p>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                                <h4 className="font-bold text-amber-600 mb-4 flex items-center space-x-2">
                                  <AlertTriangle size={18} />
                                  <span>SWOT Analysis</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Strengths</p>
                                    <ul className="text-[10px] space-y-1">
                                      {plmAnalysis.swot?.strengths?.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Weaknesses</p>
                                    <ul className="text-[10px] space-y-1">
                                      {plmAnalysis.swot?.weaknesses?.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold mb-4 flex items-center space-x-2">
                                  <Search size={18} />
                                  <span>Competitors</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {plmAnalysis.competitors?.map((c: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-[10px] font-bold">{c}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="p-8 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex space-x-4">
                      <button className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30">
                        Create Project
                      </button>
                      <button className="px-8 py-4 bg-white dark:bg-slate-800 font-bold rounded-2xl border border-slate-100 dark:border-slate-700">
                        Save Draft
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* AI Copy Modal */}
      {plmCopy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Globe size={24} />
                </div>
                <h2 className="text-2xl font-bold">Multilingual Product Copy</h2>
              </div>
              <button onClick={() => setPlmCopy(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl font-sans text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {plmCopy}
              </div>
              <div className="mt-8 flex space-x-4">
                <button className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2">
                  <Download size={20} />
                  <span>Export for Shopify</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Retirement Advice Modal */}
      {retirementAdvice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-2xl font-bold">Retirement Strategy</h2>
              </div>
              <button onClick={() => setRetirementAdvice(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl font-sans text-sm whitespace-pre-wrap border border-red-100 dark:border-red-900/20">
                {retirementAdvice}
              </div>
              <div className="mt-8 flex space-x-4">
                <button className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2">
                  <Rocket size={20} />
                  <span>Launch Flash Sale</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
