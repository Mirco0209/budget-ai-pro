import React, { useEffect, useState } from 'react';
import { Shield, User, Search, Edit2, Trash2, Key, Calendar, RefreshCcw } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { UserSettings, PLANS, SubscriptionStatus } from '../types';

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  settings: UserSettings;
  trialDaysLeft: number;
}

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({ plan: 'base', status: 'trial' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
        const allData = storageService.admin.getAllUsersData();
        // Ensure allData is an array and filter out any potential nulls if styling breaks
        if (Array.isArray(allData)) {
            setUsers(allData as UserData[]);
        } else {
            setUsers([]);
        }
    } catch (e) {
        console.error("Failed to load users", e);
        setUsers([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    setEditForm({ 
        plan: user.settings.plan || 'base', 
        status: user.settings.subscriptionStatus || 'trial' 
    });
  };

  const saveSubscription = () => {
    if (editingUser) {
        storageService.admin.updateUserSubscription(
            editingUser.id, 
            editForm.plan, 
            editForm.status as SubscriptionStatus
        );
        setEditingUser(null);
        loadUsers();
    }
  };

  const handleResetPassword = () => {
      if (resetPasswordUser && newPassword) {
          storageService.admin.resetUserPassword(resetPasswordUser.id, newPassword);
          setResetPasswordUser(null);
          setNewPassword('');
          loadUsers(); 
          alert('Password updated successfully');
      }
  };

  const handleExtendTrial = (id: string) => {
      if(confirm('Extend this user trial by 7 days?')) {
          storageService.admin.extendTrial(id, 7);
          loadUsers();
      }
  };

  const handleDelete = (id: string) => {
      if(confirm('Are you sure you want to delete this user? This action is irreversible.')) {
          storageService.admin.deleteUser(id);
          loadUsers();
      }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-primary" />
            {t('userManagement')}
          </h2>
          <p className="text-slate-400">Total System Control</p>
        </div>
        <div className="flex space-x-4 w-full md:w-auto items-center">
            <div className="flex-1 md:flex-none bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-slate-500 uppercase">{t('totalUsers')}</p>
                <p className="font-bold text-white text-lg">{users.length}</p>
            </div>
            <div className="flex-1 md:flex-none bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
                <p className="text-xs text-slate-500 uppercase">{t('activeSubs')}</p>
                <p className="font-bold text-green-400 text-lg">
                    {users.filter(u => u.settings?.subscriptionStatus === 'active').length}
                </p>
            </div>
            <button onClick={loadUsers} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                <RefreshCcw size={18} className="text-slate-400" />
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
        <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary placeholder-slate-600"
        />
      </div>

      {/* Loading State */}
      {isLoading && <div className="text-center py-10 text-slate-500">Loading users...</div>}

      {/* Desktop Table View */}
      {!isLoading && (
        <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 border-b border-slate-800">User</th>
                <th className="p-4 border-b border-slate-800">{t('plan')}</th>
                <th className="p-4 border-b border-slate-800">{t('status')}</th>
                <th className="p-4 border-b border-slate-800">{t('joined')}</th>
                <th className="p-4 border-b border-slate-800 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                     <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                            <User size={14} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="p-4">
                      <span className="text-sm text-slate-300 capitalize">
                          {user.settings?.plan || 'base'}
                      </span>
                  </td>
                  <td className="p-4">
                     {user.settings?.subscriptionStatus === 'active' ? (
                         <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">
                             Active
                         </span>
                     ) : user.settings?.subscriptionStatus === 'trial' ? (
                         <div className="flex flex-col">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium w-fit">
                                Trial
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1">{user.trialDaysLeft} days left</span>
                         </div>
                     ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                             Expired
                         </span>
                     )}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-mono">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4 text-right">
                      <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleExtendTrial(user.id)}
                            title={t('extendTrial')}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg transition-colors"
                          >
                             <Calendar size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(user)}
                            title={t('editSubscription')}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setResetPasswordUser(user)}
                            title={t('resetPassword')}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          >
                             <Key size={16} />
                          </button>
                          <button 
                             onClick={() => handleDelete(user.id)}
                             title={t('deleteUser')}
                             className="p-2 bg-slate-800 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                          >
                             <Trash2 size={16} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && (
        <div className="md:hidden space-y-4">
         {filteredUsers.map(user => (
             <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                 <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                             <User size={18} className="text-slate-400" />
                         </div>
                         <div>
                             <p className="font-bold text-white text-sm">{user.name}</p>
                             <p className="text-xs text-slate-500">{user.email}</p>
                         </div>
                     </div>
                     <span className={`text-xs px-2 py-1 rounded font-bold capitalize ${
                         user.settings?.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-400' : 
                         user.settings?.subscriptionStatus === 'trial' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                     }`}>
                         {user.settings?.subscriptionStatus || 'trial'}
                     </span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                     <div>
                         <span className="block text-slate-600 uppercase text-[10px]">Plan</span>
                         <span className="capitalize text-white">{user.settings?.plan || 'base'}</span>
                     </div>
                     <div>
                         <span className="block text-slate-600 uppercase text-[10px]">Joined</span>
                         <span className="text-white">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
                     </div>
                 </div>

                 <div className="flex justify-between items-center pt-2 gap-2">
                      <button 
                        onClick={() => handleExtendTrial(user.id)}
                        className="flex-1 py-3 bg-slate-800 text-yellow-400 rounded-lg text-xs font-bold flex justify-center items-center active:scale-95 transition-transform"
                      >
                         <Calendar size={14} className="mr-1" />
                         +7 Days
                      </button>
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="flex-1 py-3 bg-slate-800 text-blue-400 rounded-lg text-xs font-bold flex justify-center items-center active:scale-95 transition-transform"
                      >
                         <Edit2 size={14} className="mr-1" />
                         Edit
                      </button>
                      <button 
                         onClick={() => handleDelete(user.id)}
                         className="flex-1 py-3 bg-slate-800 text-red-400 rounded-lg text-xs font-bold flex justify-center items-center active:scale-95 transition-transform"
                      >
                         <Trash2 size={14} className="mr-1" />
                         Del
                      </button>
                 </div>
             </div>
         ))}
         {filteredUsers.length === 0 && <p className="text-center text-slate-500">No users found.</p>}
      </div>
      )}

      {/* Edit Subscription Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">{t('editSubscription')}</h3>
                <p className="text-sm text-slate-400 mb-6">Editing for <span className="text-white">{editingUser.email}</span></p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('plan')}</label>
                        <select 
                            value={editForm.plan}
                            onChange={e => setEditForm({...editForm, plan: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-primary outline-none"
                        >
                            {Object.keys(PLANS).map(p => <option key={p} value={p}>{PLANS[p as keyof typeof PLANS].name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">{t('status')}</label>
                        <select 
                            value={editForm.status}
                            onChange={e => setEditForm({...editForm, status: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-primary outline-none"
                        >
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                </div>

                <div className="flex space-x-3 mt-8">
                    <button onClick={() => setEditingUser(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">{t('cancel')}</button>
                    <button onClick={saveSubscription} className="flex-1 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg">{t('update')}</button>
                </div>
            </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">{t('resetPassword')}</h3>
                <p className="text-sm text-slate-400 mb-6">User: <span className="text-white">{resetPasswordUser.email}</span></p>
                
                <div className="mb-6">
                    <label className="block text-xs text-slate-400 mb-1">{t('newPassword')}</label>
                    <input 
                        type="text" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white focus:border-primary outline-none"
                        placeholder="Type new password"
                    />
                </div>

                <div className="flex space-x-3">
                    <button onClick={() => setResetPasswordUser(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">{t('cancel')}</button>
                    <button onClick={handleResetPassword} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg">{t('update')}</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Admin;