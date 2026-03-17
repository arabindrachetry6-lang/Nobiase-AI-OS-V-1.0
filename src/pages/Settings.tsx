import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Globe, 
  Bell, 
  Key, 
  Cloud,
  Plus,
  Trash2,
  Briefcase,
  Mail,
  UserPlus,
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

interface Invite {
  id: string;
  email: string;
  role: 'Manager' | 'Staff';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

interface TeamMember {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
}

export default function Settings() {
  const { profile: authProfile, isOwner, isManager } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [newApiKey, setNewApiKey] = useState({ name: '', value: '' });
  
  // Team state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Staff'>('Staff');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
    }
  }, [authProfile]);

  useEffect(() => {
    if (!authProfile?.orgId) return;

    // Fetch Team Members
    const unsubMembers = onSnapshot(
      query(collection(db, 'users'), where('orgId', '==', authProfile.orgId)),
      (snap) => {
        setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)));
      }
    );

    // Fetch Pending Invites
    const unsubInvites = onSnapshot(
      query(collection(db, `organizations/${authProfile.orgId}/invites`), where('status', '==', 'pending')),
      (snap) => {
        setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invite)));
      }
    );

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [authProfile?.orgId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.currentUser && profile) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { 
        displayName: profile.displayName,
        businessName: profile.businessName
      });
      alert('Profile updated successfully!');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authProfile?.orgId || !inviteEmail) return;
    
    setIsSendingInvite(true);
    try {
      await addDoc(collection(db, `organizations/${authProfile.orgId}/invites`), {
        email: inviteEmail,
        role: inviteRole,
        orgId: authProfile.orgId,
        orgName: authProfile.businessName,
        invitedBy: authProfile.displayName,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setInviteEmail('');
      alert(`Invite sent to ${inviteEmail}. In a real app, an email would be sent via Cloud Functions.`);
    } catch (err) {
      console.error(err);
      alert('Failed to send invite.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!authProfile?.orgId) return;
    try {
      await deleteDoc(doc(db, `organizations/${authProfile.orgId}/invites`, inviteId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddApiKey = async () => {
    if (auth.currentUser && profile && newApiKey.name && newApiKey.value) {
      const updatedKeys = { ...(profile.apiKeys || {}), [newApiKey.name]: newApiKey.value };
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { apiKeys: updatedKeys });
      setProfile({ ...profile, apiKeys: updatedKeys });
      setNewApiKey({ name: '', value: '' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your account, team, and integrations.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'team', label: 'Team', icon: UserPlus },
            { id: 'business', label: 'Business', icon: Briefcase },
            { id: 'integrations', label: 'Integrations', icon: Cloud },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              <tab.icon size={20} className="shrink-0" />
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm min-w-0">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
              <h3 className="text-xl font-bold mb-6">Profile Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profile?.displayName || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, displayName: e.target.value } : null)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Business Name</label>
                <input
                  type="text"
                  value={profile?.businessName || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, businessName: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
              >
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'team' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold">Team Management</h3>
                {isOwner && (
                  <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                    <ShieldCheck size={14} />
                    <span>Owner Access</span>
                  </div>
                )}
              </div>

              {isOwner ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold mb-4 flex items-center space-x-2">
                    <Mail size={18} className="text-blue-600" />
                    <span>Invite Team Member</span>
                  </h4>
                  <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    >
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isSendingInvite}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {isSendingInvite ? 'Sending...' : 'Send Invite'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl text-sm flex items-center space-x-2">
                  <Shield size={16} />
                  <span>Only the organization Owner can invite new members.</span>
                </div>
              )}

              <div className="space-y-6">
                <h4 className="font-bold">Active Members</h4>
                <div className="grid grid-cols-1 gap-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.displayName?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{member.displayName}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === 'Owner' ? 'bg-purple-100 text-purple-600' :
                          member.role === 'Manager' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.role}
                        </span>
                        {isOwner && member.role !== 'Owner' && (
                          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {invites.length > 0 && (
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Pending Invites</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Mail size={18} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{invite.email}</p>
                            <p className="text-xs text-slate-400">Invited as {invite.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-amber-500 uppercase">Pending</span>
                          {isOwner && (
                            <button 
                              onClick={() => handleCancelInvite(invite.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-6">API Integrations</h3>
              <p className="text-slate-500 mb-8 text-sm sm:text-base">Connect your external tools by providing their API keys. These keys are stored securely in your private profile.</p>
              
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                      <img src="https://picsum.photos/seed/zapier/100" alt="Zapier" className="w-8 h-8 rounded" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="font-bold">Zapier</h4>
                      <p className="text-xs text-slate-500">Automate workflows between BizOS and 5000+ apps.</p>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30">
                    Connect
                  </button>
                </div>

                {profile?.apiKeys && Object.entries(profile.apiKeys).map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl gap-4">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0">
                        <Key size={20} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{name}</p>
                        <p className="text-xs text-slate-500">••••••••••••••••</p>
                      </div>
                    </div>
                    <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl space-y-4">
                <h4 className="font-bold">Add New Integration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Service Name (e.g., Zapier)"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="API Key"
                    value={newApiKey.value}
                    onChange={(e) => setNewApiKey({ ...newApiKey, value: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleAddApiKey}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Connect Service</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
