import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { Organization, UserProfile } from '../types';

interface OnboardingWizardProps {
  user: any;
  onComplete: () => void;
}

export default function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: user.displayName || '',
    businessName: '',
    businessType: '',
    address: '',
    email: user.email || '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const orgId = `org_${Math.random().toString(36).substr(2, 9)}`;
      const orgData: Organization = {
        id: orgId,
        name: formData.businessName,
        type: formData.businessType,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      };

      // Create Organization
      await setDoc(doc(db, 'organizations', orgId), orgData);

      // Update User Profile
      await setDoc(doc(db, 'users', user.uid), {
        displayName: formData.fullName,
        orgId: orgId,
        businessName: formData.businessName,
        role: 'owner',
        onboardingCompleted: true
      }, { merge: true });

      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error during onboarding:", error);
      alert("Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">What's your name?</h2>
                <p className="text-slate-500 text-sm">Let's start with the basics.</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Business Name</h2>
                <p className="text-slate-500 text-sm">How should we call your workspace?</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <Briefcase size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Business Type</h2>
                <p className="text-slate-500 text-sm">What industry are you in?</p>
              </div>
            </div>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
            >
              <option value="">Select industry...</option>
              <option value="Retail">Retail</option>
              <option value="Technology">Technology</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                <MapPin size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Address</h2>
                <p className="text-slate-500 text-sm">Where is your business located?</p>
              </div>
            </div>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter business address"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm h-32 resize-none"
              autoFocus
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <Mail size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Email Address</h2>
                <p className="text-slate-500 text-sm">Business contact email.</p>
              </div>
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@business.com"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
              autoFocus
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <Phone size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Phone Number</h2>
                <p className="text-slate-400 text-xs mt-1">Last step</p>
              </div>
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-sm"
              autoFocus
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 relative z-10"
      >
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step ? 'w-8 bg-blue-600' : 
                  i < step ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 6</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[200px]"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-12">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-0 transition-all font-bold"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <button
            onClick={handleNext}
            disabled={loading || (step === 3 && !formData.businessType) || (step !== 3 && !Object.values(formData)[step-1] && step !== 1 && step !== 5)}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center space-x-2 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{step === totalSteps ? 'Complete Setup' : 'Continue'}</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
