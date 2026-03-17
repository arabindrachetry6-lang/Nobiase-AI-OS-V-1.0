import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  User,
  UserPlus, 
  Briefcase, 
  IdCard, 
  Search, 
  Plus, 
  MoreVertical, 
  Sparkles, 
  Mail, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Camera,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
  Award,
  Zap,
  Megaphone
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  where
} from 'firebase/firestore';
import { geminiService } from '../services/gemini';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Cropper from 'react-easy-crop';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

// --- Types ---
interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  status: 'open' | 'closed' | 'draft';
  postedAt: string;
}

interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'hired';
  resumeUrl: string;
  fitScore: number;
  aiAnalysis?: {
    pros: string[];
    cons: string[];
    interview_questions: string[];
  };
}

interface Employee {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'on-leave' | 'terminated';
  salary: number;
  joinDate: string;
  photoURL?: string;
  performanceSummary?: string;
  retentionRisk?: 'Low' | 'Medium' | 'High';
  retentionReason?: string;
  lastPromotionDate?: string;
  leaveBalance?: number;
}

// --- Components ---

const KanbanColumn = ({ title, candidates, onMove, onSelect }: { title: string, candidates: Candidate[], onMove: (id: string, status: any) => void, onSelect: (c: Candidate) => void }) => {
  return (
    <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className="font-bold text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">{title}</h4>
        <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">{candidates.length}</span>
      </div>
      <div className="space-y-3">
        {candidates.map(cand => (
          <motion.div 
            layoutId={cand.id}
            key={cand.id} 
            onClick={() => onSelect(cand)}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-sm">{cand.name}</p>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                cand.fitScore > 80 ? 'bg-emerald-100 text-emerald-600' : 
                cand.fitScore > 50 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {cand.fitScore}% Fit
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">{cand.email}</p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800" />
                ))}
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onMove(cand.id, 'screening'); }} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function HRM() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('recruitment');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', description: '' });
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isRanking, setIsRanking] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false);
  const [isPredictingRetention, setIsPredictingRetention] = useState(false);

  const [idConfig, setIdConfig] = useState({
    employeeId: '',
    photo: '',
    motto: '',
    industry: 'Technology'
  });
  const [isGeneratingMotto, setIsGeneratingMotto] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const routeLocation = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (routeLocation.state?.tab) {
      setActiveTab(routeLocation.state.tab);
    }
    if (routeLocation.state?.prefill) {
      if (routeLocation.state.prefill.jobTitle) {
        setNewJob(prev => ({ ...prev, title: routeLocation.state.prefill.jobTitle }));
        setIsAddingJob(true);
      }
    }
  }, [routeLocation.state]);

  useEffect(() => {
    if (!profile?.orgId) return;
    const orgId = profile.orgId;

    const unsubJobs = onSnapshot(query(collection(db, `organizations/${orgId}/jobs`), orderBy('postedAt', 'desc')), (snap) => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
    });

    const unsubCandidates = onSnapshot(collection(db, `organizations/${orgId}/candidates`), (snap) => {
      setCandidates(snap.docs.map(d => ({ id: d.id, ...d.data() } as Candidate)));
    });

    const unsubEmployees = onSnapshot(query(collection(db, `organizations/${orgId}/employees`), orderBy('name')), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    });

    return () => {
      unsubJobs();
      unsubCandidates();
      unsubEmployees();
    };
  }, [profile?.orgId]);

  const handleGenerateJD = async () => {
    if (!newJob.title) return;
    setIsGeneratingJD(true);
    try {
      const jd = await geminiService.generateJobDescription(newJob.title);
      setNewJob(prev => ({ ...prev, description: jd }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingJD(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;
    try {
      await addDoc(collection(db, `organizations/${profile.orgId}/jobs`), {
        ...newJob,
        orgId: profile.orgId,
        status: 'open',
        postedAt: new Date().toISOString()
      });
      setIsAddingJob(false);
      setNewJob({ title: '', department: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRankCandidate = async (candidate: Candidate) => {
    const job = jobs.find(j => j.id === candidate.jobId);
    if (!job || !profile?.orgId) return;
    setIsRanking(true);
    try {
      const analysis = await geminiService.rankResume("Candidate Resume Content Placeholder", job.description);
      await updateDoc(doc(db, `organizations/${profile.orgId}/candidates`, candidate.id), {
        fitScore: analysis.fit_score,
        aiAnalysis: {
          pros: analysis.pros,
          cons: analysis.cons,
          interview_questions: analysis.interview_questions
        }
      });
      setSelectedCandidate(prev => prev ? { ...prev, fitScore: analysis.fit_score, aiAnalysis: analysis } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRanking(false);
    }
  };

  const handleMoveCandidate = async (id: string, newStatus: Candidate['status']) => {
    if (!profile?.orgId) return;
    await updateDoc(doc(db, `organizations/${profile.orgId}/candidates`, id), { status: newStatus });
  };

  const handleAnalyzePerformance = async (employee: Employee) => {
    if (!profile?.orgId) return;
    setIsAnalyzingPerformance(true);
    try {
      const notes = ["Exceeded sales targets by 20%", "Strong team player", "Needs to improve technical documentation"];
      const result = await geminiService.synthesizePerformance(notes);
      await updateDoc(doc(db, `organizations/${profile.orgId}/employees`, employee.id), {
        performanceSummary: result.summary,
        growthPlan: result.growthPlan
      });
      setSelectedEmployee(prev => prev ? { ...prev, performanceSummary: result.summary } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingPerformance(false);
    }
  };

  const handlePredictRetention = async (employee: Employee) => {
    if (!profile?.orgId) return;
    setIsPredictingRetention(true);
    try {
      const result = await geminiService.predictRetention(employee);
      await updateDoc(doc(db, `organizations/${profile.orgId}/employees`, employee.id), {
        retentionRisk: result.riskLevel,
        retentionReason: result.reason
      });
      setSelectedEmployee(prev => prev ? { ...prev, retentionRisk: result.riskLevel as any, retentionReason: result.reason } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredictingRetention(false);
    }
  };

  const handleGenerateMotto = async () => {
    setIsGeneratingMotto(true);
    try {
      const motto = await geminiService.generateCompanyMotto(idConfig.industry);
      setIdConfig(prev => ({ ...prev, motto }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMotto(false);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const downloadID = async () => {
    if (idCardRef.current) {
      const canvas = await html2canvas(idCardRef.current, {
        backgroundColor: null,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `ID_Card_${idConfig.employeeId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleUpdateSalary = async (employee: Employee, newSalary: number) => {
    if (!profile?.orgId) return;
    try {
      await updateDoc(doc(db, `organizations/${profile.orgId}/employees`, employee.id), {
        salary: newSalary
      });
      
      // Log to Finance (Expenses)
      await addDoc(collection(db, `organizations/${profile.orgId}/expenses`), {
        orgId: profile.orgId,
        amount: newSalary,
        category: 'Salary',
        description: `Monthly payroll for ${employee.name} (${employee.role})`,
        date: new Date().toISOString().split('T')[0],
        employeeId: employee.id
      });
      
      setSelectedEmployee(prev => prev ? { ...prev, salary: newSalary } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedEmpData = employees.find(e => e.id === idConfig.employeeId);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">HRM</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">AI-powered recruitment, employee management, and digital IDs.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['recruitment', 'employees', 'id-maker'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Recruitment Tab */}
      {activeTab === 'recruitment' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Board */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Job Board</h3>
                <button 
                  onClick={() => setIsAddingJob(true)}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{job.title}</p>
                        <p className="text-[10px] text-slate-500">{job.department}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${job.status === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-[10px] text-slate-400">{new Date(job.postedAt).toLocaleDateString()}</p>
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => navigate('/marketing', { state: { tab: 'sms', prefill: { content: `We are hiring for ${job.title}! Join our team at BizOS.` } } })}
                          className="text-emerald-600 text-[10px] font-bold hover:underline flex items-center space-x-1"
                        >
                          <Megaphone size={10} />
                          <span>Promote</span>
                        </button>
                        <button className="text-blue-600 text-[10px] font-bold hover:underline">View Applicants</button>
                      </div>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No jobs posted yet.</p>}
              </div>
            </div>

            {/* Applicant Pipeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Applicant Pipeline</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">Recruiters Active</span>
                </div>
              </div>

              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                <KanbanColumn 
                  title="Applied" 
                  candidates={candidates.filter(c => c.status === 'applied')} 
                  onMove={handleMoveCandidate}
                  onSelect={setSelectedCandidate}
                />
                <KanbanColumn 
                  title="Screening" 
                  candidates={candidates.filter(c => c.status === 'screening')} 
                  onMove={handleMoveCandidate}
                  onSelect={setSelectedCandidate}
                />
                <KanbanColumn 
                  title="Interview" 
                  candidates={candidates.filter(c => c.status === 'interview')} 
                  onMove={handleMoveCandidate}
                  onSelect={setSelectedCandidate}
                />
                <KanbanColumn 
                  title="Offered" 
                  candidates={candidates.filter(c => c.status === 'offered')} 
                  onMove={handleMoveCandidate}
                  onSelect={setSelectedCandidate}
                />
                <KanbanColumn 
                  title="Hired" 
                  candidates={candidates.filter(c => c.status === 'hired')} 
                  onMove={handleMoveCandidate}
                  onSelect={setSelectedCandidate}
                />
              </div>
            </div>
          </div>

          {/* Candidate Detail Modal */}
          <AnimatePresence>
            {selectedCandidate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                        {selectedCandidate.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                        <p className="text-slate-500">{selectedCandidate.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold flex items-center space-x-2">
                            <FileText size={18} className="text-blue-500" />
                            <span>Resume Preview</span>
                          </h4>
                          <button className="text-blue-600 text-xs font-bold flex items-center space-x-1">
                            <Download size={14} />
                            <span>Download PDF</span>
                          </button>
                        </div>
                        <div className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 italic text-sm">
                          Resume Content Rendering...
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-80">AI Fit Score</span>
                          <Sparkles size={20} />
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-5xl font-bold">{selectedCandidate.fitScore}</span>
                          <span className="text-xl opacity-80">/100</span>
                        </div>
                        <button 
                          onClick={() => handleRankCandidate(selectedCandidate)}
                          disabled={isRanking}
                          className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold transition-all flex items-center justify-center space-x-2"
                        >
                          {isRanking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Re-Rank Resume</span>}
                        </button>
                      </div>

                      {selectedCandidate.aiAnalysis && (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs font-bold text-emerald-600 mb-2 uppercase">Pros</p>
                            <ul className="space-y-1">
                              {selectedCandidate.aiAnalysis.pros.map((p, i) => (
                                <li key={i} className="text-xs flex items-start space-x-2">
                                  <CheckCircle size={12} className="mt-0.5 shrink-0" />
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                            <p className="text-xs font-bold text-amber-600 mb-2 uppercase">Interview Questions</p>
                            <ul className="space-y-2">
                              {selectedCandidate.aiAnalysis.interview_questions.map((q, i) => (
                                <li key={i} className="text-xs italic text-slate-600 dark:text-slate-400">"{q}"</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Active Now', value: employees.filter(e => e.status === 'active').length, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: 'Retention Risk', value: employees.filter(e => e.retentionRisk === 'High').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'New Hires (30d)', value: 4, icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Directory */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Employee Directory</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search people..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {employees.map(emp => (
                    <motion.div 
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                          {emp.photoURL ? <img src={emp.photoURL} alt={emp.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{emp.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{emp.name}</p>
                          <p className="text-[10px] text-slate-500">{emp.role} • {emp.department}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                    </motion.div>
                  ))}
                  {employees.length === 0 && <p className="col-span-2 text-center text-slate-400 text-sm py-8">No employees found.</p>}
                </div>
              </div>
            </div>

            {/* Insights Panel */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-xl font-bold">People Insights</h3>
                </div>

                {selectedEmployee ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto mb-3 overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                        {selectedEmployee.photoURL ? <img src={selectedEmployee.photoURL} alt={selectedEmployee.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">{selectedEmployee.name.charAt(0)}</div>}
                      </div>
                      <h4 className="font-bold">{selectedEmployee.name}</h4>
                      <p className="text-xs text-slate-500">{selectedEmployee.role}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group relative">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Salary</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">${selectedEmployee.salary.toLocaleString()}</p>
                          <button 
                            onClick={() => {
                              const newSal = prompt('Enter new salary:', selectedEmployee.salary.toString());
                              if (newSal) handleUpdateSalary(selectedEmployee, parseFloat(newSal));
                            }}
                            className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrendingUp size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Dept</p>
                        <p className="text-sm font-bold">{selectedEmployee.department}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-blue-600 uppercase">Performance Summary</p>
                          <button onClick={() => handleAnalyzePerformance(selectedEmployee)} disabled={isAnalyzingPerformance}>
                            <Sparkles size={14} className={isAnalyzingPerformance ? "animate-spin" : ""} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {selectedEmployee.performanceSummary || "No summary generated yet. Click the sparkles to synthesize feedback."}
                        </p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        selectedEmployee.retentionRisk === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' :
                        selectedEmployee.retentionRisk === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' :
                        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-bold uppercase ${
                            selectedEmployee.retentionRisk === 'High' ? 'text-red-600' :
                            selectedEmployee.retentionRisk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>Retention Risk: {selectedEmployee.retentionRisk || 'Unknown'}</p>
                          <button onClick={() => handlePredictRetention(selectedEmployee)} disabled={isPredictingRetention}>
                            <TrendingUp size={14} className={isPredictingRetention ? "animate-spin" : ""} />
                          </button>
                        </div>
                        {selectedEmployee.retentionReason && <p className="text-[10px] text-slate-500 italic">{selectedEmployee.retentionReason}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-sm">Select an employee to view AI insights.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Maker Tab */}
      {activeTab === 'id-maker' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Designer Controls */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
            <h3 className="text-2xl font-bold">ID Card Designer</h3>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-500">Select Employee</label>
              <select 
                value={idConfig.employeeId}
                onChange={(e) => setIdConfig({ ...idConfig, employeeId: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-500">Profile Photo</label>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setIsCropping(true)}
                  className="flex-1 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all flex items-center justify-center space-x-2"
                >
                  <Camera size={20} />
                  <span>Upload & Crop</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-500">Company Motto</label>
                <button 
                  onClick={handleGenerateMotto}
                  disabled={isGeneratingMotto}
                  className="text-blue-600 text-xs font-bold flex items-center space-x-1"
                >
                  <Sparkles size={14} className={isGeneratingMotto ? "animate-spin" : ""} />
                  <span>AI Generate</span>
                </button>
              </div>
              <textarea 
                value={idConfig.motto}
                onChange={(e) => setIdConfig({ ...idConfig, motto: e.target.value })}
                placeholder="Enter company motto or mission statement..."
                className="w-full h-24 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <button 
              onClick={downloadID}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
            >
              <Download size={20} />
              <span>Download as PNG</span>
            </button>
          </div>

          {/* Live Preview */}
          <div className="sticky top-24 space-y-8">
            <h3 className="text-xl font-bold text-center">Live Preview</h3>
            
            <div className="flex flex-col items-center space-y-12">
              {/* Front Side */}
              <div 
                ref={idCardRef}
                className="w-[320px] h-[500px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col items-center"
              >
                {/* Glassmorphism Accents */}
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
                
                <div className="w-full flex justify-between items-center mb-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <Zap size={20} className="text-blue-600" />
                    </div>
                    <span className="font-black tracking-tighter text-xl">BizOS</span>
                  </div>
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Award size={24} />
                  </div>
                </div>

                <div className="w-40 h-40 rounded-full border-4 border-white/30 p-1 mb-6">
                  <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center">
                    {idConfig.photo ? <img src={idConfig.photo} alt="Profile" className="w-full h-full object-cover" /> : <User size={64} className="opacity-50" />}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">{selectedEmpData?.name || 'Employee Name'}</h2>
                  <p className="text-blue-100 font-medium uppercase tracking-[0.2em] text-[10px]">{selectedEmpData?.role || 'Job Title'}</p>
                </div>

                <div className="mt-auto w-full pt-8 border-t border-white/10 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase font-bold opacity-60">Employee ID</p>
                    <p className="text-sm font-mono">#{selectedEmpData?.id.slice(0, 8) || '00000000'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <QRCodeSVG value={`https://bizos.ai/verify/${selectedEmpData?.id}`} size={48} />
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div className="w-[320px] h-[500px] bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
                
                <div className="space-y-6 relative z-10">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">Our Mission</p>
                    <p className="text-lg font-medium leading-relaxed italic px-4">
                      "{idConfig.motto || 'Empowering the future of business through AI-driven intelligence and human creativity.'}"
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center opacity-40">
                  <div className="text-[8px] text-left">
                    <p>BizOS AI Headquarters</p>
                    <p>123 Innovation Way, Tech City</p>
                  </div>
                  <Zap size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      <AnimatePresence>
        {isAddingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Post New Job</h3>
                <button onClick={() => setIsAddingJob(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddJob} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Job Title</label>
                    <input
                      type="text"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="e.g. Senior Product Designer"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                    <input
                      type="text"
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                      placeholder="e.g. Design"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase">Job Description</label>
                    <button 
                      type="button"
                      onClick={handleGenerateJD}
                      disabled={isGeneratingJD || !newJob.title}
                      className="text-blue-600 text-xs font-bold flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Sparkles size={14} className={isGeneratingJD ? "animate-spin" : ""} />
                      <span>Gemini Autofill</span>
                    </button>
                  </div>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Describe the role..."
                    className="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                    required
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingJob(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 font-bold rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30"
                  >
                    Post Job
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Cropper Modal */}
      <AnimatePresence>
        {isCropping && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold">Crop Profile Photo</h3>
                <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <div className="relative h-96 bg-slate-900">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setIdConfig({ ...idConfig, photo: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                />
                {idConfig.photo ? (
                  <Cropper
                    image={idConfig.photo}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                    <Camera size={48} className="opacity-50" />
                    <p className="font-bold">Click to upload photo</p>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Zoom</label>
                  <input 
                    type="range" 
                    min={1} 
                    max={3} 
                    step={0.1} 
                    value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <button 
                  onClick={() => setIsCropping(false)}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
