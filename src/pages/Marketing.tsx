import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  Send, 
  Plus, 
  Users, 
  Share2,
  BarChart2,
  Sparkles,
  Smartphone,
  Languages,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  QrCode as QrCodeIcon,
  Download,
  Layout,
  Type,
  List,
  Star,
  ArrowRight,
  Save,
  Trash2
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { QRCodeSVG } from 'qrcode.react';

export default function Marketing() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('sms');
  const [loading, setLoading] = useState(false);

  // SMS Marketing State
  const [smsContent, setSmsContent] = useState('');
  const [smsLanguage, setSmsLanguage] = useState('EN');
  const [isRewriting, setIsRewriting] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendStatus, setSendStatus] = useState<'idle' | 'pending' | 'delivered' | 'failed'>('idle');
  const [predictedTime, setPredictedTime] = useState<{ hour: number, reason: string } | null>(null);

  // Event Management State
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventStep, setEventStep] = useState(1);
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    type: 'Launch',
    description: '',
    ticketPrice: '0',
    inviteEmail: '',
    inviteSms: ''
  });
  const [events, setEvents] = useState<any[]>([]);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  // Survey State
  const [isBuildingSurvey, setIsBuildingSurvey] = useState(false);
  const [surveyGoal, setSurveyGoal] = useState('');
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [surveyInsights, setSurveyInsights] = useState('');

  const location = useLocation();

  useEffect(() => {
    if (location.state) {
      const { tab, prefill } = location.state as any;
      if (tab) setActiveTab(tab);
      if (prefill) {
        if (tab === 'sms' && prefill.content) setSmsContent(prefill.content);
        if (tab === 'events') {
          setEventData(prev => ({
            ...prev,
            title: prefill.title || prev.title,
            date: prefill.date || prev.date
          }));
          setIsCreatingEvent(true);
        }
        if (tab === 'surveys' && prefill.goal) setSurveyGoal(prefill.goal);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const unsubEvents = onSnapshot(query(collection(db, `organizations/${profile.orgId}/events`), orderBy('createdAt', 'desc')), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubEvents();
  }, [profile?.orgId]);

  // SMS Functions
  const handleAiRewrite = async () => {
    if (!smsContent) return;
    setIsRewriting(true);
    try {
      const rewritten = await geminiService.rewriteSMS(smsContent, smsLanguage);
      setSmsContent(rewritten);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRewriting(false);
    }
  };

  const handlePredictTime = async () => {
    // Simulating fetching last purchase date from CRM
    const mockLastPurchase = '2024-05-10';
    try {
      const result = await geminiService.predictBestSendTime(mockLastPurchase);
      setPredictedTime(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSms = () => {
    setSendStatus('pending');
    setSendProgress(0);
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSendStatus('delivered');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Event Functions
  const handleGenerateInvite = async () => {
    if (!eventData.title || !eventData.description) return;
    setIsGeneratingInvite(true);
    try {
      const invite = await geminiService.generateEventInvite(`${eventData.title}: ${eventData.description}`, eventData.type);
      setEventData(prev => ({ ...prev, inviteEmail: invite.email, inviteSms: invite.sms }));
      setEventStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!profile?.orgId) return;
    try {
      await addDoc(collection(db, `organizations/${profile.orgId}/events`), {
        ...eventData,
        orgId: profile.orgId,
        createdAt: Timestamp.now(),
        rsvpUrl: `https://bizos-ai.com/rsvp/${Math.random().toString(36).substring(7)}`
      });
      setIsCreatingEvent(false);
      setEventStep(1);
    } catch (err) {
      console.error(err);
    }
  };

  // Survey Functions
  const handleGenerateSurvey = async () => {
    if (!surveyGoal) return;
    setIsGeneratingSurvey(true);
    try {
      const flow = await geminiService.generateSurveyFlow(surveyGoal);
      setSurveyQuestions(flow);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSurvey(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Marketing</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">AI-driven campaigns, events, and conversational surveys.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'sms', icon: MessageSquare, label: 'SMS' },
            { id: 'events', icon: CalendarIcon, label: 'Events' },
            { id: 'surveys', icon: ClipboardList, label: 'Surveys' }
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
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {activeTab === 'sms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Smart Composer */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                        <MessageSquare size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Smart Composer</h3>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                      {['EN', 'HI', 'BN', 'NE', 'DE'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSmsLanguage(lang)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${smsLanguage === lang ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <textarea
                        rows={6}
                        value={smsContent}
                        onChange={(e) => setSmsContent(e.target.value)}
                        placeholder="Type your rough campaign idea here..."
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-lg"
                      ></textarea>
                      <button
                        onClick={handleAiRewrite}
                        disabled={isRewriting || !smsContent}
                        className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {isRewriting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={20} />}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Clock size={20} className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Predictive Schedule</p>
                            <p className="text-sm font-bold">{predictedTime ? `${predictedTime.hour}:00` : 'Not analyzed'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={handlePredictTime}
                          className="text-blue-600 text-xs font-bold hover:underline"
                        >
                          Analyze CRM
                        </button>
                      </div>
                      <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Users size={20} className="text-slate-400" />
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Target Segment</p>
                            <p className="text-sm font-bold">High Spenders</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-400" />
                      </div>
                    </div>

                    {sendStatus !== 'idle' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="capitalize">{sendStatus}...</span>
                          <span>{sendProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${sendProgress}%` }}
                            className="h-full bg-blue-600"
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleSendSms}
                      disabled={!smsContent || sendStatus === 'pending'}
                      className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                      <span>{sendStatus === 'delivered' ? 'Sent Successfully' : 'Launch Campaign'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="hidden lg:block">
                <div className="bg-slate-900 w-[300px] h-[600px] rounded-[3rem] border-[8px] border-slate-800 shadow-2xl mx-auto relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
                  <div className="p-6 pt-12 h-full flex flex-col">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                      <div>
                        <p className="text-white text-sm font-bold">BizOS AI</p>
                        <p className="text-slate-500 text-[10px]">Online</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      {smsContent && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-slate-800 text-white p-4 rounded-2xl rounded-tl-none text-sm max-w-[80%]"
                        >
                          {smsContent}
                        </motion.div>
                      )}
                    </div>
                    <div className="mt-auto bg-slate-800 p-3 rounded-2xl flex items-center space-x-2">
                      <div className="flex-1 h-4 bg-slate-700 rounded-full"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Event Calendar</h3>
                    <button 
                      onClick={() => setIsCreatingEvent(true)}
                      className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Create Event</span>
                    </button>
                  </div>
                  <div className="calendar-container">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                      }}
                      events={events.map(e => ({
                        title: e.title,
                        start: e.date,
                        backgroundColor: '#2563eb'
                      }))}
                      height="auto"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Smart Attendee List</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Alice Johnson', score: 98, status: 'VIP' },
                        { name: 'Bob Smith', score: 85, status: 'Regular' },
                        { name: 'Charlie Brown', score: 42, status: 'Inactive' },
                      ].map((attendee, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {attendee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{attendee.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{attendee.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-xs font-bold text-emerald-500">
                              <Sparkles size={12} className="mr-1" />
                              <span>{attendee.score}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Digital Ticket Preview</h3>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                      <QRCodeSVG value="https://bizos-ai.com/ticket/123" size={120} />
                      <p className="mt-4 font-bold text-sm">Product Launch 2024</p>
                      <p className="text-xs text-slate-500">Scan at entrance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Creator Modal */}
              <AnimatePresence>
                {isCreatingEvent && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
                    >
                      <button 
                        onClick={() => setIsCreatingEvent(false)}
                        className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"
                      >
                        <X size={24} />
                      </button>

                      <div className="flex items-center space-x-4 mb-10">
                        {[1, 2, 3].map(step => (
                          <div key={step} className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${eventStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                              {step}
                            </div>
                            {step < 3 && <div className={`w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: eventStep > step ? '100%' : '0%' }}
                                className="h-full bg-blue-600"
                              />
                            </div>}
                          </div>
                        ))}
                      </div>

                      {eventStep === 1 && (
                        <div className="space-y-6">
                          <h3 className="text-2xl font-bold">Event Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-sm font-bold mb-2">Event Title</label>
                              <input
                                type="text"
                                value={eventData.title}
                                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Summer Product Launch"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2">Date</label>
                              <input
                                type="date"
                                value={eventData.date}
                                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2">Type</label>
                              <select
                                value={eventData.type}
                                onChange={(e) => setEventData({ ...eventData, type: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option>Launch</option>
                                <option>Sale</option>
                                <option>Webinar</option>
                                <option>Workshop</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-bold mb-2">Description</label>
                              <textarea
                                rows={3}
                                value={eventData.description}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="What is this event about?"
                              ></textarea>
                            </div>
                          </div>
                          <button 
                            onClick={() => setEventStep(2)}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
                          >
                            <span>Next: Ticketing</span>
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}

                      {eventStep === 2 && (
                        <div className="space-y-6">
                          <h3 className="text-2xl font-bold">Ticketing & RSVP</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold mb-2">Ticket Price ($)</label>
                              <input
                                type="number"
                                value={eventData.ticketPrice}
                                onChange={(e) => setEventData({ ...eventData, ticketPrice: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center space-x-3 mb-2">
                                <Sparkles size={20} className="text-blue-600" />
                                <p className="font-bold text-blue-800 dark:text-blue-400">AI RSVP Landing Page</p>
                              </div>
                              <p className="text-sm text-slate-500">We'll automatically generate a unique landing page for this event with AI-optimized copy.</p>
                            </div>
                          </div>
                          <div className="flex space-x-4">
                            <button 
                              onClick={() => setEventStep(1)}
                              className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 font-bold rounded-2xl flex items-center justify-center space-x-2"
                            >
                              <ChevronLeft size={18} />
                              <span>Back</span>
                            </button>
                            <button 
                              onClick={handleGenerateInvite}
                              disabled={isGeneratingInvite}
                              className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                              {isGeneratingInvite ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={18} />}
                              <span>Generate AI Invites</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {eventStep === 3 && (
                        <div className="space-y-6">
                          <h3 className="text-2xl font-bold">AI Invite Design</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold mb-2">Email Invite Copy</label>
                              <textarea
                                rows={4}
                                value={eventData.inviteEmail}
                                onChange={(e) => setEventData({ ...eventData, inviteEmail: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                              ></textarea>
                            </div>
                            <div>
                              <label className="block text-sm font-bold mb-2">SMS Invite Copy</label>
                              <textarea
                                rows={2}
                                value={eventData.inviteSms}
                                onChange={(e) => setEventData({ ...eventData, inviteSms: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                              ></textarea>
                            </div>
                          </div>
                          <div className="flex space-x-4">
                            <button 
                              onClick={() => setEventStep(2)}
                              className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 font-bold rounded-2xl flex items-center justify-center space-x-2"
                            >
                              <ChevronLeft size={18} />
                              <span>Back</span>
                            </button>
                            <button 
                              onClick={handleSaveEvent}
                              className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2"
                            >
                              <CheckCircle2 size={18} />
                              <span>Publish Event</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'surveys' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Survey Builder */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                      <ClipboardList size={24} />
                    </div>
                    <h3 className="text-xl font-bold">Survey Architect</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">What is your goal?</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={surveyGoal}
                        onChange={(e) => setSurveyGoal(e.target.value)}
                        placeholder="e.g. I want to know why people leave my site"
                        className="w-full pl-6 pr-16 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button 
                        onClick={handleGenerateSurvey}
                        disabled={isGeneratingSurvey || !surveyGoal}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all disabled:opacity-50"
                      >
                        {isGeneratingSurvey ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {surveyQuestions.length > 0 ? (
                      surveyQuestions.map((q, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-purple-500">Question {i + 1} • {q.type}</span>
                            <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-bold">{q.question}</p>
                          {q.options && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {q.options.map((opt: string, j: number) => (
                                <span key={j} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded-md border dark:border-slate-700">{opt}</span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-48 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                        <Layout size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">AI will architect your survey flow here</p>
                      </div>
                    )}
                  </div>

                  <button className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center space-x-2 hover:bg-purple-700 transition-all">
                    <Share2 size={20} />
                    <span>Publish Conversational Survey</span>
                  </button>
                </div>
              </div>

              {/* Insight Engine */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Insight Engine</h3>
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <BarChart2 size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center space-x-3 mb-4">
                        <Sparkles size={20} className="text-emerald-600" />
                        <p className="font-bold text-emerald-800 dark:text-emerald-400">Key Takeaways</p>
                      </div>
                      <ul className="space-y-3">
                        {[
                          '72% of users find the pricing page confusing.',
                          'Mobile users are dropping off at the checkout step.',
                          'Most requested feature is dark mode support.'
                        ].map((insight, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Responses</h4>
                      {[
                        { user: 'Anonymous', answer: 'The site is a bit slow on my phone.', time: '2m ago' },
                        { user: 'John D.', answer: 'Love the new AI features!', time: '1h ago' },
                      ].map((resp, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{resp.user}</span>
                            <span className="text-[10px] text-slate-400">{resp.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 italic">"{resp.answer}"</p>
                        </div>
                      ))}
                    </div>

                    <button className="w-full py-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center space-x-2">
                      <Download size={16} />
                      <span>Export to CSV</span>
                    </button>
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
