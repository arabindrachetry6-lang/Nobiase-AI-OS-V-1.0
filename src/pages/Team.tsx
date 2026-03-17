import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  X
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Member, Invite, UserProfile } from '../types';

export default function Team() {
  const { profile, isOwner } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.orgId) return;

    // Fetch Members (from users collection where orgId matches)
    const membersQuery = query(collection(db, 'users'), where('orgId', '==', profile.orgId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Member)));
    });

    // Fetch Invites
    const invitesQuery = collection(db, `organizations/${profile.orgId}/invites`);
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      setInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite)));
    });

    return () => {
      unsubscribeMembers();
      unsubscribeInvites();
    };
  }, [profile?.orgId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId || !inviteEmail) return;

    setLoading(true);
    try {
      const inviteId = `inv_${Math.random().toString(36).substr(2, 9)}`;
      const inviteData: Invite = {
        id: inviteId,
        email: inviteEmail,
        role: inviteRole,
        orgId: profile.orgId,
        invitedBy: profile.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, `organizations/${profile.orgId}/invites`, inviteId), inviteData);
      
      // In a real app, this would trigger a Cloud Function to send an email
      console.log(`Invite sent to ${inviteEmail} for role ${inviteRole}`);
      
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('staff');
      alert(`Invite sent to ${inviteEmail}. In a real app, an email would be sent via Cloud Functions.`);
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!profile?.orgId) return;
    try {
      await deleteDoc(doc(db, `organizations/${profile.orgId}/invites`, inviteId));
    } catch (error) {
      console.error("Error canceling invite:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Team Management</h1>
          <p className="text-slate-500">Manage your workspace members and roles.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
        >
          <UserPlus size={20} />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Users size={20} className="text-blue-600" />
            <span>Active Members</span>
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {members.map((member) => (
                <div key={member.uid} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {member.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{member.displayName}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      member.role === 'owner' ? 'bg-purple-100 text-purple-600' :
                      member.role === 'manager' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {member.role}
                    </span>
                    {profile?.role === 'owner' && member.uid !== profile.uid && (
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Invites */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Clock size={20} className="text-amber-500" />
            <span>Pending Invites</span>
          </h2>
          <div className="space-y-3">
            {invites.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 text-sm italic">No pending invites</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[120px]">{invite.email}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{invite.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-bold">Invite Member</h3>
                </div>
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteRole('manager')}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        inviteRole === 'manager' 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <Shield size={20} className="mb-2" />
                      <p className="font-bold text-sm">Manager</p>
                      <p className="text-[10px] opacity-70">Full access except Finance/HRM</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('staff')}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        inviteRole === 'staff' 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                    >
                      <Users size={20} className="mb-2" />
                      <p className="font-bold text-sm">Staff</p>
                      <p className="text-[10px] opacity-70">Sales & Inventory only</p>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
